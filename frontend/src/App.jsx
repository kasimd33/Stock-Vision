import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import StockDetail from './pages/StockDetail'
import Watchlist from './pages/Watchlist'
import Markets from './pages/Markets'
import Portfolio from './pages/Portfolio'
import NewsSentiment from './pages/NewsSentiment'
import Settings from './pages/Settings'
import ChatBot from './components/ChatBot'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-[#060b14] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
    </div>
  )
  return user ? children : <Navigate to="/login" />
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <>
      <Routes>
        <Route path="/"          element={user ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/login"     element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/stock/:symbol" element={<PrivateRoute><StockDetail /></PrivateRoute>} />
        <Route path="/watchlist" element={<PrivateRoute><Watchlist /></PrivateRoute>} />
        <Route path="/markets"   element={<PrivateRoute><Markets /></PrivateRoute>} />
        <Route path="/portfolio" element={<PrivateRoute><Portfolio /></PrivateRoute>} />
        <Route path="/news"      element={<PrivateRoute><NewsSentiment /></PrivateRoute>} />
        <Route path="/settings"  element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="*"          element={<Navigate to="/" />} />
      </Routes>
      {user && <ChatBot />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#0d1420', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', fontSize: '13px' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#0d1420' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#0d1420' } },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
