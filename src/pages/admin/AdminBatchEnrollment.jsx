import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import { parseRupeeAmount } from '@/utils/format';
import { supabase } from '@/services/supabaseClient';
import { ADMIN_ROUTES } from '@/constants/adminRoutes';
import AdminTable from '@/components/admin/AdminTable';
import AdminLoadMore from '@/components/admin/AdminLoadMore';
import ExportButtons from '@/components/admin/ExportButtons';
import { useLoadMore } from '@/hooks/useLoadMore';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const PAYMENT_COLUMNS = [
  {
    key: 'created_date',
    label: 'Date',
    render: (r) => new Date(r.created_at).toLocaleDateString('en-IN'),
  },
  {
    key: 'created_time',
    label: 'Time',
    render: (r) =>
      new Date(r.created_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }),
  },
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'reference_id', label: 'Reference No.', render: (r) => r.reference_id || '—' },
  { key: 'item_title', label: 'Course / Workshop' },
  {
    key: 'fee',
    label: 'Fee',
    render: (r) =>
      r.payment_status === 'free'
        ? '\u20b90'
        : r.price
          ? `\u20b9${parseRupeeAmount(r.price).toLocaleString('en-IN')}`
          : '\u2014',
  },
  {
    key: 'payment',
    label: 'Payment',
    render: (r) => {
      if (r.payment_status === 'free') return <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-100 border border-blue-300 px-1.5 py-0.5">Free</span>;
      if (r.enrollment_status === 'payment_received') return <span className="text-[10px] font-bold uppercase text-green-700 bg-green-100 border border-green-300 px-1.5 py-0.5">Received</span>;
      if (r.enrollment_status === 'refunded') return <span className="text-[10px] font-bold uppercase text-red-700 bg-red-100 border border-red-300 px-1.5 py-0.5">Refunded</span>;
      return <span className="text-[10px] font-bold uppercase text-yellow-700 bg-yellow-100 border border-yellow-300 px-1.5 py-0.5">{r.enrollment_status || 'Pending'}</span>;
    },
  },
];

/**
 * Batch Enrollment / Participants page.
 * Route: /admin/courses/{batchId}/enrollment  ya  /admin/workshops/{batchId}/enrollment
 * Ek hi batch ke saare enrolled users yahan dikhte hain + download option.
 */
export default function AdminBatchEnrollment() {
  const { batchId } = useParams();
  const isCourse = window.location.pathname.includes('/courses/');
  const leadTable = isCourse ? 'leads_course' : 'leads_workshop';
  const titleCol = isCourse ? 'course_title' : 'workshop_title';

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(leadTable)
      .select('*')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Failed to load enrollments.');
      setRows([]);
    } else {
      setRows(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId, leadTable]);

  const exportRows = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        created_date: new Date(r.created_at).toLocaleDateString('en-IN'),
        created_time: new Date(r.created_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }),
        item_title: r[titleCol],
        fee: r.payment_status === 'free' ? '\u20b90' : r.price ? `\u20b9${parseRupeeAmount(r.price).toLocaleString('en-IN')}` : '',
        payment: r.payment_status === 'free' ? 'Free' : r.enrollment_status === 'payment_received' ? 'Received' : (r.enrollment_status || 'Pending'),
      })),
    [rows, titleCol]
  );

  const { visibleItems, hasMore, loadMore, total, shown } = useLoadMore(
    rows,
    `${batchId}|${rows.length}`,
    20
  );

  const listRoute = isCourse ? ADMIN_ROUTES.courses : ADMIN_ROUTES.workshops;
  const label = isCourse ? 'Course' : 'Workshop';

  return (
    <div>
      <Link
        to={listRoute}
        className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-secondary mb-4 uppercase tracking-wider"
      >
        <ArrowLeft size={14} /> Back to Manage {label}s
      </Link>

      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h1 className="font-heading text-3xl text-secondary flex items-center gap-3">
          <Users size={26} className="text-primary" /> Batch Participants
        </h1>
      </div>
      <p className="text-sm text-muted normal-case mb-2">
        All participants enrolled in this batch — with payment status, reference number, and date/time.
      </p>

      {/* Batch ID highlight */}
      <div className="card-base bg-secondary text-white p-4 mb-6 inline-flex items-center gap-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Batch ID</p>
          <p className="font-mono font-bold text-xl">{batchId}</p>
        </div>
        <div className="border-l border-white/20 pl-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Enrollments</p>
          <p className="font-heading text-xl">{rows.length}</p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <p className="text-sm text-muted normal-case">
              Showing {Math.min(shown, rows.length)} of {rows.length} participants
            </p>
            <ExportButtons
              rows={exportRows}
              columns={PAYMENT_COLUMNS}
              filename={`batch-${batchId}-participants`}
              title={`Batch ${batchId} Participants`}
            />
          </div>

          <AdminTable
            columns={PAYMENT_COLUMNS}
            rows={visibleItems}
            emptyLabel="No enrollments in this batch yet."
          />
          <AdminLoadMore shown={shown} total={total} hasMore={hasMore} onLoadMore={loadMore} />
        </>
      )}
    </div>
  );
}
