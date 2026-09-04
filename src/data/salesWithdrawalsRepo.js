/**
 * Sales withdrawal requests repo (admin side).
 * Payment Request ID database trigger se banti hai (NX-SW-XXXXXXXX).
 * Supabase configured na ho to SAMPLE_SALES_WITHDRAWALS se chalta hai.
 */
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';

const TABLE = 'sales_withdrawals';

/** Supabase na ho to demo data */
export const SAMPLE_SALES_WITHDRAWALS = [
  {
    id: 'sample-sw1',
    withdrawalCode: 'NX-SW-A1B2C3D4',
    salesUuid: 'sample-s1',
    salesId: 'NX-SAL-A1B2C3D4',
    name: 'Amit Gupta',
    salesEmail: 'amit.gupta@example.com',
    salesPhone: '9876500011',
    amount: 5000,
    method: 'upi',
    accNo: '',
    accName: '',
    bankIfsc: '',
    upiId: 'amit@okhdfc',
    status: 'Created',
    refNo: '',
    adminMessage: '',
    requestedAt: new Date().toISOString(),
    processedAt: null,
  },
  {
    id: 'sample-sw2',
    withdrawalCode: 'NX-SW-E5F6G7H8',
    salesUuid: 'sample-s2',
    salesId: 'NX-SAL-E5F6G7H8',
    name: 'Neha Rai',
    salesEmail: 'neha.rai@example.com',
    salesPhone: '9123400012',
    amount: 12000,
    method: 'bank',
    accNo: '1234567890',
    accName: 'Neha Rai',
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
    salesUuid: row.sales_uuid || '',
    salesId: row.sales_id || '',
    name: row.name || '',
    // Member ki imp details join se auto fetch (sales_members table)
    salesEmail: row.sales_members?.email || '',
    salesPhone: row.sales_members?.phone || '',
    salesLocation: row.sales_members?.location || '',
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

/** Admin: saari withdrawal requests (naye pehle) + member details join */
export async function fetchSalesWithdrawals() {
  if (!isSupabaseConfigured) return SAMPLE_SALES_WITHDRAWALS;
  const { data, error } = await supabase
    .from(TABLE)
    .select('*, sales_members(email, phone, location)')
    .order('requested_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

/**
 * Admin: request update (status / Ref No / message).
 * Status 'Payment Done' hote hi processed_at set hota hai (pehli baar).
 */
export async function updateSalesWithdrawal(id, { status, refNo, adminMessage, processedAt }) {
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
