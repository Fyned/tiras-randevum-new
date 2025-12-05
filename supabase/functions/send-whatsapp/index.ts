// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const VATAN_API_URL = "https://api.toplusms.app/bulk/wp/nton"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // CORS (Tarayıcı izni) ayarı
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, message } = await req.json()

    // Numarayı VatanSMS formatına çevir (905xxxxxxxxx)
    let formattedPhone = phone.replace(/\D/g, '') // Sadece rakamları al
    if (formattedPhone.startsWith('0')) formattedPhone = formattedPhone.substring(1)
    if (!formattedPhone.startsWith('90')) formattedPhone = '90' + formattedPhone

    const payload = {
      messages: [
        {
          // @ts-ignore
          reg_id: Deno.env.get('VATAN_REG_ID') ?? '', 
          target: formattedPhone,
          message: message
        }
      ]
    }

    console.log("VatanSMS'e gönderiliyor...", payload)

    const response = await fetch(VATAN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // @ts-ignore
        'Authorization': `Bearer ${Deno.env.get('VATAN_TOKEN')}`
      },
      body: JSON.stringify(payload)
    })

    const result = await response.json()
    console.log("VatanSMS Cevabı:", result)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Bilinmeyen hata' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})