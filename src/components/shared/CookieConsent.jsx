/**
 * ============================================================
 * COOKIE CONSENT (banner + preferences modal)
 * ============================================================
 *
 * - Pehli visit par banner (neeche fixed), choice ke baad kabhi nahi
 * - "Manage Cookies" -> category toggles wala modal (ESC se band)
 * - "Cookie Settings" (footer link) -> OPEN_SETTINGS_EVENT se modal wapas khulta hai
 * - Consent save hote hi Google Consent Mode update + Clarity load hota hai
 *   (saara logic src/utils/cookieConsent.js me hai)
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, ShieldCheck } from 'lucide-react';
import {
  readConsent, saveConsent, defaultConsent,
  setDefaultGoogleConsent, applyGoogleConsent, loadClarity, OPEN_SETTINGS_EVENT,
} from '@/utils/cookieConsent';

const CATEGORIES = [
  {
    key: 'analytics',
    name: 'Analytics',
    desc: 'Google Analytics 4 — helps us understand website usage (pages, visits, clicks).',
  },
  {
    key: 'experience',
    name: 'Experience',
    desc: 'Microsoft Clarity — heatmaps aur session/behavior analytics.',
  },
  {
    key: 'advertising',
    name: 'Advertising',
    desc: 'Google AdSense — ads aur advertising measurement technologies.',
  },
  {
    key: 'preferences',
    name: 'Preferences',
    desc: 'Language aur baaki non-essential website preferences.',
  },
];

export default function CookieConsent() {
  const [bannerOpen, setBannerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState(null); // modal toggles ka state
  const panelRef = useRef(null);

  // Consent default DENIED set karo (Google tags se pehle) + banner dikhao agar choice nahi hui
  useEffect(() => {
    setDefaultGoogleConsent();
    const saved = readConsent();
    if (saved) {
      // page reload par bhi Google ko wahi state do (fallback - saveConsent already karta hai)
      applyGoogleConsent(saved);
      if (saved.experience) loadClarity();
    } else {
      const t = setTimeout(() => setBannerOpen(true), 700);
      return () => clearTimeout(t);
    }
  }, []);

  // Footer "Cookie Settings" -> modal kholo (bina banner dikhaye)
  useEffect(() => {
    const open = () => {
      setDraft({ ...defaultConsent(), ...readConsent() });
      setModalOpen(true);
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, open);
  }, []);

  // ESC se modal band + focus panel par
  useEffect(() => {
    if (!modalOpen) return;
    panelRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [modalOpen]);

  const openManage = () => {
    setDraft({ ...defaultConsent(), ...readConsent() });
    setBannerOpen(false);
    setModalOpen(true);
  };

  const acceptAll = () => {
    saveConsent({ analytics: true, experience: true, advertising: true, preferences: true });
    setBannerOpen(false);
    setModalOpen(false);
  };

  const rejectNonEssential = () => {
    saveConsent({ analytics: false, experience: false, advertising: false, preferences: false });
    setBannerOpen(false);
    setModalOpen(false);
  };

  const savePreferences = () => {
    saveConsent({
      analytics: !!draft?.analytics,
      experience: !!draft?.experience,
      advertising: !!draft?.advertising,
      preferences: !!draft?.preferences,
    });
    setModalOpen(false);
  };

  const toggle = (key) => setDraft((d) => ({ ...d, [key]: !d?.[key] }));

  return (
    <>
      {/* ---------- BANNER (choice nahi hui to) ---------- */}
      {bannerOpen && !modalOpen && (
        <div
          role="dialog"
          aria-label="Cookie Consent"
          className="fixed bottom-3 left-3 right-3 sm:left-auto sm:bottom-6 sm:right-6 sm:max-w-md z-[150] bg-white border-2 border-secondary shadow-[0_10px_0_0_rgba(11,18,32,0.08)]"
        >
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="w-8 h-8 bg-primary flex items-center justify-center text-white shrink-0">
                <Cookie size={16} />
              </span>
              <h2 className="font-heading text-lg text-secondary">Cookie Consent</h2>
            </div>
            <p className="text-xs text-muted leading-relaxed normal-case mb-3">
              We use essential cookies to keep our website working properly. With your permission, we
              may also use analytics and advertising technologies to understand website usage, improve
              our services, and measure advertising performance. Read our{' '}
              <Link to="/privacy-policy" className="text-primary font-bold hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
            <div className="flex flex-col gap-2">
              <button type="button" onClick={acceptAll} className="btn-primary w-full justify-center">
                Accept All
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={openManage}
                  className="border-2 border-secondary/25 px-3 py-2.5 text-xs font-bold text-secondary hover:border-primary hover:text-primary transition-colors"
                >
                  Manage Cookies
                </button>
                <button
                  type="button"
                  onClick={rejectNonEssential}
                  className="border-2 border-secondary/25 px-3 py-2.5 text-xs font-bold text-secondary hover:border-primary hover:text-primary transition-colors"
                >
                  Reject Non-Essential
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- MANAGE COOKIES MODAL ---------- */}
      {modalOpen && draft && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-secondary/70 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Manage cookie preferences"
            className="w-full max-w-lg bg-white border-2 border-secondary max-h-[85vh] overflow-y-auto outline-none"
          >
            <div className="p-5 sm:p-7">
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="w-8 h-8 bg-primary flex items-center justify-center text-white shrink-0">
                  <ShieldCheck size={16} />
                </span>
                <h2 className="font-heading text-xl text-secondary">Manage Cookies</h2>
              </div>
              <p className="text-xs text-muted normal-case mb-5">
                Choose which cookie categories you allow. Essential cookies are always active — the
                website cannot work without them.
              </p>

              <div className="space-y-3 mb-6">
                {/* Necessary - hamesha ON, locked */}
                <div className="border-2 border-secondary/15 bg-accent px-4 py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-secondary">Necessary</p>
                    <p className="text-[11px] text-muted normal-case">
                      Security, sessions and your cookie-consent preference.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted whitespace-nowrap">
                    Always Active
                  </span>
                </div>

                {/* Baaki categories - toggles */}
                {CATEGORIES.map((cat) => (
                  <div key={cat.key} className="border-2 border-secondary/15 px-4 py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-secondary">{cat.name}</p>
                      <p className="text-[11px] text-muted normal-case">{cat.desc}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!!draft[cat.key]}
                      aria-label={`${cat.name} cookies`}
                      onClick={() => toggle(cat.key)}
                      className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${draft[cat.key] ? 'bg-primary' : 'bg-secondary/25'}`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${draft[cat.key] ? 'translate-x-5' : ''}`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <button type="button" onClick={savePreferences} className="btn-primary w-full justify-center">
                  Save Preferences
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={acceptAll}
                    className="border-2 border-secondary/25 px-3 py-2.5 text-xs font-bold text-secondary hover:border-primary hover:text-primary transition-colors"
                  >
                    Accept All
                  </button>
                  <button
                    type="button"
                    onClick={rejectNonEssential}
                    className="border-2 border-secondary/25 px-3 py-2.5 text-xs font-bold text-secondary hover:border-primary hover:text-primary transition-colors"
                  >
                    Reject Non-Essential
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
