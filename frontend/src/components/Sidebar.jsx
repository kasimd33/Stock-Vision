import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Brain, Bookmark, LogOut,
  BarChart2, Menu, X, Briefcase, Newspaper, Settings, ChevronRight
} from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const NAV = [
  { label: 'Dashboard',  icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Markets',    icon: BarChart2,        to: '/markets' },
  { label: 'Watchlist',  icon: Bookmark,         to: '/watchlist' },
  { label: 'Portfolio',  icon: Briefcase,        to: '/portfolio' },
  { label: 'News',       icon: Newspaper,        to: '/news' },
]

const BOTTOM_NAV = [
  { label: 'Settings', icon: Settings, to: '/settings' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  const NavLink = ({ label, icon: Icon, to }) => {
    const active = location.pathname === to
    return (
      <Link to={to} onClick={() => setOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
          active
            ? 'bg-gradient-to-r from-orange-500/20 to-transparent text-orange-400 border border-orange-500/25'
            : 'text-gray-500 hover:text-white hover:bg-white/5'
        }`}>
        {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-orange-400 rounded-full" />}
        <Icon size={16} className={active ? 'text-orange-400' : 'text-gray-600 group-hover:text-gray-300'} />
        {label}
        {active && <ChevronRight size={12} className="ml-auto text-orange-400/50" />}
      </Link>
    )
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#080d16] border-r border-white/8">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-green-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Brain size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">StockVision</p>
            <p className="text-orange-400 text-xs font-semibold mt-0.5">AI India 🇮🇳</p>
          </div>
        </div>
      </div>

      {/* Market status pill */}
      <div className="px-4 py-3 border-b border-white/8">
        <MarketPill />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        <p className="text-gray-600 text-xs uppercase tracking-widest px-3 mb-2 mt-1">Menu</p>
        {NAV.map(item => <NavLink key={item.to} {...item} />)}
        <p className="text-gray-600 text-xs uppercase tracking-widest px-3 mb-2 mt-4">Account</p>
        {BOTTOM_NAV.map(item => <NavLink key={item.to} {...item} />)}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/8">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/3 border border-white/8 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-green-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
            <p className="text-gray-600 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/8 transition-all">
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden md:flex flex-col w-60 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#080d16]/95 backdrop-blur border-b border-white/8 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-green-500 flex items-center justify-center">
            <Brain size={14} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm">StockVision <span className="text-orange-400">AI</span> 🇮🇳</span>
        </div>
        <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-white p-1">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-30 bg-black/70 backdrop-blur-sm"
              onClick={() => setOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="md:hidden fixed inset-y-0 left-0 z-40 w-64">
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function MarketPill() {
  const now = new Date()
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const day = ist.getDay()
  const mins = ist.getHours() * 60 + ist.getMinutes()
  const isWeekday = day >= 1 && day <= 5
  const open = isWeekday && mins >= 555 && mins < 930
  const preOpen = isWeekday && mins >= 540 && mins < 555
  const label = open ? 'Market Open' : preOpen ? 'Pre-Open' : 'Closed'
  const time = ist.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST'

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border ${
      open ? 'bg-green-500/8 border-green-500/20 text-green-400' :
      preOpen ? 'bg-yellow-500/8 border-yellow-500/20 text-yellow-400' :
      'bg-gray-800/50 border-gray-700/50 text-gray-500'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-green-400 animate-pulse' : preOpen ? 'bg-yellow-400 animate-pulse' : 'bg-gray-600'}`} />
      <span>{label}</span>
      <span className="ml-auto text-gray-600 text-xs">{time}</span>
    </div>
  )
}
