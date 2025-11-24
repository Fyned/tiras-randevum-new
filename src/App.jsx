import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Sayfalarımızı içe aktarıyoruz
import Home from './pages/Home'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import ShopPage from './pages/ShopPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Anasayfa */}
        <Route path="/" element={<Home />} />

        {/* Giriş Sayfası */}
        <Route path="/login" element={<Login />} />

        {/* Yönetim Paneli (İleride korumalı yapacağız) */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Dinamik Salon Sayfası (slug ne gelirse ona göre açılır) */}
        <Route path="/salon/:slug" element={<ShopPage />} />

        {/* Bulunamadı (404) Sayfası - Basitçe */}
        <Route path="*" element={<h2>Sayfa Bulunamadı</h2>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App