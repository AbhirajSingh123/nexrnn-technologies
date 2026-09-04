import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Loader2, Mail, UserPlus, X, Pencil, Gift, FileText, Award } from 'lucide-react';
import { downloadSalesOfferLetterPDF, downloadSalesProfilePDF } from '@/data/salesDocumentsRepo';
import { fetchSalesMembers, createSalesMember, updateSalesMember, setSalesMemberBlocked } from '@/data/salesRepo';
import { buildSalesMailto } from '@/utils/adminMailto';
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
  name: '', email: '', phone: '', commissionCourse: '', commissionWorkshop: '', commissionService: '', location: '', gender: '', dateOfJoining: '',
};

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

export default function AdminSalesTeam() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(null); // add/edit form state
  const [detail, setDetail] = useState(null); // manage modal
  const [saving, setSaving] = useState(false);
  const [docBusy, setDocBusy] = useState('');

  const handleDoc = async (kind) => {
    if (!detail) return;
    setDocBusy(kind);
    try {
      if (kind === 'offer') await downloadSalesOfferLetterPDF(detail);
      else await downloadSalesProfilePDF(detail);
    } catch {
      toast.error('Download failed.');
    } finally {
      setDocBusy('');
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchSalesMembers();
      setRows(data ?? []);
    } catch {
      toast.error('Failed to load sales team.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [r.name, r.email, r.phone, r.salesId, r.referralCode, r.location].join(' ').toLowerCase().includes(q);
  });

  const { visibleItems, hasMore, loadMore, total, shown } = useLoadMore(filtered, search);

  // Export: FULL data
  const exportRows = filtered.map((r) => ({
    sales_id: r.salesId,
    referral_code: r.referralCode,
    name: r.name,
    email: r.email,
    phone: r.phone,
    commission_course: r.commissionCourse,
    commission_workshop: r.commissionWorkshop,
    commission_service: r.commissionService,
    payout: r.bankAccNo ? `A/C ${r.bankAccNo} (${r.bankAccName}, IFSC ${r.bankIfsc})` : r.upiId ? `UPI ${r.upiId}` : '',
    location: r.location,
    gender: r.gender,
    status: r.blocked ? 'Blocked' : 'Active',
    date_of_joining: r.dateOfJoining,
    added_on: r.createdAt ? formatDateTimeWithDay(r.createdAt) : '',
  }));

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <span className="font-semibold text-secondary">{r.name}</span> },
    { key: 'phone', label: 'Number', render: (r) => r.phone || '—' },
    {
      key: 'mail',
      label: 'Mail',
      render: (r) => (
        <a
          href={buildSalesMailto(r)}
          className="inline-flex items-center gap-1.5 border-2 border-secondary/20 bg-white px-2.5 py-1.5 text-[11px] font-bold text-secondary hover:border-primary hover:text-primary transition-colors"
        >
          <Mail size={12} /> Send
        </a>
      ),
    },
    { key: 'sales_id', label: 'Unique ID', render: (r) => <span className="font-mono text-xs text-primary font-bold">{r.salesId || '—'}</span> },
    {
      key: 'referral_code',
      label: 'Referral Code',
      render: (r) => (
        <span className="inline-flex items-center gap-1.5">
          <Gift size={12} className="text-primary" />
          <span className="font-mono text-xs font-bold text-secondary tracking-wider">{r.referralCode || '—'}</span>
        </span>
      ),
    },
    { key: 'manage', label: 'Manage', render: (r) => <button onClick={() => setDetail(r)} className="text-xs font-bold text-primary hover:underline">View / Edit</button> },
  ];

  const openAdd = () => setForm({ ...EMPTY_FORM, mode: 'add' });
  const openEdit = (r) => {
    setDetail(null);
    setForm({
      mode: 'edit',
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      commissionCourse: String(r.commissionCourse ?? ''),
      commissionWorkshop: String(r.commissionWorkshop ?? ''),
      commissionService: String(r.commissionService ?? ''),
      location: r.location,
      gender: r.gender || '',
      dateOfJoining: r.dateOfJoining || '',
    });
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and Email are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        commissionCourse: form.commissionCourse || 0,
        commissionWorkshop: form.commissionWorkshop || 0,
        commissionService: form.commissionService || 0,
        location: form.location.trim(),
        gender: form.gender || '',
        dateOfJoining: form.dateOfJoining,
      };
      if (form.mode === 'add') {
        const created = await createSalesMember(payload);
        toast.success(`Member added. Sales ID: ${created.salesId || 'see list'} — Referral Code: ${created.referralCode || 'see list'}`);
      } else {
        await updateSalesMember(form.id, payload);
        toast.success('Member updated.');
      }
      setForm(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to save member.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBlock = async (m) => {
    const verb = m.blocked ? 'unblock' : 'block';
    if (!window.confirm(`Confirm to ${verb} member "${m.name}"?${m.blocked ? '' : ' They will not be able to log in.'}`)) return;
    try {
      await setSalesMemberBlocked(m.id, !m.blocked);
      toast.success(m.blocked ? 'Member unblocked.' : 'Member blocked.');
      setDetail(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to update member.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-1">
        <h1 className="font-heading text-3xl text-secondary">Sales Team</h1>
        <button onClick={openAdd} className="btn-primary inline-flex items-center gap-2 shrink-0">
          <UserPlus size={15} /> Add Member
        </button>
      </div>
      <p className="text-sm text-muted normal-case mb-6">
        NexRNN sales team — commission-based members with a permanent 7-digit Refer &amp; Earn code each.
        Sales ID and referral code are generated automatically and never change.
      </p>

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, email, number, ID, referral code…"
      />

      <div className="mb-4">
        <ExportButtons rows={exportRows} columns={columns} filename="sales-team" title="Sales Team" excludeKeys={['mail', 'manage']} />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <AdminTable columns={columns} rows={visibleItems} />
          <AdminLoadMore shown={shown} total={total} hasMore={hasMore} onLoadMore={loadMore} />
        </>
      )}

      {/* ---------- Add / Edit form modal ---------- */}
      {form && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-secondary/70 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setForm(null);
          }}
        >
          <div className="w-full max-w-lg bg-white border-2 border-secondary max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 sm:px-7 pt-5">
              <h2 className="font-heading text-xl text-secondary">{form.mode === 'add' ? 'Add Sales Member' : 'Edit Sales Member'}</h2>
              <button onClick={() => setForm(null)} aria-label="Close" className="text-muted hover:text-secondary">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 sm:p-7 pt-4 space-y-4">
              {form.mode === 'add' && (
                <p className="text-xs text-muted normal-case border-2 border-secondary/15 bg-accent px-4 py-3">
                  Sales ID (NX-SAL-…) and the 7-digit referral code are generated automatically when you save — share them with the member.
                </p>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Name *</label>
                  <input className={inputClass} value={form.name} onChange={set('name')} placeholder="e.g. Amit Gupta" />
                </div>
                <div>
                  <label className={labelClass}>Email *</label>
                  <input type="email" className={inputClass} value={form.email} onChange={set('email')} placeholder="member@email.com" />
                </div>
                <div>
                  <label className={labelClass}>Number</label>
                  <input className={inputClass} value={form.phone} onChange={set('phone')} placeholder="10-digit mobile (login ke liye)" />
                </div>
                <div>
                  <label className={labelClass}>Course Commission (%)</label>
                  <input type="number" min="0" max="100" className={inputClass} value={form.commissionCourse} onChange={set('commissionCourse')} placeholder="e.g. 10" />
                </div>
                <div>
                  <label className={labelClass}>Workshop Commission (%)</label>
                  <input type="number" min="0" max="100" className={inputClass} value={form.commissionWorkshop} onChange={set('commissionWorkshop')} placeholder="e.g. 8" />
                </div>
                <div>
                  <label className={labelClass}>Service Commission (%)</label>
                  <input type="number" min="0" max="100" className={inputClass} value={form.commissionService} onChange={set('commissionService')} placeholder="e.g. 12" />
                </div>
                <div>
                  <label className={labelClass}>Location</label>
                  <input className={inputClass} value={form.location} onChange={set('location')} placeholder="City, State" />
                </div>
                <div>
                  <label className={labelClass}>Gender</label>
                  <select className={inputClass} value={form.gender} onChange={set('gender')}>
                    <option value="">Prefer not to say</option>
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Date of Joining</label>
                  <input type="date" className={inputClass} value={form.dateOfJoining} onChange={set('dateOfJoining')} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button onClick={() => setForm(null)} className="btn-secondary">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
                  {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : 'Save Member'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Manage (detail) modal ---------- */}
      {detail && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-secondary/70 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDetail(null);
          }}
        >
          <div className="w-full max-w-lg bg-white border-2 border-secondary max-h-[88vh] overflow-y-auto">
            <div className="flex items-start justify-between px-5 sm:px-7 pt-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-0.5">Sales — {detail.salesId}</p>
                <h2 className="font-heading text-xl text-secondary">{detail.name}</h2>
              </div>
              <button onClick={() => setDetail(null)} aria-label="Close" className="text-muted hover:text-secondary">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 sm:p-7 pt-4">
              {/* All info */}
              <div className="grid sm:grid-cols-2 gap-4 mb-6 text-sm">
                <Detail label="Name" value={detail.name} />
                <Detail label="Email" value={detail.email} />
                <Detail label="Number" value={detail.phone || '—'} />
                <Detail label="Location" value={detail.location || '—'} />
                <Detail label="Gender" value={detail.gender || '—'} />
                <Detail label="Date of Joining" value={detail.dateOfJoining || '—'} />
                <Detail label="Unique ID" value={detail.salesId} mono />
                <Detail label="Referral Code (permanent)" value={detail.referralCode} mono />
              </div>

              {/* Commission (read-only display; edit se hi badlega) */}
              <div className="border-t-2 border-secondary/10 pt-5 mb-5">
                <h3 className="text-sm font-bold text-secondary uppercase tracking-wide mb-3">Commission Rates</h3>
                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                  <Detail label="Course" value={`${detail.commissionCourse}%`} />
                  <Detail label="Workshop" value={`${detail.commissionWorkshop}%`} />
                  <Detail label="Service" value={`${detail.commissionService}%`} />
                </div>
              </div>

              {/* Payout details (latest withdrawal ke time se) */}
              {(detail.bankAccNo || detail.upiId) && (
                <div className="border-t-2 border-secondary/10 pt-5 mb-5">
                  <h3 className="text-sm font-bold text-secondary uppercase tracking-wide mb-3">Payout Details</h3>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    {detail.bankAccNo ? (
                      <>
                        <Detail label="Account Number" value={detail.bankAccNo} mono />
                        <Detail label="Account Name" value={detail.bankAccName || '—'} />
                        <Detail label="IFSC Code" value={detail.bankIfsc || '—'} mono />
                      </>
                    ) : (
                      <Detail label="UPI ID" value={detail.upiId} mono />
                    )}
                  </div>
                </div>
              )}

              {/* Downloads */}
              <div className="border-t-2 border-secondary/10 pt-5 mb-5">
                <h3 className="text-sm font-bold text-secondary uppercase tracking-wide mb-3">Download Documents</h3>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleDoc('offer')}
                    disabled={!!docBusy}
                    className="inline-flex items-center gap-2.5 border-2 border-secondary/20 bg-white px-3.5 py-2.5 hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-60"
                  >
                    {docBusy === 'offer' ? <Loader2 size={16} className="text-primary animate-spin" /> : <FileText size={16} className="text-primary shrink-0" />}
                    <span className="text-left">
                      <span className="block text-xs font-bold text-secondary">Offer Letter</span>
                      <span className="block text-[10px] text-muted normal-case">{docBusy === 'offer' ? 'Downloading…' : 'Joining letter PDF'}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDoc('profile')}
                    disabled={!!docBusy}
                    className="inline-flex items-center gap-2.5 border-2 border-secondary/20 bg-white px-3.5 py-2.5 hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-60"
                  >
                    {docBusy === 'profile' ? <Loader2 size={16} className="text-primary animate-spin" /> : <Award size={16} className="text-primary shrink-0" />}
                    <span className="text-left">
                      <span className="block text-xs font-bold text-secondary">Full Profile</span>
                      <span className="block text-[10px] text-muted normal-case">{docBusy === 'profile' ? 'Downloading…' : 'All details PDF'}</span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-end gap-3 border-t-2 border-secondary/10 pt-5">
                {detail.blocked && (
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 border-2 border-red-300 bg-red-50 text-red-600 mr-auto">Blocked</span>
                )}
                <button
                  onClick={() => handleToggleBlock(detail)}
                  className={`inline-flex items-center gap-2 border-2 px-3.5 py-2 text-xs font-bold transition-colors ${detail.blocked ? 'border-green-200 bg-green-50 text-green-700 hover:border-green-400' : 'border-orange-200 bg-orange-50 text-orange-600 hover:border-orange-400'}`}
                >
                  {detail.blocked ? 'Unblock Member' : 'Block Member'}
                </button>
                <a
                  href={buildSalesMailto(detail)}
                  className="inline-flex items-center gap-2 border-2 border-secondary/20 bg-white px-3.5 py-2 text-xs font-bold text-secondary hover:border-primary hover:text-primary transition-colors"
                >
                  <Mail size={14} /> Mail
                </a>
                <button onClick={() => openEdit(detail)} className="btn-primary inline-flex items-center gap-2">
                  <Pencil size={14} /> Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, mono = false }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-0.5">{label}</p>
      <p className={`text-sm text-secondary break-words ${mono ? 'font-mono font-bold text-primary' : ''}`}>{value || '—'}</p>
    </div>
  );
}
