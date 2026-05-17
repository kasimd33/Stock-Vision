"""
predictor.py — Enhanced ML prediction engine with:
  - Multi-model ensemble (LinearRegression + RandomForest)
  - Technical indicators (RSI, MACD, Bollinger Bands, SMA, EMA)
  - Model caching (no retrain on every request)
  - Confidence scoring
"""
import numpy as np
import hashlib
import time
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import MinMaxScaler

# ── In-memory model cache (symbol → {model, scaler, expires}) ────────────────
_model_cache: dict = {}
MODEL_TTL = 3600  # retrain after 1 hour


def _cache_key(symbol: str, n_points: int) -> str:
    return hashlib.md5(f"{symbol}:{n_points}".encode()).hexdigest()[:12]


# ── Technical Indicators ──────────────────────────────────────────────────────
def compute_rsi(closes: np.ndarray, period: int = 14) -> float:
    if len(closes) < period + 1:
        return 50.0
    deltas = np.diff(closes[-(period + 1):])
    gains = np.where(deltas > 0, deltas, 0)
    losses = np.where(deltas < 0, -deltas, 0)
    avg_gain = gains.mean()
    avg_loss = losses.mean()
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return round(100 - (100 / (1 + rs)), 2)


def compute_macd(closes: np.ndarray):
    if len(closes) < 26:
        return 0.0, 0.0, 0.0
    ema12 = _ema(closes, 12)
    ema26 = _ema(closes, 26)
    macd_line = ema12 - ema26
    signal = _ema_of_series(macd_line[-9:], 9) if len(macd_line) >= 9 else macd_line[-1]
    histogram = macd_line[-1] - signal
    return round(float(macd_line[-1]), 4), round(float(signal), 4), round(float(histogram), 4)


def _ema(data: np.ndarray, period: int) -> np.ndarray:
    k = 2 / (period + 1)
    ema = np.zeros(len(data))
    ema[0] = data[0]
    for i in range(1, len(data)):
        ema[i] = data[i] * k + ema[i - 1] * (1 - k)
    return ema


def _ema_of_series(data: np.ndarray, period: int) -> float:
    if len(data) == 0:
        return 0.0
    k = 2 / (period + 1)
    val = data[0]
    for x in data[1:]:
        val = x * k + val * (1 - k)
    return val


def compute_bollinger(closes: np.ndarray, period: int = 20):
    if len(closes) < period:
        c = closes[-1]
        return round(float(c), 2), round(float(c * 1.02), 2), round(float(c * 0.98), 2)
    window = closes[-period:]
    mid = window.mean()
    std = window.std()
    return round(float(mid), 2), round(float(mid + 2 * std), 2), round(float(mid - 2 * std), 2)


def compute_sma(closes: np.ndarray, period: int) -> float:
    if len(closes) < period:
        return round(float(closes.mean()), 2)
    return round(float(closes[-period:].mean()), 2)


def compute_ema_value(closes: np.ndarray, period: int) -> float:
    if len(closes) < period:
        return round(float(closes[-1]), 2)
    return round(float(_ema(closes, period)[-1]), 2)


def compute_support_resistance(closes: np.ndarray):
    if len(closes) < 20:
        c = closes[-1]
        return round(float(c * 0.97), 2), round(float(c * 1.03), 2)
    recent = closes[-20:]
    support = round(float(recent.min()), 2)
    resistance = round(float(recent.max()), 2)
    return support, resistance


# ── Feature engineering ───────────────────────────────────────────────────────
def _build_features(closes: np.ndarray) -> np.ndarray:
    """Build feature matrix: [idx, sma5, sma20, ema9, rsi, price_norm]"""
    n = len(closes)
    features = []
    for i in range(n):
        window = closes[:i + 1]
        sma5 = window[-5:].mean() if len(window) >= 5 else window.mean()
        sma20 = window[-20:].mean() if len(window) >= 20 else window.mean()
        ema9 = _ema_of_series(window[-9:], 9) if len(window) >= 9 else window[-1]
        rsi = compute_rsi(window) / 100.0
        features.append([i, sma5, sma20, ema9, rsi, closes[i]])
    return np.array(features)


