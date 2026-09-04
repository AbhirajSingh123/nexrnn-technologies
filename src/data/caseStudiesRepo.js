/**
 * Case Studies repo - admin panel se manage hota hai (blog jaisa hi).
 * Public: sirf published case studies. Admin: saari rows.
 */
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';
import { SAMPLE_CASE_STUDIES } from './caseStudies';
import { slugify } from '@/utils/blogUtils';

function mapRow(row) {
  return {
    id: row.id,
    caseCode: row.case_code || '',
    slug: row.slug,
    title: row.title,
    clientName: row.client_name || '',
    industry: row.industry || '',
    excerpt: row.excerpt || '',
    content: row.content || '',
    coverImageUrl: row.cover_image_url || '',
    tags: row.tags ?? [],
    views: row.views ?? 0,
    isPublished: row.is_published,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Public: saari published case studies (latest first) */
export async function fetchCaseStudies({ industry = 'all', search = '' } = {}) {
  if (!isSupabaseConfigured) {
    return filterLocal(SAMPLE_CASE_STUDIES.map(mapRow), industry, search);
  }

  try {
    let query = supabase
      .from('case_studies')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    const { data, error } = await query;
    if (error) return filterLocal(SAMPLE_CASE_STUDIES.map(mapRow), industry, search);

    const mapped = (data ?? []).map(mapRow);
    return filterLocal(mapped, industry, search);
  } catch {
    return filterLocal(SAMPLE_CASE_STUDIES.map(mapRow), industry, search);
  }
}

/** Local industry/search filter (static + DB dono ke liye same behaviour) */
function filterLocal(list, industry, search) {
  let out = list;
  if (industry && industry !== 'all') out = out.filter((r) => r.industry === industry);
  const q = (search || '').trim().toLowerCase();
  if (q) {
    out = out.filter((r) =>
      [r.title, r.excerpt, r.clientName, r.industry].some((v) => (v || '').toLowerCase().includes(q))
    );
  }
  return out;
}

/** Public: ek case study slug se */
export async function fetchCaseStudyBySlug(slug) {
  if (!isSupabaseConfigured) {
    return SAMPLE_CASE_STUDIES.map(mapRow).find((r) => r.slug === slug) || null;
  }
  try {
    const { data, error } = await supabase
      .from('case_studies')
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

/** Admin: saari case studies */
export async function fetchAdminCaseStudies() {
  if (!isSupabaseConfigured) return SAMPLE_CASE_STUDIES.map(mapRow);
  const { data, error } = await supabase
    .from('case_studies')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

/** Admin: ek case study id se */
export async function fetchAdminCaseStudyById(id) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('case_studies')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : null;
}

/** Admin: save (insert ya update) */
export async function saveCaseStudy(formData, id = null) {
  if (!isSupabaseConfigured) {
    throw new Error('This section is temporarily unavailable. Please try again in a while.');
  }

  const payload = {
    title: formData.title.trim(),
    slug: formData.slug.trim() || slugify(formData.title),
    client_name: formData.client_name || '',
    industry: formData.industry || '',
    excerpt: formData.excerpt || '',
    content: formData.content || '',
    cover_image_url: formData.cover_image_url || '',
    tags: Array.isArray(formData.tags)
      ? formData.tags
      : (formData.tags || '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
    is_published: Boolean(formData.is_published),
    published_at: formData.published_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (id && id !== 'new') {
    const { data, error } = await supabase
      .from('case_studies')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapRow(data);
  } else {
    const { data, error } = await supabase
      .from('case_studies')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return mapRow(data);
  }
}

/** Admin: delete */
export async function deleteCaseStudy(id) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('case_studies').delete().eq('id', id);
  if (error) throw error;
}

/** Public: views +1 (CaseStudyDetail se, per session) */
export async function incrementCaseStudyViews(slug) {
  if (!isSupabaseConfigured || !slug) return;
  try {
    await supabase.rpc('increment_case_study_views', { p_slug: slug });
  } catch {
    /* ignore */
  }
}

/** Admin: cover image upload (blog-assets bucket, case-studies folder) */
export async function uploadCaseStudyImage(file) {
  if (!isSupabaseConfigured) {
    throw new Error('This section is temporarily unavailable. Please try again in a while.');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image is too large. Please use an image under 10 MB.');
  }

  const fileExt = (file.name.split('.').pop() || 'png').toLowerCase();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = `case-studies/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('blog-assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/png',
    });

  if (uploadError) {
    throw new Error(uploadError.message || 'Upload failed. Check bucket policies.');
  }

  const { data } = supabase.storage.from('blog-assets').getPublicUrl(filePath);
  if (!data?.publicUrl) {
    throw new Error('Could not get public URL for the uploaded image.');
  }
  return data.publicUrl;
}
