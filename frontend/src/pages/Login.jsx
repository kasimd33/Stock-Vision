import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { TrendingUp, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isRegister) await register(name, form.email, form.password)
      else await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full bg-white/5 text-white rounded-xl px-4 py-3 border border-white/10 focus:outline-none focus:border-blue-500 focus:bg-white/8 transition placeholder-gray-500 text-sm"

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <TrendingUp size={20} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl">StockVision <span className="text-blue-400">AI</span></span>
          </Link>
          <h2 className="text-2xl font-bold text-white">{isRegister ? 'Create your account' : 'Welcome back'}</h2>
          <p className="text-gray-400 text-sm mt-1">{isRegister ? 'Start analyzing stocks with AI' : 'Sign in to your dashboard'}</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900/80 backdrop-blur border border-white/10 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <input className={inputClass} placeholder="Full Name" value={name}
                  onChange={e => setName(e.target.value)} required />
              </motion.div>
            )}
            <input className={inputClass} placeholder="Email address" type="email"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            <div className="relative">
              <input className={inputClass} placeholder="Password" type={showPw ? 'text' : 'password'}
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isRegister ? 'Creating account...' : 'Signing in...'}
                </span>
              ) : (isRegister ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-gray-400 text-sm">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button onClick={() => setIsRegister(!isRegister)} className="text-blue-400 hover:text-blue-300 font-medium transition">
                {isRegister ? 'Sign In' : 'Create one free'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          For educational purposes only. Not financial advice.
        </p>
      </motion.div>
    </div>
  )
}
