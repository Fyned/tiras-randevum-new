import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabase'
import BookingWizard from '../components/BookingWizard'
import Navbar from '../components/Navbar' // Navbar eklendi

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

      const { data: barberData } = await supabase.from('barbers').select('*').eq('shop_id', shopData.id).eq('is_active', true)
      setBarbers(barberData || [])

      const { data: serviceData } = await supabase.from('services').select('*').eq('shop_id', shopData.id).eq('is_active', true).order('sort_order', { ascending: true })
      setServices(serviceData || [])

    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  if (loading) return <div className="text-center mt-20 text-white">Yükleniyor...</div>
  if (error) return <div className="text-center mt-20 text-red-500"><h2>😕 Ops!</h2><p>{error}</p><Link to="/" className="underline">Anasayfaya Dön</Link></div>

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-20">
      <Navbar />
      
      <div className="max-w-4xl mx-auto p-6">
        {/* ÜST BİLGİ KARTI */}
        <div className="text-center mb-10 p-8 bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-600"></div>
           <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white">{shop.name}</h1>
           <p className="text-gray-400 text-lg mb-6">{shop.address || 'Adres bilgisi girilmemiş.'}</p>
           <button 
             onClick={() => setShowWizard(true)}
             className="bg-white text-gray-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-200 transition-all shadow-lg shadow-white/10"
           >
             📅 Hemen Randevu Al
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* BERBERLER */}
          <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
            <h2 className="text-xl font-bold border-b border-gray-700 pb-4 mb-4 text-blue-400">Ekibimiz</h2>
            <div className="grid grid-cols-3 gap-4">
              {barbers.map(berber => (
                <div key={berber.id} className="text-center">
                  <div className="w-16 h-16 mx-auto bg-gray-700 rounded-full flex items-center justify-center text-2xl mb-2">✂️</div>
                  <span className="text-sm font-medium text-gray-300">{berber.full_name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* HİZMETLER */}
          <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
            <h2 className="text-xl font-bold border-b border-gray-700 pb-4 mb-4 text-purple-400">Hizmetlerimiz</h2>
            <ul className="space-y-3">
              {services.map(service => (
                <li key={service.id} className="flex justify-between items-center p-3 hover:bg-gray-800 rounded-lg transition-colors">
                  <div>
                    <span className="font-medium text-white">{service.name}</span><br/>
                    <small className="text-gray-500">{service.duration_min} dk</small>
                  </div>
                  <div className="font-bold text-green-400">{service.price} TL</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {showWizard && <BookingWizard shop={shop} barbers={barbers} services={services} onClose={() => setShowWizard(false)} />}
    </div>
  )
}