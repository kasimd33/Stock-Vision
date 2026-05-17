import { motion } from 'framer-motion'
import { AlertTriangle, WifiOff, Clock, Search, ServerCrash, RefreshCw } from 'lucide-react'

const ERROR_CONFIG = {
  not_found: {
    icon: Search,
    title: 'Symbol Not Found',
    color: 'text-orange-400',
    bg: 'bg-orange-500/8 border-orange-500/20',
    hint: 'Try adding .NS for NSE (e.g. RELIANCE.NS) or .BO for BSE.',
  },
  timeout: {
    icon: Clock,
    title: 'Request Timed Out',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/8 border-yellow-500/20',
    hint: 'Yahoo Finance may be slow. Please try again in a moment.',
  },
  network: {
    icon: WifiOff,
    title: 'Network Error',
    color: 'text-red-400',
    bg: 'bg-red-500/8 border-red-500/20',
    hint: 'Check your internet connection and try again.',
  },
  rate_limit: {
    icon: Clock,
    title: 'Too Many Requests',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/8 border-yellow-500/20',
    hint: 'Please wait 30 seconds before trying again.',
  },
  unavailable: {
    icon: ServerCrash,
    title: 'Market Data Unavailable',
    color: 'text-red-400',
    bg: 'bg-red-500/8 border-red-500/20',
    hint: 'The data provider is temporarily unavailable. Retrying automatically...',
  },
  server: {
    icon: AlertTriangle,
    title: 'Something Went Wrong',
    color: 'text-red-400',
    bg: 'bg-red-500/8 border-red-500/20',
    hint: 'An unexpected error occurred. Please try again.',
  },
}

export default function ErrorState({ error, onRetry, symbol }) {
  const cfg = ERROR_CONFIG[error?.type] || ERROR_CONFIG.server
  const Icon = cfg.icon

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className={`border rounded-2xl p-8 text-center max-w-md mx-auto ${cfg.bg}`}>
      <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto mb-4 ${cfg.bg}`}>
        <Icon size={24} className={cfg.color} />
      </div>
      <h3 className={`text-lg font-bold mb-2 ${cfg.color}`}>{cfg.title}</h3>
      <p className="text-gray-400 text-sm mb-2 leading-relaxed">{error?.message}</p>
      <p className="text-gray-600 text-xs mb-6">{cfg.hint}</p>
      {symbol && (
        <p className="text-gray-600 text-xs mb-4">
          Symbol searched: <span className="text-gray-400 font-mono">{symbol}</span>
        </p>
      )}
      {onRetry && (
        <button onClick={onRetry}
          className="flex items-center gap-2 mx-auto bg-white/8 hover:bg-white/12 border border-white/15 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all">
          <RefreshCw size={14} /> Try Again
        </button>
      )}
    </motion.div>
  )
}
