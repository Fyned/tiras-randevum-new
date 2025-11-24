import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { session, signOut } = useAuth()

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>✂️ Tıraş Randevum</h1>
      
      {session ? (
        // KULLANICI GİRİŞ YAPMIŞSA GÖRÜNECEK KISIM
        <div style={{ border: '1px solid green', padding: '20px', margin: '20px' }}>
          <h3>Hoşgeldin, {session.user.email}</h3>
          <p>Artık randevu alabilirsin.</p>
          <button onClick={signOut} style={{ padding: '5px 10px', background: 'red', color: 'white', border:'none' }}>
            Çıkış Yap
          </button>
        </div>
      ) : (
        // GİRİŞ YAPMAMIŞSA GÖRÜNECEK KISIM
        <div style={{ margin: '20px' }}>
          <p>Randevu almak için lütfen giriş yapın.</p>
          <Link to="/login">
            <button style={{ padding: '10px 20px' }}>Giriş Yap / Kayıt Ol</button>
          </Link>
        </div>
      )}

      <hr />
      <p><Link to="/salon/ornek-salon">➡️ Örnek Bir Salonu İncele (Girişsiz de görünür)</Link></p>
      <p><Link to="/admin">➡️ Admin Paneli (Şimdilik herkese açık)</Link></p>
    </div>
  )
}