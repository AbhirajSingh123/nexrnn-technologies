import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';
import { Download, Eye, X, Loader2, CalendarDays, FileText, Award, Mail } from 'lucide-react';
import {
  fetchAdminApplications, updateApplicationAdmin, getResumeDownloadUrl, downloadApplicationPDF,
} from '@/data/applicationsRepo';
import { downloadCareerDocumentPDF } from '@/data/applicationDocumentsRepo';
import { buildApplicationMailto } from '@/utils/adminMailto';
import AdminTable from '@/components/admin/AdminTable';
import AdminLoadMore from '@/components/admin/AdminLoadMore';
import { useLoadMore } from '@/hooks/useLoadMore';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ExportButtons from '@/components/admin/ExportButtons';
import {
  APPLICATION_STATUSES, CERTIFICATE_STATUSES,
} from '@/constants/applicationOptions';

const inputClass =
  'w-full border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white normal-case';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-1.5';

const STATUS_STYLES = {
  Applied: 'bg-accent text-secondary border-secondary/30',
  'Under Review': 'bg-blue-50 text-blue-700 border-blue-300',
  Shortlisted: 'bg-purple-50 text-purple-700 border-purple-300',
  Interview: 'bg-orange-50 text-orange-700 border-orange-300',
  Selected: 'bg-green-50 text-green-700 border-green-300',
  Rejected: 'bg-red-50 text-primary border-red-300',
};

// Duration -> months (end date auto-calc ke liye)
const DURATION_MONTHS = { '1 Month': 1, '2 Months': 2, '3 Months': 3, '6 Months': 6 };

