import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Lock, Mail, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { SITE } from '@/constants/siteData';
import { ADMIN_ROUTES } from '@/constants/adminRoutes';

export default function AdminLogin() {
  const { login, isAdmin, loading: authLoading } = useAdminAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  if (!authLoading && isAdmin) return <Navigate to={ADMIN_ROUTES.dashboard} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate(ADMIN_ROUTES.dashboard);
    } catch (err) {
      toast.error(err.message || 'Invalid username or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary bg-grid-light px-4">
      <div className="w-full max-w-sm bg-white border-2 border-secondary shadow-[6px_6px_0_#1D6FE0] p-8">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <span className="w-9 h-9 bg-primary border-2 border-secondary flex items-center justify-center text-white text-sm font-heading">
            N
          </span>
          <span className="font-heading text-lg leading-none">
            {SITE.shortName} <span className="text-primary">Admin</span>
          </span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-secondary uppercase tracking-wide mb-2">
              Username / Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full border-2 border-secondary/20 focus:border-primary pl-10 pr-4 py-3 text-sm outline-none transition-colors"
                placeholder="admin@nexrnntechnologies.in"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-bold text-secondary uppercase tracking-wide mb-2">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id="password"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full border-2 border-secondary/20 focus:border-primary pl-10 pr-4 py-3 text-sm outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
