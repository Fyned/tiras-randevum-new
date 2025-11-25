import React, { useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleAuth = async (e) => {
    e.preventDefault(); setMsg(''); setLoading(true)
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
        if (error) throw error; setMsg('✅ Kayıt başarılı! Yönlendiriliyor...'); setTimeout(() => window.location.reload(), 1500)
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error; navigate('/')
      }
    } catch (error) { setMsg('❌ ' + error.message) } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-20">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[40px] shadow-2xl relative overflow-hidden"
      >
        {/* Dekoratif Işık Efekti */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50 blur-[2px]"></div>
        
        <div className="text-center mb-8">
          <img src="/logo-header.png" alt="Logo" className="h-12 mx-auto mb-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-white">
            {isSignUp ? 'Aramıza Katıl' : 'Hoşgeldin'}
          </h2>
        </div>

        {msg && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-white/10 p-3 rounded-2xl mb-4 text-center text-sm">{msg}</motion.div>}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div className="group">
              <input type="text" placeholder="Ad Soyad" value={fullName} onChange={e => setFullName(e.target.value)} required 
                className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-black/40 transition-all" />
            </div>
          )}
          <input type="email" placeholder="E-Posta" value={email} onChange={e => setEmail(e.target.value)} required 
            className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-black/40 transition-all" />
          
          <input type="password" placeholder="Şifre" value={password} onChange={e => setPassword(e.target.value)} required 
            className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-black/40 transition-all" />

          <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-900/30 mt-2 disabled:opacity-50"
          >
            {loading ? '...' : (isSignUp ? 'Hesap Oluştur' : 'Giriş Yap')}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => {setIsSignUp(!isSignUp); setMsg('')}} className="text-gray-400 hover:text-white text-sm transition-colors">
            {isSignUp ? 'Zaten hesabın var mı? Giriş Yap' : 'Hesabın yok mu? Kayıt Ol'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}