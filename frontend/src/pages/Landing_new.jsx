import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, BarChart2, ShieldCheck, Zap, Globe, IndianRupee, Building2 } from 'lucide-react'

const FEATURES = [
  { icon: Brain, title: 'AI Stock Predictions', desc: 'ML models trained on 90-day NSE/BSE price history to forecast next-day prices with confidence scores.' },
  { icon: Brain, title: 'Buy/Sell/Hold Engine', desc: 'Multi-factor AI recommendation combining trend analysis, news sentiment, P/E ratio, and beta risk.' },
  { icon: BarChart2, title: 'Interactive Charts', desc: 'Animated 90-day price history with predicted price overlay, volume bars, and area gradients.' },
  { icon: Globe, title: 'Indian News Sentiment', desc: 'NLP analysis of financial headlines from ET, Moneycontrol, LiveMint to gauge market mood.' },
  { icon: Building2, title: 'NIFTY & SENSEX Live', desc: 'Real-time NIFTY 50, SENSEX, BANK NIFTY, and NIFTY IT index tracking on your dashboard.' },
  { icon: IndianRupee, title: 'INR Native Support', desc: 'All prices, market caps, and stats displayed in Indian Rupees — built for Indian investors.' },
]

const STATS = [
  { value: '5000+', label: 'NSE/BSE Stocks' },
  { value: '₹ INR', label: 'Native Currency' },
  { value: 'NIFTY 50', label: 'Index Tracking' },
  { value: 'AI-Powered', label: 'Recommendations' },
]

const TICKERS = [
  'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK',
  'WIPRO', 'SBIN', 'BAJFINANCE', 'ADANIENT', 'HFCL',
  'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK',
]

const TESTIMONIALS = [
  { name: 'Arjun Sharma', role: 'Retail Investor, Mumbai', text: 'StockVision AI helped me understand NIFTY trends like never before. The Buy/Sell signals are incredibly useful.' },
  { name: 'Priya Nair', role: 'Finance Student, Bangalore', text: 'Perfect for learning about Indian stock markets. The AI predictions and sentiment analysis are eye-opening.' },
  { name: 'Rahul Gupta', role: 'Software Engineer, Delhi', text: 'Finally a platform that shows Indian stocks in INR with real AI insights. Feels like a professional tool.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-green-500 flex items-center justify-center">
            <Brain size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg">StockVision <span className="text-orange-400">AI</span></span>
          <span className="hidden sm:inline text-xs bg-orange-500/15 border border-orange-500/30 text-orange-400 px-2 py-0.5 rounded-full ml-1">India</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-gray-400 hover:text-white text-sm transition">Sign In</Link>
          <Link to="/login" className="bg-gradient-to-r from-orange-500 to-green-500 hover:opacity-90 text-white text-sm font-medium px-4 py-2 rounded-lg transition shadow-lg shadow-orange-500/20">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-orange-600/8 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-green-500/8 rounded-full blur-3xl" />
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-1.5 text-orange-400 text-sm mb-6">
            <span className="text-base">🇮🇳</span>
            Built for Indian Stock Market Investors
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
            Invest Smarter in{' '}
            <span className="bg-gradient-to-r from-orange-400 via-white to-green-400 bg-clip-text text-transparent">
              NSE & BSE
            </span>
            {' '}with AI
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            AI-powered predictions for NIFTY 50 stocks, real-time sentiment from Indian financial news, and Buy/Sell/Hold signals — all in ₹ INR.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login"
              className="bg-gradient-to-r from-orange-500 to-green-500 hover:opacity-90 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-lg shadow-orange-500/20">
              Start Analyzing Free →
            </Link>
            <a href="#features"
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium px-8 py-4 rounded-xl transition-all">
              See Features
            </a>
          </div>

          {/* Index badges */}
          <div className="flex flex-wrap justify-center gap-3 mt-10">
            {[
              { label: 'NIFTY 50', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
              { label: 'SENSEX', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
              { label: 'BANK NIFTY', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
              { label: 'NIFTY IT', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
            ].map(({ label, color, bg }) => (
              <span key={label} className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${bg} ${color}`}>{label}</span>
            ))}
          </div>
        </motion.div>

        {/* Indian ticker tape */}
        <div className="relative mt-14 overflow-hidden">
          <div className="flex gap-4 animate-[ticker_25s_linear_infinite] whitespace-nowrap">
            {[...TICKERS, ...TICKERS].map((t, i) => (
              <span key={i} className="inline-flex items-center gap-2 bg-gray-900 border border-white/10 rounded-lg px-4 py-2 text-sm font-medium text-gray-300">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                {t}
                <span className="text-gray-600 text-xs">.NS</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-white/10 bg-gray-900/40">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(({ value, label }, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="text-center">
              <p className="text-3xl font-extrabold bg-gradient-to-r from-orange-400 to-green-400 bg-clip-text text-transparent">{value}</p>
              <p className="text-gray-400 text-sm mt-1">{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything for Indian Stock Analysis</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Professional AI tools built specifically for NSE & BSE investors.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }} viewport={{ once: true }}
                className="bg-gray-900/80 border border-white/10 rounded-2xl p-6 hover:border-orange-500/30 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-all">
                  <Icon size={20} className="text-orange-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-gray-900/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Search Indian Stock', desc: 'Enter NSE symbol like RELIANCE, TCS, INFY or HDFCBANK', icon: '🔍' },
              { step: '02', title: 'AI Analyzes', desc: 'ML models process 90 days of NSE/BSE price data in seconds', icon: '🤖' },
              { step: '03', title: 'Get ₹ Insights', desc: 'Receive AI prediction, sentiment score & Buy/Sell/Hold signal in INR', icon: '📊' },
            ].map(({ step, title, desc, icon }, i) => (
              <motion.div key={step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="relative">
                <div className="text-4xl mb-4">{icon}</div>
                <div className="text-orange-500/40 font-mono text-xs font-bold mb-2">{step}</div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Trusted by Indian Investors</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ name, role, text }, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="bg-gray-900/80 border border-white/10 rounded-2xl p-6">
                <p className="text-gray-300 text-sm leading-relaxed mb-4">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-green-500 flex items-center justify-center text-white text-sm font-bold">
                    {name[0]}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{name}</p>
                    <p className="text-gray-500 text-xs">{role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto bg-gradient-to-br from-orange-600/15 to-green-500/10 border border-orange-500/20 rounded-3xl p-12 text-center">
          <div className="text-4xl mb-4">🇮🇳</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to invest smarter in India?</h2>
          <p className="text-gray-400 mb-8">Join Indian investors making data-driven decisions with AI-powered NSE & BSE analysis.</p>
          <Link to="/login"
            className="inline-block bg-gradient-to-r from-orange-500 to-green-500 hover:opacity-90 text-white font-semibold px-10 py-4 rounded-xl transition-all shadow-lg shadow-orange-500/20">
            Start Free — No Credit Card →
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-green-500 flex items-center justify-center">
              <Brain size={14} className="text-white" />
            </div>
            <span className="text-white font-bold">StockVision AI India</span>
          </div>
          <div className="flex gap-6 text-gray-500 text-sm">
            <span>NSE • BSE • NIFTY 50 • SENSEX</span>
          </div>
          <p className="text-gray-600 text-xs text-center">For educational purposes only. Not SEBI-registered financial advice.</p>
        </div>
      </footer>
    </div>
  )
}
