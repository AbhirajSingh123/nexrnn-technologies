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

export async function submitCourseEnrollment({ name, phone, email, college, paymentRefNo, consent, course }) {
  if (!isSupabaseConfigured) {
    throw new Error('Backend is not configured yet. Please contact us directly by phone or email for now.');
  }
  const { error } = await supabase.from('leads_course').insert({
    name,
    phone,
    email,
    college: college || '',
    payment_ref_no: paymentRefNo || '',
    consent,
    course_slug: course.slug,
    course_title: course.title,
    price: course.price || '',
  });
  if (error) throw error;
}
