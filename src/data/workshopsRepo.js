import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';
import { WORKSHOPS as STATIC_WORKSHOPS } from './workshops';

function mapRow(row) {
  return {
    slug: row.slug,
    bannerUrl: row.banner_url,
    title: row.title,
    shortDescription: row.short_description,
    workshopDatetime: row.workshop_datetime,
    registrationDeadline: row.registration_deadline,
    details: row.details,
    originalPrice: row.original_price,
    price: row.price,
    discountPercent: row.discount_percent,
    isDemoPrice: row.is_demo_price,
    demoVideoUrl: row.demo_video_url,
    hasCertificateSample: row.has_certificate_sample,
    faqs: row.faqs ?? [],
    whatsappGroupLink: row.whatsapp_group_link,
    isFree: row.is_free,
    mentorName: row.mentor_name,
    mentorIntro: row.mentor_intro,
    active: row.active,
  };
}

export async function fetchWorkshops() {
  if (!isSupabaseConfigured) return STATIC_WORKSHOPS;
  const { data, error } = await supabase
    .from('workshops')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });
  if (error || !data) return STATIC_WORKSHOPS;
  return data.map(mapRow);
}

export async function fetchWorkshopBySlug(slug) {
  if (!isSupabaseConfigured) return STATIC_WORKSHOPS.find((w) => w.slug === slug) ?? null;
  const { data, error } = await supabase.from('workshops').select('*').eq('slug', slug).eq('active', true).maybeSingle();
  if (error || !data) return null;
  return mapRow(data);
}
