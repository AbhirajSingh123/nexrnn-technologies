import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'react-toastify';
import { serviceLeadSchema } from '@/utils/validation';
import { submitServiceLead } from '@/data/leadsRepo';
import { useServiceLeadModal } from '@/contexts/ServiceLeadContext';
import Modal from '@/components/shared/Modal';
import ConsentCheckbox from '@/components/shared/ConsentCheckbox';

const inputClass =
  'w-full border-2 border-secondary/20 focus:border-primary px-4 py-3 text-sm outline-none transition-colors bg-white';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-2';
const errorClass = 'mt-1.5 text-xs text-primary normal-case';

export default function ServiceLeadModal() {
  const { service, closeServiceLead } = useServiceLeadModal();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(serviceLeadSchema), mode: 'onBlur' });

  const onSubmit = async (data) => {
    try {
      await submitServiceLead({ ...data, service });
      toast.success("Thanks! We've received your enquiry and will reach out shortly.");
      reset();
      closeServiceLead();
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <Modal isOpen={Boolean(service)} onClose={closeServiceLead} title={service ? `Buy ${service.title}` : 'Buy Service'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div>
          <label htmlFor="sl-name" className={labelClass}>Name</label>
          <input id="sl-name" className={inputClass} {...register('name')} placeholder="Your name" />
          {errors.name && <p className={errorClass}>{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="sl-company" className={labelClass}>Company Name (optional)</label>
          <input id="sl-company" className={inputClass} {...register('companyName')} placeholder="Your company" />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="sl-city" className={labelClass}>City</label>
            <input id="sl-city" className={inputClass} {...register('city')} placeholder="Your city" />
            {errors.city && <p className={errorClass}>{errors.city.message}</p>}
          </div>
          <div>
            <label htmlFor="sl-phone" className={labelClass}>Number</label>
            <input id="sl-phone" className={inputClass} {...register('phone')} placeholder="10-digit number" />
            {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="sl-email" className={labelClass}>Email</label>
          <input id="sl-email" type="email" className={inputClass} {...register('email')} placeholder="you@email.com" />
          {errors.email && <p className={errorClass}>{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="sl-message" className={labelClass}>Message (optional)</label>
          <textarea id="sl-message" rows={3} className={`${inputClass} resize-none`} {...register('message')} placeholder="Anything specific we should know?" />
        </div>

        <ConsentCheckbox register={register} error={errors.consent} id="service-lead-consent" />

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-60">
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Sending…
            </>
          ) : (
            <>
              Submit <Send size={15} />
            </>
          )}
        </button>
      </form>
    </Modal>
  );
}
