import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function BarberProfileModal({ barber, isOpen, onClose }) {
  if (!barber) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Arka Plan */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
          />
          
          {/* Kart */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm bg-[#1E293B] border border-white/10 rounded-3xl p-8 shadow-2xl text-center overflow-hidden"
          >
            {/* Kapat */}
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
            
            {/* Avatar */}
            <div className="relative mx-auto w-32 h-32 mb-6">
                <div className="w-full h-full rounded-full p-1 bg-gradient-to-tr from-blue-500 to-purple-600">
                    {barber.avatar_url ? (
                        <img src={barber.avatar_url} className="w-full h-full rounded-full object-cover border-4 border-[#1E293B]" />
                    ) : (
                        <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-5xl">👨‍id</div>
                    )}
                </div>
            </div>

            {/* İsim & Unvan */}
            <h2 className="text-2xl font-bold text-white mb-1">{barber.full_name}</h2>
            <p className="text-blue-400 text-sm font-medium mb-6">Saç & Sakal Uzmanı</p>

            {/* Bio */}
            <div className="bg-white/5 rounded-2xl p-4 text-left mb-6 border border-white/5">
                <p className="text-gray-300 text-sm leading-relaxed">
                    {barber.bio || "Henüz bir biyografi eklenmemiş."}
                </p>
            </div>

            <button 
                onClick={onClose}
                className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
            >
                Tamam
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}