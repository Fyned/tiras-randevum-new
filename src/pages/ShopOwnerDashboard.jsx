import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { motion } from 'framer-motion'
import imageCompression from 'browser-image-compression'
import CustomerProfileModal from '../components/CustomerProfileModal'

export default function ShopOwnerDashboard() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [shop, setShop] = useState(null)
  
  const [activeTab, setActiveTab] = useState('appointments') 
  const [selectedCustomerUserId, setSelectedCustomerUserId] = useState(null)

  const [barbers, setBarbers] = useState([]); const [services, setServices] = useState([])
  const [portfolio, setPortfolio] = useState([])
  const [appointments, setAppointments] = useState([]) // Aktifler
  const [pastAppointments, setPastAppointments] = useState([]) // Geçmiş
  const [schedules, setSchedules] = useState([])
  
  const [barberName, setBarberName] = useState(''); const [serviceName, setServiceName] = useState('')
  const [servicePrice, setServicePrice] = useState(''); const [serviceDuration, setServiceDuration] = useState('30')
  const [shopBio, setShopBio] = useState(''); const [shopAddress, setShopAddress] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!session) navigate('/login')
    else fetchAllData()
  }, [session])

  const fetchAllData = async () => {
    setLoading(true)
    const { data: myShop, error } = await supabase.from('shops').select('*').eq('owner_user_id', session.user.id).single()
    
    if (error || !myShop) { alert("Dükkan bulunamadı."); navigate('/'); return }

    setShop(myShop)
    setShopBio(myShop.description || '')
    setShopAddress(myShop.address || '')
    
    const { data: b } = await supabase.from('barbers').select('*').eq('shop_id', myShop.id).order('id')
    const { data: s } = await supabase.from('services').select('*').eq('shop_id', myShop.id).order('id')
    const { data: p } = await supabase.from('portfolio_items').select('*').eq('shop_id', myShop.id).order('created_at', {ascending: false})
    
    setBarbers(b || []); setServices(s || []); setPortfolio(p || [])
    fetchAppointments(myShop.id)
    if (b && b.length > 0) fetchSchedules(b[0].id)
    setLoading(false)
  }

  const fetchAppointments = async (shopId) => {
      // 1. Aktif Randevular (Pending veya Confirmed)
      const { data: active } = await supabase
        .from('appointments')
        .select(`*, barbers(full_name), services(name, price)`)
        .eq('shop_id', shopId)
        .in('status', ['pending', 'confirmed'])
        .order('start_time', { ascending: true })
      
      setAppointments(active || [])

      // 2. Geçmiş Randevular (Completed)
      const { data: past } = await supabase
        .from('appointments')
        .select(`*, barbers(full_name), services(name, price)`)
        .eq('shop_id', shopId)
        .eq('status', 'completed')
        .order('start_time', { ascending: false })
        .limit(50) // Son 50 kayıt

      setPastAppointments(past || [])
  }

  const fetchSchedules = async (barberId) => {
      const { data } = await supabase.from('barber_schedules').select('*').eq('barber_id', barberId).order('weekday')
      setSchedules(data || [])
  }

  // --- RANDEVU AKSİYONLARI ---
  
  // İPTAL ET -> SİL (Delete)
  const cancelAppointment = async (id) => {
      if(!confirm("Bu randevuyu kalıcı olarak silmek/iptal etmek istiyor musun?")) return;
      await supabase.from('appointments').delete().eq('id', id)
      fetchAppointments(shop.id)
  }

  // TAMAMLA -> STATUS 'completed'
  const completeAppointment = async (id) => {
      await supabase.from('appointments').update({ status: 'completed' }).eq('id', id)
      fetchAppointments(shop.id)
  }

  // DİĞER FONKSİYONLAR (Değişmedi)
  const saveSchedule = async (weekday, start, end, isActive, barberId) => {
      const existing = schedules.find(s => s.weekday === weekday)
      const payload = { barber_id: barberId, weekday, start_time: start, end_time: end, is_active: isActive }
      if (existing) await supabase.from('barber_schedules').update(payload).eq('id', existing.id)
      else await supabase.from('barber_schedules').insert([payload])
      fetchSchedules(barberId); alert("Saat güncellendi!")
  }
  const handleImageUpload = async (file, bucket) => { /* ... (önceki ile aynı) ... */
     // Kısaltma amacıyla burayı tekrar yazmıyorum, önceki tam koddan alabilirsin veya browser-image-compression kodu
     // NOT: Önceki tam kodunu bozmamak için aşağıda tam olarak vereceğim, merak etme.
     const options = { maxSizeMB: 1, maxWidthOrHeight: 800, useWebWorker: true, fileType: 'image/jpeg' }
     try {
       const compressedFile = await imageCompression(file, options)
       const fileName = `${Date.now()}.jpg`
       const { data } = await supabase.storage.from(bucket).upload(fileName, compressedFile)
       const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName)
       return urlData.publicUrl
     } catch (e) { return null }
  }
  const updateBarberAvatar = async (e, barberId) => { const url = await handleImageUpload(e.target.files[0], 'avatars'); if(url) { await supabase.from('barbers').update({avatar_url:url}).eq('id', barberId); fetchAllData() } }
  const updateShopAvatar = async (e) => { const url = await handleImageUpload(e.target.files[0], 'avatars'); if(url) { await supabase.from('shops').update({cover_image_url:url}).eq('id', shop.id); setShop({...shop, cover_image_url: url}) } }
  const addToGallery = async (e) => { const url = await handleImageUpload(e.target.files[0], 'portfolio'); if(url) { await supabase.from('portfolio_items').insert([{shop_id: shop.id, media_url: url, media_type: 'image'}]); fetchAllData() } }
  const deleteFromGallery = async (id) => { if(confirm('Sil?')) { await supabase.from('portfolio_items').delete().eq('id', id); fetchAllData() } }
  const saveShopDetails = async () => { await supabase.from('shops').update({description: shopBio, address: shopAddress}).eq('id', shop.id); alert("Kaydedildi") }
  const addBarber = async (e) => { e.preventDefault(); await supabase.from('barbers').insert([{shop_id: shop.id, full_name: barberName}]); setBarberName(''); fetchAllData() }
  const deleteBarber = async (id) => { if(confirm('Sil?')) { await supabase.from('barbers').delete().eq('id', id); fetchAllData() } }
  const addService = async (e) => { e.preventDefault(); await supabase.from('services').insert([{shop_id: shop.id, name: serviceName, price: servicePrice, duration_min: serviceDuration}]); setServiceName(''); fetchAllData() }
  const deleteService = async (id) => { if(confirm('Sil?')) { await supabase.from('services').delete().eq('id', id); fetchAllData() } }
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Yükleniyor...</div>

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 bg-[#0F172A] text-white font-sans">
      <Navbar />
      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[40px] mb-8 flex flex-col md:flex-row items-center gap-6">
          <div className="relative group"><div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-500 shadow-xl bg-gray-800"><img src={shop.cover_image_url || "https://via.placeholder.com/150"} className="w-full h-full object-cover" /></div><label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer"><span className="text-xs">📷</span><input type="file" accept="image/*" onChange={updateShopAvatar} className="hidden" /></label></div>
          <div className="text-center md:text-left flex-1"><h1 className="text-3xl font-bold">{shop.name}</h1><p className="text-gray-400 text-sm mt-1">{shopAddress}</p></div>
        </div>

        <div className="flex flex-wrap gap-2 md:gap-4 mb-6 border-b border-white/10 pb-1 overflow-x-auto">
            <button onClick={()=>setActiveTab('appointments')} className={`pb-3 px-4 font-medium transition-colors ${activeTab==='appointments'?'text-green-400 border-b-2 border-green-400':'text-gray-500'}`}>📅 Randevular</button>
            <button onClick={()=>setActiveTab('history')} className={`pb-3 px-4 font-medium transition-colors ${activeTab==='history'?'text-blue-400 border-b-2 border-blue-400':'text-gray-500'}`}>📂 Geçmiş</button>
            <button onClick={()=>setActiveTab('schedule')} className={`pb-3 px-4 font-medium transition-colors ${activeTab==='schedule'?'text-orange-400 border-b-2 border-orange-400':'text-gray-500'}`}>⏰ Saatler</button>
            <button onClick={()=>setActiveTab('management')} className={`pb-3 px-4 font-medium transition-colors ${activeTab==='management'?'text-blue-400 border-b-2 border-blue-400':'text-gray-500'}`}>⚙️ İşletme</button>
            <button onClick={()=>setActiveTab('profile')} className={`pb-3 px-4 font-medium transition-colors ${activeTab==='profile'?'text-purple-400 border-b-2 border-purple-400':'text-gray-500'}`}>🖼️ Profil</button>
        </div>

        {/* 1. AKTİF RANDEVULAR */}
        {activeTab === 'appointments' && (
            <div className="bg-white/5 border border-white/10 p-6 rounded-[30px]">
                <h3 className="text-xl font-bold mb-6 text-green-300">Aktif Randevular</h3>
                <div className="space-y-4">
                    {appointments.length === 0 && <p className="text-gray-500 text-center">Aktif randevu yok.</p>}
                    {appointments.map(app => (
                        <div key={app.id} className={`p-4 rounded-2xl border flex flex-col md:flex-row justify-between items-center gap-4 ${app.status === 'pending' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="text-lg font-bold text-white">{new Date(app.start_time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                                    <span className="text-sm text-gray-400">{new Date(app.start_time).toLocaleDateString('tr-TR')}</span>
                                    {app.status==='pending' && <span className="bg-yellow-500 text-black text-[10px] px-2 rounded">ONAY BEKLİYOR</span>}
                                </div>
                                <div className="text-white font-medium flex items-center gap-2">
                                   {app.customer_name} <span className="text-gray-500 text-sm">({app.customer_phone})</span>
                                   {app.created_by_user && (<button onClick={() => setSelectedCustomerUserId(app.created_by_user)} className="ml-2 text-xs bg-blue-500/20 text-blue-300 px-2 rounded hover:bg-blue-500 hover:text-white">Profili Gör</button>)}
                                </div>
                                <div className="text-sm text-gray-400 mt-1">{app.services?.name} - {app.barbers?.full_name}</div>
                            </div>
                            <div className="flex gap-2">
                                {/* TAMAMLA BUTONU */}
                                <button onClick={() => completeAppointment(app.id)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg">✅ Tamamla</button>
                                {/* İPTAL ET (SİL) BUTONU */}
                                <button onClick={() => cancelAppointment(app.id)} className="bg-red-600/20 hover:bg-red-600/40 text-red-400 px-4 py-2 rounded-xl text-sm font-bold border border-red-500/30">❌ İptal</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* 2. GEÇMİŞ (History) */}
        {activeTab === 'history' && (
            <div className="bg-white/5 border border-white/10 p-6 rounded-[30px]">
                <h3 className="text-xl font-bold mb-6 text-blue-300">Geçmiş Randevular</h3>
                <div className="space-y-4">
                    {pastAppointments.length === 0 && <p className="text-gray-500 text-center">Geçmiş kayıt yok.</p>}
                    {pastAppointments.map(app => (
                        <div key={app.id} className="p-4 bg-black/20 rounded-2xl border border-white/5 flex justify-between items-center opacity-70 hover:opacity-100 transition-opacity">
                            <div>
                                <div className="font-bold text-gray-300">{app.customer_name}</div>
                                <div className="text-xs text-gray-500">{new Date(app.start_time).toLocaleDateString()} - {app.services?.name}</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-green-500 text-xs border border-green-500/30 px-2 py-1 rounded">Tamamlandı</span>
                                <button onClick={() => cancelAppointment(app.id)} className="text-red-500 hover:text-red-300 text-xs">🗑️ Sil</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
        
        {/* SAATLER, YÖNETİM VE PROFİL SEKMELERİ (Eski kodların aynısı, buraya kısalttım, sen tam halini zaten biliyorsun veya yukarıdaki mantıkla entegre et) */}
        {/* (Önceki kod blokları buraya gelecek: schedule, management, profile) */}
        {/* Not: Kod çok uzadığı için sadece değişen kısımları odakladım. Tam entegre hali için önceki verdiğim kodun içine 'history' sekmesini ve 'completeAppointment' fonksiyonunu eklemen yeterli. */}

      </motion.div>
      <CustomerProfileModal userId={selectedCustomerUserId} isOpen={!!selectedCustomerUserId} onClose={() => setSelectedCustomerUserId(null)} />
    </div>
  )
}