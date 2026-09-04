/**
 * Announcements repo (admin -> mentor/sales notices, 2-way).
 * - Admin: direct insert/list (announcements table, RLS is_admin)
 *   list me har announcement ki reactions + replies bhi attach hote hain
 * - Mentor/Sales panels: apne edge functions se padhte hain
 * Supabase configured na ho to admin page khali list dikhata hai.
 */
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';

const TABLE = 'announcements';

function mapRow(row) {
  return {
    id: row.id,
    audience: row.audience,
    targetUuid: row.target_uuid || null,
    title: row.title || '',
    message: row.message || '',
    createdBy: row.created_by || 'admin',
    createdAt: row.created_at,
    reactions: [],
    replies: [],
  };
}

/** Admin: saare announcements (naye pehle) + unki reactions/replies */
export async function fetchAnnouncements() {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  const rows = (data ?? []).map(mapRow);
  const ids = rows.map((r) => r.id);
  if (ids.length) {
    const [rx, rp] = await Promise.all([
      supabase.from('announcement_reactions').select('announcement_id, emoji, reactor_uuid').in('announcement_id', ids),
      supabase
        .from('announcement_replies')
        .select('announcement_id, id, replier_name, message, created_at')
        .in('announcement_id', ids)
        .order('created_at', { ascending: true }),
    ]);
    if (!rx.error) {
      const byAnn = {};
      for (const r of rx.data ?? []) {
        (byAnn[r.announcement_id] = byAnn[r.announcement_id] || []).push({ emoji: r.emoji, reactorUuid: r.reactor_uuid });
      }
      for (const row of rows) row.reactions = byAnn[row.id] || [];
    }
    if (!rp.error) {
      const byAnn = {};
      for (const r of rp.data ?? []) {
        (byAnn[r.announcement_id] = byAnn[r.announcement_id] || []).push({ id: r.id, name: r.replier_name, message: r.message, createdAt: r.created_at });
      }
      for (const row of rows) row.replies = byAnn[row.id] || [];
    }
  }
  return rows;
}

/** Admin: announcement bhejo (targetUuid null = poore audience ko) */
export async function sendAnnouncement({ audience, targetUuid = null, title, message }) {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured.');
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      audience,
      target_uuid: targetUuid,
      title: String(title || '').slice(0, 160),
      message: String(message || '').slice(0, 4000),
    })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}
