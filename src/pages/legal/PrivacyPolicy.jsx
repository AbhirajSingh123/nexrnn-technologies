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

export default function PrivacyPolicy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | {SITE.name}</title>
      </Helmet>

      <section className="bg-accent bg-grid-light pt-32 pb-16">
        <div className="container-section text-center max-w-3xl mx-auto">
          <span className="badge-tag mb-5">Legal</span>
          <h1 className="text-secondary text-4xl sm:text-5xl leading-[1.05] mb-4">Privacy Policy</h1>
          <p className="text-muted text-sm normal-case">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}</p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-section max-w-3xl mx-auto">
          <div className="card-base bg-accent border-primary/30 p-5 mb-10">
            <p className="text-xs text-secondary normal-case leading-relaxed">
              <strong>Draft template:</strong> This is a standard privacy policy template and has not yet been
              reviewed by a legal professional. Please have it reviewed before relying on it as your official policy.
            </p>
          </div>

          <Section title="Introduction">
            <p>
              {SITE.name} ("we", "us", "our") respects your privacy. This policy explains what information we
              collect through {SITE.domain}, how we use it, and the choices you have.
            </p>
          </Section>

          <Section title="Information We Collect">
            <p>We may collect the following information when you interact with our website:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Contact details you submit through our forms (name, phone number, email address)</li>
              <li>Details about the service or course you enquire about</li>
              <li>Any message or information you voluntarily share with us</li>
              <li>Basic technical data such as browser type and pages visited, for website functionality</li>
            </ul>
          </Section>

          <Section title="How We Use Your Information">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To respond to your enquiries about our services or courses</li>
              <li>To provide the services or training you have requested</li>
              <li>To communicate updates related to your enquiry, project, or enrollment</li>
              <li>To improve our website and offerings</li>
            </ul>
          </Section>

          <Section title="Information Sharing">
            <p>
              We do not sell your personal information. We do not share your information with third parties except
              where necessary to provide a service you requested, or where required by law.
            </p>
          </Section>

          <Section title="Data Security">
            <p>
              We take reasonable steps to protect the information you share with us. However, no method of
              transmission over the internet is completely secure, and we cannot guarantee absolute security.
            </p>
          </Section>

          <Section title="Your Choices">
            <p>
              You may contact us at any time to ask what information we hold about you, request a correction, or
              ask us to delete it, subject to any legal or operational requirements to retain certain records.
            </p>
          </Section>

          <Section title="Changes to This Policy">
            <p>We may update this policy from time to time. Changes will be posted on this page.</p>
          </Section>

          <Section title="Contact Us">
            <p>
              If you have questions about this policy, contact us at{' '}
              <a href={`mailto:${SITE.email}`} className="text-primary font-semibold hover:underline">{SITE.email}</a>{' '}
              or {SITE.phoneDisplay}.
            </p>
          </Section>
        </div>
      </section>
    </>
  );
}
