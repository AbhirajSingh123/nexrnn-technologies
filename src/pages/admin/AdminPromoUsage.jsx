import { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '@/services/supabaseClient';
import { formatDateTimeWithDay } from '@/utils/formatDateTime';
import { formatINR } from '@/utils/format';
import AdminTable from '@/components/admin/AdminTable';
import AdminFilterBar from '@/components/admin/AdminFilterBar';
import AdminLoadMore from '@/components/admin/AdminLoadMore';
import { useLoadMore } from '@/hooks/useLoadMore';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ExportButtons from '@/components/admin/ExportButtons';
import { Tag } from 'lucide-react';

function getStudent(r) {
  if (r.lead_type === 'career') {
    const app = r.internship_applications;
    return app ? { name: app.full_name, email: app.email, phone: app.mobile } : null;
  }
  return r.leads_course ?? r.leads_workshop ?? null;
}

function getItemTitle(r) {
  if (r.lead_type === 'career') return r.internship_applications?.opening_title ?? r.item_title ?? '—';
  return r.leads_course?.course_title ?? r.leads_workshop?.workshop_title ?? r.item_title ?? '—';
}

function getTypeLabel(r) {
  return r.lead_type === 'career' ? 'Career' : r.lead_type === 'workshop' ? 'Workshop' : 'Course';
}

/**
 * Promo Usage — jin payments me promo code laga hai unki alag list.
 * Admin ko pata chale kiska kitna discount gaya aur kaun sa code chal raha hai.
 */
export default function AdminPromoUsage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [codeFilter, setCodeFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payments')
      .select('*, leads_course(name, email, phone, course_title, reference_id), leads_workshop(name, email, phone, workshop_title, reference_id)')
      .order('created_at', { ascending: false });
    if (error) toast.error('Failed to load promo usage.');

    // Career payments: application details resolve karo (Student ke liye)
    let all = data ?? [];
    const careerIds = [...new Set(
      all.filter((r) => r.lead_type === 'career').map((r) => r.application_id || r.lead_id).filter(Boolean)
    )];
    if (careerIds.length) {
      const { data: apps } = await supabase
        .from('internship_applications')
        .select('id, full_name, email, mobile, opening_title, application_id')
        .in('id', careerIds);
      const appsById = {};
      for (const app of apps ?? []) appsById[app.id] = app;
      all = all.map((r) => (
        r.lead_type === 'career' ? { ...r, internship_applications: appsById[r.application_id || r.lead_id] ?? null } : r
      ));
    }

    // Sirf promo-code wale payments
    setRows(all.filter((r) => String(r.promo_code || '').trim() !== ''));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const codeOptions = useMemo(
    () => [...new Set(rows.map((r) => String(r.promo_code || '').toUpperCase()))].sort(),
    [rows]
  );

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (codeFilter !== 'all' && String(r.promo_code || '').toUpperCase() !== codeFilter) return false;
      if (dateFrom && new Date(r.created_at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(r.created_at) > new Date(`${dateTo}T23:59:59`)) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const student = getStudent(r);
        const haystack = [
          r.promo_code, r.cashfree_order_id, r.cf_payment_id,
          student?.name, student?.email, student?.phone, getItemTitle(r),
          r.referral_code,
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, dateFrom, dateTo, codeFilter]);

  const { visibleItems, hasMore, loadMore, total, shown } = useLoadMore(
    filteredRows,
    `${search}|${dateFrom}|${dateTo}|${codeFilter}`
  );

  const totalDiscount = filteredRows.reduce((s, r) => s + (Number(r.discount_amount) || 0), 0);
  const totalPaid = filteredRows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  // Export: FULL rows (key = column key)
  const exportRows = filteredRows.map((r) => ({
    date: formatDateTimeWithDay(r.created_at),
    promo_code: String(r.promo_code || '').toUpperCase(),
    name: getStudent(r)?.name ?? '',
    email: getStudent(r)?.email ?? '',
    phone: getStudent(r)?.phone ?? '',
    item: getItemTitle(r),
    lead_type: getTypeLabel(r),
    base_amount: r.base_amount ?? '',
    discount_amount: r.discount_amount ?? '',
    amount: r.amount ?? 0,
    referral_code: r.referral_code || '',
    reference_id: r.leads_course?.reference_id ?? r.leads_workshop?.reference_id ?? r.internship_applications?.application_id ?? '',
    status: r.status || '',
    cashfree_order_id: r.cashfree_order_id || '',
    cf_payment_id: r.cf_payment_id || '',
    created_at: r.created_at || '',
  }));

  const columns = [
    { key: 'created_at', label: 'Date', render: (r) => formatDateTimeWithDay(r.created_at) },
    { key: 'promo_code', label: 'Promo Code', render: (r) => <span className="font-mono text-xs font-bold text-primary">{String(r.promo_code || '').toUpperCase()}</span> },
    {
      key: 'name',
      label: 'Name',
      render: (r) => <span className="font-semibold text-secondary">{getStudent(r)?.name ?? '—'}</span>,
    },
    { key: 'phone', label: 'Mobile', render: (r) => <span className="font-mono text-xs">{getStudent(r)?.phone ?? '—'}</span> },
    { key: 'item', label: 'Course / Workshop', render: (r) => getItemTitle(r) },
    { key: 'lead_type', label: 'Type', render: (r) => getTypeLabel(r) },
    { key: 'base_amount', label: 'Base', render: (r) => (r.base_amount != null ? formatINR(r.base_amount) : '—') },
    { key: 'discount_amount', label: 'Discount', render: (r) => <span className="font-bold text-primary">- {formatINR(Number(r.discount_amount) || 0)}</span> },
    { key: 'amount', label: 'Paid', render: (r) => <span className="font-bold">{formatINR(r.amount)}</span> },
    { key: 'referral_code', label: 'Referral Code', render: (r) => (r.referral_code ? <span className="font-mono text-xs font-bold text-primary">{r.referral_code}</span> : '—') },
    { key: 'status', label: 'Status', render: (r) => <span className="text-xs font-bold uppercase">{r.status || '—'}</span> },
  ];

  return (
    <div>
      <h1 className="font-heading text-3xl text-secondary mb-1">Promo Usage</h1>
      <p className="text-sm text-muted normal-case mb-6">
        Payments where a promo code was applied — who used which code and how much discount was given.
      </p>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
            <div className="card-base bg-white p-4 flex items-center gap-3">
              <span className="w-9 h-9 bg-primary/10 flex items-center justify-center shrink-0"><Tag size={16} className="text-primary" /></span>
              <div>
                <p className="font-heading text-xl sm:text-2xl text-secondary leading-none">{filteredRows.length}</p>
                <p className="text-[10px] text-muted normal-case mt-1">Promo orders</p>
              </div>
            </div>
            <div className="card-base bg-white p-4 flex items-center gap-3">
              <div>
                <p className="font-heading text-xl sm:text-2xl text-primary leading-none">{formatINR(totalDiscount)}</p>
                <p className="text-[10px] text-muted normal-case mt-1">Total discount given</p>
              </div>
            </div>
            <div className="card-base bg-white p-4 flex items-center gap-3">
              <div>
                <p className="font-heading text-xl sm:text-2xl text-secondary leading-none">{formatINR(totalPaid)}</p>
                <p className="text-[10px] text-muted normal-case mt-1">Revenue received</p>
              </div>
            </div>
          </div>

          <AdminFilterBar
            search={search}
            onSearchChange={setSearch}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
            extra={
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-muted mb-1">Promo Code</label>
                <select
                  value={codeFilter}
                  onChange={(e) => setCodeFilter(e.target.value)}
                  className="border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white max-w-[200px]"
                >
                  <option value="all">All codes</option>
                  {codeOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            }
          />

          <div className="mb-4">
            <ExportButtons rows={exportRows} columns={columns} filename="promo-usage" title="Promo Usage" />
          </div>

          <AdminTable columns={columns} rows={visibleItems} />
          <AdminLoadMore shown={shown} total={total} hasMore={hasMore} onLoadMore={loadMore} />

          {!loading && rows.length === 0 && (
            <div className="card-base bg-white p-8 text-center mt-6">
              <p className="text-sm text-muted normal-case">
                No promo-code payments yet. When someone pays using a promo code, it will show up here.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
