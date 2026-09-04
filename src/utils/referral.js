/**
 * Sales refer & earn attribution (link-based).
 *
 * Sales member ka shared link: https://www.nexrnntechnologies.in/?ref=4821593
 * (ya kisi bhi page par ?ref=... — service/course/workshop detail links bhi).
 *
 * User jis bhi page se aaye, ?ref= capture ho kar localStorage me save ho
 * jata hai. Uske baad SITE PAR HAR FORM (service enquiry, course enroll,
 * workshop enroll, career apply) me referral code AUTO-FILL ho jata hai —
 * user kuch bhi buy kare ya lead de, referral us sales member ka hi jata hai.
 */

const REFERRAL_KEY = 'nx_referral_code';

/** ?ref= (ya ?referral=) se code uthao, save karo, URL se hata do */
export function captureReferralFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = (params.get('ref') || params.get('referral') || '').trim().toUpperCase().slice(0, 20);
    if (raw) {
      localStorage.setItem(REFERRAL_KEY, raw);
      // Clean URL: code address bar me na dikhe (share screenshots clean rahen)
      params.delete('ref');
      params.delete('referral');
      const qs = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash);
    }
  } catch {
    /* ignore */
  }
}

/** Form me prefill karne ke liye saved code ('' agar nahi hai) */
export function getStoredReferral() {
  try {
    return localStorage.getItem(REFERRAL_KEY) || '';
  } catch {
    return '';
  }
}
