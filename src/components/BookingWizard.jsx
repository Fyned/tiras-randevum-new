import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

export default function BookingWizard({ shop, barbers, services, onClose }) {
  const { session } = useAuth()
  const [step, setStep] = useState(1)
  const [data, setData] = useState({ service: null, barber: null, date: '', time: null, guestName: '', guestPhone: '' })
  const [busySlots, setBusySlots] = useState([])
  const [loading, setLoading] = useState(false)

  // Alt fonksiyonlar aynı, sadece UI değiştiği için kısaltıyorum
  useEffect(() => { if (step === 3 && data.date && data.barber) fetchBusySlots() }, [data.date, step])

  const fetchBusySlots = async () => {
    setLoading(true)
    const start = new Date(data.date + 'T00:00:00').toISOString()
    const end = new Date(data.date + 'T23:59:59').toISOString()
    const { data: apps } = await supabase.from('appointments').select('start_time').eq('barber_id', data.barber.id).gte('start_time', start).lte('start_time', end).neq('status', 'cancelled')
    setBusySlots(apps ? apps.map(a => new Date(a.start_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })) : [])
    setLoading(false)
  }

  const handleBooking = async () => {
    const start = new Date(`${data.date}T${data.time}:00`)
    const end = new Date(start.getTime() + data.service.duration_min * 60000)
    const payload = {
      shop_id: shop.id, barber_id: data.barber.id, service_id: data.service.id,
      start_time: start.toISOString(), end_time: end.toISOString(),
      created_by_user: session?.user.id, customer_name: session ? null : data.guestName, customer_phone: session ? null : data.guestPhone
    }
    const { error } = await supabase.from('appointments').insert([payload])
    if (!error) { alert('Harika! Randevun alındı. 🎉'); onClose() } else alert(error.message)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
        {/* Arka Plan Blur */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
        
        {/* Modal Kartı */}
        <motion.div 
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[#0F172A] md:rounded-[40px] rounded-t-[40px] border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
            <div>
              <h2 className="text-xl font-bold text-white">Randevu Oluştur</h2>
              <p className="text-xs text-gray-400">Adım {step}/4</p>
            </div>
            <button onClick={onClose} className="bg-white/10 w-8 h-8 rounded-full text-gray-300 hover:bg-white/20 transition-colors">✕</button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar">
            {step === 1 && (
              <div className="space-y-3">
                <p className="text-gray-400 text-sm font-bold uppercase mb-4">Hizmet Seçimi</p>
                {services.map(s => (
                  <motion.div key={s.id} whileTap={{ scale: 0.98 }} onClick={() => { setData({...data, service: s}); setStep(2) }}
                    className="p-5 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center cursor-pointer hover:bg-white/10 hover:border-blue-500/30 transition-all group">
                    <span className="font-medium text-lg text-gray-200 group-hover:text-white">{s.name}</span>
                    <span className="text-green-400 font-bold bg-green-900/30 px-3 py-1 rounded-lg">{s.price} ₺</span>
                  </motion.div>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <button onClick={() => setStep(1)} className="text-gray-500 mb-4 text-sm hover:text-white">← Geri Dön</button>
                <p className="text-gray-400 text-sm font-bold uppercase mb-4">Berber Seçimi</p>
                {barbers.map(b => (
                  <motion.div key={b.id} whileTap={{ scale: 0.98 }} onClick={() => { setData({...data, barber: b}); setStep(3) }}
                    className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-all">
                    <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-xl shadow-lg">👨‍id</div>
                    <span className="font-medium text-lg">{b.full_name}</span>
                  </motion.div>
                ))}
              </div>
            )}

            {step === 3 && (
              <div>
                <button onClick={() => setStep(2)} className="text-gray-500 mb-4 text-sm hover:text-white">← Geri Dön</button>
                <input type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white mb-6 focus:outline-none focus:border-blue-500"
                  onChange={(e) => setData({...data, date: e.target.value})} />
                
                {data.date && (
                  <div className="grid grid-cols-4 gap-3">
                    {loading ? <div className="col-span-4 text-center text-gray-500">Saatler yükleniyor...</div> : 
                    ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30','20:00'].map(t => {
                      const disabled = busySlots.includes(t)
                      return (
                        <button key={t} disabled={disabled} onClick={() => setData({...data, time: t})}
                          className={`py-3 rounded-xl text-sm font-bold transition-all ${
                            disabled ? 'bg-white/5 text-gray-600 cursor-not-allowed' :
                            data.time === t ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)] transform scale-105' : 'bg-white/10 hover:bg-white/20'
                          }`}>
                          {t}
                        </button>
                      )
                    })}
                  </div>
                )}
                <div className="mt-8 text-right">
                  <button disabled={!data.time} onClick={() => setStep(4)} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50">Devam Et</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                  <div className="flex justify-between text-gray-400"><span>Hizmet</span> <span className="text-white">{data.service.name}</span></div>
                  <div className="flex justify-between text-gray-400"><span>Berber</span> <span className="text-white">{data.barber.full_name}</span></div>
                  <div className="flex justify-between text-gray-400"><span>Tarih</span> <span className="text-white">{data.date} {data.time}</span></div>
                  <div className="h-px bg-white/10 my-2"></div>
                  <div className="flex justify-between text-lg font-bold"><span>Toplam</span> <span className="text-green-400">{data.service.price} ₺</span></div>
                </div>
                {!session && (
                  <div className="space-y-3">
                    <input placeholder="Ad Soyad" onChange={e=>setData({...data, guestName: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-blue-500"/>
                    <input placeholder="Telefon" onChange={e=>setData({...data, guestPhone: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-blue-500"/>
                  </div>
                )}
                <motion.button whileTap={{scale:0.95}} onClick={handleBooking} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-2xl font-bold text-lg shadow-lg shadow-green-900/40">Onayla ve Bitir</motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}