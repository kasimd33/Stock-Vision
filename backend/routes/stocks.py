from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from concurrent.futures import ThreadPoolExecutor
from models.db import watchlist_col
from services.stock_service import get_quote, get_history, get_indices, classify_error
from ml.predictor import predict_stock
from ml.sentiment import analyze_sentiment
from utils.logger import get_logger
from utils.json_encoder import safe
import pandas as pd

log = get_logger('routes.stocks')
stocks_bp = Blueprint('stocks', __name__)

# ── Standardized response helpers ────────────────────────────────────────────
def ok(data: dict):
    return jsonify(safe({'success': True, **data}))

def err(status: int, message: str):
    log.error(f'[{status}] {message}')
    return jsonify({'success': False, 'error': message}), status

def _safe_sentiment(clean_sym):
    try:
        return analyze_sentiment(clean_sym, clean_sym)
    except Exception:
        return {'label': 'neutral', 'score': 0.0, 'articles_analyzed': 0}, []

# ── Stock analysis (full) — parallel fetch ────────────────────────────────────
@stocks_bp.route('/analyze/<path:symbol>', methods=['GET'])
@jwt_required()
def analyze(symbol):
    try:
        clean_sym = symbol.replace('.NS', '').replace('.BO', '')

        # Fetch quote, history, sentiment all at once
        with ThreadPoolExecutor(max_workers=3) as ex:
            f_quote   = ex.submit(get_quote, symbol)
            f_history = ex.submit(get_history, symbol, '90d')
            f_sent    = ex.submit(_safe_sentiment, clean_sym)

        quote        = f_quote.result()
        history_data = f_history.result()
        sentiment_result, news = f_sent.result()

        hist_df = pd.DataFrame(history_data)
        hist_df['Close'] = hist_df['close']
        prediction = predict_stock(hist_df, quote['current_price'], symbol)

        recommendation = build_recommendation(prediction, sentiment_result, quote)

        return ok({
            'info': quote,
            'history': history_data,
            'prediction': prediction,
            'sentiment': sentiment_result,
            'recommendation': recommendation,
            'news': news,
        })
    except Exception as e:
        status, message = classify_error(e)
        return err(status, message)

# ── Fast quote (price only, for polling) ─────────────────────────────────────
@stocks_bp.route('/quote/<path:symbol>', methods=['GET'])
@jwt_required()
def quote(symbol):
    try:
        data = get_quote(symbol)
        return ok({'quote': data})
    except Exception as e:
        status, message = classify_error(e)
        return err(status, message)

# ── Price history ─────────────────────────────────────────────────────────────
@stocks_bp.route('/history/<path:symbol>', methods=['GET'])
@jwt_required()
def history(symbol):
    period = request.args.get('period', '90d')
    valid_periods = {'1d','5d','1mo','3mo','6mo','1y','2y','5y','90d'}
    if period not in valid_periods:
        return err(400, f'Invalid period. Use one of: {", ".join(valid_periods)}')
    try:
        data = get_history(symbol, period)
        return ok({'symbol': symbol, 'period': period, 'history': data})
    except Exception as e:
        status, message = classify_error(e)
        return err(status, message)

# ── Indices ───────────────────────────────────────────────────────────────────
@stocks_bp.route('/indices', methods=['GET'])
def indices():
    try:
        data = get_indices()
        return ok({'indices': data})
    except Exception as e:
        status, message = classify_error(e)
        return err(status, message)

# ── Gainers / Losers (static curated list with live prices) ──────────────────
NIFTY50_SYMBOLS = [
    'RELIANCE.NS','TCS.NS','HDFCBANK.NS','INFY.NS','ICICIBANK.NS',
    'WIPRO.NS','SBIN.NS','BAJFINANCE.NS','BSE.NS','ADANIENT.NS',
    'SUNPHARMA.NS','HINDUNILVR.NS','ITC.NS','MARUTI.NS','NTPC.NS',
    'AXISBANK.NS','HCLTECH.NS','TECHM.NS','COALINDIA.NS','ONGC.NS',
]

@stocks_bp.route('/gainers', methods=['GET'])
@jwt_required()
def gainers():
    return _movers(top=True)

@stocks_bp.route('/losers', methods=['GET'])
@jwt_required()
def losers():
    return _movers(top=False)

def _movers(top: bool):
    try:
        results = []
        for sym in NIFTY50_SYMBOLS[:12]:
            try:
                q = get_quote(sym)
                results.append({
                    'symbol': sym,
                    'name': q['name'],
                    'price': q['current_price'],
                    'change_pct': round(q['change_pct'], 2),
                    'change': q['change'],
                })
            except Exception as e:
                log.warning(f'Skipping {sym} in movers: {e}')

        results.sort(key=lambda x: x['change_pct'], reverse=top)
        return ok({'stocks': results[:5]})
    except Exception as e:
        status, message = classify_error(e)
        return err(status, message)

