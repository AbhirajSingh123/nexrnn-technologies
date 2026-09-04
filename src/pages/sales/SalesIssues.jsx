import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { Loader2, Send, Paperclip, X } from 'lucide-react';
import useSalesData from '@/hooks/useSalesData';
import { salesData } from '@/data/salesAuth';
import { useNavigate } from 'react-router-dom';
import { formatDateTimeWithDay } from '@/utils/formatDateTime';
import { SALES_ROUTES } from '@/constants/salesRoutes';
import AdminTable from '@/components/admin/AdminTable';
import AdminLoadMore from '@/components/admin/AdminLoadMore';
import { useLoadMore } from '@/hooks/useLoadMore';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const inputClass =
  'w-full border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white normal-case';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-1.5';

const STATUS_STYLES = {
  Open: 'bg-blue-50 text-blue-700 border-blue-300',
  'In Progress': 'bg-orange-50 text-orange-600 border-orange-300',
  Resolved: 'bg-green-50 text-green-700 border-green-300',
  Closed: 'bg-accent text-secondary border-secondary/30',
  Rejected: 'bg-red-50 text-red-700 border-red-300',
};

export default function SalesIssues() {
  const { data, error, loading } = useSalesData('issues');
  const [form, setForm] = useState(null); // null = form band
  const [issue, setIssue] = useState('');
  const [attachment, setAttachment] = useState(null); // File
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState(null);
  const navigate = useNavigate();

  const rows = data?.rows ?? [];
  const { visibleItems, hasMore, loadMore, total, shown } = useLoadMore(rows, '');

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Could not read file.'));
      reader.readAsDataURL(file);
    });

  const submit = async () => {
    if (!issue.trim()) {
      toast.error('Please describe your issue.');
      return;
    }
    setSaving(true);
    try {
      let att = null;
      if (attachment) {
        const okTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!okTypes.includes(attachment.type)) {
          toast.error('Only JPG, PNG, WEBP or PDF files are allowed.');
          setSaving(false);
          return;
        }
        if (attachment.size > 2 * 1024 * 1024) {
          toast.error('Attachment must be under 2 MB.');
          setSaving(false);
          return;
        }
        att = { name: attachment.name, type: attachment.type, data: await fileToDataUrl(attachment) };
      }
      const res = await salesData('issue_create', { issue: issue.trim(), attachment: att });
      toast.success(`Issue ${res?.issue?.issueId || ''} submitted — the admin will respond soon.`);
      setForm(null);
      setIssue('');
      setAttachment(null);
      navigate(0);
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        navigate(SALES_ROUTES.login, { replace: true, state: err?.status === 403 ? { blockedMessage: err.message } : undefined });
        return;
      }
      toast.error(err.message || 'Could not submit issue.');
      setSaving(false);
    }
  };

  const columns = [
    { key: 'issue_id', label: 'Issue ID', render: (r) => <span className="font-mono text-xs font-bold text-primary">{r.issueId}</span> },
    { key: 'issue', label: 'Issue', render: (r) => <span className="normal-case block max-w-[320px] truncate">{r.issue}</span> },
    { key: 'attachment', label: 'Attachment', render: (r) => (r.attachmentPath ? 'Yes' : '—') },
    { key: 'created_at', label: 'Submitted', render: (r) => formatDateTimeWithDay(r.createdAt) },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 border-2 whitespace-nowrap ${STATUS_STYLES[r.status] ?? STATUS_STYLES.Open}`}>
          {r.status}
        </span>
      ),
    },
    { key: 'view', label: 'View', render: (r) => <button onClick={() => setDetail(r)} className="text-xs font-bold text-primary hover:underline">Open</button> },
  ];

  return (
    <div>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>

      <div className="flex items-center justify-between gap-4 mb-1 flex-wrap">
        <h1 className="font-heading text-3xl text-secondary">Report an Issue</h1>
        <button onClick={() => setForm(true)} className="btn-primary inline-flex items-center gap-2 shrink-0">
          <Send size={14} /> New Issue
        </button>
      </div>
      <p className="text-sm text-muted normal-case mb-6">Any problem or question — the NexRNN admin responds here.</p>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-primary normal-case">{error}</p>
      ) : rows.length === 0 ? (
        <div className="card-base bg-white p-8 text-center">
          <p className="text-sm text-muted normal-case">No issues yet — raise one and it will appear here with the admin's response.</p>
        </div>
      ) : (
        <>
          <AdminTable columns={columns} rows={visibleItems} />
          <AdminLoadMore shown={shown} total={total} hasMore={hasMore} onLoadMore={loadMore} />
        </>
      )}

      {/* ---------- New issue modal ---------- */}
      {form && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-secondary/70 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setForm(null);
          }}
        >
          <div className="w-full max-w-lg bg-white border-2 border-secondary max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 sm:px-7 pt-5">
              <h2 className="font-heading text-xl text-secondary">New Issue</h2>
              <button onClick={() => setForm(null)} aria-label="Close" className="text-muted hover:text-secondary">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 sm:p-7 pt-4 space-y-4">
              <div>
                <label className={labelClass}>Describe your issue</label>
                <textarea
                  rows={5}
                  className={`${inputClass} resize-y`}
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  placeholder="Write your problem here…"
                />
              </div>
              <div>
                <label className={labelClass}>Attachment (optional — JPG, PNG, WEBP or PDF, under 2 MB)</label>
                <label className="inline-flex items-center gap-2 border-2 border-secondary/20 bg-white px-3.5 py-2 text-xs font-bold text-secondary hover:border-primary hover:text-primary transition-colors cursor-pointer">
                  <Paperclip size={14} />
                  {attachment ? attachment.name : 'Choose file'}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    className="hidden"
                    onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button onClick={() => setForm(null)} className="btn-secondary">Cancel</button>
                <button onClick={submit} disabled={saving} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
                  {saving ? <><Loader2 size={15} className="animate-spin" /> Submitting…</> : 'Submit Issue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Issue detail modal ---------- */}
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
                  Issue — <span className="font-mono text-primary">{detail.issueId}</span>
                </p>
                <h2 className="font-heading text-xl text-secondary">{formatDateTimeWithDay(detail.createdAt)}</h2>
                <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 border-2 ${STATUS_STYLES[detail.status] ?? STATUS_STYLES.Open}`}>
                  {detail.status}
                </span>
              </div>
              <button onClick={() => setDetail(null)} aria-label="Close" className="text-muted hover:text-secondary">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 sm:p-7 pt-4 space-y-5">
              <div className="bg-accent border-2 border-secondary/15 px-4 py-3.5 text-sm normal-case">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-1.5">Your Issue</p>
                <p className="text-secondary whitespace-pre-wrap">{detail.issue}</p>
              </div>

              {detail.adminResponse ? (
                <div className="border-2 border-green-200 bg-green-50 px-4 py-3.5 text-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-1.5">Response from NexRNN Admin</p>
                  <p className="text-secondary normal-case whitespace-pre-wrap">{detail.adminResponse}</p>
                </div>
              ) : (
                <p className="text-xs text-muted normal-case">The admin has not responded yet — you will see the response here.</p>
              )}

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
