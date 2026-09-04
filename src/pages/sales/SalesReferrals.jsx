import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { Gift, Copy, Check, Share2, Users, TrendingUp, IndianRupee } from 'lucide-react';
import useSalesData, { inr } from '@/hooks/useSalesData';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import AdminTable from '@/components/admin/AdminTable';
import AdminLoadMore from '@/components/admin/AdminLoadMore';
import { useLoadMore } from '@/hooks/useLoadMore';
import { SITE } from '@/constants/siteData';

const PAY_STYLES = {
  paid: 'bg-green-50 text-green-700 border-green-300',
  Earned: 'bg-green-50 text-green-700 border-green-300',
};

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function SalesReferrals() {
  const { data, error, loading } = useSalesData('referrals');
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState('records'); // records | leads

  const records = useMemo(() => data?.records ?? [], [data]);
  const leads = useMemo(() => data?.leads ?? [], [data]);
  const code = data?.referralCode || '';

  const { visibleItems, hasMore, loadMore, total, shown } = useLoadMore(tab === 'records' ? records : leads, `${tab}`);

  const totalEarned = records.reduce((s, r) => s + (Number(r.commissionAmount) || 0), 0);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Referral code copied.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy. Please note it down manually.');
    }
  };

  const shareText = `Get started with NexRNN Technologies! Use my referral code ${code} while enrolling in any course, workshop or service — ${SITE.domain}`;

  const shareCode = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'NexRNN Referral', text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success('Referral message copied — share it on WhatsApp!');
      }
    } catch {
      /* user cancelled share - theek hai */
    }
  };

  const recordColumns = [
    { key: 'date', label: 'Date', render: (r) => fmtDate(r.date) },
    { key: 'personName', label: 'Referred Person', render: (r) => <span className="font-semibold text-secondary">{r.personName || '—'}</span> },
    { key: 'itemTitle', label: 'Payment For', render: (r) => r.itemTitle || '—' },
    { key: 'kind', label: 'Type' },
    { key: 'grossAmount', label: 'Amount', render: (r) => inr(r.grossAmount) },
    { key: 'commissionPercent', label: 'Rate', render: (r) => `${r.commissionPercent}%` },
    { key: 'commissionAmount', label: 'Commission', render: (r) => <span className="font-bold text-primary">{inr(r.commissionAmount)}</span> },
    { key: 'commissionStatus', label: 'Status', render: (r) => <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 border-2 ${PAY_STYLES[r.commissionStatus] ?? PAY_STYLES.paid}`}>{r.commissionStatus}</span> },
  ];

  const leadColumns = [
    { key: 'createdAt', label: 'Date', render: (r) => fmtDate(r.createdAt) },
    { key: 'name', label: 'Referred Person', render: (r) => <span className="font-semibold text-secondary">{r.name}</span> },
    { key: 'title', label: 'Interest', render: (r) => r.title || '—' },
    { key: 'kind', label: 'Type' },
    { key: 'price', label: 'Value', render: (r) => (r.price > 0 ? inr(r.price) : '—') },
    { key: 'referenceId', label: 'Reference ID', render: (r) => <span className="font-mono text-xs">{r.referenceId || '—'}</span> },
  ];

  return (
    <div>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      <h1 className="font-heading text-3xl text-secondary mb-1">Refer &amp; Earn</h1>
      <p className="text-sm text-muted normal-case mb-6">
        Share your code — when someone enters it while enrolling in any course, workshop, service or career
        application, the referral is yours and your commission is credited to your wallet on payment.
      </p>

      {loading || !data ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-primary normal-case">{error}</p>
      ) : (
        <>
          {/* Referral code card */}
          <div className="card-base bg-secondary text-white p-6 sm:p-8 mb-8 text-center relative overflow-hidden">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-3">Your Refer &amp; Earn Code</p>
            <p className="font-heading text-4xl sm:text-5xl tracking-[0.3em] text-primary font-mono">{code}</p>
            <p className="text-[11px] text-white/50 normal-case mt-3">
              Unique to you and permanent — this code never changes.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
              <button
                onClick={copyCode}
                className="inline-flex items-center gap-2 bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy Code'}
              </button>
              <button
                onClick={shareCode}
                className="inline-flex items-center gap-2 border-2 border-white/30 px-4 py-2 text-xs font-bold text-white hover:border-primary hover:text-primary transition-colors"
              >
                <Share2 size={14} /> Share
              </button>
            </div>
          </div>

          {/* Earnings summary */}
          <div className="grid grid-cols-3 gap-4 sm:gap-5 mb-8">
            <div className="card-base bg-white p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-9 h-9 bg-primary/10 flex items-center justify-center shrink-0"><Users size={17} className="text-primary" /></span>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Referrals</p>
              </div>
              <p className="font-heading text-2xl sm:text-3xl text-secondary leading-none">{leads.length}</p>
            </div>
            <div className="card-base bg-white p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-9 h-9 bg-primary/10 flex items-center justify-center shrink-0"><TrendingUp size={17} className="text-primary" /></span>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Conversions</p>
              </div>
              <p className="font-heading text-2xl sm:text-3xl text-secondary leading-none">{records.length}</p>
            </div>
            <div className="card-base bg-white p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-9 h-9 bg-primary/10 flex items-center justify-center shrink-0"><IndianRupee size={17} className="text-primary" /></span>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Earned</p>
              </div>
              <p className="font-heading text-2xl sm:text-3xl text-secondary leading-none">{inr(totalEarned)}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setTab('records')}
              className={`px-4 py-2 text-xs font-bold border-2 transition-colors ${tab === 'records' ? 'border-primary text-primary bg-primary/5' : 'border-secondary/20 text-muted hover:border-secondary/40'}`}
            >
              Earned Commission ({records.length})
            </button>
            <button
              onClick={() => setTab('leads')}
              className={`px-4 py-2 text-xs font-bold border-2 transition-colors ${tab === 'leads' ? 'border-primary text-primary bg-primary/5' : 'border-secondary/20 text-muted hover:border-secondary/40'}`}
            >
              Referred Leads ({leads.length})
            </button>
          </div>

          {tab === 'records' ? (
            records.length === 0 ? (
              <div className="card-base bg-white p-8 text-center">
                <Gift size={26} className="text-muted mx-auto mb-3" />
                <p className="text-sm text-muted normal-case">
                  No conversions yet — when a referred person completes their payment, your commission appears here.
                </p>
              </div>
            ) : (
              <>
                <AdminTable columns={recordColumns} rows={visibleItems} />
                <AdminLoadMore shown={shown} total={total} hasMore={hasMore} onLoadMore={loadMore} />
              </>
            )
          ) : leads.length === 0 ? (
            <div className="card-base bg-white p-8 text-center">
              <Gift size={26} className="text-muted mx-auto mb-3" />
              <p className="text-sm text-muted normal-case">
                No referrals yet — share your code and your referred enrollments will appear here.
              </p>
            </div>
          ) : (
            <>
              <AdminTable columns={leadColumns} rows={visibleItems} />
              <AdminLoadMore shown={shown} total={total} hasMore={hasMore} onLoadMore={loadMore} />
            </>
          )}
        </>
      )}
    </div>
  );
}
