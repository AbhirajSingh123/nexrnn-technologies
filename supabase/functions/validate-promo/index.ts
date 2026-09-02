// Public promo code validation (payment popup ka Apply button).
// Server-side check: code exists + active + usage limit + item match,
// discount calculate karta hai. Frontend sirf display ke liye use karta hai -
// FINAL authority phir bhi create-cashfree-order me hai (double-check).
//
// Paste directly into Supabase Dashboard's edge function editor as "validate-promo".

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { code, kind, amount, itemId } = await req.json();
    const cleanCode = String(code || '').trim().toUpperCase();
    const base = Number(amount) || 0;
    const kindOk = ['course', 'workshop', 'career'].includes(String(kind));
    if (!cleanCode || !kindOk || base <= 0) {
      return new Response(JSON.stringify({ valid: false, message: 'Enter a valid promo code.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: promo } = await supabase
      .from('promo_codes')
      .select('id, code, discount_type, discount_value, applies_to, item_id, max_uses, used_count, active')
      .eq('code', cleanCode)
      .maybeSingle();

    if (!promo) {
      return new Response(JSON.stringify({ valid: false, message: 'Invalid promo code.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!promo.active) {
      return new Response(JSON.stringify({ valid: false, message: 'This promo code is no longer active.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (promo.max_uses && (promo.used_count ?? 0) >= promo.max_uses) {
      return new Response(JSON.stringify({ valid: false, message: 'This promo code has reached its usage limit.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Item match: 'all' sab par; warna kind match + (item_id null = poore kind par, warna specific item)
    const appliesTo = promo.applies_to || 'all';
    if (appliesTo !== 'all') {
      if (appliesTo !== kind) {
        return new Response(JSON.stringify({ valid: false, message: `This code is only for ${appliesTo}s.` }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (promo.item_id && itemId && String(promo.item_id) !== String(itemId)) {
        return new Response(JSON.stringify({ valid: false, message: 'This code is not valid for this item.' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    let discount = promo.discount_type === 'percent' ? Math.round((base * Number(promo.discount_value)) / 100) : Math.round(Number(promo.discount_value));
    discount = Math.max(0, Math.min(discount, base)); // discount base se zyada nahi

    return new Response(
      JSON.stringify({
        valid: true,
        code: promo.code,
        discountType: promo.discount_type,
        discountValue: Number(promo.discount_value),
        discount,
        base,
        afterDiscount: base - discount,
        message: `Promo code applied — you save Rs. ${discount.toLocaleString('en-IN')}.`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(JSON.stringify({ valid: false, message: 'Could not verify the promo code. Try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
