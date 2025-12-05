import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { motion } from 'framer-motion'
import imageCompression from 'browser-image-compression'
import CustomerProfileModal from '../components/CustomerProfileModal'
import QRCodeModal from '../components/QRCodeModal'
import ImageCropper from '../components/ImageCropper'
import UserSearchModal from '../components/UserSearchModal'

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, TouchSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableItem({ id, children, onDelete, onEdit }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 999 : 'auto', opacity: isDragging ? 0.5 : 1, touchAction: 'none' };
    
    return (
        <div ref={setNodeRef} style={style} className="bg-black/40 p-3 rounded-2xl flex justify-between items-center border border-white/5 relative group">
            <div {...attributes} {...listeners} className="mr-2 cursor-grab active:cursor-grabbing text-gray-600 p-2">↕️</div>
            <div className="flex-1 flex items-center gap-3 overflow-hidden">{children}</div>
            <div className="flex items-center gap-1 ml-2">
                 {onEdit && <button onClick={(e)=>{e.stopPropagation(); onEdit()}} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white">✏️</button>}
                 <button onClick={(e)=>{e.stopPropagation(); onDelete()}} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white">🗑️</button>
            </div>
        </div>
    )
}

export default function ShopOwnerDashboard() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [shop, setShop] = useState(null)
  const [activeTab, setActiveTab] = useState('appointments') 
  const [selectedCustomerUserId, setSelectedCustomerUserId] = useState(null)

  const [showQR, setShowQR] = useState(false)
  const [cropperImg, setCropperImg] = useState(null) 
  const [croppingTarget, setCroppingTarget] = useState(null) 
  const [editingBarberId, setEditingBarberId] = useState(null)
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false)
  const [assigningBarberId, setAssigningBarberId] = useState(null)

  const [barbers, setBarbers] = useState([]); 
  const [services, setServices] = useState([])
  const [portfolio, setPortfolio] = useState([])
  const [appointments, setAppointments] = useState([])
  const [pastAppointments, setPastAppointments] = useState([])
  const [schedules, setSchedules] = useState([])
  
  const [barberName, setBarberName] = useState(''); const [serviceName, setServiceName] = useState('')
  const [servicePrice, setServicePrice] = useState(''); const [serviceDuration, setServiceDuration] = useState('30')
  const [shopBio, setShopBio] = useState(''); const [shopAddress, setShopAddress] = useState('')
  const [uploading, setUploading] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }));

  useEffect(() => {
    if (!session) navigate('/login')
    else fetchAllData()
  }, [session])

  const fetchAllData = async () => {
    setLoading(true)
    const { data: myShop, error } = await supabase.from('shops').select('*').eq('owner_user_id', session.user.id).single()
    if (error || !myShop) { alert("Dükkan bulunamadı."); navigate('/'); return }
    setShop(myShop); setShopBio(myShop.description || ''); setShopAddress(myShop.address || '')
    
    const [b, s, p] = await Promise.all([
        supabase.from('barbers').select('*').eq('shop_id', myShop.id).order('sort_order', {ascending: true}),
        supabase.from('services').select('*').eq('shop_id', myShop.id).order('sort_order', {ascending: true}),
        supabase.from('portfolio_items').select('*').eq('shop_id', myShop.id).order('created_at', {ascending: false})
    ])
    setBarbers(b.data || []); setServices(s.data || []); setPortfolio(p.data || [])
    fetchAppointments(myShop.id)
    if (b.data && b.data.length > 0) fetchSchedules(b.data[0].id)
    setLoading(false)
  }

  const fetchAppointments = async (shopId) => {
      const { data: active } = await supabase.from('appointments').select(`*, barbers(full_name), services(name, price)`).eq('shop_id', shopId).in('status', ['pending', 'confirmed']).order('start_time', { ascending: true })
      setAppointments(active || [])
      const { data: past } = await supabase.from('appointments').select(`*, barbers(full_name), services(name, price)`).eq('shop_id', shopId).eq('status', 'completed').order('start_time', { ascending: false }).limit(50)
      setPastAppointments(past || [])
  }
  const fetchSchedules = async (barberId) => { const { data } = await supabase.from('barber_schedules').select('*').eq('barber_id', barberId).order('weekday'); setSchedules(data || []) }
  const updateAppointmentStatus = async (id, status) => { await supabase.from('appointments').update({ status }).eq('id', id); fetchAppointments(shop.id) }
  const cancelAppointment = async (id) => { if(!confirm("Bu randevuyu kalıcı olarak silmek/iptal etmek istiyor musun?")) return; await supabase.from('appointments').delete().eq('id', id); fetchAppointments(shop.id) }
  const completeAppointment = async (id) => { await supabase.from('appointments').update({ status: 'completed' }).eq('id', id); fetchAppointments(shop.id) }
  const saveSchedule = async (weekday, start, end, isActive, barberId) => {
      const existing = schedules.find(s => s.weekday === weekday)
      const payload = { barber_id: barberId, weekday, start_time: start, end_time: end, is_active: isActive }
      if (existing) await supabase.from('barber_schedules').update(payload).eq('id', existing.id)
      else await supabase.from('barber_schedules').insert([payload])
      fetchSchedules(barberId); alert("Saat güncellendi!")
  }

  const handleDragEnd = async (event, type) => {
      const {active, over} = event;
      if (active.id !== over.id) {
          const items = type === 'barber' ? barbers : services;
          const setItems = type === 'barber' ? setBarbers : setServices;
          const table = type === 'barber' ? 'barbers' : 'services';
          const oldIndex = items.findIndex(i => i.id === active.id);
          const newIndex = items.findIndex(i => i.id === over.id);
          const newItems = arrayMove(items, oldIndex, newIndex);
          setItems(newItems);
          const updates = newItems.map((item, index) => ({ id: item.id, sort_order: index }));
          await supabase.from(table).upsert(updates);
      }
  }

  // --- KULLANICI ATAMA (GÜNCELLENEN KISIM) ---
  const assignBarberUser = async (user) => {
    if (!confirm(`${user.full_name} isimli kişiyi bu berber profiline bağlamak istiyor musun?`)) return;
    
    // 1. Berbere kullanıcıyı bağla
    const { error: barberError } = await supabase.from('barbers').update({ auth_user_id: user.auth_user_id }).eq('id', assigningBarberId);
    if (barberError) return alert('Hata: ' + barberError.message);
    
    // 2. Kullanıcı rolünü 'staff' yap (ESKİSİ: 'barber' idi)
    const { error: roleError } = await supabase.from('user_profiles').update({ role: 'staff' }).eq('id', user.id)

    if (roleError) { alert('Rol güncelleme hatası: ' + roleError.message); } 
    else { alert('✅ Personel hesabı başarıyla bağlandı!'); setIsUserSearchOpen(false); setAssigningBarberId(null); fetchAllData(); }
  }

  const onFileSelect = (e, target, id = null) => {
    if (e.target.files && e.target.files.length > 0) {
        const reader = new FileReader(); reader.addEventListener('load', () => setCropperImg(reader.result)); reader.readAsDataURL(e.target.files[0]);
        setCroppingTarget(target); setEditingBarberId(id);
    }
  }
  const onCropComplete = async (croppedFile) => {
    setUploading(true)
    const fileName = `${Date.now()}.jpg`; const { data, error } = await supabase.storage.from('avatars').upload(fileName, croppedFile)
    if (!error) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName); const url = urlData.publicUrl
        if (croppingTarget === 'shop') { await supabase.from('shops').update({ cover_image_url: url }).eq('id', shop.id); setShop({ ...shop, cover_image_url: url }) } 
        else if (croppingTarget === 'barber') { await supabase.from('barbers').update({ avatar_url: url }).eq('id', editingBarberId); fetchAllData() }
    }
    setUploading(false); setCropperImg(null)
  }
  
  const handleImageUpload = async (file, bucket) => {
    const options = { maxSizeMB: 1, maxWidthOrHeight: 800, useWebWorker: true, fileType: 'image/jpeg' }
    try {
      const compressedFile = await imageCompression(file, options)
      const fileName = `${Date.now()}.jpg`; const { data, error } = await supabase.storage.from(bucket).upload(fileName, compressedFile)
      if (error) throw error; const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName); return urlData.publicUrl
    } catch (e) { return null }
  }

  const updateShopAvatar = async (e) => { const url = await handleImageUpload(e.target.files[0], 'avatars'); if(url) { await supabase.from('shops').update({cover_image_url:url}).eq('id', shop.id); setShop({...shop, cover_image_url: url}) } }
  const addToGallery = async (e) => { const url = await handleImageUpload(e.target.files[0], 'portfolio'); if(url) { await supabase.from('portfolio_items').insert([{shop_id: shop.id, media_url: url, media_type: 'image'}]); fetchAllData() } }
  const deleteFromGallery = async (id) => { if(!confirm("Sil?")) return; await supabase.from('portfolio_items').delete().eq('id', id); fetchAllData() }
  const saveShopDetails = async () => { await supabase.from('shops').update({ description: shopBio, address: shopAddress }).eq('id', shop.id); alert("Kaydedildi") }
  const addBarber = async (e) => { e.preventDefault(); const {data} = await supabase.from('barbers').insert([{shop_id: shop.id, full_name: barberName, sort_order: 999}]); setBarberName(''); fetchAllData() }
  const deleteBarber = async (id) => { if(confirm('Sil?')) { await supabase.from('barbers').delete().eq('id', id); fetchAllData() } }
  const addService = async (e) => { e.preventDefault(); const {data} = await supabase.from('services').insert([{shop_id: shop.id, name: serviceName, price: parseFloat(servicePrice), duration_min: parseInt(serviceDuration)}]).select().single(); if(data) {setServices([...services, data]); setServiceName(''); setServicePrice('')} }
  const deleteService = async (id) => { if(confirm('Sil?')) { await supabase.from('services').delete().eq('id', id); fetchAllData() } }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Yükleniyor...</div>
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']

  return (
    <div className="min-h-screen pt-36 pb-20 px-4 bg-[#0F172A] text-white font-sans">
      <Navbar />
      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="max-w-6xl mx-auto">
        
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[40px] mb-8 flex flex-col md:flex-row items-center gap-6">
          <div className="relative group"><div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-500 shadow-xl bg-gray-800"><img src={shop.cover_image_url || "https://via.placeholder.com/150"} alt="Avatar" className="w-full h-full object-cover" /></div><label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer"><span className="text-xs">📷</span><input type="file" accept="image/*" onChange={(e) => onFileSelect(e, 'shop')} className="hidden" disabled={uploading} /></label></div>
          <div className="text-center md:text-left flex-1"><h1 className="text-3xl font-bold">{shop.name}</h1><p className="text-gray-400 text-sm mt-1">{shopAddress}</p><div className="mt-3 flex gap-2 justify-center md:justify-start"><a href={`/salon/${shop.slug}`} target="_blank" className="bg-blue-500/20 text-blue-400 px-4 py-1 rounded-full text-xs border border-blue-500/30 hover:bg-blue-500 hover:text-white transition-colors">Sayfayı Gör ↗</a><button onClick={() => setShowQR(true)} className="bg-white/10 text-white px-4 py-1 rounded-full text-xs border border-white/20 hover:bg-white hover:text-black transition-colors">QR Kod 📱</button></div></div>
        </div>

        <div className="flex flex-wrap gap-2 md:gap-4 mb-6 border-b border-white/10 pb-1 overflow-x-auto">
            <button onClick={()=>setActiveTab('appointments')} className={`pb-3 px-4 font-medium transition-colors ${activeTab==='appointments'?'text-green-400 border-b-2 border-green-400':'text-gray-500'}`}>📅 Randevular</button>
            <button onClick={()=>setActiveTab('history')} className={`pb-3 px-4 font-medium transition-colors ${activeTab==='history'?'text-blue-400 border-b-2 border-blue-400':'text-gray-500'}`}>📂 Geçmiş</button>
            <button onClick={()=>setActiveTab('schedule')} className={`pb-3 px-4 font-medium transition-colors ${activeTab==='schedule'?'text-orange-400 border-b-2 border-orange-400':'text-gray-500'}`}>⏰ Saatler</button>
            <button onClick={()=>setActiveTab('management')} className={`pb-3 px-4 font-medium transition-colors ${activeTab==='management'?'text-blue-400 border-b-2 border-blue-400':'text-gray-500'}`}>⚙️ İşletme</button>
            <button onClick={()=>setActiveTab('profile')} className={`pb-3 px-4 font-medium transition-colors ${activeTab==='profile'?'text-purple-400 border-b-2 border-purple-400':'text-gray-500'}`}>🖼️ Profil</button>
        </div>

        {activeTab === 'appointments' && (
            <div className="bg-white/5 border border-white/10 p-6 rounded-[30px]">
                <h3 className="text-xl font-bold mb-6 text-green-300">Aktif Randevular</h3>
                <div className="space-y-4">
                    {appointments.length === 0 && <p className="text-gray-500 text-center">Aktif randevu yok.</p>}
                    {appointments.map(app => (
                        <div key={app.id} className={`p-4 rounded-2xl border flex flex-col md:flex-row justify-between items-center gap-4 ${app.status === 'pending' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                            <div><div className="text-white font-bold">{app.customer_name} ({app.customer_phone})</div><div className="text-sm text-gray-400">{new Date(app.start_time).toLocaleDateString('tr-TR')} {new Date(app.start_time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} - {app.services?.name}</div>{app.created_by_user && <button onClick={() => setSelectedCustomerUserId(app.created_by_user)} className="text-xs text-blue-400 underline mt-1">Profili Gör</button>}</div>
                            <div className="flex gap-2"><button onClick={() => completeAppointment(app.id)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg">✅ Tamamla</button><button onClick={() => cancelAppointment(app.id)} className="bg-red-600/20 hover:bg-red-600/40 text-red-400 px-4 py-2 rounded-xl text-sm font-bold border border-red-500/30">❌ İptal</button></div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'history' && (
            <div className="bg-white/5 border border-white/10 p-6 rounded-[30px]">
                 <div className="space-y-4">
                    {pastAppointments.length === 0 && <p className="text-gray-500 text-center">Geçmiş kayıt yok.</p>}
                    {pastAppointments.map(app => (
                        <div key={app.id} className="p-4 bg-black/20 rounded-2xl border border-white/5 flex justify-between items-center opacity-70">
                            <div><div className="font-bold text-gray-300">{app.customer_name}</div><div className="text-xs text-gray-500">{new Date(app.start_time).toLocaleDateString()} - {app.services?.name || 'Silinmiş'}</div></div>
                            <div className="flex items-center gap-3"><span className="text-green-500 text-xs border border-green-500/30 px-2 py-1 rounded">Tamamlandı</span><button onClick={() => cancelAppointment(app.id)} className="text-red-500 hover:text-red-300 text-xs">🗑️</button></div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'schedule' && (
             <div className="bg-white/5 p-6 rounded-[30px]">
                <div className="flex justify-between mb-4"><h3 className="font-bold text-orange-300">Çalışma Saatleri</h3><span>{barbers[0]?.full_name}</span></div>
                <div className="grid gap-3">
                    {days.map((day, index) => {
                         const s = schedules.find(sc => sc.weekday === index) || { start_time: '09:00', end_time: '21:00', is_active: true }
                         return <div key={index} className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5"><span className="w-20 text-gray-300">{day}</span><div className="flex gap-2"><input type="time" defaultValue={s.start_time} id={`start-${index}`} className="bg-black text-white rounded p-1"/><input type="time" defaultValue={s.end_time} id={`end-${index}`} className="bg-black text-white rounded p-1"/></div><button onClick={()=>{saveSchedule(index, document.getElementById(`start-${index}`).value, document.getElementById(`end-${index}`).value, document.getElementById(`active-${index}`).checked, barbers[0].id)}} className="text-xs bg-blue-600 px-2 py-1 rounded text-white">Kaydet</button></div>
                    })}
                </div>
             </div>
        )}

        {activeTab === 'management' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white/5 p-6 rounded-[30px]">
                    <h3 className="font-bold mb-4 text-blue-300">Usta Yönetimi</h3>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'barber')}>
                        <SortableContext items={barbers} strategy={verticalListSortingStrategy}>
                            <div className="space-y-2 mb-4 max-h-80 overflow-y-auto">
                                {barbers.map(b => (
                                    <SortableItem key={b.id} id={b.id} onDelete={() => deleteBarber(b.id)}>
                                        <div className="flex flex-col items-start gap-1">
                                            <div className="flex items-center gap-3">
                                                <label className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden cursor-pointer"><img src={b.avatar_url} className="w-full h-full object-cover"/><input type="file" className="hidden" onChange={(e)=>onFileSelect(e,'barber',b.id)}/></label>
                                                <span className="font-medium text-gray-200">{b.full_name}</span>
                                            </div>
                                            {!b.auth_user_id ? (
                                                <button onClick={(e) => { e.stopPropagation(); setAssigningBarberId(b.id); setIsUserSearchOpen(true); }} className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded hover:bg-orange-500 hover:text-white transition-colors ml-11">🔗 Kullanıcı Bağla</button>
                                            ) : (<span className="text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded ml-11">✅ Hesap Bağlı</span>)}
                                        </div>
                                    </SortableItem>
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                    <form onSubmit={addBarber} className="flex gap-2"><input value={barberName} onChange={e=>setBarberName(e.target.value)} placeholder="Usta Adı" className="flex-1 bg-black/30 border border-white/10 rounded-xl p-2 text-white"/><button className="bg-blue-600 text-white px-3 rounded-xl">+</button></form>
                </div>

                <div className="bg-white/5 p-6 rounded-[30px]">
                    <h3 className="font-bold mb-4 text-emerald-300">Hizmet Yönetimi</h3>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'service')}>
                        <SortableContext items={services} strategy={verticalListSortingStrategy}>
                             <div className="space-y-2 mb-4 max-h-80 overflow-y-auto">
                                {services.map(s => (
                                    <SortableItem key={s.id} id={s.id} onDelete={() => deleteService(s.id)}>
                                        <div className="flex justify-between w-full pr-2"><span>{s.name}</span><span className="text-emerald-400">{s.price}₺</span></div>
                                    </SortableItem>
                                ))}
                             </div>
                        </SortableContext>
                    </DndContext>
                    <form onSubmit={addService} className="space-y-2"><input value={serviceName} onChange={e=>setServiceName(e.target.value)} placeholder="Hizmet" className="w-full bg-black/30 border border-white/10 rounded-xl p-2 text-white"/><div className="flex gap-2"><input type="number" value={servicePrice} onChange={e=>setServicePrice(e.target.value)} placeholder="Fiyat" className="w-1/2 bg-black/30 rounded-xl p-2 text-white"/><input type="number" value={serviceDuration} onChange={e=>setServiceDuration(e.target.value)} placeholder="Süre" className="w-1/2 bg-black/30 rounded-xl p-2 text-white"/></div><button className="w-full bg-emerald-600 text-white py-2 rounded-xl">Ekle</button></form>
                </div>
            </div>
        )}

        {activeTab === 'profile' && (
             <div className="bg-white/5 p-6 rounded-[30px]">
                <div className="flex justify-between mb-4"><h3 className="font-bold text-pink-300">Galeri</h3><label className="bg-pink-600 px-3 py-1 rounded-lg text-sm cursor-pointer">Ekle<input type="file" onChange={(e) => {setUploading(true); handleImageUpload(e.target.files[0], 'portfolio').then(url => {if(url) supabase.from('portfolio_items').insert([{shop_id:shop.id, media_url:url, media_type:'image'}]).then(fetchAllData); setUploading(false)})}} className="hidden" /></label></div>
                <div className="grid grid-cols-4 gap-2">
                    {portfolio.map(item => <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden"><img src={item.media_url} className="w-full h-full object-cover"/><button onClick={()=>deleteFromGallery(item.id)} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 text-white">🗑️</button></div>)}
                </div>
             </div>
        )}

      </motion.div>
      
      <CustomerProfileModal userId={selectedCustomerUserId} isOpen={!!selectedCustomerUserId} onClose={() => setSelectedCustomerUserId(null)} />
      <QRCodeModal isOpen={showQR} onClose={() => setShowQR(false)} url={`https://tirasrandevum.com/salon/${shop?.slug}`} shopName={shop?.name} />
      <ImageCropper imageSrc={cropperImg} isOpen={!!cropperImg} onClose={() => setCropperImg(null)} onCropComplete={onCropComplete} />
      
      <UserSearchModal 
        isOpen={isUserSearchOpen} 
        onClose={() => setIsUserSearchOpen(false)} 
        onSelectUser={assignBarberUser} 
      />
    </div>
  )
}