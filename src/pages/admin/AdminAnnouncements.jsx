import { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { Megaphone, Loader2, Users, User } from 'lucide-react';
import { fetchAnnouncements, sendAnnouncement } from '@/data/announcementsRepo';
import { fetchMentors } from '@/data/mentorsRepo';
import { fetchSalesMembers } from '@/data/salesRepo';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const inputClass =
  'w-full border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white normal-case';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-1.5';

const AUDIENCES = [
  { key: 'mentor', label: 'Mentors' },
  { key: 'sales', label: 'Sales' },
];

export default function AdminAnnouncements() {
  const [tab, setTab] = useState('mentor');
  const [rows, setRows] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ target: 'all', title: '', message: '' });
  const [sending, setSending] = useState(false);

  const members = tab === 'mentor' ? mentors : sales;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, m, s] = await Promise.all([fetchAnnouncements(), fetchMentors(), fetchSalesMembers()]);
      setRows(list ?? []);
      setMentors(m ?? []);
      setSales(s ?? []);
    } catch {
      toast.error('Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tabRows = useMemo(() => rows.filter((r) => r.audience === tab), [rows, tab]);

  // History me recipient ka naam dikhane ke liye
  const nameByUuid = useMemo(() => {
    const map = {};
    for (const m of mentors) map[m.id] = m.name;
    for (const s of sales) map[s.id] = s.name;
    return map;
  }, [mentors, sales]);

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Title and Message are required.');
      return;
    }
    setSending(true);
    try {
      await sendAnnouncement({
        audience: tab,
        targetUuid: form.target === 'all' ? null : form.target,
        title: form.title,
        message: form.message,
      });
      toast.success(form.target === 'all' ? `Announcement sent to all ${AUDIENCES.find((a) => a.key === tab)?.label}.` : 'Announcement sent.');
      setForm({ target: 'all', title: '', message: '' });
      load();
    } catch {
      toast.error('Could not send announcement. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      <h1 className="font-heading text-3xl text-secondary mb-1">Announcements</h1>
      <p className="text-sm text-muted normal-case mb-6">
        Send notices to all mentors/sales members or to one specific member. Their reactions and
        replies appear under each notice in the history below.
      </p>

      {/* Audience tabs */}
      <div className="flex items-center gap-2 mb-5">
        {AUDIENCES.map((a) => (
          <button
            key={a.key}
            onClick={() => {
              setTab(a.key);
              setForm((f) => ({ ...f, target: 'all' }));
            }}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wide border-2 transition-colors ${
              tab === a.key ? 'border-primary bg-primary text-white' : 'border-secondary/20 bg-white text-secondary hover:border-primary'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Compose */}
      <div className="card-base bg-white p-5 sm:p-6 mb-8">
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelClass}>Recipient</label>
            <select className={inputClass} value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}>
              <option value="all">All {AUDIENCES.find((a) => a.key === tab)?.label}</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Title *</label>
            <input className={inputClass} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Notice title" maxLength={160} />
          </div>
        </div>
        <div className="mb-4">
          <label className={labelClass}>Message *</label>
          <textarea rows={4} className={`${inputClass} resize-y`} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder="Write the announcement…" />
        </div>
        <div className="flex justify-end">
          <button onClick={handleSend} disabled={sending} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
            {sending ? <><Loader2 size={15} className="animate-spin" /> Sending…</> : <><Megaphone size={15} /> Send Announcement</>}
          </button>
        </div>
      </div>

      {/* History */}
      <h2 className="font-heading text-xl text-secondary mb-3">History ({tabRows.length})</h2>
      {loading ? (
        <LoadingSpinner />
      ) : tabRows.length === 0 ? (
        <div className="card-base bg-white p-10 text-center">
          <Megaphone size={28} className="text-muted mx-auto mb-3" />
          <p className="text-sm text-muted normal-case">No announcements sent yet for this audience.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tabRows.map((a) => {
            const individual = Boolean(a.targetUuid);
            const recipientName = individual ? nameByUuid[a.targetUuid] || 'Member' : '';
            return (
              <div key={a.id} className="card-base bg-white p-5">
                <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                  {individual ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 border-2 border-secondary/20 bg-secondary/5 text-secondary">
                      <User size={11} /> {recipientName}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 border-2 border-primary/30 bg-primary/5 text-primary">
                      <Users size={11} /> All {AUDIENCES.find((x) => x.key === a.audience)?.label}
                    </span>
                  )}
                  <span className="text-[10px] text-muted normal-case ml-auto">
                    {a.createdAt ? new Date(a.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <h3 className="font-heading text-lg text-secondary normal-case leading-snug">{a.title}</h3>
                <p className="text-sm text-secondary/80 normal-case mt-1 whitespace-pre-line">{a.message}</p>
                <FeedbackSummary a={a} nameByUuid={nameByUuid} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** History card ke andar reactions (counts + member names) aur replies */
function FeedbackSummary({ a, nameByUuid }) {
  const agg = {};
  for (const r of a.reactions || []) {
    agg[r.emoji] = agg[r.emoji] || { count: 0, names: [] };
    agg[r.emoji].count += 1;
    const n = nameByUuid[r.reactorUuid];
    if (n) agg[r.emoji].names.push(n);
  }
  const entries = Object.entries(agg);
  const replies = a.replies || [];
  if (entries.length === 0 && replies.length === 0) return null;
  return (
    <div className="mt-3 pt-3 border-t-2 border-secondary/10 space-y-2.5">
      {entries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entries.map(([emoji, v]) => (
            <span
              key={emoji}
              title={v.names.length ? `From: ${v.names.join(', ')}` : undefined}
              className="inline-flex items-center gap-1 border-2 border-secondary/15 bg-secondary/5 px-2 py-0.5 text-xs"
            >
              {emoji} <span className="font-bold text-secondary">{v.count}</span>
            </span>
          ))}
        </div>
      )}
      {replies.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Replies ({replies.length})</p>
          {replies.map((r) => (
            <div key={r.id} className="border-2 border-secondary/10 bg-secondary/5 px-3 py-2">
              <p className="text-[11px] font-bold text-secondary">
                {r.name || 'Member'}
                <span className="text-muted font-normal">
                  {' \u2022 '}{r.createdAt ? new Date(r.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </p>
              <p className="text-sm text-secondary/80 normal-case whitespace-pre-line">{r.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
