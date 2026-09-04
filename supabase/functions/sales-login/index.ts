// Sales team login: Sales ID + registered mobile number.
// Mentor-login ka exact clone - sirf sales_members table + 'sid' payload.
// Server-side validation (service-role), success par HMAC-signed
// short-lived token. Token me sales member ka DB uuid hota hai - baaki
// sab sales-data fn isi se derive karta hai (frontend se kabhi nahi).
//
// Self-contained (dashboard "Create edge function" me paste-ready).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sales-token',
};

const TOKEN_TTL_SECONDS = 60 * 60 * 12; // 12 ghante

function b64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sign(payloadB64: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64));
  return b64url(new Uint8Array(sig));
}

function normalizePhone(phone: string): string {
  return (phone || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { salesId, phone } = await req.json();
    if (!salesId || !phone) {
      return new Response(JSON.stringify({ error: 'Sales ID and mobile number are required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: member, error } = await supabase
      .from('sales_members')
      .select('id, sales_id, name, email, phone, commission_course, commission_workshop, commission_service, location, date_of_joining, gender, blocked, referral_code')
      .eq('sales_id', String(salesId).trim().toUpperCase())
      .maybeSingle();

    // Table/DB problem alag batao (setup error), galat credentials alag
    if (error) {
      const msg = /relation .* does not exist|schema cache/i.test(error.message || '')
        ? 'Sales table not found — run migration 30 in Supabase SQL Editor first.'
        : `Database error: ${error.message}`;
      return new Response(JSON.stringify({ error: msg }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Blocked member: login + clear message
    if (member?.blocked) {
      return new Response(JSON.stringify({ error: 'You are blocked By Nexrnn Admin. If this is any error so pls Contect Admin.', blocked: true }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Galat credentials - generic message (enumeration se bachne ke liye)
    if (!member || normalizePhone(member.phone) !== normalizePhone(String(phone))) {
      return new Response(JSON.stringify({ error: 'Invalid Sales ID or mobile number.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Signed token: payload.sid = sales_members.id (uuid), exp = expiry
    const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
    const payloadB64 = b64url(new TextEncoder().encode(JSON.stringify({ sid: member.id, exp })));
    const secret = Deno.env.get('MENTOR_TOKEN_SECRET') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const sig = await sign(payloadB64, secret);

    return new Response(
      JSON.stringify({
        token: `${payloadB64}.${sig}`,
        expiresAt: exp,
        member: {
          salesId: member.sales_id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          location: member.location,
          commissionCourse: Number(member.commission_course) || 0,
          commissionWorkshop: Number(member.commission_workshop) || 0,
          commissionService: Number(member.commission_service) || 0,
          dateOfJoining: member.date_of_joining,
          gender: member.gender || '',
          referralCode: member.referral_code || '',
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(JSON.stringify({ error: 'Login failed. Try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