# ── Watchlist ─────────────────────────────────────────────────────────────────
@stocks_bp.route('/watchlist', methods=['GET'])
@jwt_required()
def get_watchlist():
    user_id = get_jwt_identity()
    doc = watchlist_col.find_one({'user_id': user_id})
    return ok({'symbols': doc.get('symbols', []) if doc else []})

@stocks_bp.route('/watchlist', methods=['POST'])
@jwt_required()
def add_watchlist():
    user_id = get_jwt_identity()
    symbol = request.json.get('symbol', '').upper()
    if not symbol:
        return err(400, 'Symbol is required')
    watchlist_col.update_one(
        {'user_id': user_id},
        {'$addToSet': {'symbols': symbol}},
        upsert=True
    )
    return ok({'message': f'{symbol} added to watchlist'})

@stocks_bp.route('/watchlist', methods=['DELETE'])
@jwt_required()
def remove_watchlist():
    user_id = get_jwt_identity()
    symbol = request.json.get('symbol', '').upper()
    watchlist_col.update_one({'user_id': user_id}, {'$pull': {'symbols': symbol}})
    return ok({'message': f'{symbol} removed from watchlist'})

# ── Dedicated AI Prediction endpoint — parallel fetch ────────────────────────
@stocks_bp.route('/predict/<path:symbol>', methods=['GET'])
@jwt_required()
def predict(symbol):
    try:
        clean_sym = symbol.replace('.NS', '').replace('.BO', '')

        with ThreadPoolExecutor(max_workers=3) as ex:
            f_quote   = ex.submit(get_quote, symbol)
            f_history = ex.submit(get_history, symbol, '90d')
            f_sent    = ex.submit(_safe_sentiment, clean_sym)

        quote        = f_quote.result()
        history_data = f_history.result()
        sentiment_result, news = f_sent.result()

        hist_df = pd.DataFrame(history_data)
        hist_df['Close'] = hist_df['close']
        prediction = predict_stock(hist_df, quote['current_price'], symbol)

        recommendation = build_recommendation(prediction, sentiment_result, quote)

        return ok({
            'info': quote,
            'history': history_data,
            'prediction': prediction,
            'sentiment': sentiment_result,
            'recommendation': recommendation,
            'news': news[:5],
        })
    except Exception as e:
        status, message = classify_error(e)
        return err(status, message)


