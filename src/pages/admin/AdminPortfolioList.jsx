import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { ADMIN_ROUTES } from '@/constants/adminRoutes';
import AdminTable from '@/components/admin/AdminTable';
import AdminLoadMore from '@/components/admin/AdminLoadMore';
import { useLoadMore } from '@/hooks/useLoadMore';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function AdminPortfolioList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('portfolio').select('*').order('sort_order', { ascending: true });
    if (error) toast.error('Failed to load portfolio.');
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete "${row.project_name}"?`)) return;
    const { error } = await supabase.from('portfolio').delete().eq('id', row.id);
    if (error) toast.error('Delete failed.');
    else {
      toast.success('Portfolio item deleted.');
      load();
    }
  };

  const columns = [
    {
      key: 'image_url',
      label: 'Image',
      render: (r) =>
        r.image_url ? (
          <img src={r.image_url} alt={r.project_name} className="w-14 h-14 object-cover border-2 border-secondary/15" />
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    { key: 'project_name', label: 'Project Name' },
    { key: 'category', label: 'Category' },
    { key: 'active', label: 'Active', render: (r) => (r.active ? 'Yes' : 'No') },
    {
      key: 'edit',
      label: 'Edit',
      render: (r) => (
        <Link to={ADMIN_ROUTES.portfolioEdit(r.id)} className="text-primary font-semibold hover:underline">
          Edit
        </Link>
      ),
    },
  ];

  const { visibleItems, hasMore, loadMore, total, shown } = useLoadMore(rows, rows.length);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-heading text-3xl text-secondary">Manage Portfolio</h1>
        <Link to={ADMIN_ROUTES.portfolioNew} className="btn-primary !px-5 !py-2.5 text-xs">
          <Plus size={15} /> New Project
        </Link>
      </div>
      <p className="text-sm text-muted normal-case mb-6">Full CRUD — changes here reflect live on the website.</p>
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
