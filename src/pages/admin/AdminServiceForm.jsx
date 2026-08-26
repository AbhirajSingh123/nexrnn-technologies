import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { ADMIN_ROUTES } from '@/constants/adminRoutes';
import { ICONS } from '@/utils/iconMap';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const inputClass = 'w-full border-2 border-secondary/20 focus:border-primary px-4 py-2.5 text-sm outline-none transition-colors bg-white';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-2';

const emptyForm = {
  slug: '', icon: 'sparkles', title: '', short_description: '', benefits: '', features: '',
  price: '', original_price: '', discount_percent: '', cta: '', active: true, sort_order: 0,
};

export default function AdminServiceForm() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    const load = async () => {
      const { data, error } = await supabase.from('services').select('*').eq('id', id).maybeSingle();
      if (error || !data) {
        toast.error('Service not found.');
        navigate(ADMIN_ROUTES.services);
        return;
      }
      setForm({
        ...data,
        benefits: (data.benefits ?? []).join('\n'),
        features: (data.features ?? []).join('\n'),
      });
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
      slug: form.slug.trim(),
      icon: form.icon.trim() || 'sparkles',
      title: form.title.trim(),
      short_description: form.short_description.trim(),
      benefits: form.benefits.split('\n').map((s) => s.trim()).filter(Boolean),
      features: form.features.split('\n').map((s) => s.trim()).filter(Boolean),
      price: form.price.trim(),
      original_price: form.original_price.trim(),
      discount_percent: form.discount_percent === '' ? null : Number(form.discount_percent),
      cta: form.cta.trim(),
      active: form.active,
      sort_order: Number(form.sort_order) || 0,
    };

    const { error } = isNew
      ? await supabase.from('services').insert(payload)
      : await supabase.from('services').update(payload).eq('id', id);

    setSaving(false);

    if (error) {
      toast.error(error.message || 'Save failed.');
      return;
    }
    toast.success(isNew ? 'Service created.' : 'Service updated.');
    navigate(ADMIN_ROUTES.services);
  };

  if (loading) return <LoadingSpinner className="min-h-[40vh]" />;

  return (
    <div>
      <Link to={ADMIN_ROUTES.services} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary mb-4 hover:underline">
        <ArrowLeft size={15} /> Back to Services
      </Link>
      <h1 className="font-heading text-3xl text-secondary mb-6">{isNew ? 'New Service' : 'Edit Service'}</h1>

      <form onSubmit={handleSubmit} className="card-base bg-white p-7 max-w-2xl space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Title</label>
            <input required className={inputClass} value={form.title} onChange={handleChange('title')} />
          </div>
          <div>
            <label className={labelClass}>Slug (URL, unique)</label>
            <input required className={inputClass} value={form.slug} onChange={handleChange('slug')} placeholder="google-ads" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Icon</label>
          <select className={inputClass} value={form.icon} onChange={handleChange('icon')}>
            {Object.keys(ICONS).map((key) => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Short Description</label>
          <textarea required rows={2} className={`${inputClass} resize-none`} value={form.short_description} onChange={handleChange('short_description')} />
        </div>

        <div>
          <label className={labelClass}>Benefits (one per line)</label>
          <textarea rows={4} className={`${inputClass} resize-none`} value={form.benefits} onChange={handleChange('benefits')} />
        </div>

        <div>
          <label className={labelClass}>What We Provide (one per line)</label>
          <textarea rows={4} className={`${inputClass} resize-none`} value={form.features} onChange={handleChange('features')} />
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          <div>
            <label className={labelClass}>Price (numbers only, optional)</label>
            <input className={inputClass} value={form.price} onChange={handleChange('price')} placeholder="4999" />
          </div>
          <div>
            <label className={labelClass}>Original Price (optional)</label>
            <input className={inputClass} value={form.original_price} onChange={handleChange('original_price')} placeholder="9999" />
          </div>
          <div>
            <label className={labelClass}>Discount %</label>
            <input type="number" className={inputClass} value={form.discount_percent} onChange={handleChange('discount_percent')} placeholder="50" />
          </div>
        </div>
        <p className="text-[11px] text-muted normal-case -mt-3">Leave Price blank to show "Contact for Pricing" instead.</p>

        <div>
          <label className={labelClass}>CTA Text</label>
          <input required className={inputClass} value={form.cta} onChange={handleChange('cta')} placeholder="Start Google Ads Campaign" />
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
          {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : 'Save Service'}
        </button>
      </form>
    </div>
  );
}
