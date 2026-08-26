import { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '@/services/supabaseClient';
import { formatDateTimeWithDay } from '@/utils/formatDateTime';
import AdminTable from '@/components/admin/AdminTable';
import AdminFilterBar from '@/components/admin/AdminFilterBar';
import AdminEnrollmentModal from '@/components/admin/AdminEnrollmentModal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

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

export default function AdminLeadsWorkshops() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [workshopFilter, setWorkshopFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [managingRow, setManagingRow] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('leads_workshop').select('*').order('created_at', { ascending: false });
    if (error) toast.error('Failed to load registrations.');
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (row) => {
    if (!window.confirm('Delete this registration?')) return;
    const { error } = await supabase.from('leads_workshop').delete().eq('id', row.id);
    if (error) toast.error('Delete failed.');
    else {
      toast.success('Registration deleted.');
      load();
    }
  };

  const workshopOptions = useMemo(
    () => [...new Set(rows.map((r) => r.workshop_title))].sort(),
    [rows]
  );

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (workshopFilter !== 'all' && r.workshop_title !== workshopFilter) return false;
      if (statusFilter !== 'all' && (r.enrollment_status ?? 'pending') !== statusFilter) return false;
      if (dateFrom && new Date(r.created_at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(r.created_at) > new Date(`${dateTo}T23:59:59`)) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const haystack = [r.name, r.email, r.phone, r.workshop_title, r.college, r.batch_id].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, dateFrom, dateTo, workshopFilter, statusFilter]);

  const columns = [
    { key: 'created_at', label: 'Date', render: (r) => formatDateTimeWithDay(r.created_at) },
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'WhatsApp / Mobile' },
    { key: 'email', label: 'Email' },
    { key: 'workshop_title', label: 'Workshop' },
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
      <h1 className="font-heading text-3xl text-secondary mb-1">Workshop Registrations</h1>
      <p className="text-sm text-muted normal-case mb-6">
        Submissions from the workshop registration popup. Click "Manage" to set the Batch ID, statuses, and admin notes.
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
              <label className="block text-[10px] font-bold uppercase tracking-wide text-muted mb-1">Workshop</label>
              <select
                value={workshopFilter}
                onChange={(e) => setWorkshopFilter(e.target.value)}
                className="border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white max-w-[220px]"
              >
                <option value="all">All Workshops</option>
                {workshopOptions.map((w) => (
                  <option key={w} value={w}>{w}</option>
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

      {loading ? <LoadingSpinner /> : <AdminTable columns={columns} rows={filteredRows} onDelete={handleDelete} />}

      <AdminEnrollmentModal
        enrollment={managingRow}
        table="leads_workshop"
        titleField="workshop_title"
        paymentFkColumn="lead_workshop_id"
        itemLabel="Workshop"
        onClose={() => setManagingRow(null)}
        onSaved={() => {
          setManagingRow(null);
          load();
        }}
      />
    </div>
  );
}
