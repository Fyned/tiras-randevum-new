import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { motion } from 'framer-motion'
import imageCompression from 'browser-image-compression'
import { validatePhone } from '../utils/helpers'

export default function UserProfile() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState({ full_name: '', phone: '', avatar_url: '' })
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!session) {
        navigate('/login')
    } else {
        getProfile()
    }
  }, [session])

  const getProfile = async () => {
    setLoading(true)
    
    // 1. Profili Çek
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('auth_user_id', session.user.id)
      .single()

    if (error) {
        console.error("Profil hatası:", error)
    }

    if (data) {
        // 2. ROL KONTROLÜ: Eğer müşteri değilse yönlendir
        if (data.role === 'barber') {
            navigate('/shop-panel')
            return
        } else if (data.role === 'admin') {
            navigate('/admin')
            return
        }
        
        setProfile(data)
    }
    setLoading(false)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)

    try {
      const options = { maxSizeMB: 1, maxWidthOrHeight: 800, useWebWorker: true }
      const compressedFile = await imageCompression(file, options)
      const fileName = `avatar-${session.user.id}-${Date.now()}.jpg`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, compressedFile)
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
      
      await supabase.from('user_profiles').update({ avatar_url: urlData.publicUrl }).eq('auth_user_id', session.user.id)
      setProfile({ ...profile, avatar_url: urlData.publicUrl })
      
    } catch (error) {
      alert('Hata: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setMsg('')
    const phoneCheck = validatePhone(profile.phone)
    if (!phoneCheck.isValid) {
      alert("Lütfen geçerli bir telefon numarası giriniz (Başında 0 olmadan 5 ile başlayan 10 hane).")
      return
    }

    const { error } = await supabase.from('user_profiles').update({
      full_name: profile.full_name,
      phone: phoneCheck.clean
    }).eq('auth_user_id', session.user.id)

    if (error) alert("Hata: " + error.message)
    else setMsg("✅ Profiliniz güncellendi!")
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Yükleniyor...</div>

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-[#0F172A] text-white font-sans">
      <Navbar />
      
      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Müşteri Profili</h1>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[40px] shadow-2xl">
          
          {/* AVATAR */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group cursor-pointer">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500/30 shadow-xl bg-gray-800">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm font-bold">Değiştir</span>
              </div>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploading} />
            </div>
            <p className="text-gray-400 text-sm mt-3">Profil fotoğrafı yükle</p>
          </div>

          {/* FORM */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2 ml-1">Ad Soyad</label>
              <input 
                value={profile.full_name || ''} 
                onChange={e => setProfile({...profile, full_name: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2 ml-1">Telefon Numarası</label>
              <input 
                value={profile.phone || ''} 
                onChange={e => setProfile({...profile, phone: e.target.value})}
                placeholder="5XX XXX XX XX"
                type="tel"
                className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1 ml-1">* Randevu bildirimleri için zorunludur.</p>
            </div>

            {msg && <div className="bg-green-500/20 text-green-300 p-3 rounded-xl text-center">{msg}</div>}

            <button 
              onClick={handleSave}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg transition-all"
            >
              Kaydet
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  )
}