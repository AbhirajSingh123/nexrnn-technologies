import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { courseEnrollSchema } from '@/utils/validation';
import { getStoredReferral } from '@/utils/referral';
import { submitWorkshopEnrollment } from '@/data/leadsRepo';
import { createCashfreeOrder } from '@/data/paymentsRepo';
import { startCashfreeCheckout } from '@/utils/cashfreeSdk';
import { trackLead, trackBeginCheckout } from '@/utils/analytics';
import { parseRupeeAmount, formatINR } from '@/utils/format';
import { useWorkshopEnrollModal } from '@/contexts/WorkshopEnrollContext';
import { isRegistrationClosed } from '@/utils/workshopUtils';
import Modal from '@/components/shared/Modal';
import PaymentConfirmModal from '@/components/shared/PaymentConfirmModal';
import ConsentCheckbox from '@/components/shared/ConsentCheckbox';

const inputClass =
  'w-full border-2 border-secondary/20 focus:border-primary px-4 py-3 text-sm outline-none transition-colors bg-white';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-2';
const errorClass = 'mt-1.5 text-xs text-primary normal-case';

export default function WorkshopEnrollModal() {
  const { workshop, closeWorkshopEnroll } = useWorkshopEnrollModal();
  const navigate = useNavigate();
  // Paid flow: form submit -> PAYMENT CONFIRMATION POPUP -> Pay Now -> gateway
  const [pendingPay, setPendingPay] = useState(null);

  // DEADLINE GUARD: registration deadline cross ho to submit bilkul nahi hoga
  const regClosed = workshop ? isRegistrationClosed(workshop) : false;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(courseEnrollSchema), mode: 'onBlur', defaultValues: { referralCode: getStoredReferral() } });

  const onSubmit = async (data) => {
    try {
      const lead = await submitWorkshopEnrollment({ ...data, workshop });

      // Lead/form tracking
      trackLead('workshop', workshop.title);

      if (workshop.isFree) {
        reset();
        closeWorkshopEnroll();
        navigate('/enrollment-success', {
          state: { name: data.name, itemTitle: workshop.title, referenceId: lead.referenceId, batchId: lead.batch_id, isFree: true, fee: parseRupeeAmount(workshop.price) },
        });
        return;
      }

      const amount = parseRupeeAmount(workshop.price);
      setPendingPay({ lead, data, amount, title: workshop.title, id: workshop.id });
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    }
  };

  // Pay Now (popup se): order banao aur Cashfree par le jao
  const handleConfirmPay = async (promoCode) => {
    if (!pendingPay) return;
    const { lead, data, amount } = pendingPay;
    try {
      const { paymentSessionId } = await createCashfreeOrder({
        leadId: lead.id,
        leadType: 'workshop',
        amount,
        customerName: data.name,
        customerEmail: data.email,
        customerPhone: data.phone,
        itemTitle: pendingPay.title,
        promoCode,
        itemId: pendingPay.id,
      });

      reset();
      setPendingPay(null);
      closeWorkshopEnroll();

      // Checkout tracking
      trackBeginCheckout(workshop.title, amount, 'workshop');
      await startCashfreeCheckout(paymentSessionId);
    } catch (err) {
      toast.error(err.message || 'Payment could not be started. Please try again.');
    }
  };

  // Deadline cross -> sirf "Completed" message dikhao, form open hi na ho
  if (regClosed) {
    return (
      <Modal isOpen={Boolean(workshop)} onClose={closeWorkshopEnroll} title={workshop ? `Register: ${workshop.title}` : 'Register'}>
        <div className="text-center py-8">
          <p className="text-lg font-bold text-secondary mb-2">Workshop Completed</p>
          <p className="text-sm text-muted normal-case">
            The registration deadline for this workshop has passed. New registrations are no longer accepted.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <>
    <Modal isOpen={Boolean(workshop)} onClose={closeWorkshopEnroll} title={workshop ? `Register: ${workshop.title}` : 'Register'}>
      {workshop && (
        <div className="card-base bg-accent p-5 mb-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-0.5">Workshop</p>
            <p className="text-sm font-bold text-secondary normal-case">{workshop.title}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-0.5">Fee</p>
            {workshop.isFree ? (
              <p className="font-heading text-2xl text-green-600 flex items-center gap-1.5 justify-end">
                <CheckCircle2 size={18} /> FREE
              </p>
            ) : (
              <p className="font-heading text-2xl text-primary">{formatINR(workshop.price)}</p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div>
          <label htmlFor="we-name" className={labelClass}>Name</label>
          <input id="we-name" className={inputClass} {...register('name')} placeholder="Your name" />
          {errors.name && <p className={errorClass}>{errors.name.message}</p>}
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="we-phone" className={labelClass}>Number</label>
            <input id="we-phone" className={inputClass} {...register('phone')} placeholder="10-digit number" />
            {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
          </div>
          <div>
            <label htmlFor="we-email" className={labelClass}>Email</label>
            <input id="we-email" type="email" className={inputClass} {...register('email')} placeholder="you@email.com" />
            {errors.email && <p className={errorClass}>{errors.email.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="we-college" className={labelClass}>College (optional)</label>
          <input id="we-college" className={inputClass} {...register('college')} placeholder="Your college / institution" />
        </div>

        <div>
          <label htmlFor="we-referral" className={labelClass}>Referral Code (optional)</label>
          <input
            id="we-referral"
            className={`${inputClass} uppercase`}
            {...register('referralCode')}
            placeholder="Enter referral code if you have one"
          />
        </div>

        <ConsentCheckbox register={register} error={errors.consent} id="workshop-enroll-consent" />

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-60">
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> {workshop?.isFree ? 'Submitting…' : 'Preparing payment…'}
            </>
          ) : workshop?.isFree ? (
            <>
              Complete Free Registration <CheckCircle2 size={15} />
            </>
          ) : (
            <>
              Proceed to Payment <CreditCard size={15} />
            </>
          )}
        </button>
      </form>
    </Modal>

    {/* Payment confirmation popup (gateway se pehle) - Modal se bahar, null-safe props */}
    <PaymentConfirmModal
      open={Boolean(pendingPay)}
      onClose={() => setPendingPay(null)}
      itemTitle={pendingPay?.title || ''}
      kind="workshop"
      baseAmount={pendingPay?.amount ?? 0}
      itemId={pendingPay?.id || null}
      onPay={handleConfirmPay}
    />
    </>
  );
}
