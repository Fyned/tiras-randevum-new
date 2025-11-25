import React, { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import SearchModal from '../components/SearchModal'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase'
import { Link } from 'react-router-dom'

export default function Home() {
  const { session } = useAuth()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  
  // Müşteri Paneli Verileri
  const [followedShops, setFollowedShops] = useState([])
  const [pastAppointments, setPastAppointments] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session) fetchCustomerData()
  }, [session])

  const fetchCustomerData = async () => {
    setLoading(true)
    
    // 1. Takip Edilen Salonlar
    const { data: follows } = await supabase
        .from('user_follows')
        .select('shop:shops(*)') // İlişkili tabloyu çek
        .eq('user_id', session.user.id)
    
    if (follows) setFollowedShops(follows.map(f => f.shop))

    // 2. Geçmiş Randevular (Durumu 'completed' olan veya iptal edilmemiş ama tarihi geçmiş)
    // Not: Tarihi geçmiş sorgusu için client-side filtreleme yapabiliriz veya status check.
    const { data: appointments } = await supabase
        .from('appointments')
        .select('*, shops(name, slug), services(name, price), barbers(full_name)')
        .eq('created_by_user', session.user.id)
        .eq('status', 'completed') // Sadece tamamlanmışları göster (Berberin onayladığı ve bitirdiği)
        .order('start_time', { ascending: false })
        .limit(5)

    if (appointments) setPastAppointments(appointments)
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 pt-40 pb-16 flex flex-col items-center min-h-[80vh]">
        
        {/* ÜST BÖLÜM: ARAMA VE BAŞLIK */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          className="text-center max-w-3xl w-full mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
            Randevu Almanın <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">En Kolay Yolu</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-400 mb-10 leading-relaxed">
            Sana en yakın salonu bul, saniyeler içinde randevunu oluştur.
          </p>
          
          {/* ARAMA ÇUBUĞU */}
          <motion.div 
            onClick={() => setIsSearchOpen(true)}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="mx-auto max-w-lg bg-white/10 backdrop-blur-md border border-white/10 rounded-full p-2 pl-6 pr-2 flex items-center cursor-pointer shadow-2xl shadow-blue-900/20 hover:bg-white/15 transition-all group"
          >
            <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🏢</span>
            <div className="flex-1 text-left"><p className="text-gray-300 text-lg font-medium">Salon ara...</p></div>
            <div className="bg-blue-600 p-3 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg></div>
          </motion.div>
        </motion.div>

        {/* --- GİRİŞ YAPMIŞ KULLANICIYA ÖZEL ALANLAR --- */}
        {session && (
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-10 mb-20">
                
                {/* 1. TAKİP EDİLENLER */}
                {followedShops.length > 0 && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 border border-white/5 rounded-3xl p-6">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">❤️ Takip Ettiklerin</h3>
                        <div className="space-y-3">
                            {followedShops.map(shop => (
                                <Link to={`/salon/${shop.slug}`} key={shop.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors group">
                                    <img src={shop.cover_image_url || 'https://via.placeholder.com/50'} className="w-12 h-12 rounded-full object-cover border border-white/10"/>
                                    <div>
                                        <div className="font-bold text-white group-hover:text-blue-400 transition-colors">{shop.name}</div>
                                        <div className="text-xs text-gray-500">{shop.city || 'Konum yok'}</div>
                                    </div>
                                    <div className="ml-auto text-gray-600">→</div>
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* 2. GEÇMİŞ RANDEVULAR */}
                {pastAppointments.length > 0 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-white/5 border border-white/5 rounded-3xl p-6">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">📜 Geçmiş Randevularım</h3>
                        <div className="space-y-3">
                            {pastAppointments.map(app => (
                                <div key={app.id} className="p-4 bg-black/20 rounded-2xl border border-white/5 flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-gray-200">{app.shops?.name}</div>
                                        <div className="text-xs text-gray-400">{app.services?.name} • {app.barbers?.full_name}</div>
                                        <div className="text-xs text-gray-500 mt-1">{new Date(app.start_time).toLocaleDateString('tr-TR')} {new Date(app.start_time).toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'})}</div>
                                    </div>
                                    <div className="text-green-500 bg-green-500/10 px-2 py-1 rounded text-xs font-bold">Bitti</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        )}

        {/* Alt Özellikler (Sadece ziyaretçilere göster veya aşağı at) */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }} className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center w-full">
            <div className="p-6 bg-gray-900/50 rounded-3xl backdrop-blur-sm border border-gray-800 hover:border-gray-700 transition-colors">
              <div className="text-4xl mb-4">🚀</div><h3 className="font-bold text-lg mb-2 text-white">Hızlı Randevu</h3><p className="text-gray-400 text-sm">Saniyeler içinde yerini ayırt.</p>
            </div>
            <div className="p-6 bg-gray-900/50 rounded-3xl backdrop-blur-sm border border-gray-800 hover:border-gray-700 transition-colors">
              <div className="text-4xl mb-4">📱</div><h3 className="font-bold text-lg mb-2 text-white">Mobil Uyumlu</h3><p className="text-gray-400 text-sm">Telefonuna uygulama gibi iner.</p>
            </div>
            <div className="p-6 bg-gray-900/50 rounded-3xl backdrop-blur-sm border border-gray-800 hover:border-gray-700 transition-colors">
              <div className="text-4xl mb-4">🔔</div><h3 className="font-bold text-lg mb-2 text-white">Hatırlatıcı</h3><p className="text-gray-400 text-sm">Randevunu asla unutma.</p>
            </div>
        </motion.div>

      </main>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  )
}