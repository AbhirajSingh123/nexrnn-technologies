import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';

// supabase.functions.invoke() only puts a generic "non-2xx status" message on
// `error.message` for failed calls — the actual JSON error body our edge
// functions return has to be read separately from `error.context` (a Response).
async function extractFunctionErrorMessage(error, fallback) {
  try {
    if (error?.context && typeof error.context.json === 'function') {
      const body = await error.context.json();
      if (body?.error) return body.error;
    }
  } catch {
    // context wasn't valid JSON — fall through to the generic message below.
  }
  return error?.message || fallback;
}

// leadType: 'course' | 'workshop'
export async function createCashfreeOrder({ leadId, leadType, amount, customerName, customerEmail, customerPhone, itemTitle }) {
  if (!isSupabaseConfigured) {
    throw new Error('Payment backend is not configured yet. Please contact us directly to enroll.');
  }
  const { data, error } = await supabase.functions.invoke('create-cashfree-order', {
    body: { leadId, leadType, amount, customerName, customerEmail, customerPhone, itemTitle },
  });
  if (error) throw new Error(await extractFunctionErrorMessage(error, 'Failed to start payment. Please try again.'));
  if (data?.error) throw new Error(data.error);
  if (!data?.paymentSessionId) {
    // Never hand an empty/undefined session to Cashfree's checkout — that's
    // what produces the confusing "payment_session_id is not present" error
    // on Cashfree's own page instead of a clear message on ours.
    throw new Error('Payment could not be started (no session returned by the payment gateway). Please try again.');
  }
  return data; // { orderId, paymentSessionId }
}

export async function verifyCashfreePayment(orderId) {
  if (!isSupabaseConfigured) {
    throw new Error('Payment backend is not configured yet.');
  }
  const { data, error } = await supabase.functions.invoke('verify-cashfree-payment', {
    body: { orderId },
  });
  if (error) throw new Error(await extractFunctionErrorMessage(error, 'Failed to verify payment.'));
  if (data?.error) throw new Error(data.error);
  return data; // { status, orderId, leadType, itemTitle, studentName, whatsappGroupLink }
}
