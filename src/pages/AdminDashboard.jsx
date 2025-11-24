import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function AdminDashboard() {
  const { session } = useAuth()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false) // Admin mi kontrolü
  const [myShops, setMyShops] = useState([]) // Admin birden çok dükkan görebilir
  const [selectedShopId, setSelectedShopId] = useState(null) // Hangi dükkanı yönetiyoruz?

  // Form verileri
  const [shopName, setShopName] = useState('')
  const [shopSlug, setShopSlug] = useState('')
  const [barberName, setBarberName] = useState('')
  const [serviceName, setServiceName] = useState('')
  const [servicePrice, setServicePrice] = useState('')
  const [serviceDuration, setServiceDuration] = useState('30')

  // Seçili dükkanın detayları
  const [barbers, setBarbers] = useState([])
  const [services, setServices] = useState([])

  useEffect(() => {
    if (!session) {
      navigate('/login')
    } else {
      checkUserRole()
    }
  }, [session])

  // 1. Rol Kontrolü ve Dükkanları Getirme
  const checkUserRole = async () => {
    setLoading(true)
    
    // Profil tablosundan rolünü çek
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('auth_user_id', session.user.id)
      .single()

    if (profile && profile.role === 'admin') {
      setIsAdmin(true)
      fetchShops() // Admin ise dükkanları getir
    } else {
      alert("Bu sayfaya erişim yetkiniz yok. Sadece Adminler girebilir.")
      navigate('/')
    }
    setLoading(false)
  }

  const fetchShops = async () => {
    const { data } = await supabase.from('shops').select('*').order('id', { ascending: false })
    setMyShops(data || [])
  }

  // 2. Seçili Dükkanın Detaylarını Getir
  const fetchShopDetails = async (shopId) => {
    setSelectedShopId(shopId)
    const { data: barbersData } = await supabase.from('barbers').select('*').eq('shop_id', shopId)
    const { data: servicesData } = await supabase.from('services').select('*').eq('shop_id', shopId)
    
    setBarbers(barbersData || [])
    setServices(servicesData || [])
  }

  // --- İŞLEMLER ---

  // Yeni Dükkan Oluştur
  const createShop = async (e) => {
    e.preventDefault()
    const publicCode = 'TR-' + Math.floor(1000 + Math.random() * 9000)
    
    const { data, error } = await supabase.from('shops').insert([{
      name: shopName,
      slug: shopSlug,
      owner_user_id: session.user.id,
      public_code: publicCode
    }]).select().single()

    if (error) {
      alert('Hata: ' + error.message)
    } else {
      alert('Dükkan oluşturuldu!')
      setMyShops([data, ...myShops]) // Listeye ekle
      setShopName(''); setShopSlug(''); // Formu temizle
    }
  }

  // Berber Ekle (Görsel Olarak)
  // NOT: Berberin giriş yapabileceği gerçek hesabı (Auth) şimdilik Supabase panelden açacağız.
  // Buradan sadece vitrinde görünecek ismini ekliyoruz.
  const addBarber = async (e) => {
    e.preventDefault()
    const { data, error } = await supabase.from('barbers').insert([{
      shop_id: selectedShopId,
      full_name: barberName
    }]).select().single()

    if (error) alert(error.message)
    else {
      setBarbers([...barbers, data])
      setBarberName('')
    }
  }

  const addService = async (e) => {
    e.preventDefault()
    const { data, error } = await supabase.from('services').insert([{
      shop_id: selectedShopId,
      name: serviceName,
      price: parseFloat(servicePrice),
      duration_min: parseInt(serviceDuration)
    }]).select().single()

    if (error) alert(error.message)
    else {
      setServices([...services, data])
      setServiceName('')
      setServicePrice('')
    }
  }

  if (loading) return <div>Kontrol ediliyor...</div>
  if (!isAdmin) return <div>Yetkisiz Giriş</div>

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>🔧 Süper Admin Paneli</h1>
      <p>Hoşgeldin Patron. Buradan dükkanları yönetebilirsin.</p>

      {/* DÜKKAN OLUŞTURMA ALANI */}
      <div style={{ backgroundColor: '#eef', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>➕ Yeni Dükkan Oluştur</h3>
        <form onSubmit={createShop} style={{ display: 'flex', gap: '10px' }}>
          <input placeholder="Dükkan Adı" value={shopName} onChange={e => setShopName(e.target.value)} required />
          <input placeholder="URL (slug)" value={shopSlug} onChange={e => setShopSlug(e.target.value)} required />
          <button type="submit">Oluştur</button>
        </form>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* SOL MENÜ: Dükkan Listesi */}
        <div style={{ width: '30%', borderRight: '1px solid #ccc', paddingRight: '10px' }}>
          <h3>🏪 Dükkan Listesi</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {myShops.map(shop => (
              <li 
                key={shop.id} 
                onClick={() => fetchShopDetails(shop.id)}
                style={{ 
                  padding: '10px', 
                  border: '1px solid #ddd', 
                  marginBottom: '5px', 
                  cursor: 'pointer',
                  backgroundColor: selectedShopId === shop.id ? '#ddd' : '#fff'
                }}
              >
                <strong>{shop.name}</strong><br/>
                <small>/salon/{shop.slug}</small>
              </li>
            ))}
          </ul>
        </div>

        {/* SAĞ ALAN: Seçili Dükkan Yönetimi */}
        <div style={{ width: '70%' }}>
          {!selectedShopId ? (
            <p>Soldan yönetmek istediğin dükkanı seç.</p>
          ) : (
            <div>
              <h3>Yönetiliyor: {myShops.find(s => s.id === selectedShopId)?.name}</h3>
              
              <div style={{ display: 'flex', gap: '20px' }}>
                 {/* Berberler */}
                 <div style={{ flex: 1, border: '1px solid #eee', padding: '10px' }}>
                    <h4>👨‍id Berberler</h4>
                    <ul>{barbers.map(b => <li key={b.id}>{b.full_name}</li>)}</ul>
                    <form onSubmit={addBarber}>
                      <input placeholder="Berber Adı" value={barberName} onChange={e => setBarberName(e.target.value)} required style={{width:'100%'}}/>
                      <button type="submit" style={{marginTop:'5px', width:'100%'}}>Berber Ekle</button>
                    </form>
                    <small style={{color:'red', fontSize:'10px'}}>*Berberin giriş şifresini Supabase panelden manuel oluşturmalısın.</small>
                 </div>

                 {/* Hizmetler */}
                 <div style={{ flex: 1, border: '1px solid #eee', padding: '10px' }}>
                    <h4>✂️ Hizmetler</h4>
                    <ul>{services.map(s => <li key={s.id}>{s.name} ({s.price} TL)</li>)}</ul>
                    <form onSubmit={addService}>
                      <input placeholder="Hizmet" value={serviceName} onChange={e => setServiceName(e.target.value)} required style={{width:'100%'}}/>
                      <input placeholder="Fiyat" value={servicePrice} onChange={e => setServicePrice(e.target.value)} required style={{width:'48%'}}/>
                      <input placeholder="Süre" value={serviceDuration} onChange={e => setServiceDuration(e.target.value)} required style={{width:'48%'}}/>
                      <button type="submit" style={{marginTop:'5px', width:'100%'}}>Hizmet Ekle</button>
                    </form>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}