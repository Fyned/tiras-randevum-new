import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { motion } from 'framer-motion'
import imageCompression from 'browser-image-compression'
import CustomerProfileModal from '../components/CustomerProfileModal'
import QRCodeModal from '../components/QRCodeModal' // YENİ
import ImageCropper from '../components/ImageCropper' // YENİ

export default function ShopOwnerDashboard() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [shop, setShop] = useState(null)
  
  // SEKMELER
  const [activeTab, setActiveTab] = useState('appointments') 
  const [selectedCustomerUserId, setSelectedCustomerUserId] = useState(null)

  // QR ve Kırpma State'leri (YENİ)
  const [showQR, setShowQR] = useState(false)
  const [cropperImg, setCropperImg] = useState(null) 
  const [croppingTarget, setCroppingTarget] = useState(null) // 'shop' | 'barber'
  const [editingBarberId, setEditingBarberId] = useState(null)

  // Veriler
  const [barbers, setBarbers] = useState([]); 
  const [services, setServices] = useState([])
  const [portfolio, setPortfolio] = useState([])
  const [appointments, setAppointments] = useState([])
  const [pastAppointments, setPastAppointments] = useState([])
  const [schedules, setSchedules] = useState([])
  
  // Formlar
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
      const { data: active } = await supabase
        .from('appointments')
        .select(`*, barbers(full_name), services(name, price)`)
        .eq('shop_id', shopId)
        .in('status', ['pending', 'confirmed'])
        .order('start_time', { ascending: true })
      setAppointments(active || [])

      const { data: past } = await supabase
        .from('appointments')
        .select(`*, barbers(full_name), services(name, price)`)
        .eq('shop_id', shopId)
        .eq('status', 'completed')
        .order('start_time', { ascending: false })
        .limit(50)
      setPastAppointments(past || [])
  }

  const fetchSchedules = async (barberId) => {
      const { data } = await supabase.from('barber_schedules').select('*').eq('barber_id', barberId).order('weekday')
      setSchedules(data || [])
  }

  const updateAppointmentStatus = async (id, status) => {
      await supabase.from('appointments').update({ status }).eq('id', id)
      fetchAppointments(shop.id)
  }

  const cancelAppointment = async (id) => {
      if(!confirm("Bu randevuyu kalıcı olarak silmek/iptal etmek istiyor musun?")) return;
      await supabase.from('appointments').delete().eq('id', id)
      fetchAppointments(shop.id)
  }

  const completeAppointment = async (id) => {
      await supabase.from('appointments').update({ status: 'completed' }).eq('id', id)
      fetchAppointments(shop.id)
  }

  const saveSchedule = async (weekday, start, end, isActive, barberId) => {
      const existing = schedules.find(s => s.weekday === weekday)
      const payload = { barber_id: barberId, weekday, start_time: start, end_time: end, is_active: isActive }
      if (existing) await supabase.from('barber_schedules').update(payload).eq('id', existing.id)
      else await supabase.from('barber_schedules').insert([payload])
      fetchSchedules(barberId); alert("Saat güncellendi!")
  }

  // --- Kırpma ve Dosya Seçimi (YENİ) ---
  const onFileSelect = (e, target, id = null) => {
    if (e.target.files && e.target.files.length > 0) {
        const reader = new FileReader()
        reader.addEventListener('load', () => setCropperImg(reader.result))
        reader.readAsDataURL(e.target.files[0])
        setCroppingTarget(target)
        setEditingBarberId(id)
    }
  }

  const onCropComplete = async (croppedFile) => {
    setUploading(true)
    const fileName = `${Date.now()}.jpg`
    // Kırpılan dosya zaten blob olduğu için direkt yüklüyoruz
    const { data, error } = await supabase.storage.from('avatars').upload(fileName, croppedFile)
    
    if (error) {
        alert("Yükleme hatası: " + error.message)
    } else {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
        const publicUrl = urlData.publicUrl

        if (croppingTarget === 'shop') {
            await supabase.from('shops').update({ cover_image_url: publicUrl }).eq('id', shop.id)
            setShop({ ...shop, cover_image_url: publicUrl })
        } else if (croppingTarget === 'barber') {
            await supabase.from('barbers').update({ avatar_url: publicUrl }).eq('id', editingBarberId)
            setBarbers(barbers.map(b => b.id === editingBarberId ? { ...b, avatar_url: publicUrl } : b))
        }
    }
    setUploading(false)
    setCropperImg(null) // Modalı kapat
  }
  // -------------------------------------

  const handleImageUpload = async (file, bucket) => {
    const options = { maxSizeMB: 1, maxWidthOrHeight: 800, useWebWorker: true, fileType: 'image/jpeg' }
    try {
      const compressedFile = await imageCompression(file, options)
      const fileName = `${Date.now()}.jpg`
      const { data, error } = await supabase.storage.from(bucket).upload(fileName, compressedFile)
      if (error) throw error
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName)
      return urlData.publicUrl
    } catch (e) { return null }
  }

  // Galeri için eski yöntemi kullanıyoruz (Kırpma yok, direkt yükle)
  const addToGallery = async (e) => { const url = await handleImageUpload(e.target.files[0], 'portfolio'); if(url) { await supabase.from('portfolio_items').insert([{shop_id: shop.id, media_url: url, media_type: 'image'}]); fetchAllData() } }
  
  const deleteFromGallery = async (id) => { if(!confirm("Sil?")) return; await supabase.from('portfolio_items').delete().eq('id', id); fetchAllData() }
  const saveShopDetails = async () => { await supabase.from('shops').update({ description: shopBio, address: shopAddress }).eq('id', shop.id); alert("Kaydedildi") }
  const addBarber = async (e) => { e.preventDefault(); const {data} = await supabase.from('barbers').insert([{shop_id: shop.id, full_name: barberName}]).select().single(); if(data) {setBarbers([...barbers, data]); setBarberName('')} }
  const deleteBarber = async (id) => { if(confirm('Sil?')) { await supabase.from('barbers').delete().eq('id', id); fetchAllData() } }
  const addService = async (e) => { e.preventDefault(); const {data} = await supabase.from('services').insert([{shop_id: shop.id, name: serviceName, price: parseFloat(servicePrice), duration_min: parseInt(serviceDuration)}]).select().single(); if(data) {setServices([...services, data]); setServiceName(''); setServicePrice('')} }
  const deleteService = async (id) => { if(confirm('Sil?')) { await supabase.from('services').delete().eq('id', id); fetchAllData() } }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Yükleniyor...</div>
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']

  return (
    <div className="min-h-screen pt-36 pb-20 px-4 bg-[#0F172A] text-white font-sans">
      <Navbar />
      
      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[40px] mb-8 flex flex-col md:flex-row items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-500 shadow-xl bg-gray-800">
                <img src={shop.cover_image_url || "https://via.placeholder.com/150"} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer hover:scale-110 transition-transform shadow-lg">
                <span className="text-xs">📷</span>
                {/* DÜZELTME: onFileSelect kullanıldı */}
                <input type="file" accept="image/*" onChange={(e) => onFileSelect(e, 'shop')} className="hidden" disabled={uploading} />
            </label>
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-bold">{shop.name}</h1>
            <p className="text-gray-400 text-sm mt-1">{shopAddress || "Adres girilmemiş"}</p>
            <div className="mt-3 flex gap-2 justify-center md:justify-start">
               <a href={`/salon/${shop.slug}`} target="_blank" className="bg-blue-500/20 text-blue-400 px-4 py-1 rounded-full text-xs border border-blue-500/30 hover:bg-blue-500 hover:text-white transition-colors">Sayfayı Gör ↗</a>
               
               {/* YENİ: QR KOD BUTONU */}
               <button 
                  onClick={() => setShowQR(true)}
                  className="bg-white/10 text-white px-4 py-1 rounded-full text-xs border border-white/20 hover:bg-white hover:text-black transition-colors"
               >
                  QR Kod 📱
               </button>
            </div>
          </div>
        </div>

        {/* SEKMELER */}
        <div className="flex flex-wrap gap-2 md:gap-4 mb-6 border-b border-white/10 pb-1 overflow-x-auto">
            <button onClick={()=>setActiveTab('appointments')} className={`pb-3 px-4 font-medium transition-colors ${activeTab==='appointments' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-500 hover:text-white'}`}>📅 Randevular</button>
            <button onClick={()=>setActiveTab('history')} className={`pb-3 px-4 font-medium transition-colors ${activeTab==='history' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-white'}`}>📂 Geçmiş</button>
            <button onClick={()=>setActiveTab('schedule')} className={`pb-3 px-4 font-medium transition-colors ${activeTab==='schedule' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-500 hover:text-white'}`}>⏰ Saatler</button>
            <button onClick={()=>setActiveTab('management')} className={`pb-3 px-4 font-medium transition-colors ${activeTab==='management' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-white'}`}>⚙️ İşletme</button>
            <button onClick={()=>setActiveTab('profile')} className={`pb-3 px-4 font-medium transition-colors ${activeTab==='profile' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-500 hover:text-white'}`}>🖼️ Profil & Galeri</button>
        </div>

        {/* --- İÇERİKLER --- */}
        
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
                                   {app.created_by_user && (<button onClick={() => setSelectedCustomerUserId(app.created_by_user)} className="ml-2 text-xs bg-blue-500/20 text-blue-300 px-2 rounded hover:bg-blue-500 hover:text-white transition-colors">Profili Gör</button>)}
                                </div>
                                <div className="text-sm text-gray-400 mt-1">{app.services?.name || 'Silinmiş'} - {app.barbers?.full_name || 'Silinmiş'}</div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => completeAppointment(app.id)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg">✅ Tamamla</button>
                                <button onClick={() => cancelAppointment(app.id)} className="bg-red-600/20 hover:bg-red-600/40 text-red-400 px-4 py-2 rounded-xl text-sm font-bold border border-red-500/30">❌ İptal</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* 2. GEÇMİŞ */}
        {activeTab === 'history' && (
            <div className="bg-white/5 border border-white/10 p-6 rounded-[30px]">
                <h3 className="text-xl font-bold mb-6 text-blue-300">Geçmiş Randevular</h3>
                <div className="space-y-4">
                    {pastAppointments.length === 0 && <p className="text-gray-500 text-center">Geçmiş kayıt yok.</p>}
                    {pastAppointments.map(app => (
                        <div key={app.id} className="p-4 bg-black/20 rounded-2xl border border-white/5 flex justify-between items-center opacity-70 hover:opacity-100 transition-opacity">
                            <div>
                                <div className="font-bold text-gray-300">{app.customer_name}</div>
                                <div className="text-xs text-gray-500">{new Date(app.start_time).toLocaleDateString()} - {app.services?.name || 'Silinmiş'}</div>
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

        {/* 3. SAATLER */}
        {activeTab === 'schedule' && (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[30px]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-orange-300">Çalışma Saatleri</h3>
                    <span className="text-sm text-gray-400">Düzenlenen: {barbers[0]?.full_name}</span>
                </div>
                <div className="grid gap-3">
                    {days.map((day, index) => {
                        const schedule = schedules.find(s => s.weekday === index) || { start_time: '09:00', end_time: '21:00', is_active: true }
                        return (
                            <div key={index} className="flex items-center justify-between bg-black/20 p-4 rounded-2xl border border-white/5">
                                <span className="w-24 font-bold text-gray-300">{day}</span>
                                <div className="flex items-center gap-2">
                                    <input type="time" defaultValue={schedule.start_time} id={`start-${index}`} className="bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm"/>
                                    <span>-</span>
                                    <input type="time" defaultValue={schedule.end_time} id={`end-${index}`} className="bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm"/>
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center cursor-pointer">
                                        <input type="checkbox" defaultChecked={schedule.is_active} id={`active-${index}`} className="mr-2 accent-green-500"/>
                                        <span className="text-xs">Açık</span>
                                    </label>
                                    <button 
                                        onClick={() => {
                                            const start = document.getElementById(`start-${index}`).value
                                            const end = document.getElementById(`end-${index}`).value
                                            const active = document.getElementById(`active-${index}`).checked
                                            saveSchedule(index, start, end, active, barbers[0].id)
                                        }}
                                        className="bg-blue-600 px-3 py-1 rounded-lg text-xs text-white"
                                    >Kaydet</button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )}

        {/* 4. İŞLETME YÖNETİMİ */}
        {activeTab === 'management' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* BERBER YÖNETİMİ */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[30px]">
                    <h3 className="text-xl font-bold mb-6 text-blue-300">Ekip Yönetimi</h3>
                    <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {barbers.map(b => (
                        <div key={b.id} className="bg-black/40 p-3 rounded-2xl flex justify-between items-center group">
                            <div className="flex items-center gap-4">
                                <label className="relative w-12 h-12 rounded-full overflow-hidden cursor-pointer group/avatar border border-white/10 bg-gray-700">
                                    {b.avatar_url ? (
                                        <img src={b.avatar_url} className="w-full h-full object-cover" alt={b.full_name} />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-sm">👨‍id</div>
                                    )}
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity"><span className="text-xs">📷</span></div>
                                    {/* DÜZELTME: onFileSelect kullanıldı */}
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => onFileSelect(e, 'barber', b.id)} disabled={uploading} />
                                </label>
                                <span className="font-medium text-gray-200">{b.full_name}</span>
                            </div>
                            <button onClick={() => deleteBarber(b.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/10 rounded-lg">🗑️</button>
                        </div>
                        ))}
                    </div>
                    <form onSubmit={addBarber} className="flex gap-2">
                        <input value={barberName} onChange={e=>setBarberName(e.target.value)} placeholder="Yeni Berber Adı" className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 transition-colors" required/>
                        <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-xl shadow-lg font-bold">+</button>
                    </form>
                </div>

                {/* HİZMET YÖNETİMİ */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[30px]">
                    <h3 className="text-xl font-bold mb-6 text-emerald-300">Hizmet Menüsü</h3>
                    <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto custom-scrollbar">
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
                        <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold shadow-lg">Ekle</button>
                    </form>
                </div>
            </div>
        )}

        {/* 5. PROFİL & GALERİ */}
        {activeTab === 'profile' && (
            <div className="space-y-8">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[30px]">
                    <h3 className="text-xl font-bold mb-4 text-purple-300">Dükkan Bilgileri</h3>
                    <div className="space-y-4">
                        <div><label className="block text-xs text-gray-400 mb-1 ml-1">Bio / Açıklama</label><textarea value={shopBio} onChange={e=>setShopBio(e.target.value)} rows="3" className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-purple-500" placeholder="Müşterilerine kendinden bahset..."></textarea></div>
                        <div><label className="block text-xs text-gray-400 mb-1 ml-1">Açık Adres</label><input value={shopAddress} onChange={e=>setShopAddress(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-purple-500" placeholder="Mahalle, Cadde, No..."/></div>
                        <button onClick={saveShopDetails} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-xl font-bold shadow-lg">Kaydet</button>
                    </div>
                </div>
                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[30px]">
                    <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-pink-300">Galeri & Yaptığın İşler</h3><label className={`bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-xl font-bold text-sm cursor-pointer shadow-lg ${uploading ? 'opacity-50 pointer-events-none':''}`}>{uploading ? 'Yükleniyor...' : '+ Medya Ekle'}<input type="file" accept="image/*,video/*" onChange={addToGallery} className="hidden" /></label></div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {portfolio.length === 0 && <p className="text-gray-500 col-span-full text-center py-8">Henüz fotoğraf yüklemedin.</p>}
                        {portfolio.map(item => (
                            <div key={item.id} className="relative aspect-square group rounded-xl overflow-hidden bg-black/40">
                                {item.media_type === 'video' ? (<video src={item.media_url} className="w-full h-full object-cover" />) : (<img src={item.media_url} className="w-full h-full object-cover" loading="lazy"/>)}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><button onClick={() => deleteFromGallery(item.id)} className="bg-red-600 text-white p-2 rounded-full hover:scale-110 transition-transform">🗑️</button></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

      </motion.div>
      
      {/* MODALLAR */}
      <CustomerProfileModal userId={selectedCustomerUserId} isOpen={!!selectedCustomerUserId} onClose={() => setSelectedCustomerUserId(null)} />
      <QRCodeModal isOpen={showQR} onClose={() => setShowQR(false)} url={`https://tirasrandevum.com/salon/${shop?.slug}`} shopName={shop?.name} />
      <ImageCropper imageSrc={cropperImg} isOpen={!!cropperImg} onClose={() => setCropperImg(null)} onCropComplete={onCropComplete} />
    </div>
  )
}