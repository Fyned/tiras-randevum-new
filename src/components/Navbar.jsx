import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navbar() {
  const { session, signOut } = useAuth()
  const { unreadCount, notifications, markAsRead, markAllAsRead, requestPermission, permission } = useNotification()
  const [showNotif, setShowNotif] = useState(false)

  return (
    <>
    <motion.nav 
      initial={{ y: -100 }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 100, damping: 20 }}
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
      className="fixed top-0 left-0 right-0 z-[900] px-4 pb-2 pointer-events-none"
    >
      <div className="pointer-events-auto max-w-6xl mx-auto bg-[#0F172A]/90 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 shadow-lg shadow-black/40 flex justify-between items-center relative">
        
        <Link to="/" className="flex items-center gap-2 group">
           <img src="/logo-header.png" alt="Logo" className="h-8 md:h-10 object-contain" />
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/admin" className="hidden md:block text-sm text-gray-300 hover:text-white transition-colors">Panel</Link>
          
          {session ? (
            <div className="flex items-center gap-3">
              
              {/* BİLDİRİM BUTONU */}
              <button onClick={() => setShowNotif(!showNotif)} className="relative p-2 text-gray-300 hover:text-white">
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">{unreadCount}</span>}
              </button>

              <Link to="/profile" className="flex items-center gap-2 border border-white/10 px-3 py-1.5 rounded-full hover:bg-white/10 bg-white/5">
                <span className="text-lg">👤</span>
                <span className="text-xs text-gray-200 hidden md:block">Profil</span>
              </Link>
              
              <button onClick={signOut} className="bg-red-500/10 hover:bg-red-500 text-red-400 px-3 py-1.5 rounded-full text-xs border border-red-500/20">Çıkış</button>
            </div>
          ) : (
            <Link to="/login">
              <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold">Giriş</button>
            </Link>
          )}
        </div>
      </div>
    </motion.nav>

    {/* BİLDİRİM KUTUSU (MODAL GİBİ AYRILDI - TAŞMA SORUNU ÇÖZÜMÜ) */}
    <AnimatePresence>
      {showNotif && (
        <>
            {/* Arka planı karartıp tıklayınca kapatmayı sağlayan katman */}
            <div className="fixed inset-0 z-[998] bg-transparent" onClick={() => setShowNotif(false)}></div>
            
            <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                // DÜZELTME: Fixed positioning, sağ üst köşeye yakın ama mobil uyumlu
                className="fixed top-24 right-4 w-[90vw] max-w-sm bg-[#1E293B] border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-[999]"
            >
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                    <span className="text-sm font-bold text-white">Bildirimler</span>
                    <button onClick={markAllAsRead} className="text-xs text-blue-400 hover:text-blue-300">Tümünü Oku</button>
                </div>
                
                {permission !== 'granted' && (
                    <div onClick={requestPermission} className="bg-blue-600/20 p-3 text-center cursor-pointer hover:bg-blue-600/30 border-b border-white/5">
                        <p className="text-xs text-blue-300 font-bold">Bildirimlere izin ver 🔊</p>
                    </div>
                )}

                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">Hiç bildiriminiz yok.</div>
                    ) : (
                        notifications.map(n => (
                            <div 
                                key={n.id} 
                                onClick={() => {
                                    markAsRead(n.id);
                                    if (n.link) window.location.href = n.link; // Linke git
                                    setShowNotif(false);
                                }} 
                                className={`p-4 border-b border-white/5 cursor-pointer transition-colors ${n.is_read ? 'opacity-50 bg-transparent' : 'bg-white/5 hover:bg-white/10'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="text-sm font-bold text-white">{n.title}</h4>
                                    <span className="text-[10px] text-gray-500">{new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                <p className="text-xs text-gray-300 leading-relaxed">{n.message}</p>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  )
}