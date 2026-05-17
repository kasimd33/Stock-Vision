"""
StockService — fast yfinance wrapper:
  - fast_info primary (no blocking .info call on hot path)
  - .info fetched with 4s thread timeout for fundamentals
  - reduced retries (2) and backoff (0.5s) for faster failure
  - longer cache TTLs: quote=120s, history=600s
  - NSE → BSE fallback
"""

import time
import threading
import yfinance as yf
from utils.logger import get_logger
from utils.symbol import normalize

log = get_logger('StockService')

# ── TTL cache ─────────────────────────────────────────────────────────────────
_cache: dict = {}
_cache_lock = threading.Lock()

def _cache_get(key: str):
    with _cache_lock:
        entry = _cache.get(key)
        if entry and time.time() < entry['expires']:
            return entry['value']
    return None

def _cache_set(key: str, value, ttl: int):
    with _cache_lock:
        _cache[key] = {'value': value, 'expires': time.time() + ttl}

# ── Retry helper — 2 attempts, 0.5s base backoff ─────────────────────────────
def _retry(fn, retries=2, backoff=0.5):
    last_err = None
    for attempt in range(retries):
        try:
            return fn()
        except Exception as e:
            last_err = e
            if attempt < retries - 1:
                sleep_time = backoff * (2 ** attempt)
                log.warning(f'Attempt {attempt+1} failed: {e}. Retry in {sleep_time:.1f}s')
                time.sleep(sleep_time)
    raise last_err

# ── Fetch .info with hard 4s timeout ─────────────────────────────────────────
def _fetch_info_timed(ticker, timeout=4) -> dict:
    result = {}
    def _work():
        try:
            result['v'] = ticker.info or {}
        except Exception:
            pass
    t = threading.Thread(target=_work, daemon=True)
    t.start()
    t.join(timeout=timeout)
    return result.get('v', {})

# ── Core fetch ────────────────────────────────────────────────────────────────
def _fetch_ticker_data(symbol: str) -> dict:
    resolved = normalize(symbol)
    ticker = yf.Ticker(resolved)

    # Fast path: fast_info (instant) + .info with 4s cap
    try:
        fi = ticker.fast_info
        price = getattr(fi, 'last_price', None) or getattr(fi, 'regular_market_price', None)
        prev_close = getattr(fi, 'previous_close', None) or getattr(fi, 'regular_market_previous_close', None)
        currency = getattr(fi, 'currency', 'INR')

        if price and price > 0:
            info = _fetch_info_timed(ticker, timeout=4)
            return _build_response(resolved, price, prev_close, currency, fi, info)
    except Exception as e:
        log.warning(f'fast_info failed for {resolved}: {e}')

    # Fallback: .info directly
    try:
        info = _fetch_info_timed(ticker, timeout=6)
        price = info.get('currentPrice') or info.get('regularMarketPrice')
        prev_close = info.get('previousClose') or info.get('regularMarketPreviousClose')
        currency = info.get('currency', 'INR')
        if price and price > 0:
            return _build_response(resolved, price, prev_close, currency, None, info)
    except Exception as e:
        log.warning(f'.info fallback failed for {resolved}: {e}')

    # BSE fallback
    if resolved.endswith('.NS'):
        bse_sym = resolved.replace('.NS', '.BO')
        try:
            t2 = yf.Ticker(bse_sym)
            fi2 = t2.fast_info
            price = getattr(fi2, 'last_price', None) or getattr(fi2, 'regular_market_price', None)
            prev_close = getattr(fi2, 'previous_close', None)
            currency = getattr(fi2, 'currency', 'INR')
            if price and price > 0:
                info2 = _fetch_info_timed(t2, timeout=3)
                return _build_response(bse_sym, price, prev_close, currency, fi2, info2)
        except Exception as e:
            log.warning(f'BSE fallback failed for {bse_sym}: {e}')

    raise ValueError(f'No price data found for symbol: {symbol}. Check if the symbol is valid on NSE/BSE.')

