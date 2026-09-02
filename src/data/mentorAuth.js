/**
 * Mentor auth + panel data client.
 * - Login: Mentor ID + mobile -> mentor-login edge function -> HMAC token
 * - Token sessionStorage me (tab band = logout; back-button par bhi protected)
 * - Saara data mentor-data edge function se - mentor id token se aati hai
 */
import { isSupabaseConfigured } from '@/services/supabaseClient';

const TOKEN_KEY = 'nx_mentor_token';
const PROFILE_KEY = 'nx_mentor_profile';

export function getMentorToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function getSavedMentorProfile() {
  try {
    const raw = sessionStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const MENTOR_SESSION_CLEARED = 'nx:mentor-session-cleared';

export function mentorLogout() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(PROFILE_KEY);
  } catch {
    /* ignore */
  }
  // Context ko batao (401 par bhi) - warna login<->dashboard redirect loop ban sakta hai
  try {
    window.dispatchEvent(new CustomEvent(MENTOR_SESSION_CLEARED));
  } catch {
    /* ignore */
  }
}

/** Mentor ID + mobile se login (server-side validation) */
export async function loginMentor(mentorId, phone) {
  if (!isSupabaseConfigured) throw new Error('Backend is not configured yet. See README / Supabase setup.');
  // fetch (invoke nahi) - taaki 401 ka exact error message dikhe
  let res;
  try {
    res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mentor-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Supabase platform-level JWT check (verify_jwt) ke liye zaroori:
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
      body: JSON.stringify({ mentorId, phone }),
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
      ? 'Invalid Mentor ID or mobile number.'
      : 'Login failed. Please try again in a while or contact us.'));
  }
  try {
    sessionStorage.setItem(TOKEN_KEY, data.token);
    sessionStorage.setItem(PROFILE_KEY, JSON.stringify(data.mentor || {}));
  } catch {
    /* ignore */
  }
  return data;
}

/** Profile ko sessionStorage me save karo (login + refresh dono use karte hain) */
export function saveMentorProfile(profile) {
  try {
    sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile || {}));
  } catch {
    /* ignore */
  }
}

/**
 * Stale session fix: server se fresh profile laao aur session update karo.
 * (Admin ne mentor ka type/gender badla ho to bina re-login bhi sahi dikhe.)
 */
export async function refreshMentorProfile() {
  const token = getMentorToken();
  if (!token || !isSupabaseConfigured) return null;
  try {
    const data = await mentorData('profile');
    if (data?.mentor) {
      const current = getSavedMentorProfile() || {};
      const merged = { ...current, ...data.mentor, mentorId: data.mentor.mentorId || current.mentorId };
      saveMentorProfile(merged);
      return merged;
    }
  } catch {
    /* ignore - offline/edge down par session waisi hi rahe */
  }
  return null;
}

/**
 * Mentor-data API call (token ke saath).
 * 401 aaye to session saaf karke error - ProtectedRoute login par bhej dega.
 */
export async function mentorData(action, payload = {}) {
  const token = getMentorToken();
  if (!token || !isSupabaseConfigured) {
    const err = new Error('Session expired. Please login again.');
    err.status = 401;
    throw err;
  }
  let res;
  try {
    res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mentor-data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Platform-level JWT: anon key. Hamara mentor token alag header me jata hai
      // (mentor-data fn usi se identity nikalta hai)
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      'x-mentor-token': token,
    },
      body: JSON.stringify({ action, mentor_token: token, ...payload }),
    });
  } catch {
    // Network/CORS failure - almost always: mentor-data edge function deployed nahi hai
    const err = new Error('Data service is temporarily unavailable. Please try again in a while, or contact us if the issue continues.');
    err.noRetryHint = true;
    throw err;
  }
  if (res.status === 404) {
    const err = new Error('Data service is temporarily unavailable. Please try again in a while, or contact us if the issue continues.');
    err.status = 404;
    throw err;
  }
  if (res.status === 403) {
    // Blocked mentor - session khatam + page par blocked message jaye
    mentorLogout();
    const err = new Error(data.error || 'You are blocked By Nexrnn Admin.');
    err.status = 403;
    err.blocked = true;
    throw err;
  }
  if (res.status === 401) {
    mentorLogout();
    const err = new Error('Session expired. Please login again.');
    err.status = 401;
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed.');
  return data;
}
