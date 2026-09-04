import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';
import { generateReferenceId } from '@/utils/referenceId';

export async function submitContactLead({ name, phone, email, service, message, consent }) {
  if (!isSupabaseConfigured) {
    throw new Error('Online submissions are temporarily unavailable. Please contact us directly by phone or email.');
  }
  const { error } = await supabase.from('leads_contact').insert({ name, phone, email, service, message, consent });
  if (error) throw error;
}

export async function submitServiceLead({ name, companyName, city, phone, email, message, consent, service, referralCode }) {
  if (!isSupabaseConfigured) {
    throw new Error('Online submissions are temporarily unavailable. Please contact us directly by phone or email.');
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
    // Sales refer & earn: user ne jo code dala (optional, uppercase normalised)
    referral_code: String(referralCode || '').trim().toUpperCase().slice(0, 20),
  });
  if (error) throw error;
}

export async function submitCourseEnrollment({ name, phone, email, college, consent, course, referralCode }) {
  if (!isSupabaseConfigured) {
    throw new Error('Online submissions are temporarily unavailable. Please contact us directly by phone or email.');
  }
  // Generate the ID ourselves and include it in the insert, instead of asking
  // Supabase to return the inserted row afterward. Returning a row after
  // insert counts as a SELECT under RLS, and leads_course is intentionally
  // admin-read-only for privacy — so a plain insert (no .select()) is what
  // the public "anyone can submit" policy actually allows.
  const id = crypto.randomUUID();
  const referenceId = generateReferenceId('CRS');
  const record = {
    id,
    name,
    phone,
    email,
    college: college || '',
    consent,
    // Sales refer & earn: user ne jo code dala (optional, uppercase normalised)
    referral_code: String(referralCode || '').trim().toUpperCase().slice(0, 20),
    course_slug: course.slug,
    course_title: course.title,
    price: course.price || '',
    reference_id: referenceId,
    // Batch ID: course ka batch automatically is enrollment par lag jata hai
    ...(course.batchId ? { batch_id: course.batchId } : {}),
    ...(course.isFree ? { payment_status: 'free' } : {}),
  };
  const { error } = await supabase.from('leads_course').insert(record);
  if (error) throw error;
  return { ...record, referenceId };
}

export async function submitWorkshopEnrollment({ name, phone, email, college, consent, workshop, referralCode }) {
  if (!isSupabaseConfigured) {
    throw new Error('Online submissions are temporarily unavailable. Please contact us directly by phone or email.');
  }
  // Same reasoning as submitCourseEnrollment above: generate the ID
  // client-side and do a plain insert (no .select()) since leads_workshop is
  // admin-read-only.
  const id = crypto.randomUUID();
  const referenceId = generateReferenceId('WRK');
  const record = {
    id,
    name,
    phone,
    email,
    college: college || '',
    consent,
    // Sales refer & earn: user ne jo code dala (optional, uppercase normalised)
    referral_code: String(referralCode || '').trim().toUpperCase().slice(0, 20),
    workshop_slug: workshop.slug,
    workshop_title: workshop.title,
    price: workshop.price || '',
    reference_id: referenceId,
    // Batch ID: workshop ka batch automatically is enrollment par lag jata hai
    ...(workshop.batchId ? { batch_id: workshop.batchId } : {}),
    ...(workshop.isFree ? { payment_status: 'free' } : {}),
  };
  const { error } = await supabase.from('leads_workshop').insert(record);
  if (error) throw error;
  return { ...record, referenceId };
}
