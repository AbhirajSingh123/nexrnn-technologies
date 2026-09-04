import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { supabase } from '@/services/supabaseClient';
import useSalesData, { inr } from '@/hooks/useSalesData';
import { useSalesAuth } from '@/contexts/SalesAuthContext';
import { MessageCircle, UserPlus, X, Loader2 } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import AdminFilterBar from '@/components/admin/AdminFilterBar';
import AdminTable from '@/components/admin/AdminTable';
import AdminLoadMore from '@/components/admin/AdminLoadMore';
import { useLoadMore } from '@/hooks/useLoadMore';

const inputClass =
  'w-full border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white normal-case';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-1.5';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function SalesLeads() {
  const { member } = useSalesAuth();
  const { data, error, loading } = useSalesData('leads');
  const servicesQ = useSalesData('services');
  const [search, setSearch] = useState('');
  const [mineOnly, setMineOnly] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: '', companyName: '', city: '', phone: '', email: '', serviceSlug: '', message: '' });
  const [saving, setSaving] = useState(false);

  const rows = useMemo(() => data?.rows ?? [], [data]);
  const services = useMemo(() => servicesQ.data?.rows ?? [], [servicesQ.data]);

  const filtered = useMemo(() => rows.filter((r) => {
    if (mineOnly && !r.referredByMe) return false;
    const q = search.trim().toLowerCase();
    if (q && ![r.name, r.phone, r.email, r.serviceTitle, r.companyName, r.city].join(' ').toLowerCase().includes(q)) return false;
    return true;
  }), [rows, search, mineOnly]);

  const { visibleItems, hasMore, loadMore, total, shown } = useLoadMore(filtered, `${search}|${mineOnly}`);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleAdd = async () => {
    if (!form.name.trim() || !form.city.trim() || !form.phone.trim() || !form.email.trim() || !form.serviceSlug) {
      toast.error('Name, City, Number, Email and Service are required.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      toast.error('Enter a valid 10-digit mobile number.');
      return;
    }
    const svc = services.find((s) => s.slug === form.serviceSlug);
    setSaving(true);
    try {
      // Sales member apni hi referral code ke saath lead dalta hai
      const { error: insErr } = await supabase.from('leads_service').insert({
        name: form.name.trim(),
        company_name: form.companyName.trim(),
        city: form.city.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
        consent: true,
        service_slug: svc?.slug || form.serviceSlug,
        service_title: svc?.title || form.serviceSlug,
        referral_code: member?.referralCode || '',
      });
      if (insErr) throw insErr;
      toast.success('Lead added — it is tagged with your referral code.');
      setAddOpen(false);
      setForm({ name: '', companyName: '', city: '', phone: '', email: '', serviceSlug: '', message: '' });
      // list refresh (simple: page reload nahi - data hook refetch ke liye reload(0))
      window.location.reload();
    } catch (err) {
      toast.error(err?.message || 'Could not add the lead.');
      setSaving(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <span className="font-semibold text-secondary">{r.name}</span> },
    { key: 'serviceTitle', label: 'Service' },
    { key: 'companyName', label: 'Company', render: (r) => r.companyName || '—' },
    { key: 'city', label: 'City', render: (r) => r.city || '—' },
    { key: 'phone', label: 'Number', render: (r) => <span className="font-mono text-xs">{r.phone}</span> },
    { key: 'email', label: 'Email', render: (r) => <span className="normal-case break-all text-xs">{r.email}</span> },
    { key: 'amount', label: 'Amount', render: (r) => (r.amount > 0 ? <span className="font-bold">{inr(r.amount)}</span> : '—') },
    {
      key: 'estCommission',
      label: 'Est. Commission',
      render: (r) => {
        const pct = servicesQ.data?.commissionService ?? 0;
        if (!r.amount || !pct) return '—';
        return <span className="font-bold text-green-700">{inr(Math.round((r.amount * pct) / 100))}</span>;
      },
    },
    { key: 'createdAt', label: 'Received On', render: (r) => fmtDate(r.createdAt) },
    { key: 'referred', label: 'My Referral', render: (r) => (r.referredByMe ? <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 border-2 border-green-300 bg-green-50 text-green-700">Yes</span> : '—') },
    {
      key: 'contact',
      label: 'WhatsApp',
      render: (r) => (
        <a
          href={`https://wa.me/91${String(r.phone).replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${r.name}, this is ${member?.name || ''} from NexRNN Technologies regarding the services you enquired about.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 border-2 border-secondary/20 bg-white px-2.5 py-1.5 text-[11px] font-bold text-secondary hover:border-primary hover:text-primary transition-colors"
        >
          <MessageCircle size={12} /> Chat
        </a>
      ),
    },
  ];

  return (
    <div>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>

      <div className="flex items-center justify-between gap-4 mb-1 flex-wrap">
        <h1 className="font-heading text-3xl text-secondary">Service Leads</h1>
        <button onClick={() => setAddOpen(true)} className="btn-primary inline-flex items-center gap-2 shrink-0">
          <UserPlus size={14} /> Add Lead
        </button>
      </div>
      <p className="text-sm text-muted normal-case mb-6">
        People who enquired about NexRNN services — contact them, pitch the service and close the deal.
        Amount is the deal value (set by admin after the deal is closed) and your commission is counted
        on it. Leads that came through YOUR referral code are marked "Yes". You can also add a lead
        yourself (it gets your referral code automatically).
      </p>

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, number, email, service…"
        extra={
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-muted mb-1">Filter</label>
            <select
              value={mineOnly ? 'mine' : 'all'}
              onChange={(e) => setMineOnly(e.target.value === 'mine')}
              className="border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white"
            >
              <option value="all">All leads</option>
              <option value="mine">Only my referrals</option>
            </select>
          </div>
        }
      />

      {loading || servicesQ.loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-primary normal-case">{error}</p>
      ) : (
        <>
          <AdminTable columns={columns} rows={visibleItems} />
          <AdminLoadMore shown={shown} total={total} hasMore={hasMore} onLoadMore={loadMore} />
        </>
      )}

      {/* ---------- Add Lead modal ---------- */}
      {addOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-secondary/70 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setAddOpen(false);
          }}
        >
          <div className="w-full max-w-lg bg-white border-2 border-secondary max-h-[88vh] overflow-y-auto">
            <div className="flex items-start justify-between px-5 sm:px-7 pt-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-0.5">New Service Lead</p>
                <h2 className="font-heading text-xl text-secondary">Add a lead yourself</h2>
                <p className="text-xs text-muted normal-case mt-0.5">Referral code <b className="font-mono">{member?.referralCode || '—'}</b> will be attached automatically.</p>
              </div>
              <button onClick={() => setAddOpen(false)} aria-label="Close" className="text-muted hover:text-secondary">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 sm:p-7 pt-4 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Name *</label>
                  <input className={inputClass} value={form.name} onChange={set('name')} placeholder="Person's name" />
                </div>
                <div>
                  <label className={labelClass}>Company</label>
                  <input className={inputClass} value={form.companyName} onChange={set('companyName')} placeholder="Optional" />
                </div>
                <div>
                  <label className={labelClass}>City *</label>
                  <input className={inputClass} value={form.city} onChange={set('city')} placeholder="City" />
                </div>
                <div>
                  <label className={labelClass}>Number *</label>
                  <input className={inputClass} value={form.phone} onChange={set('phone')} placeholder="10-digit mobile" />
                </div>
                <div>
                  <label className={labelClass}>Email *</label>
                  <input type="email" className={inputClass} value={form.email} onChange={set('email')} placeholder="email@example.com" />
                </div>
                <div>
                  <label className={labelClass}>Service *</label>
                  <select className={inputClass} value={form.serviceSlug} onChange={set('serviceSlug')}>
                    <option value="">Select service</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.slug}>{s.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Message</label>
                <textarea rows={3} className={`${inputClass} resize-y`} value={form.message} onChange={set('message')} placeholder="Requirement detail (optional)" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button onClick={() => setAddOpen(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleAdd} disabled={saving} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
                  {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : 'Save Lead'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
