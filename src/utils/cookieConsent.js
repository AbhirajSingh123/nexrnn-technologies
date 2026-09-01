/**
 * ============================================================
 * COOKIE CONSENT STORE + GOOGLE CONSENT MODE WIRING
 * ============================================================
 *
 * - Consent localStorage me save hota hai (key: nx_cookie_consent)
 * - Version badla to banner dobara dikh uthta (naya policy = naya sawal)
 * - Google Consent Mode v2 signals yahin se control hote hain:
 *     analytics_storage, ad_storage, ad_user_data, ad_personalization
 * - Clarity script sirf experience consent ke baad load hota hai
 *
 * NOTE: Ye file tracking script kuch bhi inject nahi karti (GSC meta,
 *       GA4, GTM wahi AnalyticsLoader me hain) - sirf consent signals
 *       aur Clarity ka consent-gated load yahan hai.
 */

import { CLARITY_ID } from '@/constants/analyticsConfig';

export const CONSENT_VERSION = '1.0';
export const CONSENT_KEY = 'nx_cookie_consent';
export const CONSENT_EVENT = 'nx:consent-changed';
export const OPEN_SETTINGS_EVENT = 'nx:open-cookie-settings';

/** Footer "Cookie Settings" link isko click karke preferences modal kholta hai */
export function openCookieSettings() {
  window.dispatchEvent(new CustomEvent(OPEN_SETTINGS_EVENT));
}

/** Default: sirf necessary on, baaki sab DENIED (privacy-first) */
export function defaultConsent() {
  return {
    necessary: true,
    analytics: false,
    experience: false,
    advertising: false,
    preferences: false,
    timestamp: '',
    version: CONSENT_VERSION,
  };
}

/** Saved consent (ya null agar choice hui hi nahi / purana version hai) */
export function readConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!saved || saved.version !== CONSENT_VERSION) return null; // policy version badla -> dobara poochho
    return { ...defaultConsent(), ...saved };
  } catch {
    return null;
  }
}

/** Consent save karo + Google/Clarity ko turant update karo */
export function saveConsent(partial) {
  const consent = { ...defaultConsent(), ...partial, necessary: true, timestamp: new Date().toISOString(), version: CONSENT_VERSION };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch {
    /* private mode - chalega, bas save nahi hua */
  }
  applyGoogleConsent(consent);
  if (consent.experience) loadClarity();
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: consent }));
  return consent;
}

/** Kya user ne kabhi choice ki? (banner sirf tab dikhana) */
export function hasStoredChoice() {
  return readConsent() !== null;
}

// ---- category helpers (GoogleAd / AnalyticsLoader in use) ----
export const hasAnalyticsConsent = () => Boolean(readConsent()?.analytics);
export const hasExperienceConsent = () => Boolean(readConsent()?.experience);
export const hasAdvertisingConsent = () => Boolean(readConsent()?.advertising);

/** Consent change par react karne ke liye chhota pub-sub */
export function subscribeConsent(cb) {
  const handler = (e) => cb(e.detail);
  window.addEventListener(CONSENT_EVENT, handler);
  return () => window.removeEventListener(CONSENT_EVENT, handler);
}

// ============================================================
// GOOGLE CONSENT MODE v2
// ============================================================

/** Sabse pehle call hota hai: non-essential storage DEFAULT DENIED */
export function setDefaultGoogleConsent() {
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted', // sirf consent-preference save rakhne ke liye
    security_storage: 'granted',
    wait_for_update: 500,
  });
}

/** User ke consent hisaab se Google signals update */
export function applyGoogleConsent(consent) {
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };
  window.gtag('consent', 'update', {
    ad_storage: consent.advertising ? 'granted' : 'denied',
    ad_user_data: consent.advertising ? 'granted' : 'denied',
    ad_personalization: consent.advertising ? 'granted' : 'denied',
    analytics_storage: consent.analytics ? 'granted' : 'denied',
  });
}

// ============================================================
// MICROSOFT CLARITY (consent-gated - AnalyticsLoader se aage badhaya)
// ============================================================

/** Clarity script sirf experience consent milne par load hogi (duplicate-safe) */
export function loadClarity() {
  if (!CLARITY_ID || document.getElementById('clarity-script')) return;
  window.clarity =
    window.clarity ||
    function (...args) {
      window.clarity.q = window.clarity.q || [];
      window.clarity.q.push(args);
    };
  const s = document.createElement('script');
  s.id = 'clarity-script';
  s.async = true;
  s.src = 'https://www.clarity.ms/tag/' + CLARITY_ID;
  document.head.appendChild(s);
}
