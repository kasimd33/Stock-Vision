/**
 * useStock.js — fast stock data hook with:
 *   - in-memory cache (5 min TTL) so revisiting a stock is instant
 *   - clears stale data immediately on symbol change
 *   - polls live price every 15s during market hours only
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { stockApi, classifyError } from '../services/stockApi'

// Module-level cache: symbol → { data, ts }
const _cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCached(symbol) {
  const entry = _cache.get(symbol)
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data
  return null
}

function setCached(symbol, data) {
  _cache.set(symbol, { data, ts: Date.now() })
}

export function useStock(symbol) {
  const [data, setData]           = useState(() => getCached(symbol))
  const [loading, setLoading]     = useState(!getCached(symbol))
  const [error, setError]         = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const pollRef = useRef(null)
  const symbolRef = useRef(symbol)

  const fetchFull = useCallback(async (force = false) => {
    if (!symbol) return
    // Serve from cache instantly, then refresh in background
    const cached = getCached(symbol)
    if (cached && !force) {
      setData(cached)
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await stockApi.analyze(symbol)
      setCached(symbol, res.data)
      // Only update state if symbol hasn't changed while fetching
      if (symbolRef.current === symbol) {
        setData(res.data)
      }
    } catch (e) {
      if (symbolRef.current === symbol) setError(classifyError(e))
    } finally {
      if (symbolRef.current === symbol) setLoading(false)
    }
  }, [symbol])

  const pollPrice = useCallback(async () => {
    if (!symbol) return
    try {
      setRefreshing(true)
      const res = await stockApi.quote(symbol)
      const q = res.data?.quote
      if (q && symbolRef.current === symbol) {
        setData(prev => {
          if (!prev) return prev
          const updated = { ...prev, info: { ...prev.info, ...q } }
          setCached(symbol, updated)
          return updated
        })
      }
    } catch {
      // silent
    } finally {
      setRefreshing(false)
    }
  }, [symbol])

  // Reset immediately when symbol changes
  useEffect(() => {
    symbolRef.current = symbol
    clearInterval(pollRef.current)

    const cached = getCached(symbol)
    if (cached) {
      setData(cached)
      setLoading(false)
      setError(null)
      // Refresh in background silently
      stockApi.analyze(symbol)
        .then(res => {
          if (symbolRef.current === symbol) {
            setCached(symbol, res.data)
            setData(res.data)
          }
        })
        .catch(() => {})
    } else {
      setData(null)
      setLoading(true)
      setError(null)
      fetchFull()
    }
  }, [symbol]) // eslint-disable-line

  // Poll during market hours
  useEffect(() => {
    if (!data) return
    clearInterval(pollRef.current)
    const status = data?.info?.market_status
    if (status === 'OPEN' || status === 'PRE_OPEN') {
      pollRef.current = setInterval(pollPrice, 15000)
    }
    return () => clearInterval(pollRef.current)
  }, [data?.info?.market_status, pollPrice])

  return { data, loading, error, refreshing, refetch: () => fetchFull(true) }
}

export function useIndices() {
  const [indices, setIndices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await stockApi.indices()
        setIndices(res.data?.indices || [])
      } catch {
        // keep previous
      } finally {
        setLoading(false)
      }
    }
    fetch()
    const t = setInterval(fetch, 15000)
    return () => clearInterval(t)
  }, [])

  return { indices, loading }
}

export function useWatchlist() {
  const [symbols, setSymbols] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    stockApi.getWatchlist()
      .then(r => setSymbols(r.data?.symbols || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const add = async (symbol) => {
    await stockApi.addWatchlist(symbol)
    setSymbols(p => [...new Set([...p, symbol])])
  }

  const remove = async (symbol) => {
    await stockApi.removeWatchlist(symbol)
    setSymbols(p => p.filter(s => s !== symbol))
  }

  return { symbols, loading, add, remove }
}
