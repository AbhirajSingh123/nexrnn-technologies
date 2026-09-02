/**
 * Promo codes repo.
 * - Admin: CRUD + active/deactive (promo_codes table)
 * - Public: validatePromo (edge function 'validate-promo' se - server-side sahī)
 * Supabase configured na ho to SAMPLE_PROMOS se chalता hai.
 */
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';

const TABLE = 'promo_codes';

/** Supabase na ho to demo data */
export const SAMPLE_PROMOS = [
  {
    id: 'sample-p1',
    code: 'WELCOME10',
    discountType: 'percent',
    discountValue: 10,
    appliesTo: 'all',
    itemId: null,
    itemTitle: '',
    maxUses: null,
    usedCount: 3,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample-p2',
    code: 'FLAT200',
    discountType: 'flat',
    discountValue: 200,
    appliesTo: 'course',
    itemId: null,
    itemTitle: '',
    maxUses: 50,
    usedCount: 12,
    active: false,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

function mapRow(row) {
  return {
    id: row.id,
    code: row.code || '',
    discountType: row.discount_type === 'flat' ? 'flat' : 'percent',
    discountValue: Number(row.discount_value) || 0,
    appliesTo: ['all', 'course', 'workshop', 'career'].includes(row.applies_to) ? row.applies_to : 'all',
    itemId: row.item_id || null,
    itemTitle: row.item_title || '',
    maxUses: row.max_uses ?? null,
    usedCount: Number(row.used_count) || 0,
    active: Boolean(row.active),
    createdAt: row.created_at,
  };
}

/** Admin: saare promo codes (naye pehle) */
export async function fetchPromoCodes() {
  if (!isSupabaseConfigured) return SAMPLE_PROMOS;
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

/** Admin: naya promo code (code uppercase save hota hai) */
export async function createPromoCode(payload) {
  if (!isSupabaseConfigured) {
    return { ...payload, id: `local-${Date.now()}`, usedCount: 0, createdAt: new Date().toISOString() };
  }
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      code: String(payload.code || '').trim().toUpperCase(),
      discount_type: payload.discountType,
      discount_value: Number(payload.discountValue) || 0,
      applies_to: payload.appliesTo || 'all',
      item_id: payload.itemId || null,
      max_uses: payload.maxUses ? Number(payload.maxUses) : null,
      active: payload.active !== false,
    })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data);
}

/** Admin: promo update */
export async function updatePromoCode(id, payload) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from(TABLE)
    .update({
      code: String(payload.code || '').trim().toUpperCase(),
      discount_type: payload.discountType,
      discount_value: Number(payload.discountValue) || 0,
      applies_to: payload.appliesTo || 'all',
      item_id: payload.itemId || null,
      max_uses: payload.maxUses ? Number(payload.maxUses) : null,
      active: payload.active !== false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

/** Admin: active/deactive toggle */
export async function setPromoActive(id, active) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from(TABLE)
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

/** Admin: delete */
export async function deletePromoCode(id) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

/**
 * Public: promo validate (payment popup ke Apply button se).
 * Server-side check hota hai (active, item match, discount calc) - bharosa nahi frontend par.
 * Returns { valid, code, discountType, discountValue, discount, base, message }
 */
export async function validatePromo({ code, kind, amount, itemId }) {
  if (!isSupabaseConfigured) {
    const err = new Error('Promo codes are not available right now.');
    throw err;
  }
  const { data, error } = await supabase.functions.invoke('validate-promo', {
    body: { code: String(code || '').trim().toUpperCase(), kind, amount: Number(amount) || 0, itemId: itemId || null },
  });
  if (error) throw new Error(error.message || 'Could not verify the promo code.');
  return data; // { valid:false, message } | { valid:true, discount, ... }
}