# ── Main prediction function ──────────────────────────────────────────────────
def predict_stock(hist, current_price, symbol: str = ''):
    try:
        if len(hist) < 15:
            return None

        closes = hist['Close'].values.astype(float)
        cache_key = _cache_key(symbol, len(closes))

        # Check model cache
        cached = _model_cache.get(cache_key)
        if cached and time.time() < cached['expires']:
            lr_model = cached['lr']
            rf_model = cached['rf']
            scaler = cached['scaler']
        else:
            # Build features & train
            features = _build_features(closes)
            scaler = MinMaxScaler()
            X = scaler.fit_transform(features)
            y = closes

            lr_model = LinearRegression()
            lr_model.fit(X, y)

            rf_model = RandomForestRegressor(n_estimators=50, random_state=42, n_jobs=-1)
            rf_model.fit(X, y)

            _model_cache[cache_key] = {
                'lr': lr_model, 'rf': rf_model, 'scaler': scaler,
                'expires': time.time() + MODEL_TTL
            }

        # Predict next point
        next_idx = len(closes)
        sma5 = closes[-5:].mean()
        sma20 = closes[-20:].mean() if len(closes) >= 20 else closes.mean()
        ema9 = _ema_of_series(closes[-9:], 9) if len(closes) >= 9 else closes[-1]
        rsi_val = compute_rsi(closes) / 100.0
        next_feat = np.array([[next_idx, sma5, sma20, ema9, rsi_val, closes[-1]]])
        next_feat_scaled = scaler.transform(next_feat)

        lr_pred = float(lr_model.predict(next_feat_scaled)[0])
        rf_pred = float(rf_model.predict(next_feat_scaled)[0])

        # Ensemble: weighted average
        predicted_price = round(lr_pred * 0.4 + rf_pred * 0.6, 2)
        change_pct = round(((predicted_price - current_price) / current_price) * 100, 2)

        # Confidence: R² of LR model on training data
        features_all = _build_features(closes)
        X_all = scaler.transform(features_all)
        r2 = lr_model.score(X_all, closes)
        confidence = round(min(max(abs(r2), 0.01), 0.99), 4)

        # Technical indicators
        rsi = compute_rsi(closes)
        macd, macd_signal, macd_hist = compute_macd(closes)
        bb_mid, bb_upper, bb_lower = compute_bollinger(closes)
        sma_20 = compute_sma(closes, 20)
        sma_50 = compute_sma(closes, 50)
        ema_9 = compute_ema_value(closes, 9)
        ema_21 = compute_ema_value(closes, 21)
        support, resistance = compute_support_resistance(closes)

        # Trend strength
        trend_slope = float(np.polyfit(np.arange(min(20, len(closes))), closes[-20:], 1)[0])
        trend_pct = round((trend_slope / current_price) * 100, 4)

        # Bullish/bearish signals count
        bull_signals = int(sum([
            bool(rsi < 70 and rsi > 40),
            bool(macd > macd_signal),
            bool(current_price > sma_20),
            bool(current_price > ema_9),
            bool(change_pct > 0),
        ]))
        bear_signals = int(5 - bull_signals)
        market_outlook = 'Bullish' if bull_signals >= 3 else 'Bearish' if bear_signals >= 3 else 'Neutral'

        # 7-day projection
        projection = []
        last_price = current_price
        for day in range(1, 8):
            proj_feat = np.array([[next_idx + day, sma5, sma20, ema9, rsi_val, last_price]])
            proj_scaled = scaler.transform(proj_feat)
            proj_price = round(float(rf_model.predict(proj_scaled)[0]), 2)
            projection.append({'day': day, 'price': proj_price})
            last_price = proj_price

        return {
            'predicted_price': predicted_price,
            'change_pct': change_pct,
            'confidence': confidence,
            'market_outlook': market_outlook,
            'bull_signals': bull_signals,
            'bear_signals': bear_signals,
            'trend_pct': trend_pct,
            'projection': projection,
            'technical': {
                'rsi': rsi,
                'macd': macd,
                'macd_signal': macd_signal,
                'macd_histogram': macd_hist,
                'bb_upper': bb_upper,
                'bb_mid': bb_mid,
                'bb_lower': bb_lower,
                'sma_20': sma_20,
                'sma_50': sma_50,
                'ema_9': ema_9,
                'ema_21': ema_21,
                'support': support,
                'resistance': resistance,
            }
        }
    except Exception as e:
        return None
