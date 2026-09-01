import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '@/services/supabaseClient';
import { formatDateTimeWithDay } from '@/utils/formatDateTime';
import AdminTable from '@/components/admin/AdminTable';
import AdminFilterBar from '@/components/admin/AdminFilterBar';
import AdminLoadMore from '@/components/admin/AdminLoadMore';
import { useLoadMore } from '@/hooks/useLoadMore';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ExportButtons from '@/components/admin/ExportButtons';
import { X, Download, Loader2 } from 'lucide-react';

const inputClass =
  'w-full border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white normal-case';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-1.5';

const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

const STATUS_STYLES = {
  Open: 'bg-blue-50 text-blue-700 border-blue-300',
  'In Progress': 'bg-orange-50 text-orange-600 border-orange-300',
  Resolved: 'bg-green-50 text-green-700 border-green-300',
  Closed: 'bg-accent text-secondary border-secondary/30',
};

export default function AdminMentorIssues() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detail, setDetail] = useState(null);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('mentor_issues')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error('Failed to load mentor issues.');
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = rows.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    const q = search.trim().toLowerCase();
    if (q && ![r.issue_id, r.mentor_id, r.name, r.mobile, r.email, r.issue].join(' ').toLowerCase().includes(q)) return false;
    return true;
  });

  const { visibleItems, hasMore, loadMore, total, shown } = useLoadMore(filtered, `${search}|${statusFilter}`);

  const exportRows = filtered.map((r) => ({
    issue_id: r.issue_id,
    mentor_id: r.mentor_id,
    name: r.name,
    mobile: r.mobile,
    email: r.email,
    issue: r.issue,
    status: r.status,
    admin_response: r.admin_response || '',
    has_attachment: r.attachment_path ? 'Yes' : 'No',
    submitted_at: formatDateTimeWithDay(r.created_at),
  }));

  const columns = [
    { key: 'issue_id', label: 'Issue ID', render: (r) => <span className="font-mono text-xs font-bold text-primary">{r.issue_id}</span> },
    { key: 'mentor_id', label: 'Mentor ID', render: (r) => <span className="font-mono text-xs">{r.mentor_id}</span> },
    { key: 'name', label: 'Name', render: (r) => <span className="font-semibold text-secondary">{r.name}</span> },
    { key: 'mobile', label: 'Mobile' },
    { key: 'email', label: 'Email', render: (r) => <span className="normal-case break-all">{r.email}</span> },
    { key: 'issue', label: 'Issue', render: (r) => <span className="normal-case block max-w-[260px] truncate">{r.issue}</span> },
    { key: 'attachment', label: 'Attachment', render: (r) => (r.attachment_path ? 'Yes' : '—') },
    { key: 'created_at', label: 'Submitted', render: (r) => formatDateTimeWithDay(r.created_at) },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 border-2 whitespace-nowrap ${STATUS_STYLES[r.status] ?? STATUS_STYLES.Open}`}>
          {r.status}
        </span>
      ),
    },
    { key: 'view', label: 'Manage', render: (r) => <button onClick={() => setDetail(r)} className="text-xs font-bold text-primary hover:underline">Open</button> },
  ];

  const handleSave = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('mentor_issues')
        .update({ status: detail.status, admin_response: detail.admin_response || '', updated_at: new Date().toISOString() })
        .eq('id', detail.id);
      if (error) throw error;
      toast.success('Issue updated.');
      setDetail(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to update issue.');
    } finally {
      setSaving(false);
    }
  };

  const handleAttachment = async () => {
    if (!detail?.attachment_path) return;
    setDownloading(true);
    try {
      const { data, error } = await supabase.storage
        .from('mentor-issues')
        .createSignedUrl(detail.attachment_path, 300);
      if (error || !data?.signedUrl) throw error || new Error('No URL');
      window.open(data.signedUrl, '_blank', 'noopener');
    } catch {
      toast.error('Could not open attachment.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <h1 className="font-heading text-3xl text-secondary mb-1">Mentor Issues</h1>
      <p className="text-sm text-muted normal-case mb-6">Issues reported by mentors — track, respond and resolve.</p>

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search issue ID, mentor, name, email…"
        extra={
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-muted mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white"
            >
              <option value="all">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        }
      />

      <div className="mb-4">
        <ExportButtons rows={exportRows} columns={columns} filename="mentor-issues" title="Mentor Issues" excludeKeys={['view']} />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <AdminTable columns={columns} rows={visibleItems} />
          <AdminLoadMore shown={shown} total={total} hasMore={hasMore} onLoadMore={loadMore} />
        </>
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
                  Issue — <span className="font-mono text-primary">{detail.issue_id}</span>
                </p>
                <h2 className="font-heading text-xl text-secondary">{detail.name}</h2>
                <p className="text-xs text-muted normal-case mt-0.5">
                  {detail.mentor_id} &bull; {detail.mobile} &bull; <span className="normal-case">{detail.email}</span>
                </p>
              </div>
              <button onClick={() => setDetail(null)} aria-label="Close" className="text-muted hover:text-secondary">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 sm:p-7 pt-4 space-y-5">
              <div className="bg-accent border-2 border-secondary/15 px-4 py-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-1">Issue</p>
                <p className="text-sm text-secondary normal-case whitespace-pre-line">{detail.issue}</p>
                <p className="text-[10px] text-muted normal-case mt-2">Submitted on {formatDateTimeWithDay(detail.created_at)}</p>
              </div>

              {detail.attachment_path ? (
                <button
                  type="button"
                  onClick={handleAttachment}
                  disabled={downloading}
                  className="inline-flex items-center gap-2 border-2 border-secondary/20 bg-white px-3.5 py-2 text-xs font-bold text-secondary hover:border-primary hover:text-primary transition-colors disabled:opacity-60"
                >
                  {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Download Attachment
                </button>
              ) : (
                <p className="text-xs text-muted normal-case">No attachment.</p>
              )}

              <div>
                <label className={labelClass}>Status</label>
                <select
                  value={detail.status}
                  onChange={(e) => setDetail((d) => ({ ...d, status: e.target.value }))}
                  className={inputClass}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Admin Response (visible to the mentor)</label>
                <textarea
                  rows={3}
                  className={`${inputClass} resize-y`}
                  value={detail.admin_response || ''}
                  onChange={(e) => setDetail((d) => ({ ...d, admin_response: e.target.value }))}
                  placeholder="e.g. Issue resolved — payment verified."
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
