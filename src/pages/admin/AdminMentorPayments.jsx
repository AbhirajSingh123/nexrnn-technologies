import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { X, Loader2, Building2, Smartphone, Download, Mail } from 'lucide-react';
import { fetchWithdrawals, updateWithdrawal } from '@/data/withdrawalsRepo';
import { downloadWithdrawalSlipPDF } from '@/data/mentorDocumentsRepo';
import { formatDateTimeWithDay } from '@/utils/formatDateTime';
import { formatINR } from '@/utils/format';
import AdminTable from '@/components/admin/AdminTable';
import AdminFilterBar from '@/components/admin/AdminFilterBar';
import AdminLoadMore from '@/components/admin/AdminLoadMore';
import { useLoadMore } from '@/hooks/useLoadMore';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ExportButtons from '@/components/admin/ExportButtons';

const inputClass =
  'w-full border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white normal-case';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-1.5';

const STATUSES = ['Created', 'In progress', 'Payment Done', 'Rejected'];

const STATUS_STYLES = {
  Created: 'bg-blue-50 text-blue-700 border-blue-300',
  'In progress': 'bg-orange-50 text-orange-600 border-orange-300',
  'Payment Done': 'bg-green-50 text-green-700 border-green-300',
  Rejected: 'bg-red-50 text-red-700 border-red-300',
};

