import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { motion, AnimatePresence } from 'framer-motion'

export default function CustomerProfileModal({ userId, isOpen, onClose }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [zoomImage, setZoomImage] = useState(false) // Fotoğraf büyütme durumu

  useEffect(() => {
    if (isOpen && userId) {
        fetchUser()
    } else {
        setProfile(null)
        setZoomImage(false)
    }
  }, [isOpen, userId])

  const fetchUser = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('auth_user_id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          {/* Arka Plan */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
          />

          {/* Modal Kartı */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
            className="relative bg-[#1E293B] border border-white/10 w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
            
            {loading ? (
                <div className="py-10 text-gray-400">Yükleniyor...</div>
            ) : profile ? (
                <div>
                    {/* AVATAR (Tıklayınca Büyür) */}
                    <div className="relative mx-auto w-28 h-28 mb-4 group">
                        {profile.avatar_url ? (
                            <motion.img 
                                layoutId="avatar"
                                src={profile.avatar_url} 
                                className="w-full h-full rounded-full object-cover border-4 border-blue-500 cursor-zoom-in shadow-lg"
                                onClick={() => setZoomImage(true)}
                            />
                        ) : (
                            <div className="w-full h-full rounded-full bg-gray-700 flex items-center justify-center text-4xl">👤</div>
                        )}
                        {profile.avatar_url && <p className="text-xs text-gray-500 mt-2">Büyütmek için tıkla</p>}
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-1">{profile.full_name}</h2>
                    <p className="text-blue-400 font-medium text-sm mb-6">{profile.phone || 'Telefon yok'}</p>

                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <p className="text-gray-400 text-sm">Kullanıcı Tipi</p>
                        <p className="text-white font-semibold">Müşteri</p>
                    </div>
                </div>
            ) : (
                <div className="py-10 text-red-400">Profil bulunamadı.</div>
            )}
          </motion.div>

          {/* FOTOĞRAF ZOOM MODU (LightBox) */}
          {zoomImage && profile?.avatar_url && (
              <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={() => setZoomImage(false)}>
                  <motion.img 
                    layoutId="avatar"
                    src={profile.avatar_url} 
                    className="max-w-[90vw] max-h-[80vh] rounded-2xl shadow-2xl border border-white/10 cursor-zoom-out"
                  />
              </div>
          )}

        </div>
      )}
    </AnimatePresence>
  )
}