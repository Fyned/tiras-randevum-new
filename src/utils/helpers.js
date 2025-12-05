// Telefon Numarası Formatlama ve Kontrol
export const validatePhone = (phone) => {
  // Tüm boşlukları ve parantezleri temizle
  let clean = phone.replace(/\D/g, '');

  // Başında 0 varsa sil (0555 -> 555)
  if (clean.startsWith('0')) {
    clean = clean.substring(1);
  }

  // Türkiye numaraları 10 haneli olmalı ve 5 ile başlamalı (5XX XXX XX XX)
  const isValid = /^[5][0-9]{9}$/.test(clean);

  return {
    isValid,
    clean, // Veritabanına kaydedilecek saf hali (örn: 5551234567)
    formatted: isValid ? `0${clean.substring(0,3)} ${clean.substring(3,6)} ${clean.substring(6,8)} ${clean.substring(8,10)}` : phone
  };
}
// ... (Mevcut validatePhone fonksiyonu kalsın)

// RESİM KIRPMA YARDIMCISI
export const getCroppedImg = (imageSrc, pixelCrop) => {
  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener('load', () => resolve(image))
      image.addEventListener('error', (error) => reject(error))
      image.setAttribute('crossOrigin', 'anonymous')
      image.src = url
    })

  return new Promise(async (resolve, reject) => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      return null
    }

    // Canvas boyutunu ayarla
    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    // Resmi çiz ve kes
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    )

    // Blob (Dosya) olarak döndür
    canvas.toBlob((file) => {
      resolve(file)
    }, 'image/jpeg', 0.9) // %90 kalite JPG
  })
}