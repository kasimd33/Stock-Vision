# StockVision AI

AI-powered stock market analysis platform with predictions, sentiment analysis, and Buy/Sell/Hold recommendations.

## Project Structure

```
AI Stock project/
├── frontend/       # React + Tailwind CSS + Recharts
└── backend/        # Flask + MongoDB + scikit-learn
    ├── routes/     # auth.py, stocks.py
    ├── models/     # db.py (MongoDB)
    └── ml/         # predictor.py, sentiment.py
```

## Setup & Run

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB running locally on port 27017

### Backend

```bash
cd backend
# Add your NewsAPI key in .env (optional, for news sentiment)
python app.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Features

- **User Auth** – Register/Login with JWT
- **Stock Search** – Search any ticker (AAPL, TSLA, etc.)
- **AI Prediction** – Linear Regression on 90-day price history
- **Sentiment Analysis** – NLP scoring on latest news headlines
- **Buy/Sell/Hold** – Recommendation engine combining AI + sentiment + fundamentals
- **Price Chart** – Interactive 90-day chart with predicted price line
- **Key Statistics** – Market cap, P/E, EPS, 52W high/low, beta
- **Watchlist** – Save stocks per user in MongoDB

## API Keys (Optional)

- **NewsAPI** – Get a free key at https://newsapi.org and add to `backend/.env`
  - Without it, sentiment defaults to neutral

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Tailwind CSS v4, Recharts |
| Backend | Flask, Flask-JWT-Extended, Flask-CORS |
| ML | scikit-learn (Linear Regression), NumPy, Pandas |
| Data | yfinance (Yahoo Finance) |
| Database | MongoDB (PyMongo) |
| Sentiment | NewsAPI + keyword NLP |
