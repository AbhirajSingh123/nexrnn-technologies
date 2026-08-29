import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, Briefcase, GraduationCap, Layers, BookOpen, Search } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { ADMIN_ROUTES } from '@/constants/adminRoutes';
import { formatDateTimeWithDay } from '@/utils/formatDateTime';
import { fetchAnalyticsEvents, countByEvent } from '@/data/analyticsRepo';
import { Eye, MessageCircle, Phone, BarChart3 } from 'lucide-react';

function StatCard({ icon: Icon, label, value, to }) {
  return (
    <Link to={to} className="card-base card-hover bg-white p-6 flex items-center gap-4">
      <div className="w-12 h-12 bg-primary/10 flex items-center justify-center shrink-0">
        <Icon size={22} className="text-primary" />
      </div>
      <div>
        <p className="font-heading text-3xl text-secondary leading-none">{value ?? '—'}</p>
        <p className="text-xs text-muted normal-case mt-1">{label}</p>
      </div>
    </Link>
  );
}

const TYPE_META = {
  contact: { label: 'Contact', to: ADMIN_ROUTES.leadsContact },
  service: { label: 'Service', to: ADMIN_ROUTES.leadsServices },
  course: { label: 'Course', to: ADMIN_ROUTES.leadsCourses },
};

export default function AdminDashboard() {
  const [counts, setCounts] = useState({});
  const [recent, setRecent] = useState([]);
  const [search, setSearch] = useState('');
  const [traffic, setTraffic] = useState(null);

  useEffect(() => {
    const load = async () => {
      const tables = ['leads_contact', 'leads_service', 'leads_course', 'services', 'courses'];
      const results = await Promise.all(
        tables.map((t) => supabase.from(t).select('*', { count: 'exact', head: true }))
      );
      const next = {};
      tables.forEach((t, i) => {
        next[t] = results[i].count ?? 0;
      });
      setCounts(next);

      const [contactRes, serviceRes, courseRes] = await Promise.all([
        supabase.from('leads_contact').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('leads_service').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('leads_course').select('*').order('created_at', { ascending: false }).limit(10),
      ]);

      const combined = [
        ...(contactRes.data ?? []).map((r) => ({ ...r, type: 'contact', label: r.service || 'General enquiry' })),
        ...(serviceRes.data ?? []).map((r) => ({ ...r, type: 'service', label: r.service_title })),
        ...(courseRes.data ?? []).map((r) => ({ ...r, type: 'course', label: r.course_title })),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setRecent(combined.slice(0, 15));

      // Last 7 days traffic (page views, whatsapp, phone clicks)
      try {
        const events = await fetchAnalyticsEvents(7);
        const c = countByEvent(events);
        setTraffic({
          views: c.page_view || 0,
          whatsapp: c.whatsapp_click || 0,
          phone: c.phone_click || 0,
        });
      } catch {
        setTraffic(null);
      }
    };
    load();
  }, []);

  const filteredRecent = useMemo(() => {
    if (!search.trim()) return recent;
    const q = search.trim().toLowerCase();
    return recent.filter((r) =>
      [r.name, r.email, r.phone, r.label].some((v) => v?.toLowerCase().includes(q))
    );
  }, [recent, search]);

  return (
    <div>
      <h1 className="font-heading text-3xl text-secondary mb-1">Dashboard</h1>
      <p className="text-sm text-muted normal-case mb-6">Quick overview of leads and catalog content.</p>

      <div className="card-base bg-white p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-secondary uppercase tracking-wide flex items-center gap-2">
            <BarChart3 size={15} className="text-primary" /> Traffic (Last 7 Days)
          </h2>
          <Link to={ADMIN_ROUTES.analytics} className="text-xs font-bold text-primary hover:underline">
            Full Analytics &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Eye, label: 'Page Views', value: traffic?.views },
            { icon: MessageCircle, label: 'WhatsApp Clicks', value: traffic?.whatsapp },
            { icon: Phone, label: 'Phone Clicks', value: traffic?.phone },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/10 flex items-center justify-center shrink-0">
                <Icon size={17} className="text-primary" />
              </div>
              <div>
                <p className="font-heading text-xl sm:text-2xl text-secondary leading-none">{value ?? '—'}</p>
                <p className="text-[10px] text-muted normal-case mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        <StatCard icon={Inbox} label="Contact Leads" value={counts.leads_contact} to={ADMIN_ROUTES.leadsContact} />
        <StatCard icon={Briefcase} label="Service Leads" value={counts.leads_service} to={ADMIN_ROUTES.leadsServices} />
        <StatCard icon={GraduationCap} label="Course Enrollments" value={counts.leads_course} to={ADMIN_ROUTES.leadsCourses} />
        <StatCard icon={Layers} label="Services Listed" value={counts.services} to={ADMIN_ROUTES.services} />
        <StatCard icon={BookOpen} label="Courses Listed" value={counts.courses} to={ADMIN_ROUTES.courses} />
      </div>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-xl text-secondary normal-case">Recent Activity</h2>
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone…"
            className="w-full border-2 border-secondary/20 focus:border-primary pl-9 pr-3 py-2 text-sm outline-none transition-colors bg-white"
          />
        </div>
      </div>

      <div className="card-base bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-secondary bg-accent">
              <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wide text-secondary whitespace-nowrap">Date</th>
              <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wide text-secondary whitespace-nowrap">Type</th>
              <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wide text-secondary whitespace-nowrap">Name</th>
              <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wide text-secondary whitespace-nowrap">Detail</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecent.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted normal-case">No matching activity.</td>
              </tr>
            ) : (
              filteredRecent.map((row) => (
                <tr key={`${row.type}-${row.id}`} className="border-b border-secondary/10 last:border-0">
                  <td className="px-4 py-3 text-secondary/80 normal-case whitespace-nowrap">{formatDateTimeWithDay(row.created_at)}</td>
                  <td className="px-4 py-3">
                    <Link to={TYPE_META[row.type].to} className="text-[10px] font-bold uppercase tracking-wide text-primary hover:underline">
                      {TYPE_META[row.type].label}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-secondary/80 normal-case">{row.name}</td>
                  <td className="px-4 py-3 text-secondary/80 normal-case">{row.label}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
