import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { Loader2, Wallet, IndianRupee, TrendingUp, Clock, Building2, Smartphone, X, Download, Mail } from 'lucide-react';
import useSalesData, { inr } from '@/hooks/useSalesData';
import { salesData } from '@/data/salesAuth';
import { downloadWithdrawalSlipPDF } from '@/data/mentorDocumentsRepo';
import { SITE } from '@/constants/siteData';
import { useSalesAuth } from '@/contexts/SalesAuthContext';
import { SALES_ROUTES } from '@/constants/salesRoutes';
import { useNavigate } from 'react-router-dom';
import { formatDateTimeWithDay } from '@/utils/formatDateTime';
import AdminTable from '@/components/admin/AdminTable';
import AdminLoadMore from '@/components/admin/AdminLoadMore';
import { useLoadMore } from '@/hooks/useLoadMore';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const inputClass =
  'w-full border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white normal-case';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-1.5';

/** NexRNN ko payment query mail (payment ki info ke saath) */
function buildQueryMailto(row, member) {
  const fmt = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-');
  const subject = `Withdrawal Payment Query — ${row.withdrawalCode}`;
  const body = [
    'Withdrawal Payment Query',
    '',
    `Member Name: ${member?.name || row.accName || '-'}`,
    `Sales ID: ${member?.salesId || '-'}`,
    `Email: ${member?.email || '-'}`,
    `Phone: ${member?.phone || '-'}`,
    '',
    `Payment ID: ${row.withdrawalCode}`,
    `Amount: ${inr(row.amount)}`,
    `Status: ${row.status}`,
    `Requested On: ${fmt(row.requestedAt)}`,
    `Payment Ref No: ${row.refNo || '-'}`,
    '',
    'Your message :-',
  ].join('\n');
  return `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

const STATUS_STYLES = {
  Created: 'bg-blue-50 text-blue-700 border-blue-300',
  'In progress': 'bg-orange-50 text-orange-600 border-orange-300',
  'Payment Done': 'bg-green-50 text-green-700 border-green-300',
  Rejected: 'bg-red-50 text-red-700 border-red-300',
};

export default function SalesWithdrawals() {
  const { member } = useSalesAuth();
  const { data, error, loading } = useSalesData('withdrawal_list');
  const [form, setForm] = useState(null); // null = form band
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState(null);
  const [slipping, setSlipping] = useState(false);
  const navigate = useNavigate();

  const wallet = data?.wallet ?? { earned: 0, withdrawn: 0, pending: 0, available: 0 };
  const rows = data?.rows ?? [];

  const { visibleItems, hasMore, loadMore, total, shown } = useLoadMore(rows, '');

  const openForm = () => {
    const w = data?.wallet;
    setForm({
      amount: '',
      method: 'upi',
      accNo: '',
      accName: '',
      bankIfsc: '',
      upiId: data?.payout?.upiId || '',
      max: w ? w.available : 0,
    });
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    const amount = Math.round(Number(form.amount) || 0);
    if (amount <= 0) {
      toast.error('Enter a valid amount.');
      return;
    }
    if (amount > form.max) {
      toast.error(`Amount cannot exceed your wallet balance (${inr(form.max)}).`);
      return;
    }
    if (form.method === 'bank') {
      if (!/^\d{6,30}$/.test(form.accNo.trim())) {
        toast.error('Enter a valid bank account number (6-30 digits).');
        return;
      }
      if (!form.accName.trim()) {
        toast.error('Enter the account holder name.');
        return;
      }
      if (!/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(form.bankIfsc.trim())) {
        toast.error('Enter a valid IFSC code (e.g. SBIN0001234).');
        return;
      }
    } else if (!/^[\w.]{2,60}@[a-zA-Z]{2,20}$/.test(form.upiId.trim())) {
      toast.error('Enter a valid UPI ID (e.g. name@bank).');
      return;
    }
    setSaving(true);
    try {
      const res = await salesData('withdrawal_create', {
        amount,
        method: form.method,
        accNo: form.accNo.trim(),
        accName: form.accName.trim(),
        bankIfsc: form.bankIfsc.trim().toUpperCase(),
        upiId: form.upiId.trim(),
      });
      toast.success(`Payment request ${res?.request?.withdrawalCode || ''} sent to admin.`);
      navigate(0); // reload current page - wallet aur list refresh
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        navigate(SALES_ROUTES.login, { replace: true, state: err?.status === 403 ? { blockedMessage: err.message } : undefined });
        return;
      }
      toast.error(err.message || 'Could not send request.');
      setSaving(false);
    }
  };

  const handleSlip = async (row) => {
    setSlipping(true);
    try {
      await downloadWithdrawalSlipPDF(
        {
          withdrawalCode: row.withdrawalCode,
          name: row.name,
          mentorId: row.salesId, // slip helper ka generic id field
          idLabel: 'Sales ID',
          amount: row.amount,
          method: row.method,
          accNo: row.accNo,
          accName: row.accName,
          bankIfsc: row.bankIfsc,
          upiId: row.upiId,
          status: row.status,
          refNo: row.refNo,
          adminMessage: row.adminMessage,
          requestedAt: row.requestedAt,
          processedAt: row.processedAt,
        },
        { email: member?.email, phone: member?.phone }
      );
    } catch {
      toast.error('Could not generate slip.');
    } finally {
      setSlipping(false);
    }
  };

  const columns = [
    { key: 'payment_id', label: 'Payment ID', render: (r) => <span className="font-mono text-xs font-bold text-primary">{r.withdrawalCode}</span> },
    { key: 'amount', label: 'Amount', render: (r) => <span className="font-bold">{inr(r.amount)}</span> },
    { key: 'method', label: 'Method', render: (r) => (r.method === 'bank' ? 'Bank' : 'UPI') },
    { key: 'requested_at', label: 'Requested On', render: (r) => formatDateTimeWithDay(r.requestedAt) },
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
    {
      key: 'view',
      label: 'Details',
      render: (r) => <button onClick={() => setDetail(r)} className="text-xs font-bold text-primary hover:underline">Open</button>,
    },
  ];

  return (
    <div>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      <h1 className="font-heading text-3xl text-secondary mb-1">Withdrawal Payment</h1>
      <p className="text-sm text-muted normal-case mb-6">
        Request withdrawal of your earned commission — the NexRNN admin processes it and updates the status here.
      </p>

      {loading || !data ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-primary normal-case">{error}</p>
      ) : (
        <>
          {/* Wallet summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
            <StatCard icon={Wallet} label="Wallet Balance" value={inr(wallet.available)} sub="Available to withdraw" />
            <StatCard icon={TrendingUp} label="Total Earned" value={inr(wallet.earned)} />
            <StatCard icon={Clock} label="In Progress" value={inr(wallet.pending)} sub="Requested, not paid yet" />
            <StatCard icon={IndianRupee} label="Withdrawn" value={inr(wallet.withdrawn)} />
          </div>

          {/* Request button + note */}
          <div className="card-base bg-white p-5 sm:p-6 mb-8 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted normal-case max-w-xl">
              Withdrawals are sent from your wallet — you cannot request more than your available balance.
              Fill your bank details or UPI ID; the admin sees them when accepting the payment.
            </p>
            <button onClick={openForm} disabled={wallet.available <= 0} className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <IndianRupee size={15} /> Request Withdrawal
            </button>
          </div>

          {/* History */}
          <h2 className="text-sm font-bold text-secondary uppercase tracking-wide mb-3">Withdrawal History</h2>
          {rows.length === 0 ? (
            <div className="card-base bg-white p-8 text-center">
              <p className="text-sm text-muted normal-case">No withdrawal requests yet — your requests will appear here.</p>
            </div>
          ) : (
            <>
              <AdminTable columns={columns} rows={visibleItems} />
              <AdminLoadMore shown={shown} total={total} hasMore={hasMore} onLoadMore={loadMore} />
              <p className="text-[10px] text-muted normal-case mt-3">
                Statuses update automatically once the admin processes your payment.
              </p>
            </>
          )}
        </>
      )}

      {/* ---------- Request form modal ---------- */}
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
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-0.5">New Withdrawal Request</p>
                <h2 className="font-heading text-xl text-secondary">Available: {inr(form.max)}</h2>
              </div>
              <button onClick={() => setForm(null)} aria-label="Close" className="text-muted hover:text-secondary">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 sm:p-7 pt-4 space-y-4">
              <div>
                <label className={labelClass}>Amount (₹)</label>
                <input type="number" min="1" max={form.max} className={inputClass} value={form.amount} onChange={set('amount')} placeholder={`Max ${form.max}`} />
              </div>
              <div>
                <label className={labelClass}>Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, method: 'upi' }))}
                    className={`flex items-center justify-center gap-2 border-2 px-3 py-2.5 text-sm font-bold transition-colors ${form.method === 'upi' ? 'border-primary text-primary bg-primary/5' : 'border-secondary/20 text-muted hover:border-secondary/40'}`}
                  >
                    <Smartphone size={15} /> UPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, method: 'bank' }))}
                    className={`flex items-center justify-center gap-2 border-2 px-3 py-2.5 text-sm font-bold transition-colors ${form.method === 'bank' ? 'border-primary text-primary bg-primary/5' : 'border-secondary/20 text-muted hover:border-secondary/40'}`}
                  >
                    <Building2 size={15} /> Bank Account
                  </button>
                </div>
              </div>

              {form.method === 'bank' ? (
                <>
                  <div>
                    <label className={labelClass}>Account Number</label>
                    <input className={inputClass} value={form.accNo} onChange={set('accNo')} placeholder="6-30 digit account number" />
                  </div>
                  <div>
                    <label className={labelClass}>Account Holder Name</label>
                    <input className={inputClass} value={form.accName} onChange={set('accName')} placeholder="Name as per bank records" />
                  </div>
                  <div>
                    <label className={labelClass}>IFSC Code</label>
                    <input className={`${inputClass} uppercase`} value={form.bankIfsc} onChange={set('bankIfsc')} placeholder="e.g. SBIN0001234" />
                  </div>
                </>
              ) : (
                <div>
                  <label className={labelClass}>UPI ID</label>
                  <input className={inputClass} value={form.upiId} onChange={set('upiId')} placeholder="e.g. name@bank" />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button onClick={() => setForm(null)} className="btn-secondary">Cancel</button>
                <button onClick={submit} disabled={saving} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
                  {saving ? <><Loader2 size={15} className="animate-spin" /> Sending…</> : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Detail modal (slip + mail) ---------- */}
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
                <h2 className="font-heading text-xl text-secondary">{inr(detail.amount)}</h2>
                <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 border-2 ${STATUS_STYLES[detail.status] ?? STATUS_STYLES.Created}`}>
                  {detail.status}
                </span>
              </div>
              <button onClick={() => setDetail(null)} aria-label="Close" className="text-muted hover:text-secondary">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 sm:p-7 pt-4 space-y-5">
              <div className="bg-accent border-2 border-secondary/15 px-4 py-3.5 text-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-2">Payment Details</p>
                <div className="grid grid-cols-2 gap-y-2 gap-x-3">
                  <p className="text-muted text-xs">Requested On</p>
                  <p className="text-secondary">{formatDateTimeWithDay(detail.requestedAt)}</p>
                  <p className="text-muted text-xs">Processed On</p>
                  <p className="text-secondary">{detail.processedAt ? formatDateTimeWithDay(detail.processedAt) : '—'}</p>
                  <p className="text-muted text-xs">Payment Ref No</p>
                  <p className="text-secondary font-mono text-xs">{detail.refNo || '—'}</p>
                </div>
              </div>

              {detail.method === 'bank' ? (
                <div className="border-2 border-secondary/15 px-4 py-3.5 text-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-2">Bank Details</p>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-3">
                    <p className="text-muted text-xs">Account Number</p>
                    <p className="font-mono text-xs text-secondary">{detail.accNo || '—'}</p>
                    <p className="text-muted text-xs">Account Name</p>
                    <p className="text-secondary">{detail.accName || '—'}</p>
                    <p className="text-muted text-xs">IFSC Code</p>
                    <p className="font-mono text-xs text-secondary">{detail.bankIfsc || '—'}</p>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-secondary/15 px-4 py-3.5 text-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-2">UPI Details</p>
                  <p className="font-mono text-xs text-secondary break-all">{detail.upiId || '—'}</p>
                </div>
              )}

              {detail.adminMessage && (
                <div className="border-2 border-blue-200 bg-blue-50 px-4 py-3.5 text-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-1.5">Message from NexRNN Admin</p>
                  <p className="text-secondary normal-case">{detail.adminMessage}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSlip(detail)}
                  disabled={slipping}
                  className="inline-flex items-center gap-2 border-2 border-secondary/20 bg-white px-3.5 py-2 text-xs font-bold text-secondary hover:border-primary hover:text-primary transition-colors disabled:opacity-60"
                >
                  {slipping ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Download Slip
                </button>
                <a
                  href={buildQueryMailto(detail, member)}
                  className="inline-flex items-center gap-2 border-2 border-secondary/20 bg-white px-3.5 py-2 text-xs font-bold text-secondary hover:border-primary hover:text-primary transition-colors"
                >
                  <Mail size={14} /> Mail Query to NexRNN
                </a>
              </div>

              <div className="flex items-center justify-end">
                <button onClick={() => setDetail(null)} className="btn-secondary">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="card-base bg-white p-5">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-9 h-9 bg-primary/10 flex items-center justify-center shrink-0">
          <Icon size={17} className="text-primary" />
        </span>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{label}</p>
      </div>
      <p className="font-heading text-2xl sm:text-3xl text-secondary leading-none">{value}</p>
      {sub && <p className="text-[10px] text-muted normal-case mt-2">{sub}</p>}
    </div>
  );
}
