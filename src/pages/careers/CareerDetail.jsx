import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Briefcase, GraduationCap, MapPin, CalendarDays, Wallet, Mail, Share2, Link2,
} from 'lucide-react';
import { FaWhatsapp, FaLinkedinIn, FaXTwitter } from 'react-icons/fa6';
import { useCareer } from '@/hooks/useCareers';
import { isLastDatePassed } from '@/data/careersRepo';
import { SITE } from '@/constants/siteData';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import MarkdownContent from '@/components/shared/MarkdownContent';

export default function CareerDetail() {
  const { slug } = useParams();
  const { career, loading } = useCareer(slug);
  const [copied, setCopied] = useState(false);

  if (loading) return <LoadingSpinner className="min-h-[60vh]" />;

  if (!career) {
    return (
      <div className="pt-40 pb-24 text-center px-4">
        <Briefcase size={42} className="text-muted mx-auto mb-4" />
        <h1 className="text-2xl text-secondary normal-case mb-3">Opening not found</h1>
        <p className="text-sm text-muted normal-case mb-6">
          This position may have been closed or the link is incorrect.
        </p>
        <Link to="/careers" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft size={15} /> All Openings
        </Link>
      </div>
    );
  }

  const closed = isLastDatePassed(career.lastDateApply);
  const isInternship = career.type === 'internship';

  // Share links (opening detail page ka URL)
  const shareUrl = `${SITE.domain}/careers/${career.slug}`;
  const shareText = `${isInternship ? 'Internship' : 'Job'} opening at NexRNN Technologies: ${career.title}`;
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  const applyTo = `${career.type === 'internship' ? '/internship' : '/job'}?opening=${career.slug}`;

  const lastDateDisplay = career.lastDateApply
    ? new Date(career.lastDateApply + 'T00:00:00').toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <>
      <Helmet>
        <title>{career.title} — Careers | {SITE.name}</title>
        <meta name="description" content={career.excerpt} />
        <link rel="canonical" href={`${SITE.domain}/careers/${career.slug}`} />
      </Helmet>

      {/* Hero */}
      <section className="bg-accent bg-grid-light pt-32 pb-12 border-b-2 border-secondary">
        <div className="container-section max-w-3xl mx-auto">
          <Link
            to="/careers"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline mb-5"
          >
            <ArrowLeft size={13} /> All Openings
          </Link>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 border ${
                isInternship
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              {isInternship ? <GraduationCap size={12} /> : <Briefcase size={12} />}
              {isInternship ? 'Internship' : 'Job'}
            </span>
            {career.careerCode && (
              <span className="text-[10px] font-mono font-bold text-muted border-2 border-secondary/15 px-2 py-1">
                {career.careerCode}
              </span>
            )}
            {closed && (
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 bg-red-50 text-primary border border-red-200">
                Applications Closed
              </span>
            )}
          </div>

          <h1 className="text-secondary text-3xl sm:text-4xl md:text-5xl leading-[1.08] mb-5 normal-case">
            {career.title}
          </h1>
          <p className="text-muted text-base leading-relaxed normal-case mb-6">{career.excerpt}</p>

          {/* Meta chips */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {career.domain && (
              <MetaChip icon={Briefcase} label="Domain" value={career.domain} />
            )}
            {isInternship && (
              <MetaChip
                icon={Wallet}
                label="Stipend"
                value={career.stipendType === 'paid' ? career.stipendText || 'Paid' : 'Unpaid'}
              />
            )}
            {career.startDate && (
              <MetaChip
                icon={CalendarDays}
                label="Start Date"
                value={new Date(career.startDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              />
            )}
            {career.endDate && (
              <MetaChip
                icon={CalendarDays}
                label="End Date"
                value={new Date(career.endDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              />
            )}
            <MetaChip icon={MapPin} label="Location" value={career.location || '—'} />
            <MetaChip
              icon={CalendarDays}
              label="Last Date to Apply"
              value={lastDateDisplay || 'Rolling basis'}
            />
            <MetaChip
              icon={Wallet}
              label="Application Fee"
              value={
                career.feeType === 'paid'
                  ? `\u20b9${career.feeAmount.toLocaleString('en-IN')} (Paid)`
                  : 'Free'
              }
            />
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 sm:py-16">
        <div className="container-section max-w-3xl mx-auto">
          <MarkdownContent content={career.content} className="space-y-3" />

          {/* Apply box */}
          <div className="card-base bg-white p-6 sm:p-8 mt-10">
            {closed ? (
              <>
                <h2 className="text-lg text-secondary normal-case mb-2">Applications Closed</h2>
                <p className="text-sm text-muted normal-case mb-4">
                  The last date to apply for this position has passed. Follow our careers page for
                  future openings, or reach out to us.
                </p>
                <Link to="/Contect-us" className="btn-secondary inline-flex items-center gap-2">
                  Contact Us
                </Link>
              </>
            ) : (
              <>
                <h2 className="text-lg text-secondary normal-case mb-2">How to Apply</h2>
                <p className="text-sm text-muted normal-case mb-1">
                  Application fee:{' '}
                  <b className={career.feeType === 'paid' ? 'text-orange-600' : 'text-green-700'}>
                    {career.feeType === 'paid'
                      ? `\u20b9${career.feeAmount.toLocaleString('en-IN')} (Paid)`
                      : 'Completely Free'}
                  </b>
                </p>
                <p className="text-sm text-muted normal-case mb-4">
                  Click the button to open the application form — fill in your details, attach your
                  resume (PDF/WORD) and submit. You&rsquo;ll get an Application ID instantly.
                </p>
                <Link to={applyTo} className="btn-primary inline-flex items-center gap-2">
                  <Mail size={15} /> Apply Now
                </Link>
                {career.feeType === 'paid' && (
                  <p className="text-[11px] text-muted normal-case mt-3">
                    The application fee is payable at the time of the next step — our team will
                    guide you after your application is reviewed.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Share this opening */}
      <section className="pb-14">
        <div className="container-section max-w-3xl mx-auto">
          <div className="border-t border-b border-secondary/15 py-5 flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <span className="flex items-center gap-2 text-sm font-bold text-secondary normal-case">
              <Share2 size={16} className="text-primary" /> Share:
            </span>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText + ' — ' + shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on WhatsApp"
              title="Share on WhatsApp"
              className="w-10 h-10 border-2 border-secondary/20 flex items-center justify-center text-secondary hover:border-primary hover:text-primary transition-colors"
            >
              <FaWhatsapp size={17} />
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on LinkedIn"
              title="Share on LinkedIn"
              className="w-10 h-10 border-2 border-secondary/20 flex items-center justify-center text-secondary hover:border-primary hover:text-primary transition-colors"
            >
              <FaLinkedinIn size={16} />
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on X"
              title="Share on X"
              className="w-10 h-10 border-2 border-secondary/20 flex items-center justify-center text-secondary hover:border-primary hover:text-primary transition-colors"
            >
              <FaXTwitter size={15} />
            </a>
            <button
              type="button"
              onClick={copyLink}
              aria-label="Copy link"
              title="Copy link"
              className="w-10 h-10 border-2 border-secondary/20 flex items-center justify-center text-[10px] font-bold text-secondary hover:border-primary hover:text-primary transition-colors"
            >
              {copied ? <Link2 size={15} className="text-green-600" /> : 'URL'}
            </button>
            {copied && <span className="text-xs font-bold text-green-600 normal-case">Link copied!</span>}
          </div>
        </div>
      </section>
    </>
  );
}

function MetaChip({ icon: Icon, label, value }) {
  return (
    <div className="card-base bg-white px-4 py-3 flex items-center gap-3">
      <Icon size={16} className="text-primary shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</p>
        <p className="text-sm font-bold text-secondary normal-case truncate">{value}</p>
      </div>
    </div>
  );
}
