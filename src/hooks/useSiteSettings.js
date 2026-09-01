import { useEffect, useState } from 'react';
import { fetchSiteSettings } from '@/data/settingsRepo';

const DEFAULTS = { showServices: true, showCourses: true, showWorkshops: true, showPortfolio: true, showTestimonials: true, popupEnabled: false, popupImageUrl: '', popupLink: '', announcementEnabled: false, announcementText: '', announcementButtonText: '', announcementButtonLink: '', statsBandEnabled: true, statsList: [] };

export function useSiteSettings() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchSiteSettings().then((data) => {
      if (active) {
        setSettings(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return { settings, loading };
}
