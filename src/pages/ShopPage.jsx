import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabase'
import BookingWizard from '../components/BookingWizard'
import Navbar from '../components/Navbar'
import { motion } from 'framer-motion'

export default function ShopPage() {
  const { slug } = useParams()
  const [shop, setShop] = useState(null)
  const [barbers, setBarbers] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showWizard, setShowWizard] = useState(false)

  useEffect(() => { fetchShopData() }, [slug])

  const fetchShopData = async () => {
    try {
      setLoading(true)
      const { data: shopData, error: shopError } = await supabase.from('shops').select('*').eq('slug', slug).single()
      if (shopError || !shopData) throw new Error('Salon bulunamadı!')
      setShop(shopData)
      const { data: b } = await supabase.from('barbers').select('*').eq('shop_id', shopData.id).eq('is_active', true)
      setBarbers(b || [])
      const { data: s } = await supabase.from('services').select('*').eq('shop_id', shopData.id).eq('is_active', true).order('sort_order', { ascending: true })
      setServices(s || [])
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white/50">Yükleniyor...</div>
  if (error) return <div className="text-center mt-40 text-red-400">{error}</div>

  return (
    <div className="pt-24 pb-20 px-4 max-w-5xl mx-auto">
      <Navbar />

      {/* HERO SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] p-8 md:p-12 text-center overflow-hidden mb-12"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none"></div>
        <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-4">{shop.name}</h1>
        <p className="text-gray-400 text-lg mb-8 flex items-center justify-center gap-2">
          📍 {shop.address || 'Adres bilgisi yok'}
        </p>
        
        <motion.button 
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowWizard(true)}
          className="bg-white text-black px-10 py-4 rounded-full font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] transition-all"
        >
          📅 Randevu Al
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* BERBERLER */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[30px] p-6"
        >
          <h2 className="text-2xl font-bold mb-6 text-blue-300">Ekip</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {barbers.map(berber => (
              <motion.div key={berber.id} whileHover={{ y: -5 }} className="bg-black/20 p-4 rounded-2xl text-center border border-white/5">
                <div className="w-14 h-14 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-2xl mb-3 shadow-lg">
                  👨‍id
                </div>
                <div className="text-sm font-medium text-gray-200">{berber.full_name}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* HİZMETLER */}
        <motion.div 
          initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[30px] p-6"
        >
          <h2 className="text-2xl font-bold mb-6 text-purple-300">Hizmetler</h2>
          <div className="space-y-3">
            {services.map(service => (
              <div key={service.id} className="flex justify-between items-center p-4 bg-black/20 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors">
                <div>
                  <div className="font-medium text-white">{service.name}</div>
                  <div className="text-xs text-gray-500">{service.duration_min} dakika</div>
                </div>
                <div className="text-green-400 font-bold bg-green-900/20 px-3 py-1 rounded-lg">
                  {service.price} ₺
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {showWizard && <BookingWizard shop={shop} barbers={barbers} services={services} onClose={() => setShowWizard(false)} />}
    </div>
  )
}