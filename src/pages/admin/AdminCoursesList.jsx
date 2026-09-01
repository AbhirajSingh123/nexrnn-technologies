import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, Search, Users, UserCog } from 'lucide-react';
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

export default function AdminCoursesList() {
  const [rows, setRows] = useState([]);
  const [enrollCounts, setEnrollCounts] = useState({});
  const [assignMentor, setAssignMentor] = useState(null); // {id, title}
  const { search, setSearch, filtered } = useAdminSearch(rows);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false }); // newest first
    if (error) toast.error('Failed to load courses.');
    setRows(data ?? []);
    setLoading(false);

    // Participants count per batch (Batch ID wise)
    const { data: leads } = await supabase.from('leads_course').select('batch_id');
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
    const { error } = await supabase.from('courses').delete().eq('id', row.id);
    if (error) toast.error('Delete failed.');
    else {
      toast.success('Course deleted.');
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
    { key: 'active', label: 'Active', render: (r) => (r.active ? 'Yes' : 'No') },
    {
      key: 'participants',
      label: 'Participants',
      render: (r) =>
        r.batch_id ? (
          <Link
            to={ADMIN_ROUTES.courseParticipants(r.batch_id)}
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
        <Link to={ADMIN_ROUTES.courseEdit(r.id)} className="text-primary font-semibold hover:underline">
          Edit
        </Link>
      ),
    },
  ];

  // Export ke liye FULL rows
  const exportRows = filtered.map((r) => ({
    batch_id: r.batch_id || '',
    title: r.title || '',
    slug: r.slug || '',
    price: r.is_free ? '0' : r.price || '',
    original_price: r.original_price || '',
    duration: r.duration || '',
    level: r.level || '',
    mode: r.mode || '',
    active: r.active ? 'Yes' : 'No',
    participants: enrollCounts[r.batch_id] || 0,
    certificate: r.certificate ? 'Yes' : 'No',
    mentorship: r.mentorship ? 'Yes' : 'No',
    created_at: r.created_at ? new Date(r.created_at).toLocaleString('en-IN') : '',
  }));

  const { visibleItems, hasMore, loadMore, total, shown } = useLoadMore(filtered, search + "|" + filtered.length);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-heading text-3xl text-secondary">Manage Courses</h1>
        <Link to={ADMIN_ROUTES.courseNew} className="btn-primary !px-5 !py-2.5 text-xs">
          <Plus size={15} /> New Course
        </Link>
      </div>
      <p className="text-sm text-muted normal-case mb-6">Full CRUD — changes here reflect live on the website.</p>
      {/* Search filter */}
      <div className="relative w-full sm:w-72 mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search course, slug…"
          className="w-full border-2 border-secondary/20 focus:border-primary pl-9 pr-3 py-2 text-sm outline-none transition-colors bg-white" />
      </div>

      {/* Download data: PDF / Excel / CSV */}
      <div className="mb-4">
        <ExportButtons rows={exportRows} columns={columns} filename="courses" title="Courses" />
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
          kind="course"
          item={assignMentor}
          onClose={() => setAssignMentor(null)}
        />
      )}
    </div>
  );
}
