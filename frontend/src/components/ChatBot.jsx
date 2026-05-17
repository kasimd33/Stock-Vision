import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Bot, Trash2, ChevronDown, Sparkles, TrendingUp } from 'lucide-react'
import { chatApi } from '../services/stockApi'

// ── Inline markdown renderer ──────────────────────────────────────────────────
function MdText({ text, streaming }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />
        const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={j} className="text-white font-semibold">{p.slice(2, -2)}</strong>
            : <span key={j}>{p}</span>
        )
        if (line.startsWith('• ') || line.startsWith('- ')) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-orange-400 shrink-0 mt-0.5">•</span>
              <span>{parts}</span>
            </div>
          )
        }
        if (line.startsWith('_') && line.endsWith('_')) {
          return <p key={i} className="text-gray-500 text-xs italic">{line.slice(1, -1)}</p>
        }
        return <p key={i}>{parts}</p>
      })}
      {streaming && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.7, repeat: Infinity }}
          className="inline-block w-0.5 h-3.5 bg-orange-400 ml-0.5 align-middle rounded-full"
        />
      )}
    </div>
  )
}

// ── Thinking dots ─────────────────────────────────────────────────────────────
function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-orange-400"
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }} />
      ))}
    </div>
  )
}

const QUICK = [
  { label: '📊 Market Summary', msg: "Today's market summary" },
  { label: '🔍 Analyze Reliance', msg: 'Analyze Reliance stock' },
  { label: '💡 Should I buy TCS?', msg: 'Should I buy TCS now?' },
  { label: '🏦 Banking Sector', msg: 'How is the banking sector?' },
  { label: '📚 Explain RSI', msg: 'Explain RSI in simple terms' },
  { label: '⚡ Adani Risk', msg: 'What are the risks in Adani stocks?' },
]

const WELCOME = {
  role: 'assistant', streaming: false,
  text: "**Namaste! 🙏 I'm your StockVision AI Assistant.**\n\nI analyze Indian stocks in realtime and provide AI-powered insights.\n\nTry asking:\n• _\"Should I buy Reliance?\"_\n• _\"Today's market summary\"_\n• _\"Explain RSI\"_",
  id: 'welcome',
}

