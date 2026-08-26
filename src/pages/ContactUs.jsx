import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Loader2, Send, Mail, Phone, MapPin } from 'lucide-react';
import { FaInstagram, FaLinkedinIn, FaFacebookF, FaYoutube } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { SITE, SOCIAL_LINKS, CONSULTATION_SERVICE_OPTIONS } from '@/constants/siteData';
import { contactFormSchema } from '@/utils/validation';
import { submitContactLead } from '@/data/leadsRepo';
import Reveal from '@/components/shared/Reveal';
import ConsentCheckbox from '@/components/shared/ConsentCheckbox';

const inputClass =
  'w-full border-2 border-secondary/20 focus:border-primary px-4 py-3 text-sm outline-none transition-colors bg-white';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-2';
const errorClass = 'mt-1.5 text-xs text-primary normal-case';

export default function ContactUs() {
  const [searchParams] = useSearchParams();
  const isBugReport = searchParams.get('subject') === 'bug-report';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contactFormSchema),
    mode: 'onBlur',
    defaultValues: isBugReport
      ? { service: 'Report a Bug / Website Issue', message: "I'd like to report a bug on the website: " }
      : undefined,
  });

  const onSubmit = async (data) => {
    try {
      await submitContactLead(data);
      toast.success("Thanks for reaching out! We'll get back to you shortly.");
      reset();
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact Us | {SITE.name} — Lucknow</title>
        <meta name="description" content={`Get in touch with ${SITE.name} for digital marketing, website development, or course enquiries in Lucknow.`} />
        <link rel="canonical" href={`${SITE.domain}/Contect-us`} />
      </Helmet>

      <section className="bg-accent bg-grid-light pt-32 pb-16">
        <div className="container-section text-center max-w-3xl mx-auto">
          <span className="badge-tag mb-5">Get In Touch</span>
          <h1 className="text-secondary text-4xl sm:text-5xl md:text-6xl leading-[1.05] mb-5">Contact Us</h1>
          <p className="text-muted text-base leading-relaxed normal-case">
            Have a project, a service enquiry, or a course question? Send us a message and our team will respond soon.
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-section grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-start">
          <Reveal direction="left" className="card-base bg-white p-8">
            <h2 className="text-xl text-secondary normal-case mb-6">Send an Enquiry</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className={labelClass}>Name</label>
                  <input id="name" className={inputClass} {...register('name')} placeholder="Your name" />
                  {errors.name && <p className={errorClass}>{errors.name.message}</p>}
                </div>
                <div>
                  <label htmlFor="phone" className={labelClass}>Phone</label>
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
                <label htmlFor="service" className={labelClass}>Service</label>
                <select id="service" className={inputClass} {...register('service')} defaultValue={isBugReport ? 'Report a Bug / Website Issue' : ''}>
                  <option value="" disabled>Select a service</option>
                  {CONSULTATION_SERVICE_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.service && <p className={errorClass}>{errors.service.message}</p>}
              </div>
              <div>
                <label htmlFor="message" className={labelClass}>Message</label>
                <textarea id="message" rows={4} className={`${inputClass} resize-none`} {...register('message')} placeholder="Tell us about your project or question" />
                {errors.message && <p className={errorClass}>{errors.message.message}</p>}
              </div>

              <ConsentCheckbox register={register} error={errors.consent} id="contact-consent" />

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-60">
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    Send Enquiry <Send size={15} />
                  </>
                )}
              </button>
            </form>
          </Reveal>

          <div className="flex flex-col gap-6">
            <Reveal direction="right" className="card-base bg-white p-8">
              <h2 className="text-xl text-secondary normal-case mb-6">Business Information</h2>
              <div className="space-y-5">
                <a href={`mailto:${SITE.email}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                  <div className="w-12 h-12 bg-primary flex items-center justify-center shrink-0">
                    <Mail size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-0.5">Email</p>
                    <p className="text-sm font-bold text-secondary normal-case">{SITE.email}</p>
                  </div>
                </a>
                <a href={`tel:${SITE.phone}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                  <div className="w-12 h-12 bg-secondary flex items-center justify-center shrink-0">
                    <Phone size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-0.5">Phone</p>
                    <p className="text-sm font-bold text-secondary normal-case">{SITE.phoneDisplay}</p>
                  </div>
                </a>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white border-2 border-secondary flex items-center justify-center shrink-0">
                    <MapPin size={20} className="text-secondary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-0.5">Location</p>
                    <p className="text-sm font-bold text-secondary normal-case">{SITE.address}</p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-secondary/15 my-6" />

              <p className="text-xs font-bold uppercase tracking-widest text-muted mb-4">Follow Us</p>
              <div className="flex items-center gap-3">
                <a href={SOCIAL_LINKS.instagram} aria-label="Instagram" className="w-11 h-11 bg-accent border-2 border-secondary/15 flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                  <FaInstagram size={17} />
                </a>
                <a href={SOCIAL_LINKS.linkedin} aria-label="LinkedIn" className="w-11 h-11 bg-accent border-2 border-secondary/15 flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                  <FaLinkedinIn size={17} />
                </a>
                <a href={SOCIAL_LINKS.facebook} aria-label="Facebook" className="w-11 h-11 bg-accent border-2 border-secondary/15 flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                  <FaFacebookF size={17} />
                </a>
                <a href={SOCIAL_LINKS.youtube} aria-label="YouTube" className="w-11 h-11 bg-accent border-2 border-secondary/15 flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                  <FaYoutube size={17} />
                </a>
              </div>
            </Reveal>

            <Reveal direction="right" delay={0.1} className="card-base overflow-hidden h-56">
              <iframe
                title="Business location"
                src={`https://www.google.com/maps?q=${encodeURIComponent(SITE.address)}&output=embed`}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
