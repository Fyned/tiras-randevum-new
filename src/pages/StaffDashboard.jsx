import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { motion } from 'framer-motion'
import CustomerProfileModal from '../components/CustomerProfileModal'

export default function StaffDashboard() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  
  // Sadece bu berberin verileri
  const [myBarberProfile, setMyBarberProfile] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [schedules, setSchedules] = useState([])
  
  const [activeTab, setActiveTab] = useState('appointments')
  const [selectedCustomerUserId, setSelectedCustomerUserId] = useState(null)

  useEffect(() => {
    if (!session) navigate('/login')
    else fetchMyData()
  }, [session])

  const fetchMyData = async () => {
    setLoading(true)
    // 1. Giriş yapan kullanıcının bağlı olduğu berber kaydını bul
    const { data: barber, error } = await supabase
        .from('barbers')
        .select('*, shops(name)') // Hangi dükkanda çalıştığını da çek
        .eq('auth_user_id', session.user.id)
        .single()

    if (error || !barber) {
        alert("Berber kaydınız bulunamadı. Lütfen dükkan sahibiyle görüşün.")
        navigate('/')
        return
    }

    setMyBarberProfile(barber)
    
    // 2. Randevuları Çek
    await fetchAppointments(barber.id)
    
    // 3. Saatleri Çek
    const { data: sched } = await supabase.from('barber_schedules').select('*').eq('barber_id', barber.id).order('weekday')
    setSchedules(sched || [])
    
    setLoading(false)
  }

  const fetchAppointments = async (barberId) => {
      const { data } = await supabase
        .from('appointments')
        .select(`*, services(name, price)`)
        .eq('barber_id', barberId)
        .in('status', ['pending', 'confirmed'])
        .order('start_time', { ascending: true })
      setAppointments(data || [])
  }

  const updateStatus = async (id, status) => {
      await supabase.from('appointments').update({ status }).eq('id', id)
      fetchAppointments(myBarberProfile.id)
  }

  const saveSchedule = async (weekday, start, end, isActive) => {
      const existing = schedules.find(s => s.weekday === weekday)
      const payload = { 
          barber_id: myBarberProfile.id, 
          weekday, 
          start_time: start, 
          end_time: end, 
          is_active: isActive 
      }
      
      if (existing) {
          await supabase.from('barber_schedules').update(payload).eq('id', existing.id)
      } else {
          await supabase.from('barber_schedules').insert([payload])
      }
      alert("Saat güncellendi!")
      // Listeyi yenilemeye gerek yok, UI zaten input
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white bg-[#0F172A]">Yükleniyor...</div>
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']

  return (
    <div className="min-h-screen pt-36 pb-20 px-4 bg-[#0F172A] text-white font-sans">
      <Navbar />
      
      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="max-w-4xl mx-auto">
        
        {/* Üst Bilgi */}
        <div className="mb-8 text-center md:text-left">
            <h1 className="text-3xl font-bold text-white">Merhaba, {myBarberProfile.full_name} 👋</h1>
            <p className="text-gray-400 text-sm mt-1">
                Çalıştığınız Yer: <span className="text-blue-400 font-bold">{myBarberProfile.shops?.name}</span>
            </p>
        </div>

        {/* Sekmeler */}
        <div className="flex gap-4 mb-6 border-b border-white/10 pb-1">
            <button onClick={()=>setActiveTab('appointments')} className={`pb-3 px-4 font-medium transition-colors ${activeTab==='appointments'?'text-green-400 border-b-2 border-green-400':'text-gray-500 hover:text-white'}`}>📅 Randevularım</button>
            <button onClick={()=>setActiveTab('schedule')} className={`pb-3 px-4 font-medium transition-colors ${activeTab==='schedule'?'text-orange-400 border-b-2 border-orange-400':'text-gray-500 hover:text-white'}`}>⏰ Çalışma Saatlerim</button>
        </div>

        {/* RANDEVULAR */}
        {activeTab === 'appointments' && (
            <div className="bg-white/5 border border-white/10 p-6 rounded-[30px]">
                {appointments.length === 0 ? <p className="text-gray-500 text-center">Aktif randevunuz yok.</p> : (
                    <div className="space-y-4">
                        {appointments.map(app => (
                            <div key={app.id} className={`p-4 rounded-2xl border flex flex-col sm:flex-row justify-between items-center gap-4 ${app.status === 'pending' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-lg font-bold text-white">{new Date(app.start_time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                                        <span className="text-sm text-gray-400">{new Date(app.start_time).toLocaleDateString('tr-TR')}</span>
                                        {app.status==='pending' && <span className="bg-yellow-500 text-black text-[10px] px-2 rounded">ONAY BEKLİYOR</span>}
                                    </div>
                                    <div className="text-white font-medium flex items-center gap-2">
                                        {app.customer_name} <span className="text-gray-500 text-sm">({app.customer_phone})</span>
                                        {app.created_by_user && (<button onClick={() => setSelectedCustomerUserId(app.created_by_user)} className="text-xs text-blue-400 underline">Profili Gör</button>)}
                                    </div>
                                    <div className="text-sm text-gray-400 mt-1">{app.services?.name}</div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => updateStatus(app.id, 'completed')} className="bg-blue-600 px-4 py-2 rounded-xl text-sm text-white shadow-lg">✅ Tamamla</button>
                                    <button onClick={() => updateStatus(app.id, 'cancelled')} className="bg-red-600/20 text-red-400 px-4 py-2 rounded-xl text-sm border border-red-500/30">❌ İptal</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* SAATLER */}
        {activeTab === 'schedule' && (
            <div className="bg-white/5 border border-white/10 p-6 rounded-[30px]">
                <div className="grid gap-3">
                    {days.map((day, index) => {
                         const s = schedules.find(sc => sc.weekday === index) || { start_time: '09:00', end_time: '21:00', is_active: true }
                         return (
                             <div key={index} className="flex items-center justify-between bg-black/20 p-4 rounded-2xl border border-white/5">
                                <span className="w-24 font-bold text-gray-300">{day}</span>
                                <div className="flex items-center gap-2">
                                    <input type="time" defaultValue={s.start_time} id={`start-${index}`} className="bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm"/>
                                    <span>-</span>
                                    <input type="time" defaultValue={s.end_time} id={`end-${index}`} className="bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm"/>
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center cursor-pointer">
                                        <input type="checkbox" defaultChecked={s.is_active} id={`active-${index}`} className="mr-2 accent-green-500"/>
                                        <span className="text-xs">Açık</span>
                                    </label>
                                    <button 
                                        onClick={() => {
                                            const start = document.getElementById(`start-${index}`).value
                                            const end = document.getElementById(`end-${index}`).value
                                            const active = document.getElementById(`active-${index}`).checked
                                            saveSchedule(index, start, end, active)
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

      </motion.div>

      <CustomerProfileModal userId={selectedCustomerUserId} isOpen={!!selectedCustomerUserId} onClose={() => setSelectedCustomerUserId(null)} />
    </div>
  )
}