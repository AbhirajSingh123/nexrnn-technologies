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

const STATUS_STYLES = {
  created: 'bg-accent text-secondary border-secondary/30',
  pending: 'bg-blue-50 text-blue-700 border-blue-300',
  paid: 'bg-green-50 text-green-700 border-green-300',
  failed: 'bg-red-50 text-primary border-primary/30',
  expired: 'bg-red-50 text-primary border-primary/30',
};

function getStudent(r) {
  return r.leads_course ?? r.leads_workshop ?? null;
}

function getReferenceId(r) {
  return r.leads_course?.reference_id ?? r.leads_workshop?.reference_id ?? '';
}

function getItemTitle(r) {
  return r.leads_course?.course_title ?? r.leads_workshop?.workshop_title ?? '—';
}

export default function AdminPayments() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payments')
      .select('*, leads_course(name, email, phone, course_title, reference_id), leads_workshop(name, email, phone, workshop_title, reference_id)')
      .order('created_at', { ascending: false });
    if (error) toast.error('Failed to load payments.');
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (dateFrom && new Date(r.created_at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(r.created_at) > new Date(`${dateTo}T23:59:59`)) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const student = getStudent(r);
        const haystack = [
          r.cashfree_order_id, r.cf_payment_id, getReferenceId(r),
          student?.name, student?.email, student?.phone, getItemTitle(r),
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, dateFrom, dateTo, statusFilter]);

  const { visibleItems, hasMore, loadMore, total, shown } = useLoadMore(
    filteredRows,
    `${search}|${dateFrom}|${dateTo}|${statusFilter}`
  );

  // Export ke liye FULL rows - student/item/reference sab resolved
  const exportRows = filteredRows.map((r) => ({
    date: formatDateTimeWithDay(r.created_at),
    student: getStudent(r)?.name ?? '',
    email: getStudent(r)?.email ?? '',
    phone: getStudent(r)?.phone ?? '',
    item: getItemTitle(r),
    lead_type: r.lead_type === 'workshop' ? 'Workshop' : 'Course',
    amount: r.amount ?? 0,
    currency: r.currency || 'INR',
    status: r.status || '',
    cashfree_order_id: r.cashfree_order_id || '',
    cf_payment_id: r.cf_payment_id || '',
    reference_id: getReferenceId(r),
    payment_method: r.payment_method || '',
    created_at: r.created_at || '',
  }));

  const columns = [
    { key: 'created_at', label: 'Date', render: (r) => formatDateTimeWithDay(r.created_at) },
    { key: 'student', label: 'Student', render: (r) => getStudent(r)?.name ?? '—' },
    { key: 'item', label: 'Course / Workshop', render: (r) => getItemTitle(r) },
    { key: 'lead_type', label: 'Type', render: (r) => (r.lead_type === 'career' ? 'Career Application' : r.lead_type === 'workshop' ? 'Workshop' : 'Course') },
    { key: 'amount', label: 'Amount', render: (r) => `\u20b9${r.amount}` },
    { key: 'cashfree_order_id', label: 'Order ID' },
    { key: 'cf_payment_id', label: 'Payment ID', render: (r) => r.cf_payment_id || '—' },
    { key: 'reference_id', label: 'Reference ID', render: (r) => getReferenceId(r) || '—' },
    { key: 'payment_method', label: 'Method', render: (r) => r.payment_method || '—' },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 border-2 whitespace-nowrap ${STATUS_STYLES[r.status] ?? STATUS_STYLES.created}`}>
          {r.status}
        </span>
      ),
    },
  ];

  return (
    <div>
      <h1 className="font-heading text-3xl text-secondary mb-1">Payments</h1>
      <p className="text-sm text-muted normal-case mb-6">All Cashfree payment attempts for course and workshop enrollments.</p>

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search student, order ID, payment ID…"
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
