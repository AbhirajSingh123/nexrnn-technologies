import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { Briefcase, GraduationCap, PartyPopper, Percent, X, Copy, Share2, ExternalLink, MessageCircle } from 'lucide-react';
import useSalesData from '@/hooks/useSalesData';
import { formatINR } from '@/utils/format';
import { useSalesAuth } from '@/contexts/SalesAuthContext';
import { SITE } from '@/constants/siteData';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

/**
 * Shareable catalog: har item clickable - click par referral link ban kar
 * modal me dikhta hai (Copy / WhatsApp / Open). Link kholne par user ke
 * forms me member ka referral code auto-fill hota hai.
 */
export default function SalesServices() {
  const { data, error, loading } = useSalesData('services');
  const { member } = useSalesAuth();
  const [tab, setTab] = useState('services'); // services | courses | workshops
  const [share, setShare] = useState(null); // { title, path }

  const code = member?.referralCode || data?.referralCode || '';

  const items = useMemo(() => {
    if (!data) return [];
    if (tab === 'services') return data.rows ?? [];
    if (tab === 'courses') return data.courses ?? [];
    return data.workshops ?? [];
  }, [data, tab]);

  const linkFor = (item) => {
    const base = tab === 'services' ? '/services/' : tab === 'courses' ? '/course/' : '/workshop/';
    return `${SITE.domain}${base}${item.slug}?ref=${code}`;
  };

  const openShare = (item) => {
    if (!code) {
      toast.error('Referral code not found in your profile.');
      return;
    }
    setShare({ title: item.title, path: linkFor(item) });
  };

  const shareText = share ? `Explore "${share.title}" by NexRNN Technologies: ${share.path}` : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(share.path);
      toast.success('Referral link copied.');
    } catch {
      toast.error('Could not copy. Please copy it manually.');
    }
  };

  const whatsappShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: share.title, text: shareText, url: share.path });
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener');
      }
    } catch {
      /* user cancelled - theek hai */
    }
  };

  const TABS = [
    { key: 'services', label: 'Services', icon: Briefcase },
    { key: 'courses', label: 'Courses', icon: GraduationCap },
    { key: 'workshops', label: 'Workshops', icon: PartyPopper },
  ];

  // Active tab ke hisaab se commission rate (green box)
  const commissionPct = data
    ? tab === 'services' ? data.commissionService : tab === 'courses' ? data.commissionCourse : data.commissionWorkshop
    : null;
  const commissionLabel = tab === 'services' ? 'Service' : tab === 'courses' ? 'Course' : 'Workshop';

  return (
    <div>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      <h1 className="font-heading text-3xl text-secondary mb-1">Services &amp; Programs</h1>
      <p className="text-sm text-muted normal-case mb-2">
        Click any item to get YOUR referral link — share it on WhatsApp. Whoever opens the link and
        submits any form or makes a purchase is counted as your referral automatically.
      </p>
      {commissionPct != null && (
        <div className="card-base bg-green-50 border-2 border-green-200 px-4 py-3 mb-6 inline-flex items-center gap-2 text-sm text-green-800 normal-case">
          <Percent size={15} /> Your {commissionLabel} Commission: <b>{commissionPct}%</b>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold border-2 transition-colors ${tab === key ? 'border-primary text-primary bg-primary/5' : 'border-secondary/20 text-muted hover:border-secondary/40'}`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {loading || !data ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-primary normal-case">{error}</p>
      ) : items.length === 0 ? (
        <div className="card-base bg-white p-8 text-center">
          <p className="text-sm text-muted normal-case">Nothing in the catalog yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => openShare(s)}
              className="card-base bg-white p-5 flex flex-col text-left border-2 border-transparent hover:border-primary transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="w-10 h-10 bg-primary/10 flex items-center justify-center shrink-0">
                  {tab === 'courses' ? <GraduationCap size={17} className="text-primary" /> : tab === 'workshops' ? <PartyPopper size={17} className="text-primary" /> : <Briefcase size={17} className="text-primary" />}
                </span>
                <p className="font-heading text-base text-secondary leading-tight">{s.title}</p>
              </div>
              {s.shortDescription && (
                <p className="text-xs text-muted normal-case mb-3 line-clamp-2">{s.shortDescription}</p>
              )}
              <div className="mt-auto flex items-center justify-between gap-2">
                {s.isFree ? (
                  <p className="font-heading text-lg text-green-600">FREE</p>
                ) : s.price ? (
                  <p className="font-heading text-lg text-primary">
                    {formatINR(s.price)}
                    {s.originalPrice ? (
                      <span className="ml-2 text-xs text-muted line-through normal-case">{formatINR(s.originalPrice)}</span>
                    ) : null}
                  </p>
                ) : (
                  <p className="text-xs font-bold text-secondary uppercase tracking-wide">Price on request</p>
                )}
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                  <Share2 size={12} /> Share
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ---------- Share link modal ---------- */}
      {share && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-secondary/70 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShare(null);
          }}
        >
          <div className="w-full max-w-lg bg-white border-2 border-secondary max-h-[88vh] overflow-y-auto">
            <div className="flex items-start justify-between px-5 sm:px-7 pt-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-0.5">Your Referral Link</p>
                <h2 className="font-heading text-xl text-secondary">{share.title}</h2>
              </div>
              <button onClick={() => setShare(null)} aria-label="Close" className="text-muted hover:text-secondary">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 sm:p-7 pt-4 space-y-4">
              <p className="text-xs text-muted normal-case">
                This link carries your referral code (<b className="font-mono">{code}</b>). Anyone who opens it and
                submits a form or buys anything is attributed to you automatically.
              </p>
              <div className="border-2 border-secondary/20 bg-accent px-3.5 py-3 break-all font-mono text-xs text-secondary">
                {share.path}
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button onClick={copyLink} className="btn-primary inline-flex items-center gap-2">
                  <Copy size={14} /> Copy Link
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border-2 border-green-300 bg-green-50 px-3.5 py-2 text-xs font-bold text-green-700 hover:border-green-400 transition-colors"
                >
                  <MessageCircle size={14} /> WhatsApp
                </a>
                <button onClick={whatsappShare} className="inline-flex items-center gap-2 border-2 border-secondary/20 bg-white px-3.5 py-2 text-xs font-bold text-secondary hover:border-primary hover:text-primary transition-colors">
                  <Share2 size={14} /> More Apps
                </button>
                <a
                  href={share.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border-2 border-secondary/20 bg-white px-3.5 py-2 text-xs font-bold text-secondary hover:border-primary hover:text-primary transition-colors"
                >
                  <ExternalLink size={14} /> Open
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
