import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Trash2, TrendingUp, TrendingDown, Briefcase } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import toast from 'react-hot-toast'

const COLORS = ['#f97316','#22c55e','#3b82f6','#a855f7','#06b6d4','#eab308','#ef4444','#ec4899']

const DEMO = [
  { symbol: 'RELIANCE.NS', qty: 10, avgPrice: 2800, cmp: 3050 },
  { symbol: 'TCS.NS',      qty: 5,  avgPrice: 3600, cmp: 3820 },
  { symbol: 'INFY.NS',     qty: 15, avgPrice: 1450, cmp: 1520 },
  { symbol: 'HDFCBANK.NS', qty: 8,  avgPrice: 1580, cmp: 1640 },
]

export default function Portfolio() {
  const [holdings, setHoldings] = useState(DEMO)
  const [form, setForm] = useState({ symbol: '', qty: '', avgPrice: '' })
  const [showAdd, setShowAdd] = useState(false)
  const navigate = useNavigate()

  const totalInvested = holdings.reduce((s, h) => s + h.qty * h.avgPrice, 0)
  const totalCurrent  = holdings.reduce((s, h) => s + h.qty * h.cmp, 0)
  const totalPnL      = totalCurrent - totalInvested
  const totalPnLPct   = ((totalPnL / totalInvested) * 100).toFixed(2)

  const pieData = holdings.map(h => ({ name: h.symbol.replace('.NS',''), value: h.qty * h.cmp }))

  const addHolding = (e) => {
    e.preventDefault()
    if (!form.symbol || !form.qty || !form.avgPrice) return
    const sym = form.symbol.toUpperCase()
    const entry = { symbol: sym.includes('.') ? sym : sym + '.NS', qty: Number(form.qty), avgPrice: Number(form.avgPrice), cmp: Number(form.avgPrice) }
    setHoldings(p => [...p, entry])
    setForm({ symbol: '', qty: '', avgPrice: '' })
    setShowAdd(false)
    toast.success(`${entry.symbol} added to portfolio`)
  }

  const remove = (symbol) => {
    setHoldings(p => p.filter(h => h.symbol !== symbol))
    toast.success('Holding removed')
  }

  const inputCls = "w-full bg-white/4 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition"

  return (
    <div className="min-h-screen bg-[#060b14] text-white">
      <Sidebar />
      <div className="md:ml-60 flex flex-col min-h-screen">
        <TopBar title="Portfolio" subtitle="Track your NSE/BSE holdings & P&L" />
        <main className="flex-1 px-4 md:px-6 py-6 max-w-5xl mx-auto w-full">

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Invested', value: `₹${totalInvested.toLocaleString('en-IN')}`, color: 'text-white' },
              { label: 'Current Value',  value: `₹${totalCurrent.toLocaleString('en-IN')}`,  color: 'text-blue-400' },
              { label: 'Total P&L',      value: `${totalPnL >= 0 ? '+' : ''}₹${Math.abs(totalPnL).toLocaleString('en-IN')}`, color: totalPnL >= 0 ? 'text-green-400' : 'text-red-400' },
              { label: 'Returns',        value: `${totalPnLPct}%`, color: totalPnL >= 0 ? 'text-green-400' : 'text-red-400' },
            ].map(({ label, value, color }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="glass rounded-2xl p-4">
                <p className="text-gray-500 text-xs mb-1">{label}</p>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Holdings table */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-semibold flex items-center gap-2"><Briefcase size={15} className="text-orange-400" /> Holdings</h2>
                <button onClick={() => setShowAdd(!showAdd)}
                  className="flex items-center gap-1.5 text-xs bg-orange-500/15 border border-orange-500/25 text-orange-400 px-3 py-1.5 rounded-lg hover:bg-orange-500/25 transition">
                  <Plus size={13} /> Add Holding
                </button>
              </div>

              {showAdd && (
                <motion.form onSubmit={addHolding} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-2xl p-4 grid grid-cols-3 gap-3">
                  <input className={inputCls} placeholder="Symbol (e.g. TCS)" value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} />
                  <input className={inputCls} placeholder="Qty" type="number" value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })} />
                  <input className={inputCls} placeholder="Avg Price ₹" type="number" value={form.avgPrice} onChange={e => setForm({ ...form, avgPrice: e.target.value })} />
                  <button type="submit" className="col-span-3 bg-orange-500 hover:bg-orange-400 text-white py-2 rounded-xl text-sm font-medium transition">Add</button>
                </motion.form>
              )}

              <div className="glass rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/8 text-gray-500 text-xs">
                      <th className="text-left px-4 py-3">Stock</th>
                      <th className="text-right px-4 py-3">Qty</th>
                      <th className="text-right px-4 py-3">Avg</th>
                      <th className="text-right px-4 py-3">CMP</th>
                      <th className="text-right px-4 py-3">P&L</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map(({ symbol, qty, avgPrice, cmp }, i) => {
                      const pnl = (cmp - avgPrice) * qty
                      const pnlPct = ((cmp - avgPrice) / avgPrice * 100).toFixed(2)
                      const pos = pnl >= 0
                      return (
                        <motion.tr key={symbol} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                          className="border-b border-white/5 hover:bg-white/3 transition-all cursor-pointer group"
                          onClick={() => navigate(`/stock/${symbol}`)}>
                          <td className="px-4 py-3">
                            <p className="text-white font-semibold group-hover:text-orange-400 transition">{symbol.replace('.NS','')}</p>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-400">{qty}</td>
                          <td className="px-4 py-3 text-right text-gray-400">₹{avgPrice.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 text-right text-white font-medium">₹{cmp.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 text-right">
                            <p className={`font-semibold ${pos ? 'text-green-400' : 'text-red-400'}`}>{pos ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN')}</p>
                            <p className={`text-xs ${pos ? 'text-green-500' : 'text-red-500'}`}>{pos ? '+' : ''}{pnlPct}%</p>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={e => { e.stopPropagation(); remove(symbol) }}
                              className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all">
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pie chart */}
            <div className="space-y-4">
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                className="glass rounded-2xl p-5">
                <h3 className="text-white font-semibold text-sm mb-4">Allocation</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => `₹${Number(v).toLocaleString('en-IN')}`}
                      contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {pieData.map(({ name, value }, i) => (
                    <div key={name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-gray-400">{name}</span>
                      </div>
                      <span className="text-white font-medium">{((value / totalCurrent) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
