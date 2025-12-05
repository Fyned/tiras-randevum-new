import React, { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { motion, AnimatePresence } from 'framer-motion'

export default function QRCodeModal({ isOpen, onClose, url, shopName }) {
  const qrRef = useRef()

  const downloadQR = () => {
    const canvas = qrRef.current.querySelector('canvas')
    const image = canvas.toDataURL("image/png")
    const link = document.createElement('a')
    link.href = image
    link.download = `${shopName}-QR.png`
    link.click()
  }

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
            className="relative bg-white w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl overflow-hidden"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{shopName}</h2>
            <p className="text-gray-500 text-sm mb-6">Müşterilerin bu kodu okutarak randevu alabilir.</p>

            <div ref={qrRef} className="bg-white p-4 rounded-xl border-2 border-gray-100 inline-block mb-6 shadow-inner">
                <QRCodeCanvas 
                    value={url} 
                    size={200} 
                    bgColor={"#ffffff"}
                    fgColor={"#000000"}
                    level={"H"}
                    includeMargin={true}
                    imageSettings={{
                        src: "/pwa-192x192.png",
                        x: undefined,
                        y: undefined,
                        height: 40,
                        width: 40,
                        excavate: true,
                    }}
                />
            </div>

            <button 
                onClick={downloadQR}
                className="w-full bg-black text-white py-3 rounded-xl font-bold shadow-lg hover:bg-gray-800 transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
                📥 İndir / Paylaş
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}