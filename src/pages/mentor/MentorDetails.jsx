import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Loader2, FileText, IdCard } from 'lucide-react';
import useMentorData from '@/hooks/useMentorData';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { downloadMentorOfferLetterPDF, downloadMentorProfilePDF } from '@/data/mentorDocumentsRepo';

function typeName(t) {
  return t === 'course' ? 'Courses' : t === 'workshop' ? 'Workshops' : 'Courses & Workshops (Both)';
}

export default function MentorDetails() {
  const { data, error, loading } = useMentorData('profile');
  const mentorKind = data?.mentor?.mentorType || 'both';
  const [docBusy, setDocBusy] = useState('');

  const handleDoc = async (kind) => {
    if (!data?.mentor) return;
    setDocBusy(kind);
    try {
      if (kind === 'offer') await downloadMentorOfferLetterPDF(data.mentor);
      else await downloadMentorProfilePDF(data.mentor);
    } catch {
      /* pdf error already handled in repo */
    } finally {
      setDocBusy('');
    }
  };

  return (
    <div>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      <h1 className="font-heading text-3xl text-secondary mb-1">Mentor Details</h1>
      <p className="text-sm text-muted normal-case mb-6">Your profile and association details.</p>

      {loading || !data ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-primary normal-case">{error}</p>
      ) : (
        <>
          <div className="card-base bg-white p-7 mb-6">
            <div className="flex items-center gap-4 mb-6">
              {/* Profile photo DB me nahi hai - initials avatar */}
              <span className="w-14 h-14 bg-primary text-white flex items-center justify-center font-heading text-xl shrink-0">
                {(data.mentor.name || 'M').charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Mentor ID</p>
                <p className="font-mono font-bold text-primary">{data.mentor.mentorId}</p>
                <h2 className="font-heading text-xl text-secondary mt-0.5">{data.mentor.name}</h2>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5 text-sm">
              <Detail label="Full Name" value={data.mentor.name} />
              <Detail label="Email" value={data.mentor.email} />
              <Detail label="Mobile Number" value={data.mentor.phone} />
              <Detail label="Location" value={data.mentor.location} />
              <Detail label="Date of Joining" value={data.mentor.dateOfJoining || '—'} />
              <Detail label="Mentor Status" value="Active" />
              <Detail label="Mentor Type" value={typeName(data.mentor.mentorType)} />
              {mentorKind !== 'workshop' && <Detail label="Course Commission" value={`${data.mentor.commissionCourse ?? data.mentor.commissionPercent ?? 0}%`} />}
              {mentorKind !== 'course' && <Detail label="Workshop Commission" value={`${data.mentor.commissionWorkshop ?? data.mentor.commissionPercent ?? 0}%`} />}
              <Detail label="Gender" value={data.mentor.gender || '—'} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 mb-6">
            <div className={`card-base bg-white p-6 ${mentorKind === 'workshop' ? 'hidden' : ''}`}>
              <h3 className="text-sm font-bold text-secondary uppercase tracking-wide mb-3">Assigned Courses</h3>
              {data.assignedCourses.length === 0 ? (
                <p className="text-xs text-muted normal-case">None yet</p>
              ) : (
                <ul className="space-y-2.5">
                  {data.assignedCourses.map((c) => (
                    <li key={c.title + c.batchId} className="text-sm">
                      <span className="font-semibold text-secondary">{c.title}</span>
                      {c.batchId && <span className="block text-[10px] font-mono text-muted">{c.batchId}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className={`card-base bg-white p-6 ${mentorKind === 'course' ? 'hidden' : ''}`}>
              <h3 className="text-sm font-bold text-secondary uppercase tracking-wide mb-3">Assigned Workshops</h3>
              {data.assignedWorkshops.length === 0 ? (
                <p className="text-xs text-muted normal-case">None yet</p>
              ) : (
                <ul className="space-y-2.5">
                  {data.assignedWorkshops.map((w) => (
                    <li key={w.title + w.batchId} className="text-sm">
                      <span className="font-semibold text-secondary">{w.title}</span>
                      {w.batchId && <span className="block text-[10px] font-mono text-muted">{w.batchId}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="card-base bg-white p-6">
            <h3 className="text-sm font-bold text-secondary uppercase tracking-wide mb-4">My Documents</h3>
            <div className="flex flex-wrap gap-3">
              <DocButton
                icon={FileText}
                label="Download Offer Letter"
                busy={docBusy === 'offer'}
                onClick={() => handleDoc('offer')}
              />
              <DocButton
                icon={IdCard}
                label="Download Profile"
                busy={docBusy === 'profile'}
                onClick={() => handleDoc('profile')}
              />
            </div>
            <p className="text-[10px] text-muted normal-case mt-3">
              Documents are generated live from your own profile — no files are shared or stored publicly.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-0.5">{label}</p>
      <p className="text-sm text-secondary break-words">{value || '—'}</p>
    </div>
  );
}

function DocButton({ icon: Icon, label, busy, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-2.5 border-2 border-secondary/20 bg-white px-4 py-2.5 hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-60"
    >
      {busy ? <Loader2 size={16} className="text-primary animate-spin" /> : <Icon size={16} className="text-primary shrink-0" />}
      <span className="text-xs font-bold text-secondary">{busy ? 'Downloading…' : label}</span>
    </button>
  );
}
