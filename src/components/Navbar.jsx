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
    <motion.nav 
      initial={{ y: -100 }} 
      animate={{ y: 0 }} 
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      // DÜZELTME: style prop'u ile güvenli alan hesabı (Boşluklara dikkat!)
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 20px)' }}
      className="fixed top-0 left-0 right-0 z-[999] px-4 pb-2 pointer-events-none"
    >
      {/* Menü Kutusu */}
      <div className="pointer-events-auto max-w-6xl mx-auto bg-[#0F172A]/80 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 shadow-lg shadow-black/40 flex justify-between items-center relative">
        
        <Link to="/" className="flex items-center gap-2 group">
           <img src="/logo-header.png" alt="Logo" className="h-8 md:h-10 object-contain group-hover:opacity-80 transition-opacity" />
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/admin" className="hidden md:block text-sm text-gray-300 hover:text-white transition-colors">Panel</Link>
          
          {session ? (
            <div className="flex items-center gap-3">
              
              {/* BİLDİRİM ÇANI */}
              <div className="relative">
                <button onClick={() => setShowNotif(!showNotif)} className="relative p-2 text-gray-300 hover:text-white transition-colors">
                  <span className="text-xl">🔔</span>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">{unreadCount}</span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotif && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-12 w-80 bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                    >
                      <div className="p-3 border-b border-white/10 flex justify-between items-center bg-black/20">
                        <span className="text-sm font-bold text-white">Bildirimler</span>
                        <button onClick={markAllAsRead} className="text-xs text-blue-400 hover:text-blue-300">Tümünü Oku</button>
                      </div>
                      
                      {permission !== 'granted' && (
                        <div onClick={requestPermission} className="bg-blue-600/20 p-2 text-center cursor-pointer hover:bg-blue-600/30">
                          <p className="text-xs text-blue-300">Bildirimleri açmak için tıkla 🔊</p>
                        </div>
                      )}

                      <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 text-sm">Hiç bildirim yok.</div>
                        ) : (
                          notifications.map(n => (
                            <div key={n.id} onClick={() => markAsRead(n.id)} className={`p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${n.is_read ? 'opacity-50' : 'bg-white/5'}`}>
                              <div className="flex justify-between items-start">
                                <h4 className="text-sm font-bold text-white">{n.title}</h4>
                                <span className="text-[10px] text-gray-500">{new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              </div>
                              <p className="text-xs text-gray-400 mt-1">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link to="/profile" className="flex items-center gap-2 border border-white/10 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors bg-white/5">
                <span className="text-lg">👤</span>
                <span className="text-xs text-gray-200 font-medium hidden md:block">Profilim</span>
              </Link>
              
              <button onClick={signOut} className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white px-3 py-1.5 rounded-full text-xs font-medium transition-all border border-red-500/20">Çıkış</button>
            </div>
          ) : (
            <Link to="/login">
              <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.3)]">Giriş</button>
            </Link>
          )}
        </div>
      </div>
    </motion.nav>
  )
}