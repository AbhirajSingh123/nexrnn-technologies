import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';
import { ACTIVE_COURSES as STATIC_ACTIVE_COURSES } from './courses';

function mapRow(row) {
  return {
    slug: row.slug,
    batchId: row.batch_id,
    icon: row.icon,
    title: row.title,
    shortDescription: row.short_description,
    duration: row.duration,
    level: row.level,
    mode: row.mode,
    originalPrice: row.original_price,
    price: row.price,
    discountPercent: row.discount_percent,
    isDemoPrice: row.is_demo_price,
    demoVideoUrl: row.demo_video_url,
    hasCertificateSample: row.has_certificate_sample,
    projects: row.projects,
    certificate: row.certificate,
    mentorship: row.mentorship,
    topics: row.topics ?? [],
    whatYouLearn: row.what_you_learn ?? [],
    whoShouldJoin: row.who_should_join ?? [],
    faqs: row.faqs ?? [],
    qrCodeUrl: row.qr_code_url,
    whatsappGroupLink: row.whatsapp_group_link,
    isFree: row.is_free,
    active: row.active,
  };
}

export async function fetchCourses() {
  if (!isSupabaseConfigured) return STATIC_ACTIVE_COURSES;
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });
  if (error || !data?.length) return STATIC_ACTIVE_COURSES;
  return data.map(mapRow);
}

export async function fetchCourseBySlug(slug) {
  if (!isSupabaseConfigured) return STATIC_ACTIVE_COURSES.find((c) => c.slug === slug) ?? null;
  const { data, error } = await supabase.from('courses').select('*').eq('slug', slug).eq('active', true).maybeSingle();
  if (error || !data) return STATIC_ACTIVE_COURSES.find((c) => c.slug === slug) ?? null;
  return mapRow(data);
}
