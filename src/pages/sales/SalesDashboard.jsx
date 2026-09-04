import { Helmet } from 'react-helmet-async';
import { IndianRupee, Wallet, CalendarDays, Gift, Users, Percent, Briefcase, CheckCircle2, TrendingUp, GraduationCap, PartyPopper } from 'lucide-react';
import useSalesData, { inr } from '@/hooks/useSalesData';
import { useSalesAuth } from '@/contexts/SalesAuthContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function SalesDashboard() {
  const { member } = useSalesAuth();
  const { data, error, loading } = useSalesData('dashboard');

  return (
    <div>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      <h1 className="font-heading text-3xl text-secondary mb-1">Dashboard</h1>
      <p className="text-sm text-muted normal-case mb-6">
        Welcome back{member?.name ? `, ${member.name}` : ''} — here is your sales overview.
      </p>

      {loading || !data ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-primary normal-case">{error}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
            <StatCard icon={Wallet} label="Wallet Balance" value={inr(data.wallet?.available)} sub="Available to withdraw" />
            <StatCard icon={IndianRupee} label="Total Earned" value={inr(data.wallet?.earned ?? data.totalEarnings)} sub={`Withdrawn ${inr(data.wallet?.withdrawn)}`} />
            <StatCard icon={CalendarDays} label="Today's Earnings" value={inr(data.todayEarnings)} />
            <StatCard
              icon={Gift}
              label="My Referrals"
              value={data.totalReferrals}
              sub={`Courses ${data.referralByType?.course ?? 0} · Workshops ${data.referralByType?.workshop ?? 0} · Services ${data.referralByType?.service ?? 0}`}
            />
            <StatCard
              icon={TrendingUp}
              label="Potential Commission"
              value={inr(Math.round(((data.pipelineAmount ?? 0) * (data.commissionService ?? 0)) / 100))}
              sub={`Service deal value ${inr(data.pipelineAmount ?? 0)} at ${data.commissionService ?? 0}%`}
            />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <MiniCard icon={Percent} label="Course Commission" value={`${data.commissionCourse ?? 0}%`} />
            <MiniCard icon={Percent} label="Workshop Commission" value={`${data.commissionWorkshop ?? 0}%`} />
            <MiniCard icon={Briefcase} label="Service Commission" value={`${data.commissionService ?? 0}%`} />
            <MiniCard icon={Users} label="Paid Conversions" value={data.paidConversions ?? 0} />
          </div>

          <h2 className="text-xs font-bold uppercase tracking-widest text-muted mt-8 mb-3">Earnings Breakdown</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            <MiniCard icon={GraduationCap} label="Earned from Courses" value={inr(data.earnedByType?.course ?? 0)} />
            <MiniCard icon={PartyPopper} label="Earned from Workshops" value={inr(data.earnedByType?.workshop ?? 0)} />
            <MiniCard icon={Briefcase} label="Earned from Services" value={inr(data.earnedByType?.service ?? 0)} />
          </div>

          {(data.wallet?.pending ?? 0) > 0 && (
            <div className="card-base bg-orange-50 border-2 border-orange-200 p-4 mb-8 mt-8 text-sm text-orange-700 normal-case">
              <b>{inr(data.wallet.pending)}</b> withdrawal request is pending with the admin (Created / In progress).
            </div>
          )}

          {(data.totalReferrals ?? 0) === 0 && (
            <div className="card-base bg-white p-8 mt-8 text-center">
              <CheckCircle2 size={0} />
              <p className="text-sm text-muted normal-case">
                No referrals yet. Share your Refer &amp; Earn code — when someone enrolls with your code,
                their name and your commission appear here automatically.
              </p>
            </div>
          )}
        </>
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

function MiniCard({ icon: Icon, label, value }) {
  return (
    <div className="card-base bg-white p-5 flex items-center gap-3.5">
      <span className="w-10 h-10 bg-primary/10 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-primary" />
      </span>
      <div>
        <p className="font-heading text-xl text-secondary leading-none">{value}</p>
        <p className="text-[10px] text-muted normal-case mt-1">{label}</p>
      </div>
    </div>
  );
}
