// Mentor login: Mentor ID + registered mobile number.
// Server-side validation (mentors table service-role se check hota hai),
// success par HMAC-signed short-lived token return karta hai.
// Token me mentor ka DB uuid hota hai - baaki sab mentor-data fn isi se
// identity derive karta hai (frontend se kabhi nahi).
//
// Self-contained (dashboard "Create edge function" me paste-ready).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-mentor-token',
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
    const { mentorId, phone } = await req.json();
    if (!mentorId || !phone) {
      return new Response(JSON.stringify({ error: 'Mentor ID and mobile number are required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: mentor, error } = await supabase
      .from('mentors')
      .select('id, mentor_id, name, email, phone, commission_percent, commission_course, commission_workshop, location, mentor_type, date_of_joining, gender, blocked')
      .eq('mentor_id', String(mentorId).trim().toUpperCase())
      .maybeSingle();

    // Table/DB problem alag batao (setup error), galat credentials alag
    if (error) {
      const msg = /relation .* does not exist|schema cache/i.test(error.message || '')
        ? 'Mentors table not found — run migration 23 (and 24) in Supabase SQL Editor first.'
        : `Database error: ${error.message}`;
      return new Response(JSON.stringify({ error: msg }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Blocked mentor: login + clear message (Contact Us jaisa page bhi suggest)
    if (mentor?.blocked) {
      return new Response(JSON.stringify({ error: 'You are blocked By Nexrnn Admin. If this is any error so pls Contect Admin.', blocked: true }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Galat credentials - generic message (enumeration se bachne ke liye)
    if (!mentor || normalizePhone(mentor.phone) !== normalizePhone(String(phone))) {
      return new Response(JSON.stringify({ error: 'Invalid Mentor ID or mobile number.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Signed token: payload.mid = mentors.id (uuid), exp = expiry
    const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
    const payloadB64 = b64url(new TextEncoder().encode(JSON.stringify({ mid: mentor.id, exp })));
    const secret = Deno.env.get('MENTOR_TOKEN_SECRET') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const sig = await sign(payloadB64, secret);

    return new Response(
      JSON.stringify({
        token: `${payloadB64}.${sig}`,
        expiresAt: exp,
        mentor: {
          mentorId: mentor.mentor_id,
          name: mentor.name,
          email: mentor.email,
          phone: mentor.phone,
          location: mentor.location,
          mentorType: mentor.mentor_type,
          commissionPercent: Number(mentor.commission_percent ?? mentor.commission_course) || 0,
          commissionCourse: Number(mentor.commission_course) || 0,
          commissionWorkshop: Number(mentor.commission_workshop) || 0,
          dateOfJoining: mentor.date_of_joining,
          gender: mentor.gender || '',
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
