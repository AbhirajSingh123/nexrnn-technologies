import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';

const DEFAULT_SETTINGS = {
  showServices: true,
  showCourses: true,
  showWorkshops: true,
  showPortfolio: true,
  showTestimonials: true,
  paymentSuccessHeading: 'Enrollment Submitted!',
  paymentSuccessBody:
    'Dear {name},\n\nYour enrollment request for {title} has been submitted successfully.\n\nThank you for choosing NexRNN Technologies. Our team will review and verify the details you provided. Once your enrollment is verified, we will contact you with the next steps, including information about your live classes and course materials.\n\nIf you have any questions, please contact us at nexrnntechnology@gmail.com.\n\nCongratulations, and welcome to NexRNN Technologies!\nYou will receive a confirmation and welcome email after successful verification of your enrollment details.\n\n\u2014 Team NexRNN Technologies',
  popupEnabled: false,
  popupImageUrl: '',
  popupLink: '',
};

function mapRow(row) {
  return {
    showServices: row.show_services,
    showCourses: row.show_courses,
    showWorkshops: row.show_workshops,
    showPortfolio: row.show_portfolio ?? true,
    showTestimonials: row.show_testimonials ?? true,
    paymentSuccessHeading: row.payment_success_heading,
    paymentSuccessBody: row.payment_success_body,
    popupEnabled: row.popup_enabled,
    popupImageUrl: row.popup_image_url,
    popupLink: row.popup_link,
  };
}

export async function fetchSiteSettings() {
  if (!isSupabaseConfigured) return DEFAULT_SETTINGS;
  const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
  if (error || !data) return DEFAULT_SETTINGS;
  return mapRow(data);
}

export async function updateSiteSettings(settings) {
  const { error } = await supabase
    .from('site_settings')
    .update({
      show_services: settings.showServices,
      show_courses: settings.showCourses,
      show_workshops: settings.showWorkshops,
      show_portfolio: settings.showPortfolio,
      show_testimonials: settings.showTestimonials,
      payment_success_heading: settings.paymentSuccessHeading,
      payment_success_body: settings.paymentSuccessBody,
      popup_enabled: settings.popupEnabled,
      popup_image_url: settings.popupImageUrl,
      popup_link: settings.popupLink,
    })
    .eq('id', 1);
  if (error) throw error;
}
