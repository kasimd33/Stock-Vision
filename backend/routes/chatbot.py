"""
chatbot.py — Gemini-powered AI financial assistant with SSE streaming.

Flow:
  1. Detect if question is stock/sector/market related
  2. Fetch live data (quote + prediction + sentiment) in parallel
  3. Inject data as context into a professional system prompt
  4. Stream Gemini response token-by-token via SSE
  5. Fall back to rule-based response if Gemini key is missing
"""
from flask import Blueprint, request, jsonify, Response, stream_with_context
from flask_jwt_extended import jwt_required, get_jwt_identity
from concurrent.futures import ThreadPoolExecutor
from services.stock_service import get_quote, get_history, get_indices
from ml.predictor import predict_stock
from ml.sentiment import analyze_sentiment
from utils.json_encoder import safe
from utils.logger import get_logger
import pandas as pd
import re
import json
import time
import os

log = get_logger('routes.chatbot')
chatbot_bp = Blueprint('chatbot', __name__)

# ── Conversation history (user_id → messages) ─────────────────────────────────
_history: dict = {}
MAX_HISTORY = 10   # pairs kept for Gemini context

# ── Gemini client (lazy init) ─────────────────────────────────────────────────
_gemini_client = None

def _get_gemini():
    global _gemini_client
    if _gemini_client is not None:
        return _gemini_client
    api_key = os.getenv('GEMINI_API_KEY', '')
    if not api_key or api_key == 'your_gemini_api_key_here':
        return None
    try:
        from google import genai
        _gemini_client = genai.Client(api_key=api_key)
        log.info('Gemini client initialized (google-genai SDK)')
        return _gemini_client
    except Exception as e:
        log.error(f'Gemini init failed: {e}')
        return None

# ── Symbol / sector detection ─────────────────────────────────────────────────
KNOWN_SYMBOLS = {
    'reliance': 'RELIANCE.NS', 'tcs': 'TCS.NS', 'infosys': 'INFY.NS',
    'infy': 'INFY.NS', 'hdfc': 'HDFCBANK.NS', 'hdfcbank': 'HDFCBANK.NS',
    'icici': 'ICICIBANK.NS', 'icicibank': 'ICICIBANK.NS', 'wipro': 'WIPRO.NS',
    'sbi': 'SBIN.NS', 'bajaj': 'BAJFINANCE.NS', 'bajfinance': 'BAJFINANCE.NS',
    'adani': 'ADANIENT.NS', 'adanient': 'ADANIENT.NS', 'bse': 'BSE.NS',
    'hfcl': 'HFCL.NS', 'indiannippon': 'INDIANNIPPON.NS', 'sunpharma': 'SUNPHARMA.NS',
    'hcl': 'HCLTECH.NS', 'hcltech': 'HCLTECH.NS', 'axisbank': 'AXISBANK.NS',
    'axis': 'AXISBANK.NS', 'maruti': 'MARUTI.NS', 'ongc': 'ONGC.NS',
    'itc': 'ITC.NS', 'ntpc': 'NTPC.NS', 'techm': 'TECHM.NS',
    'coalindia': 'COALINDIA.NS', 'hindunilvr': 'HINDUNILVR.NS',
}
SECTOR_STOCKS = {
    'banking': ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'AXISBANK.NS'],
    'it':      ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS'],
    'energy':  ['RELIANCE.NS', 'ONGC.NS', 'NTPC.NS'],
    'auto':    ['MARUTI.NS', 'INDIANNIPPON.NS'],
    'pharma':  ['SUNPHARMA.NS'],
    'fmcg':    ['HINDUNILVR.NS', 'ITC.NS'],
}

def _detect_symbol(text):
    lower = text.lower()
    for key, sym in KNOWN_SYMBOLS.items():
        if key in lower:
            return sym
    m = re.search(r'\b([A-Z]{2,10})(\.NS|\.BO)?\b', text.upper())
    if m and len(m.group(1)) >= 3:
        return m.group(1) + '.NS'
    return None

def _detect_sector(text):
    lower = text.lower()
    for s in SECTOR_STOCKS:
        if s in lower: return s
    if 'bank' in lower: return 'banking'
    if 'tech' in lower or 'software' in lower or ' it ' in lower: return 'it'
    if 'pharma' in lower or 'health' in lower: return 'pharma'
    if 'auto' in lower or 'car' in lower: return 'auto'
    if 'energy' in lower or 'oil' in lower or 'power' in lower: return 'energy'
    return None

