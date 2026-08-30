/**
 * ============================================================
 * ANALYTICS LOADER - poore site ki tracking ka control room
 * ============================================================
 *
 * Ye component App mein ek baar mount hota hai aur:
 *   1. GA4 / GTM / Microsoft Clarity scripts load karta hai
 *      (sirf tab jab analyticsConfig.js mein ID di gayi ho)
 *   2. SPA page views track karta hai (route change par)
 *   3. PURE site ke saare WhatsApp (wa.me) aur Phone (tel:)
 *      clicks apne aap pakadta hai - kisi component ko edit
 *      karne ki zaroorat nahi
 *   4. Search Console verification meta tag inject karta hai
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  GA4_ID,
  GTM_ID,
  CLARITY_ID,
  GSC_VERIFICATION,
} from '@/constants/analyticsConfig';
import { trackPageView, trackWhatsAppClick, trackPhoneClick } from '@/utils/analytics';

function injectGA4() {
  if (!GA4_ID || document.getElementById('ga4-script')) return;
  const s = document.createElement('script');
  s.id = 'ga4-script';
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  // SPA hai isliye auto page_view band - hum khud route change par bhejte hain
  window.gtag('config', GA4_ID, { send_page_view: false });
}

function injectGTM() {
  if (!GTM_ID || document.getElementById('gtm-script')) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  const s = document.createElement('script');
  s.id = 'gtm-script';
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  document.head.appendChild(s);
}

function injectClarity() {
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

function injectSearchConsoleMeta() {
  if (!GSC_VERIFICATION || document.querySelector('meta[name="google-site-verification"]')) return;
  const meta = document.createElement('meta');
  meta.name = 'google-site-verification';
  meta.content = GSC_VERIFICATION;
  document.head.appendChild(meta);
}

export default function AnalyticsLoader() {
  const location = useLocation();

  // 1. Scripts (sirf ek baar)
  useEffect(() => {
    injectSearchConsoleMeta();
    // GA4 aur GTM dono ek saath mat chalao (double counting) -
    // analyticsConfig.js mein note padho.
    injectGA4();
    injectGTM();
    injectClarity();
  }, []);

  // 2. SPA page views: har route change par
  useEffect(() => {
    trackPageView(location.pathname + location.search, document.title);
  }, [location.pathname, location.search]);

  // 3. Global WhatsApp / Phone / CTA click capture
  useEffect(() => {
    const handler = (e) => {
      const link = e.target?.closest?.('a[href]');
      if (!link) return;
      const href = link.getAttribute('href') || '';
      const text = (link.textContent || '').trim().slice(0, 80);
      if (href.startsWith('https://wa.me') || href.startsWith('https://api.whatsapp.com')) {
        trackWhatsAppClick(text || href);
      } else if (href.startsWith('tel:')) {
        trackPhoneClick(text || href);
      }
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, []);

  return null;
}
