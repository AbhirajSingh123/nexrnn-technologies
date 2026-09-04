// Called from the admin panel via supabase.functions.invoke('admin-offline-payment', ...)
// Marks a course/workshop/career payment as PAID without a gateway payment
// (cash / direct UPI / bank transfer collected offline). Only an admin can
// call this: the admin's access token is verified against profiles (is_admin).
//
// Self-contained so it can be pasted directly into the Supabase Dashboard's
// "Create new edge function" editor.

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
    const authHeader = req.headers.get('Authorization') || '';
    const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Not allowed.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // ---- Admin verify (server-side, token par bharosa ke sath profile check) ----
    const { data: userData, error: userErr } = await supabase.auth.getUser(accessToken);
    if (userErr || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: 'Not allowed.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    // profiles table: id, full_name, role ('admin' | 'super_admin'), created_at
    // (email column NAHI hai — use ka liye auth user se lena hai)
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', userData.user.id)
      .maybeSingle();
    const isAdmin = !!profile && !profileErr && (profile.role === 'admin' || profile.role === 'super_admin');
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Not allowed.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { leadType, leadId, applicationId, amount, method, note, countCommission } = await req.json();

    const cleanNote = String(note || '').trim();
    if (!cleanNote) {
      return new Response(JSON.stringify({ error: 'A short reason/note is required for offline payments.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const amt = Math.max(0, Math.round(Number(amount) || 0));
    const cleanMethod = ['Cash', 'Direct UPI', 'Bank Transfer', 'Other'].includes(method) ? method : 'Other';
    const eligible = countCommission !== false;

    const isCareer = leadType === 'career' || Boolean(applicationId);
    const kind = isCareer ? 'career' : leadType === 'workshop' ? 'workshop' : 'course';
    const leadTable = isCareer ? 'internship_applications' : kind === 'workshop' ? 'leads_workshop' : 'leads_course';

    // ---- Lead/application row (referral attribution server-side) ----
    // HAR table ke apne columns: leads_course/leads_workshop me name + course_title/
    // workshop_title + price hote hain; internship_applications me full_name +
    // opening_title + payment_amount. Ek hi select sab par fail ho jata tha.
    let referralCode = '';
    let itemTitle = '';
    let leadRowId = applicationId || leadId;
    if (!leadRowId) {
      return new Response(JSON.stringify({ error: 'Missing enrollment/application id.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const leadSelect = isCareer
      ? 'referral_code, opening_title, payment_amount'
      : kind === 'workshop'
        ? 'referral_code, name, workshop_title, price'
        : 'referral_code, name, course_title, price';
    const { data: leadRow, error: leadErr } = await supabase
      .from(leadTable)
      .select(leadSelect)
      .eq('id', leadRowId)
      .maybeSingle();
    if (!leadRow) {
      const colIssue = leadErr && /column|schema|PGRST/i.test(leadErr.message || '');
      return new Response(JSON.stringify({
        error: colIssue
          ? "Database schema is out of sync. In the Supabase SQL Editor run: NOTIFY pgrst, 'reload schema'; then try again."
          : 'Enrollment/application not found. Please refresh the page and try again.',
      }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    referralCode = leadRow.referral_code || '';
    itemTitle = isCareer ? (leadRow.opening_title || '') : ((leadRow.course_title || leadRow.workshop_title || ''));

    // ---- Payment record ----
    const orderId = `OFF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const paymentRecord: Record<string, unknown> = {
      cashfree_order_id: orderId,
      cf_payment_id: '',
      amount: amt,
      base_amount: amt,
      discount_amount: 0,
      promo_code: '',
      platform_fee: 0,
      currency: 'INR',
      status: 'paid',
      payment_method: 'offline',
      // offline_method/offline_note/commission_eligible columns jaan-boojh kar
      // NAHI bhejte — naye columns ka schema-cache issue aa sakta hai. Sab
      // extra info raw_response (jsonb, purana column) me safe rehti hai.
      raw_response: { source: 'offline', by: userData.user.email || profile.full_name || '', note: cleanNote, method: cleanMethod, countCommission: eligible },
      lead_type: kind,
    };
    // paid_at JAAN-BOOJH KAR NAHI bhejte (kuch projects ka schema-cache isko
    // bhi miss karta hai) — mark time raw_response me safe rehta hai
    paymentRecord.raw_response.markedAt = new Date().toISOString();
    if (itemTitle) paymentRecord.item_title = itemTitle;
    // Commission count NAHI karna to code blank kar do — sales-data code se hi
    // commission dhoondhta hai, khali code = zero commission (bina naye columns ke)
    if (!eligible) referralCode = '';
    if (referralCode) paymentRecord.referral_code = referralCode;
    if (isCareer) {
      paymentRecord.application_id = leadRowId;
    } else if (kind === 'workshop') {
      paymentRecord.lead_workshop_id = leadRowId;
    } else {
      paymentRecord.lead_course_id = leadRowId;
    }
    // Insert: pele poora record; agar DB ka schema-cache koi column na jane
    // (purane projects me hota hai) to base columns tak slim karke dobara —
    // payment record HAR HAAL me ban jata hai
    let insErr = (await supabase.from('payments').insert(paymentRecord)).error;
    if (insErr && /could not find|schema cache/i.test(insErr.message || '')) {
      const slim: Record<string, unknown> = {
        cashfree_order_id: paymentRecord.cashfree_order_id,
        cf_payment_id: '',
        amount: paymentRecord.amount,
        currency: 'INR',
        status: 'paid',
        payment_method: 'offline',
        raw_response: paymentRecord.raw_response,
        lead_type: paymentRecord.lead_type,
      };
      if (paymentRecord.application_id) slim.application_id = paymentRecord.application_id;
      if (paymentRecord.lead_course_id) slim.lead_course_id = paymentRecord.lead_course_id;
      if (paymentRecord.lead_workshop_id) slim.lead_workshop_id = paymentRecord.lead_workshop_id;
      insErr = (await supabase.from('payments').insert(slim)).error;
    }
    if (insErr) {
      return new Response(JSON.stringify({ error: insErr.message || 'Could not save the offline payment.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ---- Purane atke hue created/pending online orders expire kar do ----
    if (!isCareer) {
      const fkCol = kind === 'workshop' ? 'lead_workshop_id' : 'lead_course_id';
      await supabase
        .from('payments')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq(fkCol, leadRowId)
        .in('status', ['created', 'pending'])
        .neq('cashfree_order_id', orderId);
    }

    // ---- Lead/application update ----
    if (isCareer) {
      await supabase
        .from('internship_applications')
        .update({ payment_status: 'paid', payment_amount: amt, order_id: orderId, updated_at: new Date().toISOString() })
        .eq('id', leadRowId);
    } else {
      await supabase
        .from(leadTable)
        .update({ payment_status: 'paid', enrollment_status: 'enrolled', updated_at: new Date().toISOString() })
        .eq('id', leadRowId);
    }

    return new Response(JSON.stringify({ ok: true, orderId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unexpected error.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
