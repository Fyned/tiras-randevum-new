import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'

export default function Navbar() {
  const { session, signOut } = useAuth()

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed top-4 left-0 right-0 z-50 px-4"
    >
      <div className="max-w-6xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 shadow-lg shadow-black/20 flex justify-between items-center">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2 group">
           <img src="/logo-header.png" alt="Logo" className="h-8 md:h-10 object-contain group-hover:opacity-80 transition-opacity" />
        </Link>

        {/* LİNKLER */}
        <div className="flex items-center gap-4">
          
          {/* TEK DEĞİŞİKLİK BURASI: 
              Link'i sabit olarak /admin yaptık. 
              AdminDashboard.jsx dosyasındaki kod, eğer berber ise onu oradan kovalayacak.
          */}
          <Link to="/admin" className="hidden md:block text-sm text-gray-300 hover:text-white transition-colors">
            Panel
          </Link>
          
          {session ? (
            <div className="flex items-center gap-3">
              <span className="hidden md:block text-xs text-gray-400 border border-white/10 px-3 py-1 rounded-full">
                {session.user.email.split('@')[0]}
              </span>
              <button 
                onClick={signOut}
                className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white px-4 py-2 rounded-full text-sm font-medium transition-all border border-red-500/20"
              >
                Çıkış
              </button>
            </div>
          ) : (
            <Link to="/login">
              <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                Giriş
              </button>
            </Link>
          )}
        </div>
      </div>
    </motion.nav>
  )
}