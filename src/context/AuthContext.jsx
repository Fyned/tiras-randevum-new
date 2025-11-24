import React, { createContext, useState, useEffect, useContext } from 'react'
import { supabase } from '../supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Uygulama ilk açıldığında mevcut oturumu kontrol et
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // 2. Oturum değişikliklerini (giriş/çıkış) dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Çıkış Yapma Fonksiyonu
  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, signOut, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

// Kendi hook'umuz (Kullanımı kolaylaştırmak için)
export const useAuth = () => {
  return useContext(AuthContext)
}