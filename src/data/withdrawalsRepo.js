/**
 * Mentor withdrawal requests repo (admin side).
 * Payment Request ID database trigger se banti hai (NX-W-XXXXXXXX).
 * Supabase configured na ho to SAMPLE_WITHDRAWALS se chalta hai.
 */
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';

const TABLE = 'mentor_withdrawals';

/** Supabase na ho to demo data */
export const SAMPLE_WITHDRAWALS = [
  {
    id: 'sample-w1',
    withdrawalCode: 'NX-W-A1B2C3D4',
    mentorUuid: 'sample-1',
    mentorId: 'NX-MEN-A1B2C3D4',
    name: 'Rahul Verma',
    mentorEmail: 'rahul.verma@example.com',
    mentorPhone: '9876543210',
    amount: 5000,
    method: 'upi',
    accNo: '',
    accName: '',
    bankIfsc: '',
    upiId: 'rahul@okhdfc',
    status: 'Created',
    refNo: '',
    adminMessage: '',
    requestedAt: new Date().toISOString(),
    processedAt: null,
  },
  {
    id: 'sample-w2',
    withdrawalCode: 'NX-W-E5F6G7H8',
    mentorUuid: 'sample-2',
    mentorId: 'NX-MEN-E5F6G7H8',
    name: 'Priya Singh',
    mentorEmail: 'priya.singh@example.com',
    mentorPhone: '9123456780',
    amount: 12000,
    method: 'bank',
    accNo: '1234567890',
    accName: 'Priya Singh',
    bankIfsc: 'SBIN0001234',
    upiId: '',
    status: 'Payment Done',
    refNo: 'REF998877',
    adminMessage: 'Paid via NEFT.',
    requestedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    processedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

function mapRow(row) {
  return {
    id: row.id,
    withdrawalCode: row.withdrawal_code || '',
    mentorUuid: row.mentor_uuid || '',
    mentorId: row.mentor_id || '',
    name: row.name || '',
    // Mentor ki imp details join se auto fetch (mentors table)
    mentorEmail: row.mentors?.email || '',
    mentorPhone: row.mentors?.phone || '',
    mentorLocation: row.mentors?.location || '',
    amount: Number(row.amount) || 0,
    method: row.method === 'bank' ? 'bank' : 'upi',
    accNo: row.acc_no || '',
    accName: row.acc_name || '',
    bankIfsc: row.bank_ifsc || '',
    upiId: row.upi_id || '',
    status: ['Created', 'In progress', 'Payment Done', 'Rejected'].includes(row.status) ? row.status : 'Created',
    refNo: row.ref_no || '',
    adminMessage: row.admin_message || '',
    requestedAt: row.requested_at || row.created_at,
    processedAt: row.processed_at || null,
  };
}

/** Admin: saari withdrawal requests (naye pehle) + mentor details join */
export async function fetchWithdrawals() {
  if (!isSupabaseConfigured) return SAMPLE_WITHDRAWALS;
  const { data, error } = await supabase
    .from(TABLE)
    .select('*, mentors(email, phone, location)')
    .order('requested_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

/**
 * Admin: request update (status / Ref No / message).
 * Status 'Payment Done' hote hi processed_at set hota hai (pehli baar).
 */
export async function updateWithdrawal(id, { status, refNo, adminMessage, processedAt }) {
  if (!isSupabaseConfigured) return;
  const payload = {
    status,
    ref_no: refNo || '',
    admin_message: adminMessage || '',
    updated_at: new Date().toISOString(),
  };
  if (processedAt) payload.processed_at = processedAt;
  const { error } = await supabase.from(TABLE).update(payload).eq('id', id);
  if (error) throw error;
}
