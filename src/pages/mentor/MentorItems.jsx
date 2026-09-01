/**
 * Assigned courses/workshops — view + add + edit (sirf apne programs).
 * Students/price/duration mentor-data fn se (batch_id + slug se leads match).
 */
import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { Loader2, Plus, Pencil, X, Info } from 'lucide-react';
import useMentorData, { inr } from '@/hooks/useMentorData';
import { mentorData } from '@/data/mentorAuth';
import { MENTOR_ROUTES } from '@/constants/mentorRoutes';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import AdminFilterBar from '@/components/admin/AdminFilterBar';
import AdminTable from '@/components/admin/AdminTable';
import AdminLoadMore from '@/components/admin/AdminLoadMore';
import { useLoadMore } from '@/hooks/useLoadMore';

const inputClass =
  'w-full border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white normal-case';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-1.5';

export default function MentorItems({ kind = 'course' }) {
  const isWorkshop = kind === 'workshop';
  const title = isWorkshop ? 'Manage Workshops' : 'Manage Courses';
  const navigate = useNavigate();
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
        <button onClick={openAdd} className="btn-primary inline-flex items-center gap-2 shrink-0">
          <Plus size={15} /> Add {isWorkshop ? 'Workshop' : 'Course'}
        </button>
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

/** Add/Edit form modal — fields mentor-data fn whitelist se match karte hain */
function ItemForm({ kind, mode, item, onClose, onSaved }) {
  const isWorkshop = kind === 'workshop';
  const it = item || {};
  const [f, setF] = useState({
    title: it.title || '',
    slug: it.slug || '',
    price: it.price ?? '',
    original_price: it.originalPrice ?? it.original_price ?? '',
    duration: it.duration || '',
    level: it.level || '',
    mode: it.mode || '',
    short_description: it.shortDescription || it.short_description || '',
    details: it.details || '',
    workshop_datetime: it.workshopDatetime ? String(it.workshopDatetime).slice(0, 16) : '',
    registration_deadline: it.registrationDeadline ? String(it.registrationDeadline).slice(0, 16) : '',
    active: it.status !== 'Inactive',
  });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const set = (field) => (e) => setF((prev) => ({ ...prev, [field]: e.target.value }));

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
        fields: { ...f, active: f.active },
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
      <div className="w-full max-w-xl bg-white border-2 border-secondary max-h-[88vh] overflow-y-auto">
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
            <div className="sm:col-span-2">
              <label className={labelClass}>Title *</label>
              <input className={inputClass} value={f.title} onChange={set('title')} placeholder={isWorkshop ? 'e.g. Google Ads Masterclass' : 'e.g. Digital Marketing Pro'} />
            </div>
            <div>
              <label className={labelClass}>Slug (URL)</label>
              <input className={`${inputClass} font-mono text-xs`} value={f.slug} onChange={set('slug')} placeholder="auto-from-title" />
            </div>
            <div>
              <label className={labelClass}>Price (₹)</label>
              <input type="number" min="0" className={inputClass} value={f.price} onChange={set('price')} placeholder="0" />
            </div>
            <div>
              <label className={labelClass}>Original Price (₹, optional)</label>
              <input type="number" min="0" className={inputClass} value={f.original_price} onChange={set('original_price')} placeholder="999" />
            </div>
            {!isWorkshop && (
              <>
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
              </>
            )}
            {isWorkshop && (
              <>
                <div>
                  <label className={labelClass}>Workshop Date &amp; Time</label>
                  <input type="datetime-local" className={inputClass} value={f.workshop_datetime} onChange={set('workshop_datetime')} />
                </div>
                <div>
                  <label className={labelClass}>Registration Deadline</label>
                  <input type="datetime-local" className={inputClass} value={f.registration_deadline} onChange={set('registration_deadline')} />
                </div>
              </>
            )}
            <div className="sm:col-span-2">
              <label className={labelClass}>Short Description</label>
              <textarea rows={2} className={`${inputClass} resize-y`} value={f.short_description} onChange={set('short_description')} placeholder="1-2 line summary" />
            </div>
            {isWorkshop && (
              <div className="sm:col-span-2">
                <label className={labelClass}>Details (agenda, topics…)</label>
                <textarea rows={5} className={`${inputClass} resize-y`} value={f.details} onChange={set('details')} />
              </div>
            )}
            <label className="flex items-center gap-2.5 sm:col-span-2">
              <input type="checkbox" className="w-4 h-4 accent-primary" checked={f.active} onChange={(e) => setF((prev) => ({ ...prev, active: e.target.checked }))} />
              <span className="text-sm font-semibold text-secondary">Active (website par visible)</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={saving} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
              {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : 'Save Program'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