export default function ChatBot() {
  const [open, setOpen]         = useState(false)
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput]       = useState('')
  const [thinking, setThinking] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [unread, setUnread]     = useState(0)
  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)
  const esRef      = useRef(null)   // EventSource ref for cleanup

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150)
      setUnread(0)
    }
  }, [open])

  // Cleanup SSE on unmount
  useEffect(() => () => esRef.current?.close(), [])

  const send = useCallback((text) => {
    const msg = (text ?? input).trim()
    if (!msg || thinking || streaming) return
    setInput('')

    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: msg, id: Date.now() }])
    setThinking(true)

    const token = localStorage.getItem('token')
    const url = `/api/chatbot/stream?token=${encodeURIComponent(token)}&message=${encodeURIComponent(msg)}`

    // Close any existing stream
    esRef.current?.close()

    const botId = Date.now() + 1
    let started = false

    const es = new EventSource(url)
    esRef.current = es

    es.onmessage = (e) => {
      try {
        const { event, data } = JSON.parse(e.data)

        if (event === 'thinking') return

        if (event === 'status') {
          setStatusMsg(data)
          return
        }

        if (event === 'token') {
          if (!started) {
            // First token: replace thinking with streaming message
            started = true
            setThinking(false)
            setStreaming(true)
            setMessages(prev => [...prev, { role: 'assistant', text: data, id: botId, streaming: true }])
          } else {
            // Append token to last message
            setMessages(prev => {
              const copy = [...prev]
              const last = copy[copy.length - 1]
              if (last?.id === botId) {
                copy[copy.length - 1] = { ...last, text: last.text + data }
              }
              return copy
            })
          }
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
          return
        }

        if (event === 'done') {
          setStreaming(false)
          setMessages(prev => {
            const copy = [...prev]
            const last = copy[copy.length - 1]
            if (last?.id === botId) {
              copy[copy.length - 1] = { ...last, streaming: false }
            }
            return copy
          })
          if (!open) setUnread(u => u + 1)
          setStatusMsg('')
          es.close()
        }
      } catch {}
    }

    es.onerror = () => {
      setThinking(false)
      setStreaming(false)
      setStatusMsg('')
      if (!started) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: "I'm having trouble connecting right now. Please try again.",
          id: botId, streaming: false,
        }])
      }
      es.close()
    }
  }, [input, thinking, streaming, open])

  const clearChat = async () => {
    esRef.current?.close()
    setThinking(false)
    setStreaming(false)
    setStatusMsg('')
    try { await chatApi.clear() } catch {}
    setMessages([WELCOME])
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const busy = thinking || streaming

  return (
    <>
      {/* ── Floating button ── */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-xl shadow-orange-500/40 flex items-center justify-center border border-orange-400/30"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <ChevronDown size={22} className="text-white" />
              </motion.div>
            : <motion.div key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Bot size={22} className="text-white" />
              </motion.div>
          }
        </AnimatePresence>
        {unread > 0 && !open && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center shadow-lg">
            {unread}
          </motion.span>
        )}
      </motion.button>

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed bottom-24 right-6 z-50 w-[390px] max-w-[calc(100vw-20px)] flex flex-col rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-white/8"
            style={{ height: '580px', maxHeight: 'calc(100vh - 110px)' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-[#0d1420] border-b border-white/8 shrink-0">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                  <Sparkles size={16} className="text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#0d1420]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm leading-none">StockVision AI</p>
                <p className="text-green-400 text-xs mt-0.5 flex items-center gap-1">
                  {busy
                    ? <><span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse inline-block" /> {statusMsg || 'Analyzing...'}</>
                    : <><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" /> Online · NSE/BSE · Gemini AI</>
                  }
                </p>
              </div>
              <button onClick={clearChat} title="Clear chat"
                className="text-gray-600 hover:text-gray-400 transition p-1.5 rounded-lg hover:bg-white/5">
                <Trash2 size={14} />
              </button>
              <button onClick={() => setOpen(false)}
                className="text-gray-600 hover:text-white transition p-1.5 rounded-lg hover:bg-white/5">
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-[#080d16]">
              {messages.map((msg) => (
                <motion.div key={msg.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <TrendingUp size={12} className="text-orange-400" />
                    </div>
                  )}
                  <div className={`max-w-[86%] rounded-2xl px-3 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-tr-sm shadow-lg shadow-orange-500/20'
                      : 'bg-[#111827] border border-white/8 text-gray-300 rounded-tl-sm'
                  }`}>
                    {msg.role === 'user'
                      ? <p className="text-sm">{msg.text}</p>
                      : <MdText text={msg.text} streaming={msg.streaming} />
                    }
                  </div>
                </motion.div>
              ))}

              {/* Thinking state — before first token arrives */}
              {thinking && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                    <TrendingUp size={12} className="text-orange-400" />
                  </div>
                  <div className="bg-[#111827] border border-white/8 rounded-2xl rounded-tl-sm">
                    <ThinkingDots />
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick actions */}
            <div className="px-3 pt-2 pb-1.5 bg-[#080d16] border-t border-white/5 shrink-0">
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                {QUICK.map(({ label, msg }) => (
                  <button key={label} onClick={() => send(msg)} disabled={busy}
                    className="shrink-0 text-xs px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-orange-500/15 border border-white/8 hover:border-orange-500/30 text-gray-400 hover:text-orange-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all whitespace-nowrap">
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="px-3 py-3 bg-[#0a0f1a] border-t border-white/8 shrink-0">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  disabled={busy}
                  placeholder={busy ? 'AI is responding...' : 'Ask about any NSE/BSE stock...'}
                  rows={1}
                  className="flex-1 bg-white/5 border border-white/10 focus:border-orange-500/40 text-white text-sm rounded-xl px-3 py-2.5 resize-none outline-none placeholder-gray-600 transition-all leading-snug disabled:opacity-50"
                  style={{ maxHeight: '80px' }}
                />
                <motion.button
                  onClick={() => send()}
                  disabled={!input.trim() || busy}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 transition-all shadow-lg shadow-orange-500/25"
                >
                  {busy
                    ? <motion.div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                    : <Send size={14} className="text-white" />
                  }
                </motion.button>
              </div>
              <p className="text-gray-700 text-xs mt-1.5 text-center">Educational purposes only · Not financial advice</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
