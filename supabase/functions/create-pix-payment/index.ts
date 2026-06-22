import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS pré-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order, donation, customer_email, customer_name, customer_cpf, is_donation } = await req.json()

    const MP_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
    if (!MP_ACCESS_TOKEN || MP_ACCESS_TOKEN === 'undefined' || MP_ACCESS_TOKEN === 'null' || MP_ACCESS_TOKEN.trim() === '') {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN não está configurado ou está inválido no Supabase. Adicione esta variável em Settings -> Edge Functions no painel do Supabase.")
    }

    const amount = is_donation ? Number(donation.amount) : Number(order.total_value);
    const description = is_donation 
      ? `Doacao DotaPix - ${donation.donor_name}` 
      : `Pedido ${order.id.slice(0,8)} - Dotaplay`;
    const externalRef = is_donation ? `donation:${donation.id}` : order.id;

    const paymentData = {
      transaction_amount: amount,
      description: description,
      payment_method_id: "pix",
      payer: {
        email: customer_email || "suporte@dotaplay.com.br",
        first_name: customer_name,
        identification: {
          type: "CPF",
          number: customer_cpf.replace(/\D/g, '') // remove pontuação do CPF
        }
      },
      external_reference: externalRef,
      notification_url: "https://jlghsevsildatnjhediw.supabase.co/functions/v1/mercado-pago-webhook"
    };

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": externalRef // Evitar cobrança duplicada
      },
      body: JSON.stringify(paymentData)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro no Mercado Pago:", data);
      throw new Error(`Mercado Pago recusou: ${data.message || JSON.stringify(data)}`);
    }

    return new Response(
      JSON.stringify({ 
        qr_code_base64: data.point_of_interaction.transaction_data.qr_code_base64,
        qr_code: data.point_of_interaction.transaction_data.qr_code,
        payment_id: data.id
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Erro desconhecido' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // Supabase-js esconde a mensagem se for 400
    })
  }
})
