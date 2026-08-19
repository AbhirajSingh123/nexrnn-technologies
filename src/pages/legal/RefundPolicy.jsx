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

export default function RefundPolicy() {
  return (
    <>
      <Helmet>
        <title>Refund Policy | {SITE.name}</title>
      </Helmet>

      <section className="bg-accent bg-grid-light pt-32 pb-16">
        <div className="container-section text-center max-w-3xl mx-auto">
          <span className="badge-tag mb-5">Legal</span>
          <h1 className="text-secondary text-4xl sm:text-5xl leading-[1.05] mb-4">Refund Policy</h1>
          <p className="text-muted text-sm normal-case">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}</p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-section max-w-3xl mx-auto">
          <div className="card-base bg-accent border-primary/30 p-5 mb-10">
            <p className="text-xs text-secondary normal-case leading-relaxed">
              <strong>Draft template:</strong> This is a standard refund policy template and has not yet been
              reviewed by a legal professional, and specific refund terms/timelines below are placeholders. Please
              confirm actual policy details and have this reviewed before publishing it as final.
            </p>
          </div>

          <Section title="Course Enrollment Refunds">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>[Placeholder] Refund requests made before course access begins may be eligible for a full or partial refund.</li>
              <li>[Placeholder] Once course materials or live sessions have been accessed, fees may become non-refundable, except where the course was materially not as described.</li>
              <li>Refund eligibility and timelines will be confirmed at the time of enrollment.</li>
            </ul>
          </Section>

          <Section title="Service Engagement Refunds">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>[Placeholder] Advance payments for services (e.g. website development, ad management) cover work already planned or in progress and are generally non-refundable once work has started.</li>
              <li>[Placeholder] Any refund for undelivered work will be assessed on a case-by-case basis and confirmed in writing.</li>
            </ul>
          </Section>

          <Section title="How to Request a Refund">
            <p>
              To request a refund, contact us at{' '}
              <a href={`mailto:${SITE.email}`} className="text-primary font-semibold hover:underline">{SITE.email}</a>{' '}
              or {SITE.phoneDisplay} with your enrollment or engagement details. We will review your request and
              respond with the applicable outcome.
            </p>
          </Section>

          <Section title="Processing Time">
            <p>[Placeholder] Approved refunds are typically processed within a specific number of business days to the original payment method — exact timeline to be confirmed.</p>
          </Section>

          <Section title="Changes to This Policy">
            <p>We may update this policy from time to time. Changes will be posted on this page.</p>
          </Section>
        </div>
      </section>
    </>
  );
}
