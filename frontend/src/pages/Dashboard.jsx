import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, TrendingUp, TrendingDown, X, RefreshCw,
  Brain, Zap, ArrowUpRight, ArrowDownRight, Calculator, Flame
} from 'lucide-react'
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import IndexTicker from '../components/IndexTicker'
import SkeletonCard from '../components/SkeletonCard'
import SectorHeatmap from '../components/SectorHeatmap'
import { useIndices, useWatchlist } from '../hooks/useStock'
import toast from 'react-hot-toast'

/* ── Static demo data for gainers/losers ── */
const GAINERS = [
  { s: 'ADANIENT.NS',  n: 'Adani Ent',   chg: +3.42, price: '3,218' },
  { s: 'TATAMOTORS.NS',n: 'Tata Motors', chg: +2.87, price: '1,042' },
  { s: 'SUNPHARMA.NS', n: 'Sun Pharma',  chg: +2.11, price: '1,680' },
  { s: 'HCLTECH.NS',   n: 'HCL Tech',    chg: +1.95, price: '1,542' },
]
const LOSERS = [
  { s: 'COALINDIA.NS', n: 'Coal India',  chg: -2.14, price: '412' },
  { s: 'ONGC.NS',      n: 'ONGC',        chg: -1.88, price: '268' },
  { s: 'AXISBANK.NS',  n: 'Axis Bank',   chg: -1.32, price: '1,124' },
  { s: 'BPCL.NS',      n: 'BPCL',        chg: -0.97, price: '318' },
]
const NIFTY50 = [
  { s: 'RELIANCE.NS',  n: 'Reliance',    sector: 'Energy' },
  { s: 'TCS.NS',       n: 'TCS',         sector: 'IT' },
  { s: 'HDFCBANK.NS',  n: 'HDFC Bank',   sector: 'Banking' },
  { s: 'INFY.NS',      n: 'Infosys',     sector: 'IT' },
  { s: 'ICICIBANK.NS', n: 'ICICI Bank',  sector: 'Banking' },
  { s: 'WIPRO.NS',     n: 'Wipro',       sector: 'IT' },
  { s: 'SBIN.NS',      n: 'SBI',         sector: 'Banking' },
  { s: 'BAJFINANCE.NS',n: 'Bajaj Fin',   sector: 'Finance' },
]
const AI_RECS = [
  { s: 'TCS.NS',       signal: 'BUY',  conf: 78, reason: 'Strong IT sector momentum + positive earnings' },
  { s: 'HDFCBANK.NS',  signal: 'HOLD', conf: 55, reason: 'Consolidation phase, await breakout above ₹1,700' },
  { s: 'ADANIENT.NS',  signal: 'BUY',  conf: 71, reason: 'Bullish trend + infrastructure capex tailwind' },
  { s: 'COALINDIA.NS', signal: 'SELL', conf: 62, reason: 'Bearish momentum + energy transition headwinds' },
]

/* ── Mini sparkline data ── */
const spark = (up) => Array.from({ length: 10 }, (_, i) => ({
  v: 100 + (up ? 1 : -1) * i * 2 + (Math.random() - 0.5) * 8
}))

