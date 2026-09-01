import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Loader2, X, UserCog } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';
import { fetchItemMentor, setItemMentor } from '@/data/mentorsRepo';

/**
 * Admin: course/workshop ka mentor assign karne wala modal (single dropdown).
 * kind: 'course' | 'workshop'  |  item: {id, title}
 */
export default function AssignMentorModal({ kind, item, onClose, onSaved }) {
  const [mentors, setMentors] = useState([]);
  const [current, setCurrent] = useState(null); // {uuid, mentorId, name} | null
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!isSupabaseConfigured) {
          if (active) setLoading(false);
          return;
        }
        const [m, cur] = await Promise.all([
          supabase.from('mentors').select('id, mentor_id, name, mentor_type').order('created_at', { ascending: true }),
          fetchItemMentor(kind, item.id),
        ]);
        if (!active) return;
        // Sirf sahi type ke mentor: course item par course/both, workshop par workshop/both
        setMentors((m.data ?? []).filter((x) => !x.mentor_type || x.mentor_type === 'both' || x.mentor_type === kind));
        setCurrent(cur);
        setSelected(cur?.uuid || '');
      } catch {
        toast.error('Could not load mentors.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [kind, item.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setItemMentor(kind, item.id, selected || null);
      toast.success(selected ? 'Mentor assigned.' : 'Mentor removed.');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save assignment.');
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-secondary/70 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-white border-2 border-secondary">
        <div className="flex items-start justify-between px-5 sm:px-7 pt-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-0.5">Assign Mentor</p>
            <h2 className="font-heading text-xl text-secondary normal-case">{item.title}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-secondary">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 sm:p-7 pt-4">
          {loading ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 size={22} className="animate-spin text-primary" />
            </div>
          ) : (
            <>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wide mb-2">Mentor</label>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="w-full border-2 border-secondary/20 focus:border-primary px-3 py-2.5 text-sm outline-none transition-colors bg-white normal-case"
              >
                <option value="">— No mentor —</option>
                {mentors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.mentor_id})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted normal-case mt-2">
                {current
                  ? `Current: ${current.name} (${current.mentorId})`
                  : "No mentor assigned yet. The assigned mentor's panel will show this item's students, registrations and commission."}
              </p>

              <div className="flex items-center justify-end gap-3 pt-5">
                <button onClick={onClose} className="btn-secondary">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
                  {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : <><UserCog size={15} /> Save</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
