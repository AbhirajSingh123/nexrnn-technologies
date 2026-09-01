import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { IndianRupee, Wallet, CalendarDays, Percent } from 'lucide-react';
import useMentorData, { inr } from '@/hooks/useMentorData';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import AdminTable from '@/components/admin/AdminTable';

/** 30 din ka commission graph - pure SVG, koi extra dependency nahi */
function EarningsChart({ byDay }) {
  const days = useMemo(() => {
    const out = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      out.push({ key, label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), value: byDay?.[key] || 0 });
    }
    return out;
  }, [byDay]);

  const max = Math.max(...days.map((d) => d.value), 1);

  return (
    <div className="card-base bg-white p-5 mb-6">
      <h2 className="text-sm font-bold text-secondary uppercase tracking-wide mb-4">Daily Commission (Last 30 Days)</h2>
      <div className="overflow-x-auto">
        <div className="flex items-end gap-1.5 min-w-[560px] h-40">
          {days.map((d) => (
            <div key={d.key} className="flex-1 flex flex-col items-center gap-1 group" title={`${d.label}: ${inr(d.value)}`}>
              {d.value > 0 && (
                <span className="text-[8px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">{inr(d.value)}</span>
              )}
              <div
                className={`w-full rounded-t ${d.value > 0 ? 'bg-primary' : 'bg-secondary/10'}`}
                style={{ height: `${Math.max((d.value / max) * 120, 4)}px` }}
              />
              <span className="text-[8px] text-muted whitespace-nowrap">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MentorCommission() {
  const { data, error, loading } = useMentorData('commissions');
  const [range, setRange] = useState('30');

  const records = useMemo(() => data?.records ?? [], [data]);
  const totalEarnings = useMemo(() => records.reduce((s, r) => s + (r.commissionAmount || 0), 0), [records]);
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const todayEarnings = useMemo(() => records.filter((r) => (r.date || '').slice(0, 10) === today).reduce((s, r) => s + (r.commissionAmount || 0), 0), [records, today]);
  const monthEarnings = useMemo(() => records.filter((r) => (r.date || '').slice(0, 7) === month).reduce((s, r) => s + (r.commissionAmount || 0), 0), [records, month]);
  const rangeFiltered = useMemo(() => {
    if (range === 'all') return records;
    const days = Number(range);
    const since = new Date();
    since.setDate(since.getDate() - days);
    return records.filter((r) => new Date(r.date || 0) >= since);
  }, [records, range]);

  const columns = [
    { key: 'date', label: 'Date', render: (r) => new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
    { key: 'referenceId', label: 'Reference ID', render: (r) => <span className="font-mono text-xs">{r.referenceId || '—'}</span> },
    { key: 'itemTitle', label: 'Program' },
    { key: 'kind', label: 'Type' },
    { key: 'grossAmount', label: 'Gross', render: (r) => inr(r.grossAmount) },
    { key: 'commissionPercent', label: 'Rate', render: (r) => `${r.commissionPercent}%` },
    { key: 'commissionAmount', label: 'Commission', render: (r) => <span className="font-bold text-primary">{inr(r.commissionAmount)}</span> },
    { key: 'commissionStatus', label: 'Status' },
  ];

  return (
    <div>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      <h1 className="font-heading text-3xl text-secondary mb-1">Commission</h1>
      <p className="text-sm text-muted normal-case mb-6">Your earnings from paid enrollments of assigned programs (read-only).</p>

      {loading || !data ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-primary normal-case">{error}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6">
            <StatCard icon={Percent} label="Course Commission" value={`${data.commissionCourse ?? data.commissionPercent ?? 0}%`} />
            <StatCard icon={Percent} label="Workshop Commission" value={`${data.commissionWorkshop ?? data.commissionPercent ?? 0}%`} />
            <StatCard icon={Wallet} label="Total Earnings" value={inr(totalEarnings)} />
            <StatCard icon={CalendarDays} label="Today's Earnings" value={inr(todayEarnings)} />
            <StatCard icon={IndianRupee} label="This Month" value={inr(monthEarnings)} />
          </div>

          <EarningsChart byDay={data.byDay} />

          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-sm font-bold text-secondary uppercase tracking-wide">Commission Records</h2>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white"
            >
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>

          <AdminTable columns={columns} rows={rangeFiltered.slice(0, 100)} />
          {rangeFiltered.length > 100 && (
            <p className="text-[11px] text-muted normal-case mt-3">Showing latest 100 of {rangeFiltered.length} records.</p>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="card-base bg-white p-5">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-9 h-9 bg-primary/10 flex items-center justify-center shrink-0">
          <Icon size={17} className="text-primary" />
        </span>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{label}</p>
      </div>
      <p className="font-heading text-2xl sm:text-3xl text-secondary leading-none">{value}</p>
      {sub && <p className="text-[10px] text-muted normal-case mt-2">{sub}</p>}
    </div>
  );
}
