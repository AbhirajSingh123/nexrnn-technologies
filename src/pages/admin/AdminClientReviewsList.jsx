import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, Search } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { ADMIN_ROUTES } from '@/constants/adminRoutes';
import AdminTable from '@/components/admin/AdminTable';
import AdminLoadMore from '@/components/admin/AdminLoadMore';
import { useLoadMore } from '@/hooks/useLoadMore';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ExportButtons from '@/components/admin/ExportButtons';
import { useAdminSearch } from '@/hooks/useAdminSearch';

export default function AdminClientReviewsList() {
  const [rows, setRows] = useState([]);
  const { search, setSearch, filtered } = useAdminSearch(rows);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('client_reviews').select('*').order('sort_order', { ascending: true });
    if (error) toast.error('Failed to load client reviews.');
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete review from "${row.client_name}"?`)) return;
    const { error } = await supabase.from('client_reviews').delete().eq('id', row.id);
    if (error) toast.error('Delete failed.');
    else {
      toast.success('Review deleted.');
      load();
    }
  };

  const columns = [
    { key: 'client_name', label: 'Client Name' },
    { key: 'service_name', label: 'Service' },
    { key: 'youtube_url', label: 'YouTube Link', render: (r) => r.youtube_url || '—' },
    { key: 'active', label: 'Active', render: (r) => (r.active ? 'Yes' : 'No') },
    {
      key: 'edit',
      label: 'Edit',
      render: (r) => (
        <Link to={ADMIN_ROUTES.clientReviewEdit(r.id)} className="text-primary font-semibold hover:underline">
          Edit
        </Link>
      ),
    },
  ];

  const { visibleItems, hasMore, loadMore, total, shown } = useLoadMore(filtered, search + "|" + filtered.length);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-heading text-3xl text-secondary">What Our Clients Say</h1>
        <Link to={ADMIN_ROUTES.clientReviewNew} className="btn-primary !px-5 !py-2.5 text-xs">
          <Plus size={15} /> New Review
        </Link>
      </div>
      <p className="text-sm text-muted normal-case mb-6">Video reviews shown in the slider on the Services page.</p>
      {/* Search filter */}
      <div className="relative w-full sm:w-72 mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search client, service…"
          className="w-full border-2 border-secondary/20 focus:border-primary pl-9 pr-3 py-2 text-sm outline-none transition-colors bg-white" />
      </div>

      {/* Download data: PDF / Excel / CSV */}
      <div className="mb-4">
        <ExportButtons rows={filtered} columns={columns} filename="client-reviews" title="Client Reviews" />
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <AdminTable columns={columns} rows={visibleItems} onDelete={handleDelete} />
          <AdminLoadMore shown={shown} total={total} hasMore={hasMore} onLoadMore={loadMore} />
        </>
      )}
    </div>
  );
}
