import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Loader2, UploadCloud } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { ADMIN_ROUTES } from '@/constants/adminRoutes';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const inputClass = 'w-full border-2 border-secondary/20 focus:border-primary px-4 py-2.5 text-sm outline-none transition-colors bg-white';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-2';
const CATEGORIES = ['Website', 'Ads', 'Branding', 'Other'];

const emptyForm = { image_url: '', category: 'Website', project_name: '', short_description: '', active: true, sort_order: 0 };

export default function AdminPortfolioForm() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isNew) return;
    const load = async () => {
      const { data, error } = await supabase.from('portfolio').select('*').eq('id', id).maybeSingle();
      if (error || !data) {
        toast.error('Portfolio item not found.');
        navigate(ADMIN_ROUTES.portfolio);
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

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileName = `portfolio-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('portfolio-assets').upload(fileName, file, { upsert: true });
    if (error) {
      toast.error(error.message || 'Upload failed.');
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('portfolio-assets').getPublicUrl(fileName);
    setForm((f) => ({ ...f, image_url: data.publicUrl }));
    setUploading(false);
    toast.success('Image uploaded.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      image_url: form.image_url,
      category: form.category,
      project_name: form.project_name.trim(),
      short_description: form.short_description.trim(),
      active: form.active,
      sort_order: Number(form.sort_order) || 0,
    };

    const { error } = isNew
      ? await supabase.from('portfolio').insert(payload)
      : await supabase.from('portfolio').update(payload).eq('id', id);

    setSaving(false);

    if (error) {
      toast.error(error.message || 'Save failed.');
      return;
    }
    toast.success(isNew ? 'Portfolio item created.' : 'Portfolio item updated.');
    navigate(ADMIN_ROUTES.portfolio);
  };

  if (loading) return <LoadingSpinner className="min-h-[40vh]" />;

  return (
    <div>
      <Link to={ADMIN_ROUTES.portfolio} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary mb-4 hover:underline">
        <ArrowLeft size={15} /> Back to Portfolio
      </Link>
      <h1 className="font-heading text-3xl text-secondary mb-6">{isNew ? 'New Portfolio Project' : 'Edit Portfolio Project'}</h1>

      <form onSubmit={handleSubmit} className="card-base bg-white p-7 max-w-xl space-y-5">
        <div>
          <label className={labelClass}>Project Image</label>
          {form.image_url && (
            <img src={form.image_url} alt="Current" className="w-full aspect-video object-cover border-2 border-secondary/15 mb-3" />
          )}
          <label className="flex items-center gap-3 border-2 border-dashed border-secondary/25 px-4 py-3 text-sm text-muted cursor-pointer hover:border-primary transition-colors w-fit">
            <UploadCloud size={17} className="text-primary shrink-0" />
            {uploading ? 'Uploading…' : 'Upload image'}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
          </label>
        </div>

        <div>
          <label className={labelClass}>Category</label>
          <select className={inputClass} value={form.category} onChange={handleChange('category')}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Project Name</label>
          <input required className={inputClass} value={form.project_name} onChange={handleChange('project_name')} />
        </div>

        <div>
          <label className={labelClass}>Short Description</label>
          <textarea rows={3} className={`${inputClass} resize-none`} value={form.short_description} onChange={handleChange('short_description')} />
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
          {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : 'Save Project'}
        </button>
      </form>
    </div>
  );
}
