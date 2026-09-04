// Mentor panel ka single data API.
// Identity HAMESHA Bearer token se (mentor-login se mila HMAC token) -
// body/query me bheja gaya koi bhi mentor id ignore/har jeetata hai.
// Sab queries service-role se chalti hain par SCOPED to usi mentor ke data par.
//
// Actions: dashboard | registrations | items | profile | commissions | issues | issue_create | wallet | withdrawal_list | withdrawal_create
//
// Self-contained (dashboard "Create edge function" me paste-ready).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  // x-mentor-token ZAROORI: isko allowlist me na ho to browser POST block kar
  // deta hai (sirf OPTIONS 200 aata hai, "Failed to fetch" dikhta hai)
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-mentor-token',
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
    if (!payload.mid || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload.mid; // mentors.id (uuid)
  } catch {
    return null;
  }
}

function slugifyLocal(s: string): string {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // ---- Auth: token -> mentor uuid ----
  // Token 'x-mentor-token' header me aata hai (Authorization Supabase platform
  // JWT ke liye reserved hai - anon key wahan chalti hai). Fallback: body token.
  let body0: { mentor_token?: string } = {};
  try {
    body0 = await req.clone().json();
  } catch {
    /* ignore */
  }
  const token =
    req.headers.get('x-mentor-token') ||
    body0.mentor_token ||
    (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const mentorUuid = await verifyToken(token);
  if (!mentorUuid) {
    return json({ error: 'Session expired. Please login again.' }, 401);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let body: { action?: string; kind?: string; issue?: string; attachment?: { name?: string; type?: string; data?: string }; announcement_id?: string; emoji?: string; message?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body theek hai (GET-style actions) */
  }

  // ---- Mentor profile (har action me kaam aayega) ----
  const { data: mentor } = await supabase
    .from('mentors')
    .select('id, mentor_id, name, email, phone, commission_percent, commission_course, commission_workshop, bank_acc_no, bank_acc_name, bank_ifsc, upi_id, location, mentor_type, date_of_joining, gender, blocked, created_at')
    .eq('id', mentorUuid)
    .maybeSingle();
  if (!mentor) return json({ error: 'Session expired. Please login again.' }, 401);
  // Block ho chuka mentor ka session turant dead ho jaye
  if (mentor.blocked) {
    return json({ error: 'You are blocked By Nexrnn Admin. If this is any error so pls Contect Admin.', blocked: true }, 403);
  }

  // ---- Assigned course/workshop ids ----
  const [{ data: ca }, { data: wa }] = await Promise.all([
    supabase.from('mentor_course_assignments').select('course_id').eq('mentor_uuid', mentorUuid),
    supabase.from('mentor_workshop_assignments').select('workshop_id').eq('mentor_uuid', mentorUuid),
  ]);
  const courseIds = (ca ?? []).map((r) => r.course_id);
  const workshopIds = (wa ?? []).map((r) => r.workshop_id);

  // Course/Workshop ke alag commission (purane mentor = commission_percent se fallback)
  const commissionCourse = Number(mentor.commission_course ?? mentor.commission_percent) || 0;
  const commissionWorkshop = Number(mentor.commission_workshop ?? mentor.commission_percent) || 0;
  const rateFor = (isWorkshop) => (isWorkshop ? commissionWorkshop : commissionCourse);

  // Mentor type guard (server-side): workshop-only mentor ko courses ka data NAHI milega,
  // course-only ko workshops ka nahi - chahe galti se assignment DB me ho.
  const allowCourses = (mentor.mentor_type || 'both') !== 'workshop';
  const allowWorkshops = (mentor.mentor_type || 'both') !== 'course';

  // Assigned items ki puri details (leads ko batch_id/slug se jodna hai)
  const assignedCourseRows = allowCourses && courseIds.length
    ? (await supabase.from('courses').select('id, title, slug, batch_id, price, original_price, duration, level, mode, short_description, active').in('id', courseIds).order('created_at', { ascending: false })).data ?? []
    : [];
  const assignedWorkshopRows = allowWorkshops && workshopIds.length
    ? (await supabase.from('workshops').select('id, title, slug, batch_id, price, original_price, workshop_datetime, registration_deadline, short_description, details, active').in('id', workshopIds).order('created_at', { ascending: false })).data ?? []
    : [];
  const courseBatchIds = assignedCourseRows.map((c) => c.batch_id).filter(Boolean);
  const workshopBatchIds = assignedWorkshopRows.map((w) => w.batch_id).filter(Boolean);
  const courseSlugs = assignedCourseRows.map((c) => c.slug).filter(Boolean);
  const workshopSlugs = assignedWorkshopRows.map((w) => w.slug).filter(Boolean);

  /**
   * Assigned leads (course/workshop). Leads table me course_id NAHI hai -
   * batch_id (+ slug fallback) se match karte hain.
   */
  const fetchAssignedLeads = async (isWorkshop) => {
    const table = isWorkshop ? 'leads_workshop' : 'leads_course';
    const slugCol = isWorkshop ? 'workshop_slug' : 'course_slug';
    const batchIds = isWorkshop ? workshopBatchIds : courseBatchIds;
    const slugs = isWorkshop ? workshopSlugs : courseSlugs;
    const out = [];
    if (batchIds.length) {
      const { data } = await supabase.from(table).select('*').in('batch_id', batchIds);
      out.push(...(data ?? []));
    }
    if (slugs.length) {
      const { data } = await supabase.from(table).select('*').in(slugCol, slugs);
      for (const l of data ?? []) if (!out.some((x) => x.id === l.id)) out.push(l);
    }
    out.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    return out;
  };

  /**
   * Wallet = total earned commission - (withdrawn + pending requests).
   * Pending (Created/In progress) bhi minus hota hai taaki double-request se
   * wallet se zyada na nikal sake.
   */
  const fetchWallet = async () => {
    const courseLeads = await fetchAssignedLeads(false);
    const workshopLeads = await fetchAssignedLeads(true);
    let earned = 0;
    const cids = courseLeads.map((l) => l.id);
    const wids = workshopLeads.map((l) => l.id);
    if (cids.length) {
      const rows = ((await supabase.from('payments').select('amount').eq('status', 'paid').in('lead_course_id', cids)).data) ?? [];
      for (const p of rows) earned += (Number(p.amount) || 0) * commissionCourse / 100;
    }
    if (wids.length) {
      const rows = ((await supabase.from('payments').select('amount').eq('status', 'paid').in('lead_workshop_id', wids)).data) ?? [];
      for (const p of rows) earned += (Number(p.amount) || 0) * commissionWorkshop / 100;
    }
    earned = Math.round(earned);
    const { data: wrows } = await supabase
      .from('mentor_withdrawals')
      .select('amount, status')
      .eq('mentor_uuid', mentorUuid);
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
      const courseLeads = await fetchAssignedLeads(false);
      const workshopLeads = await fetchAssignedLeads(true);

      // Paid payments in ke lead ids par
      const courseLeadIds = courseLeads.map((l) => l.id);
      const workshopLeadIds = workshopLeads.map((l) => l.id);
      const pays: any[] = [];
      if (courseLeadIds.length) {
        pays.push(...(((await supabase.from('payments').select('*').eq('status', 'paid').in('lead_course_id', courseLeadIds)).data) ?? []).map((p) => ({ ...p, _ws: false })));
      }
      if (workshopLeadIds.length) {
        pays.push(...(((await supabase.from('payments').select('*').eq('status', 'paid').in('lead_workshop_id', workshopLeadIds)).data) ?? []).map((p) => ({ ...p, _ws: true })));
      }

      const today = new Date().toISOString().slice(0, 10);
      const month = today.slice(0, 7);
      let total = 0;
      let todayEarn = 0;
      let monthEarn = 0;
      for (const p of pays) {
        const amt = (Number(p.amount) || 0) * rateFor(p._ws) / 100;
        total += amt;
        const d = (p.created_at || '').slice(0, 10);
        if (d === today) todayEarn += amt;
        if ((p.created_at || '').slice(0, 7) === month) monthEarn += amt;
      }

      return json({
        mentor: {
          name: mentor.name,
          mentorId: mentor.mentor_id,
          mentorType: mentor.mentor_type,
        },
        commissionPercent: commissionCourse,
        commissionCourse,
        commissionWorkshop,
        wallet: await fetchWallet(),
        totalEarnings: Math.round(total),
        todayEarnings: Math.round(todayEarn),
        monthEarnings: Math.round(monthEarn),
        totalStudents: courseLeads.length + workshopLeads.length,
        // Type-guarded counts (workshop-only mentor ko course count 0 hi dikhega)
        assignedCourses: assignedCourseRows.length,
        assignedWorkshops: assignedWorkshopRows.length,
      });
    }

    // ================= REGISTRATIONS (view-only lists) =================
    if (action === 'registrations') {
      const isWorkshop = body.kind === 'workshop';
      const leads = await fetchAssignedLeads(isWorkshop);
      if (!leads.length) return json({ rows: [] });
      const leadIds = (leads ?? []).map((l) => l.id);
      const pays: any[] = [];
      if (leadIds.length) {
        const col = isWorkshop ? 'lead_workshop_id' : 'lead_course_id';
        pays.push(...(((await supabase.from('payments').select('*').in(col, leadIds).order('created_at', { ascending: false })).data) ?? []));
      }
      const payByLead: Record<string, any> = {};
      for (const p of pays) {
        const lid = isWorkshop ? p.lead_workshop_id : p.lead_course_id;
        if (lid && !payByLead[lid]) payByLead[lid] = p; // latest paid/first row jeet gaya
      }

      const titleCol = isWorkshop ? 'workshop_title' : 'course_title';
      const rows = (leads ?? []).map((l) => {
        const pay = payByLead[l.id];
        const gross = Number(pay?.amount) || 0;
        const pct = rateFor(isWorkshop);
        return {
          id: l.id,
          name: l.name || '',
          // Student ka email/phone mentor ko nahi bhejte (privacy - server-side)
          itemTitle: l[titleCol] || l[(isWorkshop ? 'workshop_slug' : 'course_slug')] || '',
          batchId: l.batch_id || '',
          referenceId: l.reference_id || '',
          status: l.status || '',
          registrationDate: l.created_at || '',
          paymentStatus: pay?.status || 'pending',
          amount: gross,
          commissionAmount: Math.round(gross * pct / 100),
          commissionPercent: pct,
        };
      });
      return json({ rows });
    }

    // ================= ITEMS (assigned courses/workshops, read-only) =================
    if (action === 'items') {
      const isWorkshop = body.kind === 'workshop';
      const leads = await fetchAssignedLeads(isWorkshop);
      const items = isWorkshop ? assignedWorkshopRows : assignedCourseRows;

      // Har item ka students count (batch_id + slug dono se match)
      const countFor = (it) => leads.filter((l) => {
        const slug = isWorkshop ? l.workshop_slug : l.course_slug;
        return (it.batch_id && l.batch_id === it.batch_id) || (slug && slug === it.slug);
      }).length;

      const rows = items.map((it) => ({
        id: it.id,
        title: it.title || '',
        slug: it.slug || '',
        batchId: it.batch_id || '',
        price: Number(it.price) || 0,
        originalPrice: it.original_price || '',
        duration: isWorkshop
          ? (it.workshop_datetime ? new Date(it.workshop_datetime).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '')
          : (it.duration || ''),
        level: it.level || '',
        mode: it.mode || '',
        shortDescription: it.short_description || '',
        details: it.details || '',
        workshopDatetime: it.workshop_datetime || '',
        registrationDeadline: it.registration_deadline || '',
        status: it.active === false ? 'Inactive' : 'Active',
        students: countFor(it),
      }));
      return json({ rows });
    }

    // ================= ITEM GET (edit form prefill) =================
    if (action === 'item_get') {
      const isWorkshop = body.kind === 'workshop';
      const id = body.id;
      const item = (isWorkshop ? assignedWorkshopRows : assignedCourseRows).find((x) => x.id === id);
      if (!item) return json({ error: 'Item not assigned to you.' }, 403);
      return json({ item: { ...item } });
    }

    // ================= ITEM SAVE (assigned items ka edit) =================
    if (action === 'item_save') {
      const isWorkshop = body.kind === 'workshop';
      const id = body.id;
      const allowed = (isWorkshop ? assignedWorkshopRows : assignedCourseRows).some((x) => x.id === id);
      if (!allowed) return json({ error: 'You can edit only your assigned programs.' }, 403);

      const f = body.fields || {};
      const payload = {};
      if (f.title !== undefined) payload.title = String(f.title).slice(0, 160);
      if (f.slug !== undefined && f.slug) payload.slug = String(f.slug).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 120);
      if (f.short_description !== undefined) payload.short_description = String(f.short_description).slice(0, 600);
      if (f.price !== undefined) payload.price = String(f.price).slice(0, 20);
      if (f.original_price !== undefined) payload.original_price = String(f.original_price).slice(0, 20);
      if (!isWorkshop) {
        if (f.duration !== undefined) payload.duration = String(f.duration).slice(0, 60);
        if (f.level !== undefined) payload.level = String(f.level).slice(0, 40);
        if (f.mode !== undefined) payload.mode = String(f.mode).slice(0, 40);
      } else {
        if (f.workshop_datetime !== undefined) payload.workshop_datetime = f.workshop_datetime || null;
        if (f.registration_deadline !== undefined) payload.registration_deadline = f.registration_deadline || null;
        if (f.details !== undefined) payload.details = String(f.details).slice(0, 20000);
      }
      if (f.active !== undefined) payload.active = !!f.active;
      payload.updated_at = new Date().toISOString();

      const { error } = await supabase.from(isWorkshop ? 'workshops' : 'courses').update(payload).eq('id', id);
      if (error) return json({ error: 'Could not save. ' + (error.message || '') }, 500);
      return json({ ok: true });
    }

    // ================= ITEM CREATE (mentor naya program banaye) =================
    if (action === 'item_create') {
      const isWorkshop = body.kind === 'workshop';
      // Mentor type guard: workshop-only sirf workshop, course-only sirf course bana sakta hai
      if (isWorkshop && !allowWorkshops) return json({ error: 'Your mentor type does not allow creating workshops.' }, 403);
      if (!isWorkshop && !allowCourses) return json({ error: 'Your mentor type does not allow creating courses.' }, 403);
      const f = body.fields || {};
      const title = String(f.title || '').trim();
      if (!title) return json({ error: 'Title is required.' }, 400);
      const slug = String(f.slug || title).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 120);
      if (!slug) return json({ error: 'Valid slug/title is required.' }, 400);

      const payload = {
        title,
        slug,
        short_description: String(f.short_description || '').slice(0, 600),
        price: String(f.price || '0').slice(0, 20),
        original_price: String(f.original_price || '').slice(0, 20),
        active: f.active !== false,
      };
      if (isWorkshop) {
        payload.details = String(f.details || '').slice(0, 20000);
        if (f.workshop_datetime) payload.workshop_datetime = f.workshop_datetime;
        if (f.registration_deadline) payload.registration_deadline = f.registration_deadline;
      } else {
        payload.duration = String(f.duration || '').slice(0, 60);
        payload.level = String(f.level || '').slice(0, 40);
        payload.mode = String(f.mode || '').slice(0, 40);
      }

      const { data: created, error } = await supabase
        .from(isWorkshop ? 'workshops' : 'courses')
        .insert(payload)
        .select('id, slug, batch_id')
        .single();
      if (error) {
        const msg = /duplicate key|unique/i.test(error.message || '') ? 'This slug already exists — change the title/slug.' : 'Could not create. ' + (error.message || '');
        return json({ error: msg }, 500);
      }

      // Creating mentor ko assign karo (default mentor assignment DB trigger se hota hai)
      const atable = isWorkshop ? 'mentor_workshop_assignments' : 'mentor_course_assignments';
      const acol = isWorkshop ? 'workshop_id' : 'course_id';
      const apayload = { mentor_uuid: mentorUuid };
      apayload[acol] = created.id;
      await supabase.from(atable).insert(apayload);

      return json({ item: created });
    }

    // ================= BLOG CATEGORIES (mentor blog form) =================
    if (action === 'blog_categories') {
      const { data } = await supabase.from('blog_categories').select('slug, name').order('name');
      return json({ categories: data ?? [] });
    }

    // ================= MY BLOGS =================
    if (action === 'blogs_list') {
      const { data } = await supabase
        .from('blog_posts')
        .select('id, blog_code, slug, title, excerpt, content, cover_image_url, author_name, author_role, tags, reading_time, is_published, published_at, category_slug, views')
        .eq('mentor_uuid', mentorUuid)
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
        author_name: mentor.name || 'NexRNN Mentor',
        author_role: 'Mentor, NexRNN Technologies',
        tags: Array.isArray(f.tags) ? f.tags.map((t) => String(t).slice(0, 30)).slice(0, 8) : [],
        is_published: f.is_published !== false,
      };

      if (body.id) {
        // Sirf apna hi blog update ho sakta hai
        const { data: owned } = await supabase
          .from('blog_posts')
          .select('id')
          .eq('id', body.id)
          .eq('mentor_uuid', mentorUuid)
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
        .insert({ ...base, slug, mentor_uuid: mentorUuid })
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

    // ================= ANNOUNCEMENTS (admin notices, 2-way) =================
    if (action === 'announcements') {
      const { data } = await supabase
        .from('announcements')
        .select('id, audience, target_uuid, title, message, created_by, created_at')
        .eq('audience', 'mentor')
        .or(`target_uuid.is.null,target_uuid.eq.${mentorUuid}`)
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
            if (r.reactor_uuid === mentorUuid) myReactions.push(r.emoji);
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
              .map((r) => ({ id: r.id, name: r.replier_name, message: r.message, createdAt: r.created_at, mine: r.replier_uuid === mentorUuid })),
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
        .eq('audience', 'mentor')
        .or(`target_uuid.is.null,target_uuid.eq.${mentorUuid}`)
        .maybeSingle();
      if (!ann) return json({ error: 'Announcement not found.' }, 404);
      const { data: existing } = await supabase
        .from('announcement_reactions')
        .select('id')
        .eq('announcement_id', annId)
        .eq('reactor_type', 'mentor')
        .eq('reactor_uuid', mentorUuid)
        .eq('emoji', emoji)
        .maybeSingle();
      if (existing) {
        await supabase.from('announcement_reactions').delete().eq('id', existing.id);
      } else {
        const { error } = await supabase
          .from('announcement_reactions')
          .insert({ announcement_id: annId, reactor_type: 'mentor', reactor_uuid: mentorUuid, emoji });
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
        if (r.reactor_uuid === mentorUuid) myReactions.push(r.emoji);
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
        .eq('audience', 'mentor')
        .or(`target_uuid.is.null,target_uuid.eq.${mentorUuid}`)
        .maybeSingle();
      if (!ann) return json({ error: 'Announcement not found.' }, 404);
      const { data: reply, error } = await supabase
        .from('announcement_replies')
        .insert({ announcement_id: annId, replier_type: 'mentor', replier_uuid: mentorUuid, replier_name: mentor.name || 'Mentor', message })
        .select('id, replier_name, message, created_at')
        .single();
      if (error) return json({ error: 'Could not send reply. Please try again.' }, 500);
      return json({ ok: true, reply: { id: reply.id, name: reply.replier_name, message: reply.message, createdAt: reply.created_at, mine: true } });
    }

    // ================= PROFILE =================
    if (action === 'profile') {
      // Type-guarded: galat kind ki assignment list me na jaye
      const { data: ca2 } = allowCourses
        ? await supabase.from('mentor_course_assignments').select('course_id, courses(title, batch_id)').eq('mentor_uuid', mentorUuid)
        : { data: [] };
      const { data: wa2 } = allowWorkshops
        ? await supabase.from('mentor_workshop_assignments').select('workshop_id, workshops(title, batch_id)').eq('mentor_uuid', mentorUuid)
        : { data: [] };
      return json({
        mentor: {
          mentorId: mentor.mentor_id,
          name: mentor.name,
          email: mentor.email,
          mentorType: mentor.mentor_type || 'both',
          phone: mentor.phone,
          location: mentor.location,
          commissionPercent: commissionCourse,
          commissionCourse,
          commissionWorkshop,
          dateOfJoining: mentor.date_of_joining,
          gender: mentor.gender || '',
          memberSince: mentor.created_at,
        },
        assignedCourses: (ca2 ?? []).map((r) => ({ title: r.courses?.title ?? '-', batchId: r.courses?.batch_id ?? '' })),
        assignedWorkshops: (wa2 ?? []).map((r) => ({ title: r.workshops?.title ?? '-', batchId: r.workshops?.batch_id ?? '' })),
        payout: {
          method: (mentor.bank_acc_no || mentor.bank_ifsc) ? 'bank' : (mentor.upi_id ? 'upi' : ''),
          accNo: mentor.bank_acc_no || '',
          accName: mentor.bank_acc_name || '',
          bankIfsc: mentor.bank_ifsc || '',
          upiId: mentor.upi_id || '',
        },
      });
    }

    // ================= COMMISSIONS (records + daily series) =================
    if (action === 'commissions') {
      const courseLeads = (await fetchAssignedLeads(false)).map((l) => ({ id: l.id, reference_id: l.reference_id, course_title: l.course_title, created_at: l.created_at }));
      const workshopLeads = (await fetchAssignedLeads(true)).map((l) => ({ id: l.id, reference_id: l.reference_id, workshop_title: l.workshop_title, created_at: l.created_at }));
      const leadMap: Record<string, { ref: string; title: string; kind: string }> = {};
      for (const l of courseLeads) leadMap[l.id] = { ref: l.reference_id || '', title: l.course_title || '', kind: 'Course' };
      for (const l of workshopLeads) leadMap[l.id] = { ref: l.reference_id || '', title: l.workshop_title || '', kind: 'Workshop' };

      const allIds = [...courseLeads.map((l) => l.id), ...workshopLeads.map((l) => l.id)];
      const records: any[] = [];
      const byDay: Record<string, number> = {};
      if (allIds.length) {
        const courseIdsCol = courseLeads.map((l) => l.id);
        const workshopIdsCol = workshopLeads.map((l) => l.id);
        const pays: any[] = [];
        if (courseIdsCol.length) pays.push(...(((await supabase.from('payments').select('*').eq('status', 'paid').in('lead_course_id', courseIdsCol)).data) ?? []).map((p) => ({ ...p, _ws: false })));
        if (workshopIdsCol.length) pays.push(...(((await supabase.from('payments').select('*').eq('status', 'paid').in('lead_workshop_id', workshopIdsCol)).data) ?? []).map((p) => ({ ...p, _ws: true })));
        for (const p of pays) {
          const lid = p.lead_course_id || p.lead_workshop_id;
          const lead = leadMap[lid] || { ref: '', title: '', kind: '' };
          const gross = Number(p.amount) || 0;
          const pct = rateFor(p._ws);
          const amount = Math.round(gross * pct / 100);
          const day = (p.created_at || '').slice(0, 10);
          byDay[day] = (byDay[day] || 0) + amount;
          records.push({
            id: p.id,
            date: p.created_at,
            referenceId: lead.ref,
            itemTitle: lead.title,
            kind: lead.kind,
            grossAmount: gross,
            commissionPercent: pct,
            commissionAmount: amount,
            paymentStatus: 'paid',
            commissionStatus: 'Earned',
          });
        }
      }
      records.sort((x, y) => (y.date || '').localeCompare(x.date || ''));
      return json({ mentorType: mentor.mentor_type || 'both', commissionPercent: commissionCourse, commissionCourse, commissionWorkshop, records, byDay });
    }

    // ================= WALLET (available balance) =================
    if (action === 'wallet') {
      return json(await fetchWallet());
    }

    // ================= WITHDRAWAL LIST (own history + wallet) =================
    if (action === 'withdrawal_list') {
      const { data } = await supabase
        .from('mentor_withdrawals')
        .select('*')
        .eq('mentor_uuid', mentorUuid)
        .order('requested_at', { ascending: false });
      return json({
        wallet: await fetchWallet(),
        rows: (data ?? []).map((w) => ({
          id: w.id,
          withdrawalCode: w.withdrawal_code || '',
          // Slip ke liye mentor details bhi (mentor ka apna data hai)
          name: w.name || mentor.name || '',
          mentorId: w.mentor_id || mentor.mentor_id || '',
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
        .from('mentor_withdrawals')
        .insert({
          mentor_uuid: mentorUuid,
          mentor_id: mentor.mentor_id,
          name: mentor.name,
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

      // Latest payout details mentor row par bhi save (admin Manage me dikhega)
      await supabase
        .from('mentors')
        .update({
          bank_acc_no: method === 'bank' ? accNo : '',
          bank_acc_name: method === 'bank' ? accName : '',
          bank_ifsc: method === 'bank' ? bankIfsc : '',
          upi_id: method === 'upi' ? upiId : '',
          updated_at: new Date().toISOString(),
        })
        .eq('id', mentorUuid);

      return json({ request: created });
    }

    // ================= ISSUES (own list) =================
    if (action === 'issues') {
      const { data: issues } = await supabase
        .from('mentor_issues')
        .select('*')
        .eq('mentor_uuid', mentorUuid)
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
        const path = `${mentorUuid}/${Date.now()}.${ext}`;
        const bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
        const { error: upErr } = await supabase.storage.from('mentor-issues').upload(path, bytes, { contentType: att.type });
        if (upErr) return json({ error: 'Attachment upload failed.' }, 500);
        attachmentPath = path;
      }

      const { data: created, error: insErr } = await supabase
        .from('mentor_issues')
        .insert({
          mentor_uuid: mentorUuid,
          mentor_id: mentor.mentor_id,
          name: mentor.name,
          mobile: mentor.phone,
          email: mentor.email,
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
