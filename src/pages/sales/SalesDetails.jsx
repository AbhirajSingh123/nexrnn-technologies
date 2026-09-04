import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { IdCard, Percent, Briefcase, FileText, Award, Loader2 } from 'lucide-react';
import useSalesData from '@/hooks/useSalesData';
import { downloadSalesOfferLetterPDF, downloadSalesProfilePDF } from '@/data/salesDocumentsRepo';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function SalesDetails() {
  const { data, error, loading } = useSalesData('profile');
  const [docBusy, setDocBusy] = useState('');

  const handleDoc = async (kind) => {
    const m = data?.member;
    if (!m) return;
    setDocBusy(kind);
    try {
      const payload = {
        salesId: m.salesId,
        referralCode: m.referralCode,
        name: m.name,
        email: m.email,
        phone: m.phone,
        location: m.location,
        gender: m.gender,
        commissionCourse: m.commissionCourse,
        commissionWorkshop: m.commissionWorkshop,
        commissionService: m.commissionService,
        dateOfJoining: m.dateOfJoining,
        bankAccNo: data.payout?.method === 'bank' ? data.payout.accNo : '',
        bankAccName: data.payout?.method === 'bank' ? data.payout.accName : '',
        bankIfsc: data.payout?.method === 'bank' ? data.payout.bankIfsc : '',
        upiId: data.payout?.method === 'upi' ? data.payout.upiId : '',
      };
      if (kind === 'offer') await downloadSalesOfferLetterPDF(payload);
      else await downloadSalesProfilePDF(payload);
    } catch {
      toast.error('Download failed. Please try again.');
    } finally {
      setDocBusy('');
    }
  };

  return (
    <div>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      <h1 className="font-heading text-3xl text-secondary mb-1">Sales Details</h1>
      <p className="text-sm text-muted normal-case mb-6">Your profile, commission rates and saved payout details.</p>

      {loading || !data ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-primary normal-case">{error}</p>
      ) : (
        <div className="max-w-3xl">
          <div className="card-base bg-white p-6 sm:p-7 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <span className="w-14 h-14 bg-primary/10 flex items-center justify-center shrink-0">
                <IdCard size={24} className="text-primary" />
              </span>
              <div>
                <h2 className="font-heading text-xl text-secondary">{data.member?.name}</h2>
                <p className="text-xs font-mono text-primary font-bold">{data.member?.salesId}</p>
                <p className="text-[11px] text-muted normal-case">Member since {fmtDate((data.member?.memberSince || '').slice(0, 10))}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-sm mb-6">
              <Detail label="Email" value={data.member?.email} />
              <Detail label="Number" value={data.member?.phone || '—'} />
              <Detail label="Location" value={data.member?.location || '—'} />
              <Detail label="Gender" value={data.member?.gender || '—'} />
              <Detail label="Date of Joining" value={fmtDate(data.member?.dateOfJoining)} />
              <Detail label="Referral Code" value={data.member?.referralCode} mono />
            </div>

            <div className="border-t-2 border-secondary/10 pt-5">
              <h3 className="text-sm font-bold text-secondary uppercase tracking-wide mb-3 flex items-center gap-2">
                <Percent size={14} className="text-primary" /> My Commission Rates
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <MiniStat label="Course" value={`${data.member?.commissionCourse ?? 0}%`} />
                <MiniStat label="Workshop" value={`${data.member?.commissionWorkshop ?? 0}%`} />
                <MiniStat label="Service" value={`${data.member?.commissionService ?? 0}%`} />
              </div>
              <p className="text-[10px] text-muted normal-case mt-3">
                Commission rates are set by the NexRNN admin and cannot be changed from the panel.
              </p>
            </div>
          </div>

          {/* Payout details */}
          <div className="card-base bg-white p-6 sm:p-7">
            <h3 className="text-sm font-bold text-secondary uppercase tracking-wide mb-4">Payout Details</h3>
            {data.payout?.method ? (
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                {data.payout.method === 'bank' ? (
                  <>
                    <Detail label="Account Number" value={data.payout.accNo} mono />
                    <Detail label="Account Name" value={data.payout.accName || '—'} />
                    <Detail label="IFSC Code" value={data.payout.bankIfsc} mono />
                  </>
                ) : (
                  <Detail label="UPI ID" value={data.payout.upiId} mono />
                )}
                <p className="text-[11px] text-muted normal-case sm:col-span-2">
                  Updated automatically from your latest withdrawal request.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted normal-case">
                No payout details saved yet — they are saved automatically when you make your first withdrawal request.
              </p>
            )}
          </div>

          {/* Downloads */}
          <div className="card-base bg-white p-6 sm:p-7 mt-6">
            <h3 className="text-sm font-bold text-secondary uppercase tracking-wide mb-4">My Documents</h3>
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

function MiniStat({ label, value }) {
  return (
    <div className="border-2 border-secondary/15 bg-accent px-4 py-3 flex items-center gap-3">
      <Briefcase size={15} className="text-primary shrink-0" />
      <div>
        <p className="font-heading text-lg text-secondary leading-none">{value}</p>
        <p className="text-[10px] text-muted normal-case mt-0.5">{label}</p>
      </div>
    </div>
  );
}
