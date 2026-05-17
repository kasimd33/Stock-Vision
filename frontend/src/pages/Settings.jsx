import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Save } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'profile',       label: 'Profile',        icon: User },
  { id: 'notifications', label: 'Notifications',  icon: Bell },
  { id: 'security',      label: 'Security',        icon: Shield },
  { id: 'appearance',    label: 'Appearance',      icon: Palette },
]

export default function Settings() {
  const { user } = useAuth()
  const [tab, setTab] = useState('profile')
  const [name, setName] = useState(user?.name || '')
  const [email] = useState(user?.email || '')
  const [notifs, setNotifs] = useState({ priceAlerts: true, aiSignals: true, news: false, weekly: true })

  const save = () => toast.success('Settings saved')

  const inputCls = "w-full bg-white/4 border border-white/10 text-white rounded-xl px-4 py-3 text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition"
  const labelCls = "text-gray-400 text-xs mb-1.5 block"

  return (
    <div className="min-h-screen bg-[#060b14] text-white">
      <Sidebar />
      <div className="md:ml-60 flex flex-col min-h-screen">
        <TopBar title="Settings" subtitle="Manage your account preferences" />
        <main className="flex-1 px-4 md:px-6 py-6 max-w-3xl mx-auto w-full">

          <div className="flex gap-1 bg-white/4 border border-white/8 rounded-2xl p-1 mb-6 flex-wrap">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === id ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-white'}`}>
                <Icon size={14} />{label}
              </button>
            ))}
          </div>

          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
            {tab === 'profile' && (
              <div className="space-y-5">
                <h2 className="text-white font-semibold">Profile Information</h2>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-green-500 flex items-center justify-center text-white text-2xl font-bold">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{user?.name}</p>
                    <p className="text-gray-500 text-sm">{user?.email}</p>
                    <span className="text-xs bg-orange-500/15 border border-orange-500/25 text-orange-400 px-2 py-0.5 rounded-full mt-1 inline-block">Retail Investor</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Full Name</label>
                    <input className={inputCls} value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Email Address</label>
                    <input className={inputCls} value={email} disabled />
                  </div>
                  <div>
                    <label className={labelCls}>Default Exchange</label>
                    <select className={inputCls + ' cursor-pointer'}>
                      <option value="NSE">NSE (National Stock Exchange)</option>
                      <option value="BSE">BSE (Bombay Stock Exchange)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Currency</label>
                    <select className={inputCls + ' cursor-pointer'}>
                      <option>₹ INR (Indian Rupee)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {tab === 'notifications' && (
              <div className="space-y-5">
                <h2 className="text-white font-semibold">Notification Preferences</h2>
                {[
                  { key: 'priceAlerts', label: 'Price Alerts', desc: 'Get notified when stocks hit your target price' },
                  { key: 'aiSignals',   label: 'AI Signals',   desc: 'Receive Buy/Sell/Hold signal updates' },
                  { key: 'news',        label: 'News Digest',  desc: 'Daily Indian market news summary' },
                  { key: 'weekly',      label: 'Weekly Report',desc: 'Weekly portfolio performance report' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-white/3 border border-white/8 rounded-xl">
                    <div>
                      <p className="text-white text-sm font-medium">{label}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                    </div>
                    <button onClick={() => setNotifs(p => ({ ...p, [key]: !p[key] }))}
                      className={`w-11 h-6 rounded-full transition-all relative ${notifs[key] ? 'bg-orange-500' : 'bg-gray-700'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${notifs[key] ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {tab === 'security' && (
              <div className="space-y-5">
                <h2 className="text-white font-semibold">Security Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Current Password</label>
                    <input type="password" className={inputCls} placeholder="••••••••" />
                  </div>
                  <div>
                    <label className={labelCls}>New Password</label>
                    <input type="password" className={inputCls} placeholder="••••••••" />
                  </div>
                  <div>
                    <label className={labelCls}>Confirm New Password</label>
                    <input type="password" className={inputCls} placeholder="••••••••" />
                  </div>
                </div>
                <div className="p-4 bg-blue-500/8 border border-blue-500/20 rounded-xl">
                  <p className="text-blue-400 text-xs font-medium mb-1">🔒 Security Tip</p>
                  <p className="text-gray-500 text-xs">Use a strong password with at least 8 characters, including numbers and symbols.</p>
                </div>
              </div>
            )}

            {tab === 'appearance' && (
              <div className="space-y-5">
                <h2 className="text-white font-semibold">Appearance</h2>
                <div>
                  <label className={labelCls}>Theme</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'dark', label: 'Dark (Default)', bg: 'bg-gray-950', active: true },
                      { id: 'darker', label: 'Deep Navy', bg: 'bg-[#060b14]', active: false },
                    ].map(({ id, label, bg, active }) => (
                      <div key={id} className={`border-2 rounded-xl p-3 cursor-pointer transition-all ${active ? 'border-orange-500' : 'border-white/10 hover:border-white/20'}`}>
                        <div className={`${bg} rounded-lg h-12 mb-2 border border-white/10`} />
                        <p className="text-white text-xs font-medium">{label}</p>
                        {active && <p className="text-orange-400 text-xs">Active</p>}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Chart Color</label>
                  <div className="flex gap-2">
                    {['#f97316','#3b82f6','#22c55e','#a855f7','#06b6d4'].map(c => (
                      <button key={c} className="w-8 h-8 rounded-full border-2 border-white/20 hover:border-white/60 transition-all"
                        style={{ background: c }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 pt-5 border-t border-white/8">
              <button onClick={save}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-orange-500/20">
                <Save size={14} /> Save Changes
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