def _is_market_query(text):
    lower = text.lower()
    return any(w in lower for w in ['market summary', 'market today', 'nifty today',
                                     'sensex today', 'how is market', 'market status',
                                     'indices', 'index today'])

# ── Live data fetchers ────────────────────────────────────────────────────────
def _fmt(p):
    return f'₹{float(p):,.2f}' if p is not None else 'N/A'

def _fetch_stock_context(symbol: str) -> str:
    """Fetch live stock data and return as a formatted context string."""
    try:
        with ThreadPoolExecutor(max_workers=2) as ex:
            fq = ex.submit(get_quote, symbol)
            fh = ex.submit(get_history, symbol, '90d')
        q = fq.result()
        h = fh.result()
        df = pd.DataFrame(h)
        df['Close'] = df['close']
        pred = predict_stock(df, q['current_price'], symbol)
        clean = symbol.replace('.NS', '').replace('.BO', '')
        sent, _ = analyze_sentiment(clean, clean)

        tech = (pred or {}).get('technical', {})
        rsi  = tech.get('rsi', 50)
        macd = tech.get('macd', 0)
        msig = tech.get('macd_signal', 0)
        bb_u = tech.get('bb_upper', 0)
        bb_l = tech.get('bb_lower', 0)
        sma20 = tech.get('sma_20', 0)
        sma50 = tech.get('sma_50', 0)
        supp  = tech.get('support', 0)
        res   = tech.get('resistance', 0)

        return f"""
LIVE STOCK DATA for {symbol} ({q.get('name', symbol)}):
- Current Price: {_fmt(q.get('current_price'))} | Change: {q.get('change_pct', 0):+.2f}% today
- Day High: {_fmt(q.get('day_high'))} | Day Low: {_fmt(q.get('day_low'))}
- 52W High: {_fmt(q.get('week_52_high'))} | 52W Low: {_fmt(q.get('week_52_low'))}
- Volume: {q.get('volume', 0):,} | Market Cap: {_fmt(q.get('market_cap'))}
- P/E Ratio: {q.get('pe_ratio') or 'N/A'} | Beta: {q.get('beta') or 'N/A'}
- Sector: {q.get('sector') or 'N/A'} | Exchange: {q.get('exchange', 'NSE')}

AI PREDICTION:
- Predicted Next Price: {_fmt((pred or {}).get('predicted_price'))}
- Expected Change: {(pred or {}).get('change_pct', 0):+.2f}%
- Market Outlook: {(pred or {}).get('market_outlook', 'Neutral')}
- Model Confidence: {round(((pred or {}).get('confidence', 0.5)) * 100)}%

TECHNICAL INDICATORS:
- RSI(14): {rsi:.1f} {'[OVERSOLD]' if rsi < 30 else '[OVERBOUGHT]' if rsi > 70 else '[NEUTRAL]'}
- MACD: {macd:.4f} | Signal: {msig:.4f} | {'BULLISH CROSSOVER' if macd > msig else 'BEARISH CROSSOVER'}
- Bollinger Upper: {_fmt(bb_u)} | Lower: {_fmt(bb_l)}
- SMA 20: {_fmt(sma20)} | SMA 50: {_fmt(sma50)}
- Support: {_fmt(supp)} | Resistance: {_fmt(res)}

NEWS SENTIMENT: {(sent or {}).get('label', 'neutral').upper()} (score: {(sent or {}).get('score', 0):.3f}, {(sent or {}).get('articles_analyzed', 0)} articles)
""".strip()
    except Exception as e:
        return f"Note: Could not fetch live data for {symbol} ({e}). Provide general analysis."

def _fetch_market_context() -> str:
    try:
        indices = get_indices()
        lines = ['LIVE INDIAN MARKET DATA:']
        for idx in indices:
            chg = idx.get('change_pct', 0)
            lines.append(f"- {idx['short']}: ₹{idx['price']:,.0f} ({chg:+.2f}%)")
        pos = sum(1 for i in indices if i.get('change_pct', 0) > 0)
        lines.append(f"- Overall: {'Bullish' if pos >= 3 else 'Bearish' if pos <= 1 else 'Mixed'}")
        return '\n'.join(lines)
    except Exception:
        return ''

