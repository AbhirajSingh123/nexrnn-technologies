import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { courseEnrollSchema } from '@/utils/validation';
import { submitCourseEnrollment } from '@/data/leadsRepo';
import { createCashfreeOrder } from '@/data/paymentsRepo';
import { startCashfreeCheckout } from '@/utils/cashfreeSdk';
import { trackLead, trackBeginCheckout } from '@/utils/analytics';
import { parseRupeeAmount, formatINR } from '@/utils/format';
import { getStoredReferral } from '@/utils/referral';
import { useCourseEnrollModal } from '@/contexts/CourseEnrollContext';
import Modal from '@/components/shared/Modal';
import PaymentConfirmModal from '@/components/shared/PaymentConfirmModal';
import ConsentCheckbox from '@/components/shared/ConsentCheckbox';

const inputClass =
  'w-full border-2 border-secondary/20 focus:border-primary px-4 py-3 text-sm outline-none transition-colors bg-white';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-2';
const errorClass = 'mt-1.5 text-xs text-primary normal-case';

export default function CourseEnrollModal() {
  const { course, closeCourseEnroll } = useCourseEnrollModal();
  const navigate = useNavigate();
  // Paid flow: form submit -> PAYMENT CONFIRMATION POPUP -> Pay Now -> gateway
  // pendingPay me title/id snapshot rakhte hain (course close hone par null ho jata hai -
  // popup ko us par depend nahi karna, warna crash hota tha)
  const [pendingPay, setPendingPay] = useState(null); // { lead, data, amount, title, id }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(courseEnrollSchema), mode: 'onBlur', defaultValues: { referralCode: getStoredReferral() } });

  const onSubmit = async (data) => {
    try {
      // 1. Save the enrollment record first (gets a unique reference ID).
      const lead = await submitCourseEnrollment({ ...data, course });

      // Lead/form tracking (GA4 + admin dashboard)
      trackLead('course', course.title);

      // 2. Free courses skip the payment gateway entirely — straight to success.
      if (course.isFree) {
        reset();
        closeCourseEnroll();
        navigate('/enrollment-success', {
          state: { name: data.name, itemTitle: course.title, referenceId: lead.referenceId, batchId: lead.batch_id, isFree: true, fee: parseRupeeAmount(course.price) },
        });
        return;
      }

      // 3. Paid courses: PAYMENT CONFIRMATION POPUP dikhao
      //    (fee breakdown + platform fee + promo code + Total Pay -> Pay Now -> gateway)
      const amount = parseRupeeAmount(course.price);
      setPendingPay({ lead, data, amount, title: course.title, id: course.id });
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
        leadType: 'course',
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
      closeCourseEnroll();

      // Checkout tracking - GA4 funnel: view -> begin_checkout -> purchase
      trackBeginCheckout(course.title, amount, 'course');
      await startCashfreeCheckout(paymentSessionId);
    } catch (err) {
      toast.error(err.message || 'Payment could not be started. Please try again.');
    }
  };

  return (
    <>
    <Modal isOpen={Boolean(course)} onClose={closeCourseEnroll} title={course ? `Enroll: ${course.title}` : 'Enroll'}>
      {course && (
        <div className="card-base bg-accent p-5 mb-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-0.5">Course</p>
            <p className="text-sm font-bold text-secondary normal-case">{course.title}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-0.5">Fee</p>
            {course.isFree ? (
              <p className="font-heading text-2xl text-green-600 flex items-center gap-1.5 justify-end">
                <CheckCircle2 size={18} /> FREE
              </p>
            ) : (
              <p className="font-heading text-2xl text-primary">{formatINR(course.price)}</p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div>
          <label htmlFor="ce-name" className={labelClass}>Name</label>
          <input id="ce-name" className={inputClass} {...register('name')} placeholder="Your name" />
          {errors.name && <p className={errorClass}>{errors.name.message}</p>}
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="ce-phone" className={labelClass}>Number</label>
            <input id="ce-phone" className={inputClass} {...register('phone')} placeholder="10-digit number" />
            {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
          </div>
          <div>
            <label htmlFor="ce-email" className={labelClass}>Email</label>
            <input id="ce-email" type="email" className={inputClass} {...register('email')} placeholder="you@email.com" />
            {errors.email && <p className={errorClass}>{errors.email.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="ce-college" className={labelClass}>College (optional)</label>
          <input id="ce-college" className={inputClass} {...register('college')} placeholder="Your college / institution" />
        </div>

        <div>
          <label htmlFor="ce-referral" className={labelClass}>Referral Code (optional)</label>
          <input
            id="ce-referral"
            className={`${inputClass} uppercase`}
            {...register('referralCode')}
            placeholder="Enter referral code if you have one"
          />
        </div>

        <ConsentCheckbox register={register} error={errors.consent} id="course-enroll-consent" />

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-60">
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> {course?.isFree ? 'Submitting…' : 'Preparing payment…'}
            </>
          ) : course?.isFree ? (
            <>
              Complete Free Enrollment <CheckCircle2 size={15} />
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
      kind="course"
      baseAmount={pendingPay?.amount ?? 0}
      itemId={pendingPay?.id || null}
      onPay={handleConfirmPay}
    />
    </>
  );
}
