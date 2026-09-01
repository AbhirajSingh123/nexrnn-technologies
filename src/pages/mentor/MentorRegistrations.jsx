/**
 * Mentor course/workshop registrations (VIEW ONLY).
 * Sirf assigned programs ke students - mentor-data fn token se scope karta hai.
 */
import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import useMentorData, { inr } from '@/hooks/useMentorData';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import AdminFilterBar from '@/components/admin/AdminFilterBar';
import AdminTable from '@/components/admin/AdminTable';
import AdminLoadMore from '@/components/admin/AdminLoadMore';
import { useLoadMore } from '@/hooks/useLoadMore';

const PAY_STYLES = {
  paid: 'bg-green-50 text-green-700 border-green-300',
  pending: 'bg-blue-50 text-blue-700 border-blue-300',
  failed: 'bg-red-50 text-red-600 border-red-300',
  expired: 'bg-red-50 text-red-600 border-red-300',
};

export default function MentorRegistrations({ kind = 'course' }) {
  const isWorkshop = kind === 'workshop';
  const title = isWorkshop ? 'Workshop Registrations' : 'Course Registrations';
  const { data, error, loading } = useMentorData('registrations', { kind });

  const [search, setSearch] = useState('');
  const [payFilter, setPayFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const rows = useMemo(() => data?.rows ?? [], [data]);

  const filtered = useMemo(() => rows.filter((r) => {
    if (payFilter !== 'all' && r.paymentStatus !== payFilter) return false;
    if (dateFrom && new Date(r.registrationDate) < new Date(dateFrom)) return false;
    if (dateTo && new Date(r.registrationDate) > new Date(`${dateTo}T23:59:59`)) return false;
    const q = search.trim().toLowerCase();
    // Student ka email/mobile mentor ko show NAHI hota (privacy) - search me bhi nahi
    if (q && ![r.name, r.itemTitle, r.referenceId, r.batchId].join(' ').toLowerCase().includes(q)) return false;
    return true;
  }), [rows, search, payFilter, dateFrom, dateTo]);

  const { visibleItems, hasMore, loadMore, total, shown } = useLoadMore(filtered, `${search}|${payFilter}|${dateFrom}|${dateTo}`);

  const columns = [
    { key: 'name', label: 'Student', render: (r) => <span className="font-semibold text-secondary">{r.name}</span> },
    { key: 'itemTitle', label: isWorkshop ? 'Workshop' : 'Course' },
    { key: 'batchId', label: 'Batch ID', render: (r) => r.batchId || '—' },
    { key: 'referenceId', label: 'Reference ID', render: (r) => <span className="font-mono text-xs">{r.referenceId || '—'}</span> },
    { key: 'registrationDate', label: 'Registered On', render: (r) => new Date(r.registrationDate).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
    { key: 'amount', label: 'Amount', render: (r) => inr(r.amount) },
    { key: 'commissionAmount', label: 'Commission', render: (r) => <span className="font-bold text-primary">{inr(r.commissionAmount)}</span> },
    {
      key: 'paymentStatus',
      label: 'Payment',
      render: (r) => (
        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 border-2 whitespace-nowrap ${PAY_STYLES[r.paymentStatus] ?? PAY_STYLES.pending}`}>
          {r.paymentStatus}
        </span>
      ),
    },
  ];

  return (
    <div>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      <h1 className="font-heading text-3xl text-secondary mb-1">{title}</h1>
      <p className="text-sm text-muted normal-case mb-6">View-only — students enrolled in programs assigned to you. Student contact details stay private.</p>

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search student, reference, batch…"
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        extra={
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-muted mb-1">Payment</label>
            <select
              value={payFilter}
              onChange={(e) => setPayFilter(e.target.value)}
              className="border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white"
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        }
      />

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-primary normal-case">{error}</p>
      ) : (
        <>
          <AdminTable columns={columns} rows={visibleItems} />
          <AdminLoadMore shown={shown} total={total} hasMore={hasMore} onLoadMore={loadMore} />
        </>
      )}
    </div>
  );
}
