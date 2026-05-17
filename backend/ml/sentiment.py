import os
import requests

# Extended with Indian financial terms
POSITIVE_WORDS = {
    'surge', 'gain', 'rise', 'rally', 'profit', 'growth', 'beat', 'strong',
    'record', 'high', 'up', 'bullish', 'buy', 'upgrade', 'outperform',
    'robust', 'boom', 'soar', 'jump', 'expand', 'recovery', 'positive',
    'breakout', 'momentum', 'upside', 'accumulate', 'overweight', 'target',
    # Indian market terms
    'nifty', 'sensex', 'ipo', 'fii', 'dii', 'inflow', 'capex', 'order',
}
NEGATIVE_WORDS = {
    'fall', 'drop', 'loss', 'decline', 'crash', 'miss', 'weak', 'low',
    'down', 'bearish', 'sell', 'downgrade', 'risk', 'concern', 'underperform',
    'slump', 'plunge', 'cut', 'reduce', 'underweight', 'caution', 'warning',
    'debt', 'fraud', 'probe', 'penalty', 'outflow', 'slowdown', 'pressure',
}

def score_text(text):
    words = text.lower().split()
    pos = sum(1 for w in words if w in POSITIVE_WORDS)
    neg = sum(1 for w in words if w in NEGATIVE_WORDS)
    if pos > neg:
        return 'positive', (pos - neg) / max(len(words), 1)
    elif neg > pos:
        return 'negative', -(neg - pos) / max(len(words), 1)
    return 'neutral', 0.0

def analyze_sentiment(symbol, company_name=None):
    api_key = os.getenv('NEWS_API_KEY')
    articles_data = []
    scores = []

    if api_key and api_key != 'your_newsapi_key_here':
        # Search with both ticker and company name for better Indian results
        query = company_name if company_name else symbol
        query = f'{query} stock NSE India'
        try:
            url = f'https://newsapi.org/v2/everything?q={query}&sortBy=publishedAt&pageSize=10&language=en&apiKey={api_key}'
            resp = requests.get(url, timeout=5)
            articles = resp.json().get('articles', [])
            for a in articles:
                title = a.get('title', '')
                if not title or title == '[Removed]':
                    continue
                label, score = score_text(title)
                scores.append(score)
                articles_data.append({
                    'title': title,
                    'url': a.get('url', '#'),
                    'source': a.get('source', {}).get('name', ''),
                    'sentiment': label,
                    'published_at': a.get('publishedAt', ''),
                })
        except Exception:
            pass

    if not scores:
        return {'label': 'neutral', 'score': 0.0, 'articles_analyzed': 0}, []

    avg_score = sum(scores) / len(scores)
    label = 'positive' if avg_score > 0.001 else 'negative' if avg_score < -0.001 else 'neutral'
    return {'label': label, 'score': round(avg_score, 4), 'articles_analyzed': len(scores)}, articles_data
