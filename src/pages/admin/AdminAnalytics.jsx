import { useEffect, useMemo, useState } from 'react';
import {
  Eye,
  MessageCircle,
  Phone,
  Users,
  UserPlus,
  BookOpen,
  MousePointerClick,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  fetchAnalyticsEvents,
  fetchAnalyticsSince,
  countByEvent,
  countUniqueVisitors,
  dailyPageViews,
  topBlogPosts,
  topPages,
} from '@/data/analyticsRepo';
import { supabase } from '@/services/supabaseClient';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const RANGES = [
  { days: 7, label: 'Last 7 Days' },
  { days: 30, label: 'Last 30 Days' },
  { days: 90, label: 'Last 90 Days' },
];

const EVENT_LABELS = {
  page_view: 'Page View',
  whatsapp_click: 'WhatsApp Click',
  phone_click: 'Phone Click',
  generate_lead: 'Lead / Form',
  blog_read: 'Blog Read',
  cta_click: 'CTA Click',
};

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card-base bg-white p-5 flex items-center gap-4">
      <div className="w-11 h-11 bg-primary/10 flex items-center justify-center shrink-0">
        <Icon size={20} className="text-primary" />
      </div>
      <div>
        <p className="font-heading text-2xl sm:text-3xl text-secondary leading-none">{value ?? '—'}</p>
        <p className="text-xs text-muted normal-case mt-1">{label}</p>
      </div>
    </div>
  );
}

