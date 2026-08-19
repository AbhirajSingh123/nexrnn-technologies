import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'react-toastify';
import { leadFormSchema } from '@/utils/validation';
import { CONSULTATION_SERVICE_OPTIONS } from '@/constants/siteData';
import { submitContactLead } from '@/data/leadsRepo';
import ConsentCheckbox from '@/components/shared/ConsentCheckbox';

const inputClass =
  'w-full border-2 border-secondary/20 focus:border-primary px-4 py-3 text-sm outline-none transition-colors bg-white';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-2';
const errorClass = 'mt-1.5 text-xs text-primary normal-case';

export default function LeadForm({ title = 'Get Free Consultation', ctaLabel = 'Get Free Consultation' }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(leadFormSchema), mode: 'onBlur' });

  const onSubmit = async (data) => {
    try {
      await submitContactLead(data);
      toast.success("Thanks! We've received your details and will reach out shortly.");
      reset();
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="card-base bg-white p-7 sm:p-9">
      {title && <h3 className="text-2xl text-secondary mb-6 normal-case">{title}</h3>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="name" className={labelClass}>Name</label>
            <input id="name" className={inputClass} {...register('name')} placeholder="Your name" />
            {errors.name && <p className={errorClass}>{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>Phone Number</label>
            <input id="phone" className={inputClass} {...register('phone')} placeholder="10-digit number" />
            {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>Email</label>
          <input id="email" type="email" className={inputClass} {...register('email')} placeholder="you@email.com" />
          {errors.email && <p className={errorClass}>{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="service" className={labelClass}>Service Required</label>
          <select id="service" className={inputClass} {...register('service')} defaultValue="">
            <option value="" disabled>Select a service</option>
            {CONSULTATION_SERVICE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.service && <p className={errorClass}>{errors.service.message}</p>}
        </div>

        <div>
          <label htmlFor="message" className={labelClass}>Message (optional)</label>
          <textarea
            id="message"
            rows={3}
            className={`${inputClass} resize-none`}
            {...register('message')}
            placeholder="Tell us a bit about what you need"
          />
          {errors.message && <p className={errorClass}>{errors.message.message}</p>}
        </div>

        <ConsentCheckbox register={register} error={errors.consent} id="lead-consent" />

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-60">
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Sending…
            </>
          ) : (
            <>
              {ctaLabel} <Send size={15} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
