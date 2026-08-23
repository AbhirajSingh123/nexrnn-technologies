import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';
import { PORTFOLIO_ITEMS as STATIC_ITEMS } from './portfolio';

function mapRow(row) {
  return {
    id: row.id,
    isDemo: false,
    imageUrl: row.image_url,
    category: row.category,
    name: row.project_name,
    description: row.short_description,
  };
}

export async function fetchPortfolio() {
  if (!isSupabaseConfigured) return STATIC_ITEMS.map((p) => ({ ...p, imageUrl: null }));
  const { data, error } = await supabase
    .from('portfolio')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });
  if (error || !data?.length) return STATIC_ITEMS.map((p) => ({ ...p, imageUrl: null }));
  return data.map(mapRow);
}
