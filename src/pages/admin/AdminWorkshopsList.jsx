import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { ADMIN_ROUTES } from '@/constants/adminRoutes';
import AdminTable from '@/components/admin/AdminTable';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function AdminWorkshopsList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('workshops').select('*').order('sort_order', { ascending: true });
    if (error) toast.error('Failed to load workshops.');
    setRows(data ?? []);
    setLoading(false);
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
    { key: 'title', label: 'Title' },
    { key: 'slug', label: 'Slug' },
    { key: 'price', label: 'Price' },
    {
      key: 'workshop_datetime',
      label: 'Date',
      render: (r) => (r.workshop_datetime ? new Date(r.workshop_datetime).toLocaleDateString('en-IN') : '—'),
    },
    { key: 'active', label: 'Active', render: (r) => (r.active ? 'Yes' : 'No') },
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

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-heading text-3xl text-secondary">Manage Workshops</h1>
        <Link to={ADMIN_ROUTES.workshopNew} className="btn-primary !px-5 !py-2.5 text-xs">
          <Plus size={15} /> New Workshop
        </Link>
      </div>
      <p className="text-sm text-muted normal-case mb-6">Full CRUD — changes here reflect live on the website.</p>
      {loading ? <LoadingSpinner /> : <AdminTable columns={columns} rows={rows} onDelete={handleDelete} />}
    </div>
  );
}
