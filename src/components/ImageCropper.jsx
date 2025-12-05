import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { motion, AnimatePresence } from 'framer-motion'
import { getCroppedImg } from '../utils/helpers' // Bu fonksiyonu az sonra ekleyeceğiz

export default function ImageCropper({ imageSrc, isOpen, onClose, onCropComplete }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const onCropChange = (crop) => { setCrop(crop) }
  const onZoomChange = (zoom) => { setZoom(zoom) }

  const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels)
      onCropComplete(croppedImage) // Kesilmiş resmi geri gönder
      onClose()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 z-10 bg-gradient-to-b from-black/50 to-transparent">
                <button onClick={onClose} className="text-white font-bold">İptal</button>
                <span className="text-white font-bold">Fotoğrafı Düzenle</span>
                <button onClick={handleSave} className="text-blue-400 font-bold">Bitti</button>
            </div>

            {/* Cropper Alanı */}
            <div className="relative flex-1 bg-black">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1} // Kare kesim (1:1)
                    onCropChange={onCropChange}
                    onCropComplete={onCropCompleteHandler}
                    onZoomChange={onZoomChange}
                />
            </div>

            {/* Slider */}
            <div className="p-6 bg-black pb-10">
                <p className="text-gray-400 text-xs text-center mb-2">Yakınlaştır / Kaydır</p>
                <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(e.target.value)}
                    className="w-full accent-blue-500"
                />
            </div>
        </div>
      )}
    </AnimatePresence>
  )
}