// Called from the browser via supabase.functions.invoke('create-cashfree-order', ...)
// Creates a Cashfree order server-side (secret key never touches the client),
// logs a `payments` row, and links it to the leads_course record.
//
// This file is self-contained (no imports from a shared folder) so it can be
// pasted directly into the Supabase Dashboard's "Create new edge function" editor.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getCashfreeBaseUrl(): string {
  const env = Deno.env.get('CASHFREE_ENV') ?? 'sandbox';
  return env === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
}

function cashfreeHeaders(): HeadersInit {
  return {
    'x-client-id': Deno.env.get('CASHFREE_CLIENT_ID') ?? '',
    'x-client-secret': Deno.env.get('CASHFREE_CLIENT_SECRET') ?? '',
    'x-api-version': '2023-08-01',
    'Content-Type': 'application/json',
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { leadCourseId, amount, customerName, customerEmail, customerPhone, courseTitle } = await req.json();

    if (!leadCourseId || !amount || Number(amount) <= 0 || !customerEmail || !customerPhone) {
      return new Response(JSON.stringify({ error: 'Missing or invalid required fields.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://nexrnntechnology.in';
    const functionsBase = `${Deno.env.get('SUPABASE_URL')}/functions/v1`;

    const cfResponse = await fetch(`${getCashfreeBaseUrl()}/orders`, {
      method: 'POST',
      headers: cashfreeHeaders(),
      body: JSON.stringify({
        order_id: orderId,
        order_amount: Number(amount),
        order_currency: 'INR',
        customer_details: {
          customer_id: `cust_${String(leadCourseId).replace(/-/g, '')}`,
          customer_name: customerName || 'Student',
          customer_email: customerEmail,
          customer_phone: customerPhone,
        },
        order_meta: {
          return_url: `${siteUrl}/enrollment-payment-status?order_id={order_id}`,
          notify_url: `${functionsBase}/cashfree-webhook`,
        },
        order_note: courseTitle || '',
      }),
    });

    const cfData = await cfResponse.json();

    if (!cfResponse.ok) {
      return new Response(JSON.stringify({ error: cfData.message || 'Failed to create payment order.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await supabase.from('payments').insert({
      lead_course_id: leadCourseId,
      cashfree_order_id: orderId,
      amount: Number(amount),
      currency: 'INR',
      status: 'created',
      raw_response: cfData,
    });

    await supabase.from('leads_course').update({ cashfree_order_id: orderId }).eq('id', leadCourseId);

    return new Response(
      JSON.stringify({ orderId, paymentSessionId: cfData.payment_session_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unexpected error.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
