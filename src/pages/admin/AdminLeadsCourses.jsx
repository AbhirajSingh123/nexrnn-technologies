import { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '@/services/supabaseClient';
import { formatDateTimeWithDay } from '@/utils/formatDateTime';
import AdminTable from '@/components/admin/AdminTable';
import AdminFilterBar from '@/components/admin/AdminFilterBar';
import AdminLoadMore from '@/components/admin/AdminLoadMore';
import { useLoadMore } from '@/hooks/useLoadMore';
import AdminEnrollmentModal from '@/components/admin/AdminEnrollmentModal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ExportButtons from '@/components/admin/ExportButtons';
import { downloadEnrollmentCertificatePDF } from '@/data/certificateRepo';
import { buildEnrollmentMailto } from '@/utils/adminMailto';


const ENROLLMENT_STATUS_LABELS = {
  pending: 'Pending',
  on_call: 'On Call',
  enrolled: 'Enrolled',
  payment_received: 'Payment Received',
  declined: 'Declined',
};

const ENROLLMENT_STATUS_STYLES = {
  pending: 'bg-accent text-secondary border-secondary/30',
  on_call: 'bg-blue-50 text-blue-700 border-blue-300',
  enrolled: 'bg-green-50 text-green-700 border-green-300',
  payment_received: 'bg-green-50 text-green-700 border-green-300',
  declined: 'bg-red-50 text-primary border-primary/30',
};

export default function AdminLeadsCourses() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [certBusy, setCertBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [managingRow, setManagingRow] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('leads_course').select('*').order('created_at', { ascending: false });
    if (error) toast.error('Failed to load enrollments.');
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (row) => {
    if (!window.confirm('Delete this enrollment?')) return;
    const { error } = await supabase.from('leads_course').delete().eq('id', row.id);
    if (error) toast.error('Delete failed.');
    else {
      toast.success('Enrollment deleted.');
      load();
    }
  };

  const courseOptions = useMemo(
    () => [...new Set(rows.map((r) => r.course_title))].sort(),
    [rows]
  );

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (courseFilter !== 'all' && r.course_title !== courseFilter) return false;
      if (statusFilter !== 'all' && (r.enrollment_status ?? 'pending') !== statusFilter) return false;
      if (dateFrom && new Date(r.created_at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(r.created_at) > new Date(`${dateTo}T23:59:59`)) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const haystack = [r.name, r.email, r.phone, r.course_title, r.college, r.payment_ref_no, r.batch_id].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, dateFrom, dateTo, courseFilter, statusFilter]);

  const { visibleItems, hasMore, loadMore, total, shown } = useLoadMore(
    filteredRows,
    `${search}|${dateFrom}|${dateTo}|${courseFilter}|${statusFilter}`
  );

  const handleCertDownload = async (r) => {
    setCertBusy(true);
    try {
      await downloadEnrollmentCertificatePDF({
        name: r.name,
        referenceId: r.reference_id,
        batchId: r.batch_id,
        itemTitle: r.course_title,
        type: 'course',
      });
    } catch (err) {
      toast.error(err.message || 'Certificate download failed.');
    } finally {
      setCertBusy(false);
    }
  };

  const columns = [
    { key: 'created_at', label: 'Date', render: (r) => formatDateTimeWithDay(r.created_at) },
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'WhatsApp / Mobile' },
    { key: 'email', label: 'Email' },
    { key: 'course_title', label: 'Course' },
    { key: 'reference_id', label: 'Reference ID', render: (r) => r.reference_id || '—' },
    { key: 'batch_id', label: 'Batch ID', render: (r) => r.batch_id || '—' },
    {
      key: 'enrollment_status',
      label: 'Status',
      render: (r) => (
        <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1.5 border-2 whitespace-nowrap ${ENROLLMENT_STATUS_STYLES[r.enrollment_status ?? 'pending']}`}>
          {ENROLLMENT_STATUS_LABELS[r.enrollment_status ?? 'pending']}
        </span>
      ),
    },
    {
      key: 'certificate',
      label: 'Certificate',
      render: (r) => (
        <button
          onClick={() => handleCertDownload(r)}
          disabled={certBusy}
          className="text-primary font-semibold hover:underline text-xs"
          title="Download completion certificate"
        >
          {certBusy ? '…' : 'Download'}
        </button>
      ),
    },
    {
      key: 'mail',
      label: 'Mail',
      render: (r) => (
        <a
          href={buildEnrollmentMailto({ name: r.name, email: r.email, batchId: r.batch_id, referenceId: r.reference_id, itemTitle: r.course_title, type: 'course' })}
          className="text-primary font-semibold hover:underline text-xs"
          title={`Email ${r.email}`}
        >
          Send
        </a>
      ),
    },
    {
      key: 'manage',
      label: 'Manage',
      render: (r) => (
        <button onClick={() => setManagingRow(r)} className="text-primary font-semibold hover:underline">
          Manage
        </button>
      ),
    },
  ];

  return (
    <div>
      <h1 className="font-heading text-3xl text-secondary mb-1">Course Enrollments</h1>
      <p className="text-sm text-muted normal-case mb-6">
        Submissions from the course enrollment popup. Click "Manage" to set the Batch ID, statuses, and admin notes.
      </p>

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, email, phone, batch ID…"
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        extra={
          <>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-muted mb-1">Course</label>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white max-w-[220px]"
              >
                <option value="all">All Courses</option>
                {courseOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-muted mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white"
              >
                <option value="all">All</option>
                {Object.entries(ENROLLMENT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </>
        }
      />

      {/* Download data: PDF / Excel / CSV */}

      <div className="mb-4">

        <ExportButtons rows={rows} columns={columns} filename="course-enrollments" title="Course Enrollments" excludeKeys={['certificate', 'mail', 'manage']} />

      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <AdminTable columns={columns} rows={visibleItems} onDelete={handleDelete} />
          <AdminLoadMore shown={shown} total={total} hasMore={hasMore} onLoadMore={loadMore} />
        </>
      )}

      <AdminEnrollmentModal
        enrollment={managingRow}
        table="leads_course"
        titleField="course_title"
        paymentFkColumn="lead_course_id"
        itemLabel="Course"
        onClose={() => setManagingRow(null)}
        onSaved={() => {
          setManagingRow(null);
          load();
        }}
      />
    </div>
  );
}
