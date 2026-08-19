import { useCallback } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  LayoutDashboard, Inbox, Briefcase, GraduationCap, Layers, BookOpen, LogOut,
} from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import useIdleTimeout from '@/hooks/useIdleTimeout';
import { SITE } from '@/constants/siteData';
import { ADMIN_ROUTES } from '@/constants/adminRoutes';

const NAV_ITEMS = [
  { to: ADMIN_ROUTES.dashboard, label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: ADMIN_ROUTES.leadsContact, label: 'Contact Leads', icon: Inbox },
  { to: ADMIN_ROUTES.leadsServices, label: 'Service Leads', icon: Briefcase },
  { to: ADMIN_ROUTES.leadsCourses, label: 'Course Enrollments', icon: GraduationCap },
  { to: ADMIN_ROUTES.services, label: 'Manage Services', icon: Layers },
  { to: ADMIN_ROUTES.courses, label: 'Manage Courses', icon: BookOpen },
];

export default function AdminLayout() {
  const { profile, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = useCallback(
    async (isTimeout = false) => {
      await logout();
      if (isTimeout) toast.info('You were logged out after 30 minutes of inactivity.');
      navigate(ADMIN_ROUTES.login, { replace: true });
    },
    [logout, navigate]
  );

  useIdleTimeout(() => handleLogout(true), true);

  return (
    <div className="min-h-screen flex bg-accent">
      <aside className="w-64 bg-secondary text-white flex flex-col shrink-0">
        <div className="flex items-center gap-2.5 px-6 py-6 border-b border-white/10">
          <span className="w-8 h-8 bg-primary border-2 border-white flex items-center justify-center text-xs font-heading shrink-0">
            N
          </span>
          <span className="font-heading text-lg leading-none">
            {SITE.shortName} <span className="text-primary">Admin</span>
          </span>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                    isActive ? 'bg-primary text-white' : 'text-white/70 hover:bg-white/5'
                  }`
                }
              >
                <Icon size={17} /> {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-6 py-4 border-t border-white/10">
          <p className="text-xs text-white/50 normal-case mb-1">Signed in as</p>
          <p className="text-sm font-semibold mb-3 truncate">{profile?.full_name ?? 'Admin'}</p>
          <span className="inline-block text-[10px] font-bold uppercase tracking-wide bg-white/10 px-2 py-1 mb-4">
            {profile?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
          </span>
          <button
            onClick={() => handleLogout(false)}
            className="flex items-center gap-2.5 text-sm text-white/70 hover:text-white transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
