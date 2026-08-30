import { Phone, Mail, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SITE } from '@/constants/siteData';
import Reveal from '@/components/shared/Reveal';
import SectionHeading from '@/components/shared/SectionHeading';
import LeadForm from '@/components/shared/LeadForm';

export default function CTALeadSection() {
  return (
    <section id="contact-lead" className="section-padding bg-white">
      <div className="container-section">
        <SectionHeading
          badge="Let's Talk"
          title="Ready to Grow Your Business?"
          description="Tell us what you need and our team will get back to you shortly."
        />

        <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto items-start">
          <Reveal direction="left" className="card-base bg-secondary text-white p-8 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-2xl normal-case mb-4">Talk to Our Team</h3>
              <p className="text-sm text-white/70 normal-case leading-relaxed mb-8">
                Whether it&rsquo;s a digital marketing service, a website project, or a course enquiry —
                reach out directly and we&rsquo;ll respond as soon as we can.
              </p>
            </div>
            <div className="space-y-4">
              <a href={`tel:${SITE.phone}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                <div className="w-10 h-10 bg-primary flex items-center justify-center shrink-0">
                  <Phone size={16} />
                </div>
                <span className="text-sm font-semibold">{SITE.phoneDisplay}</span>
              </a>
              <a href={`mailto:${SITE.email}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                <div className="w-10 h-10 bg-primary flex items-center justify-center shrink-0">
                  <Mail size={16} />
                </div>
                <span className="text-sm font-semibold normal-case">{SITE.email}</span>
              </a>
            </div>
          </Reveal>

          <Reveal direction="right" delay={0.1}>
            <LeadForm />
          </Reveal>
        </div>

        {/* Explore Workshops - main page bottom band */}
        <Reveal delay={0.15}>
          <div className="max-w-4xl mx-auto mt-10 card-base bg-secondary text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5 border-b-4 border-primary">
            <div className="text-center sm:text-left">
              <h3 className="text-xl sm:text-2xl mb-1">Want hands-on learning?</h3>
              <p className="text-sm text-white/70 normal-case">
                Join our live workshops — practical skills with direct mentor interaction.
              </p>
            </div>
            <Link to="/workshop" className="btn-primary !py-3 !px-7 inline-flex items-center gap-2 shrink-0">
              <CalendarDays size={17} /> Explore Workshops
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
