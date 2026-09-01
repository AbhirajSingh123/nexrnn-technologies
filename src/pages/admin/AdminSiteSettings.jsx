import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Loader2, UploadCloud } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { fetchSiteSettings, updateSiteSettings } from '@/data/settingsRepo';
import { HERO_STATS } from '@/constants/siteData';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const inputClass = 'w-full border-2 border-secondary/20 focus:border-primary px-4 py-2.5 text-sm outline-none transition-colors bg-white';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-2';

export default function AdminSiteSettings() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSiteSettings().then((data) => {
      const statsList = Array.isArray(data.statsList) && data.statsList.length === 4
        ? data.statsList
        : HERO_STATS.map((s) => ({ label: s.label, value: s.value, suffix: s.suffix }));
      setForm({ ...data, statsList });
      setLoading(false);
    });
  }, []);

  if (loading || !form) return <LoadingSpinner className="min-h-[40vh]" />;

  const handleToggle = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.checked }));
  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  // Stats band: ek stat ka field badlo
  const handleStatChange = (idx, field) => (e) => {
    const val = e.target.value;
    setForm((f) => {
      const statsList = (f.statsList ?? []).map((s, i) => (i === idx ? { ...s, [field]: field === 'value' ? Number(val) || 0 : val } : s));
      return { ...f, statsList };
    });
  };

  const handlePopupImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileName = `popup-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('site-assets').upload(fileName, file, { upsert: true });
    if (error) {
      toast.error(error.message || 'Upload failed.');
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('site-assets').getPublicUrl(fileName);
    setForm((f) => ({ ...f, popupImageUrl: data.publicUrl }));
    setUploading(false);
    toast.success('Popup image uploaded.');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSiteSettings(form);
      toast.success('Settings saved.');
    } catch (err) {
      toast.error(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="font-heading text-3xl text-secondary mb-1">Site Settings</h1>
      <p className="text-sm text-muted normal-case mb-6">Control what shows on the public website.</p>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        <div className="card-base bg-white p-7">
          <h2 className="text-lg text-secondary normal-case mb-5">Section Visibility</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-sm font-semibold text-secondary">Show Services on website</span>
              <input type="checkbox" className="w-5 h-5 accent-primary" checked={form.showServices} onChange={handleToggle('showServices')} />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm font-semibold text-secondary">Show Courses on website</span>
              <input type="checkbox" className="w-5 h-5 accent-primary" checked={form.showCourses} onChange={handleToggle('showCourses')} />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm font-semibold text-secondary">Show Workshops on website</span>
              <input type="checkbox" className="w-5 h-5 accent-primary" checked={form.showWorkshops} onChange={handleToggle('showWorkshops')} />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm font-semibold text-secondary">Show Portfolio on website</span>
              <input type="checkbox" className="w-5 h-5 accent-primary" checked={form.showPortfolio} onChange={handleToggle('showPortfolio')} />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm font-semibold text-secondary">Show Testimonials on website</span>
              <input type="checkbox" className="w-5 h-5 accent-primary" checked={form.showTestimonials} onChange={handleToggle('showTestimonials')} />
            </label>
          </div>
        </div>

        <div className="card-base bg-white p-7">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg text-secondary normal-case">Stats Band (Home Page Numbers)</h2>
            <label className="flex items-center gap-2.5">
              <input type="checkbox" className="w-5 h-5 accent-primary" checked={form.statsBandEnabled} onChange={handleToggle('statsBandEnabled')} />
              <span className="text-sm font-semibold text-secondary">Show</span>
            </label>
          </div>
          <p className="text-xs text-muted normal-case mb-5">
            Blue strip below the hero on the home page (14+ Services Offered etc.). Value = number shown,
            Suffix = the part shown after the number (e.g. <code className="bg-accent px-1.5 py-0.5">+</code>).
            For a text-only box (e.g. &ldquo;India&rdquo;), keep Value 0 — only the Suffix will show.
          </p>

          <div className="space-y-4">
            {form.statsList.map((stat, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_140px] gap-4 items-end">
                <div>
                  <label className={labelClass}>Box {idx + 1} — Label</label>
                  <input className={inputClass} value={stat.label} onChange={handleStatChange(idx, 'label')} placeholder="e.g. Services Offered" />
                </div>
                <div>
                  <label className={labelClass}>Value</label>
                  <input type="number" min="0" className={inputClass} value={stat.value || ''} onChange={handleStatChange(idx, 'value')} placeholder="14" />
                </div>
                <div>
                  <label className={labelClass}>Suffix (+ / Text)</label>
                  <input className={inputClass} value={stat.suffix} onChange={handleStatChange(idx, 'suffix')} placeholder="+" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-base bg-white p-7">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg text-secondary normal-case">Announcement Bar (Top Strip)</h2>
            <label className="flex items-center gap-2.5">
              <input type="checkbox" className="w-5 h-5 accent-primary" checked={form.announcementEnabled} onChange={handleToggle('announcementEnabled')} />
              <span className="text-sm font-semibold text-secondary">Show</span>
            </label>
          </div>
          <p className="text-xs text-muted normal-case mb-5">
            Thin strip above the navbar on every page. Internal links (e.g. <code className="bg-accent px-1.5 py-0.5">/course</code>) and
            external links (e.g. <code className="bg-accent px-1.5 py-0.5">https://www.nexrnntechnologies.in</code>) both work — external links open in a new tab.
          </p>

          {/* Live preview */}
          <div className="bg-secondary text-white flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 mb-5 text-center">
            <span className="text-[11px] sm:text-xs font-medium tracking-wide">
              {form.announcementText || 'Your announcement text appears here'}
            </span>
            {form.announcementButtonText && (
              <span className="inline-flex items-center border-2 border-white/70 bg-primary px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wide">
                {form.announcementButtonText}
              </span>
            )}
          </div>

          <div className="space-y-5">
            <div>
              <label className={labelClass}>Announcement Text</label>
              <input className={inputClass} value={form.announcementText} onChange={handleChange('announcementText')} placeholder="e.g. Admissions open for new batches — limited seats!" />
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Button Text</label>
                <input className={inputClass} value={form.announcementButtonText} onChange={handleChange('announcementButtonText')} placeholder="e.g. Contact Us" />
              </div>
              <div>
                <label className={labelClass}>Button Link</label>
                <input className={inputClass} value={form.announcementButtonLink} onChange={handleChange('announcementButtonLink')} placeholder="/Contect-us or https://…" />
              </div>
            </div>
          </div>
        </div>

        <div className="card-base bg-white p-7">
          <h2 className="text-lg text-secondary normal-case mb-2">Payment Success Page</h2>
          <p className="text-xs text-muted normal-case mb-5">
            Shown after a student successfully pays for a course or workshop. Use{' '}
            <code className="bg-accent px-1.5 py-0.5">{'{name}'}</code> and{' '}
            <code className="bg-accent px-1.5 py-0.5">{'{title}'}</code> as placeholders — they&rsquo;ll be replaced
            with the student&rsquo;s name and the course/workshop name.
          </p>
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Heading</label>
              <input className={inputClass} value={form.paymentSuccessHeading} onChange={handleChange('paymentSuccessHeading')} />
            </div>
            <div>
              <label className={labelClass}>Message Body</label>
              <textarea rows={10} className={`${inputClass} resize-none`} value={form.paymentSuccessBody} onChange={handleChange('paymentSuccessBody')} />
            </div>
          </div>
        </div>

        <div className="card-base bg-white p-7">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg text-secondary normal-case">Popup Offers</h2>
            <label className="flex items-center gap-2.5">
              <input type="checkbox" className="w-5 h-5 accent-primary" checked={form.popupEnabled} onChange={handleToggle('popupEnabled')} />
              <span className="text-sm font-semibold text-secondary">Enabled</span>
            </label>
          </div>
          <p className="text-xs text-muted normal-case mb-5">
            Opens automatically 5 seconds after a visitor enters the site, auto-closes after 10 seconds if not closed manually.
          </p>

          <div className="space-y-5">
            <div>
              <label className={labelClass}>Popup Image</label>
              {form.popupImageUrl && (
                <img src={form.popupImageUrl} alt="Current popup" className="w-40 border-2 border-secondary/15 mb-3" />
              )}
              <label className="flex items-center gap-3 border-2 border-dashed border-secondary/25 px-4 py-3 text-sm text-muted cursor-pointer hover:border-primary transition-colors w-fit">
                <UploadCloud size={17} className="text-primary shrink-0" />
                {uploading ? 'Uploading…' : 'Upload popup image'}
                <input type="file" accept="image/*" className="hidden" onChange={handlePopupImageUpload} disabled={uploading} />
              </label>
            </div>
            <div>
              <label className={labelClass}>Popup Link (offer redirection)</label>
              <input className={inputClass} value={form.popupLink} onChange={handleChange('popupLink')} placeholder="https://www.nexrnntechnologies.in/course" />
              <p className="mt-1.5 text-[11px] text-muted normal-case">Where the visitor goes if they click the popup image. Leave blank for a non-clickable image.</p>
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