export default function AdminInternshipApplications() {
  const [rows, setRows] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const openingFilter = searchParams.get('opening') || '';
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // edit form state
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminApplications();
      setRows(data ?? []);
    } catch {
      toast.error('Failed to load applications.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // filters + search (application id / name / email / mobile / opening)
  const filtered = rows.filter((r) => {
    if (openingFilter && r.openingSlug !== openingFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (typeFilter !== 'all' && r.applicationType !== typeFilter) return false;
    const q = search.trim().toLowerCase();
    if (q) {
      const hay = [r.applicationId, r.fullName, r.email, r.mobile, r.openingTitle, r.studentDomain]
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const openDetail = (row) => {
    setEditing({
      id: row.id,
      row,
      status: row.status,
      startDate: row.startDate || '',
      endDate: row.endDate || '',
      certificateStatus: row.certificateStatus,
      adminRemarks: row.adminRemarks || '',
      paymentStatus: row.paymentStatus || 'free',
      paymentAmount: row.paymentAmount ?? 0,
      paymentId: row.cfPaymentId || '',
      orderId: row.orderId || '',
      paymentMethod: row.paymentMethod || '',
    });
  };

  const autoCalculateEnd = () => {
    setEditing((prev) => {
      if (!prev) return prev;
      const months = DURATION_MONTHS[prev.row.duration];
      if (!months || !prev.startDate) {
        toast.info('Auto-calculate needs an internship duration and a start date.');
        return prev;
      }
      const end = new Date(prev.startDate + 'T00:00:00');
      end.setMonth(end.getMonth() + months);
      end.setDate(end.getDate() - 1);
      const iso = end.toISOString().slice(0, 10);
      return { ...prev, endDate: iso };
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await updateApplicationAdmin(editing.id, {
        status: editing.status,
        startDate: editing.startDate,
        endDate: editing.endDate,
        certificateStatus: editing.certificateStatus,
        adminRemarks: editing.adminRemarks,
        paymentStatus: editing.paymentStatus,
        paymentAmount: editing.paymentAmount,
        paymentId: editing.paymentId,
        orderId: editing.orderId,
        paymentMethod: editing.paymentMethod,
      });
      toast.success('Application updated.');
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadResume = async (row) => {
    if (!row.resumePath) {
      toast.error('No resume attached.');
      return;
    }
    setDownloading(true);
    try {
      const url = await getResumeDownloadUrl(row.resumePath);
      if (!url) throw new Error('Link could not be created.');
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      toast.error(err.message || 'Download failed.');
    } finally {
      setDownloading(false);
    }
  };

  const columns = [
    { key: 'application_id', label: 'Application ID', render: (r) => (
      <span className="font-mono text-xs text-primary font-bold">{r.applicationId || '—'}</span>
    ) },
    { key: 'opening', label: 'Opening (ID)', render: (r) => (
      <span className="text-xs text-secondary normal-case">
        {r.openingCode && (
          <span className="font-mono font-bold text-primary block">{r.openingCode}</span>
        )}
        <span className="line-clamp-1 max-w-[160px] block">{r.openingTitle || '—'}</span>
      </span>
    ) },
    { key: 'openingDomain', label: 'Domain', render: (r) => (
      <span className="text-xs text-secondary normal-case">{r.openingDomain || r.assignedDomain || '—'}</span>
    ) },
    { key: 'payment', label: 'Payment', render: (r) => {
      if (r.paymentStatus === 'free') {
        return <span className="text-[11px] font-bold uppercase px-2 py-0.5 border border-green-200 bg-green-50 text-green-700">Free</span>;
      }
      if (r.paymentStatus === 'paid') {
        return (
          <span className="text-xs text-secondary normal-case">
            <span className="block font-bold text-green-700">Paid \u20b9{r.paymentAmount}</span>
            <span className="block text-muted font-mono text-[10px]">{r.cfPaymentId || r.orderId || ''}</span>
          </span>
        );
      }
      return <span className="text-[11px] font-bold uppercase px-2 py-0.5 border border-orange-200 bg-orange-50 text-orange-700">Pending</span>;
    } },
    { key: 'submitted_at', label: 'Applied On', render: (r) => (
      <span className="text-xs text-secondary normal-case whitespace-nowrap">
        {r.submittedAt ? new Date(r.submittedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : '—'}
      </span>
    ) },
    { key: 'fullName', label: 'Name', render: (r) => (
      <span className="text-sm font-semibold text-secondary normal-case">{r.fullName}</span>
    ) },
    { key: 'mobile', label: 'Contact', render: (r) => (
      <span className="text-xs text-secondary normal-case">
        {r.mobile}
        <br />
        <span className="text-muted">{r.email}</span>
      </span>
    ) },
    { key: 'applicationType', label: 'Type', render: (r) => (
      <span className={`text-[11px] font-bold uppercase px-2 py-0.5 border ${r.applicationType === 'internship' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
        {r.applicationType === 'internship' ? 'Internship' : 'Job'}
      </span>
    ) },
    { key: 'status', label: 'Status', render: (r) => (
      <span className={`text-[11px] font-bold uppercase px-2 py-0.5 border whitespace-nowrap ${STATUS_STYLES[r.status] ?? STATUS_STYLES.Applied}`}>
        {r.status}
      </span>
    ) },
    { key: 'certificate', label: 'Certificate/LOR', render: (r) => (
      <span className="text-[11px] font-bold uppercase px-2 py-0.5 border border-secondary/20 bg-white text-muted whitespace-nowrap">
        {r.certificateStatus}
      </span>
    ) },
    { key: 'mail', label: 'Mail', render: (r) => (
      <a
        href={buildApplicationMailto({
          fullName: r.fullName,
          email: r.email,
          applicationId: r.applicationId,
          openingCode: r.openingCode,
          openingTitle: r.openingTitle,
          domain: r.openingDomain,
          typeLabel: r.applicationType === 'internship' ? 'Internship' : 'Job',
        })}
        className="text-primary font-semibold hover:underline text-xs"
        title={`Email ${r.email}`}
      >
        Send
      </a>
    ) },
    { key: 'resume', label: 'Resume', render: (r) => (
      r.resumePath ? (
        <button onClick={() => handleDownloadResume(r)} className="inline-flex items-center gap-1 text-xs text-primary hover:underline" title="Download resume">
          <Download size={12} /> {downloading ? '…' : 'PDF'}
        </button>
      ) : (
        <span className="text-xs text-muted">—</span>
      )
    ) },
    { key: 'view', label: 'Manage', render: (r) => (
      <button onClick={() => openDetail(r)} className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
        <Eye size={13} /> Open
      </button>
    ) },
  ];

  // Export ke liye FULL rows
  const exportRows = filtered.map((r) => ({
    application_id: r.applicationId || '',
    payment_status: r.paymentStatus === 'free' ? 'Free' : r.paymentStatus === 'paid' ? 'Paid' : 'Pending',
    payment_amount: r.paymentAmount ?? 0,
    payment_id: r.cfPaymentId || '',
    order_id: r.orderId || '',
    payment_method: r.paymentMethod || '',
    type: r.applicationType === 'internship' ? 'Internship' : 'Job',
    opening_id: r.openingCode || '',
    opening: r.openingTitle || '',
    domain: r.openingDomain || r.assignedDomain || '',
    applied_on: r.submittedAt ? new Date(r.submittedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : '',
    submission_date: r.submissionDate || '',
    name: r.fullName || '',
    email: r.email || '',
    mobile: r.mobile || '',
    gender: r.gender || '',
    city: r.city || '',
    state: r.state || '',
    duration: r.duration || '',
    preferred_mode: r.preferredMode || '',
    college: r.college || '',
    degree: r.degree || '',
    degree_other: r.degreeOther || '',
    skills: r.skills || '',
    expectations: r.expectations || '',
    resume_file: r.resumeName || '',
    internship_start: r.startDate || '',
    internship_end: r.endDate || '',
    status: r.status || '',
    certificate_lor_status: r.certificateStatus || '',
    admin_remarks: r.adminRemarks || '',
  }));

  // Export columns: exportRows keys se EXACT match (blank fields fix)
  const exportColumns = [
    { key: 'application_id', label: 'Application ID' },
    { key: 'opening_id', label: 'Opening ID' },
    { key: 'opening', label: 'Opening' },
    { key: 'domain', label: 'Domain' },
    { key: 'type', label: 'Type' },
    { key: 'applied_on', label: 'Applied On' },
    { key: 'submission_date', label: 'Submission Date' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'gender', label: 'Gender' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'duration', label: 'Duration' },
    { key: 'preferred_mode', label: 'Preferred Mode' },
    { key: 'college', label: 'University / College' },
    { key: 'degree', label: 'Degree' },
    { key: 'degree_other', label: 'Degree (Others)' },
    { key: 'skills', label: 'Skills' },
    { key: 'expectations', label: 'Expectations' },
    { key: 'payment_status', label: 'Payment Status' },
    { key: 'payment_amount', label: 'Amount' },
    { key: 'payment_id', label: 'Payment ID' },
    { key: 'order_id', label: 'Order ID' },
    { key: 'payment_method', label: 'Method' },
    { key: 'resume_file', label: 'Resume File' },
    { key: 'internship_start', label: 'Internship/Job Start Date' },
    { key: 'internship_end', label: 'Internship/Job End Date' },
    { key: 'status', label: 'Application Status' },
    { key: 'certificate_lor_status', label: 'Certificate/LOR' },
    { key: 'admin_remarks', label: 'Admin Remarks' },
  ];

  const { visibleItems, hasMore, loadMore, total, shown } = useLoadMore(filtered, search + '|' + filtered.length);

  return (
    <div>
      <h1 className="font-heading text-3xl text-secondary mb-1">Internship / Job Applications</h1>
      <p className="text-sm text-muted normal-case mb-4">
        Applications from the Careers page. Manage status, dates, certificates and internal remarks here.
      </p>
      {openingFilter && (
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="text-xs font-bold text-primary bg-primary/5 border-2 border-primary/30 px-3 py-1.5">
            Filtered by opening: {rows.find((r) => r.openingSlug === openingFilter)?.openingTitle || openingFilter}
          </span>
          <button
            onClick={() => setSearchParams({})}
            className="text-xs font-bold text-muted hover:text-primary underline normal-case"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-3 mb-5">
        <div className="flex-1 min-w-[200px]">
          <label className={labelClass}>Search</label>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ID, name, email, mobile, opening…" className={inputClass} />
        </div>
        <div className="w-full lg:w-44">
          <label className={labelClass}>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputClass}>
            <option value="all">All Statuses</option>
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="w-full lg:w-40">
          <label className={labelClass}>Type</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={inputClass}>
            <option value="all">All Types</option>
            <option value="internship">Internship</option>
            <option value="job">Job</option>
          </select>
        </div>
        <ExportButtons rows={exportRows} columns={exportColumns} filename="internship-applications" title="Applications" excludeKeys={['mail', 'resume', 'view']} />
      </div>

      {loading ? (
        <LoadingSpinner className="min-h-[40vh]" />
      ) : (
        <>
          <AdminTable columns={columns} rows={visibleItems} emptyLabel="No applications yet." />
          <AdminLoadMore hasMore={hasMore} onLoadMore={loadMore} total={total} shown={shown} />
        </>
      )}

      {/* Detail / manage modal */}
      {editing && <ApplicationDetailModal
        editing={editing}
        setEditing={setEditing}
        onSave={handleSave}
        saving={saving}
        onDownloadResume={() => handleDownloadResume(editing.row)}
        onAutoCalculateEnd={autoCalculateEnd}
        onToast={(msg, type) => (type === 'error' ? toast.error(msg) : toast.success(msg))}
      />}
    </div>
  );
}

function ApplicationDetailModal({ editing, setEditing, onSave, saving, onDownloadResume, onAutoCalculateEnd, onToast }) {
  const r = editing.row;
  const set = (name, value) => setEditing((prev) => ({ ...prev, [name]: value }));
  const [docBusy, setDocBusy] = useState('');

  // Application documents build karo (PDF details ke liye snapshot)
  const buildDocData = () => ({
    applicationId: r.applicationId,
    openingCode: r.openingCode,
    openingTitle: r.openingTitle,
    domain: r.openingDomain || '',
    typeLabel: r.applicationType === 'internship' ? 'Internship' : 'Job',
    applicationType: r.applicationType,
    fullName: r.fullName,
    startDate: r.startDate,
    endDate: r.endDate,
  });

  const handleDocDownload = async (kind) => {
    setDocBusy(kind);
    try {
      if (kind === 'application') {
        await downloadApplicationPDF({
          applicationId: r.applicationId,
          openingCode: r.openingCode,
          openingTitle: r.openingTitle,
          openingDomain: r.openingDomain || '',
          applicationType: r.applicationType,
          submittedOn: r.submittedAt ? new Date(r.submittedAt).toLocaleString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : '',
          fullName: r.fullName,
          email: r.email,
          mobile: r.mobile,
          gender: r.gender,
          city: r.city,
          state: r.state,
          duration: r.duration,
          college: r.college,
          degree: r.degree,
          degreeOther: r.degreeOther,
          skills: r.skills,
          expectations: r.expectations,
          payment: r.paymentStatus === 'paid' ? {
            paymentId: r.cfPaymentId,
            amount: `\u20b9${Number(r.paymentAmount || 0).toLocaleString('en-IN')}`,
            orderId: r.orderId,
            method: r.paymentMethod || '\u2014',
          } : null,
        });
      } else {
        await downloadCareerDocumentPDF(buildDocData(), kind);
      }
    } catch (err) {
      onToast(err.message || 'Download failed.', 'error');
    } finally {
      setDocBusy('');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-secondary/60 p-4 py-10">
      <div className="relative w-full max-w-3xl bg-white border-2 border-secondary shadow-[8px_8px_0_#1D6FE0] p-6 sm:p-8">
        <button onClick={() => setEditing(null)} className="absolute top-4 right-4 text-muted hover:text-primary transition-colors" aria-label="Close">
          <X size={20} />
        </button>

        <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Application — {r.applicationId}</p>
        <h2 className="font-bold text-secondary text-xl mb-1 normal-case">{r.fullName}</h2>
        <p className="text-xs text-muted normal-case mb-3 flex items-center gap-2 flex-wrap">
          <CalendarDays size={13} />
          Applied on {r.submittedAt ? new Date(r.submittedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'}
          {' • '}
          {r.applicationType === 'internship' ? 'Internship' : 'Job'}{r.openingTitle ? ` — ${r.openingTitle}` : ''}
        </p>
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {r.openingCode && (
            <span className="text-[10px] font-mono font-bold text-primary border-2 border-primary/30 px-2 py-1">
              Opening ID: {r.openingCode}
            </span>
          )}
          {r.openingDomain && (
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted border-2 border-secondary/15 px-2 py-1">
              {r.openingDomain}
            </span>
          )}
        </div>

        {/* Student details (read-only) */}
        <div className="grid sm:grid-cols-2 gap-4 mb-7 text-sm">
          <Detail label="Name" value={r.fullName} />
          <Detail label="Email" value={r.email} />
          <Detail label="Mobile" value={r.mobile} />
          <Detail label="Gender" value={r.gender} />
          <Detail label="City" value={r.city} />
          <Detail label="State" value={r.state} />
          {r.applicationType === 'internship' && (
            <>
              <Detail label="Duration" value={r.duration} />
              <Detail label="Preferred Mode" value={r.preferredMode} />
            </>
          )}
          <Detail label="University / College" value={r.college} />
          <Detail label="Degree / Program" value={r.degree === 'Others' && r.degreeOther ? `${r.degree} — ${r.degreeOther}` : r.degree} />
          <Detail label="Skills" value={r.skills} />
          <Detail label="Expectations" value={r.expectations} full />
          <div className="sm:col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-1.5">Download Documents</p>
            <div className="flex flex-wrap gap-2.5">
              <DocButton
                icon={FileText}
                label="Application"
                sub="All details"
                busy={docBusy === 'application'}
                onClick={() => handleDocDownload('application')}
              />
              <DocButton
                icon={Award}
                label="Certificate"
                sub="Completion"
                busy={docBusy === 'certificate'}
                onClick={() => handleDocDownload('certificate')}
              />
              <DocButton
                icon={Mail}
                label="LOR"
                sub="Recommendation"
                busy={docBusy === 'lor'}
                onClick={() => handleDocDownload('lor')}
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-1.5">Resume</p>
            {r.resumePath ? (
              <button onClick={onDownloadResume} className="inline-flex items-center gap-2 border-2 border-secondary/20 bg-white px-3.5 py-2 text-xs font-bold text-secondary hover:border-primary hover:text-primary transition-colors">
                <Download size={13} /> {r.resumeName || 'Download resume'}
              </button>
            ) : (
              <p className="text-xs text-muted normal-case">Not attached</p>
            )}
          </div>
        </div>

        {/* Admin-controlled payment info */}
        <div className="border-t-2 border-secondary/10 pt-6 mb-6">
          <h3 className="text-sm font-bold text-secondary uppercase tracking-wide mb-4">Payment (Admin Control)</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Payment Status</label>
              <select
                value={editing.paymentStatus}
                onChange={(e) => {
                  const v = e.target.value;
                  setEditing((prev) => {
                    if (!prev) return prev;
                    if (v === 'free') {
                      // Free: manual/offline — payment fields clean karo
                      return { ...prev, paymentStatus: v, paymentAmount: 0, paymentId: '', orderId: '', paymentMethod: '' };
                    }
                    if (v === 'paid' && !prev.orderId && !prev.paymentId) {
                      // Paid: application row me Cashfree data hai to auto fill
                      return {
                        ...prev,
                        paymentStatus: v,
                        paymentAmount: prev.row.paymentAmount || prev.paymentAmount || 0,
                        paymentId: prev.row.cfPaymentId || prev.paymentId || '',
                        orderId: prev.row.orderId || prev.orderId || '',
                        paymentMethod: prev.row.paymentMethod || prev.paymentMethod || '',
                      };
                    }
                    return { ...prev, paymentStatus: v };
                  });
                }}
                className={inputClass}
              >
                <option value="free">Free (no payment needed)</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Amount (₹)</label>
              <input
                type="number"
                min="0"
                value={editing.paymentAmount || ''}
                onChange={(e) => set('paymentAmount', e.target.value)}
                className={inputClass}
                disabled={editing.paymentStatus === 'free'}
                placeholder="0"
              />
            </div>
            <div>
              <label className={labelClass}>Payment ID</label>
              <input value={editing.paymentId} onChange={(e) => set('paymentId', e.target.value)} className={`${inputClass} font-mono text-xs`} placeholder="CF payment id / UTR / offline ref" />
            </div>
            <div>
              <label className={labelClass}>Order ID</label>
              <input value={editing.orderId} onChange={(e) => set('orderId', e.target.value)} className={`${inputClass} font-mono text-xs`} placeholder="order id" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Method</label>
              <input value={editing.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)} className={`${inputClass} normal-case`} placeholder="e.g. UPI, Credit Card, Bank Transfer" />
            </div>
          </div>
        </div>

        {/* Admin controls */}
        <div className="border-t-2 border-secondary/10 pt-6">
          <h3 className="text-sm font-bold text-secondary uppercase tracking-wide mb-4">Admin Controls</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Application Status</label>
              <select value={editing.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
                {APPLICATION_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Internship/Job Start Date</label>
              <input type="date" value={editing.startDate} onChange={(e) => set('startDate', e.target.value)} className={inputClass} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`${labelClass} !mb-0`}>Internship/Job End Date</label>
                <button type="button" onClick={onAutoCalculateEnd} className="text-[11px] font-bold text-primary hover:underline normal-case">
                  Auto-calculate from duration
                </button>
              </div>
              <input type="date" value={editing.endDate} onChange={(e) => set('endDate', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Certificate/LOR Status</label>
              <select value={editing.certificateStatus} onChange={(e) => set('certificateStatus', e.target.value)} className={inputClass}>
                {CERTIFICATE_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className={labelClass}>Admin Remarks (internal — students ko kabhi nahi dikhega)</label>
            <textarea rows={3} value={editing.adminRemarks} onChange={(e) => set('adminRemarks', e.target.value)} className={`${inputClass} resize-y`} placeholder="e.g. Strong technical profile / Needs additional verification" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-7">
          <button onClick={() => setEditing(null)} className="btn-secondary">
            Cancel
          </button>
          <button onClick={onSave} disabled={saving} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
            {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DocButton({ icon: Icon, label, sub, busy, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-2.5 border-2 border-secondary/20 bg-white px-3.5 py-2.5 hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-60"
    >
      {busy ? <Loader2 size={16} className="text-primary animate-spin" /> : <Icon size={16} className="text-primary shrink-0" />}
      <span className="text-left">
        <span className="block text-xs font-bold text-secondary">{label}</span>
        <span className="block text-[10px] text-muted normal-case">{busy ? 'Downloading…' : sub}</span>
      </span>
    </button>
  );
}

function Detail({ label, value, full = false, highlight = false }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-0.5">{label}</p>
      <p className={`text-sm normal-case ${highlight ? 'font-bold text-primary' : 'text-secondary'}`}>
        {value || '—'}
      </p>
    </div>
  );
}
