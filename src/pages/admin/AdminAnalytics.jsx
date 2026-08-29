import { useEffect, useMemo, useState } from 'react';
import {
  Eye,
  MessageCircle,
  Phone,
  UserPlus,
  BookOpen,
  MousePointerClick,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  fetchAnalyticsEvents,
  countByEvent,
  dailyPageViews,
  topBlogPosts,
  topPages,
} from '@/data/analyticsRepo';
import ExportButtons from '@/components/admin/ExportButtons';
import AdminLoadMore from '@/components/admin/AdminLoadMore';
import { useLoadMore } from '@/hooks/useLoadMore';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const RANGES = [
  { days: 7, label: 'Last 7 Days' },
  { days: 30, label: 'Last 30 Days' },
];

const EVENT_COLUMNS = [
  { key: 'created_at', label: 'Time', render: (r) => new Date(r.created_at).toLocaleString('en-IN') },
  { key: 'event_name', label: 'Event' },
  { key: 'path', label: 'Page' },
  { key: 'label', label: 'Detail' },
];

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

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAnalyticsEvents(days);
      setEvents(data);
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

  const { visibleItems, hasMore, loadMore, total, shown } = useLoadMore(
    filteredEvents,
    `${eventType}|${searchQuery}|${filteredEvents.length}`,
    25
  );

  const counts = useMemo(() => countByEvent(filteredEvents), [filteredEvents]);
  const chart = useMemo(() => dailyPageViews(filteredEvents, 14), [filteredEvents]);
  const blogs = useMemo(() => topBlogPosts(filteredEvents, 8), [filteredEvents]);
  const pages = useMemo(() => topPages(filteredEvents, 8), [filteredEvents]);

  const maxCount = Math.max(...chart.map((c) => c.count), 1);
  const exportRows = filteredEvents.map((e) => ({
    ...e,
    created_at: new Date(e.created_at).toLocaleString('en-IN'),
  }));

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
      <p className="text-sm text-muted normal-case mb-6">
        Website ka apna tracking data. Detailed traffic Google Analytics mein bhi milta hai
        (analytics.google.com).
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
            <option key={t} value={t}>{t}</option>
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
            <StatCard icon={MessageCircle} label="WhatsApp Clicks" value={counts.whatsapp_click ?? 0} />
            <StatCard icon={Phone} label="Phone Clicks" value={counts.phone_click ?? 0} />
            <StatCard icon={UserPlus} label="Leads / Forms" value={counts.generate_lead ?? 0} />
            <StatCard icon={BookOpen} label="Blog Reads" value={counts.blog_read ?? 0} />
            <StatCard icon={MousePointerClick} label="CTA Clicks" value={counts.cta_click ?? 0} />
          </div>

          {/* Daily Chart (last 14 days page views) */}
          <div className="card-base bg-white p-5 sm:p-6 mb-8">
            <h3 className="text-sm font-bold text-secondary uppercase tracking-wide mb-1">
              Daily Page Views (Last 14 Days)
            </h3>
            <p className="text-xs text-muted normal-case mb-5">
              Selected range: {days} days &bull; Total: {counts.page_view ?? 0} views
            </p>
            <div className="flex items-end gap-1.5 h-36">
              {chart.map((c) => (
                <div key={c.date} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-[10px] font-bold text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                    {c.count}
                  </span>
                  <div
                    className="w-full bg-primary/80 group-hover:bg-primary transition-colors rounded-t"
                    style={{ height: `${Math.max((c.count / maxCount) * 100, 2)}%` }}
                    title={`${c.date}: ${c.count} views`}
                  />
                  <span className="text-[9px] text-muted rotate-45 origin-top-left mt-1 whitespace-nowrap hidden sm:block">
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
              emptyText="Abhi koi page view data nahi hai."
              valueLabel="views"
            />
            <TopList
              title="Most Read Blog Posts"
              rows={blogs}
              emptyText="Abhi koi blog read data nahi hai."
              valueLabel="reads"
            />
          </div>

          {/* Recent Events */}
          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <h2 className="text-xl text-secondary normal-case">
              Recent Events <span className="text-sm text-muted">({total} of {filteredEvents.length})</span>
            </h2>
            <ExportButtons
              rows={exportRows}
              columns={EVENT_COLUMNS}
              filename="analytics-events"
              title="Analytics Events"
            />
          </div>
          <div className="card-base bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-secondary bg-accent">
                  {EVENT_COLUMNS.map((c) => (
                    <th
                      key={c.key}
                      className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wide text-secondary whitespace-nowrap"
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted normal-case">
                      Abhi koi event record nahi hua. Traffic aane par yahan dikhega.
                    </td>
                  </tr>
                ) : (
                  visibleItems.map((e) => (
                    <tr key={e.id} className="border-b border-secondary/10 last:border-0">
                      <td className="px-4 py-2.5 text-secondary/80 normal-case whitespace-nowrap text-xs">
                        {new Date(e.created_at).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/5 border border-primary/20 px-2 py-0.5">
                          {e.event_name}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-secondary/80 normal-case font-mono">
                        {e.path || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-secondary/80 normal-case max-w-xs truncate">
                        {e.label || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <AdminLoadMore shown={shown} total={total} hasMore={hasMore} onLoadMore={loadMore} />
        </>
      )}
    </div>
  );
}
