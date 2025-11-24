import React from 'react'
import Navbar from '../components/Navbar'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Home() {
  return (
    // Ana arka plan: Siyahtan çok koyu griye geçiş
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[80vh]">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl"
        >
          {/* Başlıkta biraz renkli vurgu (Gradient Text) */}
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
            Randevu Almanın <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
              En Kolay Yolu
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-400 mb-10 leading-relaxed">
            Aradığın berberi bul, saniyeler içinde randevunu oluştur. <br className="hidden md:block"/>
            Sıra bekleme derdine son ver.
          </p>
          
          {/* Büyük Buton */}
          <Link to="/salon/musa-coiffeur">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-gray-900 px-10 py-5 rounded-full font-bold text-xl hover:bg-gray-100 transition-colors shadow-2xl shadow-white/10 flex items-center mx-auto gap-3"
            >
              ✂️ Örnek Salonu İncele
            </motion.button>
          </Link>
        </motion.div>

        {/* Alt Kısım - İstatistikler veya Özellikler (Süs) */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
        >
          <div className="p-6 bg-gray-800/50 rounded-2xl backdrop-blur-sm border border-gray-700">
            <div className="text-3xl mb-2">🚀</div>
            <h3 className="font-bold text-lg">Hızlı Randevu</h3>
            <p className="text-gray-400 text-sm">Saniyeler içinde yerini ayırt.</p>
          </div>
          <div className="p-6 bg-gray-800/50 rounded-2xl backdrop-blur-sm border border-gray-700">
            <div className="text-3xl mb-2">📱</div>
            <h3 className="font-bold text-lg">Mobil Uyumlu</h3>
            <p className="text-gray-400 text-sm">Telefonuna uygulama gibi iner.</p>
          </div>
          <div className="p-6 bg-gray-800/50 rounded-2xl backdrop-blur-sm border border-gray-700">
            <div className="text-3xl mb-2">🔔</div>
            <h3 className="font-bold text-lg">Hatırlatıcı</h3>
            <p className="text-gray-400 text-sm">Randevunu asla unutma.</p>
          </div>
        </motion.div>

      </main>
    </div>
  )
}