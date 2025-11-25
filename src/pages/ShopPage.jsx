import React, { useEffect, useState, memo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabase'
import BookingWizard from '../components/BookingWizard'
import Navbar from '../components/Navbar'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

// 1. Hero Bölümü (Logo, Başlık, Buton, Takip Et)
const ShopHero = memo(({ shop, onBookClick, isFollowing, onToggleFollow, session }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] p-8 md:p-12 text-center overflow-hidden mb-12"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none"></div>
      
      {/* TAKİP ET BUTONU (Sadece giriş yapmışsa görünür) */}
      {session && (
          <button 
            onClick={onToggleFollow}
            className={`absolute top-6 right-6 p-3 rounded-full transition-all shadow-lg ${
                isFollowing 
                ? 'bg-red-500/20 text-red-500 border border-red-500/50' 
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            {isFollowing ? '❤️ Takipte' : '🤍 Takip Et'}
          </button>
      )}

      {shop.cover_image_url && (
          <img src={shop.cover_image_url} alt={shop.name} loading="lazy" className="w-28 h-28 rounded-full mx-auto mb-6 object-cover border-4 border-white/10 shadow-2xl" />
      )}

      <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-4">
        {shop.name}
      </h1>
      
      <div className="max-w-2xl mx-auto mb-8 space-y-2">
          {shop.description && <p className="text-gray-300 text-lg italic">"{shop.description}"</p>}
          <p className="text-gray-500 text-sm flex items-center justify-center gap-2">📍 {shop.address || 'Adres bilgisi yok'}</p>
      </div>
      
      <motion.button 
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={onBookClick}
        className="bg-white text-black px-10 py-4 rounded-full font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] transition-all"
      >
        📅 Randevu Al
      </motion.button>
    </motion.div>
  )
});

const BarberList = memo(({ barbers }) => (
  <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[30px] p-6 h-full">
    <h2 className="text-2xl font-bold mb-6 text-blue-300">Ekip</h2>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {barbers.map(berber => (
        <div key={berber.id} className="bg-black/20 p-4 rounded-2xl text-center border border-white/5 hover:bg-white/5 transition-colors">
          {berber.avatar_url ? (<img src={berber.avatar_url} alt={berber.full_name} loading="lazy" className="w-14 h-14 mx-auto rounded-full object-cover mb-3 border border-white/10" />) : (<div className="w-14 h-14 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-2xl mb-3 shadow-lg">👨‍id</div>)}
          <div className="text-sm font-medium text-gray-200">{berber.full_name}</div>
        </div>
      ))}
    </div>
  </motion.div>
));

const ServiceList = memo(({ services }) => (
  <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[30px] p-6 h-full">
    <h2 className="text-2xl font-bold mb-6 text-purple-300">Hizmetler</h2>
    <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
      {services.map(service => (
        <div key={service.id} className="flex justify-between items-center p-4 bg-black/20 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors">
          <div><div className="font-medium text-white">{service.name}</div><div className="text-xs text-gray-500">{service.duration_min} dk</div></div>
          <div className="text-green-400 font-bold bg-green-900/20 px-3 py-1 rounded-lg">{service.price} ₺</div>
        </div>
      ))}
    </div>
  </motion.div>
));

const PortfolioGrid = memo(({ items }) => {
  if (items.length === 0) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="mt-12">
      <h3 className="text-2xl font-bold mb-6 text-center text-pink-300">Yaptığımız İşler</h3>
      <div className="grid grid-cols-3 gap-1 md:gap-4">
          {items.map((item) => (
              <div key={item.id} className="relative aspect-square bg-gray-800 overflow-hidden group rounded-lg">
                  {item.media_type === 'video' ? (<video src={item.media_url} controls className="w-full h-full object-cover" />) : (<img src={item.media_url} loading="lazy" alt="Portfolio" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />)}
              </div>
          ))}
      </div>
    </motion.div>
  )
});

export default function ShopPage() {
  const { slug } = useParams()
  const { session } = useAuth()
  
  const [data, setData] = useState({ shop: null, barbers: [], services: [], portfolio: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showWizard, setShowWizard] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => { fetchShopData() }, [slug, session])

  const fetchShopData = async () => {
    try {
      setLoading(true)
      const { data: shopData, error: shopError } = await supabase.from('shops').select('*').eq('slug', slug).single()
      if (shopError || !shopData) throw new Error('Salon bulunamadı!')
      
      const [barbersRes, servicesRes, portfolioRes] = await Promise.all([
        supabase.from('barbers').select('*').eq('shop_id', shopData.id).eq('is_active', true).order('id'),
        supabase.from('services').select('*').eq('shop_id', shopData.id).eq('is_active', true).order('sort_order'),
        supabase.from('portfolio_items').select('*').eq('shop_id', shopData.id).order('created_at', {ascending: false})
      ])

      setData({ shop: shopData, barbers: barbersRes.data || [], services: servicesRes.data || [], portfolio: portfolioRes.data || [] })

      // Takip durumunu kontrol et
      if (session) {
          const { data: followData } = await supabase.from('user_follows').select('*').eq('user_id', session.user.id).eq('shop_id', shopData.id).single()
          setIsFollowing(!!followData)
      }

    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  // Takip Et / Çıkar
  const handleToggleFollow = async () => {
      if (!session) return alert("Takip etmek için giriş yapmalısınız.")
      
      if (isFollowing) {
          await supabase.from('user_follows').delete().eq('user_id', session.user.id).eq('shop_id', data.shop.id)
          setIsFollowing(false)
      } else {
          await supabase.from('user_follows').insert([{ user_id: session.user.id, shop_id: data.shop.id }])
          setIsFollowing(true)
      }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white/50">Yükleniyor...</div>
  if (error) return <div className="text-center mt-40 text-red-400">{error} <br/><Link to="/" className="underline">Anasayfa</Link></div>

  return (
    <div className="pt-24 pb-20 px-4 max-w-5xl mx-auto min-h-screen">
      <Navbar />
      <ShopHero shop={data.shop} onBookClick={() => setShowWizard(true)} isFollowing={isFollowing} onToggleFollow={handleToggleFollow} session={session} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <BarberList barbers={data.barbers} />
        <ServiceList services={data.services} />
      </div>
      <PortfolioGrid items={data.portfolio} />
      {showWizard && (<BookingWizard shop={data.shop} barbers={data.barbers} services={data.services} onClose={() => setShowWizard(false)} />)}
    </div>
  )
}