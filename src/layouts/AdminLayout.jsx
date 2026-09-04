import { useCallback, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import {
  Tag,
  Wallet,
  LayoutDashboard, Inbox, Briefcase, GraduationCap, Layers, BookOpen, LogOut, CreditCard,
  Video, Image as ImageIcon, Star, PartyPopper, Settings, Newspaper, BarChart3, Menu, X, Trophy, ClipboardList, FileUser, Users, MessageSquareWarning, Handshake, ReceiptText , Link2, Megaphone } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import useIdleTimeout from '@/hooks/useIdleTimeout';
import { SITE } from '@/constants/siteData';
import { ADMIN_ROUTES } from '@/constants/adminRoutes';

const NAV_ITEMS = [
  { to: ADMIN_ROUTES.dashboard, label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: ADMIN_ROUTES.importantLinks, label: 'Important Links', icon: Link2 },
  { to: ADMIN_ROUTES.announcements, label: 'Announcements', icon: Megaphone },
  { to: ADMIN_ROUTES.analytics, label: 'Traffic & Analytics', icon: BarChart3 },
  { to: ADMIN_ROUTES.leadsContact, label: 'Contact Leads', icon: Inbox },
  { to: ADMIN_ROUTES.leadsServices, label: 'Service Leads', icon: Briefcase },
  { to: ADMIN_ROUTES.leadsCourses, label: 'Course Enrollments', icon: GraduationCap },
  { to: ADMIN_ROUTES.leadsWorkshops, label: 'Workshop Registrations', icon: PartyPopper },
  { to: ADMIN_ROUTES.payments, label: 'Payments', icon: CreditCard },
  { to: ADMIN_ROUTES.promoCodes, label: 'Promo Codes', icon: Tag },
  { to: ADMIN_ROUTES.promoUsage, label: 'Promo Usage', icon: ReceiptText },
  { to: ADMIN_ROUTES.services, label: 'Manage Services', icon: Layers },
  { to: ADMIN_ROUTES.courses, label: 'Manage Courses', icon: BookOpen },
  { to: ADMIN_ROUTES.workshops, label: 'Manage Workshops', icon: PartyPopper },
  { to: ADMIN_ROUTES.blogPosts, label: 'Manage Blog', icon: Newspaper },
  { to: ADMIN_ROUTES.caseStudies, label: 'Manage Case Studies', icon: Trophy },
  { to: ADMIN_ROUTES.careers, label: 'Manage Careers', icon: ClipboardList },
  { to: ADMIN_ROUTES.internshipApplications, label: 'Applications', icon: FileUser },
  { to: ADMIN_ROUTES.mentors, label: 'Mentors', icon: Users },
  { to: ADMIN_ROUTES.mentorPayments, label: 'Mentor Payments', icon: Wallet },
  { to: ADMIN_ROUTES.mentorIssues, label: 'Mentor Issues', icon: MessageSquareWarning },
  { to: ADMIN_ROUTES.salesTeam, label: 'Sales Team', icon: Handshake },
  { to: ADMIN_ROUTES.salesPayments, label: 'Sales Team Payments', icon: Wallet },
  { to: ADMIN_ROUTES.salesIssues, label: 'Sales Team Issues', icon: MessageSquareWarning },
  { to: ADMIN_ROUTES.clientReviews, label: 'Client Reviews', icon: Video },
  { to: ADMIN_ROUTES.portfolio, label: 'Manage Portfolio', icon: ImageIcon },
  { to: ADMIN_ROUTES.testimonials, label: 'Manage Testimonials', icon: Star },
  { to: ADMIN_ROUTES.siteSettings, label: 'Site Settings', icon: Settings },
];

export default function AdminLayout() {
  const { profile, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="h-screen flex bg-accent overflow-hidden">
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-secondary/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 h-screen bg-secondary text-white flex flex-col shrink-0 transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-2.5 px-6 py-6 border-b border-white/10 shrink-0">
          <span className="w-8 h-8 bg-primary border-2 border-white flex items-center justify-center text-xs font-heading shrink-0">
            N
          </span>
          <span className="font-heading text-lg leading-none flex-1">
            {SITE.shortName} <span className="text-primary">Admin</span>
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-white/70 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
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

        <div className="px-6 py-4 border-t border-white/10 shrink-0">
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

      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-5 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="border-2 border-secondary/20 bg-white p-2 text-secondary hover:border-primary transition-colors"
            aria-label="Open admin menu"
          >
            <Menu size={20} />
          </button>
          <span className="font-heading text-lg text-secondary">
            {SITE.shortName} <span className="text-primary">Admin</span>
          </span>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
