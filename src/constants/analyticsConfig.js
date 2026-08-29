/**
 * ============================================================
 * ANALYTICS & TRACKING CONFIG
 * (GA4 + Google Tag Manager + Microsoft Clarity + Search Console)
 * ============================================================
 *
 * IDs paste karte ho -> tracking apne aap on ho jayegi.
 * Khali chhoda -> kuch load nahi hoga, koi error nahi.
 *
 * ---------- IDs kahan milte hain ----------
 *
 * 1) GA4_ID:
 *    analytics.google.com -> Admin -> Data Streams -> apna web
 *    stream -> "G-XXXXXXXXXX" copy karo.
 *    NOTE: GA4 ko DIRECT laga rahe ho (Option A - simple & recommended).
 *    GTM bhi on karoge to double counting hogi - ek hi chuno.
 *
 * 2) GTM_ID (optional - sirf agar GTM use karna hai):
 *    tagmanager.google.com -> container ID "GTM-XXXXXXX".
 *
 * 3) CLARITY_ID (Microsoft Clarity - free heatmaps & recordings):
 *    clarity.microsoft.com -> New project -> setup -> "XXXXXXX-XX" ID.
 *
 * 4) GSC_VERIFICATION (Google Search Console):
 *    search.google.com/search-console -> apni site add karo ->
 *    "HTML tag" method choose karo -> content="..." wala code
 *    (google-site-verification=... ke baad wala hissa) yahan paste karo.
 *
 * 5) GOOGLE_BUSINESS_PROFILE_URL (optional):
 *    Apne Google Business Profile ka link - site footer/schema
 *    ke "sameAs" mein jayega (local SEO boost).
 */

export const GA4_ID = 'G-K4SNP45ELV'; // e.g. 'G-ABCDEF1234'
export const GTM_ID = ''; // e.g. 'GTM-ABC1234' (optional)
export const CLARITY_ID = 'y9xutlx9sj'; // e.g. 'abcd1234ef'
export const GSC_VERIFICATION = '4z7XW-LxFlEQVYfMGIoPCUVN8ziUXIoSNLleZ8WudmI'; // e.g. 'abc123XYZ_from_meta_tag'
export const GOOGLE_BUSINESS_PROFILE_URL = ''; // e.g. 'https://g.page/r/xxxx/review'