def _fetch_sector_context(sector: str) -> str:
    syms = SECTOR_STOCKS.get(sector, [])
    lines = [f'LIVE {sector.upper()} SECTOR DATA:']
    for sym in syms[:4]:
        try:
            q = get_quote(sym)
            chg = q.get('change_pct', 0)
            lines.append(f"- {sym.replace('.NS','')}: {_fmt(q.get('current_price'))} ({chg:+.2f}%)")
        except Exception:
            pass
    return '\n'.join(lines)

# ── System prompt ─────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are StockVision AI — a professional Indian stock market analyst and financial assistant for the StockVision AI India platform.

Your personality:
- Intelligent, concise, and conversational
- Speak like a seasoned NSE/BSE analyst, not a robot
- Use ₹ for prices, reference Indian market context (NIFTY, SENSEX, NSE, BSE)
- Be beginner-friendly but analytically sharp
- Always add a SEBI disclaimer for investment advice

Your capabilities:
- Analyze NSE/BSE stocks using live technical data provided
- Give Buy/Sell/Hold recommendations with reasoning
- Explain financial concepts simply
- Provide market summaries and sector analysis
- Answer portfolio and risk questions

Response format:
- Use **bold** for key terms and recommendations
- Use bullet points (•) for lists
- Keep responses under 250 words unless detailed analysis is requested
- Always end stock analysis with a clear recommendation
- Add "⚠️ Not SEBI-registered. For educational purposes only." for investment advice

