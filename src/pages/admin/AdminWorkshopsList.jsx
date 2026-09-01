import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, Search, Users, UserCog } from 'lucide-react';
import { getWorkshopStatus } from '@/utils/workshopUtils';
import { supabase } from '@/services/supabaseClient';
import { ADMIN_ROUTES } from '@/constants/adminRoutes';
import AdminTable from '@/components/admin/AdminTable';
import AdminLoadMore from '@/components/admin/AdminLoadMore';
import { useLoadMore } from '@/hooks/useLoadMore';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ExportButtons from '@/components/admin/ExportButtons';
import { useAdminSearch } from '@/hooks/useAdminSearch';
import { formatINR } from '@/utils/format';
import AssignMentorModal from '@/components/admin/AssignMentorModal';

export default function AdminWorkshopsList() {
  const [rows, setRows] = useState([]);
  const [assignMentor, setAssignMentor] = useState(null); // {id, title}
  const [enrollCounts, setEnrollCounts] = useState({});
  const { search, setSearch, filtered } = useAdminSearch(rows);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('workshops').select('*').order('created_at', { ascending: false }); // newest first
    if (error) toast.error('Failed to load workshops.');
    setRows(data ?? []);
    setLoading(false);

    // Participants count per batch (Batch ID wise)
    const { data: leads } = await supabase.from('leads_workshop').select('batch_id');
    const counts = {};
    (leads ?? []).forEach((l) => {
      if (l.batch_id) counts[l.batch_id] = (counts[l.batch_id] || 0) + 1;
    });
    setEnrollCounts(counts);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete "${row.title}"?`)) return;
    const { error } = await supabase.from('workshops').delete().eq('id', row.id);
    if (error) toast.error('Delete failed.');
    else {
      toast.success('Workshop deleted.');
      load();
    }
  };

  const columns = [
    {
      key: 'batch_id',
      label: 'Batch ID',
      render: (r) => (
        <span className="font-mono text-[11px] font-bold text-primary">{r.batch_id || '—'}</span>
      ),
    },
    { key: 'title', label: 'Title' },
    { key: 'slug', label: 'Slug' },
    {
      key: 'price',
      label: 'Price',
      render: (r) => (r.is_free ? formatINR(0) : r.price ? formatINR(r.price) : '\u2014'),
    },
    {
      key: 'workshop_start',
      label: 'Workshop Start',
      render: (r) =>
        r.workshop_datetime
          ? new Date(r.workshop_datetime).toLocaleString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
            })
          : '—',
    },
    {
      key: 'registration_end',
      label: 'Registration Ends',
      render: (r) =>
        r.registration_deadline
          ? new Date(r.registration_deadline).toLocaleString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
            })
          : '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) =>
        getWorkshopStatus(r) === 'completed' ? (
          <span className="text-[10px] font-bold uppercase text-red-700 bg-red-100 border border-red-300 px-1.5 py-0.5">
            Completed
          </span>
        ) : (
          <span className="text-[10px] font-bold uppercase text-green-700 bg-green-100 border border-green-300 px-1.5 py-0.5">
            Open
          </span>
        ),
    },
    {
      key: 'active',
      label: 'Active',
      render: (r) => {
        if (!r.active || getWorkshopStatus(r) === 'completed') return 'No';
        return 'Yes';
      },
    },
    {
      key: 'participants',
      label: 'Participants',
      render: (r) =>
        r.batch_id ? (
          <Link
            to={ADMIN_ROUTES.workshopParticipants(r.batch_id)}
            className="text-primary font-semibold hover:underline inline-flex items-center gap-1 text-xs"
            title="View batch participants"
          >
            <Users size={13} /> {enrollCounts[r.batch_id] || 0}
          </Link>
        ) : (
          '—'
        ),
    },
    {
      key: 'mentor',
      label: 'Mentor',
      render: (r) => (
        <button
          onClick={() => setAssignMentor({ id: r.id, title: r.title })}
          className="inline-flex items-center gap-1 text-primary font-semibold hover:underline text-xs"
          title="Assign mentor"
        >
          <UserCog size={13} /> Assign
        </button>
      ),
    },
    {
      key: 'edit',
      label: 'Edit',
      render: (r) => (
        <Link to={ADMIN_ROUTES.workshopEdit(r.id)} className="text-primary font-semibold hover:underline">
          Edit
        </Link>
      ),
    },
  ];

  // Export ke liye FULL rows - har field explicitly (kuch bhi missing na ho)
  const exportRows = filtered.map((r) => ({
    batch_id: r.batch_id || '',
    title: r.title || '',
    slug: r.slug || '',
    price: r.is_free ? '0' : r.price || '',
    workshop_start: r.workshop_datetime
      ? new Date(r.workshop_datetime).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
      : '',
    registration_end: r.registration_deadline
      ? new Date(r.registration_deadline).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
      : '',
    status: getWorkshopStatus(r) === 'completed' ? 'Completed' : 'Open',
    active: !r.active || getWorkshopStatus(r) === 'completed' ? 'No' : 'Yes',
    participants: enrollCounts[r.batch_id] || 0,
    short_description: r.short_description || '',
    mode: r.mode || '',
    created_at: r.created_at ? new Date(r.created_at).toLocaleString('en-IN') : '',
  }));

  const { visibleItems, hasMore, loadMore, total, shown } = useLoadMore(filtered, search + "|" + filtered.length);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-heading text-3xl text-secondary">Manage Workshops</h1>
        <Link to={ADMIN_ROUTES.workshopNew} className="btn-primary !px-5 !py-2.5 text-xs">
          <Plus size={15} /> New Workshop
        </Link>
      </div>
      <p className="text-sm text-muted normal-case mb-6">Full CRUD — changes here reflect live on the website.</p>
      {/* Search filter */}
      <div className="relative w-full sm:w-72 mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search workshop, slug…"
          className="w-full border-2 border-secondary/20 focus:border-primary pl-9 pr-3 py-2 text-sm outline-none transition-colors bg-white" />
      </div>

      {/* Download data: PDF / Excel / CSV */}
      <div className="mb-4">
        <ExportButtons rows={exportRows} columns={columns} filename="workshops" title="Workshops" />
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <AdminTable columns={columns} rows={visibleItems} onDelete={handleDelete} />
          <AdminLoadMore shown={shown} total={total} hasMore={hasMore} onLoadMore={loadMore} />
        </>
      )}

      {assignMentor && (
        <AssignMentorModal
          kind="workshop"
          item={assignMentor}
          onClose={() => setAssignMentor(null)}
        />
      )}
    </div>
  );
}