function TopList({ title, rows, emptyText, valueLabel }) {
  return (
    <div className="card-base bg-white p-5">
      <h3 className="text-sm font-bold text-secondary uppercase tracking-wide mb-4">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-muted normal-case">{emptyText}</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((row, i) => (
            <li key={i} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-secondary/85 normal-case truncate">
                <span className="text-muted text-xs font-bold mr-2">#{i + 1}</span>
                {row.title || row.path}
              </span>
              <span className="text-xs font-bold text-primary shrink-0">
                {row.reads ?? row.views} {valueLabel}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminAnalytics() {
  const [days, setDays] = useState(7);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventType, setEventType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [since, setSince] = useState(null); // tracking live since (sabse purana event)

  const load = async () => {
    setLoading(true);
    try {
      const [data, sinceTs] = await Promise.all([fetchAnalyticsEvents(days), fetchAnalyticsSince()]);
      setEvents(data);
      setSince(sinceTs);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  // Filters: event type + free-text search (path/label)
  const eventTypes = useMemo(
    () => [...new Set(events.map((e) => e.event_name))].sort(),
    [events]
  );
  const filteredEvents = useMemo(() => {
    let list = events;
    if (eventType !== 'all') list = list.filter((e) => e.event_name === eventType);
    const q = searchQuery.trim().toLowerCase();
    if (q) list = list.filter((e) => `${e.path} ${e.label}`.toLowerCase().includes(q));
    return list;
  }, [events, eventType, searchQuery]);

  const counts = useMemo(() => countByEvent(filteredEvents), [filteredEvents]);
  const chart = useMemo(() => dailyPageViews(filteredEvents, days), [filteredEvents, days]);
  const blogs = useMemo(() => topBlogPosts(filteredEvents, 8), [filteredEvents]);
  // Fallback: blog_read events na ho to blog_posts ke views counter se dikhao
  const [viewBasedBlogs, setViewBasedBlogs] = useState([]);
  useEffect(() => {
    if (blogs.length) return;
    let active = true;
    supabase
      .from('blog_posts')
      .select('title, views')
      .gt('views', 0)
      .order('views', { ascending: false })
      .limit(8)
      .then(({ data }) => {
        if (!active) return;
        setViewBasedBlogs((data ?? []).map((b) => ({ title: b.title, reads: b.views })));
      });
    return () => {
      active = false;
    };
  }, [blogs.length]);
  const mostRead = blogs.length ? blogs : viewBasedBlogs;
  const pages = useMemo(() => topPages(filteredEvents, 8), [filteredEvents]);

  const uniqueUsers = useMemo(() => countUniqueVisitors(filteredEvents), [filteredEvents]);
  const maxCount = Math.max(...chart.map((c) => c.count), 1);
  // "Kab ka data" - selected range ki dates + tracking live since
  const rangeFrom = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1));
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }, [days]);
  const rangeTo = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const sinceLabel = since
    ? new Date(since).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;
  return (
    <div>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h1 className="font-heading text-3xl text-secondary">Traffic &amp; Analytics</h1>
        <div className="flex items-center gap-2">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={`px-3 py-1.5 text-xs font-bold border-2 transition-colors ${
                days === r.days
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-secondary/20 text-muted hover:border-secondary/40'
              }`}
            >
              {r.label}
            </button>
          ))}
          <button
            onClick={load}
            className="px-3 py-1.5 text-xs font-bold border-2 border-secondary/20 text-muted hover:border-primary hover:text-primary transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>
      <p className="text-sm text-muted normal-case mb-1.5">
        Your own website tracking data. Detailed traffic is also available in Google Analytics
        (analytics.google.com).
      </p>
      <p className="text-xs text-muted normal-case mb-6">
        Showing data from <b className="text-secondary">{rangeFrom}</b> to <b className="text-secondary">{rangeTo}</b>
        {sinceLabel && (
          <>
            {' '}&bull; Tracking live since <b className="text-secondary">{sinceLabel}</b>
          </>
        )}
      </p>

      {/* Filters: event type + search */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white"
        >
          <option value="all">All Events</option>
          {eventTypes.map((t) => (
            <option key={t} value={t}>{EVENT_LABELS[t] ?? t}</option>
          ))}
        </select>
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search page, detail, label…"
            className="w-full border-2 border-secondary/20 focus:border-primary pl-9 pr-3 py-2 text-sm outline-none transition-colors bg-white"
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            <StatCard icon={Eye} label="Page Views" value={counts.page_view ?? 0} />
            <StatCard icon={Users} label="Unique Users" value={uniqueUsers} />
            <StatCard icon={MessageCircle} label="WhatsApp Clicks" value={counts.whatsapp_click ?? 0} />
            <StatCard icon={Phone} label="Phone Clicks" value={counts.phone_click ?? 0} />
            <StatCard icon={UserPlus} label="Leads / Forms" value={counts.generate_lead ?? 0} />
            <StatCard icon={BookOpen} label="Blog Reads" value={counts.blog_read ?? 0} />
            <StatCard icon={MousePointerClick} label="CTA Clicks" value={counts.cta_click ?? 0} />
          </div>

          {/* Daily Chart (last 14 days page views) */}
          <div className="card-base bg-white p-5 sm:p-6 mb-8">
            <h3 className="text-sm font-bold text-secondary uppercase tracking-wide mb-1">
              Daily Page Views (Last {days} Days)
            </h3>
            <p className="text-xs text-muted normal-case mb-5">
              {rangeFrom} &rarr; {rangeTo} &bull; Total: {counts.page_view ?? 0} views
              {sinceLabel && <> &bull; Tracking since {sinceLabel}</>}
            </p>
            <div className="flex items-end gap-1.5 sm:gap-2 h-40 sm:h-44">
              {chart.map((c) => (
                <div key={c.date} className="flex-1 h-full flex flex-col min-w-0 group">
                  <div className="relative flex-1 flex items-end">
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-secondary bg-accent px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {c.count}
                    </span>
                    <div
                      className="w-full bg-primary/80 group-hover:bg-primary transition-colors rounded-t"
                      style={{ height: `${Math.max((c.count / maxCount) * 100, 3)}%` }}
                      title={`${c.date}: ${c.count} views`}
                    />
                  </div>
                  <span className="text-[9px] text-muted text-center mt-1.5 whitespace-nowrap hidden sm:block">
                    {c.date.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Lists */}
          <div className="grid md:grid-cols-2 gap-5 mb-8">
            <TopList
              title="Top Pages"
              rows={pages}
              emptyText="No page view data yet."
              valueLabel="views"
            />
            <TopList
              title="Most Read Blog Posts"
              rows={mostRead}
              emptyText="No blog read data yet."
              valueLabel="reads"
            />
          </div>
        </>
      )}
    </div>
  );
}
