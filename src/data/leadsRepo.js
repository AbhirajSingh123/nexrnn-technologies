import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';

export async function submitContactLead({ name, phone, email, service, message, consent }) {
  if (!isSupabaseConfigured) {
    throw new Error('Backend is not configured yet. Please contact us directly by phone or email for now.');
  }
  const { error } = await supabase.from('leads_contact').insert({ name, phone, email, service, message, consent });
  if (error) throw error;
}

export async function submitServiceLead({ name, companyName, city, phone, email, message, consent, service }) {
  if (!isSupabaseConfigured) {
    throw new Error('Backend is not configured yet. Please contact us directly by phone or email for now.');
  }
  const { error } = await supabase.from('leads_service').insert({
    name,
    company_name: companyName || '',
    city,
    phone,
    email,
    message: message || '',
    consent,
    service_slug: service.slug,
    service_title: service.title,
  });
  if (error) throw error;
}

export async function submitCourseEnrollment({ name, phone, email, college, consent, course }) {
  if (!isSupabaseConfigured) {
    throw new Error('Backend is not configured yet. Please contact us directly by phone or email for now.');
  }
  // Generate the ID ourselves and include it in the insert, instead of asking
  // Supabase to return the inserted row afterward. Returning a row after
  // insert counts as a SELECT under RLS, and leads_course is intentionally
  // admin-read-only for privacy — so a plain insert (no .select()) is what
  // the public "anyone can submit" policy actually allows.
  const id = crypto.randomUUID();
  const record = {
    id,
    name,
    phone,
    email,
    college: college || '',
    consent,
    course_slug: course.slug,
    course_title: course.title,
    price: course.price || '',
  };
  const { error } = await supabase.from('leads_course').insert(record);
  if (error) throw error;
  return record;
}

export async function submitWorkshopEnrollment({ name, phone, email, college, consent, workshop }) {
  if (!isSupabaseConfigured) {
    throw new Error('Backend is not configured yet. Please contact us directly by phone or email for now.');
  }
  // Same reasoning as submitCourseEnrollment above: generate the ID
  // client-side and do a plain insert (no .select()) since leads_workshop is
  // admin-read-only.
  const id = crypto.randomUUID();
  const record = {
    id,
    name,
    phone,
    email,
    college: college || '',
    consent,
    workshop_slug: workshop.slug,
    workshop_title: workshop.title,
    price: workshop.price || '',
  };
  const { error } = await supabase.from('leads_workshop').insert(record);
  if (error) throw error;
  return record;
}
