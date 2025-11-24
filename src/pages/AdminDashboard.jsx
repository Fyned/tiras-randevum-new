import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function AdminDashboard() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [myShops, setMyShops] = useState([])
  const [selectedShopId, setSelectedShopId] = useState(null)
  
  // Form verileri
  const [shopName, setShopName] = useState(''); const [shopSlug, setShopSlug] = useState('')
  const [barberName, setBarberName] = useState(''); const [serviceName, setServiceName] = useState('')
  const [servicePrice, setServicePrice] = useState(''); const [serviceDuration, setServiceDuration] = useState('30')
  const [barbers, setBarbers] = useState([]); const [services, setServices] = useState([])

  useEffect(() => {
    if (!session) navigate('/login')
    else checkUserRole()
  }, [session])

  const checkUserRole = async () => {
    setLoading(true)
    const { data: profile } = await supabase.from('user_profiles').select('role').eq('auth_user_id', session.user.id).single()
    if (profile && profile.role === 'admin') {
      setIsAdmin(true); fetchShops();
    } else {
      alert("Yetkisiz Giriş"); navigate('/');
    }
    setLoading(false)
  }

  const fetchShops = async () => { const { data } = await supabase.from('shops').select('*').order('id', { ascending: false }); setMyShops(data || []); }
  
  const fetchShopDetails = async (shopId) => {
    setSelectedShopId(shopId)
    const { data: b } = await supabase.from('barbers').select('*').eq('shop_id', shopId)
    const { data: s } = await supabase.from('services').select('*').eq('shop_id', shopId)
    setBarbers(b || []); setServices(s || [])
  }

  // --- ACTIONS (Kısaltıldı, mantık aynı) ---
  const createShop = async (e) => {
    e.preventDefault(); const code = 'TR-'+Math.floor(1000+Math.random()*9000)
    const {data, error} = await supabase.from('shops').insert([{name: shopName, slug: shopSlug, owner_user_id: session.user.id, public_code: code}]).select().single()
    if(!error) { setMyShops([data, ...myShops]); setShopName(''); setShopSlug(''); }
  }
  const addBarber = async (e) => {
    e.preventDefault(); const {data} = await supabase.from('barbers').insert([{shop_id: selectedShopId, full_name: barberName}]).select().single()
    if(data) { setBarbers([...barbers, data]); setBarberName(''); }
  }
  const addService = async (e) => {
    e.preventDefault(); const {data} = await supabase.from('services').insert([{shop_id: selectedShopId, name: serviceName, price: parseFloat(servicePrice), duration_min: parseInt(serviceDuration)}]).select().single()
    if(data) { setServices([...services, data]); setServiceName(''); setServicePrice(''); }
  }

  if (loading) return <div className="text-white text-center mt-20">Yükleniyor...</div>
  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-white">🔧 Süper Admin Paneli</h1>

        {/* DÜKKAN OLUŞTUR */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl mb-8">
          <h3 className="text-lg font-bold mb-4 text-blue-400">➕ Yeni Dükkan Oluştur</h3>
          <form onSubmit={createShop} className="flex gap-4">
            <input placeholder="Dükkan Adı" value={shopName} onChange={e => setShopName(e.target.value)} className="bg-gray-800 border border-gray-700 text-white p-3 rounded-lg w-full focus:outline-none focus:border-blue-500"/>
            <input placeholder="URL (slug)" value={shopSlug} onChange={e => setShopSlug(e.target.value)} className="bg-gray-800 border border-gray-700 text-white p-3 rounded-lg w-full focus:outline-none focus:border-blue-500"/>
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-lg font-bold">Oluştur</button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* SOL MENÜ */}
          <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl h-fit">
            <h3 className="text-gray-400 font-bold mb-4 uppercase text-sm">Dükkan Listesi</h3>
            <ul className="space-y-2">
              {myShops.map(shop => (
                <li key={shop.id} onClick={() => fetchShopDetails(shop.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedShopId === shop.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-gray-800 text-gray-300'}`}>
                  <div className="font-bold">{shop.name}</div>
                  <div className="text-xs opacity-70">/salon/{shop.slug}</div>
                </li>
              ))}
            </ul>
          </div>

          {/* SAĞ İÇERİK */}
          <div className="md:col-span-2">
            {!selectedShopId ? <div className="text-gray-500 text-center mt-10">Lütfen soldan bir dükkan seçin.</div> : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                   <h2 className="text-2xl font-bold text-white">{myShops.find(s=>s.id===selectedShopId)?.name}</h2>
                   <a href={`/salon/${myShops.find(s=>s.id===selectedShopId)?.slug}`} target="_blank" className="text-blue-400 underline text-sm">Siteye Git ↗</a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* BERBERLER */}
                   <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
                      <h4 className="font-bold mb-4 text-purple-400">👨‍id Berberler</h4>
                      <ul className="mb-4 space-y-2">{barbers.map(b=><li key={b.id} className="bg-gray-800 p-2 rounded text-sm">{b.full_name}</li>)}</ul>
                      <form onSubmit={addBarber} className="flex gap-2">
                        <input placeholder="Ad Soyad" value={barberName} onChange={e=>setBarberName(e.target.value)} className="bg-gray-800 text-white p-2 rounded w-full text-sm border border-gray-700"/>
                        <button className="bg-purple-600 hover:bg-purple-500 text-white px-3 rounded text-sm">+</button>
                      </form>
                   </div>

                   {/* HİZMETLER */}
                   <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
                      <h4 className="font-bold mb-4 text-green-400">✂️ Hizmetler</h4>
                      <ul className="mb-4 space-y-2 max-h-40 overflow-y-auto">{services.map(s=><li key={s.id} className="bg-gray-800 p-2 rounded text-sm flex justify-between"><span>{s.name}</span> <span className="text-green-400">{s.price}₺</span></li>)}</ul>
                      <form onSubmit={addService} className="space-y-2">
                        <input placeholder="Hizmet Adı" value={serviceName} onChange={e=>setServiceName(e.target.value)} className="bg-gray-800 text-white p-2 rounded w-full text-sm border border-gray-700"/>
                        <div className="flex gap-2">
                          <input placeholder="Fiyat" value={servicePrice} onChange={e=>setServicePrice(e.target.value)} className="bg-gray-800 text-white p-2 rounded w-full text-sm border border-gray-700"/>
                          <input placeholder="Dk" value={serviceDuration} onChange={e=>setServiceDuration(e.target.value)} className="bg-gray-800 text-white p-2 rounded w-full text-sm border border-gray-700"/>
                        </div>
                        <button className="bg-green-600 hover:bg-green-500 text-white w-full py-2 rounded text-sm">Ekle</button>
                      </form>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}