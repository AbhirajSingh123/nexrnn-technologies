import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Loader2, Mail, UserPlus, X, Pencil, Trash2, FileText, IdCard, Layers, Award } from 'lucide-react';
import {
  fetchMentors, createMentor, updateMentor, deleteMentor, setMentorBlocked,
  fetchMentorAssignments, saveMentorAssignments,
} from '@/data/mentorsRepo';
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';
import { downloadMentorOfferLetterPDF, downloadMentorProfilePDF, downloadMentorLorPDF } from '@/data/mentorDocumentsRepo';
import { buildMentorMailto } from '@/utils/adminMailto';
import { formatDateTimeWithDay } from '@/utils/formatDateTime';
import AdminTable from '@/components/admin/AdminTable';
import AdminFilterBar from '@/components/admin/AdminFilterBar';
import AdminLoadMore from '@/components/admin/AdminLoadMore';
import { useLoadMore } from '@/hooks/useLoadMore';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ExportButtons from '@/components/admin/ExportButtons';

const inputClass =
  'w-full border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white normal-case';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-1.5';

const TYPE_OPTIONS = [
  { value: 'course', label: 'Courses' },
  { value: 'workshop', label: 'Workshops' },
  { value: 'both', label: 'Both (Courses & Workshops)' },
];

const TYPE_STYLES = {
  course: 'bg-blue-50 text-blue-700 border-blue-300',
  workshop: 'bg-purple-50 text-purple-700 border-purple-300',
  both: 'bg-green-50 text-green-700 border-green-300',
};

function typeName(t) {
  return t === 'course' ? 'Courses' : t === 'workshop' ? 'Workshops' : 'Both';
}

const EMPTY_FORM = {
  name: '', email: '', phone: '', commissionCourse: '', commissionWorkshop: '', location: '', gender: '', mentorType: 'both', dateOfJoining: '',
};

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

