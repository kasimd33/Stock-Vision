import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Bookmark, BookmarkCheck, ExternalLink, ShieldAlert, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import SkeletonCard from '../components/SkeletonCard'
import ErrorState from '../components/ErrorState'
import { useStock } from '../hooks/useStock'
import { useWatchlist } from '../hooks/useStock'
import toast from 'react-hot-toast'

const REC_STYLE = {
  BUY:  { card: 'bg-green-500/10 border-green-500/40',  text: 'text-green-400',  badge: 'bg-green-500/20 text-green-300' },
  SELL: { card: 'bg-red-500/10 border-red-500/40',      text: 'text-red-400',    badge: 'bg-red-500/20 text-red-300' },
  HOLD: { card: 'bg-yellow-500/10 border-yellow-500/40',text: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-300' },
}
const RISK_STYLE = {
  Low:    'text-green-400 bg-green-500/10 border-green-500/20',
  Medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  High:   'text-red-400 bg-red-500/10 border-red-500/20',
}

const CustomTooltip = ({ active, payload, label, isInr }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0d1420] border border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-white font-bold">{isInr ? '₹' : '$'}{Number(payload[0]?.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
    </div>
  )
}

function fmtPrice(val, isInr) {
  if (val == null) return 'N/A'
  return `${isInr ? '₹' : '$'}${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtLarge(num, isInr) {
  if (!num) return 'N/A'
  const s = isInr ? '₹' : '$'
  if (num >= 1e12) return `${s}${(num / 1e12).toFixed(2)}T`
  if (num >= 1e7)  return `${s}${(num / 1e7).toFixed(2)}Cr`
  if (num >= 1e5)  return `${s}${(num / 1e5).toFixed(2)}L`
  if (num >= 1e9)  return `${s}${(num / 1e9).toFixed(2)}B`
  return `${s}${num.toLocaleString('en-IN')}`
}

export default function StockDetail() {
  const { symbol } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const { data, loading, error, refreshing, refetch } = useStock(symbol)
  const { symbols: watchlistSyms, add: addWL, remove: removeWL } = useWatchlist()
  const inWatchlist = watchlistSyms.includes(symbol)

  const toggleWatchlist = async () => {
    try {
      if (inWatchlist) {
        await removeWL(symbol)
        toast.success(`${symbol} removed from watchlist`)
      } else {
        await addWL(symbol)
        toast.success(`${symbol} added to watchlist`)
      }
    } catch { toast.error('Failed to update watchlist') }
  }

  const displaySymbol = symbol.replace('.NS', '').replace('.BO', '')

  // ── Loading skeleton ──
  if (loading) return (
    <div className="min-h-screen bg-[#060b14] text-white">
      <Sidebar />
      <div className="md:ml-60 flex flex-col min-h-screen">
        <TopBar title={displaySymbol} subtitle="Loading analysis..." />
        <main className="flex-1 px-4 md:px-8 py-8 max-w-5xl mx-auto w-full space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-32 h-8 bg-gray-800 rounded-xl animate-pulse" />
            <div className="w-16 h-6 bg-gray-800 rounded-full animate-pulse" />
          </div>
          <div className="w-48 h-10 bg-gray-800 rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1,2,3].map(i => <SkeletonCard key={i} className="h-36" />)}
          </div>
          <SkeletonCard className="h-72" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1,2,3,4,5,6,7,8].map(i => <SkeletonCard key={i} className="h-16" />)}
          </div>
        </main>
      </div>
    </div>
  )

  // ── Error state ──
  if (error) return (
    <div className="min-h-screen bg-[#060b14] text-white">
      <Sidebar />
      <div className="md:ml-60 flex flex-col min-h-screen">
        <TopBar title={displaySymbol} subtitle="Analysis failed" />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-lg">
            <button onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-8 transition">
              <ArrowLeft size={15} /> Back to Dashboard
            </button>
            <ErrorState error={error} onRetry={refetch} symbol={symbol} />
          </div>
        </main>
      </div>
    </div>
  )

  if (!data) return null

  const { info, history, prediction, recommendation, sentiment, news } = data
  const isInr = info.is_inr !== false
  const priceChange = info.change || 0
  // change_pct from backend is already a percentage (e.g. 1.23 means 1.23%)
  const changePctDisplay = typeof info.change_pct === 'number'
    ? Math.abs(info.change_pct).toFixed(2)
    : '0.00'
  const isPositive = priceChange >= 0
  const recStyle = REC_STYLE[recommendation?.signal] || REC_STYLE.HOLD
  const riskStyle = RISK_STYLE[recommendation?.risk_level] || RISK_STYLE.Medium

  const chartData = (history || []).map((h, i) => ({
    ...h,
    displayDate: i % 15 === 0 ? h.date.slice(5) : ''
  }))

  const marketStatusColor = info.market_status === 'OPEN' ? 'text-green-400' :
    info.market_status === 'PRE_OPEN' ? 'text-yellow-400' : 'text-gray-500'

  return (
    <div className="min-h-screen bg-[#060b14] text-white">
      <Sidebar />
      <div className="md:ml-60 flex flex-col min-h-screen">
        <TopBar title={displaySymbol} subtitle={info.name} />
        <main className="flex-1">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-6">

            {/* Back + Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <button onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-5 transition">
                <ArrowLeft size={15} /> Back to Dashboard
              </button>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <h1 className="text-3xl font-extrabold">{displaySymbol}</h1>
                    {recommendation?.signal && (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${recStyle.badge}`}>
                        {recommendation.signal}
                      </span>
                    )}
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/15 border border-blue-500/20 text-blue-400 font-medium">
                      {info.exchange || 'NSE'}
                    </span>
                    {info.sector && (
                      <span className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400">
                        {info.sector}
                      </span>
                    )}
                    <span className={`text-xs font-medium ${marketStatusColor}`}>
                      ● {info.market_status || 'CLOSED'}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{info.name}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <p className="text-4xl font-extrabold">{fmtPrice(info.current_price, isInr)}</p>
                      {refreshing && <RefreshCw size={14} className="text-gray-600 animate-spin" />}
                    </div>
                    <p className={`text-base font-medium mt-0.5 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{isInr ? '₹' : '$'}{Math.abs(priceChange).toFixed(2)} ({isPositive ? '+' : ''}{changePctDisplay}%)
                    </p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      H: {fmtPrice(info.day_high, isInr)} · L: {fmtPrice(info.day_low, isInr)}
                    </p>
                  </div>
                  <button onClick={toggleWatchlist}
                    className={`p-2.5 rounded-xl border transition-all ${inWatchlist ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
                    {inWatchlist ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Recommendation + Sentiment + Risk */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <div className={`border rounded-2xl p-5 ${recStyle.card}`}>
                <div className="flex items-center gap-3 mb-3">
                  {recommendation?.signal === 'BUY' ? <TrendingUp size={22} className="text-green-400" /> :
                   recommendation?.signal === 'SELL' ? <TrendingDown size={22} className="text-red-400" /> :
                   <Minus size={22} className="text-yellow-400" />}
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">AI Recommendation</p>
                    <p className={`text-2xl font-extrabold ${recStyle.text}`}>{recommendation?.signal || 'HOLD'}</p>
                  </div>
                </div>
                <p className="text-gray-300 text-xs leading-relaxed mb-3">{recommendation?.reason}</p>
                {recommendation?.confidence != null && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Confidence</span><span>{recommendation.confidence}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${recommendation.confidence}%` }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className={`h-full rounded-full ${recommendation.signal === 'BUY' ? 'bg-green-500' : recommendation.signal === 'SELL' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                    </div>
                  </div>
                )}
              </div>

              <div className="glass rounded-2xl p-5">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">News Sentiment</p>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${sentiment?.label === 'positive' ? 'bg-green-400' : sentiment?.label === 'negative' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                  <p className={`text-2xl font-extrabold capitalize ${sentiment?.label === 'positive' ? 'text-green-400' : sentiment?.label === 'negative' ? 'text-red-400' : 'text-yellow-400'}`}>
                    {sentiment?.label || 'neutral'}
                  </p>
                </div>
                <p className="text-gray-400 text-sm">Score: <span className="text-white font-medium">{sentiment?.score?.toFixed(3) || '0.000'}</span></p>
                <p className="text-gray-400 text-sm">{sentiment?.articles_analyzed || 0} articles analyzed</p>
                <div className="mt-3 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }}
                    animate={{ width: `${Math.min(Math.abs(sentiment?.score || 0) * 1000 + 50, 100)}%` }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className={`h-full rounded-full ${sentiment?.label === 'positive' ? 'bg-green-500' : sentiment?.label === 'negative' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                </div>
              </div>

              <div className="glass rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert size={15} className="text-gray-500" />
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Risk Analysis</p>
                </div>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-bold mb-3 ${riskStyle}`}>
                  {recommendation?.risk_level || 'Medium'} Risk
                </div>
                <div className="space-y-2 text-xs text-gray-400">
                  {[
                    ['Beta', info.beta?.toFixed(2)],
                    ['52W High', fmtPrice(info.week_52_high, isInr)],
                    ['52W Low', fmtPrice(info.week_52_low, isInr)],
                    ['From 52W High', info.week_52_high
                      ? `${(((info.current_price - info.week_52_high) / info.week_52_high) * 100).toFixed(1)}%`
                      : 'N/A'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <span>{label}</span>
                      <span className="text-white font-medium">{value || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-white">Price History — 90 Days</h2>
                {prediction?.predicted_price && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="w-6 border-t-2 border-dashed border-orange-400 inline-block" />
                    Predicted: <span className="text-orange-400 font-semibold">{fmtPrice(prediction.predicted_price, isInr)}</span>
                  </div>
                )}
              </div>
              <div className="h-[280px] w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a2235" />
                      <XAxis dataKey="displayDate" tick={{ fill: '#4b5563', fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: '#4b5563', fontSize: 11 }} tickLine={false} axisLine={false} domain={['auto', 'auto']}
                        tickFormatter={v => isInr ? `₹${(v / 1000).toFixed(0)}k` : `$${v}`} width={65} />
                      <Tooltip content={<CustomTooltip isInr={isInr} />} />
                      <Area type="monotone" dataKey="close" stroke="#f97316" strokeWidth={2}
                        fill="url(#priceGrad)" dot={false} activeDot={{ r: 4, fill: '#f97316' }} />
                      {prediction?.predicted_price && (
                        <ReferenceLine y={prediction.predicted_price} stroke="#f97316" strokeDasharray="6 3" strokeWidth={1.5} />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-600 text-sm">No chart data available</div>
                )}
              </div>
            </motion.div>

            {/* Tabs */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="flex gap-1 bg-white/4 border border-white/8 rounded-xl p-1 mb-5 w-fit">
                {['overview', 'prediction', 'news'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-white'}`}>
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === 'overview' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Market Cap', value: fmtLarge(info.market_cap, isInr) },
                    { label: 'Volume', value: (info.volume || 0).toLocaleString('en-IN') },
                    { label: 'P/E Ratio', value: info.pe_ratio?.toFixed(2) || 'N/A' },
                    { label: 'EPS', value: info.eps ? fmtPrice(info.eps, isInr) : 'N/A' },
                    { label: 'Dividend Yield', value: info.dividend_yield ? `${(info.dividend_yield * 100).toFixed(2)}%` : 'N/A' },
                    { label: 'Beta', value: info.beta?.toFixed(2) || 'N/A' },
                    { label: 'Sector', value: info.sector || 'N/A' },
                    { label: 'Industry', value: info.industry?.split(' ').slice(0, 3).join(' ') || 'N/A' },
                  ].map(({ label, value }) => (
                    <div key={label} className="glass glass-hover rounded-xl p-4">
                      <p className="text-gray-500 text-xs mb-1">{label}</p>
                      <p className="text-white font-semibold text-sm">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'prediction' && (
                <div className="space-y-4">
                  {!prediction ? (
                    <div className="text-center py-10 text-gray-600">
                      <p>Insufficient historical data for AI prediction.</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: 'Current Price', value: fmtPrice(info.current_price, isInr), color: 'text-white' },
                          { label: 'Predicted Price', value: fmtPrice(prediction.predicted_price, isInr), color: 'text-orange-400' },
                          { label: 'Expected Change', value: `${prediction.change_pct > 0 ? '+' : ''}${prediction.change_pct?.toFixed(2)}%`, color: prediction.change_pct >= 0 ? 'text-green-400' : 'text-red-400' },
                          { label: 'Model Confidence', value: `${(prediction.confidence * 100).toFixed(1)}%`, color: 'text-blue-400' },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="glass rounded-xl p-4">
                            <p className="text-gray-500 text-xs mb-1">{label}</p>
                            <p className={`font-bold text-lg ${color}`}>{value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="glass rounded-xl p-5">
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">Model Confidence</p>
                        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${prediction.confidence * 100}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-green-400" />
                        </div>
                        <div className="flex justify-between text-xs text-gray-600 mt-1.5">
                          <span>0%</span><span className="text-gray-400">{(prediction.confidence * 100).toFixed(1)}%</span><span>100%</span>
                        </div>
                        <p className="text-gray-600 text-xs mt-3">Linear Regression on 90-day NSE closing prices. Higher = stronger trend.</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'news' && (
                <div className="space-y-3">
                  {!news?.length ? (
                    <div className="text-center py-12 text-gray-600">
                      <p className="text-sm">No news available.</p>
                      <p className="text-xs mt-1">Add a NewsAPI key in <code className="text-gray-500">backend/.env</code> to enable Indian news sentiment.</p>
                    </div>
                  ) : news.map((article, i) => (
                    <motion.a key={i} href={article.url} target="_blank" rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="flex items-start justify-between gap-4 p-4 glass glass-hover rounded-xl group">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium leading-snug group-hover:text-orange-300 transition">{article.title}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-gray-600 text-xs">{article.source}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            article.sentiment === 'positive' ? 'bg-green-500/15 text-green-400' :
                            article.sentiment === 'negative' ? 'bg-red-500/15 text-red-400' :
                            'bg-gray-800 text-gray-500'
                          }`}>{article.sentiment}</span>
                        </div>
                      </div>
                      <ExternalLink size={13} className="text-gray-700 group-hover:text-orange-400 transition mt-0.5 shrink-0" />
                    </motion.a>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}
