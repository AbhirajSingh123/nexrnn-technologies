import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Loader2, CreditCard } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { formatDateTimeWithDay } from '@/utils/formatDateTime';
import Modal from '@/components/shared/Modal';

const inputClass = 'w-full border-2 border-secondary/20 focus:border-primary px-3 py-2.5 text-sm outline-none transition-colors bg-white';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-1.5';

const ENROLLMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'on_call', label: 'On Call' },
  { value: 'enrolled', label: 'Enrolled' },
  { value: 'payment_received', label: 'Payment Received' },
  { value: 'declined', label: 'Declined' },
];

const PAYMENT_STATUS_STYLES = {
  created: 'bg-accent text-secondary border-secondary/30',
  pending: 'bg-blue-50 text-blue-700 border-blue-300',
  paid: 'bg-green-50 text-green-700 border-green-300',
  failed: 'bg-red-50 text-primary border-primary/30',
  expired: 'bg-red-50 text-primary border-primary/30',
};

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-secondary normal-case">{value || '—'}</p>
    </div>
  );
}

// table: 'leads_course' | 'leads_workshop'
// titleField: 'course_title' | 'workshop_title'
// paymentFkColumn: 'lead_course_id' | 'lead_workshop_id'
export default function AdminEnrollmentModal({ enrollment, table, titleField, paymentFkColumn, itemLabel, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    if (enrollment) {
      setForm({
        batch_id: enrollment.batch_id ?? '',
        enrollment_status: enrollment.enrollment_status ?? 'pending',
        call_status: enrollment.call_status ?? 'undone',
        email_status: enrollment.email_status ?? 'not_sent',
        payment_status: enrollment.payment_status ?? 'unpaid',
        admin_notes: enrollment.admin_notes ?? '',
      });

      setLoadingPayments(true);
      supabase
        .from('payments')
        .select('*')
        .eq(paymentFkColumn, enrollment.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setPayments(data ?? []);
          setLoadingPayments(false);
        });
    } else {
      setPayments([]);
    }
  }, [enrollment, paymentFkColumn]);

  if (!enrollment || !form) return null;

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from(table).update(form).eq('id', enrollment.id);
    setSaving(false);
    if (error) {
      toast.error(error.message || 'Failed to save.');
      return;
    }
    toast.success('Enrollment updated.');
    onSaved();
  };

  return (
    <Modal isOpen={Boolean(enrollment)} onClose={onClose} title="Manage Enrollment">
      <div className="grid sm:grid-cols-2 gap-4 mb-6 pb-6 border-b-2 border-secondary/10">
        <InfoRow label="Student Name" value={enrollment.name} />
        <InfoRow label={itemLabel} value={enrollment[titleField]} />
        <InfoRow label="Email" value={enrollment.email} />
        <InfoRow label="WhatsApp / Mobile" value={enrollment.phone} />
        <InfoRow label="College" value={enrollment.college} />
        <InfoRow label="Price" value={enrollment.price} />
        <InfoRow label="Enrollment Date" value={formatDateTimeWithDay(enrollment.created_at)} />
        <InfoRow label="Last Updated" value={enrollment.updated_at ? formatDateTimeWithDay(enrollment.updated_at) : '—'} />
      </div>

      <div className="mb-6 pb-6 border-b-2 border-secondary/10">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-secondary mb-3">
          <CreditCard size={14} className="text-primary" /> Payment Attempts (Cashfree)
        </p>
        {loadingPayments ? (
          <p className="text-xs text-muted normal-case">Loading…</p>
        ) : payments.length === 0 ? (
          <p className="text-xs text-muted normal-case">No payment attempt yet for this enrollment.</p>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="border-2 border-secondary/10 p-3 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs font-semibold text-secondary normal-case">{p.cashfree_order_id}</p>
                  <p className="text-[11px] text-muted normal-case">
                    ₹{p.amount} · {p.payment_method || 'method unknown'} · {formatDateTimeWithDay(p.created_at)}
                  </p>
                  {p.cf_payment_id && (
                    <p className="text-[11px] text-muted normal-case">Cashfree Payment ID: {p.cf_payment_id}</p>
                  )}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 border-2 whitespace-nowrap ${PAYMENT_STATUS_STYLES[p.status] ?? PAYMENT_STATUS_STYLES.created}`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className={labelClass}>Batch ID</label>
          <input
            className={inputClass}
            value={form.batch_id}
            onChange={handleChange('batch_id')}
            placeholder="e.g. BATCH-2026-001"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Enrollment Status</label>
            <select className={inputClass} value={form.enrollment_status} onChange={handleChange('enrollment_status')}>
              {ENROLLMENT_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Payment Status</label>
            <select className={inputClass} value={form.payment_status} onChange={handleChange('payment_status')}>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Call Status</label>
            <select className={inputClass} value={form.call_status} onChange={handleChange('call_status')}>
              <option value="undone">Undone</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Email Status</label>
            <select className={inputClass} value={form.email_status} onChange={handleChange('email_status')}>
              <option value="not_sent">Not Sent</option>
              <option value="sent">Sent</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Admin Notes</label>
          <textarea
            rows={4}
            className={`${inputClass} resize-none`}
            value={form.admin_notes}
            onChange={handleChange('admin_notes')}
            placeholder="Internal notes about this enrollment…"
          />
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full disabled:opacity-60">
          {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : 'Save Changes'}
        </button>
      </div>
    </Modal>
  );
}
