import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { validatePhone } from '../utils/helpers' 

export default function BookingWizard({ shop, barbers, services, onClose }) {
  const { session } = useAuth()
  const [step, setStep] = useState(1)
  
  // "Tarih seçince direk tarih çıksın" isteği için bugünün tarihini varsayılan yapıyoruz.
  const today = new Date().toISOString().split('T')[0]
  
  const [data, setData] = useState({ 
    service: null, 
    barber: null, 
    date: today, // Varsayılan olarak bugünü seçili getir
    time: null, 
    guestName: '', 
    guestPhone: '' 
  })
  
  const [busySlots, setBusySlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [userProfile, setUserProfile] = useState(null)

  // Telefonda "Geri" tuşuna basınca modal kapansın istemiyoruz, bir önceki adıma gitsin istiyoruz.
  useEffect(() => {
    const handleBackButton = (event) => {
      event.preventDefault();
      if (step > 1) {
        setStep(prev => prev - 1);
      } else {
        onClose(); // İlk adımdayken geri basarsa kapatsın
      }
    };
    
    // Tarayıcı geçmişine sahte bir durum ekleyerek geri tuşunu yakalıyoruz
    window.history.pushState(null, null, window.location.href);
    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [step, onClose]);


  useEffect(() => { if (session) fetchUserProfile() }, [session])

  const fetchUserProfile = async () => {
    const { data } = await supabase.from('user_profiles').select('*').eq('auth_user_id', session.user.id).single()
    if (data) setUserProfile(data)
  }

  useEffect(() => { 
    if (step === 3 && data.date && data.barber) fetchBusySlots() 
  }, [data.date, step, data.barber]) // Berber değişince de saatleri yenile

  const fetchBusySlots = async () => {
    setLoading(true)
    const start = new Date(data.date + 'T00:00:00').toISOString()
    const end = new Date(data.date + 'T23:59:59').toISOString()
    const { data: apps } = await supabase.from('appointments').select('start_time').eq('barber_id', data.barber.id).gte('start_time', start).lte('start_time', end).neq('status', 'cancelled')
    setBusySlots(apps ? apps.map(a => new Date(a.start_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })) : [])
    setLoading(false)
  }

  const handleBooking = async () => {
    let finalPhone = ''
    let finalName = ''

    if (session) {
        if (!userProfile?.phone) { alert("Lütfen önce profilinizden telefon numaranızı ekleyiniz."); return }
        finalPhone = userProfile.phone
        finalName = userProfile.full_name
    } else {
        if (!data.guestName || !data.guestPhone) { alert("Lütfen adınızı ve telefon numaranızı giriniz."); return }
        const phoneCheck = validatePhone(data.guestPhone)
        if (!phoneCheck.isValid) { alert("Geçersiz telefon numarası. (Örn: 5551234567)"); return }
        finalPhone = phoneCheck.clean
        finalName = data.guestName
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
        if (shop.owner_user_id) {
            await supabase.from('notifications').insert([{
                user_id: shop.owner_user_id,
                title: '📅 Yeni Randevu!',
                message: `${finalName} kişisi, ${data.date} ${data.time} için ${data.service.name} randevusu aldı.`,
                link: '/shop-panel'
            }])
        }
        alert(`Harika! Randevun alındı. 🎉\n\nℹ️ Berberine bildirim gönderildi.`)
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
            <div>
              <h2 className="text-xl font-bold text-white">Randevu Oluştur</h2>
              <p className="text-xs text-gray-400">Adım {step}/4</p>
            </div>
            <button onClick={onClose} className="bg-white/10 w-8 h-8 rounded-full text-gray-300 hover:bg-white/20 transition-colors">✕</button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar">
            {/* ADIM 1: HİZMET */}
            {step === 1 && (
              <div className="space-y-3">
                <p className="text-gray-400 text-sm font-bold uppercase mb-4">Hizmet Seçimi</p>
                {services.map(s => (
                  <motion.div key={s.id} whileTap={{ scale: 0.98 }} onClick={() => { setData({...data, service: s}); setStep(2) }}
                    className="p-5 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center cursor-pointer hover:bg-white/10 hover:border-blue-500/30 transition-all group">
                    <span className="font-medium text-lg text-gray-200 group-hover:text-white">{s.name}</span>
                    {/* İSTEK: "30 yazan yerde dakka yazsa" */}
                    <div className="text-right">
                        <div className="text-green-400 font-bold bg-green-900/30 px-3 py-1 rounded-lg mb-1">{s.price} ₺</div>
                        <div className="text-xs text-gray-500">{s.duration_min} dakika</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* ADIM 2: BERBER */}
            {step === 2 && (
              <div className="space-y-3">
                <button onClick={() => setStep(1)} className="text-gray-500 mb-4 text-sm hover:text-white">← Geri Dön</button>
                <p className="text-gray-400 text-sm font-bold uppercase mb-4">Berber Seçimi</p>
                {barbers.map(b => (
                  <motion.div key={b.id} whileTap={{ scale: 0.98 }} 
                    // İSTEK: "Ustayı seçince direk tarih çıksın" (setStep(3) eklendi)
                    onClick={() => { setData({...data, barber: b}); setStep(3) }}
                    className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-all">
                    <div className="w-14 h-14 bg-gray-700 rounded-full overflow-hidden border border-white/10">
                        {b.avatar_url ? <img src={b.avatar_url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-2xl">👨‍id</div>}
                    </div>
                    <span className="font-medium text-lg text-white">{b.full_name}</span>
                    <span className="ml-auto text-gray-500 text-xl">›</span>
                  </motion.div>
                ))}
              </div>
            )}

            {/* ADIM 3: TARİH & SAAT */}
            {step === 3 && (
              <div>
                <button onClick={() => setStep(2)} className="text-gray-500 mb-4 text-sm hover:text-white">← Geri Dön</button>
                <h3 className="text-gray-400 text-sm uppercase font-bold mb-4">Tarih ve Saat</h3>
                
                {/* Tarih Seçici */}
                <input type="date" value={data.date} onChange={(e) => setData({...data, date: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white mb-6 focus:outline-none focus:border-blue-500 scheme-dark" />
                
                {data.date && (
                  <div className="grid grid-cols-4 gap-3">
                    {loading ? <div className="col-span-4 text-center text-gray-500 py-4">Saatler kontrol ediliyor...</div> : 
                    ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30','20:00'].map(t => {
                      const disabled = busySlots.includes(t)
                      return (
                        <button key={t} disabled={disabled} onClick={() => setData({...data, time: t})}
                          className={`py-3 rounded-xl text-sm font-bold transition-all ${
                            disabled ? 'bg-white/5 text-gray-600 cursor-not-allowed decoration-slice line-through opacity-50' :
                            data.time === t ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] transform scale-105' : 'bg-white/10 hover:bg-white/20 text-gray-200'
                          }`}>
                          {t}
                        </button>
                      )
                    })}
                  </div>
                )}
                <div className="mt-8 text-right">
                  <button disabled={!data.time} onClick={() => setStep(4)} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50 shadow-lg shadow-blue-900/20">İleri →</button>
                </div>
              </div>
            )}

            {/* ADIM 4: ONAY */}
            {step === 4 && (
              <div className="space-y-6">
                <button onClick={() => setStep(3)} className="text-sm text-gray-500 hover:text-white">← Geri Dön</button>
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                  <div className="flex justify-between text-gray-400"><span>Hizmet</span> <span className="text-white font-medium">{data.service.name}</span></div>
                  <div className="flex justify-between text-gray-400"><span>Berber</span> <span className="text-white font-medium">{data.barber.full_name}</span></div>
                  <div className="flex justify-between text-gray-400"><span>Tarih</span> <span className="text-white font-medium">{new Date(data.date).toLocaleDateString('tr-TR')} {data.time}</span></div>
                  <div className="h-px bg-white/10 my-2"></div>
                  <div className="flex justify-between text-lg font-bold"><span>Toplam</span> <span className="text-green-400">{data.service.price} ₺</span></div>
                </div>

                {!session && (
                  <div className="space-y-3">
                    <p className="text-sm text-yellow-500/80 bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20">ⓘ Randevu onayı için bilgilerinizi giriniz.</p>
                    <input placeholder="Adınız Soyadınız" onChange={e=>setData({...data, guestName: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-blue-500"/>
                    <input type="tel" placeholder="Telefon (5XX XXX XX XX)" onChange={e=>setData({...data, guestPhone: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-blue-500"/>
                  </div>
                )}
                <motion.button whileTap={{scale:0.95}} onClick={handleBooking} disabled={session && !userProfile?.phone} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-2xl font-bold text-lg shadow-lg shadow-green-900/40 disabled:opacity-50">
                    {session && !userProfile?.phone ? 'Lütfen Profilinizden Telefon Ekleyin' : 'Randevuyu Onayla'}
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}