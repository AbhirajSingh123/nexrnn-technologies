/**
 * Mentors repo (admin-managed mentor network).
 * Mentor ID database-side trigger se banta hai (NX-MEN-XXXXXXXX).
 * Supabase configured na ho to SAMPLE_MENTORS se chalta hai (site jaisi).
 */
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';

const TABLE = 'mentors';

/** Supabase na ho to demo data (admin panel khali na dikhe) */
export const SAMPLE_MENTORS = [
  {
    id: 'sample-1',
    mentorId: 'NX-MEN-A1B2C3D4',
    name: 'Rahul Verma',
    email: 'rahul.verma@example.com',
    phone: '9876543210',
    commissionPercent: 15,
    commissionCourse: 15,
    commissionWorkshop: 12,
    location: 'Lucknow, UP',
    mentorType: 'both',
    dateOfJoining: '2026-01-15',
  },
  {
    id: 'sample-2',
    mentorId: 'NX-MEN-E5F6G7H8',
    name: 'Priya Singh',
    email: 'priya.singh@example.com',
    phone: '9123456780',
    commissionPercent: 10,
    commissionCourse: 10,
    commissionWorkshop: 8,
    location: 'Kanpur, UP',
    mentorType: 'course',
    dateOfJoining: '2026-03-02',
  },
];

function mapRow(row) {
  return {
    id: row.id,
    mentorId: row.mentor_id || '',
    name: row.name || '',
    email: row.email || '',
    phone: row.phone || '',
    commissionPercent: Number(row.commission_percent) || 0,
    commissionCourse: Number(row.commission_course ?? row.commission_percent) || 0,
    commissionWorkshop: Number(row.commission_workshop ?? row.commission_percent) || 0,
    bankAccNo: row.bank_acc_no || '',
    bankAccName: row.bank_acc_name || '',
    bankIfsc: row.bank_ifsc || '',
    upiId: row.upi_id || '',
    location: row.location || '',
    gender: row.gender || '',
    blocked: Boolean(row.blocked),
    // 'course' | 'workshop' | 'both'
    mentorType: ['course', 'workshop', 'both'].includes(row.mentor_type) ? row.mentor_type : 'both',
    dateOfJoining: row.date_of_joining || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Admin: saare mentors (naye pehle) */
export async function fetchMentors() {
  if (!isSupabaseConfigured) return SAMPLE_MENTORS.map(mapRow);
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

/** Admin: naya mentor add (ID DB trigger se aati hai) */
export async function createMentor(payload) {
  if (!isSupabaseConfigured) {
    // Demo mode: client-side random ID (DB me trigger khud karta hai)
    const id = 'NX-MEN-' + Math.random().toString(36).slice(2, 10).toUpperCase();
    return { ...payload, mentorId: id, id: `local-${Date.now()}` };
  }
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      commission_percent: Number(payload.commissionPercent) || 0,
      commission_course: Number(payload.commissionCourse) || 0,
      commission_workshop: Number(payload.commissionWorkshop) || 0,
      location: payload.location,
      gender: payload.gender || '',
      mentor_type: payload.mentorType,
      date_of_joining: payload.dateOfJoining || null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data);
}

/** Admin: mentor update */
export async function updateMentor(id, payload) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from(TABLE)
    .update({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      commission_percent: Number(payload.commissionPercent) || 0,
      commission_course: Number(payload.commissionCourse) || 0,
      commission_workshop: Number(payload.commissionWorkshop) || 0,
      location: payload.location,
      gender: payload.gender || '',
      mentor_type: payload.mentorType,
      date_of_joining: payload.dateOfJoining || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

/** Admin: mentor ko block/unblock karo (blocked = login nahi kar payega) */
export async function setMentorBlocked(id, blocked) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from('mentors')
    .update({ blocked, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

/** Admin: assigned course/workshop ids */
export async function fetchMentorAssignments(mentorUuid) {
  if (!isSupabaseConfigured) return { courseIds: [], workshopIds: [] };
  const [ca, wa] = await Promise.all([
    supabase.from('mentor_course_assignments').select('course_id').eq('mentor_uuid', mentorUuid),
    supabase.from('mentor_workshop_assignments').select('workshop_id').eq('mentor_uuid', mentorUuid),
  ]);
  return {
    courseIds: (ca.data ?? []).map((r) => r.course_id),
    workshopIds: (wa.data ?? []).map((r) => r.workshop_id),
  };
}

/** Admin: assignments save (pehle hatao, phir daalo) */
export async function saveMentorAssignments(mentorUuid, courseIds, workshopIds) {
  if (!isSupabaseConfigured) return;
  await supabase.from('mentor_course_assignments').delete().eq('mentor_uuid', mentorUuid);
  await supabase.from('mentor_workshop_assignments').delete().eq('mentor_uuid', mentorUuid);
  if (courseIds.length) {
    const { error } = await supabase
      .from('mentor_course_assignments')
      .insert(courseIds.map((id) => ({ mentor_uuid: mentorUuid, course_id: id })));
    if (error) throw error;
  }
  if (workshopIds.length) {
    const { error } = await supabase
      .from('mentor_workshop_assignments')
      .insert(workshopIds.map((id) => ({ mentor_uuid: mentorUuid, workshop_id: id })));
    if (error) throw error;
  }
}

/**
 * Admin: ek course/workshop ka mentor set/clear (single-select dropdown).
 * mentorUuid null = assignment hatao.
 */
export async function setItemMentor(kind, itemId, mentorUuid) {
  if (!isSupabaseConfigured) return;
  const table = kind === 'workshop' ? 'mentor_workshop_assignments' : 'mentor_course_assignments';
  const col = kind === 'workshop' ? 'workshop_id' : 'course_id';
  await supabase.from(table).delete().eq(col, itemId);
  if (mentorUuid) {
    const payload = { mentor_uuid: mentorUuid };
    payload[col] = itemId;
    const { error } = await supabase.from(table).insert(payload);
    if (error) throw error;
  }
}

/** Admin: ek course/workshop ka current mentor (dropdown prefill) */
export async function fetchItemMentor(kind, itemId) {
  if (!isSupabaseConfigured) return null;
  const table = kind === 'workshop' ? 'mentor_workshop_assignments' : 'mentor_course_assignments';
  const col = kind === 'workshop' ? 'workshop_id' : 'course_id';
  const { data } = await supabase
    .from(table)
    .select('mentor_uuid, mentors(mentor_id, name)')
    .eq(col, itemId)
    .maybeSingle();
  if (!data?.mentors) return null;
  return { uuid: data.mentor_uuid, mentorId: data.mentors.mentor_id, name: data.mentors.name };
}

/** Admin: mentor delete */
export async function deleteMentor(id) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}
