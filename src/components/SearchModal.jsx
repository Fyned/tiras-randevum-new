import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

// Bu bileşen SADECE SALON arar
export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (query.length > 1) {
      searchShops()
    } else {
      setResults([])
    }
  }, [query])

  const searchShops = async () => {
    setLoading(true)
    // SHOPS tablosunda isme göre arama
    const { data, error } = await supabase
      .from('shops')
      .select('id, name, slug, address, cover_image_url')
      .ilike('name', `%${query}%`)
      .limit(5)
    
    if (!error) setResults(data)
    setLoading(false)
  }

  const handleSelect = (slug) => {
    navigate(`/salon/${slug}`)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center pt-24 px-4">
          {/* Arka Plan Blur */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0 bg-black/60 backdrop-blur-md" 
          />

          {/* Arama Kutusu */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: -20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            className="relative w-full max-w-xl bg-[#0F172A] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <span className="text-2xl">🏢</span>
              <input 
                autoFocus 
                placeholder="Salon adı ara (Örn: Musa)..." 
                className="bg-transparent w-full text-white text-lg outline-none placeholder-gray-500"
                value={query} 
                onChange={(e) => setQuery(e.target.value)}
              />
              <button onClick={onClose} className="text-gray-400 hover:text-white px-3 py-1 rounded-full transition-colors">
                Vazgeç
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
              {loading && <div className="p-4 text-gray-500 text-center">Aranıyor...</div>}
              
              {!loading && results.length === 0 && query.length > 1 && (
                <div className="p-4 text-gray-500 text-center">Salon bulunamadı.</div>
              )}

              {results.map((shop) => (
                <div 
                  key={shop.id} 
                  onClick={() => handleSelect(shop.slug)}
                  className="flex items-center p-3 hover:bg-white/10 rounded-2xl cursor-pointer transition-colors group"
                >
                  {/* Salon Avatarı veya İkonu */}
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800 border border-white/10 flex-shrink-0">
                    {shop.cover_image_url ? (
                        <img src={shop.cover_image_url} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">✂️</div>
                    )}
                  </div>
                  
                  <div className="ml-4 flex-1">
                    <h4 className="text-white font-semibold text-lg group-hover:text-blue-400 transition-colors">
                      {shop.name}
                    </h4>
                    <p className="text-gray-400 text-sm truncate max-w-[200px]">
                      {shop.address || 'Adres yok'}
                    </p>
                  </div>
                  
                  <div className="ml-auto text-gray-500 text-sm group-hover:translate-x-1 transition-transform">
                    Git →
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}