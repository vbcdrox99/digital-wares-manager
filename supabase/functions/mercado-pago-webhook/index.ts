import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const url = new URL(req.url)
    const topic = url.searchParams.get("topic") || url.searchParams.get("type")
    const id = url.searchParams.get("data.id") || url.searchParams.get("id")

    // Mercado Pago pode enviar dados no body (POST) ou na URL
    let body: any = null;
    if (req.method === 'POST') {
      try {
        body = await req.json();
      } catch(e) {
        console.log("No JSON body or unable to parse");
      }
    }

    const action = body?.action || topic;
    const paymentId = body?.data?.id || id;

    const logs: string[] = [];
    logs.push(`Action: ${action}, PaymentId: ${paymentId}`);

    if (action === 'payment.updated' || action === 'payment.created' || action === 'payment') {
      if (paymentId) {
        let MP_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') || "";
        if (MP_ACCESS_TOKEN.startsWith('CAPP_USR-')) {
          MP_ACCESS_TOKEN = MP_ACCESS_TOKEN.substring(1);
        }
        
        logs.push(`Fetching payment details from Mercado Pago...`);
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            "Authorization": `Bearer ${MP_ACCESS_TOKEN}`
          }
        });
        
        const paymentData = await mpResponse.json();
        logs.push(`MP Status: ${paymentData.status}, External Ref: ${paymentData.external_reference}`);
        
        if (paymentData.status === 'approved') {
          const orderId = paymentData.external_reference;
          
          if (orderId) {
            const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
            const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
            logs.push(`Supabase URL: ${supabaseUrl ? 'Present' : 'Missing'}, Service Role: ${supabaseServiceRole ? 'Present' : 'Missing'}`);
            
            const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);

            if (orderId.startsWith("donation:")) {
              const donationId = orderId.substring("donation:".length);
              logs.push(`Updating donation status to paid for ID: ${donationId}...`);
              const { error: donationError } = await supabaseAdmin
                .from('dotapix_donations')
                .update({ is_paid: true, payment_id: String(paymentId) })
                .eq('id', donationId);

              if (donationError) {
                logs.push(`Error updating donation: ${JSON.stringify(donationError)}`);
              } else {
                logs.push(`Donation updated to paid successfully.`);
              }
            } else {
              logs.push(`Updating order status to paid (is_paid = true)...`);
              const { error: orderError } = await supabaseAdmin
                .from('orders')
                .update({ is_paid: true })
                .eq('id', orderId);

              if (orderError) {
                logs.push(`Error updating order: ${JSON.stringify(orderError)}`);
              } else {
                logs.push(`Order updated to paid successfully.`);
              }

            logs.push(`Fetching order items...`);
            const { data: orderItems, error: itemsFetchError } = await supabaseAdmin
              .from('order_items')
              .select('item_id, quantity')
              .eq('order_id', orderId);

            if (itemsFetchError) {
              logs.push(`Error fetching order items: ${JSON.stringify(itemsFetchError)}`);
            }

            if (orderItems && orderItems.length > 0) {
              logs.push(`Found ${orderItems.length} items. Updating stock...`);
              for (const orderItem of orderItems) {
                const { data: itemData, error: itemGetError } = await supabaseAdmin
                  .from('items')
                  .select('current_stock')
                  .eq('id', orderItem.item_id)
                  .single();
                  
                if (itemGetError) {
                  logs.push(`Error getting stock for item ${orderItem.item_id}: ${JSON.stringify(itemGetError)}`);
                }

                if (itemData) {
                  const newStock = Math.max(0, itemData.current_stock - orderItem.quantity);
                  const { error: stockUpdateError } = await supabaseAdmin
                    .from('items')
                    .update({ current_stock: newStock })
                    .eq('id', orderItem.item_id);
                  
                  if (stockUpdateError) {
                    logs.push(`Error updating stock for item ${orderItem.item_id}: ${JSON.stringify(stockUpdateError)}`);
                  } else {
                    logs.push(`Stock for item ${orderItem.item_id} updated from ${itemData.current_stock} to ${newStock}`);
                  }
                }
              }
            }
          }
        }
      }
    }
  }

    console.log("Webhook logs:", logs.join(" | "));
    return new Response(JSON.stringify({ message: 'Webhook processado', logs }), { status: 200 })
  } catch (error: any) {
    console.error("Erro no Webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
