import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Sayfalar
import Home from './pages/Home'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import ShopPage from './pages/ShopPage'
import ShopOwnerDashboard from './pages/ShopOwnerDashboard' // <-- YENİ EKLENDİ

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Anasayfa */}
        <Route path="/" element={<Home />} />

        {/* Giriş Sayfası */}
        <Route path="/login" element={<Login />} />

        {/* Süper Admin Paneli */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Dükkan Sahibi Paneli (YENİ) */}
        <Route path="/shop-panel" element={<ShopOwnerDashboard />} />

        {/* Müşteri Vitrini (Dinamik) */}
        <Route path="/salon/:slug" element={<ShopPage />} />

        {/* 404 */}
        <Route path="*" element={<div className="text-white text-center mt-20">Sayfa Bulunamadı</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App