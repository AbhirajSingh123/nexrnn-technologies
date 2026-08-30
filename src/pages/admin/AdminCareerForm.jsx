import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Loader2, Heading2, Heading3, Bold, List, Quote } from 'lucide-react';
import { fetchAdminCareerById, saveCareer } from '@/data/careersRepo';
import { ADMIN_ROUTES } from '@/constants/adminRoutes';
import { slugify } from '@/utils/blogUtils';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const inputClass =
  'w-full border-2 border-secondary/20 focus:border-primary px-4 py-2.5 text-sm outline-none transition-colors bg-white';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-2';

const emptyForm = {
  title: '',
  slug: '',
  type: 'job',
  location: '',
  excerpt: '',
  content: '',
  fee_type: 'free',
  fee_amount: 0,
  last_date_apply: '',
  domain: '',
  start_date: '',
  end_date: '',
  duration: '',
  stipend_type: 'unpaid',
  stipend_text: '',
  is_published: true,
  published_at: new Date().toISOString().slice(0, 16),
};

export default function AdminCareerForm() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    const load = async () => {
      try {
        const data = await fetchAdminCareerById(id);
        if (!data) {
          toast.error('Opening not found.');
          navigate(ADMIN_ROUTES.careers);
          return;
        }
        setForm({
          ...emptyForm,
          title: data.title || '',
          slug: data.slug || '',
          type: data.type || 'job',
          location: data.location || '',
          excerpt: data.excerpt || '',
          content: data.content || '',
          fee_type: data.feeType || 'free',
          fee_amount: data.feeAmount || 0,
          last_date_apply: data.lastDateApply || '',
          domain: data.domain || '',
          start_date: data.startDate || '',
          end_date: data.endDate || '',
          duration: data.duration || '',
          stipend_type: data.stipendType || 'unpaid',
          stipend_text: data.stipendText || '',
          is_published: data.isPublished !== false,
          published_at: data.publishedAt
            ? new Date(data.publishedAt).toISOString().slice(0, 16)
            : '',
        });
      } catch {
        toast.error('Failed to load opening.');
        navigate(ADMIN_ROUTES.careers);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isNew, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'title' && (!prev.slug || prev.slug === slugify(prev.title))) {
        updated.slug = slugify(value);
      }
      // Free select karne par amount 0
      if (name === 'fee_type' && value === 'free') {
        updated.fee_amount = 0;
      }
      return updated;
    });
  };

  // Markdown toolbar: cursor position par tokens insert karo
  const contentRef = useRef(null);
  const insertMarkdown = (before, after = '', placeholder = '') => {
    const ta = contentRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? start;
    const selected = ta.value.slice(start, end) || placeholder;
    const next = ta.value.slice(0, start) + before + selected + after + ta.value.slice(end);
    setForm((prev) => ({ ...prev, content: next }));
    requestAnimationFrame(() => {
      ta.focus();
      const selStart = start + before.length;
      ta.setSelectionRange(selStart, selStart + selected.length);
    });
  };

  const mdButtons = [
    { icon: Heading2, label: 'Heading 2', title: '## Heading 2', run: () => insertMarkdown('\n## ', '', 'Section Heading') },
    { icon: Heading3, label: 'Heading 3', title: '### Sub Heading', run: () => insertMarkdown('\n### ', '', 'Sub Heading') },
    { icon: Bold, label: 'Bold', title: '**bold**', run: () => insertMarkdown('**', '**', 'bold text') },
    { icon: List, label: 'Bullet', title: '- bullet point', run: () => insertMarkdown('\n- ', '', 'detail point') },
    { icon: Quote, label: 'Quote', title: '> quote', run: () => insertMarkdown('\n> ', '', 'Important note') },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required.');
      return;
    }
    if (form.fee_type === 'paid' && (!Number(form.fee_amount) || Number(form.fee_amount) <= 0)) {
      toast.error('Enter a valid application fee amount (paid).');
      return;
    }
    if (form.type === 'internship' && !form.duration) {
      toast.error('Select the internship duration.');
      return;
    }
    if (form.type === 'internship' && form.stipend_type === 'paid' && !form.stipend_text.trim()) {
      toast.error('Write the stipend amount text (paid).');
      return;
    }
    setSaving(true);
    try {
      await saveCareer(form, isNew ? null : id);
      toast.success(isNew ? 'Opening created.' : 'Opening updated.');
      navigate(ADMIN_ROUTES.careers);
    } catch (err) {
      toast.error(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner className="min-h-[40vh]" />;

  return (
    <div>
      <Link
        to={ADMIN_ROUTES.careers}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-primary transition-colors mb-4"
      >
        <ArrowLeft size={14} /> Back to Careers
      </Link>
      <h1 className="font-heading text-3xl text-secondary mb-1">
        {isNew ? 'New Opening' : 'Edit Opening'}
      </h1>
      <p className="text-sm text-muted normal-case mb-6">
        Job or internship opening — published on the public Careers page.
      </p>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Left: main fields */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-base bg-white p-6 space-y-5">
            <div>
              <label className={labelClass}>Title *</label>
              <input name="title" value={form.title} onChange={handleChange} className={`${inputClass} normal-case`} placeholder="e.g. Digital Marketing Executive" required />
            </div>
            <div>
              <label className={labelClass}>Slug (URL)</label>
              <input name="slug" value={form.slug} onChange={handleChange} className={`${inputClass} normal-case font-mono text-xs`} placeholder="auto-generated from title" />
              <p className="mt-1.5 text-[11px] text-muted normal-case">/careers/{form.slug || 'your-slug'}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Type *</label>
                <select name="type" value={form.type} onChange={handleChange} className={`${inputClass} normal-case`}>
                  <option value="job">Job</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Location</label>
                <input name="location" value={form.location} onChange={handleChange} className={`${inputClass} normal-case`} placeholder="e.g. Lucknow (On-site) / Remote" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Excerpt (short summary)</label>
              <textarea name="excerpt" rows={3} value={form.excerpt} onChange={handleChange} className={`${inputClass} resize-none normal-case`} placeholder="2-3 line summary shown on the career card" />
            </div>
            <div>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <label className={`${labelClass} !mb-0`}>Full Details</label>
                <span className="text-[11px] text-muted normal-case">(Markdown supported)</span>
              </div>
              {/* Markdown toolbar */}
              <div className="flex items-center flex-wrap gap-1.5 mb-2">
                {mdButtons.map((btn) => (
                  <button
                    key={btn.label}
                    type="button"
                    onClick={btn.run}
                    title={btn.title}
                    className="inline-flex items-center gap-1.5 border-2 border-secondary/20 bg-white px-2.5 py-1.5 text-[11px] font-bold text-secondary hover:border-primary hover:text-primary transition-colors"
                  >
                    <btn.icon size={13} /> {btn.label}
                  </button>
                ))}
              </div>
              <textarea
                ref={contentRef}
                name="content"
                rows={14}
                value={form.content}
                onChange={handleChange}
                className={`${inputClass} resize-y normal-case font-mono text-xs leading-relaxed`}
                placeholder={'## About the Role\nRole ka overview...\n\n## Responsibilities\n- first responsibility\n- second responsibility\n\n## Requirements\n- requirement one\n\n## What You Get\n- benefit one'}
              />
              <p className="mt-1.5 text-[11px] text-muted normal-case">
                Supports <code className="bg-accent px-1">## Heading 2</code>,{' '}
                <code className="bg-accent px-1">### Heading 3</code>,{' '}
                <code className="bg-accent px-1">**bold**</code>,{' '}
                <code className="bg-accent px-1">- bullet points</code>,{' '}
                <code className="bg-accent px-1">&gt; quotes</code> — blank line = new paragraph.
              </p>
            </div>
          </div>
        </div>

        {/* Right: publish + fee box */}
        <div className="space-y-6 lg:sticky lg:top-6">
          <div className="card-base bg-white p-6 space-y-5">
            <h2 className="text-sm font-bold text-secondary uppercase tracking-wide">Application</h2>
            <div>
              <label className={labelClass}>Last Date to Apply</label>
              <input type="date" name="last_date_apply" value={form.last_date_apply} onChange={handleChange} className={inputClass} />
              <p className="mt-1.5 text-[11px] text-muted normal-case">Iske baad card par "Applications Closed" dikhega.</p>
            </div>
            <div>
              <label className={labelClass}>Application Fee *</label>
              <select name="fee_type" value={form.fee_type} onChange={handleChange} className={`${inputClass} normal-case`}>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            {form.fee_type === 'paid' && (
              <div>
                <label className={labelClass}>Fee Amount (₹) *</label>
                <input
                  type="number"
                  name="fee_amount"
                  min="1"
                  value={form.fee_amount || ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. 499"
                />
              </div>
            )}
            <div>
              <label className={labelClass}>Internship / Job Domain</label>
              <input name="domain" value={form.domain} onChange={handleChange} className={`${inputClass} normal-case`} list="domain-suggestions" placeholder="e.g. Web Development Intern" />
              <datalist id="domain-suggestions">
                {['Web Development Intern', 'Social Media Intern', 'Digital Marketing Intern', 'Business Development Intern', 'Sales Intern', 'Content Writing Intern', 'Growth Intern', 'Graphic Design Intern', 'Campus Ambassador'].map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
              <p className="mt-1.5 text-[11px] text-muted normal-case">Applicants ke form par yehi domain fixed dikhega.</p>
            </div>
            {form.type === 'internship' && (
              <div>
                <label className={labelClass}>Internship Duration *</label>
                <select name="duration" value={form.duration} onChange={handleChange} className={`${inputClass} normal-case`}>
                  <option value="">Select duration</option>
                  <option value="1 Month">1 Month</option>
                  <option value="2 Months">2 Months</option>
                  <option value="3 Months">3 Months</option>
                  <option value="6 Months">6 Months</option>
                </select>
                <p className="mt-1.5 text-[11px] text-muted normal-case">Applicants ke form par yeh duration fixed dikhega (not editable).</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Start Date</label>
                <input type="date" name="start_date" value={form.start_date} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>End Date</label>
                <input type="date" name="end_date" value={form.end_date} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </div>

          {form.type === 'internship' && (
            <div className="card-base bg-white p-6 space-y-5">
              <h2 className="text-sm font-bold text-secondary uppercase tracking-wide">Internship Stipend</h2>
              <div>
                <label className={labelClass}>Stipend Type *</label>
                <select name="stipend_type" value={form.stipend_type} onChange={handleChange} className={`${inputClass} normal-case`}>
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              {form.stipend_type === 'paid' && (
                <div>
                  <label className={labelClass}>Stipend (text) *</label>
                  <input name="stipend_text" value={form.stipend_text} onChange={handleChange} className={`${inputClass} normal-case`} placeholder="e.g. ₹5,000/month or ₹15,000 for 3 months" />
                </div>
              )}
            </div>
          )}

          <div className="card-base bg-white p-6 space-y-5">
            <h2 className="text-sm font-bold text-secondary uppercase tracking-wide">Publish</h2>
            <label className="flex items-center justify-between">
              <span className="text-sm font-semibold text-secondary">Published</span>
              <input type="checkbox" name="is_published" checked={form.is_published} onChange={handleChange} className="w-5 h-5 accent-primary" />
            </label>
            <div>
              <label className={labelClass}>Published Date</label>
              <input type="datetime-local" name="published_at" value={form.published_at} onChange={handleChange} className={inputClass} />
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-60">
              {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : isNew ? 'Create Opening' : 'Update Opening'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
