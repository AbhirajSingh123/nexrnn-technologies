import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';
import { SERVICES as STATIC_SERVICES } from './services';

function mapRow(row) {
  return {
    slug: row.slug,
    icon: row.icon,
    title: row.title,
    shortDescription: row.short_description,
    benefits: row.benefits ?? [],
    features: row.features ?? [],
    price: row.price,
    originalPrice: row.original_price,
    discountPercent: row.discount_percent,
    cta: row.cta,
    active: row.active,
  };
}

export async function fetchServices() {
  if (!isSupabaseConfigured) return STATIC_SERVICES;
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });
  if (error || !data?.length) return STATIC_SERVICES;
  return data.map(mapRow);
}

export async function fetchServiceBySlug(slug) {
  if (!isSupabaseConfigured) return STATIC_SERVICES.find((s) => s.slug === slug) ?? null;
  const { data, error } = await supabase.from('services').select('*').eq('slug', slug).eq('active', true).maybeSingle();
  if (error || !data) return STATIC_SERVICES.find((s) => s.slug === slug) ?? null;
  return mapRow(data);
}
