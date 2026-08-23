import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';
import { REVIEW_VIDEOS as STATIC_REVIEWS } from './reviewVideos';

function mapRow(row) {
  return {
    id: row.id,
    isDemo: false,
    name: row.client_name,
    role: row.service_name,
    youtubeUrl: row.youtube_url,
  };
}

export async function fetchClientReviews() {
  if (!isSupabaseConfigured) return STATIC_REVIEWS;
  const { data, error } = await supabase
    .from('client_reviews')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });
  if (error || !data?.length) return STATIC_REVIEWS;
  return data.map(mapRow);
}
