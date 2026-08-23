import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';
import { TESTIMONIALS as STATIC_TESTIMONIALS } from './testimonials';

function mapRow(row) {
  return {
    id: row.id,
    isDemo: false,
    name: row.client_name,
    role: row.company_name,
    quote: row.review,
    rating: row.rating,
  };
}

export async function fetchTestimonials() {
  if (!isSupabaseConfigured) return STATIC_TESTIMONIALS;
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });
  if (error || !data?.length) return STATIC_TESTIMONIALS;
  return data.map(mapRow);
}
