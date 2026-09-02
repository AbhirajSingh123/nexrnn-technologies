/**
 * PAYMENT CONFIRMATION POPUP - gateway se PEHLE dikhta hai.
 * Fee breakdown (base + platform fee) + promo code (Apply) + Total Pay + Pay Now.
 * 3 jagah use hota hai: Course enroll, Workshop register, Job/Internship apply.
 *
 * props:
 *   open          - modal visible?
 *   onClose       - cancel
 *   itemTitle     - "Digital Marketing Course"
 *   kind          - 'course' | 'workshop' | 'career'
 *   baseAmount    - item fee (number)
 *   itemId        - specific item id (promo matching ke liye, optional)
 *   onPay         - async (promoCode) => gateway checkout (final amount edge par banta hai)
 */
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { ShieldCheck, Loader2, X, Tag, BadgePercent } from 'lucide-react';
import { validatePromo } from '@/data/promosRepo';
import { fetchSiteSettings } from '@/data/settingsRepo';
import { formatINR } from '@/utils/format';

const inputClass =
  'w-full border-2 border-secondary/20 focus:border-primary px-3.5 py-2.5 text-sm outline-none transition-colors bg-white normal-case uppercase';

export default function PaymentConfirmModal({ open, onClose, itemTitle, kind, baseAmount, itemId, onPay }) {
  const [settings, setSettings] = useState(null);
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState(null); // {code, discount}
  const [checking, setChecking] = useState(false);
  const [paying, setPaying] = useState(false);

  // Settings (platform fee + promo visibility) modal khulte hi ek baar
  useEffect(() => {
    if (!open) return;
    let active = true;
    fetchSiteSettings().then((s) => {
      if (active) setSettings(s ?? {});
    });
    return () => {
      active = false;
    };
  }, [open]);

  // Modal band hote hi state saaf
  useEffect(() => {
    if (!open) {
      setPromoInput('');
      setPromo(null);
      setChecking(false);
      setPaying(false);
    }
  }, [open]);

  if (!open) return null;

  const platformFeeEnabled = settings?.platformFeeEnabled === true;
  const platformFee = platformFeeEnabled ? Math.max(0, Number(settings?.platformFeeAmount) || 0) : 0;
  const promoBoxEnabled = settings?.promoBoxEnabled !== false; // default show
  const discount = promo?.discount ?? 0;
  const total = Math.max(baseAmount - discount, 0) + platformFee;

  const applyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      toast.error('Enter a promo code first.');
      return;
    }
    setChecking(true);
    try {
      const res = await validatePromo({ code, kind, amount: baseAmount, itemId });
      if (res?.valid) {
        setPromo({ code: res.code, discount: res.discount });
        toast.success(res.message || 'Promo code applied.');
      } else {
        setPromo(null);
        toast.error(res?.message || 'Invalid promo code.');
      }
    } catch {
      setPromo(null);
      toast.error('Could not verify the promo code. Try again.');
    } finally {
      setChecking(false);
    }
  };

  const payNow = async () => {
    setPaying(true);
    try {
      await onPay(promo?.code || '');
    } finally {
      setPaying(false);
    }
  };

  const kindLabel = kind === 'career' ? 'Application Fee' : kind === 'workshop' ? 'Workshop Fee' : 'Course Fee';

  return (
    <div
      className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-secondary/70 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !paying) onClose();
      }}
    >
      <div className="w-full max-w-md bg-white border-2 border-secondary max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between px-5 sm:px-6 pt-5 pb-3 border-b-2 border-secondary/10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-0.5">Confirm Payment</p>
            <h2 className="font-heading text-lg text-secondary normal-case pr-4">{itemTitle}</h2>
          </div>
          <button onClick={() => !paying && onClose()} aria-label="Close" className="text-muted hover:text-secondary">
            <X size={20} />
          </button>
        </div>

        {/* Breakdown */}
        <div className="px-5 sm:px-6 py-5 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted">{kindLabel}</span>
            <span className="font-bold text-secondary">{formatINR(baseAmount)}</span>
          </div>

          {platformFeeEnabled && (
            <div className="flex items-center justify-between">
              <span className="text-muted">Platform Fees</span>
              <span className="font-bold text-secondary">{platformFee > 0 ? formatINR(platformFee) : 'FREE'}</span>
            </div>
          )}

          {discount > 0 && (
            <div className="flex items-center justify-between text-green-700">
              <span className="inline-flex items-center gap-1.5">
                <BadgePercent size={14} /> Promo ({promo.code})
              </span>
              <span className="font-bold">- {formatINR(discount)}</span>
            </div>
          )}

          <div className="border-t-2 border-dashed border-secondary/15 pt-3 flex items-center justify-between">
            <span className="font-bold text-secondary uppercase text-xs tracking-wide">Total Pay</span>
            <span className="font-heading text-2xl text-primary">{formatINR(total)}</span>
          </div>

          {/* Promo code box (admin hide/show kar sakta hai) */}
          {promoBoxEnabled && (
            <div className="pt-2">
              <div className="flex gap-2.5">
                <div className="relative flex-1">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    className={`${inputClass} pl-9`}
                    placeholder="Promo code"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    disabled={checking || paying}
                  />
                </div>
                <button
                  type="button"
                  onClick={applyPromo}
                  disabled={checking || paying || !promoInput.trim()}
                  className="btn-secondary px-4 py-2.5 text-xs inline-flex items-center gap-1.5 disabled:opacity-60"
                >
                  {checking ? <Loader2 size={14} className="animate-spin" /> : <BadgePercent size={14} />} Apply
                </button>
              </div>
              {promo && (
                <p className="text-[11px] text-green-700 normal-case mt-1.5">
                  {promo.code} applied — you save {formatINR(discount)}.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Pay */}
        <div className="px-5 sm:px-6 pb-6">
          <button onClick={payNow} disabled={paying} className="btn-primary w-full disabled:opacity-60">
            {paying ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Starting payment…
              </>
            ) : (
              <>
                <ShieldCheck size={16} /> Pay Now {formatINR(total)}
              </>
            )}
          </button>
          <p className="text-[10px] text-muted text-center normal-case mt-2.5">
            Secure payment via Cashfree — UPI, cards, netbanking supported.
          </p>
        </div>
      </div>
    </div>
  );
}
