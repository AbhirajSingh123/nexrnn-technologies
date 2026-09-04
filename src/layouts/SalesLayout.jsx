import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import {
  LayoutDashboard, Briefcase, Users, Gift, IdCard,
  Mail, AlertTriangle, LogOut, Menu, X, Wallet, GraduationCap, Newspaper, Megaphone,
} from 'lucide-react';
import { useSalesAuth } from '@/contexts/SalesAuthContext';
import { SALES_ROUTES } from '@/constants/salesRoutes';

const NAV_ITEMS = [
  { to: SALES_ROUTES.dashboard, label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: SALES_ROUTES.services, label: 'Services & Programs', icon: Briefcase },
  { to: SALES_ROUTES.leads, label: 'Service Leads', icon: Users },
  { to: SALES_ROUTES.referrals, label: 'Refer & Earn', icon: Gift },
  { to: SALES_ROUTES.enrollments, label: 'My Enrollments', icon: GraduationCap },
  { to: SALES_ROUTES.details, label: 'Sales Details', icon: IdCard },
  { to: SALES_ROUTES.withdrawals, label: 'Withdrawal Payment', icon: Wallet },
  { to: SALES_ROUTES.blog, label: 'My Blogs', icon: Newspaper },
  { to: SALES_ROUTES.announcements, label: 'Announcements', icon: Megaphone },
  { to: SALES_ROUTES.contact, label: 'Contact Us', icon: Mail },
  { to: SALES_ROUTES.issue, label: 'Report an Issue', icon: AlertTriangle },
];

export default function SalesLayout() {
  const { member, logout, refreshProfile } = useSalesAuth();
  // Stale session bhi sahi ho jaye: mount par server se fresh profile
  useEffect(() => {
    refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = useCallback(() => {
    logout(); // token + profile saaf - back button par bhi login hi milega
    toast.info('Logged out.');
    navigate(SALES_ROUTES.login, { replace: true });
  }, [logout, navigate]);

  return (
    <div className="h-screen flex bg-accent overflow-hidden">
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-secondary/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 h-screen bg-secondary text-white flex flex-col shrink-0 transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/10">
          <span className="w-9 h-9 bg-primary border-2 border-white/20 flex items-center justify-center text-white text-sm font-heading shrink-0">N</span>
          <div className="leading-none">
            <p className="font-heading text-base">NexRNN <span className="text-primary">Sales</span></p>
            <p className="text-[10px] text-white/50 mt-1 normal-case">Sales Panel</p>
          </div>
          <button className="ml-auto lg:hidden text-white/70" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <Icon size={16} className="shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="px-3.5 py-2 mb-1">
            <p className="text-[10px] text-white/40 uppercase tracking-wide">Logged in as</p>
            <p className="text-sm font-bold truncate">{member?.name || 'Sales Member'}</p>
            <p className="text-[10px] font-mono text-primary">{member?.salesId || ''}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden h-14 bg-secondary text-white flex items-center justify-between px-4 shrink-0">
          <button onClick={() => setSidebarOpen(true)} aria-label="Open menu" className="text-white/80">
            <Menu size={22} />
          </button>
          <p className="font-heading text-sm">NexRNN <span className="text-primary">Sales</span></p>
          <button onClick={handleLogout} aria-label="Logout" className="text-white/80">
            <LogOut size={18} />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
