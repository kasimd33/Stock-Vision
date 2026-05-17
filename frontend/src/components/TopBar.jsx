import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

const SUGGESTIONS = [
  'RELIANCE.NS','TCS.NS','INFY.NS','HDFCBANK.NS','ICICIBANK.NS',
  'WIPRO.NS','SBIN.NS','BAJFINANCE.NS','TATAMOTORS.NS','ADANIENT.NS',
  'SUNPHARMA.NS','HINDUNILVR.NS','ITC.NS','MARUTI.NS','NTPC.NS',
]

export default function TopBar({ title, subtitle }) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()
  const ref = useRef()

  const filtered = query.length > 0
    ? SUGGESTIONS.filter(s => s.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : []

  const go = (sym) => {
    setQuery('')
    setFocused(false)
    navigate(`/stock/${sym}`)
  }

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setFocused(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="hidden md:flex items-center justify-between px-8 py-4 border-b border-white/8 bg-[#0a0f1a]/60 backdrop-blur sticky top-0 z-20">
      <div>
        <h1 className="text-lg font-bold text-white">{title}</h1>
        {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div ref={ref} className="relative">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 w-64 focus-within:border-orange-500/50 transition-all">
            <Search size={14} className="text-gray-500 shrink-0" />
            <input
              className="bg-transparent text-white text-sm outline-none placeholder-gray-600 w-full"
              placeholder="Search NSE symbol..."
              value={query}
              onChange={e => setQuery(e.target.value.toUpperCase())}
              onFocus={() => setFocused(true)}
              onKeyDown={e => e.key === 'Enter' && query && go(query)}
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-gray-600 hover:text-gray-400">
                <X size={12} />
              </button>
            )}
          </div>
          <AnimatePresence>
            {focused && filtered.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                className="absolute top-full mt-2 left-0 right-0 glass rounded-xl overflow-hidden shadow-2xl z-50">
                {filtered.map(s => (
                  <button key={s} onClick={() => go(s)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-orange-500/10 hover:text-orange-400 transition-all flex items-center justify-between">
                    <span className="font-medium">{s.replace('.NS','').replace('.BO','')}</span>
                    <span className="text-gray-600 text-xs">{s.includes('.NS') ? 'NSE' : 'BSE'}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notification bell */}
        <button className="relative p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-orange-500 rounded-full" />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-green-500 flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="hidden lg:block">
            <p className="text-white text-xs font-medium leading-none">{user?.name}</p>
            <p className="text-gray-500 text-xs mt-0.5">Investor</p>
          </div>
        </div>
      </div>
    </div>
  )
}
