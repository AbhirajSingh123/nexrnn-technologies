import { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '@/services/supabaseClient';
import { formatDateTimeWithDay } from '@/utils/formatDateTime';
import AdminTable from '@/components/admin/AdminTable';
import AdminFilterBar from '@/components/admin/AdminFilterBar';
import AdminLoadMore from '@/components/admin/AdminLoadMore';
import { useLoadMore } from '@/hooks/useLoadMore';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ExportButtons from '@/components/admin/ExportButtons';
import { downloadPaymentSlipPDF } from '@/data/paymentsRepo';

const STATUS_STYLES = {
  created: 'bg-accent text-secondary border-secondary/30',
  pending: 'bg-blue-50 text-blue-700 border-blue-300',
  paid: 'bg-green-50 text-green-700 border-green-300',
  failed: 'bg-red-50 text-primary border-primary/30',
  expired: 'bg-red-50 text-primary border-primary/30',
};

function getStudent(r) {
  if (r.lead_type === 'career') {
    const app = r.internship_applications;
    return app ? { name: app.full_name, email: app.email, phone: app.mobile } : null;
  }
  return r.leads_course ?? r.leads_workshop ?? null;
}

function getReferenceId(r) {
  if (r.lead_type === 'career') return r.internship_applications?.application_id ?? '';
  return r.leads_course?.reference_id ?? r.leads_workshop?.reference_id ?? '';
}

function getItemTitle(r) {
  if (r.lead_type === 'career') return r.internship_applications?.opening_title ?? r.item_title ?? '—';
  return r.leads_course?.course_title ?? r.leads_workshop?.workshop_title ?? r.item_title ?? '—';
}

function getTypeLabel(r) {
  return r.lead_type === 'career' ? 'Career Application' : r.lead_type === 'workshop' ? 'Workshop' : 'Course';
}

// Offline payment ka method/note: naye columns na mile to raw_response se
function getOffline(r) {
  const raw = (r.raw_response && typeof r.raw_response === 'object') ? r.raw_response : {};
  return {
    method: r.offline_method || raw.method || 'Cash',
    note: r.offline_note || raw.note || '',
  };
}

// Slip ke liye payment row ka poora data (student/item/reference resolved)
function buildSlipData(r) {
  return {
    orderId: r.cashfree_order_id || '',
    cfPaymentId: r.cf_payment_id || '',
    paymentMethod: r.payment_method || '',
    status: r.status || '',
    amount: r.amount ?? 0,
    baseAmount: r.base_amount,
    discountAmount: r.discount_amount,
    promoCode: r.promo_code || '',
    platformFee: r.platform_fee,
    createdAt: r.created_at || '',
    itemName: getItemTitle(r),
    itemTypeLabel: getTypeLabel(r),
    referenceId: getReferenceId(r),
    studentName: getStudent(r)?.name ?? '',
    email: getStudent(r)?.email ?? '',
    phone: String(getStudent(r)?.phone ?? ''),
  };
}

export default function AdminPayments() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [slippingId, setSlippingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payments')
      .select('*, leads_course(name, email, phone, course_title, reference_id), leads_workshop(name, email, phone, workshop_title, reference_id)')
      .order('created_at', { ascending: false });
    if (error) toast.error('Failed to load payments.');

    // Career payments: application details resolve karo (Student/Reference ID ke liye).
    // Naye orders me application_id set hota hai, purane me sirf lead_id — dono handle.
    let rows = data ?? [];
    const careerIds = [...new Set(
      rows.filter((r) => r.lead_type === 'career').map((r) => r.application_id || r.lead_id).filter(Boolean)
    )];
    if (careerIds.length) {
      const { data: apps } = await supabase
        .from('internship_applications')
        .select('id, full_name, email, mobile, opening_title, application_id')
        .in('id', careerIds);
      const appsById = {};
      for (const app of apps ?? []) appsById[app.id] = app;
      rows = rows.map((r) => (
        r.lead_type === 'career' ? { ...r, internship_applications: appsById[r.application_id || r.lead_id] ?? null } : r
      ));
    }

    setRows(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (sourceFilter === 'offline' && r.payment_method !== 'offline') return false;
      if (sourceFilter === 'online' && r.payment_method === 'offline') return false;
      if (dateFrom && new Date(r.created_at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(r.created_at) > new Date(`${dateTo}T23:59:59`)) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const student = getStudent(r);
        const haystack = [
          r.cashfree_order_id, r.cf_payment_id, getReferenceId(r),
          student?.name, student?.email, student?.phone, getItemTitle(r),
          r.promo_code, r.referral_code,
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, dateFrom, dateTo, statusFilter, sourceFilter]);

  const { visibleItems, hasMore, loadMore, total, shown } = useLoadMore(
    filteredRows,
    `${search}|${dateFrom}|${dateTo}|${statusFilter}|${sourceFilter}`
  );

  // Export ke liye FULL rows - student/item/reference sab resolved
  const exportRows = filteredRows.map((r) => ({
    date: formatDateTimeWithDay(r.created_at),
    name: getStudent(r)?.name ?? '',
    email: getStudent(r)?.email ?? '',
    phone: getStudent(r)?.phone ?? '',
    item: getItemTitle(r),
    lead_type: getTypeLabel(r),
    amount: r.amount ?? 0,
    base_amount: r.base_amount ?? '',
    discount_amount: r.discount_amount ?? '',
    promo_code: r.promo_code || '',
    referral_code: r.referral_code || '',
    platform_fee: r.platform_fee ?? '',
    currency: r.currency || 'INR',
    status: r.status || '',
    cashfree_order_id: r.cashfree_order_id || '',
    cf_payment_id: r.cf_payment_id || '',
    reference_id: getReferenceId(r),
    payment_method: r.payment_method || '',
    offline_method: r.payment_method === 'offline' ? getOffline(r).method : '',
    offline_note: r.payment_method === 'offline' ? getOffline(r).note : '',
    source: r.payment_method === 'offline' ? 'Offline' : 'Online (Cashfree)',
    created_at: r.created_at || '',
  }));

  const handleDownloadSlip = async (r) => {
    if (slippingId) return;
    setSlippingId(r.cashfree_order_id);
    try {
      await downloadPaymentSlipPDF(buildSlipData(r));
    } catch (err) {
      toast.error(err?.message || 'Payment slip could not be downloaded. Please try again.');
    } finally {
      setSlippingId(null);
    }
  };

  const columns = [
    { key: 'created_at', label: 'Date', render: (r) => formatDateTimeWithDay(r.created_at) },
    { key: 'name', label: 'Name', render: (r) => getStudent(r)?.name ?? '—' },
    { key: 'item', label: 'Course / Workshop', render: (r) => getItemTitle(r) },
    { key: 'lead_type', label: 'Type', render: (r) => getTypeLabel(r) },
    { key: 'amount', label: 'Total Pay', render: (r) => `\u20b9${r.amount}` },
    { key: 'promo_code', label: 'Promo Code', render: (r) => r.promo_code || '—' },
    { key: 'referral_code', label: 'Referral Code', render: (r) => (r.referral_code ? <span className="font-mono text-xs font-bold text-primary">{r.referral_code}</span> : '—') },
    { key: 'cashfree_order_id', label: 'Order ID' },
    { key: 'cf_payment_id', label: 'Payment ID', render: (r) => r.cf_payment_id || '—' },
    { key: 'reference_id', label: 'Reference ID/Application ID', render: (r) => getReferenceId(r) || '—' },
    {
      key: 'payment_method', label: 'Method', render: (r) => (
        r.payment_method === 'offline' ? (
          <span className="inline-flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 border-2 border-amber-300 bg-amber-50 text-amber-700 whitespace-nowrap">Offline · {getOffline(r).method}</span>
            {getOffline(r).note && <span className="text-[10px] text-muted normal-case mt-0.5 max-w-[180px]">{getOffline(r).note}</span>}
          </span>
        ) : (r.payment_method || '—')
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 border-2 whitespace-nowrap ${STATUS_STYLES[r.status] ?? STATUS_STYLES.created}`}>
          {r.status}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Slip',
      render: (r) => (
        <button
          type="button"
          onClick={() => handleDownloadSlip(r)}
          disabled={slippingId === r.cashfree_order_id}
          className="text-xs font-bold text-primary hover:underline disabled:opacity-60 whitespace-nowrap"
        >
          {slippingId === r.cashfree_order_id ? 'Preparing…' : 'Download'}
        </button>
      ),
    },
  ];

  return (
    <div>
      <h1 className="font-heading text-3xl text-secondary mb-1">Payments</h1>
      <p className="text-sm text-muted normal-case mb-6">All Cashfree payments — course &amp; workshop enrollments and internship/job application fees.</p>

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, order ID, payment ID, promo code, reference…"
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        extra={
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-muted mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white"
            >
              <option value="all">All</option>
              <option value="created">Created</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="expired">Expired</option>
            </select>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-muted mb-1">Source</label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white"
              >
                <option value="all">All</option>
                <option value="online">Online (Cashfree)</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>
        }
      />

      {/* Download data: PDF / Excel / CSV */}

      <div className="mb-4">

        <ExportButtons rows={exportRows} columns={columns} filename="payments" title="Payments" />

      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <AdminTable columns={columns} rows={visibleItems} />
          <AdminLoadMore shown={shown} total={total} hasMore={hasMore} onLoadMore={loadMore} />
        </>
      )}
    </div>
  );
}
