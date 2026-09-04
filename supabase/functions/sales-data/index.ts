// Sales panel ka single data API (mentor-data ka clone, sales scope).
// Identity HAMESHA x-sales-token header wale HMAC token se - body/query me
// bheja gaya koi bhi sales id ignore/har jeetata hai.
// Sab queries service-role se chalti hain par SCOPED to usi member ke data par.
//
// Actions: dashboard | profile | services | leads | referrals | wallet
//          | withdrawal_list | withdrawal_create | issues | issue_create
//
// Self-contained (dashboard "Create edge function" me paste-ready).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  // x-sales-token ZAROORI allowlist me: warna browser POST preflight block karta hai
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sales-token',
};

function b64urlDecode(s: string): Uint8Array {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
}

async function verifyToken(token: string): Promise<string | null> {
  try {
    const [payloadB64, sig] = token.split('.');
    if (!payloadB64 || !sig) return null;
    const secret = Deno.env.get('MENTOR_TOKEN_SECRET') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const expected = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64));
    const a = new Uint8Array(expected);
    const b = b64urlDecode(sig);
    if (a.length !== b.length) return null;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    if (diff !== 0) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64)));
    if (!payload.sid || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload.sid; // sales_members.id (uuid)
  } catch {
    return null;
  }
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

function slugifyLocal(s: string): string {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // ---- Auth: token -> sales uuid ----
  let body0: { sales_token?: string } = {};
  try {
    body0 = await req.clone().json();
  } catch {
    /* ignore */
  }
  const token =
    req.headers.get('x-sales-token') ||
    body0.sales_token ||
    (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const salesUuid = await verifyToken(token);
  if (!salesUuid) {
    return json({ error: 'Session expired. Please login again.' }, 401);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let body: { action?: string; issue?: string; attachment?: { name?: string; type?: string; data?: string }; fields?: Record<string, unknown>; id?: number | string; slug?: string; announcement_id?: string; emoji?: string; message?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body theek hai (GET-style actions) */
  }

  // ---- Member profile (har action me kaam aayega) ----
  const { data: member } = await supabase
    .from('sales_members')
    .select('id, sales_id, referral_code, name, email, phone, commission_percent, commission_course, commission_workshop, commission_service, bank_acc_no, bank_acc_name, bank_ifsc, upi_id, location, date_of_joining, gender, blocked, created_at')
    .eq('id', salesUuid)
    .maybeSingle();
  if (!member) return json({ error: 'Session expired. Please login again.' }, 401);
  // Block ho chuka member ka session turant dead ho jaye
  if (member.blocked) {
    return json({ error: 'You are blocked By Nexrnn Admin. If this is any error so pls Contect Admin.', blocked: true }, 403);
  }

  const commissionCourse = Number(member.commission_course ?? member.commission_percent) || 0;
  const commissionWorkshop = Number(member.commission_workshop ?? member.commission_percent) || 0;
  const commissionService = Number(member.commission_service ?? member.commission_percent) || 0;
  const rateFor = (leadType: string) =>
    leadType === 'workshop' ? commissionWorkshop : leadType === 'career' ? commissionService : commissionCourse;

  // price column formatted text ho sakta hai ("₹5,999" / "6000") — digits nikaal kar number
  const toNum = (v: unknown): number => {
    const n = Number(String(v ?? '').replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : 0;
  };

  /**
   * Sales attribution: user ne lead form par jo referral code dala wo
   * lead + payments rows par save hota hai. Wallet = USI code wale PAID
   * payments par commission (rate lead type se).
   */
  const fetchReferredPayments = async () => {
    let q = await supabase
      .from('payments')
      .select('id, amount, lead_type, item_title, status, created_at, leads_course(name), leads_workshop(name), internship_applications(full_name)')
      .eq('referral_code', member.referral_code || '\u0000')
      .eq('status', 'paid')
      .neq('commission_eligible', false)
      .order('created_at', { ascending: false });
    // Naya column DB sync na ho to bina usi ke (sab ko eligible maano)
    if (q.error && /schema cache|could not find/i.test(q.error.message || '')) {
      q = await supabase
        .from('payments')
        .select('id, amount, lead_type, item_title, status, created_at, leads_course(name), leads_workshop(name), internship_applications(full_name)')
        .eq('referral_code', member.referral_code || '\u0000')
        .eq('status', 'paid')
        .order('created_at', { ascending: false });
    }
    return q.data ?? [];
  };

  /**
   * Service deals: admin ne leads_service par Amount set kiya + status Done
   * kiya to wo deal member ki commission ban jati hai (amount x service %).
   * Yahi paisa Total Earned + Wallet me aata hai aur withdrawal ho sakta hai.
   */
  const fetchServiceDeals = async () => {
    let q = await supabase
      .from('leads_service')
      .select('id, service_title, amount, status, name, updated_at, created_at')
      .eq('referral_code', member.referral_code || '\u0000')
      .eq('status', 'done')
      .gt('amount', 0)
      .order('updated_at', { ascending: false });
    // updated_at schema-cache me na ho to created_at par hi le lo (commission na ruke)
    if (q.error && /could not find|schema cache/i.test(q.error.message || '')) {
      q = await supabase
        .from('leads_service')
        .select('id, service_title, amount, status, name, created_at')
        .eq('referral_code', member.referral_code || '\u0000')
        .eq('status', 'done')
        .gt('amount', 0)
        .order('created_at', { ascending: false });
    }
    return q.data ?? [];
  };

  const fetchWallet = async () => {
    const [pays, deals] = await Promise.all([fetchReferredPayments(), fetchServiceDeals()]);
    let earned = 0;
    for (const p of pays) earned += (Number(p.amount) || 0) * rateFor(p.lead_type) / 100;
    for (const d of deals) earned += (Number(d.amount) || 0) * commissionService / 100;
    earned = Math.round(earned);
    const { data: wrows } = await supabase
      .from('sales_withdrawals')
      .select('amount, status')
      .eq('sales_uuid', salesUuid);
    let withdrawn = 0;
    let pending = 0;
    for (const w of wrows ?? []) {
      const a = Number(w.amount) || 0;
      if (w.status === 'Payment Done') withdrawn += a;
      else pending += a;
    }
    return { earned, withdrawn, pending, available: Math.max(earned - withdrawn - pending, 0) };
  };

  const action = body.action || 'dashboard';

  try {
    // ================= DASHBOARD =================
    if (action === 'dashboard') {
      const [pays, deals] = await Promise.all([fetchReferredPayments(), fetchServiceDeals()]);
      const today = new Date().toISOString().slice(0, 10);
      const month = today.slice(0, 7);
      let total = 0;
      let todayEarn = 0;
      let monthEarn = 0;
      const earnedByType = { course: 0, workshop: 0, service: 0 };
      for (const p of pays) {
        const amt = (Number(p.amount) || 0) * rateFor(p.lead_type) / 100;
        total += amt;
        const key = p.lead_type === 'workshop' ? 'workshop' : p.lead_type === 'career' ? 'service' : 'course';
        earnedByType[key] += amt;
        const d = (p.created_at || '').slice(0, 10);
        if (d === today) todayEarn += amt;
        if ((p.created_at || '').slice(0, 7) === month) monthEarn += amt;
      }
      for (const d of deals) {
        const amt = (Number(d.amount) || 0) * commissionService / 100;
        total += amt;
        earnedByType.service += amt;
        const dstr = (d.updated_at || d.created_at || '').slice(0, 10);
        if (dstr === today) todayEarn += amt;
        if ((d.updated_at || d.created_at || '').slice(0, 7) === month) monthEarn += amt;
      }

      // Referred leads (3 lead tables me apna code)
      const [lc, lw, ls] = await Promise.all([
        supabase.from('leads_course').select('id').eq('referral_code', member.referral_code || '\u0000'),
        supabase.from('leads_workshop').select('id').eq('referral_code', member.referral_code || '\u0000'),
        supabase.from('leads_service').select('id, amount').eq('referral_code', member.referral_code || '\u0000'),
      ]);
      const totalReferrals = (lc.data?.length ?? 0) + (lw.data?.length ?? 0) + (ls.data?.length ?? 0);
      // Pipeline: mere service leads ki total deal value (commission isi se banega)
      const pipelineAmount = (ls.data ?? []).reduce((s, l) => s + (Number(l.amount) || 0), 0);

      return json({
        member: {
          name: member.name,
          salesId: member.sales_id,
          referralCode: member.referral_code || '',
        },
        commissionCourse,
        commissionWorkshop,
        commissionService,
        wallet: await fetchWallet(),
        totalEarnings: Math.round(total),
        todayEarnings: Math.round(todayEarn),
        monthEarnings: Math.round(monthEarn),
        totalReferrals,
        paidConversions: pays.length,
        pipelineAmount,
        referralByType: {
          course: lc.data?.length ?? 0,
          workshop: lw.data?.length ?? 0,
          service: ls.data?.length ?? 0,
        },
        earnedByType: {
          course: Math.round(earnedByType.course),
          workshop: Math.round(earnedByType.workshop),
          service: Math.round(earnedByType.service),
        },
      });
    }

    // ================= MY BLOGS (sales ke apne posts) =================
    if (action === 'blog_categories') {
      const { data } = await supabase.from('blog_categories').select('slug, name').order('name');
      return json({ categories: data ?? [] });
    }

    if (action === 'blogs_list') {
      const { data } = await supabase
        .from('blog_posts')
        .select('id, blog_code, slug, title, excerpt, content, cover_image_url, author_name, author_role, tags, reading_time, is_published, published_at, category_slug, views')
        .eq('sales_uuid', salesUuid)
        .order('created_at', { ascending: false });
      return json({
        rows: (data ?? []).map((b) => ({
          id: b.id,
          blogCode: b.blog_code || '',
          slug: b.slug,
          title: b.title,
          excerpt: b.excerpt,
          content: b.content,
          coverImageUrl: b.cover_image_url,
          authorName: b.author_name,
          authorRole: b.author_role,
          tags: b.tags || [],
          readingTime: b.reading_time,
          isPublished: b.is_published,
          publishedAt: b.published_at,
          categorySlug: b.category_slug,
          views: Number(b.views) || 0,
        })),
      });
    }

    // ================= BLOG SAVE (create/update own) =================
    if (action === 'blog_save') {
      const f = body.fields || {};
      const title = String(f.title || '').trim();
      if (!title) return json({ error: 'Title is required.' }, 400);
      const content = String(f.content || '');
      if (!content.trim()) return json({ error: 'Content is required.' }, 400);
      if (!f.category_slug) return json({ error: 'Category is required.' }, 400);

      const base = {
        title: title.slice(0, 160),
        category_slug: String(f.category_slug).slice(0, 80),
        excerpt: String(f.excerpt || '').slice(0, 400),
        content,
        cover_image_url: String(f.cover_image_url || '').slice(0, 500),
        author_name: member.name || 'NexRNN Sales',
        author_role: 'Sales, NexRNN Technologies',
        tags: Array.isArray(f.tags) ? f.tags.map((t) => String(t).slice(0, 30)).slice(0, 8) : [],
        is_published: f.is_published !== false,
      };

      if (body.id) {
        // Sirf apna hi blog update ho sakta hai
        const { data: owned } = await supabase
          .from('blog_posts')
          .select('id')
          .eq('id', body.id)
          .eq('sales_uuid', salesUuid)
          .maybeSingle();
        if (!owned) return json({ error: 'You can edit only your own posts.' }, 403);
        const payload = { ...base, updated_at: new Date().toISOString() };
        if (f.slug) payload.slug = String(f.slug).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 120);
        const { error } = await supabase.from('blog_posts').update(payload).eq('id', body.id);
        if (error) return json({ error: 'Could not save. ' + (error.message || '') }, 500);
        return json({ ok: true });
      }

      // Naya post: slug unique banana (title + random suffix)
      const slugBase = slugifyLocal(title) || 'post';
      const slug = `${slugBase}-${Date.now().toString(36).slice(-5)}`;
      const { data: createdPost, error } = await supabase
        .from('blog_posts')
        .insert({ ...base, slug, sales_uuid: salesUuid })
        .select('id, slug, blog_code')
        .single();
      if (error) {
        const msg = /blog_code/.test(error.message || '') || /null value/i.test(error.message || '')
          ? 'Could not create post (ID generation). Check migrations.'
          : 'Could not create post. ' + (error.message || '');
        return json({ error: msg }, 500);
      }
      return json({ post: createdPost });
    }

    // ================= PROFILE =================
    if (action === 'profile') {
      return json({
        member: {
          salesId: member.sales_id,
          referralCode: member.referral_code || '',
          name: member.name,
          email: member.email,
          phone: member.phone,
          location: member.location,
          commissionCourse,
          commissionWorkshop,
          commissionService,
          dateOfJoining: member.date_of_joining,
          gender: member.gender || '',
          memberSince: member.created_at,
        },
        payout: {
          method: (member.bank_acc_no || member.bank_ifsc) ? 'bank' : (member.upi_id ? 'upi' : ''),
          accNo: member.bank_acc_no || '',
          accName: member.bank_acc_name || '',
          bankIfsc: member.bank_ifsc || '',
          upiId: member.upi_id || '',
        },
      });
    }

    // ================= SERVICES (catalog + courses + workshops - shareable) =================
    if (action === 'services') {
      const [{ data: services }, { data: courses }, { data: workshops }] = await Promise.all([
        supabase.from('services').select('id, title, slug, price, original_price, discount_percent, short_description').eq('active', true).order('sort_order', { ascending: true }),
        supabase.from('courses').select('id, title, slug, price, is_free, active').eq('active', true).order('created_at', { ascending: false }),
        supabase.from('workshops').select('id, title, slug, price, is_free, active').eq('active', true).order('created_at', { ascending: false }),
      ]);
      return json({
        commissionService,
        commissionCourse,
        commissionWorkshop,
        rows: (services ?? []).map((s) => ({
          id: s.id,
          title: s.title || '',
          slug: s.slug || '',
          price: s.price || '',
          originalPrice: s.original_price || '',
          discountPercent: s.discount_percent ?? null,
          shortDescription: s.short_description || '',
        })),
        courses: (courses ?? []).map((c) => ({
          id: c.id,
          title: c.title || '',
          slug: c.slug || '',
          price: c.price || '',
          isFree: !!c.is_free,
        })),
        workshops: (workshops ?? []).map((w) => ({
          id: w.id,
          title: w.title || '',
          slug: w.slug || '',
          price: w.price || '',
          isFree: !!w.is_free,
        })),
      });
    }

    // ================= LEADS (service leads - sales team ke kaam ke) =================
    if (action === 'leads') {
      const { data: leads } = await supabase
        .from('leads_service')
        .select('*')
        .order('created_at', { ascending: false });
      const rows = (leads ?? []).map((l) => ({
        id: l.id,
        name: l.name || '',
        companyName: l.company_name || '',
        city: l.city || '',
        phone: l.phone || '',
        email: l.email || '',
        serviceTitle: l.service_title || l.service_slug || '',
        message: l.message || '',
        referredByMe: (l.referral_code || '') === (member.referral_code || '') && !!l.referral_code,
        amount: Number(l.amount) || 0,
        createdAt: l.created_at || '',
      }));
      return json({ rows });
    }

    // ================= REFERRALS (refer & earn tracking) =================
    if (action === 'referrals') {
      const [lc, lw, ls] = await Promise.all([
        supabase.from('leads_course').select('id, name, phone, course_title, price, reference_id, created_at, referral_code').eq('referral_code', member.referral_code || '\u0000').order('created_at', { ascending: false }),
        supabase.from('leads_workshop').select('id, name, phone, workshop_title, price, reference_id, created_at, referral_code').eq('referral_code', member.referral_code || '\u0000').order('created_at', { ascending: false }),
        supabase.from('leads_service').select('id, name, phone, service_title, amount, created_at, referral_code').eq('referral_code', member.referral_code || '\u0000').order('created_at', { ascending: false }),
      ]);
      const leads = [
        ...(lc.data ?? []).map((l) => ({ id: l.id, kind: 'Course', name: l.name || '', phone: l.phone || '', title: l.course_title || '', price: toNum(l.price), referenceId: l.reference_id || '', createdAt: l.created_at || '' })),
        ...(lw.data ?? []).map((l) => ({ id: l.id, kind: 'Workshop', name: l.name || '', phone: l.phone || '', title: l.workshop_title || '', price: toNum(l.price), referenceId: l.reference_id || '', createdAt: l.created_at || '' })),
        ...(ls.data ?? []).map((l) => ({ id: l.id, kind: 'Service', name: l.name || '', phone: l.phone || '', title: l.service_title || '', price: toNum(l.amount), referenceId: '', createdAt: l.created_at || '' })),
      ].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

      const [pays, deals] = await Promise.all([fetchReferredPayments(), fetchServiceDeals()]);
      const dealRecords = deals.map((d) => ({
        id: d.id,
        date: d.updated_at || d.created_at,
        personName: d.name || '',
        itemTitle: d.service_title || 'Service Deal',
        kind: 'Service (Deal)',
        grossAmount: Number(d.amount) || 0,
        commissionPercent: commissionService,
        commissionAmount: Math.round((Number(d.amount) || 0) * commissionService / 100),
        paymentStatus: 'paid',
        commissionStatus: 'Earned',
      }));
      const records = dealRecords.concat(pays.map((p) => {
        const gross = Number(p.amount) || 0;
        const pct = rateFor(p.lead_type);
        const kindLabel = p.lead_type === 'workshop' ? 'Workshop' : p.lead_type === 'career' ? 'Service / Career' : 'Course';
        return {
          id: p.id,
          date: p.created_at,
          personName: p.leads_course?.name || p.leads_workshop?.name || p.internship_applications?.full_name || '',
          itemTitle: p.item_title || '',
          kind: kindLabel,
          grossAmount: gross,
          commissionPercent: pct,
          commissionAmount: Math.round(gross * pct / 100),
          paymentStatus: 'paid',
          commissionStatus: 'Earned',
        };
      }));

      return json({ referralCode: member.referral_code || '', leads, records });
    }

    // ================= ANNOUNCEMENTS (admin notices, 2-way) =================
    if (action === 'announcements') {
      const { data } = await supabase
        .from('announcements')
        .select('id, audience, target_uuid, title, message, created_by, created_at')
        .eq('audience', 'sales')
        .or(`target_uuid.is.null,target_uuid.eq.${salesUuid}`)
        .order('created_at', { ascending: false })
        .limit(50);
      const ids = (data ?? []).map((a) => a.id);
      // Reactions + replies (sirf dikhne wali announcements ki)
      let reacts = [];
      let reps = [];
      if (ids.length) {
        const [r1, r2] = await Promise.all([
          supabase.from('announcement_reactions').select('announcement_id, emoji, reactor_uuid').in('announcement_id', ids),
          supabase.from('announcement_replies').select('announcement_id, id, replier_uuid, replier_name, message, created_at').in('announcement_id', ids).order('created_at', { ascending: true }),
        ]);
        reacts = r1.data ?? [];
        reps = r2.data ?? [];
      }
      return json({
        rows: (data ?? []).map((a) => {
          const reactions = {};
          const myReactions = [];
          for (const r of reacts.filter((x) => x.announcement_id === a.id)) {
            reactions[r.emoji] = (reactions[r.emoji] || 0) + 1;
            if (r.reactor_uuid === salesUuid) myReactions.push(r.emoji);
          }
          return {
            id: a.id,
            title: a.title,
            message: a.message,
            onlyMe: Boolean(a.target_uuid),
            createdBy: a.created_by,
            createdAt: a.created_at,
            reactions,
            myReactions,
            replies: reps
              .filter((x) => x.announcement_id === a.id)
              .map((r) => ({ id: r.id, name: r.replier_name, message: r.message, createdAt: r.created_at, mine: r.replier_uuid === salesUuid })),
          };
        }),
      });
    }

    // ================= ANNOUNCEMENT REACT (emoji toggle) =================
    if (action === 'announcement_react') {
      const annId = String(body.announcement_id || '');
      const emoji = String(body.emoji || '').trim().slice(0, 8);
      if (!annId || !emoji) return json({ error: 'Missing reaction details.' }, 400);
      // Sirf dikhne wali announcement par hi react ho sakta hai
      const { data: ann } = await supabase
        .from('announcements')
        .select('id')
        .eq('id', annId)
        .eq('audience', 'sales')
        .or(`target_uuid.is.null,target_uuid.eq.${salesUuid}`)
        .maybeSingle();
      if (!ann) return json({ error: 'Announcement not found.' }, 404);
      const { data: existing } = await supabase
        .from('announcement_reactions')
        .select('id')
        .eq('announcement_id', annId)
        .eq('reactor_type', 'sales')
        .eq('reactor_uuid', salesUuid)
        .eq('emoji', emoji)
        .maybeSingle();
      if (existing) {
        await supabase.from('announcement_reactions').delete().eq('id', existing.id);
      } else {
        const { error } = await supabase
          .from('announcement_reactions')
          .insert({ announcement_id: annId, reactor_type: 'sales', reactor_uuid: salesUuid, emoji });
        if (error) return json({ error: 'Could not save reaction. Please try again.' }, 500);
      }
      // Fresh summary wapas bhejo
      const { data: reacts } = await supabase
        .from('announcement_reactions')
        .select('emoji, reactor_uuid')
        .eq('announcement_id', annId);
      const reactions = {};
      const myReactions = [];
      for (const r of reacts ?? []) {
        reactions[r.emoji] = (reactions[r.emoji] || 0) + 1;
        if (r.reactor_uuid === salesUuid) myReactions.push(r.emoji);
      }
      return json({ ok: true, reactions, myReactions });
    }

    // ================= ANNOUNCEMENT REPLY =================
    if (action === 'announcement_reply') {
      const annId = String(body.announcement_id || '');
      const message = String(body.message || '').trim().slice(0, 1000);
      if (!annId) return json({ error: 'Missing announcement.' }, 400);
      if (!message) return json({ error: 'Reply is empty.' }, 400);
      const { data: ann } = await supabase
        .from('announcements')
        .select('id')
        .eq('id', annId)
        .eq('audience', 'sales')
        .or(`target_uuid.is.null,target_uuid.eq.${salesUuid}`)
        .maybeSingle();
      if (!ann) return json({ error: 'Announcement not found.' }, 404);
      const { data: reply, error } = await supabase
        .from('announcement_replies')
        .insert({ announcement_id: annId, replier_type: 'sales', replier_uuid: salesUuid, replier_name: member.name || 'Sales Member', message })
        .select('id, replier_name, message, created_at')
        .single();
      if (error) return json({ error: 'Could not send reply. Please try again.' }, 500);
      return json({ ok: true, reply: { id: reply.id, name: reply.replier_name, message: reply.message, createdAt: reply.created_at, mine: true } });
    }

    // ================= WALLET =================
    if (action === 'wallet') {
      return json(await fetchWallet());
    }

    // ================= WITHDRAWAL LIST (own history + wallet) =================
    if (action === 'withdrawal_list') {
      const { data } = await supabase
        .from('sales_withdrawals')
        .select('*')
        .eq('sales_uuid', salesUuid)
        .order('requested_at', { ascending: false });
      return json({
        wallet: await fetchWallet(),
        rows: (data ?? []).map((w) => ({
          id: w.id,
          withdrawalCode: w.withdrawal_code || '',
          name: w.name || member.name || '',
          salesId: w.sales_id || member.sales_id || '',
          amount: Number(w.amount) || 0,
          method: w.method,
          accNo: w.acc_no || '',
          accName: w.acc_name || '',
          bankIfsc: w.bank_ifsc || '',
          upiId: w.upi_id || '',
          status: w.status,
          refNo: w.ref_no || '',
          adminMessage: w.admin_message || '',
          requestedAt: w.requested_at,
          processedAt: w.processed_at,
        })),
        payout: {
          method: (member.bank_acc_no || member.bank_ifsc) ? 'bank' : (member.upi_id ? 'upi' : ''),
          accNo: member.bank_acc_no || '',
          accName: member.bank_acc_name || '',
          bankIfsc: member.bank_ifsc || '',
          upiId: member.upi_id || '',
        },
      });
    }

    // ================= WITHDRAWAL CREATE (wallet-validated) =================
    if (action === 'withdrawal_create') {
      const amount = Math.round(Number(body.amount) || 0);
      if (amount <= 0) return json({ error: 'Enter a valid amount.' }, 400);
      const method = body.method === 'bank' ? 'bank' : 'upi';
      const wallet = await fetchWallet();
      if (amount > wallet.available) {
        return json({ error: `Amount exceeds your wallet balance (${'\u20b9'}${wallet.available.toLocaleString('en-IN')}).` }, 400);
      }
      const accNo = String(body.accNo || '').trim().slice(0, 30);
      const accName = String(body.accName || '').trim().slice(0, 80);
      const bankIfsc = String(body.bankIfsc || '').trim().toUpperCase().slice(0, 15);
      const upiId = String(body.upiId || '').trim().slice(0, 60);
      if (method === 'bank') {
        if (!/^\d{6,30}$/.test(accNo) || !accName || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankIfsc)) {
          return json({ error: 'Fill a valid account number, account holder name and IFSC code.' }, 400);
        }
      } else if (!/^[\w.]{2,60}@[a-zA-Z]{2,20}$/.test(upiId)) {
        return json({ error: 'Enter a valid UPI ID (e.g. name@bank).' }, 400);
      }

      const { data: created, error } = await supabase
        .from('sales_withdrawals')
        .insert({
          sales_uuid: salesUuid,
          sales_id: member.sales_id,
          name: member.name,
          amount,
          method,
          acc_no: accNo,
          acc_name: accName,
          bank_ifsc: bankIfsc,
          upi_id: upiId,
        })
        .select('withdrawal_code, requested_at')
        .single();
      if (error) return json({ error: 'Could not create request. ' + (error.message || '') }, 500);

      // Latest payout details member row par bhi save (admin Manage me dikhega)
      await supabase
        .from('sales_members')
        .update({
          bank_acc_no: method === 'bank' ? accNo : '',
          bank_acc_name: method === 'bank' ? accName : '',
          bank_ifsc: method === 'bank' ? bankIfsc : '',
          upi_id: method === 'upi' ? upiId : '',
          updated_at: new Date().toISOString(),
        })
        .eq('id', salesUuid);

      return json({ request: created });
    }

    // ================= ISSUES (own list) =================
    if (action === 'issues') {
      const { data: issues } = await supabase
        .from('sales_issues')
        .select('*')
        .eq('sales_uuid', salesUuid)
        .order('created_at', { ascending: false });
      return json({
        rows: (issues ?? []).map((i) => ({
          issueId: i.issue_id,
          issue: i.issue,
          status: i.status,
          adminResponse: i.admin_response || '',
          attachmentPath: i.attachment_path || '',
          createdAt: i.created_at,
        })),
      });
    }

    // ================= ISSUE CREATE (attachment optional) =================
    if (action === 'issue_create') {
      const issueText = String(body.issue || '').trim();
      if (!issueText) return json({ error: 'Issue text is required.' }, 400);

      let attachmentPath = '';
      const att = body.attachment;
      if (att && att.data) {
        const okTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!okTypes.includes(att.type || '')) return json({ error: 'Only JPG, PNG, WEBP or PDF files are allowed.' }, 400);
        const raw = atob(String(att.data).replace(/^data:[^,]*,/, ''));
        if (raw.length > 2 * 1024 * 1024) return json({ error: 'Attachment must be under 2 MB.' }, 400);
        const ext = att.type === 'application/pdf' ? 'pdf' : att.type === 'image/png' ? 'png' : att.type === 'image/webp' ? 'webp' : 'jpg';
        const path = `${salesUuid}/${Date.now()}.${ext}`;
        const bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
        const { error: upErr } = await supabase.storage.from('sales-issues').upload(path, bytes, { contentType: att.type });
        if (upErr) return json({ error: 'Attachment upload failed.' }, 500);
        attachmentPath = path;
      }

      const { data: created, error: insErr } = await supabase
        .from('sales_issues')
        .insert({
          sales_uuid: salesUuid,
          sales_id: member.sales_id,
          name: member.name,
          mobile: member.phone,
          email: member.email,
          issue: issueText,
          attachment_path: attachmentPath,
        })
        .select('issue_id, status, created_at')
        .single();
      if (insErr) return json({ error: 'Could not submit issue.' }, 500);
      return json({ issue: created });
    }

    return json({ error: 'Unknown action.' }, 400);
  } catch {
    return json({ error: 'Something went wrong. Try again.' }, 500);
  }
});
