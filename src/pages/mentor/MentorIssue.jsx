import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Loader2, UploadCloud, Send, AlertTriangle, FileText } from 'lucide-react';
import useMentorData from '@/hooks/useMentorData';
import { useMentorAuth } from '@/contexts/MentorAuthContext';
import { mentorData } from '@/data/mentorAuth';
import { MENTOR_ROUTES } from '@/constants/mentorRoutes';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const inputClass =
  'w-full border-2 border-secondary/20 focus:border-primary px-4 py-2.5 text-sm outline-none transition-colors bg-white normal-case';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-2';

const STATUS_STYLES = {
  Open: 'bg-blue-50 text-blue-700 border-blue-300',
  'In Progress': 'bg-orange-50 text-orange-600 border-orange-300',
  Resolved: 'bg-green-50 text-green-700 border-green-300',
  Closed: 'bg-accent text-secondary border-secondary/30',
};

export default function MentorIssue() {
  const { mentor } = useMentorAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, error, loading } = useMentorData('issues', { refreshKey });

  const [form, setForm] = useState({ name: '', mobile: '', email: '', mentorId: '', issue: '' });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  // Profile se prefill (display-only - server identity token se leta hai)
  useEffect(() => {
    if (mentor) {
      setForm((f) => ({
        ...f,
        name: mentor.name || '',
        mobile: mentor.phone || '',
        email: mentor.email || '',
        mentorId: mentor.mentorId || '',
      }));
    }
  }, [mentor]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(f.type)) {
      toast.error('Only JPG, PNG, WEBP or PDF files are allowed.');
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      toast.error('Attachment must be under 2 MB.');
      return;
    }
    setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.issue.trim()) {
      toast.error('Please describe your issue.');
      return;
    }
    setSubmitting(true);
    try {
      let attachment = null;
      if (file) {
        attachment = {
          name: file.name,
          type: file.type,
          data: await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          }),
        };
      }
      await mentorData('issue_create', {
        issue: form.issue.trim(),
        attachment,
      });
      toast.success('Issue submitted. Our team will get back to you.');
      setForm((f) => ({ ...f, issue: '' }));
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      setRefreshKey((k) => k + 1); // soft refresh - full reload nahi
    } catch (err) {
      if (err?.status === 401) {
        navigate(MENTOR_ROUTES.login, { replace: true });
        return;
      }
      toast.error(err.message || 'Could not submit issue.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      <h1 className="font-heading text-3xl text-secondary mb-1">Report an Issue</h1>
      <p className="text-sm text-muted normal-case mb-6">Facing a problem? Tell the team — your Mentor ID is attached automatically.</p>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="card-base bg-white p-7 mb-8 space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Name</label>
              <input className={inputClass} value={form.name} onChange={set('name')} required />
            </div>
            <div>
              <label className={labelClass}>Mobile Number</label>
              <input type="tel" className={inputClass} value={form.mobile} onChange={set('mobile')} required />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" className={inputClass} value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className={labelClass}>Mentor ID</label>
              <input className={`${inputClass} font-mono uppercase`} value={form.mentorId} readOnly title="Auto-filled from your session" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Issue *</label>
            <textarea rows={4} className={`${inputClass} resize-y`} value={form.issue} onChange={set('issue')} placeholder="Describe your issue in detail…" required />
          </div>

          <div>
            <label className={labelClass}>Upload Attachment (optional — JPG, PNG, PDF, max 2 MB)</label>
            <label className="flex items-center gap-3 border-2 border-dashed border-secondary/25 px-4 py-3 text-sm text-muted cursor-pointer hover:border-primary transition-colors w-fit">
              <UploadCloud size={17} className="text-primary shrink-0" />
              {file ? file.name : 'Choose File'}
              <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleFile} />
            </label>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
            {submitting ? <><Loader2 size={15} className="animate-spin" /> Sending…</> : <><Send size={15} /> Send</>}
          </button>
        </form>

        <h2 className="text-sm font-bold text-secondary uppercase tracking-wide mb-4 flex items-center gap-2">
          <AlertTriangle size={15} className="text-primary" /> My Reported Issues
        </h2>
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <p className="text-sm text-primary normal-case">{error}</p>
        ) : !data?.rows?.length ? (
          <p className="text-sm text-muted normal-case">No issues reported yet.</p>
        ) : (
          <div className="space-y-3">
            {data.rows.map((i) => (
              <div key={i.issueId} className="card-base bg-white p-5">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="font-mono text-xs font-bold text-primary">{i.issueId}</p>
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 border-2 whitespace-nowrap ${STATUS_STYLES[i.status] ?? STATUS_STYLES.Open}`}>
                    {i.status}
                  </span>
                </div>
                <p className="text-sm text-secondary normal-case whitespace-pre-line">{i.issue}</p>
                {i.attachmentPath && (
                  <p className="text-[11px] text-muted normal-case mt-2 flex items-center gap-1.5">
                    <FileText size={12} /> Attachment attached
                  </p>
                )}
                {i.adminResponse && (
                  <div className="bg-accent border-2 border-secondary/15 px-4 py-3 mt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-1">Team Response</p>
                    <p className="text-xs text-secondary normal-case whitespace-pre-line">{i.adminResponse}</p>
                  </div>
                )}
                <p className="text-[10px] text-muted normal-case mt-2">
                  {new Date(i.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
