import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';

// stats_json -> [{label, value, suffix}] (galat JSON ho to khali list)
function parseStatsJson(raw) {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .slice(0, 4)
      .map((s) => ({ label: String(s.label || ''), value: Number(s.value) || 0, suffix: String(s.suffix || '') }));
  } catch {
    return [];
  }
}

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
  announcementEnabled: false,
  announcementText: 'Admissions open for new batches — limited seats!',
  announcementButtonText: 'Contact Us',
  announcementButtonLink: '/Contect-us',
  statsBandEnabled: true,
  statsList: [],
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
    announcementEnabled: row.announcement_enabled ?? false,
    announcementText: row.announcement_text ?? '',
    announcementButtonText: row.announcement_button_text ?? '',
    announcementButtonLink: row.announcement_button_link ?? '',
    statsBandEnabled: row.stats_band_enabled ?? true,
    statsList: parseStatsJson(row.stats_json),
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
      announcement_enabled: settings.announcementEnabled,
      announcement_text: settings.announcementText,
      announcement_button_text: settings.announcementButtonText,
      announcement_button_link: settings.announcementButtonLink,
      stats_band_enabled: settings.statsBandEnabled,
      stats_json: JSON.stringify(settings.statsList ?? []),
    })
    .eq('id', 1);
  if (error) throw error;
}
