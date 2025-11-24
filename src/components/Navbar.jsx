import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'

export default function Navbar() {
  const { session, signOut } = useAuth()

  return (
    <motion.nav 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      // BURASI DEĞİŞTİ: Arka plan koyu (gray-900), altı hafif çizgili (border-gray-800)
      className="bg-gray-900/95 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50"
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          
          {/* SOL TARAF: LOGO */}
          <div className="flex items-center">
            <Link to="/">
              <img 
                src="/logo-header.png" 
                alt="Tıraş Randevum Logo" 
                // Logo boyutu ve efektleri
                className="h-10 md:h-14 w-auto object-contain hover:opacity-80 transition-opacity" 
              />
            </Link>
          </div>

          {/* SAĞ TARAF: LİNKLER */}
          <div className="flex items-center space-x-4">
            <Link to="/admin" className="hidden md:block text-gray-300 hover:text-white font-medium transition-colors">
              Yönetim Paneli
            </Link>
            
            {session ? (
              <div className="flex items-center space-x-4">
                <span className="hidden md:block text-sm text-gray-400 truncate max-w-[150px]">
                  {session.user.email}
                </span>
                <button 
                  onClick={signOut}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg"
                >
                  Çıkış
                </button>
              </div>
            ) : (
              <Link to="/login">
                <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-indigo-500/30">
                  Giriş Yap
                </button>
              </Link>
            )}
          </div>

        </div>
      </div>
    </motion.nav>
  )
}