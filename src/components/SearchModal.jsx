import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../supabase'

export default function UserSearchModal({ isOpen, onClose, onSelectUser }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (query.length > 2) searchUsers()
    else setResults([])
  }, [query])

  const searchUsers = async () => {
    setLoading(true)
    // Sadece 'customer' olanları getir, zaten admin veya berber olanları listeleme
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('role', 'customer') 
      .ilike('email', `%${query}%`) // E-mail'e göre ara (Supabase'de email user_profiles'da yoksa full_name ara)
      // NOT: Eğer user_profiles'da email tutmuyorsan, full_name üzerinden ara: .ilike('full_name', `%${query}%`)
      .limit(5)
    
    // NOT: Gerçek projede auth.users tablosuna erişim kısıtlıdır. 
    // Biz user_profiles tablosuna 'email' kolonu eklemediysek, full_name ile arama yapalım:
    // Eğer user_profiles tablosunda email yoksa, aşağıdaki kodu .ilike('full_name', ...) yap.
    
    if (data) setResults(data)
    setLoading(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          
          <motion.div 
            initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}}
            className="relative w-full max-w-md bg-[#0F172A] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <span className="text-xl">👤</span>
              <input 
                autoFocus placeholder="Kullanıcı ara (Ad Soyad)..." 
                className="bg-transparent w-full text-white outline-none placeholder-gray-500"
                value={query} onChange={e => setQuery(e.target.value)}
              />
              <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="max-h-60 overflow-y-auto p-2">
              {loading && <div className="p-4 text-gray-500 text-center">Aranıyor...</div>}
              {results.length === 0 && query.length > 2 && !loading && <div className="p-4 text-gray-500 text-center">Kullanıcı bulunamadı.</div>}
              
              {results.map(user => (
                <div key={user.id} onClick={() => onSelectUser(user)}
                  className="p-3 hover:bg-white/10 rounded-xl cursor-pointer flex items-center gap-3 transition-colors group">
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-lg">👤</div>
                  <div>
                    <div className="text-white font-medium group-hover:text-blue-400">{user.full_name}</div>
                    <div className="text-xs text-gray-500">Müşteri</div>
                  </div>
                  <button className="ml-auto bg-blue-600 text-xs px-3 py-1 rounded-full text-white">Seç</button>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}