import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { X, Loader2, Tag } from 'lucide-react';
import {
  fetchPromoCodes, createPromoCode, updatePromoCode, setPromoActive, deletePromoCode,
} from '@/data/promosRepo';
import { fetchCourses } from '@/data/coursesRepo';
import { fetchWorkshops } from '@/data/workshopsRepo';
import { fetchCareers } from '@/data/careersRepo';
import { formatDateTimeWithDay } from '@/utils/formatDateTime';
import AdminTable from '@/components/admin/AdminTable';
import AdminFilterBar from '@/components/admin/AdminFilterBar';
import AdminLoadMore from '@/components/admin/AdminLoadMore';
import { useLoadMore } from '@/hooks/useLoadMore';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ExportButtons from '@/components/admin/ExportButtons';

const inputClass =
  'w-full border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white normal-case';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-1.5';

const EMPTY_FORM = {
  code: '',
  discountType: 'percent',
  discountValue: '',
  appliesTo: 'all',
  itemId: '',
  maxUses: '',
  active: true,
};

const KIND_LABEL = { all: 'All (Course + Workshop + Job)', course: 'Courses', workshop: 'Workshops', career: 'Jobs / Internships' };

export default function AdminPromoCodes() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(null); // {mode, id, ...}
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState({ course: [], workshop: [], career: [] });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPromoCodes();
      setRows(data ?? []);
    } catch {
      toast.error('Failed to load promo codes.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Specific item dropdown ke liye catalog (courses/workshops/openings)
  useEffect(() => {
    (async () => {
      try {
        const [c, w, k] = await Promise.all([fetchCourses(), fetchWorkshops(), fetchCareers()]);
        setItems({ course: c ?? [], workshop: w ?? [], career: k ?? [] });
      } catch {
        /* ignore - dropdown khali chalega */
      }
    })();
  }, []);

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [r.code, r.appliesTo, r.itemTitle].join(' ').toLowerCase().includes(q);
  }), [rows, search]);

  const { visibleItems, hasMore, loadMore, total, shown } = useLoadMore(filtered, search);

  const openAdd = () => setForm({ ...EMPTY_FORM, mode: 'add' });
  const openEdit = (r) => setForm({
    mode: 'edit', id: r.id, code: r.code, discountType: r.discountType, discountValue: String(r.discountValue),
    appliesTo: r.appliesTo, itemId: r.itemId || '', maxUses: r.maxUses ? String(r.maxUses) : '', active: r.active,
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    const code = form.code.trim().toUpperCase();
    if (!code) {
      toast.error('Enter a promo code.');
      return;
    }
    if (!/^[A-Z0-9_-]{3,20}$/.test(code)) {
      toast.error('Code: 3-20 characters (A-Z, 0-9, - _ only).');
      return;
    }
    const value = Number(form.discountValue);
    if (!value || value <= 0) {
      toast.error('Enter a discount value.');
      return;
    }
    if (form.discountType === 'percent' && value > 100) {
      toast.error('Percent discount cannot be more than 100.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code,
        discountType: form.discountType,
        discountValue: value,
        appliesTo: form.appliesTo,
        itemId: form.itemId || null,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        active: form.active,
      };
      if (form.mode === 'edit') await updatePromoCode(form.id, payload);
      else await createPromoCode(payload);
      toast.success(form.mode === 'edit' ? 'Promo code updated.' : 'Promo code created.');
      setForm(null);
      load();
    } catch (err) {
      const msg = /duplicate|unique/i.test(err.message || '') ? 'This code already exists — use a different code.' : err.message || 'Save failed.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (r) => {
    try {
      await setPromoActive(r.id, !r.active);
      toast.success(r.active ? 'Promo deactivated.' : 'Promo activated.');
      load();
    } catch {
      toast.error('Could not update the promo.');
    }
  };

  const handleDelete = async (r) => {
    if (!window.confirm(`Delete promo code "${r.code}"? This cannot be undone.`)) return;
    try {
      await deletePromoCode(r.id);
      toast.success('Promo code deleted.');
      load();
    } catch {
      toast.error('Could not delete the promo.');
    }
  };

  const itemOptions = items[form?.appliesTo] ?? [];
  const exportRows = filtered.map((r) => ({
    code: r.code,
    discount: r.discountType === 'percent' ? `${r.discountValue}%` : `Rs. ${r.discountValue}`,
    applies_to: KIND_LABEL[r.appliesTo],
    specific_item: r.itemTitle || (r.itemId ? 'Yes' : 'Any'),
    max_uses: r.maxUses ?? 'Unlimited',
    used_count: r.usedCount,
    status: r.active ? 'Active' : 'Inactive',
    created_on: r.createdAt ? formatDateTimeWithDay(r.createdAt) : '',
  }));

  const columns = [
    { key: 'code', label: 'Code', render: (r) => <span className="font-mono text-xs font-bold text-primary">{r.code}</span> },
    { key: 'discount', label: 'Discount', render: (r) => <span className="font-bold text-secondary">{r.discountType === 'percent' ? `${r.discountValue}%` : `Rs. ${r.discountValue.toLocaleString('en-IN')}`}</span> },
    { key: 'applies_to', label: 'Applies To', render: (r) => KIND_LABEL[r.appliesTo] },
    { key: 'item', label: 'Specific Item', render: (r) => (r.itemId ? (r.itemTitle || 'Yes') : 'Any') },
    { key: 'used', label: 'Used', render: (r) => `${r.usedCount}${r.maxUses ? ` / ${r.maxUses}` : ''}` },
    { key: 'created_at', label: 'Created', render: (r) => formatDateTimeWithDay(r.createdAt) },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 border-2 whitespace-nowrap ${r.active ? 'bg-green-50 text-green-700 border-green-300' : 'bg-red-50 text-red-600 border-red-300'}`}>
          {r.active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'manage',
      label: 'Manage',
      render: (r) => (
        <div className="flex items-center gap-3">
          <button onClick={() => openEdit(r)} className="text-xs font-bold text-primary hover:underline">Open</button>
          <button onClick={() => handleToggle(r)} className={`text-xs font-bold hover:underline ${r.active ? 'text-orange-600' : 'text-green-700'}`}>
            {r.active ? 'Deactivate' : 'Activate'}
          </button>
          <button onClick={() => handleDelete(r)} className="text-xs font-bold text-red-600 hover:underline">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-1">
        <h1 className="font-heading text-3xl text-secondary">Promo Codes</h1>
        <button onClick={openAdd} className="btn-primary inline-flex items-center gap-2 shrink-0">
          <Tag size={15} /> New Promo Code
        </button>
      </div>
      <p className="text-sm text-muted normal-case mb-6">
        Discounts for courses, workshops and job applications — shown in the payment confirmation popup.
        Deactivate anytime without deleting.
      </p>

      <AdminFilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search code…" />

      <div className="mb-4">
        <ExportButtons rows={exportRows} columns={columns} filename="promo-codes" title="Promo Codes" excludeKeys={['manage']} />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <AdminTable columns={columns} rows={visibleItems} />
          <AdminLoadMore shown={shown} total={total} hasMore={hasMore} onLoadMore={loadMore} />
        </>
      )}

      {/* ---------- Add / Edit modal ---------- */}
      {form && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-secondary/70 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setForm(null);
          }}
        >
          <div className="w-full max-w-lg bg-white border-2 border-secondary max-h-[88vh] overflow-y-auto">
            <div className="flex items-start justify-between px-5 sm:px-7 pt-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-0.5">Promo Code</p>
                <h2 className="font-heading text-xl text-secondary">{form.mode === 'edit' ? 'Edit Promo' : 'New Promo Code'}</h2>
              </div>
              <button onClick={() => setForm(null)} aria-label="Close" className="text-muted hover:text-secondary">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 sm:p-7 pt-4 space-y-4">
              <div>
                <label className={labelClass}>Promo Code</label>
                <input className={`${inputClass} uppercase font-mono`} value={form.code} onChange={set('code')} placeholder="e.g. WELCOME10" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Discount Type</label>
                  <select className={inputClass} value={form.discountType} onChange={set('discountType')}>
                    <option value="percent">Percent (%)</option>
                    <option value="flat">Flat Amount</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Discount Value {form.discountType === 'percent' ? '(%)' : '(Rs.)'}</label>
                  <input type="number" min="1" className={inputClass} value={form.discountValue} onChange={set('discountValue')} placeholder={form.discountType === 'percent' ? 'e.g. 10' : 'e.g. 200'} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Applies To</label>
                <select className={inputClass} value={form.appliesTo} onChange={set('appliesTo')}>
                  <option value="all">All (Course + Workshop + Job)</option>
                  <option value="course">Courses only</option>
                  <option value="workshop">Workshops only</option>
                  <option value="career">Jobs / Internships only</option>
                </select>
              </div>

              {form.appliesTo !== 'all' && (
                <div>
                  <label className={labelClass}>Specific {form.appliesTo === 'career' ? 'Opening' : form.appliesTo} (optional — any if empty)</label>
                  <select className={inputClass} value={form.itemId} onChange={set('itemId')}>
                    <option value="">Any {form.appliesTo === 'career' ? 'opening' : form.appliesTo}</option>
                    {itemOptions.map((it) => (
                      <option key={it.id} value={it.id}>{it.title || it.name || it.id}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className={labelClass}>Max Uses (optional — unlimited if empty)</label>
                <input type="number" min="1" className={inputClass} value={form.maxUses} onChange={set('maxUses')} placeholder="e.g. 100" />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-primary" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
                <span className="text-sm text-secondary normal-case">Active (visible/usable at checkout)</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button onClick={() => setForm(null)} className="btn-secondary">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
                  {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : 'Save Promo Code'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
