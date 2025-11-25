import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { motion } from 'framer-motion'

export default function ShopOwnerDashboard() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [shop, setShop] = useState(null)
  
  // Form verileri
  const [barberName, setBarberName] = useState(''); const [serviceName, setServiceName] = useState('')
  const [servicePrice, setServicePrice] = useState(''); const [serviceDuration, setServiceDuration] = useState('30')
  const [barbers, setBarbers] = useState([]); const [services, setServices] = useState([])

  useEffect(() => {
    if (!session) navigate('/login')
    else fetchMyShop()
  }, [session])

  const fetchMyShop = async () => {
    setLoading(true)
    // Oturum açan kişinin sahip olduğu dükkanı bul
    const { data: myShop, error } = await supabase.from('shops').select('*').eq('owner_user_id', session.user.id).single()
    
    if (error || !myShop) {
      alert("Size ait bir dükkan bulunamadı. Lütfen yöneticiyle iletişime geçin.")
      navigate('/')
      return
    }

    setShop(myShop)
    
    // Detayları çek
    const { data: b } = await supabase.from('barbers').select('*').eq('shop_id', myShop.id)
    const { data: s } = await supabase.from('services').select('*').eq('shop_id', myShop.id)
    setBarbers(b || []); setServices(s || [])
    setLoading(false)
  }

  // --- CRUD İŞLEMLERİ ---
  const addBarber = async (e) => {
    e.preventDefault(); 
    const {data, error} = await supabase.from('barbers').insert([{shop_id: shop.id, full_name: barberName}]).select().single()
    if(error) alert(error.message); else { setBarbers([...barbers, data]); setBarberName(''); }
  }
  
  const deleteBarber = async (id) => {
    if(!confirm('Silmek istediğine emin misin?')) return;
    await supabase.from('barbers').delete().eq('id', id)
    setBarbers(barbers.filter(b => b.id !== id))
  }

  const addService = async (e) => {
    e.preventDefault(); 
    const {data, error} = await supabase.from('services').insert([{shop_id: shop.id, name: serviceName, price: parseFloat(servicePrice), duration_min: parseInt(serviceDuration)}]).select().single()
    if(error) alert(error.message); else { setServices([...services, data]); setServiceName(''); setServicePrice(''); }
  }

  const deleteService = async (id) => {
    if(!confirm('Hizmeti silmek istediğine emin misin?')) return;
    await supabase.from('services').delete().eq('id', id)
    setServices(services.filter(s => s.id !== id))
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Yükleniyor...</div>

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <Navbar />
      
      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[40px] mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"></div>
          <h1 className="text-4xl font-bold mb-2">{shop.name}</h1>
          <p className="text-gray-400">Yönetim Paneli</p>
          <div className="mt-4 flex gap-3">
             <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs border border-green-500/20">Aktif</span>
             <a href={`/salon/${shop.slug}`} target="_blank" className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-colors">Sayfayı Gör ↗</a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* BERBER YÖNETİMİ */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[30px]">
              <h3 className="text-xl font-bold mb-6 text-purple-300">Ekip Yönetimi</h3>
              <div className="space-y-3 mb-6">
                {barbers.map(b => (
                  <div key={b.id} className="bg-black/40 p-3 rounded-2xl flex justify-between items-center group">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center">👨‍id</div>
                       <span>{b.full_name}</span>
                    </div>
                    <button onClick={() => deleteBarber(b.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/10 rounded-lg">🗑️</button>
                  </div>
                ))}
              </div>
              <form onSubmit={addBarber} className="flex gap-2">
                <input value={barberName} onChange={e=>setBarberName(e.target.value)} placeholder="Yeni Berber Adı" className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-purple-500 transition-colors" required/>
                <button className="bg-purple-600 hover:bg-purple-500 text-white px-4 rounded-xl shadow-lg shadow-purple-900/40 font-bold">+</button>
              </form>
            </div>

            {/* HİZMET YÖNETİMİ */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[30px]">
              <h3 className="text-xl font-bold mb-6 text-emerald-300">Hizmet Menüsü</h3>
              <div className="space-y-3 mb-6">
                {services.map(s => (
                  <div key={s.id} className="bg-black/40 p-3 rounded-2xl flex justify-between items-center group">
                    <div>
                      <div className="text-sm">{s.name}</div>
                      <div className="text-xs text-gray-500">{s.duration_min} dk</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 font-bold">{s.price}₺</span>
                      <button onClick={() => deleteService(s.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/10 rounded-lg">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={addService} className="space-y-3">
                <input value={serviceName} onChange={e=>setServiceName(e.target.value)} placeholder="Hizmet Adı" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500" required/>
                <div className="flex gap-2">
                  <input type="number" value={servicePrice} onChange={e=>setServicePrice(e.target.value)} placeholder="Fiyat" className="w-1/2 bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500" required/>
                  <input type="number" value={serviceDuration} onChange={e=>setServiceDuration(e.target.value)} placeholder="Süre (dk)" className="w-1/2 bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500" required/>
                </div>
                <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-900/40">Ekle</button>
              </form>
            </div>

        </div>
      </motion.div>
    </div>
  )
}