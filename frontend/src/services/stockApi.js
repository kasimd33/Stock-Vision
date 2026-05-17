/**
 * stockApi.js — Axios service layer for all stock data calls.
 * - Auto-retries on 503/429/network errors (3 attempts, exponential backoff)
 * - Classifies errors into user-friendly messages
 * - All calls go through Flask backend — no direct external API calls
 */
import axios from 'axios'

const BASE = '/api/stocks'

// ── Axios instance with auth ──────────────────────────────────────────────────
const http = axios.create({ baseURL: BASE, timeout: 20000 })

http.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Retry interceptor ─────────────────────────────────────────────────────────
const MAX_RETRIES = 3
const RETRYABLE = new Set([429, 503, 502, 504])

http.interceptors.response.use(
  res => res,
  async error => {
    const config = error.config
    if (!config) return Promise.reject(error)

    const status = error.response?.status

    // On 401, token is missing/expired — redirect to login
    if (status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    config._retryCount = config._retryCount || 0
    if (config._retryCount < MAX_RETRIES && (!status || RETRYABLE.has(status))) {
      config._retryCount++
      const delay = Math.min(1000 * 2 ** (config._retryCount - 1), 8000)
      await new Promise(r => setTimeout(r, delay))
      return http(config)
    }
    return Promise.reject(error)
  }
)

// ── Error classifier ──────────────────────────────────────────────────────────
export function classifyError(error) {
  if (!error.response) {
    if (error.code === 'ECONNABORTED') return { type: 'timeout', message: 'Request timed out. Please try again.' }
    return { type: 'network', message: 'Network error. Check your connection and try again.' }
  }
  const { status, data } = error.response
  const serverMsg = data?.error || ''

  if (status === 404) return { type: 'not_found', message: serverMsg || 'Symbol not found on NSE or BSE. Check the ticker and try again.' }
  if (status === 429) return { type: 'rate_limit', message: 'Too many requests. Please wait a moment.' }
  if (status === 503) return { type: 'unavailable', message: 'Market data temporarily unavailable. Please try again in a few seconds.' }
  if (status === 401) return { type: 'auth', message: 'Session expired. Please log in again.' }
  return { type: 'server', message: serverMsg || 'Something went wrong. Please try again.' }
}

// ── API methods ───────────────────────────────────────────────────────────────
export const stockApi = {
  /** Full analysis: quote + history + AI prediction + sentiment */
  analyze: (symbol) => http.get(`/analyze/${encodeURIComponent(symbol)}`),

  /** Dedicated AI prediction with technical indicators + 7-day projection */
  predict: (symbol) => http.get(`/predict/${encodeURIComponent(symbol)}`),

  /** Fast price-only quote (for polling) */
  quote: (symbol) => http.get(`/quote/${encodeURIComponent(symbol)}`),

  /** Price history */
  history: (symbol, period = '90d') => http.get(`/history/${encodeURIComponent(symbol)}`, { params: { period } }),

  /** Live indices — public, no auth needed */
  indices: () => http.get('/indices'),

  /** Top gainers */
  gainers: () => http.get('/gainers'),

  /** Top losers */
  losers: () => http.get('/losers'),

  /** Watchlist CRUD */
  getWatchlist: () => http.get('/watchlist'),
  addWatchlist: (symbol) => http.post('/watchlist', { symbol }),
  removeWatchlist: (symbol) => http.delete('/watchlist', { data: { symbol } }),
}

// ── Chatbot API ───────────────────────────────────────────────────────────────
const chatHttp = axios.create({ baseURL: '/api/chatbot', timeout: 25000 })
chatHttp.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const chatApi = {
  send:    (message) => chatHttp.post('/message', { message }),
  history: ()        => chatHttp.get('/history'),
  clear:   ()        => chatHttp.post('/clear'),
}

export default stockApi
