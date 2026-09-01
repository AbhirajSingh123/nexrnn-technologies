import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigate, useNavigate, Link, useLocation } from 'react-router-dom';
import { Loader2, IdCard, ShieldCheck } from 'lucide-react';
import { useMentorAuth } from '@/contexts/MentorAuthContext';
import { MENTOR_ROUTES } from '@/constants/mentorRoutes';
import { SITE } from '@/constants/siteData';

const inputClass =
  'w-full border-2 border-secondary/20 focus:border-primary px-4 py-2.5 text-sm outline-none transition-colors bg-white';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-2';

export default function MentorLogin() {
  const { mentor, loading, login } = useMentorAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ mentorId: '', phone: '' });
  const [error, setError] = useState(location.state?.blockedMessage || '');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && mentor) return <Navigate to={MENTOR_ROUTES.dashboard} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.mentorId.trim() || !form.phone.trim()) {
      setError('Mentor ID and Mobile Number are required.');
      return;
    }
    setSubmitting(true);
    try {
      await login(form.mentorId.trim(), form.phone.trim());
      navigate(MENTOR_ROUTES.dashboard, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed.');
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Mentor Login | {SITE.name}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-accent flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-7">
            <span className="inline-flex w-12 h-12 bg-primary border-2 border-secondary items-center justify-center text-white font-heading text-lg mb-3">
              N
            </span>
            <h1 className="font-heading text-2xl sm:text-3xl text-secondary">
              NexRNN <span className="text-primary">Mentor</span> Panel
            </h1>
            <p className="text-xs text-muted normal-case mt-1.5">Login with your Mentor ID and registered mobile number.</p>
          </div>

          <form onSubmit={handleSubmit} className="card-base bg-white p-7 border-2 border-secondary">
            <div className="space-y-5">
              <div>
                <label className={labelClass} htmlFor="mentor-id">Mentor ID</label>
                <div className="relative">
                  <IdCard size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    id="mentor-id"
                    className={`${inputClass} pl-10 font-mono uppercase`}
                    value={form.mentorId}
                    onChange={(e) => setForm((f) => ({ ...f, mentorId: e.target.value }))}
                    placeholder="NX-MEN-XXXXXXXX"
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label className={labelClass} htmlFor="mentor-phone">Mobile Number</label>
                <input
                  id="mentor-phone"
                  type="tel"
                  className={inputClass}
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="Registered 10-digit mobile"
                  autoComplete="tel"
                />
              </div>

              {error && (
                <div className="text-xs font-bold text-primary bg-red-50 border-2 border-red-200 px-3.5 py-2.5 normal-case">
                  <p>{error}</p>
                  {error.toLowerCase().includes('blocked') && (
                    <a href="/Contect-us" className="inline-flex items-center gap-1 mt-2 text-primary hover:underline">
                      Go to Contact Us &rarr;
                    </a>
                  )}
                </div>
              )}

              <button type="submit" disabled={submitting} className="btn-primary w-full justify-center disabled:opacity-60">
                {submitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Logging in…
                  </>
                ) : (
                  <>
                    <ShieldCheck size={15} /> Login
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="text-center text-[11px] text-muted normal-case mt-5">
            Mentor access only. Credentials are issued by NexRNN Technologies.{' '}
            <Link to="/" className="text-primary font-bold hover:underline">&larr; Back to website</Link>
          </p>
        </div>
      </div>
    </>
  );
}