const REC_STYLE = {
  BUY:  { bg: 'bg-green-500/10 border-green-500/25', text: 'text-green-400', dot: 'bg-green-400' },
  HOLD: { bg: 'bg-yellow-500/10 border-yellow-500/25', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  SELL: { bg: 'bg-red-500/10 border-red-500/25', text: 'text-red-400', dot: 'bg-red-400' },
}

const FEAR_GREED = [
  { range: [0, 25],  label: 'Extreme Fear', color: 'text-red-500' },
  { range: [25, 45], label: 'Fear',          color: 'text-orange-400' },
  { range: [45, 55], label: 'Neutral',       color: 'text-yellow-400' },
  { range: [55, 75], label: 'Greed',         color: 'text-lime-400' },
  { range: [75, 100],label: 'Extreme Greed', color: 'text-green-400' },
]
const getFG = v => FEAR_GREED.find(f => v >= f.range[0] && v < f.range[1]) || FEAR_GREED[2]

function SIPCalc() {
  const [monthly, setMonthly] = useState(5000)
  const [rate, setRate] = useState(12)
  const [years, setYears] = useState(10)
  const n = years * 12, r = rate / 100 / 12
  const maturity = Math.round(monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r))
  const invested = monthly * n
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calculator size={14} className="text-orange-400" />
        <h3 className="text-white font-semibold text-sm">SIP Calculator</h3>
      </div>
      <div className="space-y-3 mb-4">
        {[
          { label: 'Monthly ₹', val: monthly, set: setMonthly, min: 500, max: 50000, step: 500, fmt: v => `₹${v.toLocaleString('en-IN')}` },
          { label: 'Return %', val: rate, set: setRate, min: 1, max: 30, step: 1, fmt: v => `${v}%` },
          { label: 'Years', val: years, set: setYears, min: 1, max: 30, step: 1, fmt: v => `${v}yr` },
        ].map(({ label, val, set, min, max, step, fmt }) => (
          <div key={label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">{label}</span>
              <span className="text-white font-medium">{fmt(val)}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={val}
              onChange={e => set(Number(e.target.value))}
              className="w-full h-1 bg-gray-800 rounded-full appearance-none cursor-pointer accent-orange-500" />
          </div>
        ))}
      </div>
      <div className="bg-white/3 rounded-xl p-3 space-y-1.5 border border-white/8">
        <div className="flex justify-between text-xs"><span className="text-gray-500">Invested</span><span className="text-white">₹{invested.toLocaleString('en-IN')}</span></div>
        <div className="flex justify-between text-xs"><span className="text-gray-500">Est. Gains</span><span className="text-green-400">₹{(maturity - invested).toLocaleString('en-IN')}</span></div>
        <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-white/8">
          <span className="text-gray-300">Maturity</span>
          <span className="text-orange-400">₹{maturity.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [ticker, setTicker] = useState('')
  const [fearVal] = useState(() => Math.floor(Math.random() * 55) + 25)
  const navigate = useNavigate()
  const fg = getFG(fearVal)
  const fearAngle = (fearVal / 100) * 180 - 90
  const { indices, loading: indicesLoading } = useIndices()
  const { symbols: watchlist, loading: wlLoading, remove: removeWLHook } = useWatchlist()

  const handleSearch = (e) => {
    e.preventDefault()
    if (!ticker.trim()) return
    navigate(`/stock/${ticker.toUpperCase().trim()}`)
  }

  const removeWL = async (symbol, e) => {
    e.stopPropagation()
    try {
      await removeWLHook(symbol)
      toast.success(`${symbol} removed`)
    } catch { toast.error('Failed') }
  }

  return (
    <div className="min-h-screen bg-[#060b14] text-white">
      <Sidebar />
      <div className="md:ml-60 flex flex-col min-h-screen">
        <TopBar title="Market Dashboard" subtitle="NSE & BSE · AI-powered · ₹ INR" />
        <IndexTicker live={indices} />

        <main className="flex-1 px-4 md:px-6 py-6 max-w-[1400px] mx-auto w-full">

          {/* ── Search bar ── */}
          <motion.form onSubmit={handleSearch} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 mb-7">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
              <input
                className="w-full bg-white/4 border border-white/10 text-white rounded-2xl pl-11 pr-4 py-3.5 text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-all"
                placeholder="Search NSE/BSE symbol — RELIANCE, TCS, INFY, HDFCBANK..."
                value={ticker}
                onChange={e => setTicker(e.target.value.toUpperCase())}
              />
            </div>
            <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 px-7 py-3.5 rounded-2xl font-semibold text-sm transition-all shadow-lg shadow-orange-500/25 whitespace-nowrap">
              Analyze →
            </motion.button>
          </motion.form>

          {/* ── 3-column layout ── */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">

            {/* ── LEFT: main content ── */}
            <div className="space-y-6">

              {/* Index cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(indices.length > 0 ? indices : [
                  { short: 'NIFTY 50', price: 24198, change_pct: 0.42 },
                  { short: 'SENSEX',   price: 79802, change_pct: 0.38 },
                  { short: 'BANK NIFTY', price: 51340, change_pct: -0.12 },
                  { short: 'NIFTY IT',   price: 38920, change_pct: 1.05 },
                ]).map((idx, i) => {
                  const pos = idx.change_pct >= 0
                  const data = spark(pos)
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="glass glass-hover rounded-2xl p-4 cursor-default">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-gray-500 text-xs font-medium">{idx.short}</p>
                        <span className={`text-xs font-bold flex items-center gap-0.5 ${pos ? 'text-green-400' : 'text-red-400'}`}>
                          {pos ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                          {pos ? '+' : ''}{idx.change_pct?.toFixed(2)}%
                        </span>
                      </div>
                      <p className="text-white font-bold text-lg leading-none">₹{idx.price?.toLocaleString('en-IN')}</p>
                      <div className="mt-2 h-8">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={data}>
                            <defs>
                              <linearGradient id={`sg${i}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={pos ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
                                <stop offset="100%" stopColor={pos ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="v" stroke={pos ? '#22c55e' : '#ef4444'}
                              strokeWidth={1.5} fill={`url(#sg${i})`} dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Gainers + Losers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[{ title: 'Top Gainers', data: GAINERS, up: true }, { title: 'Top Losers', data: LOSERS, up: false }].map(({ title, data, up }) => (
                  <motion.div key={title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }} className="glass rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      {up ? <TrendingUp size={14} className="text-green-400" /> : <TrendingDown size={14} className="text-red-400" />}
                      <h3 className="text-white font-semibold text-sm">{title}</h3>
                    </div>
                    <div className="space-y-2">
                      {data.map(({ s, n, chg, price }) => (
                        <motion.button key={s} whileHover={{ x: 3 }} onClick={() => navigate(`/stock/${s}`)}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/4 transition-all group">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${up ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                              {n[0]}
                            </div>
                            <div className="text-left">
                              <p className="text-white text-xs font-semibold group-hover:text-orange-400 transition">{s.replace('.NS','')}</p>
                              <p className="text-gray-600 text-xs">{n}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white text-xs font-bold">₹{price}</p>
                            <p className={`text-xs font-semibold ${up ? 'text-green-400' : 'text-red-400'}`}>
                              {chg > 0 ? '+' : ''}{chg.toFixed(2)}%
                            </p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* NIFTY 50 Blue Chips */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Flame size={14} className="text-orange-400" />
                    <h3 className="text-white font-semibold text-sm">NIFTY 50 Blue Chips</h3>
                  </div>
                  <button onClick={() => navigate('/markets')} className="text-orange-400 text-xs hover:text-orange-300 transition">View All →</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {NIFTY50.map(({ s, n, sector }) => (
                    <motion.button key={s} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                      onClick={() => navigate(`/stock/${s}`)}
                      className="bg-white/3 hover:bg-white/6 border border-white/8 hover:border-orange-500/30 rounded-xl p-3 text-left transition-all group">
                      <p className="font-bold text-white text-sm group-hover:text-orange-400 transition">{s.replace('.NS','')}</p>
                      <p className="text-gray-600 text-xs mt-0.5">{n}</p>
                      <span className="inline-block mt-1.5 text-xs px-1.5 py-0.5 rounded-md bg-white/5 text-gray-500">{sector}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* AI Recommendations feed */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="glass rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Brain size={14} className="text-purple-400" />
                  <h3 className="text-white font-semibold text-sm">AI Recommendations</h3>
                  <span className="ml-auto text-xs text-gray-600">Updated just now</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AI_RECS.map(({ s, signal, conf, reason }) => {
                    const st = REC_STYLE[signal]
                    return (
                      <motion.button key={s} whileHover={{ scale: 1.02 }} onClick={() => navigate(`/stock/${s}`)}
                        className={`border rounded-xl p-4 text-left transition-all ${st.bg}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-bold text-sm">{s.replace('.NS','')}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/10 ${st.text}`}>{signal}</span>
                        </div>
                        <p className="text-gray-400 text-xs leading-relaxed mb-2">{reason}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${signal === 'BUY' ? 'bg-green-500' : signal === 'SELL' ? 'bg-red-500' : 'bg-yellow-500'}`}
                              style={{ width: `${conf}%` }} />
                          </div>
                          <span className={`text-xs font-semibold ${st.text}`}>{conf}%</span>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>

              {/* Watchlist */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                    <Zap size={14} className="text-cyan-400" /> My Watchlist
                  </h3>
                  {wlLoading && <RefreshCw size={13} className="text-gray-600 animate-spin" />}
                </div>
                {wlLoading ? (
                  <div className="grid grid-cols-3 gap-2">{[1,2,3].map(i => <SkeletonCard key={i} className="h-14" />)}</div>
                ) : watchlist.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 text-sm">No stocks yet.</p>
                    <p className="text-gray-700 text-xs mt-1">Search a stock → click bookmark to add</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <AnimatePresence>
                      {watchlist.map(s => (
                        <motion.div key={s} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="relative group bg-orange-500/8 hover:bg-orange-500/15 border border-orange-500/15 hover:border-orange-500/30 rounded-xl p-3 cursor-pointer transition-all"
                          onClick={() => navigate(`/stock/${s}`)}>
                          <p className="font-bold text-orange-300 text-sm">{s.replace('.NS','').replace('.BO','')}</p>
                          <p className="text-gray-600 text-xs mt-0.5">Analyze →</p>
                          <button onClick={e => removeWL(s, e)}
                            className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all">
                            <X size={11} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            </div>

            {/* ── RIGHT panel ── */}
            <div className="space-y-5">

              {/* Fear & Greed */}
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                className="glass rounded-2xl p-5 text-center">
                <p className="text-gray-500 text-xs uppercase tracking-widest mb-4">India Sentiment</p>
                <div className="relative w-32 h-[68px] mx-auto mb-3">
                  <svg viewBox="0 0 120 65" className="w-full">
                    <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="#1a2235" strokeWidth="12" strokeLinecap="round" />
                    <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="url(#fg)" strokeWidth="12"
                      strokeLinecap="round" strokeDasharray="157" strokeDashoffset={157 - (fearVal / 100) * 157} />
                    <defs>
                      <linearGradient id="fg" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="50%" stopColor="#eab308" />
                        <stop offset="100%" stopColor="#22c55e" />
                      </linearGradient>
                    </defs>
                    <line x1="60" y1="60"
                      x2={60 + 38 * Math.cos((fearAngle * Math.PI) / 180)}
                      y2={60 + 38 * Math.sin((fearAngle * Math.PI) / 180)}
                      stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="60" cy="60" r="4" fill="white" />
                  </svg>
                </div>
                <p className={`text-3xl font-extrabold ${fg.color}`}>{fearVal}</p>
                <p className={`text-sm font-semibold mt-0.5 ${fg.color}`}>{fg.label}</p>
                <p className="text-gray-600 text-xs mt-2">Fear & Greed Index</p>
              </motion.div>

              {/* Sector Heatmap */}
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <SectorHeatmap />
              </motion.div>

              {/* SIP Calculator */}
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                <SIPCalc />
              </motion.div>

              {/* AI Signal legend */}
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                className="glass rounded-2xl p-5">
                <p className="text-gray-500 text-xs uppercase tracking-widest mb-3">Signal Guide</p>
                <div className="space-y-2">
                  {[
                    { s: 'BUY',  c: 'text-green-400', b: 'bg-green-500/10 border-green-500/20', d: 'Strong upward trend predicted' },
                    { s: 'HOLD', c: 'text-yellow-400', b: 'bg-yellow-500/10 border-yellow-500/20', d: 'Neutral or mixed signals' },
                    { s: 'SELL', c: 'text-red-400',   b: 'bg-red-500/10 border-red-500/20',   d: 'Downward trend predicted' },
                  ].map(({ s, c, b, d }) => (
                    <div key={s} className={`flex items-center gap-3 p-2.5 rounded-xl border ${b}`}>
                      <span className={`font-bold text-xs w-8 ${c}`}>{s}</span>
                      <p className="text-gray-500 text-xs">{d}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* SEBI disclaimer */}
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
                className="bg-yellow-500/5 border border-yellow-500/15 rounded-2xl p-4">
                <p className="text-yellow-500 text-xs font-semibold mb-1">⚠ SEBI Disclaimer</p>
                <p className="text-gray-600 text-xs leading-relaxed">
                  For educational purposes only. Not SEBI-registered. AI predictions are not financial advice.
                </p>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
