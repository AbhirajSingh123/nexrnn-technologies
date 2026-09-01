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
  GSC_VERIFICATION,
} from '@/constants/analyticsConfig';
import { setDefaultGoogleConsent, loadClarity } from '@/utils/cookieConsent';
import { trackPageView, trackWhatsAppClick, trackPhoneClick, trackCtaClick } from '@/utils/analytics';

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
    // Google Consent Mode: non-essential storage DEFAULT DENIED
    // (GA4/GTM/gtag inject hone se pehle set hona zaroori hai)
    setDefaultGoogleConsent();
    injectSearchConsoleMeta();
    // GA4 aur GTM dono ek saath mat chalao (double counting) -
    // analyticsConfig.js mein note padho.
    // GTM/gtag script load hoti rahti hai lekin tags consent signals
    // (analytics_storage / ad_storage) follow karte hain - consent
    // deny ho to cookies/tracking nahi hoti (Google Consent Mode v2).
    injectGA4();
    injectGTM();
    // Microsoft Clarity: script sirf experience consent milne par load hogi
    loadClarity();
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
      // Site-wide CTA click capture (btn-primary / btn-secondary / Get Started type buttons)
      const cta = link.closest('.btn-primary, .btn-secondary, [data-cta]');
      if (cta) {
        const ctaLabel = (cta.textContent || '').trim().slice(0, 60);
        trackCtaClick(ctaLabel || text || href, href);
      }
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, []);

  return null;
}
