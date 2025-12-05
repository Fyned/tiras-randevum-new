import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { validatePhone } from '../utils/helpers'

export default function BookingWizard({ shop, barbers, services, onClose }) {
  const { session } = useAuth()
  const [step, setStep] = useState(1)
  
  const today = new Date().toISOString().split('T')[0]
  
  const [data, setData] = useState({ 
    service: null, 
    barber: null, 
    date: today, 
    time: null, 
    guestName: '', 
    guestPhone: '' 
  })
  
  const [busySlots, setBusySlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [userProfile, setUserProfile] = useState(null)

  // --- GERİ TUŞU YÖNETİMİ (GÜÇLENDİRİLMİŞ) ---
  useEffect(() => {
    // Modal açıldığında geçmişe bir durum ekle
    window.history.pushState({ modal: true }, '', window.location.href);

    const handlePopState = (event) => {
      // Geri tuşuna basıldığında:
      event.preventDefault();
      if (step > 1) {
        // Eğer 1. adımda değilsek, bir geri adıma git ve geçmişi tekrar doldur (çünkü popState geçmişi sildi)
        setStep(prev => prev - 1);
        window.history.pushState({ modal: true }, '', window.location.href);
      } else {
        // 1. adımdayksek kapat
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Çıkarken eğer geçmişte bizim eklediğimiz state varsa temizlemeye çalış (Opsiyonel)
    };
  }, [step, onClose]);

  // Kullanıcı profili çekme
  useEffect(() => {
    if (session) {
        supabase.from('user_profiles').select('*').eq('auth_user_id', session.user.id).single()
        .then(({ data }) => { if(data) setUserProfile(data) })
    }
  }, [session])

  // Saatleri hesapla
  useEffect(() => { 
    if (step === 3 && data.date && data.barber) fetchBusySlots() 
  }, [data.date, step, data.barber])

  const fetchBusySlots = async () => {
    setLoading(true)
    const start = new Date(data.date + 'T00:00:00').toISOString()
    const end = new Date(data.date + 'T23:59:59').toISOString()
    
    const { data: apps } = await supabase
      .from('appointments')
      .select('start_time')
      .eq('barber_id', data.barber.id)
      .gte('start_time', start)
      .lte('start_time', end)
      .neq('status', 'cancelled')
      
    setBusySlots(apps ? apps.map(a => new Date(a.start_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })) : [])
    setLoading(false)
  }

  const handleBooking = async () => {
    let finalPhone = '', finalName = ''

    if (session) {
        if (!userProfile?.phone) return alert("Lütfen profilinizden telefon ekleyin.")
        finalPhone = userProfile.phone; finalName = userProfile.full_name
    } else {
        if (!data.guestName || !data.guestPhone) return alert("Bilgileri eksiksiz giriniz.")
        const check = validatePhone(data.guestPhone)
        if (!check.isValid) return alert("Geçersiz telefon numarası.")
        finalPhone = check.clean; finalName = data.guestName
    }

    const start = new Date(`${data.date}T${data.time}:00`)
    const end = new Date(start.getTime() + data.service.duration_min * 60000)
    
    const payload = {
      shop_id: shop.id, barber_id: data.barber.id, service_id: data.service.id,
      start_time: start.toISOString(), end_time: end.toISOString(),
      created_by_user: session?.user.id, customer_name: finalName, customer_phone: finalPhone
    }
    
    const { error } = await supabase.from('appointments').insert([payload])
    
    if (!error) { 
        // Bildirim oluştur
        if (shop.owner_user_id) {
            await supabase.from('notifications').insert([{
                user_id: shop.owner_user_id,
                title: '📅 Yeni Randevu',
                message: `${finalName}, ${new Date(data.date).toLocaleDateString('tr-TR')} ${data.time} - ${data.service.name}`,
                link: '/shop-panel?tab=appointments' // Direkt randevular sekmesine link
            }])
        }
        // WhatsApp (Backend) tetiklemesi buraya gelecek...
        alert(`Randevunuz Oluşturuldu! 🎉`)
        window.history.back(); // Geçmiş durumunu temizle
        onClose() 
    } else {
        alert(error.message)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
        
        <motion.div 
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[#0F172A] md:rounded-[40px] rounded-t-[40px] border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
            <div><h2 className="text-xl font-bold text-white">Randevu Al</h2><p className="text-xs text-gray-400">Adım {step}/4</p></div>
            <button onClick={onClose} className="bg-white/10 w-8 h-8 rounded-full text-gray-300 hover:bg-white/20">✕</button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar">
            {/* ADIM 1: HİZMET */}
            {step === 1 && (
              <div className="space-y-3">
                <p className="text-gray-400 text-sm font-bold uppercase mb-4">Hizmet Seçimi</p>
                {services.map(s => (
                  <motion.div key={s.id} whileTap={{ scale: 0.98 }} onClick={() => { setData({...data, service: s}); setStep(2) }}
                    className="p-5 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center cursor-pointer hover:bg-white/10 transition-all">
                    <span className="font-medium text-lg text-white">{s.name}</span>
                    <div className="text-right">
                        <div className="text-green-400 font-bold bg-green-900/30 px-3 py-1 rounded-lg mb-1">{s.price} ₺</div>
                        {/* DÜZELTME: Dakika yazısı eklendi */}
                        <div className="text-xs text-gray-400">{s.duration_min} dk</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* ADIM 2: BERBER */}
            {step === 2 && (
              <div className="space-y-3">
                <button onClick={() => setStep(1)} className="text-gray-500 mb-4 text-sm">← Geri</button>
                <p className="text-gray-400 text-sm font-bold uppercase mb-4">Usta Seçimi</p>
                {barbers.map(b => (
                  <motion.div key={b.id} whileTap={{ scale: 0.98 }} 
                    // DÜZELTME: Seçince otomatik ilerle
                    onClick={() => { setData({...data, barber: b}); setStep(3) }}
                    className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-all">
                    <div className="w-14 h-14 bg-gray-700 rounded-full overflow-hidden border border-white/10">
                        {b.avatar_url ? <img src={b.avatar_url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-2xl">👨‍id</div>}
                    </div>
                    <span className="font-medium text-lg text-white">{b.full_name}</span>
                    <span className="ml-auto text-gray-500 text-2xl">›</span>
                  </motion.div>
                ))}
              </div>
            )}

            {/* ADIM 3: TARİH */}
            {step === 3 && (
              <div>
                <button onClick={() => setStep(2)} className="text-gray-500 mb-4 text-sm">← Geri</button>
                <h3 className="text-gray-400 text-sm uppercase font-bold mb-4">Tarih ve Saat</h3>
                <input type="date" value={data.date} onChange={(e) => setData({...data, date: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white mb-6 focus:outline-none focus:border-blue-500 scheme-dark" />
                
                {data.date && (
                  <div className="grid grid-cols-4 gap-3">
                    {loading ? <div className="col-span-4 text-center text-gray-500 py-4">Müsaitlik bakılıyor...</div> : 
                    ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30','20:00'].map(t => {
                      const disabled = busySlots.includes(t)
                      return (
                        <button key={t} disabled={disabled} onClick={() => setData({...data, time: t})}
                          className={`py-3 rounded-xl text-sm font-bold transition-all ${
                            disabled ? 'bg-white/5 text-gray-600 cursor-not-allowed opacity-50 line-through' :
                            data.time === t ? 'bg-blue-600 text-white shadow-lg transform scale-105' : 'bg-white/10 hover:bg-white/20 text-gray-200'
                          }`}>
                          {t}
                        </button>
                      )
                    })}
                  </div>
                )}
                <div className="mt-8 text-right">
                  <button disabled={!data.time} onClick={() => setStep(4)} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50 shadow-lg">İleri →</button>
                </div>
              </div>
            )}

            {/* ADIM 4: ONAY */}
            {step === 4 && (
              <div className="space-y-6">
                <button onClick={() => setStep(3)} className="text-sm text-gray-500">← Geri</button>
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                  <div className="flex justify-between text-gray-400"><span>Hizmet</span> <span className="text-white">{data.service.name}</span></div>
                  <div className="flex justify-between text-gray-400"><span>Usta</span> <span className="text-white">{data.barber.full_name}</span></div>
                  <div className="flex justify-between text-gray-400"><span>Zaman</span> <span className="text-white">{new Date(data.date).toLocaleDateString('tr-TR')} {data.time}</span></div>
                  <div className="flex justify-between text-lg font-bold border-t border-white/10 pt-3 mt-3"><span>Tutar</span> <span className="text-green-400">{data.service.price} ₺</span></div>
                </div>

                {!session && (
                  <div className="space-y-3">
                    <p className="text-sm text-yellow-500/80 bg-yellow-500/10 p-3 rounded-xl">ⓘ İletişim bilgilerinizi giriniz.</p>
                    <input placeholder="Adınız Soyadınız" onChange={e=>setData({...data, guestName: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-blue-500"/>
                    <input type="tel" placeholder="Telefon (5XX XXX XX XX)" onChange={e=>setData({...data, guestPhone: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-blue-500"/>
                  </div>
                )}
                <motion.button whileTap={{scale:0.95}} onClick={handleBooking} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-2xl font-bold text-lg shadow-lg">
                    Randevuyu Onayla
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}