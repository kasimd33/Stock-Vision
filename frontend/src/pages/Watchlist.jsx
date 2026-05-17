import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bookmark, X, TrendingUp } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import SkeletonCard from '../components/SkeletonCard'
import api from '../api'
import toast from 'react-hot-toast'

export default function Watchlist() {
  const [symbols, setSymbols] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/stocks/watchlist')
      .then(r => setSymbols(r.data.symbols || []))
      .catch(() => toast.error('Failed to load watchlist'))
      .finally(() => setLoading(false))
  }, [])

  const remove = async (symbol) => {
    try {
      await api.delete('/stocks/watchlist', { data: { symbol } })
      setSymbols(prev => prev.filter(s => s !== symbol))
      toast.success(`${symbol} removed`)
    } catch {
      toast.error('Failed to remove')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="md:ml-60 pt-16 md:pt-0 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Bookmark size={20} className="text-cyan-400" />
            <div>
              <h1 className="text-2xl font-bold">Your Watchlist</h1>
              <p className="text-gray-400 text-sm mt-0.5">Stocks you're tracking</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} className="h-24" />)}
            </div>
          ) : symbols.length === 0 ? (
            <div className="text-center py-20">
              <Bookmark size={40} className="text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">Your watchlist is empty</p>
              <p className="text-gray-600 text-sm mt-1 mb-6">Search for a stock and click the bookmark icon to add it</p>
              <button onClick={() => navigate('/dashboard')}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition">
                Browse Stocks
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <AnimatePresence>
                {symbols.map((s, i) => (
                  <motion.div key={s} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.05 }}
                    className="relative group bg-gray-900/80 border border-white/10 hover:border-blue-500/40 rounded-2xl p-5 cursor-pointer transition-all"
                    onClick={() => navigate(`/stock/${s}`)}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xl font-bold text-white group-hover:text-blue-400 transition">{s}</p>
                        <p className="text-gray-500 text-xs mt-1">Click to analyze</p>
                      </div>
                      <TrendingUp size={16} className="text-gray-600 group-hover:text-blue-400 transition mt-1" />
                    </div>
                    <button onClick={e => { e.stopPropagation(); remove(s) }}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all p-1">
                      <X size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
