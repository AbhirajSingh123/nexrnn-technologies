import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Loader2, UploadCloud, X, Heading2, Heading3, Bold, List, Quote } from 'lucide-react';
import {
  fetchAdminCaseStudyById,
  saveCaseStudy,
  uploadCaseStudyImage,
} from '@/data/caseStudiesRepo';
import { ADMIN_ROUTES } from '@/constants/adminRoutes';
import { slugify } from '@/utils/blogUtils';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const inputClass =
  'w-full border-2 border-secondary/20 focus:border-primary px-4 py-2.5 text-sm outline-none transition-colors bg-white';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-2';

const emptyForm = {
  title: '',
  slug: '',
  client_name: '',
  industry: '',
  excerpt: '',
  content: '',
  cover_image_url: '',
  tags: '',
  is_published: true,
  published_at: new Date().toISOString().slice(0, 16),
};

export default function AdminCaseStudyForm() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [form.cover_image_url]);

  useEffect(() => {
    if (isNew) return;
    const load = async () => {
      try {
        const data = await fetchAdminCaseStudyById(id);
        if (!data) {
          toast.error('Case study not found.');
          navigate(ADMIN_ROUTES.caseStudies);
          return;
        }
        setForm({
          ...emptyForm,
          title: data.title || '',
          slug: data.slug || '',
          client_name: data.clientName || '',
          industry: data.industry || '',
          excerpt: data.excerpt || '',
          content: data.content || '',
          cover_image_url: data.coverImageUrl || '',
          tags: Array.isArray(data.tags) ? data.tags.join(', ') : data.tags || '',
          is_published: data.isPublished !== false,
          published_at: data.publishedAt
            ? new Date(data.publishedAt).toISOString().slice(0, 16)
            : '',
        });
      } catch {
        toast.error('Failed to load case study.');
        navigate(ADMIN_ROUTES.caseStudies);
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
      // Title se slug auto-generate (jab admin ne khud set nahi kiya)
      if (name === 'title' && (!prev.slug || prev.slug === slugify(prev.title))) {
        updated.slug = slugify(value);
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
    { icon: List, label: 'Bullet', title: '- bullet point', run: () => insertMarkdown('\n- ', '', 'bullet point') },
    { icon: Quote, label: 'Quote', title: '> quote', run: () => insertMarkdown('\n> ', '', 'Important highlight line') },
  ];

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadCaseStudyImage(file);
      setForm((prev) => ({ ...prev, cover_image_url: url }));
      toast.success('Cover image uploaded.');
    } catch (err) {
      toast.error(err.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required.');
      return;
    }
    setSaving(true);
    try {
      await saveCaseStudy(form, isNew ? null : id);
      toast.success(isNew ? 'Case study created.' : 'Case study updated.');
      navigate(ADMIN_ROUTES.caseStudies);
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
        to={ADMIN_ROUTES.caseStudies}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-primary transition-colors mb-4"
      >
        <ArrowLeft size={14} /> Back to Case Studies
      </Link>
      <h1 className="font-heading text-3xl text-secondary mb-1">
        {isNew ? 'New Case Study' : 'Edit Case Study'}
      </h1>
      <p className="text-sm text-muted normal-case mb-6">
        Client success story — published on the public Case Studies page.
      </p>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Left: main fields */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-base bg-white p-6 space-y-5">
            <div>
              <label className={labelClass}>Title *</label>
              <input name="title" value={form.title} onChange={handleChange} className={`${inputClass} normal-case`} placeholder="How we 3x'd leads for a real estate firm" required />
            </div>
            <div>
              <label className={labelClass}>Slug (URL) — Auto-generate from Title</label>
              <div className="flex items-center gap-2">
                <input name="slug" value={form.slug} onChange={handleChange} className={`${inputClass} normal-case font-mono text-xs`} placeholder="auto-generated from title" />
                <button type="button" title="Auto-generate from Title" onClick={() => setForm((f) => ({ ...f, slug: slugify(f.title) }))} className="shrink-0 border-2 border-secondary/20 bg-white px-3 py-2.5 text-xs font-bold text-secondary hover:border-primary hover:text-primary transition-colors">
                  Auto
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-muted normal-case">/case-studies/{form.slug || 'your-slug'}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Client Name</label>
                <input name="client_name" value={form.client_name} onChange={handleChange} className={`${inputClass} normal-case`} placeholder="e.g. Shree Residency Group" />
              </div>
              <div>
                <label className={labelClass}>Industry</label>
                <input name="industry" value={form.industry} onChange={handleChange} className={`${inputClass} normal-case`} placeholder="e.g. Real Estate, E-commerce" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Excerpt (short summary)</label>
              <textarea name="excerpt" rows={3} value={form.excerpt} onChange={handleChange} className={`${inputClass} resize-none normal-case`} placeholder="2-3 line summary shown on cards and search results" />
            </div>
            <div>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <label className={`${labelClass} !mb-0`}>Full Story</label>
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
                rows={16}
                value={form.content}
                onChange={handleChange}
                className={`${inputClass} resize-y normal-case font-mono text-xs leading-relaxed`}
                placeholder={'## The Background\nWrite the client background here...\n\n## The Challenge\n...\n\n## What We Did\n- first step\n- second step\n\n## The Results\nLeads grew **3x** in 90 days.\n\n> Key takeaway in one line.'}
              />
              <p className="mt-1.5 text-[11px] text-muted normal-case">
                Supports <code className="bg-accent px-1">## Heading 2</code>,{' '}
                <code className="bg-accent px-1">### Heading 3</code>,{' '}
                <code className="bg-accent px-1">**bold**</code>,{' '}
                <code className="bg-accent px-1">- bullet points</code>,{' '}
                <code className="bg-accent px-1">&gt; quotes</code> — blank line = new paragraph. Upar
                select some text and click a button to format it automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Right: publish box */}
        <div className="space-y-6 lg:sticky lg:top-6">
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
              {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : isNew ? 'Create Case Study' : 'Update Case Study'}
            </button>
          </div>

          <div className="card-base bg-white p-6 space-y-5">
            <h2 className="text-sm font-bold text-secondary uppercase tracking-wide">Cover Image</h2>
            {form.cover_image_url && !imgError && (
              <div className="relative">
                <img src={form.cover_image_url} alt="Cover preview" className="w-full border-2 border-secondary/15" onError={() => setImgError(true)} />
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, cover_image_url: '' }))}
                  className="absolute top-2 right-2 bg-white border-2 border-secondary/20 p-1 hover:border-primary transition-colors"
                  title="Remove image"
                >
                  <X size={13} />
                </button>
              </div>
            )}
            <label className="flex items-center gap-3 border-2 border-dashed border-secondary/25 px-4 py-3 text-sm text-muted cursor-pointer hover:border-primary transition-colors">
              <UploadCloud size={17} className="text-primary shrink-0" />
              {uploadingImage ? 'Uploading…' : 'Upload cover image'}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
            </label>
            <div>
              <label className={labelClass}>…or paste image URL</label>
              <input name="cover_image_url" value={form.cover_image_url} onChange={handleChange} className={`${inputClass} normal-case text-xs`} placeholder="https://…" />
            </div>
          </div>

          <div className="card-base bg-white p-6">
            <h2 className="text-sm font-bold text-secondary uppercase tracking-wide mb-4">Tags</h2>
            <input name="tags" value={form.tags} onChange={handleChange} className={`${inputClass} normal-case`} placeholder="Google Ads, Real Estate" />
            <p className="mt-1.5 text-[11px] text-muted normal-case">Comma separated, e.g. SEO, Education</p>
          </div>
        </div>
      </form>
    </div>
  );
}