IMPORTANT: When live stock data is provided in the context, use those exact numbers in your response."""

# ── Gemini streaming ──────────────────────────────────────────────────────────
def _build_gemini_prompt(user_id: str, user_msg: str, context: str) -> list:
    """Build the messages list for Gemini with history + context."""
    messages = []

    # Add conversation history
    hist = _history.get(user_id, [])
    for entry in hist[-MAX_HISTORY:]:
        role = 'user' if entry['role'] == 'user' else 'model'
        messages.append({'role': role, 'parts': [entry['text']]})

    # Build current user message with injected context
    if context:
        full_msg = f"{context}\n\nUser question: {user_msg}"
    else:
        full_msg = user_msg

    messages.append({'role': 'user', 'parts': [full_msg]})
    return messages

def _stream_gemini(user_id: str, user_msg: str):
    """Stream Gemini response via SSE."""
    yield _sse('thinking', '...')

    # Detect what data to fetch
    symbol = _detect_symbol(user_msg)
    sector = _detect_sector(user_msg)
    is_market = _is_market_query(user_msg)

    context = ''
    if symbol:
        yield _sse('status', f'Fetching live data for {symbol}...')
        context = _fetch_stock_context(symbol)
    elif sector:
        yield _sse('status', f'Fetching {sector} sector data...')
        context = _fetch_sector_context(sector)
    elif is_market:
        yield _sse('status', 'Fetching market indices...')
        context = _fetch_market_context()

    client = _get_gemini()
    if client is None:
        # Graceful fallback — rule-based response
        yield from _stream_fallback(user_id, user_msg)
        return

    try:
        from google.genai import types

        # Build contents list: history + current message with context
        contents = []
        for entry in _history.get(user_id, [])[-MAX_HISTORY:]:
            role = 'user' if entry['role'] == 'user' else 'model'
            contents.append(types.Content(role=role, parts=[types.Part(text=entry['text'])]))

        current_text = (f"{context}\n\nUser question: {user_msg}" if context else user_msg)
        contents.append(types.Content(role='user', parts=[types.Part(text=current_text)]))

        full_reply = ''
        response = client.models.generate_content_stream(
            model='gemini-2.0-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.7,
                max_output_tokens=1024,
            )
        )

        for chunk in response:
            text = chunk.text if chunk.text else ''
            if text:
                full_reply += text
                yield _sse('token', text)

        # Save to history
        hist = _history.setdefault(user_id, [])
        hist.append({'role': 'user',      'text': user_msg})
        hist.append({'role': 'assistant', 'text': full_reply})
        if len(hist) > MAX_HISTORY * 2:
            _history[user_id] = hist[-(MAX_HISTORY * 2):]

        yield _sse('done', '')

    except Exception as e:
        log.error(f'Gemini stream error: {e}')
        yield from _stream_fallback(user_id, user_msg)

# ── Rule-based fallback (when no Gemini key) ──────────────────────────────────
def _fallback_response(user_id: str, message: str) -> str:
    text = message.strip()
    lower = text.lower()

    if any(lower.startswith(g) for g in ['hi', 'hello', 'hey', 'namaste', 'good morning', 'hii']):
        return (
            "**Namaste! 🙏 I'm your StockVision AI Assistant.**\n\n"
            "I can help you with:\n"
            "• 📊 **Stock Analysis** — _\"Analyze Reliance\"_\n"
            "• 💡 **Buy/Sell/Hold** — _\"Should I buy TCS?\"_\n"
            "• 🏦 **Sector Overview** — _\"How is banking sector?\"_\n"
            "• 📰 **Market Summary** — _\"Today's market summary\"_\n"
            "• 📚 **Education** — _\"Explain RSI\"_\n\n"
            "What would you like to know today?"
        )

    EDUCATION = {
        'rsi': "**RSI (Relative Strength Index)** 📊\n\nRSI measures price momentum on a 0–100 scale.\n\n• **RSI > 70** → Overbought — pullback likely\n• **RSI < 30** → Oversold — buying opportunity\n• **RSI 40–60** → Neutral zone\n\nThink of it as a speedometer for price movement.",
        'macd': "**MACD** 📉📈\n\nTracks the relationship between two EMAs.\n\n• **MACD above signal** → Bullish 🟢\n• **MACD below signal** → Bearish 🔴\n• **Positive histogram** → Momentum building",
        'pe': "**P/E Ratio** 💰\n\nHow much investors pay per ₹1 of earnings.\n\n• **P/E < 15** → Undervalued\n• **P/E > 50** → Expensive\n• **Negative P/E** → Loss-making company",
        'bollinger': "**Bollinger Bands** 📊\n\n• **Upper Band** → Overbought zone\n• **Middle Band** → 20-day SMA\n• **Lower Band** → Oversold zone\n\nPrice at lower band = potential buy signal.",
        'sma': "**SMA (Simple Moving Average)** 📈\n\n• **Price > SMA 20** → Short-term bullish\n• **SMA 20 > SMA 50** → Golden Cross 🌟 (buy signal)\n• **SMA 20 < SMA 50** → Death Cross ☠️ (sell signal)",
        'beta': "**Beta** ⚡\n\nVolatility vs NIFTY 50.\n\n• **Beta > 1.5** → High risk, high reward\n• **Beta < 0.8** → Defensive, stable\n• **Beta = 1** → Moves with market",
    }
    for key, resp in EDUCATION.items():
        if key in lower: return resp

    if _is_market_query(text):
        try:
            indices = get_indices()
            lines = ["**🇮🇳 Indian Market Summary**\n"]
            for idx in indices:
                chg = idx.get('change_pct', 0)
                lines.append(f"• **{idx['short']}**: ₹{idx['price']:,.0f} ({chg:+.2f}%) {'📈' if chg >= 0 else '📉'}")
            pos = sum(1 for i in indices if i.get('change_pct', 0) > 0)
            lines.append(f"\n**Overall: {'Bullish 🟢' if pos >= 3 else 'Bearish 🔴' if pos <= 1 else 'Mixed 🟡'}**")
            return '\n'.join(lines)
        except Exception:
            return "Market data temporarily unavailable."

    sector = _detect_sector(text)
    symbol = _detect_symbol(text)

    if sector and not symbol:
        syms = SECTOR_STOCKS.get(sector, [])
        results = []
        for sym in syms[:4]:
            try:
                q = get_quote(sym)
                chg = q.get('change_pct', 0)
                results.append(f"• **{sym.replace('.NS','')}** — {_fmt(q.get('current_price'))} ({chg:+.2f}%) {'📈' if chg >= 0 else '📉'}")
            except Exception:
                pass
        if results:
            return f"**{sector.upper()} Sector**\n\n" + '\n'.join(results)
        return f"Couldn't fetch {sector} sector data right now."

    if symbol:
        try:
            with ThreadPoolExecutor(max_workers=2) as ex:
                fq = ex.submit(get_quote, symbol)
                fh = ex.submit(get_history, symbol, '90d')
            q = fq.result()
            h = fh.result()
            df = pd.DataFrame(h)
            df['Close'] = df['close']
            pred = predict_stock(df, q['current_price'], symbol)
            clean = symbol.replace('.NS','').replace('.BO','')
            sent, _ = analyze_sentiment(clean, clean)
            tech = (pred or {}).get('technical', {})
            rsi = tech.get('rsi', 50)
            macd = tech.get('macd', 0)
            msig = tech.get('macd_signal', 0)
            pc = (pred or {}).get('change_pct', 0)
            sl = (sent or {}).get('label', 'neutral')
            score = (2 if pc > 1 else 1 if pc > 0 else -2 if pc < -1 else -1)
            if rsi < 40: score += 1
            elif rsi > 70: score -= 1
            if macd > msig: score += 1
            else: score -= 1
            if sl == 'positive': score += 1
            elif sl == 'negative': score -= 1
            rec = 'Strong Buy 🟢' if score >= 3 else 'Buy 🟢' if score >= 1 else 'Strong Sell 🔴' if score <= -3 else 'Sell 🔴' if score <= -1 else 'Hold 🟡'
            chg = q.get('change_pct', 0)
            return (
                f"**{q.get('name', symbol)} ({symbol.replace('.NS','')})** {'📈' if chg >= 0 else '📉'}\n\n"
                f"• Price: **{_fmt(q.get('current_price'))}** ({chg:+.2f}%)\n"
                f"• AI Prediction: **{_fmt((pred or {}).get('predicted_price'))}** ({pc:+.2f}%)\n"
                f"• RSI: **{rsi:.0f}** | MACD: {'Bullish' if macd > msig else 'Bearish'}\n"
                f"• Sentiment: **{sl.capitalize()}**\n\n"
                f"**Recommendation: {rec}**\n\n"
                f"⚠️ Not SEBI-registered. For educational purposes only."
            )
        except Exception:
            return f"Couldn't fetch data for **{symbol}** right now. Please try again."

    return (
        "I can help you with Indian stock analysis. Try:\n\n"
        "• _\"Analyze Reliance\"_\n"
        "• _\"Should I buy TCS?\"_\n"
        "• _\"How is the banking sector?\"_\n"
        "• _\"Today's market summary\"_\n"
        "• _\"Explain RSI\"_"
    )

def _stream_fallback(user_id: str, user_msg: str):
    """Word-by-word streaming for rule-based fallback."""
    try:
        full_reply = _fallback_response(user_id, user_msg)
    except Exception:
        full_reply = "I'm having trouble right now. Please try again in a moment."

    hist = _history.setdefault(user_id, [])
    hist.append({'role': 'user',      'text': user_msg})
    hist.append({'role': 'assistant', 'text': full_reply})
    if len(hist) > MAX_HISTORY * 2:
        _history[user_id] = hist[-(MAX_HISTORY * 2):]

    words = full_reply.split(' ')
    for i, word in enumerate(words):
        chunk = word if i == 0 else ' ' + word
        yield _sse('token', chunk)
        if any(word.endswith(c) for c in ['\n', '.', '!', '?']):
            time.sleep(0.04)
        elif any(word.endswith(c) for c in [',', ':', ';']):
            time.sleep(0.022)
        else:
            time.sleep(0.012)

    yield _sse('done', '')

# ── SSE helper ────────────────────────────────────────────────────────────────
def _sse(event: str, data: str) -> str:
    return f"data: {json.dumps({'event': event, 'data': data})}\n\n"

# ── Routes ────────────────────────────────────────────────────────────────────
@chatbot_bp.route('/stream', methods=['GET'])
def stream():
    from flask_jwt_extended import decode_token
    token    = request.args.get('token', '')
    user_msg = (request.args.get('message') or '').strip()

    if not token:
        return jsonify({'error': 'Unauthorized'}), 401
    if not user_msg:
        return jsonify({'error': 'Message required'}), 400
    if len(user_msg) > 600:
        return jsonify({'error': 'Message too long'}), 400

    try:
        decoded = decode_token(token)
        user_id = decoded.get('sub', 'anonymous')
    except Exception:
        return jsonify({'error': 'Invalid token'}), 401

    def generate():
        yield from _stream_gemini(user_id, user_msg)

    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
            'Access-Control-Allow-Origin': '*',
        }
    )

@chatbot_bp.route('/history', methods=['GET'])
@jwt_required()
def history():
    user_id = get_jwt_identity()
    return jsonify(safe({'success': True, 'history': _history.get(user_id, [])}))

@chatbot_bp.route('/clear', methods=['POST'])
@jwt_required()
def clear():
    user_id = get_jwt_identity()
    _history[user_id] = []
    return jsonify({'success': True})
