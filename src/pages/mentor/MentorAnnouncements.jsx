import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Loader2 } from 'lucide-react';
import { mentorData } from '@/data/mentorAuth';
import { MENTOR_ROUTES } from '@/constants/mentorRoutes';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const inputClass =
  'w-full border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white normal-case';

const EMOJIS = ['👍', '❤️', '🎉', '👏', '🙏'];

const fmtDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

export default function MentorAnnouncements() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyKey, setBusyKey] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await mentorData('announcements');
      setRows(d.rows || []);
    } catch (err) {
      if (err?.status === 401) {
        navigate(MENTOR_ROUTES.login, { replace: true });
        return;
      }
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const updateRow = (annId, patch) => setRows((rs) => rs.map((r) => (r.id === annId ? { ...r, ...patch } : r)));

  const handleReact = async (a, emoji) => {
    const key = `${a.id}:${emoji}`;
    setBusyKey(key);
    const prev = { reactions: a.reactions, myReactions: a.myReactions };
    // Optimistic toggle (turant feel)
    const reactions = { ...(a.reactions || {}) };
    const mine = [...(a.myReactions || [])];
    if (mine.includes(emoji)) {
      mine.splice(mine.indexOf(emoji), 1);
      const c = (reactions[emoji] || 1) - 1;
      if (c > 0) reactions[emoji] = c;
      else delete reactions[emoji];
    } else {
      mine.push(emoji);
      reactions[emoji] = (reactions[emoji] || 0) + 1;
    }
    updateRow(a.id, { reactions, myReactions: mine });
    try {
      const d = await mentorData('announcement_react', { announcement_id: a.id, emoji });
      updateRow(a.id, { reactions: d.reactions || reactions, myReactions: d.myReactions || mine });
    } catch (err) {
      updateRow(a.id, prev);
      if (err?.status === 401) {
        navigate(MENTOR_ROUTES.login, { replace: true });
        return;
      }
      toast.error(err.message || 'Could not save reaction.');
    } finally {
      setBusyKey('');
    }
  };

  const handleReply = async (a, text, done) => {
    const message = String(text || '').trim();
    if (!message) {
      toast.error('Reply is empty.');
      return;
    }
    const key = `${a.id}:reply`;
    setBusyKey(key);
    try {
      const d = await mentorData('announcement_reply', { announcement_id: a.id, message });
      updateRow(a.id, { replies: [...(a.replies || []), d.reply] });
      done();
      toast.success('Reply sent.');
    } catch (err) {
      if (err?.status === 401) {
        navigate(MENTOR_ROUTES.login, { replace: true });
        return;
      }
      toast.error(err.message || 'Could not send reply.');
    } finally {
      setBusyKey('');
    }
  };

  return (
    <div>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      <h1 className="font-heading text-3xl text-secondary mb-1">Announcements</h1>
      <p className="text-sm text-muted normal-case mb-6">
        Notices and updates sent by the NexRNN admin team. React with an emoji or reply to any announcement.
      </p>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-primary normal-case">{error}</p>
      ) : rows.length === 0 ? (
        <div className="card-base bg-white p-10 text-center">
          <Megaphone size={28} className="text-muted mx-auto mb-3" />
          <p className="text-sm text-muted normal-case">No announcements yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((a) => (
            <AnnouncementCard key={a.id} a={a} busyKey={busyKey} onReact={handleReact} onReply={handleReply} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Ek announcement card: notice + emoji reactions + replies */
function AnnouncementCard({ a, busyKey, onReact, onReply }) {
  const [showReply, setShowReply] = useState(false);
  const [text, setText] = useState('');
  const replies = a.replies || [];

  const send = () => {
    onReply(a, text, () => setText(''));
  };

  return (
    <div className="card-base bg-white p-5">
      <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 border-2 border-primary/30 bg-primary/5 text-primary">
          <Megaphone size={11} /> Announcement
        </span>
        {a.onlyMe && (
          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 border-2 border-secondary/20 bg-secondary/5 text-secondary">
            Only you
          </span>
        )}
        <span className="text-[10px] text-muted normal-case ml-auto">
          {fmtDateTime(a.createdAt)}
        </span>
      </div>
      <h3 className="font-heading text-lg text-secondary normal-case leading-snug">{a.title}</h3>
      <p className="text-sm text-secondary/80 normal-case mt-1.5 whitespace-pre-line">{a.message}</p>
      <p className="text-[10px] text-muted normal-case mt-2">— {a.createdBy || 'NexRNN Admin'}</p>

      {/* Emoji reactions */}
      <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t-2 border-secondary/10">
        {EMOJIS.map((e) => {
          const mine = (a.myReactions || []).includes(e);
          const count = a.reactions?.[e] || 0;
          const busy = busyKey === `${a.id}:${e}`;
          return (
            <button
              key={e}
              onClick={() => onReact(a, e)}
              disabled={busy}
              title={mine ? 'Tap to remove your reaction' : 'React'}
              className={`inline-flex items-center gap-1 border-2 px-2.5 py-1.5 text-sm transition-colors disabled:opacity-60 ${
                mine ? 'border-primary bg-primary/10' : 'border-secondary/20 bg-white hover:border-primary'
              }`}
            >
              <span>{e}</span>
              {count > 0 && <span className="text-[11px] font-bold text-secondary">{count}</span>}
            </button>
          );
        })}
        <button
          onClick={() => setShowReply((s) => !s)}
          className={`ml-auto inline-flex items-center gap-1.5 border-2 px-2.5 py-1.5 text-xs font-bold transition-colors ${
            showReply ? 'border-primary bg-primary/10 text-primary' : 'border-secondary/20 bg-white text-secondary hover:border-primary'
          }`}
        >
          {replies.length > 0 ? `Replies (${replies.length})` : 'Reply'}
        </button>
      </div>

      {/* Replies */}
      {showReply && (
        <div className="mt-3">
          {replies.length > 0 && (
            <div className="space-y-2 mb-3">
              {replies.map((r) => (
                <div key={r.id} className={`border-2 px-3 py-2 ${r.mine ? 'border-primary/30 bg-primary/5' : 'border-secondary/10 bg-secondary/5'}`}>
                  <p className="text-[11px] font-bold text-secondary">
                    {r.mine ? 'You' : r.name || 'Member'}
                    <span className="text-muted font-normal"> • {fmtDateTime(r.createdAt)}</span>
                  </p>
                  <p className="text-sm text-secondary/80 normal-case whitespace-pre-line">{r.message}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <textarea
              rows={2}
              className={`${inputClass} resize-y`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a reply…"
              maxLength={1000}
            />
            <button
              onClick={send}
              disabled={busyKey === `${a.id}:reply`}
              className="btn-primary inline-flex items-center gap-2 shrink-0 disabled:opacity-60"
            >
              {busyKey === `${a.id}:reply` ? <Loader2 size={15} className="animate-spin" /> : null} Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
