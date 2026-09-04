import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { GraduationCap, PartyPopper, MessageCircle } from 'lucide-react';
import useSalesData, { inr } from '@/hooks/useSalesData';
import { useSalesAuth } from '@/contexts/SalesAuthContext';
import { SITE } from '@/constants/siteData';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import AdminFilterBar from '@/components/admin/AdminFilterBar';
import AdminTable from '@/components/admin/AdminTable';
import AdminLoadMore from '@/components/admin/AdminLoadMore';
import { useLoadMore } from '@/hooks/useLoadMore';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/**
 * My Enrollments: inke referral code se hui course/workshop/service enrollments
 * (lead-level data) — taaki member aage ke courses ka offer WhatsApp par bhej sake.
 */
export default function SalesEnrollments() {
  const { member } = useSalesAuth();
  const { data, error, loading } = useSalesData('referrals');
  const dashQ = useSalesData('dashboard');
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState('all');

  const code = data?.referralCode || member?.referralCode || '';
  const rows = useMemo(() => (data?.leads ?? []).filter((l) => l.kind === 'Course' || l.kind === 'Workshop'), [data]);

  const filtered = useMemo(() => rows.filter((r) => {
    if (kindFilter !== 'all' && r.kind !== kindFilter) return false;
    const q = search.trim().toLowerCase();
    if (q && ![r.name, r.title, r.referenceId, r.phone].join(' ').toLowerCase().includes(q)) return false;
    return true;
  }), [rows, search, kindFilter]);

  const { visibleItems, hasMore, loadMore, total, shown } = useLoadMore(filtered, `${search}|${kindFilter}`);

  const whatsappText = (r) =>
    `Hello ${r.name}! This is ${member?.name || 'NexRNN Sales'} from NexRNN Technologies. Thank you for enrolling in "${r.title || 'our program'}". Here is my referral code ${code} — use it for your next course or workshop with us and get special benefits. Visit: ${SITE.domain}/?ref=${code}`;

  const columns = [
    { key: 'createdAt', label: 'Enrolled On', render: (r) => fmtDate(r.createdAt) },
    {
      key: 'name',
      label: 'Student',
      render: (r) => (
        <div>
          <span className="font-semibold text-secondary block">{r.name}</span>
          <span className="text-[11px] font-mono text-muted">{r.phone || ''}</span>
        </div>
      ),
    },
    { key: 'title', label: 'Program' },
    { key: 'kind', label: 'Type' },
    { key: 'price', label: 'Price', render: (r) => (r.price > 0 ? inr(r.price) : '—') },
    {
      key: 'estCommission',
      label: 'Est. Commission',
      render: (r) => {
        const pct = r.kind === 'Workshop' ? dashQ.data?.commissionWorkshop : dashQ.data?.commissionCourse;
        if (!r.price || !pct) return '—';
        return <span className="font-bold text-green-700">{inr(Math.round((r.price * pct) / 100))}</span>;
      },
    },
    { key: 'referenceId', label: 'Reference ID', render: (r) => <span className="font-mono text-xs">{r.referenceId || '—'}</span> },
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      render: (r) =>
        r.phone ? (
          <a
            href={`https://wa.me/91${String(r.phone).replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(whatsappText(r))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 border-2 border-green-300 bg-green-50 px-2.5 py-1.5 text-[11px] font-bold text-green-700 hover:border-green-400 transition-colors"
          >
            <MessageCircle size={12} /> Offer
          </a>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <div>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      <h1 className="font-heading text-3xl text-secondary mb-1">My Enrollments</h1>
      <p className="text-sm text-muted normal-case mb-6">
        Students who enrolled in a course or workshop using YOUR referral code. Send them your code
        with a greeting on WhatsApp — perfect for offering their next program.
      </p>

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search student, program, reference…"
        extra={
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-muted mb-1">Type</label>
            <select
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value)}
              className="border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white"
            >
              <option value="all">All</option>
              <option value="Course">Courses</option>
              <option value="Workshop">Workshops</option>
            </select>
          </div>
        }
      />

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-primary normal-case">{error}</p>
      ) : rows.length === 0 ? (
        <div className="card-base bg-white p-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <GraduationCap size={20} className="text-muted" />
            <PartyPopper size={20} className="text-muted" />
          </div>
          <p className="text-sm text-muted normal-case">
            No enrollments through your referral code yet — share your links from Refer &amp; Earn and the Services page.
          </p>
        </div>
      ) : (
        <>
          <AdminTable columns={columns} rows={visibleItems} />
          <AdminLoadMore shown={shown} total={total} hasMore={hasMore} onLoadMore={loadMore} />
        </>
      )}
    </div>
  );
}
