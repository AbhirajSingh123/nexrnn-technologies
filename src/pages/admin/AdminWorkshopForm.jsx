import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Loader2, Plus, Trash2, UploadCloud } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { ADMIN_ROUTES } from '@/constants/adminRoutes';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const inputClass = 'w-full border-2 border-secondary/20 focus:border-primary px-4 py-2.5 text-sm outline-none transition-colors bg-white';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-2';

const emptyForm = {
  slug: '', banner_url: '', title: '', short_description: '', workshop_datetime: '', registration_deadline: '',
  details: '', is_free: false, original_price: '', price: '', discount_percent: '', is_demo_price: true, demo_video_url: '',
  has_certificate_sample: true, whatsapp_group_link: '', mentor_name: '', mentor_intro: '', active: true, sort_order: 0,
};

function toLocalInputValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminWorkshopForm() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [faqs, setFaqs] = useState([{ q: '', a: '' }]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isNew) return;
    const load = async () => {
      const { data, error } = await supabase.from('workshops').select('*').eq('id', id).maybeSingle();
      if (error || !data) {
        toast.error('Workshop not found.');
        navigate(ADMIN_ROUTES.workshops);
        return;
      }
      setForm({
        ...data,
        discount_percent: data.discount_percent ?? '',
        workshop_datetime: toLocalInputValue(data.workshop_datetime),
        registration_deadline: toLocalInputValue(data.registration_deadline),
      });
      setFaqs(data.faqs?.length ? data.faqs.map((f) => ({ q: f.q, a: f.a })) : [{ q: '', a: '' }]);
      setLoading(false);
    };
    load();
  }, [id, isNew, navigate]);

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleFaqChange = (index, field, value) => {
    setFaqs((prev) => prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)));
  };
  const addFaq = () => setFaqs((prev) => [...prev, { q: '', a: '' }]);
  const removeFaq = (index) => setFaqs((prev) => prev.filter((_, i) => i !== index));

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileName = `banner-${form.slug || 'workshop'}-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('workshop-assets').upload(fileName, file, { upsert: true });
    if (error) {
      toast.error(error.message || 'Upload failed.');
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('workshop-assets').getPublicUrl(fileName);
    setForm((f) => ({ ...f, banner_url: data.publicUrl }));
    setUploading(false);
    toast.success('Banner uploaded.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      slug: form.slug.trim(),
      banner_url: form.banner_url,
      title: form.title.trim(),
      short_description: form.short_description.trim(),
      workshop_datetime: form.workshop_datetime ? new Date(form.workshop_datetime).toISOString() : null,
      registration_deadline: form.registration_deadline ? new Date(form.registration_deadline).toISOString() : null,
      details: form.details.trim(),
      is_free: form.is_free,
      original_price: form.original_price.trim(),
      price: form.price.trim(),
      discount_percent: form.discount_percent === '' ? null : Number(form.discount_percent),
      is_demo_price: form.is_demo_price,
      demo_video_url: form.demo_video_url.trim(),
      has_certificate_sample: form.has_certificate_sample,
      faqs: faqs.filter((f) => f.q.trim() && f.a.trim()),
      whatsapp_group_link: form.whatsapp_group_link.trim(),
      mentor_name: form.mentor_name.trim(),
      mentor_intro: form.mentor_intro.trim(),
      active: form.active,
      sort_order: Number(form.sort_order) || 0,
    };

    const { error } = isNew
      ? await supabase.from('workshops').insert(payload)
      : await supabase.from('workshops').update(payload).eq('id', id);

    setSaving(false);

    if (error) {
      toast.error(error.message || 'Save failed.');
      return;
    }
    toast.success(isNew ? 'Workshop created.' : 'Workshop updated.');
    navigate(ADMIN_ROUTES.workshops);
  };

  if (loading) return <LoadingSpinner className="min-h-[40vh]" />;

  return (
    <div>
      <Link to={ADMIN_ROUTES.workshops} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary mb-4 hover:underline">
        <ArrowLeft size={15} /> Back to Workshops
      </Link>
      <h1 className="font-heading text-3xl text-secondary mb-6">{isNew ? 'New Workshop' : 'Edit Workshop'}</h1>

      <form onSubmit={handleSubmit} className="card-base bg-white p-7 max-w-2xl space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Title</label>
            <input required className={inputClass} value={form.title} onChange={handleChange('title')} />
          </div>
          <div>
            <label className={labelClass}>Slug (URL, unique)</label>
            <input required className={inputClass} value={form.slug} onChange={handleChange('slug')} placeholder="react-in-a-day" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Workshop Banner</label>
          {form.banner_url && (
            <img src={form.banner_url} alt="Current banner" className="w-full aspect-video object-cover border-2 border-secondary/15 mb-3" />
          )}
          <label className="flex items-center gap-3 border-2 border-dashed border-secondary/25 px-4 py-3 text-sm text-muted cursor-pointer hover:border-primary transition-colors w-fit">
            <UploadCloud size={17} className="text-primary shrink-0" />
            {uploading ? 'Uploading…' : 'Upload banner image'}
            <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} disabled={uploading} />
          </label>
        </div>

        <div>
          <label className={labelClass}>Short Description</label>
          <textarea required rows={2} className={`${inputClass} resize-none`} value={form.short_description} onChange={handleChange('short_description')} />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Workshop Date &amp; Time</label>
            <input type="datetime-local" className={inputClass} value={form.workshop_datetime} onChange={handleChange('workshop_datetime')} />
          </div>
          <div>
            <label className={labelClass}>Registration Deadline</label>
            <input type="datetime-local" className={inputClass} value={form.registration_deadline} onChange={handleChange('registration_deadline')} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Details About Workshop</label>
          <textarea rows={5} className={`${inputClass} resize-none`} value={form.details} onChange={handleChange('details')} />
        </div>

        <div className="card-base bg-accent p-5">
          <label className={labelClass}>Pricing Type</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, is_free: false }))}
              className={`flex-1 py-3 text-sm font-bold border-2 transition-colors ${!form.is_free ? 'bg-primary text-white border-secondary' : 'bg-white text-secondary border-secondary/20'}`}
            >
              Paid Workshop
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, is_free: true }))}
              className={`flex-1 py-3 text-sm font-bold border-2 transition-colors ${form.is_free ? 'bg-green-600 text-white border-secondary' : 'bg-white text-secondary border-secondary/20'}`}
            >
              Free Workshop
            </button>
          </div>
          {form.is_free && (
            <p className="text-[11px] text-muted normal-case mt-3">
              Free workshops skip the payment gateway entirely — students register directly.
            </p>
          )}
        </div>

        {!form.is_free && (
          <div className="grid sm:grid-cols-3 gap-5">
            <div>
              <label className={labelClass}>Original Price (numbers only)</label>
              <input className={inputClass} value={form.original_price} onChange={handleChange('original_price')} placeholder="1999" />
            </div>
            <div>
              <label className={labelClass}>Offer Price (numbers only)</label>
              <input className={inputClass} value={form.price} onChange={handleChange('price')} placeholder="999" />
            </div>
            <div>
              <label className={labelClass}>Discount %</label>
              <input type="number" className={inputClass} value={form.discount_percent} onChange={handleChange('discount_percent')} placeholder="50" />
            </div>
          </div>
        )}

        <label className="flex items-center gap-2.5">
          <input type="checkbox" className="w-4 h-4 accent-primary" checked={form.is_demo_price} onChange={handleChange('is_demo_price')} />
          <span className="text-sm font-semibold text-secondary">Show "Demo pricing" label</span>
        </label>

        <div>
          <label className={labelClass}>Workshop Video URL (YouTube)</label>
          <input className={inputClass} value={form.demo_video_url} onChange={handleChange('demo_video_url')} placeholder="https://youtube.com/watch?v=..." />
        </div>

        <label className="flex items-center gap-2.5">
          <input type="checkbox" className="w-4 h-4 accent-primary" checked={form.has_certificate_sample} onChange={handleChange('has_certificate_sample')} />
          <span className="text-sm font-semibold text-secondary">Show certificate sample preview</span>
        </label>

        <div>
          <label className={labelClass}>WhatsApp Group Link</label>
          <input className={inputClass} value={form.whatsapp_group_link} onChange={handleChange('whatsapp_group_link')} placeholder="https://chat.whatsapp.com/..." />
          <p className="mt-1.5 text-[11px] text-muted normal-case">Shown to the student on the payment success page after they enroll and pay.</p>
        </div>

        <div className="card-base bg-accent p-5 space-y-4">
          <p className="text-sm font-bold text-secondary normal-case">Mentor Section</p>
          <div>
            <label className={labelClass}>Mentor Name</label>
            <input className={inputClass} value={form.mentor_name} onChange={handleChange('mentor_name')} placeholder="e.g. Priya Sharma" />
          </div>
          <div>
            <label className={labelClass}>Short Introduction</label>
            <textarea rows={3} className={`${inputClass} resize-none`} value={form.mentor_intro} onChange={handleChange('mentor_intro')} placeholder="A short bio about the mentor..." />
          </div>
          <p className="text-[11px] text-muted normal-case">Leave the mentor name blank to hide this section on the workshop page.</p>
        </div>

        <div>
          <label className={labelClass}>FAQs</label>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border-2 border-secondary/15 p-3 space-y-2">
                <input className={inputClass} placeholder="Question" value={faq.q} onChange={(e) => handleFaqChange(i, 'q', e.target.value)} />
                <textarea className={`${inputClass} resize-none`} rows={2} placeholder="Answer" value={faq.a} onChange={(e) => handleFaqChange(i, 'a', e.target.value)} />
                {faqs.length > 1 && (
                  <button type="button" onClick={() => removeFaq(i)} className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                    <Trash2 size={13} /> Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addFaq} className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            <Plus size={15} /> Add FAQ
          </button>
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
          {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : 'Save Workshop'}
        </button>
      </form>
    </div>
  );
}
