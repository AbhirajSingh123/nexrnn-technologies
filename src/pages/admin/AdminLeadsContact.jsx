import { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '@/services/supabaseClient';
import { formatDateTimeWithDay } from '@/utils/formatDateTime';
import AdminTable from '@/components/admin/AdminTable';
import AdminFilterBar from '@/components/admin/AdminFilterBar';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const STATUS_STYLES = {
  pending: 'bg-accent text-secondary border-secondary/30',
  done: 'bg-green-50 text-green-700 border-green-300',
  undone: 'bg-red-50 text-primary border-primary/30',
};

export default function AdminLeadsContact() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('leads_contact').select('*').order('created_at', { ascending: false });
    if (error) toast.error('Failed to load leads.');
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (row) => {
    if (!window.confirm('Delete this lead?')) return;
    const { error } = await supabase.from('leads_contact').delete().eq('id', row.id);
    if (error) toast.error('Delete failed.');
    else {
      toast.success('Lead deleted.');
      load();
    }
  };

  const handleStatusChange = async (row, status) => {
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status } : r)));
    const { error } = await supabase.from('leads_contact').update({ status }).eq('id', row.id);
    if (error) {
      toast.error('Failed to update status.');
      load();
    }
  };

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== 'all' && (r.status ?? 'pending') !== statusFilter) return false;
      if (dateFrom && new Date(r.created_at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(r.created_at) > new Date(`${dateTo}T23:59:59`)) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const haystack = [r.name, r.email, r.phone, r.service, r.message].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, dateFrom, dateTo, statusFilter]);

  const columns = [
    { key: 'created_at', label: 'Date', render: (r) => formatDateTimeWithDay(r.created_at) },
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'service', label: 'Service' },
    { key: 'message', label: 'Message' },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <select
          value={r.status ?? 'pending'}
          onChange={(e) => handleStatusChange(r, e.target.value)}
          className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1.5 border-2 outline-none ${STATUS_STYLES[r.status ?? 'pending']}`}
        >
          <option value="pending">Pending</option>
          <option value="done">Done</option>
          <option value="undone">Undone</option>
        </select>
      ),
    },
  ];

  return (
    <div>
      <h1 className="font-heading text-3xl text-secondary mb-1">Contact Leads</h1>
      <p className="text-sm text-muted normal-case mb-6">Submissions from the Contact Us page and homepage lead form.</p>

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
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
              <option value="pending">Pending</option>
              <option value="done">Done</option>
              <option value="undone">Undone</option>
            </select>
          </div>
        }
      />

      {loading ? <LoadingSpinner /> : <AdminTable columns={columns} rows={filteredRows} onDelete={handleDelete} />}
    </div>
  );
}
