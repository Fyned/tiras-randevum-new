import React, { useState } from 'react'
import Navbar from '../components/Navbar'
import SearchModal from '../components/SearchModal'
import { motion } from 'framer-motion'

export default function Home() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white">
      <Navbar />

      {/* DÜZELTME BURADA YAPILDI: */}
      {/* 'py-16' yerine 'pt-40 pb-16' yaptık. */}
      {/* Böylece içerik Navbar'ın altından değil, daha aşağıdan başlar. */}
      <main className="max-w-6xl mx-auto px-4 pt-40 pb-16 flex flex-col items-center justify-center min-h-[80vh]">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl w-full"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
            Randevu Almanın <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
              En Kolay Yolu
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-400 mb-10 leading-relaxed">
            Sana en yakın salonu bul, saniyeler içinde randevunu oluştur. <br className="hidden md:block"/>
            Sıra bekleme derdine son ver.
          </p>
          
          {/* iOS STİLİ ARAMA TETİKLEYİCİSİ */}
          <motion.div 
            onClick={() => setIsSearchOpen(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mx-auto max-w-lg bg-white/10 backdrop-blur-md border border-white/10 rounded-full p-2 pl-6 pr-2 flex items-center cursor-pointer shadow-2xl shadow-blue-900/20 hover:bg-white/15 transition-all group"
          >
            <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🏢</span>
            <div className="flex-1 text-left">
              <p className="text-gray-300 text-lg font-medium">Salon ara...</p>
            </div>
            <div className="bg-blue-600 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </motion.div>

        </motion.div>

        {/* Alt Özellikler */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-center w-full"
        >
          <div className="p-6 bg-gray-900/50 rounded-3xl backdrop-blur-sm border border-gray-800 hover:border-gray-700 transition-colors">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="font-bold text-lg mb-2 text-white">Hızlı Randevu</h3>
            <p className="text-gray-400 text-sm">Saniyeler içinde yerini ayırt.</p>
          </div>
          <div className="p-6 bg-gray-900/50 rounded-3xl backdrop-blur-sm border border-gray-800 hover:border-gray-700 transition-colors">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="font-bold text-lg mb-2 text-white">Mobil Uyumlu</h3>
            <p className="text-gray-400 text-sm">Telefonuna uygulama gibi iner.</p>
          </div>
          <div className="p-6 bg-gray-900/50 rounded-3xl backdrop-blur-sm border border-gray-800 hover:border-gray-700 transition-colors">
            <div className="text-4xl mb-4">🔔</div>
            <h3 className="font-bold text-lg mb-2 text-white">Hatırlatıcı</h3>
            <p className="text-gray-400 text-sm">Randevunu asla unutma.</p>
          </div>
        </motion.div>

      </main>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      
    </div>
  )
}