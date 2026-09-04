/**
 * Sales auth + panel data client.
 * - Login: Sales ID + mobile -> sales-login edge function -> HMAC token
 * - Token sessionStorage me (tab band = logout; back-button par bhi protected)
 * - Saara data sales-data edge function se - sales id token se aati hai
 */
import { isSupabaseConfigured } from '@/services/supabaseClient';

const TOKEN_KEY = 'nx_sales_token';
const PROFILE_KEY = 'nx_sales_profile';

export function getSalesToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function getSavedSalesProfile() {
  try {
    const raw = sessionStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const SALES_SESSION_CLEARED = 'nx:sales-session-cleared';

export function salesLogout() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(PROFILE_KEY);
  } catch {
    /* ignore */
  }
  // Context ko batao (401 par bhi) - warna login<->dashboard redirect loop ban sakta hai
  try {
    window.dispatchEvent(new CustomEvent(SALES_SESSION_CLEARED));
  } catch {
    /* ignore */
  }
}

/** Sales ID + mobile se login (server-side validation) */
export async function loginSales(salesId, phone) {
  if (!isSupabaseConfigured) throw new Error('Login service is temporarily unavailable. Please try again in a while.');
  // fetch (invoke nahi) - taaki 401 ka exact error message dikhe
  let res;
  try {
    res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sales-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Supabase platform-level JWT check (verify_jwt) ke liye zaroori:
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ salesId, phone }),
    });
  } catch {
    throw new Error('Login service is temporarily unavailable. Please try again in a while.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    if (res.status === 404) {
      throw new Error('Login service is temporarily unavailable. Please try again in a while.');
    }
    throw new Error(data.error || (res.status === 401
      ? 'Invalid Sales ID or mobile number.'
      : 'Login failed. Please try again in a while or contact us.'));
  }
  try {
    sessionStorage.setItem(TOKEN_KEY, data.token);
    sessionStorage.setItem(PROFILE_KEY, JSON.stringify(data.member || {}));
  } catch {
    /* ignore */
  }
  return data;
}

/** Profile ko sessionStorage me save karo (login + refresh dono use karte hain) */
export function saveSalesProfile(profile) {
  try {
    sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile || {}));
  } catch {
    /* ignore */
  }
}

/**
 * Stale session fix: server se fresh profile laao aur session update karo.
 * (Admin ne member ki commission badli ho to bina re-login bhi sahi dikhe.)
 */
export async function refreshSalesProfile() {
  const token = getSalesToken();
  if (!token || !isSupabaseConfigured) return null;
  try {
    const data = await salesData('profile');
    if (data?.member) {
      const current = getSavedSalesProfile() || {};
      const merged = { ...current, ...data.member, salesId: data.member.salesId || current.salesId };
      saveSalesProfile(merged);
      return merged;
    }
  } catch {
    /* ignore - offline/edge down par session waisi hi rahe */
  }
  return null;
}

/**
 * Sales-data API call (token ke saath).
 * 401 aaye to session saaf karke error - ProtectedRoute login par bhej dega.
 */
export async function salesData(action, payload = {}) {
  const token = getSalesToken();
  if (!token || !isSupabaseConfigured) {
    const err = new Error('Session expired. Please login again.');
    err.status = 401;
    throw err;
  }
  let res;
  try {
    res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sales-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Platform-level JWT: anon key. Hamara sales token alag header me jata hai
        // (sales-data fn usi se identity nikalta hai)
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        'x-sales-token': token,
      },
      body: JSON.stringify({ action, sales_token: token, ...payload }),
    });
  } catch {
    // Network/CORS failure - almost always: sales-data edge function deployed nahi hai
    const err = new Error('Data service is temporarily unavailable. Please try again in a while, or contact us if the issue continues.');
    err.noRetryHint = true;
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 404) {
    const err = new Error('Data service is temporarily unavailable. Please try again in a while, or contact us if the issue continues.');
    err.status = 404;
    throw err;
  }
  if (res.status === 403) {
    // Blocked member - session khatam + page par blocked message jaye
    salesLogout();
    const err = new Error(data.error || 'You are blocked By Nexrnn Admin.');
    err.status = 403;
    err.blocked = true;
    throw err;
  }
  if (res.status === 401) {
    salesLogout();
    const err = new Error('Session expired. Please login again.');
    err.status = 401;
    throw err;
  }
  if (!res.ok) throw new Error(data.error || 'Request failed.');
  return data;
}
