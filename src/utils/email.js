/**
 * Email links — sab devices par reliable.
 *
 * Problem: desktop/laptop par aksar koi default mail client configured nahi hota (Outlook/Mail
 * app setup hi nahi), to mailto: link click karne par Chrome me khaali "Untitled" tab khulta
 * hai aur kuch nahi hota.
 *
 * Solution:
 *  - Mobile (Android/iPhone): wahi mailto: — Gmail/native Mail app handle kar leta hai
 *  - Desktop: Gmail web compose (mail.google.com) naye tab me — draft pre-filled, Gmail login
 *    ho to seedha compose khulta hai. (NexRNN team Gmail hi use karti hai.)
 */

export function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile|Silk/i.test(navigator.userAgent);
}

/**
 * Kisi bhi mailto: URL ko device ke hisaab se chalne wala URL bana deta hai.
 * mailto:TO?subject=S&body=B → mobile par waisa hi, desktop par Gmail compose URL.
 * Non-mailto URLs (tel:, https:) untouched wapas.
 */
export function toEmailHref(mailtoUrl) {
  if (!mailtoUrl || typeof mailtoUrl !== 'string' || !mailtoUrl.toLowerCase().startsWith('mailto:')) {
    return mailtoUrl;
  }
  if (isMobileDevice()) return mailtoUrl;

  const qIndex = mailtoUrl.indexOf('?');
  const rawTo = qIndex === -1 ? mailtoUrl.slice(7) : mailtoUrl.slice(7, qIndex);
  let to = rawTo;
  try {
    to = decodeURIComponent(rawTo);
  } catch {
    /* malformed encoding — raw hi rehne do */
  }
  const params = new URLSearchParams(qIndex === -1 ? '' : mailtoUrl.slice(qIndex + 1));
  const subject = params.get('subject') || '';
  const body = params.get('body') || '';
  const cc = params.get('cc') || '';
  const qs = [
    `to=${encodeURIComponent(to)}`,
    cc ? `cc=${encodeURIComponent(cc)}` : '',
    subject ? `su=${encodeURIComponent(subject)}` : '',
    body ? `body=${encodeURIComponent(body)}` : '',
  ]
    .filter(Boolean)
    .join('&');
  return `https://mail.google.com/mail/?view=cm&fs=1&tf=1&${qs}`;
}
