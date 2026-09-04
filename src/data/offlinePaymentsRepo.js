/**
 * Admin "Mark as Paid — Offline" — bina gateway ke payment done mark karna
 * (cash / direct UPI / bank transfer). admin-offline-payment edge function
 * se hota hai (service_role, admin token server-side verified).
 *
 * NOTE: manual fetch use hota hai (functions.invoke generic "non-2xx" deta hai,
 * yahan server ka sahi error message dikhana zaroori hai).
 */
import { supabase } from '@/services/supabaseClient';

export const OFFLINE_METHODS = ['Cash', 'Direct UPI', 'Bank Transfer', 'Other'];

// Trailing slash safe base URL (VITE_SUPABASE_URL me galti se / aa jaye to bhi theek)
function functionsBase() {
  return String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
}

async function invokeOfflinePayment(payload) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) {
    throw new Error('Your session has expired. Please log in again.');
  }
  let res;
  try {
    res = await fetch(`${functionsBase()}/functions/v1/admin-offline-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Could not reach the payment service. Check your internet and try again.');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Server (edge function) ka error message prefer karo, warna status ke saath friendly message
    const serverMsg = body?.error || body?.message || '';
    throw new Error(serverMsg || `Could not mark the payment as done. (error ${res.status}) — please try again.`);
  }
  return body;
}

/** Course/Workshop enrollment offline paid mark karo */
export function markEnrollmentPaidOffline({ leadType, leadId, amount, method, note, countCommission }) {
  return invokeOfflinePayment({ leadType, leadId, amount, method, note, countCommission });
}

/** Career application fee offline paid mark karo */
export function markApplicationPaidOffline({ applicationId, amount, method, note, countCommission }) {
  return invokeOfflinePayment({ leadType: 'career', applicationId, amount, method, note, countCommission });
}
