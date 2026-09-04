/**
 * Sales team repo (admin-managed sales network).
 * Sales ID database-side trigger se banti hai (NX-SAL-XXXXXXXX) aur
 * referral_code 7-digit DB trigger se (unique, NOT changeable).
 * Supabase configured na ho to SAMPLE_SALES se chalta hai (site jaisi).
 */
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';

const TABLE = 'sales_members';

/** Supabase na ho to demo data (admin panel khali na dikhe) */
export const SAMPLE_SALES = [
  {
    id: 'sample-s1',
    salesId: 'NX-SAL-A1B2C3D4',
    referralCode: '4821593',
    name: 'Amit Gupta',
    email: 'amit.gupta@example.com',
    phone: '9876500011',
    commissionCourse: 10,
    commissionWorkshop: 8,
    commissionService: 12,
    location: 'Lucknow, UP',
    gender: 'Male',
    blocked: false,
    dateOfJoining: '2026-02-10',
  },
  {
    id: 'sample-s2',
    salesId: 'NX-SAL-E5F6G7H8',
    referralCode: '5713486',
    name: 'Neha Rai',
    email: 'neha.rai@example.com',
    phone: '9123400012',
    commissionCourse: 8,
    commissionWorkshop: 8,
    commissionService: 10,
    location: 'Kanpur, UP',
    gender: 'Female',
    blocked: false,
    dateOfJoining: '2026-04-01',
  },
];

function mapRow(row) {
  return {
    id: row.id,
    salesId: row.sales_id || '',
    referralCode: row.referral_code || '',
    name: row.name || '',
    email: row.email || '',
    phone: row.phone || '',
    commissionPercent: Number(row.commission_percent) || 0,
    commissionCourse: Number(row.commission_course ?? row.commission_percent) || 0,
    commissionWorkshop: Number(row.commission_workshop ?? row.commission_percent) || 0,
    commissionService: Number(row.commission_service ?? row.commission_percent) || 0,
    bankAccNo: row.bank_acc_no || '',
    bankAccName: row.bank_acc_name || '',
    bankIfsc: row.bank_ifsc || '',
    upiId: row.upi_id || '',
    location: row.location || '',
    gender: row.gender || '',
    blocked: Boolean(row.blocked),
    dateOfJoining: row.date_of_joining || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Admin: saare sales members (naye pehle) */
export async function fetchSalesMembers() {
  if (!isSupabaseConfigured) return SAMPLE_SALES.map(mapRow);
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

/** Admin: naya sales member add (Sales ID + referral code DB trigger se aate hain) */
export async function createSalesMember(payload) {
  if (!isSupabaseConfigured) {
    // Demo mode: client-side random ID + 7-digit code (DB me trigger khud karta hai)
    const id = 'NX-SAL-' + Math.random().toString(36).slice(2, 10).toUpperCase();
    const code = String(Math.floor(1000000 + Math.random() * 9000000));
    return { ...payload, salesId: id, referralCode: code, id: `local-${Date.now()}` };
  }
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      commission_course: Number(payload.commissionCourse) || 0,
      commission_workshop: Number(payload.commissionWorkshop) || 0,
      commission_service: Number(payload.commissionService) || 0,
      location: payload.location,
      gender: payload.gender || '',
      date_of_joining: payload.dateOfJoining || null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data);
}

/** Admin: sales member update (Sales ID / referral code kabhi nahi badalte) */
export async function updateSalesMember(id, payload) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from(TABLE)
    .update({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      commission_course: Number(payload.commissionCourse) || 0,
      commission_workshop: Number(payload.commissionWorkshop) || 0,
      commission_service: Number(payload.commissionService) || 0,
      location: payload.location,
      gender: payload.gender || '',
      date_of_joining: payload.dateOfJoining || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

/** Admin: member ko block/unblock karo (blocked = login nahi kar payega) */
export async function setSalesMemberBlocked(id, blocked) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from(TABLE)
    .update({ blocked, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
