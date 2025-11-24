import React, { useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('') // Sadece kayıt için
  const [isSignUp, setIsSignUp] = useState(false) // Giriş mi Kayıt mı modu?
  const [msg, setMsg] = useState('')
  const navigate = useNavigate()

  const handleAuth = async (e) => {
    e.preventDefault()
    setMsg('')

    try {
      if (isSignUp) {
        // KAYIT OLMA İŞLEMİ
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName } // Trigger bunu kullanacak
          }
        })
        if (error) throw error
        setMsg('Kayıt başarılı! Lütfen giriş yapın.')
        setIsSignUp(false) // Giriş moduna dön
      } else {
        // GİRİŞ YAPMA İŞLEMİ
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        navigate('/') // Başarılıysa anasayfaya at
      }
    } catch (error) {
      setMsg(error.message)
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc' }}>
      <h2>{isSignUp ? 'Kayıt Ol' : 'Giriş Yap'}</h2>
      
      {msg && <p style={{ color: 'red' }}>{msg}</p>}

      <form onSubmit={handleAuth}>
        {isSignUp && (
          <div style={{ marginBottom: '10px' }}>
            <label>Ad Soyad:</label><br/>
            <input 
              type="text" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              required 
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
        )}
        
        <div style={{ marginBottom: '10px' }}>
          <label>Email:</label><br/>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Şifre:</label><br/>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <button type="submit" style={{ width: '100%', padding: '10px', cursor: 'pointer' }}>
          {isSignUp ? 'Kayıt Ol' : 'Giriş Yap'}
        </button>
      </form>

      <p style={{ marginTop: '10px', textAlign: 'center' }}>
        {isSignUp ? 'Zaten hesabın var mı?' : 'Hesabın yok mu?'}
        {' '}
        <span 
          onClick={() => { setIsSignUp(!isSignUp); setMsg(''); }} 
          style={{ color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {isSignUp ? 'Giriş Yap' : 'Hemen Kayıt Ol'}
        </span>
      </p>
    </div>
  )
}