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