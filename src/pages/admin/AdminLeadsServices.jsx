import { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '@/services/supabaseClient';
import { formatDateTimeWithDay } from '@/utils/formatDateTime';
import { formatINR } from '@/utils/format';
import AdminTable from '@/components/admin/AdminTable';
import AdminFilterBar from '@/components/admin/AdminFilterBar';
import AdminLoadMore from '@/components/admin/AdminLoadMore';
import { useLoadMore } from '@/hooks/useLoadMore';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ExportButtons from '@/components/admin/ExportButtons';
import { X, MessageCircle, Mail, Loader2 } from 'lucide-react';

const inputClass =
  'w-full border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white normal-case';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-1.5';

const STATUS_STYLES = {
  pending: 'bg-accent text-secondary border-secondary/30',
  on_call: 'bg-blue-50 text-blue-700 border-blue-300',
  done: 'bg-green-50 text-green-700 border-green-300',
  undone: 'bg-red-50 text-primary border-primary/30',
};

const STATUS_LABELS = { pending: 'Pending', on_call: 'On Call', done: 'Done', undone: 'Undone' };

export default function AdminLeadsServices() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detail, setDetail] = useState(null); // manage modal
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('leads_service').select('*').order('created_at', { ascending: false });
    if (error) toast.error('Failed to load leads.');
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (row) => {
    if (!window.confirm('Delete this lead?')) return;
    const { error } = await supabase.from('leads_service').delete().eq('id', row.id);
    if (error) toast.error('Delete failed.');
    else {
      toast.success('Lead deleted.');
      load();
    }
  };

  const handleStatusChange = async (row, status) => {
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status } : r)));
    const { error } = await supabase.from('leads_service').update({ status }).eq('id', row.id);
    if (error) {
      toast.error('Failed to update status.');
      load();
    }
  };

  // Manage modal save: SIRF referral code / status / amount / message edit hote hain
  const handleSave = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('leads_service')
        .update({
          referral_code: String(detail.referral_code || '').trim().toUpperCase().slice(0, 20),
          status: detail.status || 'pending',
          amount: Number(detail.amount) || 0,
          message: detail.message || '',
        })
        .eq('id', detail.id);
      if (error) throw error;
      toast.success('Lead updated.');
      setDetail(null);
      load();
    } catch {
      toast.error('Could not save changes. Please refresh the page and try again.');
    } finally {
      setSaving(false);
    }
  };

  const serviceOptions = useMemo(
    () => [...new Set(rows.map((r) => r.service_title))].sort(),
    [rows]
  );

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (serviceFilter !== 'all' && r.service_title !== serviceFilter) return false;
      if (statusFilter !== 'all' && (r.status ?? 'pending') !== statusFilter) return false;
      if (dateFrom && new Date(r.created_at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(r.created_at) > new Date(`${dateTo}T23:59:59`)) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const haystack = [r.name, r.email, r.phone, r.company_name, r.city, r.service_title, r.message, r.referral_code].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, dateFrom, dateTo, serviceFilter, statusFilter]);

  const { visibleItems, hasMore, loadMore, total, shown } = useLoadMore(
    filteredRows,
    `${search}|${dateFrom}|${dateTo}|${serviceFilter}|${statusFilter}`
  );

  // Export: FULL rows
  const exportRows = filteredRows.map((r) => ({
    created_at: formatDateTimeWithDay(r.created_at),
    name: r.name,
    company_name: r.company_name || '',
    city: r.city,
    phone: r.phone,
    email: r.email,
    service_title: r.service_title,
    message: r.message || '',
    referral_code: r.referral_code || '',
    amount: r.amount ?? 0,
    status: STATUS_LABELS[r.status ?? 'pending'],
    submitted_at: r.created_at || '',
  }));

  const columns = [
    { key: 'created_at', label: 'Date', render: (r) => formatDateTimeWithDay(r.created_at) },
    { key: 'name', label: 'Name' },
    { key: 'company_name', label: 'Company' },
    { key: 'city', label: 'City' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'service_title', label: 'Service' },
    { key: 'message', label: 'Message' },
    { key: 'referral_code', label: 'Referral Code', render: (r) => (r.referral_code ? <span className="font-mono text-xs font-bold text-primary">{r.referral_code}</span> : '—') },
    { key: 'amount', label: 'Amount', render: (r) => (Number(r.amount) > 0 ? formatINR(r.amount) : '—') },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <select
          value={r.status ?? 'pending'}
          onChange={(e) => handleStatusChange(r, e.target.value)}
          className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1.5 border-2 outline-none ${STATUS_STYLES[r.status ?? 'pending']}`}
        >
          <option value="pending">Pending</option>
          <option value="on_call">On Call</option>
          <option value="done">Done</option>
          <option value="undone">Undone</option>
        </select>
      ),
    },
    { key: 'manage', label: 'Manage', render: (r) => <button onClick={() => setDetail({ ...r })} className="text-xs font-bold text-primary hover:underline">Open</button> },
  ];

  // Admin -> lead WhatsApp / Email compose
  const whatsappHref = (r) =>
    `https://wa.me/91${String(r.phone || '').replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
      `Hello ${r.name}, this is NexRNN Technologies regarding your enquiry for "${r.service_title}". When would be a good time to talk?`
    )}`;

  const mailtoHref = (r) => {
    const subject = `NexRNN Technologies - ${r.service_title || 'Service Enquiry'}`;
    const body = [
      `Hello ${r.name || 'there'},`,
      '',
      `Thank you for your interest in "${r.service_title || 'our services'}".`,
      'Please let us know a convenient time to discuss your requirement.',
      '',
      'Warm regards,',
      'NexRNN Technologies',
      'https://www.nexrnntechnologies.in/',
    ].join('\n');
    return `mailto:${encodeURIComponent(r.email || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div>
      <h1 className="font-heading text-3xl text-secondary mb-1">Service Leads</h1>
      <p className="text-sm text-muted normal-case mb-6">Submissions from the "Buy Now" popup on service pages.</p>

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        extra={
          <>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-muted mb-1">Service</label>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white max-w-[220px]"
              >
                <option value="all">All Services</option>
                {serviceOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-muted mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="on_call">On Call</option>
                <option value="done">Done</option>
                <option value="undone">Undone</option>
              </select>
            </div>
          </>
        }
      />

      {/* Download data: PDF / Excel / CSV */}

      <div className="mb-4">

        <ExportButtons rows={exportRows} columns={columns} filename="service-leads" title="Service Leads" excludeKeys={['manage']} />

      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <AdminTable columns={columns} rows={visibleItems} onDelete={handleDelete} />
          <AdminLoadMore shown={shown} total={total} hasMore={hasMore} onLoadMore={loadMore} />
        </>
      )}

      {/* ---------- Manage modal (user data read-only) ---------- */}
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
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-0.5">Service Lead — {detail.name}</p>
                <h2 className="font-heading text-xl text-secondary">{detail.service_title}</h2>
              </div>
              <button onClick={() => setDetail(null)} aria-label="Close" className="text-muted hover:text-secondary">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 sm:p-7 pt-4 space-y-5">
              {/* User input data — READ ONLY */}
              <div className="bg-accent border-2 border-secondary/15 px-4 py-3.5 text-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-2">Lead Details (read-only)</p>
                <div className="grid grid-cols-2 gap-y-2 gap-x-3">
                  <p className="text-muted text-xs">Name</p>
                  <p className="text-secondary font-semibold">{detail.name}</p>
                  <p className="text-muted text-xs">Company</p>
                  <p className="text-secondary">{detail.company_name || '—'}</p>
                  <p className="text-muted text-xs">City</p>
                  <p className="text-secondary">{detail.city}</p>
                  <p className="text-muted text-xs">Phone</p>
                  <p className="text-secondary font-mono text-xs">{detail.phone}</p>
                  <p className="text-muted text-xs">Email</p>
                  <p className="text-secondary break-all">{detail.email}</p>
                  <p className="text-muted text-xs">Received On</p>
                  <p className="text-secondary">{formatDateTimeWithDay(detail.created_at)}</p>
                </div>
              </div>

              {/* WhatsApp + Email */}
              <div className="flex flex-wrap gap-2.5">
                <a
                  href={whatsappHref(detail)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border-2 border-green-300 bg-green-50 px-3.5 py-2 text-xs font-bold text-green-700 hover:border-green-400 transition-colors"
                >
                  <MessageCircle size={14} /> WhatsApp
                </a>
                <a
                  href={mailtoHref(detail)}
                  className="inline-flex items-center gap-2 border-2 border-secondary/20 bg-white px-3.5 py-2 text-xs font-bold text-secondary hover:border-primary hover:text-primary transition-colors"
                >
                  <Mail size={14} /> Email
                </a>
              </div>

              {/* Admin editable fields */}
              <div>
                <label className={labelClass}>Referral Code</label>
                <input
                  className={`${inputClass} uppercase font-mono`}
                  value={detail.referral_code || ''}
                  onChange={(e) => setDetail((d) => ({ ...d, referral_code: e.target.value }))}
                  placeholder="Sales referral code (if any)"
                />
              </div>

              <div>
                <label className={labelClass}>Status</label>
                <select
                  value={detail.status ?? 'pending'}
                  onChange={(e) => setDetail((d) => ({ ...d, status: e.target.value }))}
                  className={inputClass}
                >
                  <option value="pending">Pending</option>
                  <option value="on_call">On Call</option>
                  <option value="done">Done</option>
                  <option value="undone">Undone</option>
                </select>
              </div>

              <p className="text-[11px] text-muted normal-case -mt-2">
                Setting Amount + Status to "Done" makes this deal count as the referred member's
                commission (they can withdraw it).
              </p>

              <div>
                <label className={labelClass}>Amount (deal value ₹)</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={detail.amount ?? 0}
                  onChange={(e) => setDetail((d) => ({ ...d, amount: e.target.value }))}
                  placeholder="e.g. 15000"
                />
              </div>

              <div>
                <label className={labelClass}>Message</label>
                <textarea
                  rows={3}
                  className={`${inputClass} resize-y`}
                  value={detail.message || ''}
                  onChange={(e) => setDetail((d) => ({ ...d, message: e.target.value }))}
                  placeholder="Lead message / follow-up notes"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setDetail(null)} className="btn-secondary">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
                  {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
