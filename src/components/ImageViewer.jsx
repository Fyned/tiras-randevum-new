import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ImageViewer({ src, alt, isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && src && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4" onClick={onClose}>
          {/* Kapatma Butonu */}
          <button className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 rounded-full p-2 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Resim */}
          <motion.img 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            src={src} 
            alt={alt || 'Görsel'}
            className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain pointer-events-none select-none"
            onClick={(e) => e.stopPropagation()} // Resme basınca kapanmasın
          />
        </div>
      )}
    </AnimatePresence>
  )
}