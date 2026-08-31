/**
 * ================================
 * GOOGLE ADSENSE CONFIG (Blog only)
 * ================================
 *
 * Ads sirf BLOG section mein dikhenge. Setup steps:
 *
 * 1. https://adsense.google.com par jao -> Sign up
 * 2. Apni website add karo (https://tadomain wala URL)
 *    -> Google review karega (kuch din lag sakte hain)
 * 3. Approval milne ke baad: Ads -> By ad unit -> Display ads
 *    -> 3 ad units banao aur unke SLOT IDs neeche paste karo
 * 4. Account -> Settings -> Account information se apna
 *    PUBLISHER ID copy karke neeche paste karo (ca-pub-...)
 * 5. public/ads.txt file mein bhi apna pub- ID daalo
 *
 * NOTE: Jab tak IDs khali hain, site par ads NAHI dikhenge
 *       aur koi error bhi nahi aayega. Site pehle jaisi chalegi.
 */

// Step 4: Apna Publisher ID yahan paste karo
// Example: 'ca-pub-1234567890123456'
export const ADSENSE_CLIENT = 'ca-pub-6802186598254911';


// Step 3: Ad unit ke Slot IDs yahan paste karo
// Example: '1234567890'
export const BLOG_AD_SLOTS = {
  blogListInFeed: '', // Blog listing page - articles ke beech mein
  blogDetailTop: '', // Article page - cover image ke baad
  blogDetailBottom: '', // Article page - content ke end mein
};

// Helper: kya ads config ho chuki hai?
export const isAdsConfigured = () => Boolean(ADSENSE_CLIENT);
