import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion' // Animasyon ekledik

export default function BookingWizard({ shop, barbers, services, onClose }) {
  const { session } = useAuth()
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState(null)
  const [selectedBarber, setSelectedBarber] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState(null)
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [busySlots, setBusySlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  useEffect(() => {
    if (step === 3 && selectedDate && selectedBarber) fetchBusySlots()
  }, [selectedDate, step])

  const fetchBusySlots = async () => {
    setLoadingSlots(true)
    const startOfDay = new Date(selectedDate + 'T00:00:00').toISOString()
    const endOfDay = new Date(selectedDate + 'T23:59:59').toISOString()
    const { data } = await supabase.from('appointments').select('start_time').eq('barber_id', selectedBarber.id).gte('start_time', startOfDay).lte('start_time', endOfDay).neq('status', 'cancelled')
    
    if (data) {
      setBusySlots(data.map(app => new Date(app.start_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })))
    }
    setLoadingSlots(false)
  }

  const generateTimeSlots = () => {
    const slots = []
    for (let h = 9; h < 21; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`)
      slots.push(`${h.toString().padStart(2, '0')}:30`)
    }
    return slots
  }

  const handleBooking = async () => {
    if (!selectedTime || !selectedDate) return
    const startDateTime = new Date(`${selectedDate}T${selectedTime}:00`)
    const endDateTime = new Date(startDateTime.getTime() + selectedService.duration_min * 60000)
    
    const payload = {
      shop_id: shop.id, barber_id: selectedBarber.id, service_id: selectedService.id,
      start_time: startDateTime.toISOString(), end_time: endDateTime.toISOString(),
      status: 'pending',
      created_by_user: session ? session.user.id : null,
      customer_name: session ? null : guestName,
      customer_phone: session ? null : guestPhone
    }
    
    const { error } = await supabase.from('appointments').insert([payload])
    if (error) alert('Hata: ' + error.message)
    else { alert('✅ Randevu Onaylandı!'); onClose(); }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[60]">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 border border-gray-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] text-white"
      >
        <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
          <h2 className="text-xl font-bold">Randevu Al ({step}/4)</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <h3 className="text-gray-400 text-sm uppercase font-bold">Hizmet Seçin</h3>
            {services.map(srv => (
              <div key={srv.id} onClick={() => { setSelectedService(srv); setStep(2); }}
                className="p-4 border border-gray-700 rounded-xl hover:bg-gray-800 cursor-pointer transition-colors flex justify-between items-center">
                <span className="font-medium">{srv.name}</span>
                <span className="bg-gray-800 px-3 py-1 rounded text-sm text-green-400">{srv.price} TL</span>
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <button onClick={() => setStep(1)} className="text-sm text-gray-500 mb-2 hover:text-white">← Geri</button>
            <h3 className="text-gray-400 text-sm uppercase font-bold">Berber Seçin</h3>
            {barbers.map(brb => (
              <div key={brb.id} onClick={() => { setSelectedBarber(brb); setStep(3); }}
                className="p-4 border border-gray-700 rounded-xl hover:bg-gray-800 cursor-pointer transition-colors flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">👨‍id</div>
                <span className="font-medium">{brb.full_name}</span>
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div>
            <button onClick={() => setStep(2)} className="text-sm text-gray-500 mb-2 hover:text-white">← Geri</button>
            <h3 className="text-gray-400 text-sm uppercase font-bold mb-4">Tarih ve Saat</h3>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg mb-4 text-white scheme-dark" />
            
            {selectedDate && (
              loadingSlots ? <p className="text-center text-gray-500">Saatler kontrol ediliyor...</p> : 
              <div className="grid grid-cols-4 gap-2">
                {generateTimeSlots().map(time => {
                  const isBusy = busySlots.includes(time)
                  const isSelected = selectedTime === time
                  return (
                    <button key={time} disabled={isBusy} onClick={() => setSelectedTime(time)}
                      className={`p-2 rounded text-sm font-medium transition-colors ${
                        isBusy ? 'bg-gray-800 text-gray-600 cursor-not-allowed decoration-slice line-through' :
                        isSelected ? 'bg-white text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}>
                      {time}
                    </button>
                  )
                })}
              </div>
            )}
            <div className="mt-6 text-right">
              <button disabled={!selectedTime} onClick={() => setStep(4)} 
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                İleri →
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <button onClick={() => setStep(3)} className="text-sm text-gray-500 hover:text-white">← Geri</button>
            <div className="bg-gray-800 p-5 rounded-xl space-y-2">
              <div className="flex justify-between"><span className="text-gray-400">Hizmet:</span> <span>{selectedService.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Berber:</span> <span>{selectedBarber.full_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Zaman:</span> <span>{selectedDate} / {selectedTime}</span></div>
              <div className="flex justify-between border-t border-gray-700 pt-2 mt-2"><span className="text-gray-400">Tutar:</span> <span className="text-green-400 font-bold">{selectedService.price} TL</span></div>
            </div>

            {!session && (
              <div className="space-y-3">
                <input placeholder="Adınız Soyadınız" value={guestName} onChange={e => setGuestName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg text-white" />
                <input placeholder="Telefon Numaranız" value={guestPhone} onChange={e => setGuestPhone(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg text-white" />
              </div>
            )}
            <button onClick={handleBooking} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-900/20">
              ✅ Randevuyu Onayla
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}