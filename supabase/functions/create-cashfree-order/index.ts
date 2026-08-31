// Called from the browser via supabase.functions.invoke('create-cashfree-order', ...)
// Creates a Cashfree order server-side (secret key never touches the client),
// logs a `payments` row, and links it to the leads_course OR leads_workshop
// record depending on `leadType`.
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
    const { leadId, leadType, amount, customerName, customerEmail, customerPhone, itemTitle, applicationId } = await req.json();

    // Career application flow: leadType 'career' + applicationId (application pehle create hoti hai)

    const isCareer = leadType === 'career' || Boolean(applicationId);
    if (!leadId || !leadType || !['course', 'workshop', 'career'].includes(leadType) || !amount || Number(amount) <= 0 || !customerEmail || !customerPhone) {
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
    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://www.nexrnntechnologies.in';
    const functionsBase = `${Deno.env.get('SUPABASE_URL')}/functions/v1`;

    const cfResponse = await fetch(`${getCashfreeBaseUrl()}/orders`, {
      method: 'POST',
      headers: cashfreeHeaders(),
      body: JSON.stringify({
        order_id: orderId,
        order_amount: Number(amount),
        order_currency: 'INR',
        customer_details: {
          customer_id: `cust_${String(leadId).replace(/-/g, '')}`,
          customer_name: customerName || 'Student',
          customer_email: customerEmail,
          customer_phone: customerPhone,
        },
        order_meta: {
          return_url: isCareer
            ? `${siteUrl}/application-payment-status?order_id={order_id}`
            : `${siteUrl}/enrollment-payment-status?order_id={order_id}`,
          notify_url: `${functionsBase}/cashfree-webhook`,
        },
        order_note: itemTitle || '',
      }),
    });

    const cfData = await cfResponse.json();

    if (!cfResponse.ok) {
      return new Response(JSON.stringify({ error: cfData.message || 'Failed to create payment order.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const paymentRecord: Record<string, unknown> = {
      cashfree_order_id: orderId,
      amount: Number(amount),
      currency: 'INR',
      status: 'created',
      raw_response: cfData,
      lead_type: leadType,
    };
    if (isCareer) {
      paymentRecord.application_id = applicationId || leadId;
      paymentRecord.item_title = itemTitle || '';
    } else if (leadType === 'course') {
      paymentRecord.lead_course_id = leadId;
    } else {
      paymentRecord.lead_workshop_id = leadId;
    }

    await supabase.from('payments').insert(paymentRecord);

    if (!isCareer) {
      const leadTable = leadType === 'course' ? 'leads_course' : 'leads_workshop';
      await supabase.from(leadTable).update({ cashfree_order_id: orderId }).eq('id', leadId);
    }

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
