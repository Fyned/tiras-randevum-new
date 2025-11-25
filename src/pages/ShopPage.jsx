import React, { useEffect, useState, memo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabase'
import BookingWizard from '../components/BookingWizard'
import Navbar from '../components/Navbar'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

// --- Alt bileşenler aynı (kısaltıldı) ---
const ShopHero = memo(({ shop, onBookClick, isFollowing, onToggleFollow, session }) => { /* ... aynı ... */ return (<div>...</div>)});
const BarberList = memo(({ barbers }) => ( /* ... aynı ... */ <div>...</div>));
const ServiceList = memo(({ services }) => ( /* ... aynı ... */ <div>...</div>));
const PortfolioGrid = memo(({ items }) => { /* ... aynı ... */ return (<div>...</div>)});

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

      if (session) {
          const { data: followData } = await supabase.from('user_follows').select('*').eq('user_id', session.user.id).eq('shop_id', shopData.id).single()
          setIsFollowing(!!followData)
      }

    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

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
    // DÜZELTME: pt-36 ile üst boşluk artırıldı
    <div className="pt-36 pb-20 px-4 max-w-5xl mx-auto min-h-screen">
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