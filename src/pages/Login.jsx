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
    e.preventDefault()
    setMsg('')
    setLoading(true)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        })
        if (error) throw error
        setMsg('✅ Kayıt başarılı! Giriş yapılıyor...')
        setTimeout(() => window.location.reload(), 1500)
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/')
      }
    } catch (error) {
      setMsg('❌ ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-950 to-black p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="text-center mb-8">
          {/* YENİ LOGO BURADA */}
          <img 
            src="/logo-header.png" 
            alt="Tıraş Randevum" 
            className="h-16 mx-auto mb-4 object-contain"
          />
          <p className="text-gray-400 text-sm">Berberin cebindeki yerini alsın.</p>
        </div>

        {msg && (
          <div className={`p-3 rounded-lg mb-4 text-center text-sm font-bold ${msg.includes('✅') ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
            {msg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          {isSignUp && (
            <div>
              <label className="block text-xs uppercase text-gray-500 font-bold mb-2 ml-1">Ad Soyad</label>
              <input 
                type="text" 
                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-600"
                placeholder="Örn: Ahmet Yılmaz"
                value={fullName} onChange={(e) => setFullName(e.target.value)} required 
              />
            </div>
          )}
          
          <div>
            <label className="block text-xs uppercase text-gray-500 font-bold mb-2 ml-1">E-Posta</label>
            <input 
              type="email" 
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-600"
              value={email} onChange={(e) => setEmail(e.target.value)} required 
            />
          </div>

          <div>
            <label className="block text-xs uppercase text-gray-500 font-bold mb-2 ml-1">Şifre</label>
            <input 
              type="password" 
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-600"
              value={password} onChange={(e) => setPassword(e.target.value)} required 
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transform active:scale-95 transition-all mt-4"
          >
            {loading ? 'İşlem yapılıyor...' : (isSignUp ? '✨ Hemen Kayıt Ol' : '🚀 Giriş Yap')}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-400">
          {isSignUp ? 'Zaten hesabın var mı?' : 'Henüz hesabın yok mu?'}
          <button 
            onClick={() => { setIsSignUp(!isSignUp); setMsg(''); }}
            className="ml-2 text-blue-400 hover:text-blue-300 font-semibold underline decoration-2 underline-offset-4"
          >
            {isSignUp ? 'Giriş Yap' : 'Hesap Oluştur'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}