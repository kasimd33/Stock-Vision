import { useState } from 'react'
import { motion } from 'framer-motion'
import { Newspaper, TrendingUp, TrendingDown, Minus, ExternalLink, RefreshCw } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'

/* Demo news — replaced by real data when NewsAPI key is set */
const DEMO_NEWS = [
  { title: 'Reliance Industries Q3 profit surges 18% on strong retail and Jio growth', source: 'Economic Times', sentiment: 'positive', sector: 'Energy', time: '2h ago', url: '#' },
  { title: 'HDFC Bank reports record NII, asset quality improves significantly', source: 'Moneycontrol', sentiment: 'positive', sector: 'Banking', time: '3h ago', url: '#' },
  { title: 'IT sector faces headwinds as US clients cut discretionary spending', source: 'LiveMint', sentiment: 'negative', sector: 'IT', time: '4h ago', url: '#' },
  { title: 'SEBI tightens F&O rules to curb retail speculation in derivatives', source: 'Business Standard', sentiment: 'neutral', sector: 'Regulatory', time: '5h ago', url: '#' },
  { title: 'Tata Motors EV sales hit new monthly record, stock rallies 3%', source: 'Economic Times', sentiment: 'positive', sector: 'Auto', time: '6h ago', url: '#' },
  { title: 'Coal India output misses target amid monsoon disruptions', source: 'Moneycontrol', sentiment: 'negative', sector: 'Energy', time: '7h ago', url: '#' },
  { title: 'Sun Pharma gets USFDA approval for key generic drug', source: 'LiveMint', sentiment: 'positive', sector: 'Pharma', time: '8h ago', url: '#' },
  { title: 'FII outflows continue for third consecutive week amid global uncertainty', source: 'Business Standard', sentiment: 'negative', sector: 'Market', time: '9h ago', url: '#' },
  { title: 'Infosys raises FY25 revenue guidance after strong Q2 deal wins', source: 'Economic Times', sentiment: 'positive', sector: 'IT', time: '10h ago', url: '#' },
  { title: 'RBI keeps repo rate unchanged at 6.5%, maintains withdrawal of accommodation', source: 'Moneycontrol', sentiment: 'neutral', sector: 'Macro', time: '12h ago', url: '#' },
]

const SENT_STYLE = {
  positive: { bg: 'bg-green-500/10 border-green-500/20', text: 'text-green-400', icon: TrendingUp },
  negative: { bg: 'bg-red-500/10 border-red-500/20',   text: 'text-red-400',   icon: TrendingDown },
  neutral:  { bg: 'bg-gray-700/50 border-gray-600/30',  text: 'text-gray-400',  icon: Minus },
}

const SECTORS = ['All', 'IT', 'Banking', 'Energy', 'Auto', 'Pharma', 'FMCG', 'Macro', 'Regulatory', 'Market']

export default function NewsSentiment() {
  const [filter, setFilter] = useState('All')
  const [sentFilter, setSentFilter] = useState('all')

  const filtered = DEMO_NEWS.filter(n =>
    (filter === 'All' || n.sector === filter) &&
    (sentFilter === 'all' || n.sentiment === sentFilter)
  )

  const counts = {
    positive: DEMO_NEWS.filter(n => n.sentiment === 'positive').length,
    negative: DEMO_NEWS.filter(n => n.sentiment === 'negative').length,
    neutral:  DEMO_NEWS.filter(n => n.sentiment === 'neutral').length,
  }
  const total = DEMO_NEWS.length
  const overallScore = ((counts.positive - counts.negative) / total).toFixed(2)
  const overallLabel = overallScore > 0.1 ? 'Positive' : overallScore < -0.1 ? 'Negative' : 'Neutral'

  return (
    <div className="min-h-screen bg-[#060b14] text-white">
      <Sidebar />
      <div className="md:ml-60 flex flex-col min-h-screen">
        <TopBar title="News Sentiment" subtitle="Indian financial news · NLP analysis" />
        <main className="flex-1 px-4 md:px-6 py-6 max-w-5xl mx-auto w-full">

          {/* Sentiment overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Overall Sentiment', value: overallLabel, color: overallScore > 0.1 ? 'text-green-400' : overallScore < -0.1 ? 'text-red-400' : 'text-yellow-400' },
              { label: 'Positive News', value: counts.positive, color: 'text-green-400' },
              { label: 'Negative News', value: counts.negative, color: 'text-red-400' },
              { label: 'Neutral News',  value: counts.neutral,  color: 'text-gray-400' },
            ].map(({ label, value, color }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="glass rounded-2xl p-4">
                <p className="text-gray-500 text-xs mb-1">{label}</p>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
              </motion.div>
            ))}
          </div>

          {/* Sentiment bar */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">Market Sentiment Distribution</h3>
              <span className="text-gray-500 text-xs">{total} articles analyzed</span>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
              <div className="bg-green-500 rounded-l-full transition-all" style={{ width: `${(counts.positive / total) * 100}%` }} />
              <div className="bg-gray-600 transition-all" style={{ width: `${(counts.neutral / total) * 100}%` }} />
              <div className="bg-red-500 rounded-r-full transition-all" style={{ width: `${(counts.negative / total) * 100}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span className="text-green-400">{((counts.positive / total) * 100).toFixed(0)}% Positive</span>
              <span>{((counts.neutral / total) * 100).toFixed(0)}% Neutral</span>
              <span className="text-red-400">{((counts.negative / total) * 100).toFixed(0)}% Negative</span>
            </div>
          </motion.div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-5">
            <div className="flex gap-1 bg-white/4 border border-white/8 rounded-xl p-1">
              {['all','positive','negative','neutral'].map(s => (
                <button key={s} onClick={() => setSentFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${sentFilter === s ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-white'}`}>
                  {s}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {SECTORS.map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${filter === s ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' : 'bg-white/3 border-white/8 text-gray-500 hover:text-white'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* News list */}
          <div className="space-y-3">
            {filtered.map((article, i) => {
              const st = SENT_STYLE[article.sentiment]
              const Icon = st.icon
              return (
                <motion.a key={i} href={article.url} target="_blank" rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-4 p-4 glass glass-hover rounded-2xl group">
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${st.bg}`}>
                    <Icon size={14} className={st.text} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium leading-snug group-hover:text-orange-300 transition">{article.title}</p>
                    <div className="flex items-center flex-wrap gap-2 mt-2">
                      <span className="text-gray-600 text-xs">{article.source}</span>
                      <span className="text-gray-700 text-xs">·</span>
                      <span className="text-gray-600 text-xs">{article.time}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${st.bg} ${st.text}`}>{article.sentiment}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-gray-500">{article.sector}</span>
                    </div>
                  </div>
                  <ExternalLink size={13} className="text-gray-700 group-hover:text-orange-400 transition shrink-0 mt-1" />
                </motion.a>
              )
            })}
            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-600">
                <Newspaper size={32} className="mx-auto mb-3 opacity-30" />
                <p>No articles match the selected filters.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
