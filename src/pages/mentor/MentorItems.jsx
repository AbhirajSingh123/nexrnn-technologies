/**
 * Assigned courses/workshops — view + add + edit (sirf apne programs).
 * Students/price/duration mentor-data fn se (batch_id + slug se leads match).
 */
import { useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { Loader2, Plus, Pencil, X, Info } from 'lucide-react';
import useMentorData, { inr } from '@/hooks/useMentorData';
import { mentorData } from '@/data/mentorAuth';
import { MENTOR_ROUTES } from '@/constants/mentorRoutes';
import { useNavigate, Navigate } from 'react-router-dom';
import { useMentorAuth } from '@/contexts/MentorAuthContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import AdminFilterBar from '@/components/admin/AdminFilterBar';
import AdminTable from '@/components/admin/AdminTable';
import AdminLoadMore from '@/components/admin/AdminLoadMore';
import { useLoadMore } from '@/hooks/useLoadMore';
import { ICONS } from '@/utils/iconMap';
import { slugify } from '@/utils/blogUtils';

const inputClass =
  'w-full border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white normal-case';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-1.5';

export default function MentorItems({ kind = 'course' }) {
  const isWorkshop = kind === 'workshop';
  const title = isWorkshop ? 'Manage Workshops' : 'Manage Courses';
  const navigate = useNavigate();
  const { mentor } = useMentorAuth();
  // Type guard: workshop-only mentor /courses khol bhi le to seedha dashboard par bhejo
  const mentorKind = mentor?.mentorType || 'both';
  const kindAllowed = mentorKind === 'both' || mentorKind === kind;
  const { data, error, loading } = useMentorData('items', { kind });

  const [search, setSearch] = useState('');
  const [form, setForm] = useState(null); // {mode:'add'|'edit', item?}
  const rows = useMemo(() => data?.rows ?? [], [data]);

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [r.title, r.batchId, r.status].join(' ').toLowerCase().includes(q);
  }), [rows, search]);

  const { visibleItems, hasMore, loadMore, total, shown } = useLoadMore(filtered, search);

  // Direct URL access band: is kind ka access hi nahi to dashboard par bhejo
  if (!kindAllowed) {
    return (
      <Navigate to={MENTOR_ROUTES.dashboard} replace />
    );
  }

  const columns = [
    { key: 'title', label: isWorkshop ? 'Workshop' : 'Course', render: (r) => <span className="font-semibold text-secondary">{r.title || '—'}</span> },
    { key: 'batchId', label: 'Batch ID', render: (r) => <span className="font-mono text-xs">{r.batchId || '—'}</span> },
    { key: 'price', label: 'Price', render: (r) => inr(r.price) },
    { key: 'duration', label: isWorkshop ? 'Date & Time' : 'Duration', render: (r) => r.duration || '—' },
    { key: 'students', label: 'Students' },
    { key: 'status', label: 'Status', render: (r) => <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 border-2 whitespace-nowrap ${r.status === 'Active' ? 'border-green-300 bg-green-50 text-green-700' : 'border-secondary/30 bg-accent text-secondary'}`}>{r.status}</span> },
    {
      key: 'edit',
      label: 'Edit',
      render: (r) => (
        <button onClick={() => setForm({ mode: 'edit', item: r })} className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
          <Pencil size={12} /> Edit
        </button>
      ),
    },
    {
      key: 'public',
      label: 'Public Page',
      render: (r) => r.slug ? (
        <a href={`/${isWorkshop ? 'workshop' : 'course'}/${r.slug}`} onClick={(e) => { e.preventDefault(); window.open(`${window.location.origin}/${isWorkshop ? 'workshop' : 'course'}/${r.slug}`, '_blank', 'noopener'); }} className="text-xs font-bold text-primary hover:underline" title="How this program appears to visitors on the website">
          View &rarr;
        </a>
      ) : '—',
    },
  ];

  const openAdd = () => setForm({ mode: 'add', item: null });

  return (
    <div>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      <div className="flex items-center justify-between gap-4 mb-1">
        <h1 className="font-heading text-3xl text-secondary">{title}</h1>
        {kindAllowed && (
          <button onClick={openAdd} className="btn-primary inline-flex items-center gap-2 shrink-0">
            <Plus size={15} /> Add {isWorkshop ? 'Workshop' : 'Course'}
          </button>
        )}
      </div>
      <p className="text-sm text-muted normal-case mb-6">
        Programs assigned to you — students, registrations and commission all come from here. Public Page = how this program appears to visitors on the website.
      </p>

      <AdminFilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search title, batch ID…" />

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-primary normal-case">{error}</p>
      ) : filtered.length === 0 ? (
        <div className="card-base bg-white p-10 text-center">
          <p className="text-sm text-muted normal-case mb-4">No {isWorkshop ? 'workshops' : 'courses'} assigned yet — add your first program or ask the admin to assign one.</p>
        </div>
      ) : (
        <>
          <AdminTable columns={columns} rows={visibleItems} />
          <AdminLoadMore shown={shown} total={total} hasMore={hasMore} onLoadMore={loadMore} />
        </>
      )}

      {form && (
        <ItemForm
          kind={kind}
          mode={form.mode}
          item={form.item}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            navigate(0); // list refresh (data dobara fetch)
          }}
        />
      )}
    </div>
  );
}

/** Add/Edit form modal — ADMIN jaisa full form (saare fields mentor-data whitelist me hain) */
function ItemForm({ kind, mode, item, onClose, onSaved }) {
  const isWorkshop = kind === 'workshop';
  const it = item || {};
  const [f, setF] = useState({
    title: it.title || '',
    slug: it.slug || '',
    icon: it.icon || 'sparkles',
    short_description: it.shortDescription || '',
    is_free: it.isFree !== false && (it.price ?? 0) === 0 ? (it.isFree !== undefined ? it.isFree : true) : !(it.price && Number(it.price) > 0),
    price: it.price ? String(it.price) : '',
    original_price: it.originalPrice ? String(it.originalPrice) : '',
    discount_percent: it.discountPercent ?? '',
    is_demo_price: !!it.isDemoPrice,
    demo_video_url: it.demoVideoUrl || '',
    has_certificate_sample: it.hasCertificateSample !== false,
    projects: it.projects ? String(it.projects) : '0',
    certificate: it.certificate !== false,
    mentorship: it.mentorship !== false,
    duration: it.duration || '',
    level: it.level || '',
    mode: it.mode || '',
    topics: (it.topics || []).join('\n'),
    what_you_learn: (it.whatYouLearn || []).join('\n'),
    who_should_join: (it.whoShouldJoin || []).join('\n'),
    whatsapp_group_link: it.whatsappGroupLink || '',
    faqs: (it.faqs || []).length ? it.faqs.map((x) => ({ q: x.q || '', a: x.a || '' })) : [{ q: '', a: '' }],
    sort_order: it.sortOrder ? String(it.sortOrder) : '0',
    details: it.details || '',
    workshop_datetime: it.workshopDatetimeISO ? String(it.workshopDatetimeISO).slice(0, 16) : '',
    registration_deadline: it.registrationDeadlineISO ? String(it.registrationDeadlineISO).slice(0, 16) : '',
    banner_url: it.bannerUrl || '',
    mentor_name: it.mentorName || '',
    mentor_intro: it.mentorIntro || '',
    active: it.status !== 'Inactive',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const slugTouched = useRef(!!it.slug); // edit me slug already hota hai — title override na kare
  const navigate = useNavigate();

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setF((prev) => ({ ...prev, [field]: value }));
  };
  const setTitle = (e) => {
    const value = e.target.value;
    setF((prev) => (slugTouched.current ? { ...prev, title: value } : { ...prev, title: value, slug: slugify(value) }));
  };
  const setSlug = (e) => {
    slugTouched.current = true;
    setF((prev) => ({ ...prev, slug: e.target.value }));
  };
  const autoSlug = () => {
    slugTouched.current = false;
    setF((prev) => ({ ...prev, slug: slugify(prev.title) }));
  };
  const setFaq = (index, field, value) => {
    setF((prev) => ({ ...prev, faqs: prev.faqs.map((x, i) => (i === index ? { ...x, [field]: value } : x)) }));
  };
  const addFaq = () => setF((prev) => ({ ...prev, faqs: [...prev.faqs, { q: '', a: '' }] }));
  const removeFaq = (index) => setF((prev) => ({ ...prev, faqs: prev.faqs.filter((_, i) => i !== index) }));

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      toast.error('Banner must be under 6 MB.');
      return;
    }
    setUploadingBanner(true);
    try {
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
        reader.onerror = () => reject(new Error('read failed'));
        reader.readAsDataURL(file);
      });
      const res = await mentorData('item_banner_upload', { attachment: { name: file.name, type: file.type, data } });
      setF((prev) => ({ ...prev, banner_url: res.url || prev.banner_url }));
      toast.success('Banner uploaded.');
    } catch (err) {
      if (err?.status === 401) {
        navigate(MENTOR_ROUTES.login, { replace: true });
        return;
      }
      toast.error(err.message || 'Upload failed.');
    } finally {
      setUploadingBanner(false);
      e.target.value = '';
    }
  };

  const toIso = (v) => (v ? new Date(v).toISOString() : null);

  const handleSubmit = async () => {
    if (!f.title.trim()) {
      toast.error('Title is required.');
      return;
    }
    setSaving(true);
    try {
      await mentorData(mode === 'add' ? 'item_create' : 'item_save', {
        kind,
        id: item?.id,
        fields: {
          ...f,
          slug: f.slug.trim() || slugify(f.title),
          discount_percent: f.discount_percent === '' ? '' : Number(f.discount_percent),
          projects: Number(f.projects) || 0,
          sort_order: Number(f.sort_order) || 0,
          topics: f.topics.split('\n').map((s) => s.trim()).filter(Boolean),
          what_you_learn: f.what_you_learn.split('\n').map((s) => s.trim()).filter(Boolean),
          who_should_join: f.who_should_join.split('\n').map((s) => s.trim()).filter(Boolean),
          faqs: f.faqs.filter((x) => x.q.trim() && x.a.trim()),
          workshop_datetime: isWorkshop ? toIso(f.workshop_datetime) : undefined,
          registration_deadline: isWorkshop ? toIso(f.registration_deadline) : undefined,
        },
      });
      toast.success(mode === 'add' ? 'Program created.' : 'Program updated.');
      onSaved();
    } catch (err) {
      if (err?.status === 401) {
        navigate(MENTOR_ROUTES.login, { replace: true });
        return;
      }
      toast.error(err.message || 'Save failed.');
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-secondary/70 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-white border-2 border-secondary max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between px-5 sm:px-7 pt-5">
          <h2 className="font-heading text-xl text-secondary">
            {mode === 'add' ? `Add ${isWorkshop ? 'Workshop' : 'Course'}` : `Edit — ${it.title || ''}`}
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-secondary">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 sm:p-7 pt-4 space-y-4">
          {mode === 'edit' && (
            <div className="bg-accent border-2 border-secondary/15 px-4 py-3 flex items-start gap-2.5">
              <Info size={14} className="text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted normal-case">
                Batch ID <b className="font-mono">{it.batchId || '—'}</b> stays fixed (students are linked through it). You can edit the other details.
              </p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Title *</label>
              <input className={inputClass} value={f.title} onChange={setTitle} placeholder={isWorkshop ? 'e.g. Google Ads Masterclass' : 'e.g. Digital Marketing Pro'} />
            </div>
            <div>
              <label className={labelClass}>Slug (URL, unique) — Auto-generate from Title</label>
              <div className="flex items-center gap-2">
                <input className={`${inputClass} font-mono text-xs`} value={f.slug} onChange={setSlug} placeholder="auto-from-title" />
                <button type="button" title="Auto-generate from Title" onClick={autoSlug} className="shrink-0 border-2 border-secondary/20 bg-white px-3 py-2.5 text-xs font-bold text-secondary hover:border-primary hover:text-primary transition-colors">
                  Auto
                </button>
              </div>
            </div>
          </div>

          {!isWorkshop && (
            <div>
              <label className={labelClass}>Icon</label>
              <select className={inputClass} value={f.icon} onChange={set('icon')}>
                {Object.keys(ICONS).map((key) => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            </div>
          )}

          {isWorkshop && (
            <div>
              <label className={labelClass}>Workshop Banner</label>
              <div className="flex items-center gap-2.5">
                <input className={inputClass} value={f.banner_url} onChange={set('banner_url')} placeholder="https://… (banner image URL)" />
                <label className={`shrink-0 inline-flex items-center gap-1.5 border-2 border-secondary/20 bg-white px-3 py-2.5 text-xs font-bold text-secondary hover:border-primary transition-colors cursor-pointer ${uploadingBanner ? 'opacity-60' : ''}`}>
                  {uploadingBanner ? <Loader2 size={13} className="animate-spin" /> : null} Upload
                  <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} disabled={uploadingBanner} />
                </label>
              </div>
              {f.banner_url && <img src={f.banner_url} alt="Banner preview" className="mt-2 w-full max-h-36 object-cover border-2 border-secondary/15" />}
            </div>
          )}

          <div>
            <label className={labelClass}>Short Description (Markdown supported)</label>
            <textarea rows={2} className={`${inputClass} resize-y`} value={f.short_description} onChange={set('short_description')} placeholder="1-2 line summary" />
          </div>

          {isWorkshop && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Workshop Date &amp; Time</label>
                <input type="datetime-local" className={inputClass} value={f.workshop_datetime} onChange={set('workshop_datetime')} />
              </div>
              <div>
                <label className={labelClass}>Registration Last Date &amp; Time</label>
                <input type="datetime-local" className={inputClass} value={f.registration_deadline} onChange={set('registration_deadline')} />
                <p className="mt-1 text-[11px] text-muted normal-case">Deadline ke baad workshop auto-Completed ho jata hai aur nayi registrations band.</p>
              </div>
            </div>
          )}

          {isWorkshop && (
            <div>
              <label className={labelClass}>Details About Workshop (Markdown supported)</label>
              <textarea rows={6} className={`${inputClass} resize-y`} value={f.details} onChange={set('details')} placeholder="## Agenda&#10;- Point one&#10;- Point two" />
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Pricing Type</label>
              <select className={inputClass} value={f.is_free ? 'free' : 'paid'} onChange={(e) => setF((prev) => ({ ...prev, is_free: e.target.value === 'free' }))}>
                <option value="paid">{isWorkshop ? 'Paid Workshop' : 'Paid Course'}</option>
                <option value="free">{isWorkshop ? 'Free Workshop' : 'Free Course'}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Original Price (numbers only)</label>
              <input type="number" min="0" className={inputClass} value={f.original_price} onChange={set('original_price')} placeholder="999" />
            </div>
            <div>
              <label className={labelClass}>{isWorkshop ? 'Offer Price (numbers only)' : 'Final Price (numbers only)'}</label>
              <input type="number" min="0" className={inputClass} value={f.price} onChange={set('price')} placeholder="0" />
            </div>
            <div>
              <label className={labelClass}>Discount %</label>
              <input type="number" min="0" max="99" className={inputClass} value={f.discount_percent} onChange={set('discount_percent')} placeholder="e.g. 20" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-2.5">
              <input type="checkbox" className="w-4 h-4 accent-primary" checked={f.is_demo_price} onChange={set('is_demo_price')} />
              <span className="text-sm font-semibold text-secondary">Show "Demo pricing" label</span>
            </label>
            {!isWorkshop && (
              <label className="flex items-center gap-2.5">
                <input type="checkbox" className="w-4 h-4 accent-primary" checked={f.has_certificate_sample} onChange={set('has_certificate_sample')} />
                <span className="text-sm font-semibold text-secondary">Show certificate sample preview</span>
              </label>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{isWorkshop ? 'Workshop Video URL (YouTube)' : 'Demo Video URL (YouTube)'}</label>
              <input className={inputClass} value={f.demo_video_url} onChange={set('demo_video_url')} placeholder="https://youtube.com/…" />
            </div>
            {!isWorkshop && (
              <div>
                <label className={labelClass}>Projects</label>
                <input type="number" min="0" className={inputClass} value={f.projects} onChange={set('projects')} placeholder="e.g. 5" />
              </div>
            )}
          </div>

          {!isWorkshop && (
            <>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Duration</label>
                  <input className={inputClass} value={f.duration} onChange={set('duration')} placeholder="e.g. 3 Months" />
                </div>
                <div>
                  <label className={labelClass}>Level</label>
                  <input className={inputClass} value={f.level} onChange={set('level')} placeholder="e.g. Beginner" />
                </div>
                <div>
                  <label className={labelClass}>Mode</label>
                  <input className={inputClass} value={f.mode} onChange={set('mode')} placeholder="e.g. Online" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-2.5">
                  <input type="checkbox" className="w-4 h-4 accent-primary" checked={f.certificate} onChange={set('certificate')} />
                  <span className="text-sm font-semibold text-secondary">Certificate</span>
                </label>
                <label className="flex items-center gap-2.5">
                  <input type="checkbox" className="w-4 h-4 accent-primary" checked={f.mentorship} onChange={set('mentorship')} />
                  <span className="text-sm font-semibold text-secondary">Mentorship</span>
                </label>
              </div>
              <div>
                <label className={labelClass}>Topics / Curriculum (one per line)</label>
                <textarea rows={4} className={`${inputClass} resize-y`} value={f.topics} onChange={set('topics')} placeholder="e.g. Keyword Research" />
              </div>
              <div>
                <label className={labelClass}>What You&rsquo;ll Learn (one per line)</label>
                <textarea rows={4} className={`${inputClass} resize-y`} value={f.what_you_learn} onChange={set('what_you_learn')} placeholder="e.g. Rank #1 on Google" />
              </div>
              <div>
                <label className={labelClass}>Who Should Join (one per line)</label>
                <textarea rows={3} className={`${inputClass} resize-y`} value={f.who_should_join} onChange={set('who_should_join')} placeholder="e.g. Students & freshers" />
              </div>
            </>
          )}

          <div>
            <label className={labelClass}>WhatsApp Group Link</label>
            <input className={inputClass} value={f.whatsapp_group_link} onChange={set('whatsapp_group_link')} placeholder="https://chat.whatsapp.com/…" />
            <p className="mt-1 text-[11px] text-muted normal-case">Enroll + pay karne wale student ko payment success page par ye link dikhta hai.</p>
          </div>

          {isWorkshop && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Mentor Name</label>
                <input className={inputClass} value={f.mentor_name} onChange={set('mentor_name')} placeholder="Leave empty to hide mentor section" />
              </div>
              <div>
                <label className={labelClass}>Short Introduction</label>
                <textarea rows={2} className={`${inputClass} resize-y`} value={f.mentor_intro} onChange={set('mentor_intro')} placeholder="A short bio about the mentor..." />
              </div>
            </div>
          )}

          <div>
            <label className={labelClass}>FAQs (Answers support Markdown)</label>
            <div className="space-y-2.5">
              {f.faqs.map((faq, i) => (
                <div key={i} className="grid sm:grid-cols-2 gap-2.5">
                  <input className={inputClass} value={faq.q} onChange={(e) => setFaq(i, 'q', e.target.value)} placeholder="Question" />
                  <div className="flex items-center gap-2">
                    <textarea className={`${inputClass} resize-y`} rows={2} value={faq.a} onChange={(e) => setFaq(i, 'a', e.target.value)} placeholder="Answer" />
                    {f.faqs.length > 1 && (
                      <button type="button" onClick={() => removeFaq(i)} className="shrink-0 text-xs font-bold text-red-600 hover:underline">Remove</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addFaq} className="mt-2 inline-flex items-center gap-1.5 border-2 border-secondary/20 bg-white px-3 py-2 text-xs font-bold text-secondary hover:border-primary transition-colors">
              <Plus size={13} /> Add FAQ
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Sort Order</label>
              <input type="number" className={inputClass} value={f.sort_order} onChange={set('sort_order')} placeholder="0" />
            </div>
            <label className="flex items-center gap-2.5 pt-6">
              <input type="checkbox" className="w-4 h-4 accent-primary" checked={f.active} onChange={set('active')} />
              <span className="text-sm font-semibold text-secondary">Active (visible on site)</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={saving} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
              {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : `Save ${isWorkshop ? 'Workshop' : 'Course'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
