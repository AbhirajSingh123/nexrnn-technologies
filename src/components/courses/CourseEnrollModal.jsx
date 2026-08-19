import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Loader2, Send, QrCode } from 'lucide-react';
import { toast } from 'react-toastify';
import { courseEnrollSchema } from '@/utils/validation';
import { submitCourseEnrollment } from '@/data/leadsRepo';
import { useCourseEnrollModal } from '@/contexts/CourseEnrollContext';
import Modal from '@/components/shared/Modal';
import ConsentCheckbox from '@/components/shared/ConsentCheckbox';

const inputClass =
  'w-full border-2 border-secondary/20 focus:border-primary px-4 py-3 text-sm outline-none transition-colors bg-white';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-2';
const errorClass = 'mt-1.5 text-xs text-primary normal-case';

export default function CourseEnrollModal() {
  const { course, closeCourseEnroll } = useCourseEnrollModal();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(courseEnrollSchema), mode: 'onBlur' });

  const onSubmit = async (data) => {
    try {
      await submitCourseEnrollment({ ...data, course });
      reset();
      closeCourseEnroll();
      navigate('/enrollment-success', {
        state: { name: data.name, courseTitle: course.title },
      });
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <Modal isOpen={Boolean(course)} onClose={closeCourseEnroll} title={course ? `Enroll: ${course.title}` : 'Enroll'}>
      {course && (
        <div className="card-base bg-accent p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-0.5">Course</p>
              <p className="text-sm font-bold text-secondary normal-case">{course.title}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-0.5">Fee</p>
              <p className="font-heading text-2xl text-primary">{course.price}</p>
            </div>
          </div>

          {course.qrCodeUrl ? (
            <div className="flex flex-col items-center bg-white border-2 border-secondary/15 p-4">
              <img src={course.qrCodeUrl} alt="Payment QR code" className="w-40 h-40 object-contain mb-2" />
              <p className="text-[11px] text-muted normal-case">Scan to pay, then enter the reference number below</p>
            </div>
          ) : (
            <div className="flex flex-col items-center bg-white border-2 border-dashed border-secondary/20 p-6">
              <QrCode size={28} className="text-secondary/30 mb-2" />
              <p className="text-xs text-muted normal-case text-center">
                Payment QR code coming soon — our team will share payment details after you submit this form.
              </p>
            </div>
          )}
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
          <label htmlFor="ce-ref" className={labelClass}>Payment Reference Number (optional)</label>
          <input id="ce-ref" className={inputClass} {...register('paymentRefNo')} placeholder="UPI / transaction reference no." />
          <p className="mt-1.5 text-[11px] text-muted normal-case">
            Already paid via the QR code above? Enter the reference number so we can confirm faster.
          </p>
        </div>

        <ConsentCheckbox register={register} error={errors.consent} id="course-enroll-consent" />

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-60">
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Sending…
            </>
          ) : (
            <>
              Submit Enrollment <Send size={15} />
            </>
          )}
        </button>
      </form>
    </Modal>
  );
}
