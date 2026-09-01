import { useEffect, useRef } from 'react';
import { ADSENSE_CLIENT, isAdsConfigured } from '@/constants/adsConfig';
import { hasAdvertisingConsent, subscribeConsent } from '@/utils/cookieConsent';

// AdSense script poore site par sirf EK baar load hota hai,
// aur wo bhi tab jab pehla ad render ho (sirf blog pages par).
let adsScriptLoaded = false;

function loadAdsScript() {
  if (adsScriptLoaded) return;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
  adsScriptLoaded = true;
}

/**
 * Google AdSense banner - SIRF blog section ke liye.
 *
 * - adsConfig.js mein ID khali ho to kuch render nahi hota (no error)
 * - Script sirf tab download hoti hai jab blog page khula ho
 */
export default function GoogleAd({ slot, format = 'auto', className = '' }) {
  const adRef = useRef(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    // Cookie consent: advertising allow na ho to koi ad script / ad push nahi
    if (!isAdsConfigured() || !slot || !adRef.current || pushedRef.current) return;
    if (!hasAdvertisingConsent()) return;

    loadAdsScript();
    try {
      // AdSense ko batao ki ye naya ad render ho gaya hai
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushedRef.current = true;
    } catch (err) {
      // Ad blocker ho ya script load na hui - silently skip
      console.warn('Ad load skipped:', err?.message);
    }
  }, [slot]);

  // Banner/modal se "Allow Advertising" hote hi current ads render ho jayein
  useEffect(() => {
    const unsub = subscribeConsent((consent) => {
      if (!consent?.advertising || !adRef.current || pushedRef.current) return;
      loadAdsScript();
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushedRef.current = true;
      } catch {
        /* ignore */
      }
    });
    return unsub;
  }, []);

  // Config nahi hui (ya advertising consent nahi) to bilkul kuch na dikhe
  if (!isAdsConfigured() || !slot || !hasAdvertisingConsent()) return null;

  return (
    <div className={`my-8 google-ad-wrap ${className}`}>
      <span className="block text-center text-[10px] font-bold uppercase tracking-widest text-muted mb-1">
        Advertisement
      </span>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
