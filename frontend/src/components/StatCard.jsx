import { motion } from 'framer-motion'

export default function StatCard({ label, value, sub, color = 'text-white', delay = 0, icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-gray-900/80 backdrop-blur border border-white/10 rounded-2xl p-5 hover:border-blue-500/30 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-gray-400 text-xs uppercase tracking-wider">{label}</p>
        {icon && <span className="text-gray-600">{icon}</span>}
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </motion.div>
  )
}
