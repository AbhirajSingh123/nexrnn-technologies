import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, Star } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { ADMIN_ROUTES } from '@/constants/adminRoutes';
import AdminTable from '@/components/admin/AdminTable';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function AdminTestimonialsList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('testimonials').select('*').order('sort_order', { ascending: true });
    if (error) toast.error('Failed to load testimonials.');
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete testimonial from "${row.client_name}"?`)) return;
    const { error } = await supabase.from('testimonials').delete().eq('id', row.id);
    if (error) toast.error('Delete failed.');
    else {
      toast.success('Testimonial deleted.');
      load();
    }
  };

  const columns = [
    { key: 'client_name', label: 'Client Name' },
    { key: 'company_name', label: 'Company' },
    {
      key: 'rating',
      label: 'Rating',
      render: (r) => (
        <span className="flex items-center gap-0.5">
          {Array.from({ length: r.rating }).map((_, i) => (
            <Star key={i} size={13} className="fill-primary text-primary" />
          ))}
        </span>
      ),
    },
    { key: 'review', label: 'Review', render: (r) => <span className="line-clamp-2 max-w-xs block">{r.review}</span> },
    { key: 'active', label: 'Active', render: (r) => (r.active ? 'Yes' : 'No') },
    {
      key: 'edit',
      label: 'Edit',
      render: (r) => (
        <Link to={ADMIN_ROUTES.testimonialEdit(r.id)} className="text-primary font-semibold hover:underline">
          Edit
        </Link>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-heading text-3xl text-secondary">Manage Testimonials</h1>
        <Link to={ADMIN_ROUTES.testimonialNew} className="btn-primary !px-5 !py-2.5 text-xs">
          <Plus size={15} /> New Testimonial
        </Link>
      </div>
      <p className="text-sm text-muted normal-case mb-6">Full CRUD — changes here reflect live on the website.</p>
      {loading ? <LoadingSpinner /> : <AdminTable columns={columns} rows={rows} onDelete={handleDelete} />}
    </div>
  );
}
