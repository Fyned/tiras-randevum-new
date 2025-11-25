import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function InstallPwaModal({ isOpen, onClose }) {
  const [os, setOs] = useState('ios') // 'ios' veya 'android'

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-[#1E293B] w-full max-w-md rounded-[30px] p-6 border border-white/10 shadow-2xl text-center overflow-hidden"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
            
            <div className="w-20 h-20 mx-auto bg-white rounded-2xl p-2 mb-4 shadow-lg">
                <img src="/pwa-192x192.png" className="w-full h-full object-cover rounded-xl"/>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">Uygulamayı Yükle</h2>
            <p className="text-gray-400 text-sm mb-6">Daha hızlı erişim ve bildirimler için ana ekranına ekle.</p>

            {/* Sekmeler */}
            <div className="flex bg-black/30 p-1 rounded-xl mb-6">
                <button onClick={()=>setOs('ios')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${os==='ios' ? 'bg-white text-black shadow-lg' : 'text-gray-400'}`}>Apple (iOS)</button>
                <button onClick={()=>setOs('android')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${os==='android' ? 'bg-white text-black shadow-lg' : 'text-gray-400'}`}>Android</button>
            </div>

            {/* İçerik */}
            <div className="text-left bg-white/5 p-4 rounded-2xl border border-white/5">
                {os === 'ios' ? (
                    <ol className="list-decimal list-inside space-y-3 text-sm text-gray-200">
                        <li>Tarayıcının altındaki <strong className="text-blue-400">Paylaş</strong> (Kare ve ok) ikonuna tıkla.</li>
                        <li>Açılan menüyü yukarı kaydır.</li>
                        <li><strong className="text-white bg-gray-700 px-2 py-0.5 rounded">Ana Ekrana Ekle</strong> seçeneğine bas.</li>
                        <li>Sağ üstteki <strong>Ekle</strong> butonuna bas.</li>
                    </ol>
                ) : (
                    <ol className="list-decimal list-inside space-y-3 text-sm text-gray-200">
                        <li>Tarayıcının sağ üstündeki <strong className="text-blue-400">3 Nokta</strong> ikonuna tıkla.</li>
                        <li>Menüden <strong className="text-white bg-gray-700 px-2 py-0.5 rounded">Uygulamayı Yükle</strong> veya <strong className="text-white bg-gray-700 px-2 py-0.5 rounded">Ana Ekrana Ekle</strong> seçeneğini seç.</li>
                        <li>Gelen uyarıda <strong>Yükle</strong> butonuna bas.</li>
                    </ol>
                )}
            </div>

            <button onClick={onClose} className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold">Anladım 👍</button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}