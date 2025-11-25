import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { motion } from 'framer-motion'
// Modal bileşenini import etmeyi unutma (Dosyanın src/components klasöründe olduğunu varsayıyorum)
import UserSearchModal from '../components/UserSearchModal'

export default function AdminDashboard() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [myShops, setMyShops] = useState([])
  const [selectedShopId, setSelectedShopId] = useState(null)
  
  // MODAL DURUMU (Yönetici Atama Penceresi)
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false)

  // Form verileri
  const [shopName, setShopName] = useState(''); const [shopSlug, setShopSlug] = useState('')
  const [barberName, setBarberName] = useState(''); const [serviceName, setServiceName] = useState('')
  const [servicePrice, setServicePrice] = useState(''); const [serviceDuration, setServiceDuration] = useState('30')
  const [barbers, setBarbers] = useState([]); const [services, setServices] = useState([])

  useEffect(() => {
    if (!session) navigate('/login')
    else checkUserRole()
  }, [session])

  // --- 1. AKILLI YÖNLENDİRME (REDIRECTOR) ---
  const checkUserRole = async () => {
    setLoading(true)
    const { data: profile } = await supabase.from('user_profiles').select('role').eq('auth_user_id', session.user.id).single()
    
    if (profile) {
        if (profile.role === 'admin') {
            // Admin ise: Hoşgeldin, kalabilirsin.
            setIsAdmin(true); 
            fetchShops();
        } else if (profile.role === 'barber') {
            // Berber ise: Burası senin yerin değil, dükkan paneline git.
            navigate('/shop-panel')
        } else {
            // Müşteri ise: Anasayfaya dön.
            alert("Bu sayfaya giriş yetkiniz yok."); 
            navigate('/');
        }
    } else {
        navigate('/')
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

  // --- ACTIONS ---

  // 2. YÖNETİCİ ATAMA MANTIĞI
  const assignManager = async (user) => {
    if(!confirm(`${user.full_name} isimli kişiyi bu dükkanın yöneticisi yapmak istiyor musun?`)) return;
    
    // A. Dükkanın sahibini (owner_user_id) güncelle
    const { error: shopError } = await supabase.from('shops').update({ owner_user_id: user.auth_user_id }).eq('id', selectedShopId)
    if(shopError) return alert('Hata: ' + shopError.message)

    // B. Kullanıcının rolünü 'barber' yap ki kendi paneline girebilsin
    const { error: roleError } = await supabase.from('user_profiles').update({ role: 'barber' }).eq('id', user.id)
    
    if(!roleError) {
      alert(`✅ ${user.full_name} artık bu dükkanın yöneticisi!`)
      setIsUserSearchOpen(false) // Modalı kapat
      fetchShops() // Listeyi yenile
    } else {
        alert('Rol güncelleme hatası: ' + roleError.message)
    }
  }

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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white/50">Yükleniyor...</div>
  if (!isAdmin) return null

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <Navbar />
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-white inline-block">Komuta Merkezi</h1>
          <p className="text-gray-400 mt-2">Dükkanlarını, ekiplerini ve hizmetlerini buradan yönet.</p>
        </div>

        {/* YENİ DÜKKAN OLUŞTURMA KARTI */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[30px] mb-12 shadow-2xl">
          <h3 className="text-lg font-bold mb-6 text-blue-300 flex items-center gap-2"><span className="bg-blue-500/20 p-2 rounded-lg">➕</span> Yeni Dükkan Ekle</h3>
          <form onSubmit={createShop} className="flex flex-col md:flex-row gap-4">
            <input placeholder="Dükkan Adı (Örn: Stil Berber)" value={shopName} onChange={e => setShopName(e.target.value)} className="flex-1 bg-black/20 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-600"/>
            <input placeholder="URL (slug) (Örn: stil-berber)" value={shopSlug} onChange={e => setShopSlug(e.target.value)} className="flex-1 bg-black/20 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-600"/>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-blue-900/30">Oluştur</motion.button>
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* SOL MENÜ: DÜKKAN LİSTESİ */}
          <div className="lg:col-span-1">
             <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-[30px] h-fit sticky top-24">
              <h3 className="text-gray-400 font-bold mb-4 uppercase text-xs tracking-wider px-2">Dükkanların</h3>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {myShops.map(shop => (
                  <motion.div key={shop.id} onClick={() => fetchShopDetails(shop.id)} whileHover={{ x: 5 }}
                    className={`p-4 rounded-2xl cursor-pointer transition-all border ${selectedShopId === shop.id ? 'bg-gradient-to-r from-blue-600/80 to-indigo-600/80 border-blue-400/30 text-white shadow-lg' : 'bg-white/5 border-transparent hover:bg-white/10 text-gray-300'}`}>
                    <div className="font-bold text-lg">{shop.name}</div>
                    <div className="text-xs opacity-60 font-mono mt-1">/salon/{shop.slug}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* SAĞ İÇERİK: DETAYLAR */}
          <div className="lg:col-span-2">
            {!selectedShopId ? (
              <div className="h-full flex flex-col items-center justify-center bg-white/5 border border-white/5 rounded-[30px] p-12 text-center text-gray-500">
                <span className="text-4xl mb-4 opacity-50">👈</span><p>Yönetmek için soldan bir dükkan seç.</p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                
                {/* DÜKKAN HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 p-6 rounded-[30px] border border-white/10">
                   <div>
                     <h2 className="text-3xl font-bold text-white mb-1">{myShops.find(s=>s.id===selectedShopId)?.name}</h2>
                     <p className="text-green-400 text-sm font-mono">Aktif • {myShops.find(s=>s.id===selectedShopId)?.public_code}</p>
                   </div>
                   
                   <div className="flex items-center gap-3">
                       {/* YÖNETİCİ ATA BUTONU */}
                       <button 
                         onClick={() => setIsUserSearchOpen(true)}
                         className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-4 py-2 rounded-full text-sm hover:bg-orange-500 hover:text-white transition-all flex items-center gap-2"
                       >
                           👑 Yönetici Ata
                       </button>

                       <a href={`/salon/${myShops.find(s=>s.id===selectedShopId)?.slug}`} target="_blank" className="bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2">Canlı Gör ↗</a>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   
                   {/* BERBERLER KARTI */}
                   <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[30px]">
                      <h4 className="font-bold mb-6 text-purple-300 flex items-center gap-2"><span className="bg-purple-500/20 p-2 rounded-lg text-sm">👨‍id</span> Ekip Arkadaşlarım</h4>
                      <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {barbers.length === 0 && <p className="text-gray-600 text-sm italic">Henüz kimse yok.</p>}
                        {barbers.map(b => (
                          <div key={b.id} className="bg-black/20 p-3 rounded-2xl flex items-center gap-3 border border-white/5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-xs">✂️</div>
                            <span className="text-sm text-gray-200">{b.full_name}</span>
                          </div>
                        ))}
                      </div>
                      <form onSubmit={addBarber} className="flex gap-2 mt-auto">
                        <input placeholder="Ad Soyad" value={barberName} onChange={e=>setBarberName(e.target.value)} required className="flex-1 bg-black/20 border border-white/10 text-white p-3 rounded-xl text-sm focus:outline-none focus:border-purple-500 transition-colors"/>
                        <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 rounded-xl text-xl shadow-lg shadow-purple-900/20">+</button>
                      </form>
                   </div>

                   {/* HİZMETLER KARTI */}
                   <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[30px]">
                      <h4 className="font-bold mb-6 text-emerald-300 flex items-center gap-2"><span className="bg-emerald-500/20 p-2 rounded-lg text-sm">✂️</span> Hizmet Menüsü</h4>
                      <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                         {services.map(s => (
                           <div key={s.id} className="bg-black/20 p-3 rounded-2xl flex justify-between items-center border border-white/5">
                             <span className="text-sm text-gray-200">{s.name}</span> 
                             <span className="text-emerald-400 text-xs font-bold bg-emerald-900/20 px-2 py-1 rounded">{s.price}₺</span>
                           </div>
                         ))}
                      </div>
                      <form onSubmit={addService} className="space-y-3 mt-auto">
                        <input placeholder="Hizmet Adı" value={serviceName} onChange={e=>setServiceName(e.target.value)} required className="w-full bg-black/20 border border-white/10 text-white p-3 rounded-xl text-sm focus:outline-none focus:border-emerald-500"/>
                        <div className="flex gap-3">
                          <input placeholder="Fiyat" type="number" value={servicePrice} onChange={e=>setServicePrice(e.target.value)} required className="w-1/2 bg-black/20 border border-white/10 text-white p-3 rounded-xl text-sm focus:outline-none focus:border-emerald-500"/>
                          <input placeholder="Dk" type="number" value={serviceDuration} onChange={e=>setServiceDuration(e.target.value)} required className="w-1/2 bg-black/20 border border-white/10 text-white p-3 rounded-xl text-sm focus:outline-none focus:border-emerald-500"/>
                        </div>
                        <button className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-emerald-900/20">Ekle</button>
                      </form>
                   </div>

                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
      
      {/* 3. MODAL BİLEŞENİ ÇAĞIRMA */}
      <UserSearchModal isOpen={isUserSearchOpen} onClose={() => setIsUserSearchOpen(false)} onSelectUser={assignManager} />
    </div>
  )
}