# ── Recommendation engine ─────────────────────────────────────────────────────
def build_recommendation(prediction, sentiment, info):
    score = 0
    reasons = []
    tech = prediction.get('technical', {}) if prediction else {}

    # ── Price prediction signal ──
    change = prediction.get('change_pct', 0) if prediction else 0
    if change > 2.5:   score += 3; reasons.append(f'AI predicts strong +{change:.1f}% price surge')
    elif change > 1.0: score += 2; reasons.append(f'AI predicts +{change:.1f}% price increase')
    elif change > 0:   score += 1; reasons.append(f'AI predicts slight gain of +{change:.1f}%')
    elif change < -2.5: score -= 3; reasons.append(f'AI predicts sharp -{abs(change):.1f}% drop')
    elif change < -1.0: score -= 2; reasons.append(f'AI predicts -{abs(change):.1f}% price drop')
    else:               score -= 1; reasons.append(f'AI predicts slight decline of {change:.1f}%')

    # ── RSI signal ──
    rsi = tech.get('rsi', 50)
    if rsi < 30:   score += 2; reasons.append(f'RSI deeply oversold at {rsi:.0f} — strong reversal signal')
    elif rsi < 45: score += 1; reasons.append(f'RSI oversold at {rsi:.0f}')
    elif rsi > 75: score -= 2; reasons.append(f'RSI overbought at {rsi:.0f} — correction risk')
    elif rsi > 65: score -= 1; reasons.append(f'RSI elevated at {rsi:.0f}')

    # ── MACD signal ──
    macd_val = tech.get('macd', 0)
    macd_sig = tech.get('macd_signal', 0)
    macd_hist = tech.get('macd_histogram', 0)
    if macd_val > macd_sig and macd_hist > 0:
        score += 2; reasons.append('MACD bullish crossover with positive histogram')
    elif macd_val > macd_sig:
        score += 1; reasons.append('MACD above signal line')
    elif macd_val < macd_sig and macd_hist < 0:
        score -= 2; reasons.append('MACD bearish crossover with negative histogram')
    elif macd_val < macd_sig:
        score -= 1; reasons.append('MACD below signal line')

    # ── Bollinger Band position ──
    price = info.get('current_price', 0)
    bb_upper = tech.get('bb_upper', 0)
    bb_lower = tech.get('bb_lower', 0)
    bb_mid   = tech.get('bb_mid', 0)
    if bb_lower and price < bb_lower:  score += 1; reasons.append('Price below lower Bollinger Band — oversold')
    elif bb_upper and price > bb_upper: score -= 1; reasons.append('Price above upper Bollinger Band — overbought')

    # ── Moving average position ──
    sma20 = tech.get('sma_20', 0)
    sma50 = tech.get('sma_50', 0)
    if price and sma20 and price > sma20: score += 1; reasons.append('Price above 20-day SMA — bullish')
    elif price and sma20 and price < sma20: score -= 1; reasons.append('Price below 20-day SMA — bearish')
    if sma20 and sma50 and sma20 > sma50: score += 1; reasons.append('Golden cross: SMA20 above SMA50')
    elif sma20 and sma50 and sma20 < sma50: score -= 1; reasons.append('Death cross: SMA20 below SMA50')

    # ── Sentiment signal ──
    sent_label = sentiment.get('label') if sentiment else 'neutral'
    if sent_label == 'positive':   score += 1; reasons.append('Positive news sentiment')
    elif sent_label == 'negative': score -= 1; reasons.append('Negative news sentiment')

    # ── Valuation signal ──
    pe = info.get('pe_ratio')
    if pe and pe < 15:   score += 1; reasons.append(f'Undervalued P/E of {pe:.1f}')
    elif pe and pe > 60: score -= 1; reasons.append(f'Expensive P/E of {pe:.1f}')

    # ── Signal classification ──
    beta = info.get('beta') or 1.0
    risk = 'High' if beta > 1.5 else 'Medium' if beta > 1.0 else 'Low'

    if score >= 5:    signal, label = 'BUY',  'Strong Buy'
    elif score >= 2:  signal, label = 'BUY',  'Buy'
    elif score <= -5: signal, label = 'SELL', 'Strong Sell'
    elif score <= -2: signal, label = 'SELL', 'Sell'
    else:             signal, label = 'HOLD', 'Hold'

    max_score = 14
    confidence = min(round((abs(score) / max_score) * 100) + 35, 95)

    # ── Health score (0–10) ──
    bull = prediction.get('bull_signals', 3) if prediction else 3
    health_raw = (score + max_score) / (2 * max_score)  # 0–1
    health_score = round(health_raw * 10, 1)
    if health_score >= 7.5:   health_label = 'Excellent'
    elif health_score >= 5.5: health_label = 'Good'
    elif health_score >= 3.5: health_label = 'Moderate'
    else:                     health_label = 'Weak'

    # ── Entry / Exit zones ──
    support  = tech.get('support', price * 0.97) if price else 0
    resistance = tech.get('resistance', price * 1.03) if price else 0
    buy_low  = round(support * 0.995, 2)
    buy_high = round((support + (price - support) * 0.3), 2)
    target   = round(resistance * 1.02, 2)
    stop_loss = round(support * 0.975, 2)

    # ── AI summary text ──
    outlook = prediction.get('market_outlook', 'Neutral') if prediction else 'Neutral'
    conf_pct = prediction.get('confidence', 0.5) if prediction else 0.5
    trend_word = 'upward' if change > 0 else 'downward'
    rsi_desc = 'oversold' if rsi < 45 else 'overbought' if rsi > 65 else 'neutral'
    macd_desc = 'bullish' if macd_val > macd_sig else 'bearish'
    sent_desc = sent_label if sent_label else 'neutral'

    ai_summary = (
        f"{info.get('name', 'This stock')} shows a {outlook.lower()} outlook with "
        f"AI predicting a {trend_word} move of {abs(change):.1f}%. "
        f"RSI at {rsi:.0f} is {rsi_desc}, MACD is {macd_desc}, "
        f"and news sentiment is {sent_desc}. "
        f"Model confidence stands at {round(conf_pct * 100)}%. "
        f"{'Consider accumulating near support levels.' if signal == 'BUY' else 'Exercise caution and monitor closely.' if signal == 'HOLD' else 'Risk management is advised.'}"
    )

    # ── Alerts ──
    alerts = []
    if rsi > 75: alerts.append({'type': 'warning', 'msg': 'Overbought — RSI above 75'})
    if rsi < 30: alerts.append({'type': 'info',    'msg': 'Oversold — potential reversal zone'})
    if beta and beta > 1.8: alerts.append({'type': 'warning', 'msg': f'High volatility stock (Beta {beta:.1f})'})
    if price and bb_upper and price > bb_upper: alerts.append({'type': 'warning', 'msg': 'Price above Bollinger upper band'})
    if abs(change) > 3: alerts.append({'type': 'info', 'msg': f'Large predicted move: {change:+.1f}%'})

    return {
        'signal': signal,
        'label': label,
        'reason': ' | '.join(reasons[:4]) if reasons else 'Insufficient data',
        'reasons': reasons,
        'confidence': confidence,
        'risk_level': risk,
        'score': score,
        'health_score': health_score,
        'health_label': health_label,
        'ai_summary': ai_summary,
        'market_outlook': outlook,
        'alerts': alerts,
        'zones': {
            'buy_low': buy_low,
            'buy_high': buy_high,
            'target': target,
            'stop_loss': stop_loss,
            'support': support,
            'resistance': resistance,
        },
    }
