import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Loader2, Plus, Trash2, UploadCloud } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { ADMIN_ROUTES } from '@/constants/adminRoutes';
import { ICONS } from '@/utils/iconMap';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const inputClass = 'w-full border-2 border-secondary/20 focus:border-primary px-4 py-2.5 text-sm outline-none transition-colors bg-white';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-2';

const emptyForm = {
  slug: '', icon: 'sparkles', title: '', short_description: '', duration: '', level: '', mode: '',
  original_price: '', price: '', discount_percent: '', is_demo_price: true, demo_video_url: '',
  has_certificate_sample: true, projects: 0, certificate: true, mentorship: true,
  topics: '', what_you_learn: '', who_should_join: '', qr_code_url: '', active: true, sort_order: 0,
};

export default function AdminCourseForm() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [faqs, setFaqs] = useState([{ q: '', a: '' }]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isNew) return;
    const load = async () => {
      const { data, error } = await supabase.from('courses').select('*').eq('id', id).maybeSingle();
      if (error || !data) {
        toast.error('Course not found.');
        navigate(ADMIN_ROUTES.courses);
        return;
      }
      setForm({
        ...data,
        discount_percent: data.discount_percent ?? '',
        topics: (data.topics ?? []).join('\n'),
        what_you_learn: (data.what_you_learn ?? []).join('\n'),
        who_should_join: (data.who_should_join ?? []).join('\n'),
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

  const handleQrUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileName = `qr-${form.slug || 'course'}-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('course-assets').upload(fileName, file, { upsert: true });
    if (error) {
      toast.error(error.message || 'Upload failed.');
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('course-assets').getPublicUrl(fileName);
    setForm((f) => ({ ...f, qr_code_url: data.publicUrl }));
    setUploading(false);
    toast.success('QR code uploaded.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      slug: form.slug.trim(),
      icon: form.icon.trim() || 'sparkles',
      title: form.title.trim(),
      short_description: form.short_description.trim(),
      duration: form.duration.trim(),
      level: form.level.trim(),
      mode: form.mode.trim(),
      original_price: form.original_price.trim(),
      price: form.price.trim(),
      discount_percent: form.discount_percent === '' ? null : Number(form.discount_percent),
      is_demo_price: form.is_demo_price,
      demo_video_url: form.demo_video_url.trim(),
      has_certificate_sample: form.has_certificate_sample,
      projects: Number(form.projects) || 0,
      certificate: form.certificate,
      mentorship: form.mentorship,
      topics: form.topics.split('\n').map((s) => s.trim()).filter(Boolean),
      what_you_learn: form.what_you_learn.split('\n').map((s) => s.trim()).filter(Boolean),
      who_should_join: form.who_should_join.split('\n').map((s) => s.trim()).filter(Boolean),
      faqs: faqs.filter((f) => f.q.trim() && f.a.trim()),
      qr_code_url: form.qr_code_url,
      active: form.active,
      sort_order: Number(form.sort_order) || 0,
    };

    const { error } = isNew
      ? await supabase.from('courses').insert(payload)
      : await supabase.from('courses').update(payload).eq('id', id);

    setSaving(false);

    if (error) {
      toast.error(error.message || 'Save failed.');
      return;
    }
    toast.success(isNew ? 'Course created.' : 'Course updated.');
    navigate(ADMIN_ROUTES.courses);
  };

  if (loading) return <LoadingSpinner className="min-h-[40vh]" />;

  return (
    <div>
      <Link to={ADMIN_ROUTES.courses} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary mb-4 hover:underline">
        <ArrowLeft size={15} /> Back to Courses
      </Link>
      <h1 className="font-heading text-3xl text-secondary mb-6">{isNew ? 'New Course' : 'Edit Course'}</h1>

      <form onSubmit={handleSubmit} className="card-base bg-white p-7 max-w-2xl space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Title</label>
            <input required className={inputClass} value={form.title} onChange={handleChange('title')} />
          </div>
          <div>
            <label className={labelClass}>Slug (URL, unique)</label>
            <input required className={inputClass} value={form.slug} onChange={handleChange('slug')} placeholder="digital-marketing" />
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

        <div className="grid sm:grid-cols-3 gap-5">
          <div>
            <label className={labelClass}>Duration</label>
            <input className={inputClass} value={form.duration} onChange={handleChange('duration')} placeholder="3 Months" />
          </div>
          <div>
            <label className={labelClass}>Level</label>
            <input className={inputClass} value={form.level} onChange={handleChange('level')} placeholder="Beginner to Advanced" />
          </div>
          <div>
            <label className={labelClass}>Mode</label>
            <input className={inputClass} value={form.mode} onChange={handleChange('mode')} placeholder="Online / Offline" />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          <div>
            <label className={labelClass}>Original Price</label>
            <input className={inputClass} value={form.original_price} onChange={handleChange('original_price')} placeholder="₹9,999" />
          </div>
          <div>
            <label className={labelClass}>Final Price</label>
            <input className={inputClass} value={form.price} onChange={handleChange('price')} placeholder="₹4,999" />
          </div>
          <div>
            <label className={labelClass}>Discount %</label>
            <input type="number" className={inputClass} value={form.discount_percent} onChange={handleChange('discount_percent')} placeholder="50" />
          </div>
        </div>

        <label className="flex items-center gap-2.5">
          <input type="checkbox" className="w-4 h-4 accent-primary" checked={form.is_demo_price} onChange={handleChange('is_demo_price')} />
          <span className="text-sm font-semibold text-secondary">Show "Demo pricing" label</span>
        </label>

        <div>
          <label className={labelClass}>Demo Video URL (YouTube)</label>
          <input className={inputClass} value={form.demo_video_url} onChange={handleChange('demo_video_url')} placeholder="https://youtube.com/watch?v=..." />
        </div>

        <div>
          <label className={labelClass}>Payment QR Code</label>
          {form.qr_code_url && (
            <img src={form.qr_code_url} alt="Current QR code" className="w-28 h-28 object-contain border-2 border-secondary/15 mb-3" />
          )}
          <label className="flex items-center gap-3 border-2 border-dashed border-secondary/25 px-4 py-3 text-sm text-muted cursor-pointer hover:border-primary transition-colors w-fit">
            <UploadCloud size={17} className="text-primary shrink-0" />
            {uploading ? 'Uploading…' : 'Upload QR code image'}
            <input type="file" accept="image/*" className="hidden" onChange={handleQrUpload} disabled={uploading} />
          </label>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          <div>
            <label className={labelClass}>Projects</label>
            <input type="number" className={inputClass} value={form.projects} onChange={handleChange('projects')} />
          </div>
          <label className="flex items-center gap-2.5 pt-7">
            <input type="checkbox" className="w-4 h-4 accent-primary" checked={form.certificate} onChange={handleChange('certificate')} />
            <span className="text-sm font-semibold text-secondary">Certificate</span>
          </label>
          <label className="flex items-center gap-2.5 pt-7">
            <input type="checkbox" className="w-4 h-4 accent-primary" checked={form.mentorship} onChange={handleChange('mentorship')} />
            <span className="text-sm font-semibold text-secondary">Mentorship</span>
          </label>
        </div>

        <label className="flex items-center gap-2.5">
          <input type="checkbox" className="w-4 h-4 accent-primary" checked={form.has_certificate_sample} onChange={handleChange('has_certificate_sample')} />
          <span className="text-sm font-semibold text-secondary">Show certificate sample preview</span>
        </label>

        <div>
          <label className={labelClass}>Topics / Curriculum (one per line)</label>
          <textarea rows={4} className={`${inputClass} resize-none`} value={form.topics} onChange={handleChange('topics')} />
        </div>

        <div>
          <label className={labelClass}>What You&rsquo;ll Learn (one per line)</label>
          <textarea rows={4} className={`${inputClass} resize-none`} value={form.what_you_learn} onChange={handleChange('what_you_learn')} />
        </div>

        <div>
          <label className={labelClass}>Who Should Join (one per line)</label>
          <textarea rows={3} className={`${inputClass} resize-none`} value={form.who_should_join} onChange={handleChange('who_should_join')} />
        </div>

        <div>
          <label className={labelClass}>FAQs</label>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border-2 border-secondary/15 p-3 space-y-2">
                <input
                  className={inputClass}
                  placeholder="Question"
                  value={faq.q}
                  onChange={(e) => handleFaqChange(i, 'q', e.target.value)}
                />
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={2}
                  placeholder="Answer"
                  value={faq.a}
                  onChange={(e) => handleFaqChange(i, 'a', e.target.value)}
                />
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
          {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : 'Save Course'}
        </button>
      </form>
    </div>
  );
}