/** Payment ki poori info ke saath mailto link (mentor ki mail id par) */
function buildPaymentMailto(r) {
  const fmt = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-');
  const subject = `Withdrawal Payment ${r.withdrawalCode} — ${r.status}`;
  const body = [
    `Dear ${r.name || 'Mentor'},`,
    '',
    'Your withdrawal payment request details:',
    '',
    `Payment ID: ${r.withdrawalCode}`,
    `Amount: ${formatINR(r.amount)}`,
    `Status: ${r.status}`,
    `Payment Method: ${r.method === 'bank' ? 'Bank Account' : 'UPI'}`,
    `Payment Ref No: ${r.refNo || '-'}`,
    `Requested On: ${fmt(r.requestedAt)}`,
    `Processed On: ${fmt(r.processedAt)}`,
    '',
    r.adminMessage ? `Message from NexRNN Admin:\n${r.adminMessage}\n` : '',
    'For any queries, reply to this mail or contact us.',
    '',
    'Warm regards,',
    'NexRNN Technologies',
    'https://www.nexrnntechnologies.in/',
  ].join('\n');
  return `mailto:${encodeURIComponent(r.mentorEmail || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function AdminMentorPayments() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('requested'); // requested | history
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [saving, setSaving] = useState(false);
  const [slipping, setSlipping] = useState(false);

  const handleSlip = async () => {
    if (!detail) return;
    setSlipping(true);
    try {
      await downloadWithdrawalSlipPDF(detail, { email: detail.mentorEmail, phone: detail.mentorPhone });
    } catch {
      toast.error('Could not generate slip.');
    } finally {
      setSlipping(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchWithdrawals();
      setRows(data ?? []);
    } catch {
      toast.error('Failed to load payment requests.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pending = useMemo(() => rows.filter((r) => r.status !== 'Payment Done'), [rows]);
  const history = useMemo(() => rows.filter((r) => r.status === 'Payment Done'), [rows]);
  const baseRows = tab === 'requested' ? pending : history;

  const filtered = baseRows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [r.withdrawalCode, r.mentorId, r.name, r.mentorEmail, r.mentorPhone, r.refNo, r.upiId, r.accNo]
      .join(' ')
      .toLowerCase()
      .includes(q);
  });

  const { visibleItems, hasMore, loadMore, total, shown } = useLoadMore(filtered, `${search}|${tab}`);

  // Export: FULL data (key === exportRows key)
  const exportRows = filtered.map((r) => ({
    payment_id: r.withdrawalCode,
    name: r.name,
    mentor_id: r.mentorId,
    email: r.mentorEmail || '—',
    phone: r.mentorPhone || '—',
    amount: r.amount,
    method: r.method === 'bank' ? 'Bank' : 'UPI',
    acc_no: r.accNo,
    acc_name: r.accName,
    bank_ifsc: r.bankIfsc,
    upi_id: r.upiId,
    status: r.status,
    ref_no: r.refNo,
    admin_message: r.adminMessage,
    requested_at: r.requestedAt ? formatDateTimeWithDay(r.requestedAt) : '',
    processed_at: r.processedAt ? formatDateTimeWithDay(r.processedAt) : '',
  }));

  const columns = [
    { key: 'payment_id', label: 'Payment ID', render: (r) => <span className="font-mono text-xs font-bold text-primary">{r.withdrawalCode}</span> },
    { key: 'name', label: 'Name', render: (r) => <span className="font-semibold text-secondary">{r.name}</span> },
    { key: 'mentor_id', label: 'Mentor ID', render: (r) => <span className="font-mono text-xs">{r.mentorId}</span> },
    { key: 'amount', label: 'Amount', render: (r) => <span className="font-bold">{formatINR(r.amount)}</span> },
    {
      key: 'method',
      label: 'Method',
      render: (r) => (
        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 border-2 border-secondary/20 bg-white whitespace-nowrap">
          {r.method === 'bank' ? 'Bank' : 'UPI'}
        </span>
      ),
    },
    { key: 'requested_at', label: 'Requested On', render: (r) => formatDateTimeWithDay(r.requestedAt) },
    { key: 'processed_at', label: 'Processed On', render: (r) => (r.processedAt ? formatDateTimeWithDay(r.processedAt) : '—') },
    { key: 'ref_no', label: 'Ref No', render: (r) => r.refNo || '—' },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 border-2 whitespace-nowrap ${STATUS_STYLES[r.status] ?? STATUS_STYLES.Created}`}>
          {r.status}
        </span>
      ),
    },
    { key: 'manage', label: 'Manage', render: (r) => <button onClick={() => setDetail({ ...r })} className="text-xs font-bold text-primary hover:underline">Open</button> },
  ];

  const handleSave = async () => {
    if (!detail) return;
    if (detail.status === 'Payment Done' && !String(detail.refNo || '').trim()) {
      toast.error('Fill the Payment Ref No before marking Payment Done.');
      return;
    }
    setSaving(true);
    try {
      const processedAt =
        detail.status === 'Payment Done' && !detail.processedAt ? new Date().toISOString() : undefined;
      await updateWithdrawal(detail.id, {
        status: detail.status,
        refNo: detail.refNo,
        adminMessage: detail.adminMessage,
        processedAt,
      });
      toast.success('Payment request updated.');
      setDetail(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to update request.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="font-heading text-3xl text-secondary mb-1">Mentor Payments</h1>
      <p className="text-sm text-muted normal-case mb-6">
        Withdrawal requests from mentors — accept, track reference numbers and mark payments done.
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab('requested')}
          className={`px-4 py-2 text-xs font-bold border-2 transition-colors ${tab === 'requested' ? 'border-primary text-primary bg-primary/5' : 'border-secondary/20 text-muted hover:border-secondary/40'}`}
        >
          Requested Payments ({pending.length})
        </button>
        <button
          onClick={() => setTab('history')}
          className={`px-4 py-2 text-xs font-bold border-2 transition-colors ${tab === 'history' ? 'border-primary text-primary bg-primary/5' : 'border-secondary/20 text-muted hover:border-secondary/40'}`}
        >
          Payment History ({history.length})
        </button>
      </div>

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search payment ID, mentor, name, ref no…"
      />

      <div className="mb-4">
        <ExportButtons
          rows={exportRows}
          columns={columns}
          filename={tab === 'requested' ? 'requested-payments' : 'payment-history'}
          title={tab === 'requested' ? 'Requested Payments' : 'Payment History'}
          excludeKeys={['manage']}
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <AdminTable columns={columns} rows={visibleItems} />
          <AdminLoadMore shown={shown} total={total} hasMore={hasMore} onLoadMore={loadMore} />
        </>
      )}

      {/* ---------- Payment detail / accept modal ---------- */}
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
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-0.5">
                  Payment — <span className="font-mono text-primary">{detail.withdrawalCode}</span>
                </p>
                <h2 className="font-heading text-xl text-secondary">{formatINR(detail.amount)}</h2>
                <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 border-2 ${STATUS_STYLES[detail.status] ?? STATUS_STYLES.Created}`}>
                  {detail.status}
                </span>
              </div>
              <button onClick={() => setDetail(null)} aria-label="Close" className="text-muted hover:text-secondary">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 sm:p-7 pt-4 space-y-5">
              {/* Mentor details (auto-fetched) */}
              <div className="bg-accent border-2 border-secondary/15 px-4 py-3.5 text-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-2">Mentor Details</p>
                <div className="grid grid-cols-2 gap-y-2 gap-x-3">
                  <p className="text-muted text-xs">Name</p>
                  <p className="text-secondary font-semibold">{detail.name}</p>
                  <p className="text-muted text-xs">Mentor ID</p>
                  <p className="font-mono text-xs text-secondary">{detail.mentorId}</p>
                  <p className="text-muted text-xs">Email</p>
                  <p className="text-secondary break-all">{detail.mentorEmail || '—'}</p>
                  <p className="text-muted text-xs">Phone</p>
                  <p className="text-secondary">{detail.mentorPhone || '—'}</p>
                  <p className="text-muted text-xs">Requested On</p>
                  <p className="text-secondary">{formatDateTimeWithDay(detail.requestedAt)}</p>
                  {detail.processedAt && (
                    <>
                      <p className="text-muted text-xs">Processed On</p>
                      <p className="text-secondary">{formatDateTimeWithDay(detail.processedAt)}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Payout details */}
              <div className="border-2 border-secondary/15 px-4 py-3.5 text-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-2">Payout Details</p>
                {detail.method === 'bank' ? (
                  <div className="grid grid-cols-2 gap-y-2 gap-x-3">
                    <p className="text-muted text-xs flex items-center gap-1.5"><Building2 size={12} /> Bank Account</p>
                    <p className="font-mono text-xs text-secondary">{detail.accNo}</p>
                    <p className="text-muted text-xs">Account Name</p>
                    <p className="text-secondary">{detail.accName || '—'}</p>
                    <p className="text-muted text-xs">IFSC Code</p>
                    <p className="font-mono text-xs text-secondary">{detail.bankIfsc || '—'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-y-2 gap-x-3">
                    <p className="text-muted text-xs flex items-center gap-1.5"><Smartphone size={12} /> UPI ID</p>
                    <p className="font-mono text-xs text-secondary break-all">{detail.upiId || '—'}</p>
                  </div>
                )}
              </div>

              {/* Slip download + mentor ko mail */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={handleSlip}
                  disabled={slipping}
                  className="inline-flex items-center gap-2 border-2 border-secondary/20 bg-white px-3.5 py-2 text-xs font-bold text-secondary hover:border-primary hover:text-primary transition-colors disabled:opacity-60"
                >
                  {slipping ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Download Slip
                </button>
                <a
                  href={buildPaymentMailto(detail)}
                  className="inline-flex items-center gap-2 border-2 border-secondary/20 bg-white px-3.5 py-2 text-xs font-bold text-secondary hover:border-primary hover:text-primary transition-colors"
                >
                  <Mail size={14} /> Mail to Mentor
                </a>
              </div>

              {/* Admin fill karne wale fields */}
              <div>
                <label className={labelClass}>Status</label>
                <select value={detail.status} onChange={(e) => setDetail((d) => ({ ...d, status: e.target.value }))} className={inputClass}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Ref No (Payment)</label>
                <input
                  className={inputClass}
                  value={detail.refNo || ''}
                  onChange={(e) => setDetail((d) => ({ ...d, refNo: e.target.value }))}
                  placeholder="e.g. UPI/NEFT/UTR reference number"
                />
              </div>

              <div>
                <label className={labelClass}>Message (visible to the mentor)</label>
                <textarea
                  rows={3}
                  className={`${inputClass} resize-y`}
                  value={detail.adminMessage || ''}
                  onChange={(e) => setDetail((d) => ({ ...d, adminMessage: e.target.value }))}
                  placeholder="e.g. Payment done via NEFT — credited to your account."
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
