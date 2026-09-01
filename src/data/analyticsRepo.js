/**
 * Admin panel analytics data fetch karne ke simple functions.
 * Saara aggregation JS mein hota hai (traffic is scale pe perfect).
 */
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';

const MAX_ROWS = 50000;
const PAGE_SIZE = 1000; // Supabase per-request cap - pagination zaroori hai

/**
 * Last N days ke saare events laao (latest first).
 * Supabase ek request me max 1000 rows deta hai - range() se saare pages lo
 * (warna bade traffic par counts chhote dikhte the - fixed bug).
 */
export async function fetchAnalyticsEvents(days = 7) {
  if (!isSupabaseConfigured) return [];
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString();

  const out = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('analytics_events')
      .select('id, event_name, path, label, value, visitor_id, created_at')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if ((data ?? []).length < PAGE_SIZE) break; // last page
  }
  return out;
}

/** Tracking kab se live hai (sabse purana event) - "kab ka data hai" ke liye */
export async function fetchAnalyticsSince() {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase
    .from('analytics_events')
    .select('created_at')
    .order('created_at', { ascending: true })
    .limit(1);
  return data?.[0]?.created_at ?? null;
}

/** Event name ke hisaab se counts */
export function countByEvent(events) {
  const counts = {};
  for (const e of events) {
    counts[e.event_name] = (counts[e.event_name] || 0) + 1;
  }
  return counts;
}

/** Unique visitors (page_view events ke visitor_id se) */
export function countUniqueVisitors(events) {
  const ids = new Set();
  for (const e of events) {
    if (e.event_name !== 'page_view') continue;
    if (e.visitor_id) ids.add(e.visitor_id);
  }
  return ids.size;
}

/** Din ke hisaab se page views (last N days, chart ke liye) */
export function dailyPageViews(events, days = 14) {
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    series.push({ date: key, count: 0 });
  }
  const index = Object.fromEntries(series.map((s, i) => [s.date, i]));
  for (const e of events) {
    if (e.event_name !== 'page_view') continue;
    const key = (e.created_at || '').slice(0, 10);
    if (key in index) series[index[key]].count++;
  }
  return series;
}

/** Sabse zyada padhe gaye blog posts (blog_read events se) */
export function topBlogPosts(events, limit = 10) {
  const counts = {};
  for (const e of events) {
    if (e.event_name !== 'blog_read' || !e.label) continue;
    counts[e.label] = (counts[e.label] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([title, reads]) => ({ title, reads }))
    .sort((a, b) => b.reads - a.reads)
    .slice(0, limit);
}

/** Sabse popular pages (page_view events se) */
export function topPages(events, limit = 10) {
  const counts = {};
  for (const e of events) {
    if (e.event_name !== 'page_view' || !e.path) continue;
    counts[e.path] = (counts[e.path] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}
