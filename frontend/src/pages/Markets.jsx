import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart2, TrendingUp } from 'lucide-react'
import Sidebar from '../components/Sidebar'

const SECTORS = [
  {
    name: 'Information Technology', icon: '💻', color: 'from-blue-600/20 to-blue-800/10', border: 'border-blue-500/20',
    stocks: [
      { s: 'TCS.NS', n: 'TCS' }, { s: 'INFY.NS', n: 'Infosys' }, { s: 'WIPRO.NS', n: 'Wipro' },
      { s: 'HCLTECH.NS', n: 'HCL Tech' }, { s: 'TECHM.NS', n: 'Tech Mahindra' },
    ],
  },
  {
    name: 'Banking & Finance', icon: '🏦', color: 'from-green-600/20 to-green-800/10', border: 'border-green-500/20',
    stocks: [
      { s: 'HDFCBANK.NS', n: 'HDFC Bank' }, { s: 'ICICIBANK.NS', n: 'ICICI Bank' }, { s: 'SBIN.NS', n: 'SBI' },
      { s: 'AXISBANK.NS', n: 'Axis Bank' }, { s: 'BAJFINANCE.NS', n: 'Bajaj Finance' },
    ],
  },
  {
    name: 'Energy & Oil', icon: '⚡', color: 'from-orange-600/20 to-orange-800/10', border: 'border-orange-500/20',
    stocks: [
      { s: 'RELIANCE.NS', n: 'Reliance' }, { s: 'ONGC.NS', n: 'ONGC' }, { s: 'NTPC.NS', n: 'NTPC' },
      { s: 'POWERGRID.NS', n: 'Power Grid' }, { s: 'BPCL.NS', n: 'BPCL' },
    ],
  },
  {
    name: 'Pharmaceuticals', icon: '💊', color: 'from-cyan-600/20 to-cyan-800/10', border: 'border-cyan-500/20',
    stocks: [
      { s: 'SUNPHARMA.NS', n: 'Sun Pharma' }, { s: 'DRREDDY.NS', n: "Dr Reddy's" }, { s: 'CIPLA.NS', n: 'Cipla' },
      { s: 'DIVISLAB.NS', n: "Divi's Lab" }, { s: 'APOLLOHOSP.NS', n: 'Apollo Hosp' },
    ],
  },
  {
    name: 'FMCG', icon: '🛒', color: 'from-pink-600/20 to-pink-800/10', border: 'border-pink-500/20',
    stocks: [
      { s: 'HINDUNILVR.NS', n: 'HUL' }, { s: 'ITC.NS', n: 'ITC' }, { s: 'NESTLEIND.NS', n: 'Nestle India' },
      { s: 'BRITANNIA.NS', n: 'Britannia' }, { s: 'DABUR.NS', n: 'Dabur' },
    ],
  },
  {
    name: 'Automobiles', icon: '🚗', color: 'from-purple-600/20 to-purple-800/10', border: 'border-purple-500/20',
    stocks: [
      { s: 'MARUTI.NS', n: 'Maruti Suzuki' }, { s: 'M&M.NS', n: 'M&M' }, { s: 'BAJAJ-AUTO.NS', n: 'Bajaj Auto' },
      { s: 'HEROMOTOCO.NS', n: 'Hero MotoCorp' }, { s: 'INDIANNIPPON.NS', n: 'Indian Nippon' },
    ],
  },
  {
    name: 'Metals & Mining', icon: '⛏️', color: 'from-yellow-600/20 to-yellow-800/10', border: 'border-yellow-500/20',
    stocks: [
      { s: 'TATASTEEL.NS', n: 'Tata Steel' }, { s: 'JSWSTEEL.NS', n: 'JSW Steel' }, { s: 'HINDALCO.NS', n: 'Hindalco' },
      { s: 'COALINDIA.NS', n: 'Coal India' }, { s: 'VEDL.NS', n: 'Vedanta' },
    ],
  },
  {
    name: 'PSU & Infrastructure', icon: '🏗️', color: 'from-teal-600/20 to-teal-800/10', border: 'border-teal-500/20',
    stocks: [
      { s: 'LT.NS', n: 'L&T' }, { s: 'ADANIPORTS.NS', n: 'Adani Ports' }, { s: 'ADANIENT.NS', n: 'Adani Ent' },
      { s: 'GAIL.NS', n: 'GAIL' }, { s: 'HAL.NS', n: 'HAL' },
    ],
  },
]

export default function Markets() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="md:ml-60 pt-16 md:pt-0 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart2 size={20} className="text-orange-400" />
            <div>
              <h1 className="text-2xl font-bold">Indian Market Sectors</h1>
              <p className="text-gray-400 text-sm mt-0.5">Browse NSE stocks by sector — click any stock to analyze</p>
            </div>
          </div>

          {/* Index quick links */}
          <div className="flex flex-wrap gap-2 mb-8 mt-4">
            {[
              { s: '^NSEI', label: 'NIFTY 50' },
              { s: '^BSESN', label: 'SENSEX' },
              { s: '^NSEBANK', label: 'BANK NIFTY' },
              { s: '^CNXIT', label: 'NIFTY IT' },
            ].map(({ s, label }) => (
              <button key={s} onClick={() => navigate(`/stock/${s}`)}
                className="text-xs px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 transition font-medium">
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {SECTORS.map(({ name, icon, stocks, color, border }, i) => (
              <motion.div key={name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`bg-gradient-to-br ${color} border ${border} rounded-2xl p-5`}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">{icon}</span>
                  <h2 className="font-semibold text-white text-sm">{name}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {stocks.map(({ s, n }) => (
                    <button key={s} onClick={() => navigate(`/stock/${s}`)}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 rounded-lg px-3 py-1.5 transition-all group">
                      <span className="text-white text-xs font-bold group-hover:text-orange-300 transition">{n}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
