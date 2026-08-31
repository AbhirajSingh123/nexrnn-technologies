/**
 * Careers repo - Jobs + Internships (admin manage karta hai, workshop concept).
 * Public: sirf published openings. Admin: saari rows.
 */
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';
import { SAMPLE_CAREERS } from './careersData';
import { slugify } from '@/utils/blogUtils';

function mapRow(row) {
  return {
    id: row.id,
    careerCode: row.career_code || '',
    slug: row.slug,
    title: row.title,
    type: row.type === 'internship' ? 'internship' : 'job',
    location: row.location || '',
    excerpt: row.excerpt || '',
    content: row.content || '',
    feeType: row.fee_type === 'paid' ? 'paid' : 'free',
    feeAmount: Number(row.fee_amount) || 0,
    lastDateApply: row.last_date_apply || '',
    domain: row.domain || '',
    startDate: row.start_date || '',
    endDate: row.end_date || '',
    duration: row.duration || '',
    stipendType: row.stipend_type === 'paid' ? 'paid' : 'unpaid',
    stipendText: row.stipend_text || '',
    isPublished: row.is_published,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Apply ki last date nikal chuki? (date-only compare, timezone safe) */
function isLastDatePassed(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return dateStr < todayStr;
}

function sortOpenings(list) {
  return [...list].sort((a, b) => {
    const aOpen = !isLastDatePassed(a.lastDateApply);
    const bOpen = !isLastDatePassed(b.lastDateApply);
    if (aOpen !== bOpen) return aOpen ? -1 : 1;
    return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
  });
}

function filterLocal(list, type, search) {
  let out = list;
  if (type && type !== 'all') out = out.filter((r) => r.type === type);
  const q = (search || '').trim().toLowerCase();
  if (q) {
    out = out.filter((r) =>
      [r.title, r.excerpt, r.location].some((v) => (v || '').toLowerCase().includes(q))
    );
  }
  return out;
}

/** Public: saari published openings (open pehle, phir latest) */
export async function fetchCareers({ type = 'all', search = '' } = {}) {
  if (!isSupabaseConfigured) {
    return filterLocal(sortOpenings(SAMPLE_CAREERS.map(mapRow)), type, search);
  }
  try {
    const { data, error } = await supabase
      .from('careers')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false });
    if (error) return filterLocal(sortOpenings(SAMPLE_CAREERS.map(mapRow)), type, search);
    return filterLocal(sortOpenings((data ?? []).map(mapRow)), type, search);
  } catch {
    return filterLocal(sortOpenings(SAMPLE_CAREERS.map(mapRow)), type, search);
  }
}

/** Public: ek opening slug se */
export async function fetchCareerBySlug(slug) {
  if (!isSupabaseConfigured) {
    return SAMPLE_CAREERS.map(mapRow).find((r) => r.slug === slug) || null;
  }
  try {
    const { data, error } = await supabase
      .from('careers')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();
    if (error || !data) return null;
    return mapRow(data);
  } catch {
    return null;
  }
}

/** Admin: saari openings */
export async function fetchAdminCareers() {
  if (!isSupabaseConfigured) return SAMPLE_CAREERS.map(mapRow);
  const { data, error } = await supabase
    .from('careers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

/** Admin: ek opening id se */
export async function fetchAdminCareerById(id) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('careers')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : null;
}

/** Admin: save (insert ya update) */
export async function saveCareer(formData, id = null) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const payload = {
    title: formData.title.trim(),
    slug: formData.slug.trim() || slugify(formData.title),
    type: formData.type === 'internship' ? 'internship' : 'job',
    location: formData.location || '',
    excerpt: formData.excerpt || '',
    content: formData.content || '',
    fee_type: formData.fee_type === 'paid' ? 'paid' : 'free',
    fee_amount: formData.fee_type === 'paid' ? Number(formData.fee_amount) || 0 : 0,
    last_date_apply: formData.last_date_apply || null,
    domain: formData.domain || '',
    start_date: formData.start_date || null,
    end_date: formData.end_date || null,
    duration: formData.duration || '',
    stipend_type: formData.stipend_type === 'paid' ? 'paid' : 'unpaid',
    stipend_text: formData.stipend_text || '',
    is_published: Boolean(formData.is_published),
    published_at: formData.published_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (id && id !== 'new') {
    const { data, error } = await supabase
      .from('careers')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapRow(data);
  } else {
    const { data, error } = await supabase
      .from('careers')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return mapRow(data);
  }
}

/** Admin: delete */
export async function deleteCareer(id) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('careers').delete().eq('id', id);
  if (error) throw error;
}

export { isLastDatePassed };
