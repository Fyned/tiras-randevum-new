import React from 'react'
import { useParams } from 'react-router-dom'

export default function ShopPage() {
  // URL'deki salon adını (slug) alır. Örn: /salon/kardesler-berber
  const { slug } = useParams()

  return (
    <div style={{ padding: '20px' }}>
      <h1>Salon Sayfası: {slug}</h1>
      <p>Bu salona ait berberler ve hizmetler burada listelenecek.</p>
      <button>Randevu Al</button>
    </div>
  )
}