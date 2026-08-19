import { Helmet } from 'react-helmet-async';
import { SITE } from '@/constants/siteData';

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="text-xl text-secondary normal-case mb-3">{title}</h2>
      <div className="text-sm text-muted leading-relaxed normal-case space-y-3">{children}</div>
    </div>
  );
}

export default function TermsConditions() {
  return (
    <>
      <Helmet>
        <title>Terms & Conditions | {SITE.name}</title>
      </Helmet>

      <section className="bg-accent bg-grid-light pt-32 pb-16">
        <div className="container-section text-center max-w-3xl mx-auto">
          <span className="badge-tag mb-5">Legal</span>
          <h1 className="text-secondary text-4xl sm:text-5xl leading-[1.05] mb-4">Terms &amp; Conditions</h1>
          <p className="text-muted text-sm normal-case">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}</p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-section max-w-3xl mx-auto">
          <div className="card-base bg-accent border-primary/30 p-5 mb-10">
            <p className="text-xs text-secondary normal-case leading-relaxed">
              <strong>Draft template:</strong> This is a standard terms template and has not yet been reviewed by a
              legal professional. Please have it reviewed before relying on it as your official terms.
            </p>
          </div>

          <Section title="Acceptance of Terms">
            <p>
              By accessing {SITE.domain} or engaging {SITE.name} for services or courses, you agree to these Terms
              &amp; Conditions. If you do not agree, please do not use our website or services.
            </p>
          </Section>

          <Section title="Services">
            <p>
              {SITE.name} provides digital marketing, technology and website development services, along with
              professional courses. The specific scope, deliverables, and timeline for any engagement will be
              confirmed directly with you before work begins.
            </p>
          </Section>

          <Section title="Course Enrollment">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Course details (duration, curriculum, fees) shown on this website are indicative and confirmed at the time of enrollment.</li>
              <li>Access to course materials and mentorship is provided as described for the specific course you enroll in.</li>
              <li>Certificates are issued upon successful completion of course requirements.</li>
            </ul>
          </Section>

          <Section title="Payments">
            <p>
              Fees for services or courses will be communicated and agreed upon before work begins or enrollment is
              confirmed. Payment terms will be shared as part of your specific agreement with us.
            </p>
          </Section>

          <Section title="Client Responsibilities">
            <p>
              For service engagements, timely delivery depends on you providing necessary access, content, approvals
              and information as requested.
            </p>
          </Section>

          <Section title="Intellectual Property">
            <p>
              Unless otherwise agreed in writing, final deliverables (such as a completed website) transfer to the
              client upon full payment. Our internal processes, templates, and pre-existing tools remain our property.
            </p>
          </Section>

          <Section title="Limitation of Liability">
            <p>
              We aim to deliver quality work and results-driven marketing, but outcomes such as ad performance,
              search rankings, or lead volume depend on many factors outside our direct control (market conditions,
              competition, platform policies, budget, etc.) and cannot be guaranteed.
            </p>
          </Section>

          <Section title="Changes to These Terms">
            <p>We may update these terms from time to time. Continued use of our website or services after changes constitutes acceptance of the updated terms.</p>
          </Section>

          <Section title="Contact Us">
            <p>
              Questions about these terms can be sent to{' '}
              <a href={`mailto:${SITE.email}`} className="text-primary font-semibold hover:underline">{SITE.email}</a>{' '}
              or {SITE.phoneDisplay}.
            </p>
          </Section>
        </div>
      </section>
    </>
  );
}
