/**
 * ============================================================
 * CENTRAL TRACKING HELPERS (simple syntax)
 * ============================================================
 *
 * trackEvent() har event ko 2 jagah bhejta hai (analytics_events
 * table DB storage full kar rahi thi — hatadi gayi; traffic ab
 * Google Analytics (GA4/GTM) se dekha jata hai):
 *   1. GTM dataLayer  (agar GTM setup hai)
 *   2. GA4 gtag       (agar GA4 setup hai)
 *
 * Rules:
 * - Kabhi error throw nahi karta (tracking fail ho to site chalti rahe)
 * - fire-and-forget: UI wait nahi karta
 */

export function trackEvent(name, params = {}) {
  try {
    if (typeof window !== 'undefined') {
      // 1. GTM dataLayer
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: name, ...params });

      // 2. GA4 gtag
      if (typeof window.gtag === 'function') {
        window.gtag('event', name, params);
      }
    }
  } catch {
    /* ignore */
  }
}

/* ---------------- Ready-made helpers ---------------- */

// Har page change par (AnalyticsLoader khud call karta hai)
export const trackPageView = (path, title = '') =>
  trackEvent('page_view', { page_path: path, page_title: title, label: path });

// WhatsApp / Phone clicks (AnalyticsLoader global click se pakadta hai)
export const trackWhatsAppClick = (label = '') => trackEvent('whatsapp_click', { label });
export const trackPhoneClick = (label = '') => trackEvent('phone_click', { label });

// Form/Lead tracking - formType: 'contact' | 'service' | 'course' | 'workshop'
export const trackLead = (formType, label = '', extra = {}) =>
  trackEvent('generate_lead', { form_type: formType, label, ...extra });

// Checkout steps (GA4 standard ecommerce events)
export const trackBeginCheckout = (itemTitle, value, leadType = 'course') =>
  trackEvent('begin_checkout', {
    currency: 'INR',
    value: Number(value) || 0,
    label: itemTitle,
    lead_type: leadType,
  });

// Payment success par
export const trackPurchase = (itemTitle, value, leadType = 'course') =>
  trackEvent('purchase', {
    currency: 'INR',
    value: Number(value) || 0,
    label: itemTitle,
    lead_type: leadType,
  });

// Free course/workshop enrollment
export const trackEnrollmentSuccess = (itemTitle, leadType = 'course') =>
  trackEvent('enrollment_success', { label: itemTitle, lead_type: leadType });

// Blog events
export const trackBlogRead = (postTitle, category = '') =>
  trackEvent('blog_read', { label: postTitle, category });

export const trackCtaClick = (buttonText, destination = '') =>
  trackEvent('cta_click', { label: buttonText, destination });
