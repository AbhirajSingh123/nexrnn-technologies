import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Loader2, Star } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { ADMIN_ROUTES } from '@/constants/adminRoutes';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const inputClass = 'w-full border-2 border-secondary/20 focus:border-primary px-4 py-2.5 text-sm outline-none transition-colors bg-white';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-2';

const emptyForm = { review: '', rating: 5, client_name: '', company_name: '', active: true, sort_order: 0 };

export default function AdminTestimonialForm() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    const load = async () => {
      const { data, error } = await supabase.from('testimonials').select('*').eq('id', id).maybeSingle();
      if (error || !data) {
        toast.error('Testimonial not found.');
        navigate(ADMIN_ROUTES.testimonials);
        return;
      }
      setForm(data);
      setLoading(false);
    };
    load();
  }, [id, isNew, navigate]);

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      review: form.review.trim(),
      rating: Number(form.rating) || 5,
      client_name: form.client_name.trim(),
      company_name: form.company_name.trim(),
      active: form.active,
      sort_order: Number(form.sort_order) || 0,
    };

    const { error } = isNew
      ? await supabase.from('testimonials').insert(payload)
      : await supabase.from('testimonials').update(payload).eq('id', id);

    setSaving(false);

    if (error) {
      toast.error(error.message || 'Save failed.');
      return;
    }
    toast.success(isNew ? 'Testimonial created.' : 'Testimonial updated.');
    navigate(ADMIN_ROUTES.testimonials);
  };

  if (loading) return <LoadingSpinner className="min-h-[40vh]" />;

  return (
    <div>
      <Link to={ADMIN_ROUTES.testimonials} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary mb-4 hover:underline">
        <ArrowLeft size={15} /> Back to Testimonials
      </Link>
      <h1 className="font-heading text-3xl text-secondary mb-6">{isNew ? 'New Testimonial' : 'Edit Testimonial'}</h1>

      <form onSubmit={handleSubmit} className="card-base bg-white p-7 max-w-xl space-y-5">
        <div>
          <label className={labelClass}>Review</label>
          <textarea required rows={4} className={`${inputClass} resize-none`} value={form.review} onChange={handleChange('review')} />
        </div>

        <div>
          <label className={labelClass}>Star Rating</label>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setForm((f) => ({ ...f, rating: n }))}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                <Star
                  size={26}
                  className={n <= form.rating ? 'fill-primary text-primary' : 'text-secondary/20'}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Client Name</label>
            <input required className={inputClass} value={form.client_name} onChange={handleChange('client_name')} />
          </div>
          <div>
            <label className={labelClass}>Company Name</label>
            <input className={inputClass} value={form.company_name} onChange={handleChange('company_name')} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 items-end">
          <div>
            <label className={labelClass}>Sort Order</label>
            <input type="number" className={inputClass} value={form.sort_order} onChange={handleChange('sort_order')} />
          </div>
          <label className="flex items-center gap-2.5 pb-2.5">
            <input type="checkbox" className="w-4 h-4 accent-primary" checked={form.active} onChange={handleChange('active')} />
            <span className="text-sm font-semibold text-secondary">Active (visible on site)</span>
          </label>
        </div>

        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : 'Save Testimonial'}
        </button>
      </form>
    </div>
  );
}