def _build_response(symbol: str, price, prev_close, currency, fi, info: dict) -> dict:
    prev_close = prev_close or price
    change = price - prev_close
    change_pct = (change / prev_close * 100) if prev_close else 0

    exch_raw = info.get('exchange', '') or ''
    if 'NSI' in exch_raw or exch_raw in ('NSE', 'NMS'):
        exchange = 'NSE'
    elif 'BSE' in exch_raw or symbol.endswith('.BO'):
        exchange = 'BSE'
    elif symbol.startswith('^'):
        exchange = 'INDEX'
    else:
        exchange = 'NSE'

    return {
        'symbol': symbol,
        'name': info.get('longName') or info.get('shortName') or symbol.replace('.NS','').replace('.BO',''),
        'exchange': exchange,
        'currency': currency,
        'is_inr': currency == 'INR',
        'current_price': round(float(price), 2),
        'previous_close': round(float(prev_close), 2),
        'change': round(float(change), 2),
        'change_pct': round(float(change_pct), 4),
        'market_status': _market_status(),
        'day_high': _safe(info.get('dayHigh') or getattr(fi, 'day_high', None)),
        'day_low': _safe(info.get('dayLow') or getattr(fi, 'day_low', None)),
        'week_52_high': _safe(info.get('fiftyTwoWeekHigh') or getattr(fi, 'year_high', None)),
        'week_52_low': _safe(info.get('fiftyTwoWeekLow') or getattr(fi, 'year_low', None)),
        'volume': int(info.get('volume') or getattr(fi, 'last_volume', 0) or 0),
        'market_cap': _safe(info.get('marketCap')),
        'pe_ratio': _safe(info.get('trailingPE')),
        'eps': _safe(info.get('trailingEps')),
        'dividend_yield': _safe(info.get('dividendYield')),
        'beta': _safe(info.get('beta')),
        'sector': info.get('sector') or '',
        'industry': info.get('industry') or '',
    }

def _safe(val):
    try:
        if val is None:
            return None
        f = float(val)
        return round(f, 4) if f == f else None
    except Exception:
        return None

def _market_status() -> str:
    import datetime, pytz
    ist = pytz.timezone('Asia/Kolkata')
    now = datetime.datetime.now(ist)
    if now.weekday() >= 5:
        return 'CLOSED'
    t = now.hour * 60 + now.minute
    if 555 <= t < 930:
        return 'OPEN'
    if 540 <= t < 555:
        return 'PRE_OPEN'
    return 'CLOSED'

# ── History fetch ─────────────────────────────────────────────────────────────
def _fetch_history(symbol: str, period: str = '90d') -> list:
    resolved = normalize(symbol)
    ticker = yf.Ticker(resolved)
    hist = ticker.history(period=period)

    if hist.empty and resolved.endswith('.NS'):
        hist = yf.Ticker(resolved.replace('.NS', '.BO')).history(period=period)

    if hist.empty:
        raise ValueError(f'No historical data for {symbol}')

    return [
        {
            'date': str(d.date()),
            'close': round(float(row['Close']), 2),
            'open': round(float(row['Open']), 2),
            'high': round(float(row['High']), 2),
            'low': round(float(row['Low']), 2),
            'volume': int(row['Volume']),
        }
        for d, row in hist.iterrows()
    ]

# ── Public API ────────────────────────────────────────────────────────────────
def get_quote(symbol: str) -> dict:
    key = f'quote:{symbol.upper()}'
    cached = _cache_get(key)
    if cached:
        return cached
    data = _retry(lambda: _fetch_ticker_data(symbol))
    _cache_set(key, data, ttl=120)   # 2 min cache
    return data

def get_history(symbol: str, period: str = '90d') -> list:
    key = f'hist:{symbol.upper()}:{period}'
    cached = _cache_get(key)
    if cached:
        return cached
    data = _retry(lambda: _fetch_history(symbol, period))
    _cache_set(key, data, ttl=600)   # 10 min cache
    return data

def get_indices() -> list:
    key = 'indices'
    cached = _cache_get(key)
    if cached:
        return cached

    INDICES = [
        ('^NSEI',    'NIFTY 50',   'NIFTY'),
        ('^BSESN',   'SENSEX',     'SENSEX'),
        ('^NSEBANK', 'BANK NIFTY', 'BANKNIFTY'),
        ('^CNXIT',   'NIFTY IT',   'NIFTY IT'),
    ]
    result = []
    for sym, name, short in INDICES:
        try:
            q = get_quote(sym)
            result.append({
                'symbol': sym, 'name': name, 'short': short,
                'price': q['current_price'],
                'change': q['change'],
                'change_pct': round(q['change_pct'], 2),
            })
        except Exception as e:
            log.error(f'Index fetch failed for {sym}: {e}')
            result.append({'symbol': sym, 'name': name, 'short': short, 'price': 0, 'change': 0, 'change_pct': 0})

    _cache_set(key, result, ttl=60)
    return result

def classify_error(e: Exception) -> tuple:
    msg = str(e).lower()
    if 'empty' in msg or 'no price' in msg or 'no data' in msg:
        return 404, 'No data found for this symbol. Please verify it is a valid NSE/BSE ticker.'
    if 'not found' in msg or 'invalid' in msg or 'check if' in msg:
        return 404, str(e)
    if 'timeout' in msg or 'timed out' in msg:
        return 503, 'Request timed out. Please try again.'
    if 'rate' in msg or '429' in msg:
        return 429, 'Too many requests. Please wait a moment.'
    if 'connection' in msg or 'network' in msg:
        return 503, 'Network error. Please try again.'
    return 500, f'Market data temporarily unavailable: {str(e)}'
