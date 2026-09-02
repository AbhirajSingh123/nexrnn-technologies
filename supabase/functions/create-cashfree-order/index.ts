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
    const { leadId, leadType, amount, customerName, customerEmail, customerPhone, itemTitle, applicationId, promoCode, itemId } = await req.json();

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

    // ---- Server-side amount: base (client bhejta hai) + promo discount + platform fee ----
    // Promo/platform YAHIN se recalc hote hain (DB se) - frontend ke numbers par bharosa nahi.
    const baseAmount = Math.max(0, Math.round(Number(amount) || 0));
    let discountAmount = 0;
    let appliedPromo = '';
    const cleanPromo = String(promoCode || '').trim().toUpperCase();

    if (cleanPromo) {
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('code, discount_type, discount_value, applies_to, item_id, max_uses, used_count, active')
        .eq('code', cleanPromo)
        .maybeSingle();
      const kindForPromo = isCareer ? 'career' : leadType;
      const promoOk =
        promo &&
        promo.active &&
        (!promo.max_uses || (promo.used_count ?? 0) < promo.max_uses) &&
        ((promo.applies_to || 'all') === 'all' ||
          ((promo.applies_to === kindForPromo) && (!promo.item_id || !itemId || String(promo.item_id) === String(itemId))));
      if (promoOk) {
        discountAmount = promo.discount_type === 'percent'
          ? Math.round((baseAmount * Number(promo.discount_value)) / 100)
          : Math.round(Number(promo.discount_value));
        discountAmount = Math.max(0, Math.min(discountAmount, baseAmount));
        appliedPromo = promo.code;
      }
    }

    // Platform fee admin settings se (site_settings, id=1)
    let platformFee = 0;
    const { data: settings } = await supabase
      .from('site_settings')
      .select('platform_fee_enabled, platform_fee_amount')
      .eq('id', 1)
      .maybeSingle();
    if (settings?.platform_fee_enabled) platformFee = Math.max(0, Math.round(Number(settings.platform_fee_amount) || 0));

    const finalAmount = Math.max(baseAmount - discountAmount, 0) + platformFee;
    if (finalAmount <= 0) {
      return new Response(JSON.stringify({ error: 'Payable amount is zero. Please contact us.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cfResponse = await fetch(`${getCashfreeBaseUrl()}/orders`, {
      method: 'POST',
      headers: cashfreeHeaders(),
      body: JSON.stringify({
        order_id: orderId,
        order_amount: finalAmount,
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
      amount: finalAmount,
      base_amount: baseAmount,
      discount_amount: discountAmount,
      promo_code: appliedPromo,
      platform_fee: platformFee,
      currency: 'INR',
      status: 'created',
      raw_response: cfData,
      lead_type: leadType,
    };

    // Promo usage count badhao (sahi apply hua ho to)
    if (appliedPromo) {
      await supabase.rpc('increment_promo_used_count', { p_code: appliedPromo });
    }
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
      JSON.stringify({ orderId, paymentSessionId: cfData.payment_session_id, baseAmount, discountAmount, promoCode: appliedPromo, platformFee, finalAmount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unexpected error.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
