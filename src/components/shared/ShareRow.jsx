/**
 * Course/Workshop/Blog detail pages ka share row.
 * - Share: mobile par native share sheet, warna link copy
 * - WhatsApp: pre-filled message
 * - Copy Link
 */
import { toast } from 'react-toastify';
import { Share2, Link2 } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';

const BTN =
  'inline-flex items-center gap-1.5 border-2 border-secondary/20 bg-white px-3 py-2 text-xs font-bold text-secondary hover:border-primary hover:text-primary transition-colors';

export default function ShareRow({ title, path }) {
  const url = typeof window !== 'undefined' ? `${window.location.origin}${path}` : path;
  const shareText = `${title} — NexRNN Technologies`;
  const encText = encodeURIComponent(shareText);
  const encUrl = encodeURIComponent(url);

  const nativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: shareText, text: shareText, url });
        return;
      } catch {
        return; // user ne share cancel kiya
      }
    }
    copyLink();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Could not copy link — copy it from the address bar.');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5 mb-7">
      <span className="text-[11px] font-bold uppercase tracking-widest text-muted inline-flex items-center gap-1.5">
        <Share2 size={13} /> Share:
      </span>
      <button type="button" onClick={nativeShare} className={BTN} aria-label="Share">
        <Share2 size={13} /> Share
      </button>
      <a
        href={`https://api.whatsapp.com/send?text=${encText}%20${encUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={BTN}
        aria-label="Share on WhatsApp"
      >
        <FaWhatsapp size={13} className="text-green-600" /> WhatsApp
      </a>
      <button type="button" onClick={copyLink} className={BTN} aria-label="Copy link">
        <Link2 size={13} /> Copy Link
      </button>
    </div>
  );
}
