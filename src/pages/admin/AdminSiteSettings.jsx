import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';
import { fetchSiteSettings, updateSiteSettings } from '@/data/settingsRepo';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const inputClass = 'w-full border-2 border-secondary/20 focus:border-primary px-4 py-2.5 text-sm outline-none transition-colors bg-white';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-2';

export default function AdminSiteSettings() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSiteSettings().then((data) => {
      setForm(data);
      setLoading(false);
    });
  }, []);

  if (loading || !form) return <LoadingSpinner className="min-h-[40vh]" />;

  const handleToggle = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.checked }));
  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

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

        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
