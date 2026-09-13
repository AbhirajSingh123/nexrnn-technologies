// Public internship/job application submit.
//
// Kyun zaroori tha? Form pehle browser se DIRECT internship_applications table me insert
// karta tha. Table par RLS (row level security) ON hai aur anon ke liye sahi INSERT/RETURNING
// policy nahi thi → "new row violates row-level security policy" error. Anon ko wide SELECT
// policy dena data leak karta (sabhi applicants ka naam/email/mobile public), isliye insert
// ab SERVICE ROLE ke saath is edge function ke andar hota hai — RLS bypass, koi read leak nahi.
//
// Client: applicationsRepo.submitApplication() → POST /functions/v1/internship-apply
// Resume upload pehle jaisa client-side bucket me hi hota hai (storage policy already anon
// upload allow karti hai — user ke screenshot me upload ke baad insert fail hua tha).
//
// Self-contained (koi shared import nahi) — Supabase dashboard editor me paste-ready.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function str(v: unknown, max = 200): string {
  return String(v ?? '').trim().slice(0, max);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const p = await req.json().catch(() => null);
    if (!p || typeof p !== 'object') return json({ error: 'Invalid request.' }, 400);

    // ---- Required fields ----
    const fullName = str(p.full_name, 120);
    const email = str(p.email, 200).toLowerCase();
    const mobile = str(p.mobile, 15).replace(/[^\d]/g, '');
    if (!fullName || fullName.length < 3) return json({ error: 'Full name is required.' }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'A valid email is required.' }, 400);
    if (mobile.replace(/\D/g, '').length < 10) return json({ error: 'A valid 10-digit mobile number is required.' }, 400);

    // ---- Optional / validated fields (record same columns, client jaisa hi) ----
    const applicationType = p.application_type === 'job' ? 'job' : 'internship';
    const paymentStatus = p.payment_status === 'pending' ? 'pending' : 'free';
    const paymentAmount = Math.max(0, Math.min(1000000, Number(p.payment_amount) || 0));

    const record = {
      application_type: applicationType,
      opening_slug: str(p.opening_slug, 150),
      opening_title: str(p.opening_title, 200),
      opening_code: str(p.opening_code, 50),
      opening_domain: str(p.opening_domain, 120),
      full_name: fullName,
      email,
      mobile,
      gender: str(p.gender, 20),
      city: str(p.city, 120),
      state: str(p.state, 120),
      duration: str(p.duration, 120),
      preferred_mode: 'Online',
      college: str(p.college, 250),
      degree: str(p.degree, 120),
      degree_other: str(p.degree_other, 120),
      skills: str(p.skills, 2000),
      resume_path: str(p.resume_path, 400),
      resume_name: str(p.resume_name, 255),
      expectations: str(p.expectations, 2000),
      referral_code: str(p.referral_code, 20).toUpperCase(),
      payment_status: paymentStatus,
      payment_amount: paymentAmount,
    };

    // Paid opening ke liye order/verify edge functions hi 'paid' karte hain; yahan
    // free ya pending-payment record banta hai. Pending ke liye opening context chahiye.
    if (paymentStatus === 'pending' && !record.opening_slug) {
      return json({ error: 'Paid application requires an opening reference.' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // application_id DB trigger se generate hota hai (pehle jaisa)
    const { data, error } = await supabase
      .from('internship_applications')
      .insert(record)
      .select('id, application_id')
      .single();

    if (error) {
      console.error('internship-apply insert error:', error.message);
      return json({ error: 'Could not save your application right now. Please try again in a while.' }, 500);
    }

    return json({ id: data?.id ?? '', applicationId: data?.application_id ?? '' });
  } catch (e) {
    console.error('internship-apply error:', e);
    return json({ error: 'Something went wrong. Please try again in a while.' }, 500);
  }
});
