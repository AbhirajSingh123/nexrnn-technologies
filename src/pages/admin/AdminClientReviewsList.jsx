import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { ADMIN_ROUTES } from '@/constants/adminRoutes';
import AdminTable from '@/components/admin/AdminTable';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function AdminClientReviewsList() {
  const [rows, setRows] = useState([]);
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

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-heading text-3xl text-secondary">What Our Clients Say</h1>
        <Link to={ADMIN_ROUTES.clientReviewNew} className="btn-primary !px-5 !py-2.5 text-xs">
          <Plus size={15} /> New Review
        </Link>
      </div>
      <p className="text-sm text-muted normal-case mb-6">Video reviews shown in the slider on the Services page.</p>
      {loading ? <LoadingSpinner /> : <AdminTable columns={columns} rows={rows} onDelete={handleDelete} />}
    </div>
  );
}