export default function AdminMentors() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(null); // add/edit form state
  const [detail, setDetail] = useState(null); // manage modal
  const [saving, setSaving] = useState(false);
  const [docBusy, setDocBusy] = useState('');
  const [assignOpen, setAssignOpen] = useState(null); // {mentor, courses, workshops, selected: {courses:[], workshops:[]}}
  const [assignSaving, setAssignSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchMentors();
      setRows(data ?? []);
    } catch {
      toast.error('Failed to load mentors.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [r.name, r.email, r.phone, r.mentorId, r.location].join(' ').toLowerCase().includes(q);
  });

  const { visibleItems, hasMore, loadMore, total, shown } = useLoadMore(filtered, search);

  // Export: FULL data
  const exportRows = filtered.map((r) => ({
    mentor_id: r.mentorId,
    name: r.name,
    email: r.email,
    phone: r.phone,
    type: typeName(r.mentorType),
    commission_course: r.commissionCourse,
    commission_workshop: r.commissionWorkshop,
    payout: r.bankAccNo ? `A/C ${r.bankAccNo} (${r.bankAccName}, IFSC ${r.bankIfsc})` : r.upiId ? `UPI ${r.upiId}` : '',
    location: r.location,
    date_of_joining: r.dateOfJoining,
    added_on: r.createdAt ? formatDateTimeWithDay(r.createdAt) : '',
  }));

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <span className="font-semibold text-secondary">{r.name}</span> },
    {
      key: 'type',
      label: 'Type',
      render: (r) => (
        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 border-2 whitespace-nowrap ${TYPE_STYLES[r.mentorType]}`}>
          {typeName(r.mentorType)}
        </span>
      ),
    },
    { key: 'phone', label: 'Number', render: (r) => r.phone || '—' },
    {
      key: 'mail',
      label: 'Mail',
      render: (r) => (
        <a
          href={buildMentorMailto(r)}
          className="inline-flex items-center gap-1.5 border-2 border-secondary/20 bg-white px-2.5 py-1.5 text-[11px] font-bold text-secondary hover:border-primary hover:text-primary transition-colors"
        >
          <Mail size={12} /> Send
        </a>
      ),
    },
    { key: 'mentor_id', label: 'Unique ID', render: (r) => <span className="font-mono text-xs text-primary font-bold">{r.mentorId || '—'}</span> },
    { key: 'manage', label: 'Manage', render: (r) => <button onClick={() => setDetail(r)} className="text-xs font-bold text-primary hover:underline">View / Edit</button> },
  ];

  const openAdd = () => setForm({ ...EMPTY_FORM, mode: 'add' });
  const openEdit = (r) => {
    setDetail(null);
    setForm({
      mode: 'edit',
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      commissionCourse: String(r.commissionCourse ?? ''),
      commissionWorkshop: String(r.commissionWorkshop ?? ''),
      location: r.location,
      gender: r.gender || '',
      mentorType: r.mentorType,
      dateOfJoining: r.dateOfJoining || '',
    });
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and Email are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        // Non-applicable commission is 0 hoti hai (workshop-only ko course commission nahi)
        commissionCourse: form.mentorType === 'workshop' ? 0 : form.commissionCourse || 0,
        commissionWorkshop: form.mentorType === 'course' ? 0 : form.commissionWorkshop || 0,
        location: form.location.trim(),
        gender: form.gender || '',
        mentorType: form.mentorType,
        dateOfJoining: form.dateOfJoining,
      };
      if (form.mode === 'add') {
        const created = await createMentor(payload);
        toast.success(`Mentor added. Unique ID: ${created.mentorId || 'see list'}`);
      } else {
        await updateMentor(form.id, payload);
        toast.success('Mentor updated.');
      }
      setForm(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to save mentor.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!detail || !window.confirm(`Delete mentor "${detail.name}"? This cannot be undone.`)) return;
    try {
      await deleteMentor(detail.id);
      toast.success('Mentor deleted.');
      setDetail(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to delete mentor.');
    }
  };

  const handleToggleBlock = async (m) => {
    const verb = m.blocked ? 'unblock' : 'block';
    if (!window.confirm(`Confirm to ${verb} mentor "${m.name}"?${m.blocked ? '' : ' They will not be able to log in.'}`)) return;
    try {
      await setMentorBlocked(m.id, !m.blocked);
      toast.success(m.blocked ? 'Mentor unblocked.' : 'Mentor blocked.');
      setDetail(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to update mentor.');
    }
  };

  const handleDoc = async (kind) => {
    if (!detail) return;
    setDocBusy(kind);
    try {
      if (kind === 'offer') await downloadMentorOfferLetterPDF(detail);
      else if (kind === 'lor') await downloadMentorLorPDF(detail);
      else await downloadMentorProfilePDF(detail);
    } catch {
      toast.error('Download failed.');
    } finally {
      setDocBusy('');
    }
  };

  // Assign courses/workshops modal kholo (catalog + current selections load)
  const openAssign = async (m) => {
    setDetail(null);
    setAssignOpen({ mentor: m, courses: [], workshops: [], selected: { courses: [], workshops: [] } });
    try {
      if (!isSupabaseConfigured) return;
      const [cat, wsp, asg] = await Promise.all([
        supabase.from('courses').select('id, course_title').order('created_at', { ascending: false }),
        supabase.from('workshops').select('id, workshop_title').order('created_at', { ascending: false }),
        fetchMentorAssignments(m.id),
      ]);
      setAssignOpen({
        mentor: m,
        courses: cat.data ?? [],
        workshops: wsp.data ?? [],
        selected: { courses: asg.courseIds, workshops: asg.workshopIds },
      });
    } catch {
      toast.error('Could not load assignments.');
    }
  };

  const toggleAssign = (kind, id) => {
    setAssignOpen((a) => {
      if (!a) return a;
      const list = a.selected[kind];
      const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
      return { ...a, selected: { ...a.selected, [kind]: next } };
    });
  };

  const handleAssignSave = async () => {
    if (!assignOpen) return;
    setAssignSaving(true);
    try {
      // Type ke bahar ki assignments force-empty (purani galti bhi clear ho jaye)
      const courses = assignOpen.mentor.mentorType === 'workshop' ? [] : assignOpen.selected.courses;
      const workshops = assignOpen.mentor.mentorType === 'course' ? [] : assignOpen.selected.workshops;
      await saveMentorAssignments(assignOpen.mentor.id, courses, workshops);
      toast.success('Assignments saved.');
      setAssignOpen(null);
    } catch (err) {
      toast.error(err.message || 'Failed to save assignments.');
    } finally {
      setAssignSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-1">
        <h1 className="font-heading text-3xl text-secondary">Mentors</h1>
        <button onClick={openAdd} className="btn-primary inline-flex items-center gap-2 shrink-0">
          <UserPlus size={15} /> Add Mentor
        </button>
      </div>
      <p className="text-sm text-muted normal-case mb-6">Mentor network — commission-based association for courses &amp; workshops.</p>

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, email, number, unique ID…"
      />

      <div className="mb-4">
        <ExportButtons rows={exportRows} columns={columns} filename="mentors" title="Mentors" excludeKeys={['mail', 'manage']} />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <AdminTable columns={columns} rows={visibleItems} />
          <AdminLoadMore shown={shown} total={total} hasMore={hasMore} onLoadMore={loadMore} />
        </>
      )}

      {/* ---------- Assign Programs modal ---------- */}
      {assignOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-secondary/70 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setAssignOpen(null);
          }}
        >
          <div className="w-full max-w-lg bg-white border-2 border-secondary max-h-[88vh] overflow-y-auto">
            <div className="flex items-start justify-between px-5 sm:px-7 pt-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-0.5">Assign Programs</p>
                <h2 className="font-heading text-xl text-secondary">{assignOpen.mentor.name}</h2>
                <p className="text-xs text-muted normal-case mt-0.5">This mentor's panel will show students, registrations and commission for the assigned programs.</p>
              </div>
              <button onClick={() => setAssignOpen(null)} aria-label="Close" className="text-muted hover:text-secondary">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 sm:p-7 pt-4">
              {assignOpen.mentor.mentorType !== 'workshop' ? (
                <AssignGroup
                  label={`Courses (${assignOpen.selected.courses.length} selected)`}
                  items={assignOpen.courses.map((c) => ({ id: c.id, title: c.course_title }))}
                  selected={assignOpen.selected.courses}
                  onToggle={(id) => toggleAssign('courses', id)}
                />
              ) : (
                <p className="text-xs text-muted normal-case border-2 border-secondary/15 bg-accent px-4 py-3 mb-1">
                  This mentor is workshop-only — course assignments are not available (and no course commission is paid).
                </p>
              )}
              {assignOpen.mentor.mentorType !== 'course' ? (
                <AssignGroup
                  label={`Workshops (${assignOpen.selected.workshops.length} selected)`}
                  items={assignOpen.workshops.map((w) => ({ id: w.id, title: w.workshop_title }))}
                  selected={assignOpen.selected.workshops}
                  onToggle={(id) => toggleAssign('workshops', id)}
                />
              ) : (
                <p className="text-xs text-muted normal-case border-2 border-secondary/15 bg-accent px-4 py-3 mb-1">
                  This mentor is course-only — workshop assignments are not available (and no workshop commission is paid).
                </p>
              )}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button onClick={() => setAssignOpen(null)} className="btn-secondary">Cancel</button>
                <button onClick={handleAssignSave} disabled={assignSaving} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
                  {assignSaving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : 'Save Assignments'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Add / Edit form modal ---------- */}
      {form && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-secondary/70 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setForm(null);
          }}
        >
          <div className="w-full max-w-lg bg-white border-2 border-secondary max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 sm:px-7 pt-5">
              <h2 className="font-heading text-xl text-secondary">{form.mode === 'add' ? 'Add Mentor' : 'Edit Mentor'}</h2>
              <button onClick={() => setForm(null)} aria-label="Close" className="text-muted hover:text-secondary">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 sm:p-7 pt-4 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Name *</label>
                  <input className={inputClass} value={form.name} onChange={set('name')} placeholder="e.g. Rahul Verma" />
                </div>
                <div>
                  <label className={labelClass}>Email *</label>
                  <input type="email" className={inputClass} value={form.email} onChange={set('email')} placeholder="mentor@email.com" />
                </div>
                <div>
                  <label className={labelClass}>Number</label>
                  <input className={inputClass} value={form.phone} onChange={set('phone')} placeholder="10-digit mobile" />
                </div>
                {form.mentorType !== 'workshop' && (
                  <div>
                    <label className={labelClass}>Course Commission (%)</label>
                    <input type="number" min="0" max="100" className={inputClass} value={form.commissionCourse} onChange={set('commissionCourse')} placeholder="e.g. 15" />
                  </div>
                )}
                {form.mentorType !== 'course' && (
                  <div>
                    <label className={labelClass}>Workshop Commission (%)</label>
                    <input type="number" min="0" max="100" className={inputClass} value={form.commissionWorkshop} onChange={set('commissionWorkshop')} placeholder="e.g. 10" />
                  </div>
                )}
                <div>
                  <label className={labelClass}>Location</label>
                  <input className={inputClass} value={form.location} onChange={set('location')} placeholder="City, State" />
                </div>
                <div>
                  <label className={labelClass}>Gender</label>
                  <select className={inputClass} value={form.gender} onChange={set('gender')}>
                    <option value="">Prefer not to say</option>
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Date of Joining</label>
                  <input type="date" className={inputClass} value={form.dateOfJoining} onChange={set('dateOfJoining')} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Select Type</label>
                  <select className={inputClass} value={form.mentorType} onChange={set('mentorType')}>
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button onClick={() => setForm(null)} className="btn-secondary">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
                  {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : 'Save Mentor'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Manage (detail) modal ---------- */}
      {detail && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-secondary/70 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDetail(null);
          }}
        >
          <div className="w-full max-w-lg bg-white border-2 border-secondary max-h-[88vh] overflow-y-auto">
            <div className="flex items-start justify-between px-5 sm:px-7 pt-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-0.5">Mentor — {detail.mentorId}</p>
                <h2 className="font-heading text-xl text-secondary">{detail.name}</h2>
              </div>
              <button onClick={() => setDetail(null)} aria-label="Close" className="text-muted hover:text-secondary">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 sm:p-7 pt-4">
              {/* All info */}
              <div className="grid sm:grid-cols-2 gap-4 mb-6 text-sm">
                <Detail label="Name" value={detail.name} />
                <Detail label="Email" value={detail.email} />
                <Detail label="Number" value={detail.phone || '—'} />
                <Detail label="Location" value={detail.location || '—'} />
                <Detail label="Gender" value={detail.gender || '—'} />
                <Detail label="Type" value={typeName(detail.mentorType)} />
                {detail.mentorType !== 'workshop' && <Detail label="Course Commission" value={`${detail.commissionCourse}%`} />}
                {detail.mentorType !== 'course' && <Detail label="Workshop Commission" value={`${detail.commissionWorkshop}%`} />}
                <Detail label="Date of Joining" value={detail.dateOfJoining || '—'} />
                <Detail label="Unique ID" value={detail.mentorId} mono />
              </div>

              {/* Payout details (latest withdrawal ke time se) */}
              {(detail.bankAccNo || detail.upiId) && (
                <div className="border-t-2 border-secondary/10 pt-5 mb-5">
                  <h3 className="text-sm font-bold text-secondary uppercase tracking-wide mb-3">Payout Details</h3>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    {detail.bankAccNo ? (
                      <>
                        <Detail label="Account Number" value={detail.bankAccNo} mono />
                        <Detail label="Account Name" value={detail.bankAccName || '—'} />
                        <Detail label="IFSC Code" value={detail.bankIfsc || '—'} mono />
                      </>
                    ) : (
                      <Detail label="UPI ID" value={detail.upiId} mono />
                    )}
                  </div>
                </div>
              )}

              {/* Downloads */}
              <div className="border-t-2 border-secondary/10 pt-5 mb-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-sm font-bold text-secondary uppercase tracking-wide">Download Documents</h3>
                  {detail.blocked && (
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 border-2 border-red-300 bg-red-50 text-red-600">Blocked</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <DocButton
                    icon={FileText}
                    label="Offer Letter"
                    sub="Joining letter PDF"
                    busy={docBusy === 'offer'}
                    onClick={() => handleDoc('offer')}
                  />
                  <DocButton
                    icon={Award}
                    label="LOR"
                    sub="Recommendation PDF"
                    busy={docBusy === 'lor'}
                    onClick={() => handleDoc('lor')}
                  />
                  <DocButton
                    icon={IdCard}
                    label="Full Profile"
                    sub="All details PDF"
                    busy={docBusy === 'profile'}
                    onClick={() => handleDoc('profile')}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-end gap-3 border-t-2 border-secondary/10 pt-5">
                <button onClick={handleDelete} className="inline-flex items-center gap-2 border-2 border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-600 hover:border-red-400 transition-colors">
                  <Trash2 size={14} /> Delete
                </button>
                <button
                  onClick={() => handleToggleBlock(detail)}
                  className={`inline-flex items-center gap-2 border-2 px-3.5 py-2 text-xs font-bold transition-colors ${detail.blocked ? 'border-green-200 bg-green-50 text-green-700 hover:border-green-400' : 'border-orange-200 bg-orange-50 text-orange-600 hover:border-orange-400'}`}
                >
                  {detail.blocked ? 'Unblock Mentor' : 'Block Mentor'}
                </button>
                <a
                  href={buildMentorMailto(detail)}
                  className="inline-flex items-center gap-2 border-2 border-secondary/20 bg-white px-3.5 py-2 text-xs font-bold text-secondary hover:border-primary hover:text-primary transition-colors"
                >
                  <Mail size={14} /> Mail
                </a>
                <button onClick={() => openAssign(detail)} className="btn-primary inline-flex items-center gap-2">
                  <Layers size={14} /> Assign Programs
                </button>
                <button onClick={() => openEdit(detail)} className="btn-secondary inline-flex items-center gap-2">
                  <Pencil size={14} /> Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, mono = false }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-0.5">{label}</p>
      <p className={`text-sm text-secondary break-words ${mono ? 'font-mono font-bold text-primary' : ''}`}>{value || '—'}</p>
    </div>
  );
}

function DocButton({ icon: Icon, label, sub, busy, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-2.5 border-2 border-secondary/20 bg-white px-3.5 py-2.5 hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-60"
    >
      {busy ? <Loader2 size={16} className="text-primary animate-spin" /> : <Icon size={16} className="text-primary shrink-0" />}
      <span className="text-left">
        <span className="block text-xs font-bold text-secondary">{label}</span>
        <span className="block text-[10px] text-muted normal-case">{busy ? 'Downloading…' : sub}</span>
      </span>
    </button>
  );
}

function AssignGroup({ label, items, selected, onToggle }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">{label}</p>
      {items.length === 0 ? (
        <p className="text-xs text-muted normal-case">Nothing in catalog yet.</p>
      ) : (
        <div className="max-h-44 overflow-y-auto border-2 border-secondary/15 divide-y divide-secondary/10">
          {items.map((it) => (
            <label key={it.id} className="flex items-center gap-3 px-3.5 py-2 cursor-pointer hover:bg-accent/60">
              <input
                type="checkbox"
                className="w-4 h-4 accent-primary shrink-0"
                checked={selected.includes(it.id)}
                onChange={() => onToggle(it.id)}
              />
              <span className="text-sm text-secondary normal-case">{it.title}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
