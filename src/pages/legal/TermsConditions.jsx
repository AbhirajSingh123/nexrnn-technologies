import { Helmet } from 'react-helmet-async';
import { SITE } from '@/constants/siteData';

/**
 * Terms & Conditions (final, live version). Data-driven sections.
 */

const INTRO = [
  'These Terms & Conditions ("Terms") explain the rules for using the NexRNN Technologies website (https://www.nexrnntechnologies.in/) and for using our courses, workshops, digital marketing services, and technology services.',
  'By visiting our website, enrolling in a course or workshop, making a payment, or hiring us, you agree to these Terms. If you do not agree, please do not use our website, courses, workshops, or services.',
];

const SECTIONS = [
  {
    title: '1. About Us',
    paras: ['NexRNN Technologies offers:'],
    bullets: [
      'Website design and development',
      'Web and software development',
      'Digital marketing, including SEO and online advertising',
      'Professional courses, workshops, and training',
      'Other technology and digital services',
    ],
    parasAfter: ['The services, courses, and workshops we offer may change from time to time.'],
  },
  {
    title: '2. Using Our Website',
    paras: ['Please use our website fairly and legally. You must not:'],
    bullets: [
      'Use the website for anything illegal or fraudulent',
      'Try to break into our systems or accounts without permission',
      'Interfere with the website\u2019s security or performance',
      'Copy or reuse our website content commercially without our written permission',
      'Do anything that could overload, damage, or disable our website',
    ],
    parasAfter: ['We may limit or stop your access if we believe you have broken these Terms.'],
  },
  {
    title: '3. Our Services',
    paras: [
      'For paid service work (like website or marketing projects), we will discuss and confirm with you the scope of work, deliverables, fees, payment schedule, timeline, and other details — usually through a proposal, quotation, or written agreement. The actual work will follow whatever is agreed or confirmed in writing.',
    ],
  },
  {
    title: '4. Service Agreements',
    paras: ['For some projects, we may ask you to sign a formal service agreement before starting work. Once signed:'],
    bullets: [
      'The agreement sets out the scope, fees, deliverables, timeline, and payment terms',
      'Both sides are expected to follow it',
      'If it conflicts with these Terms, the signed agreement will generally apply',
      'Extra work outside the agreed scope may cost more and take extra time',
    ],
    parasAfter: ['We usually begin work once the required approvals, information, and payments are in place.'],
  },
  {
    title: '5. Course Enrollment',
    paras: [
      'Course pages on our website may show the duration, curriculum, fees, format, eligibility, and certificate details. This information may be updated from time to time, and the final details will be confirmed when you enroll.',
      'Once your enrollment and payment are confirmed, your enrollment is considered final, subject to our Refund & Cancellation Policy.',
    ],
  },
  {
    title: '6. Workshop Enrollment',
    paras: [
      'Workshop details (schedule, duration, topics, fees, and format) will be shared on our website or directly with you before you enroll. By enrolling and paying, you agree to follow the workshop\u2019s rules. Enrollment is subject to our Refund & Cancellation Policy.',
    ],
  },
  {
    title: '7. Access to Course & Workshop Content',
    paras: ['We will give you access to course or workshop materials based on the specific program you joined. Please do not:'],
    bullets: [
      'Share your paid account with others',
      'Distribute course materials without our permission',
      'Record, copy, resell, or redistribute our content',
      'Share your login details with anyone else',
    ],
    parasAfter: ['If you break these rules, we may suspend or end your access without a refund.'],
  },
  {
    title: '8. Certificates',
    paras: [
      'If a course or workshop offers a certificate, you will receive it only after meeting the completion requirements (such as attendance, assignments, or assessments). Simply enrolling or paying does not automatically guarantee a certificate.',
    ],
  },
  {
    title: '9. Payments',
    paras: [
      'Fees for courses, workshops, and services will be shown on our website or shared with you through a quotation, proposal, or invoice. You are responsible for paying according to the agreed terms. For services, payments may be split into milestones or require an advance. For courses and workshops, your enrollment is confirmed only after your payment is successfully completed.',
    ],
  },
  {
    title: '10. Refunds and Cancellations',
    paras: ['Refunds are handled under our Refund & Cancellation Policy. In short:'],
    bullets: [
      'Successful course enrollments are non-refundable',
      'Successful workshop enrollments are non-refundable',
      'If you accidentally pay twice for the same course or workshop, you may get a refund if you report it within 24\u201348 hours and it is verified',
      'For services, a refund may be possible if you paid but have not yet signed the service agreement and decide not to continue',
      'Once a service agreement is signed, payments are generally non-refundable unless the agreement says otherwise',
      'Payments for confirmed or started service work are generally non-refundable',
    ],
    parasAfter: ['Please read the full Refund & Cancellation Policy before making a payment.'],
  },
  {
    title: '11. Your Responsibilities (For Service Clients)',
    paras: ['If you hire us for a project, you agree to:'],
    bullets: [
      'Give us accurate and complete information',
      'Share the content and materials we need, on time',
      'Provide any website, hosting, domain, or account access we need',
      'Review and approve our work in a timely manner',
      'Clearly tell us your requirements and any changes',
      'Make sure any materials you give us do not violate anyone else\u2019s rights',
    ],
    parasAfter: ['Delays on your side (like late approvals or missing content) may delay the project.'],
  },
  {
    title: '12. Changes to Project Scope',
    paras: [
      'If you ask for work outside what was originally agreed, we will treat it as additional work, which may mean extra fees and a longer timeline. We will let you know the extra cost and time before we start that work.',
    ],
  },
  {
    title: '13. Who Owns the Work',
    paras: [
      'Unless we agree otherwise in writing, ownership of the final deliverables (like a completed website) usually passes to you after you have paid in full, subject to the agreement.',
      'However, we always keep ownership of our own:',
    ],
    bullets: [
      'Pre-existing tools, templates, and frameworks',
      'Internal processes and methods',
      'Reusable code, libraries, and components',
    ],
    parasAfter: ['Any third-party software, plugins, stock images, fonts, or APIs used in your project remain governed by their own licenses.'],
  },
  {
    title: '14. Content You Give Us',
    paras: [
      'You are responsible for making sure any content, images, videos, text, logos, or data you give us can legally be used for your project. You confirm that you have the right to share these materials. We are not responsible for problems caused by content you provide without proper rights.',
    ],
  },
  {
    title: '15. Marketing Results',
    paras: [
      'We aim to provide good, professional digital marketing services. However, results depend on many things outside our control — like market conditions, competition, advertising budgets, and changes to platforms like Google or Meta. So, we cannot guarantee specific rankings, leads, sales, or traffic, unless we have clearly promised this in a separate written agreement.',
    ],
  },
  {
    title: '16. Third-Party Platforms',
    paras: [
      'Some of our services depend on outside platforms — like hosting providers, payment gateways, or advertising platforms. We are not responsible for problems, changes, or outages caused by these third-party services.',
    ],
  },
  {
    title: '17. Website Accuracy',
    paras: [
      'We try to keep our website accurate and up to date, but it may sometimes contain errors or outdated information. We may correct, update, or remove content, pricing, or details at any time without prior notice.',
    ],
  },
  {
    title: '18. Website Availability',
    paras: [
      'We try to keep our website running smoothly, but we cannot guarantee it will always be available or error-free. It may occasionally be down for maintenance, technical issues, or reasons beyond our control.',
    ],
  },
  {
    title: '19. Limitation of Liability',
    paras: [
      'To the extent allowed by law, NexRNN Technologies will not be responsible for indirect losses arising from your use of our website, courses, workshops, or services — such as loss of profits, business opportunities, or data. This does not affect any rights that cannot legally be limited.',
    ],
  },
  {
    title: '20. Suspension or Termination',
    paras: [
      'We may suspend or end your access to a course, workshop, service, or account if you break these Terms — for example, through fraud, misuse, unauthorized sharing of content, or non-payment.',
    ],
  },
  {
    title: '21. Privacy',
    paras: [
      'Using our website and services involves collecting some personal information, which is handled according to our Privacy Policy. Please review it to understand how we handle your information.',
    ],
  },
  {
    title: '22. Changes to These Terms',
    paras: [
      'We may update these Terms from time to time. Updates will be posted on our website with a new "Last Updated" date. If you keep using our website or services after an update, it means you accept the revised Terms.',
    ],
  },
  {
    title: '23. Governing Law',
    paras: [
      'These Terms are governed by the laws of India. Any disputes will be handled according to Indian law and the terms of any specific written agreement between us.',
    ],
  },
  {
    title: '24. If a Part of These Terms Doesn\u2019t Apply',
    paras: [
      'If any part of these Terms is found to be invalid or unenforceable, the rest of the Terms will still apply.',
    ],
  },
  {
    title: '25. Full Agreement',
    paras: [
      'These Terms, along with any related policies, quotations, proposals, invoices, or signed agreements, form the complete understanding between you and NexRNN Technologies for the relevant service.',
    ],
  },
  {
    title: '26. Contact Us',
    paras: ['If you have questions about these Terms, please contact us:'],
    bullets: [
      'Email: nexrnntechnologies@gmail.com',
      'Phone: +91 75204 24645',
      'Website: https://www.nexrnntechnologies.in/',
    ],
    parasAfter: ['We recommend contacting us for any clarification before making a payment or starting a project.'],
  },
];

export default function TermsConditions() {
  return (
    <>
      <Helmet>
        <title>Terms &amp; Conditions | {SITE.name}</title>
      </Helmet>

      <section className="bg-accent bg-grid-light pt-32 pb-16">
        <div className="container-section text-center max-w-3xl mx-auto">
          <span className="badge-tag mb-5">Legal</span>
          <h1 className="text-secondary text-4xl sm:text-5xl leading-[1.05] mb-4">Terms &amp; Conditions</h1>
          <p className="text-muted text-sm normal-case">Last Updated: August 30, 2026</p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-section max-w-3xl mx-auto">
          {INTRO.map((p, i) => (
            <p key={i} className="text-sm text-muted leading-relaxed normal-case mb-4">{p}</p>
          ))}

          {SECTIONS.map((s) => (
            <div key={s.title} className="mb-8">
              <h2 className="text-xl text-secondary normal-case mb-3">{s.title}</h2>
              <div className="text-sm text-muted leading-relaxed normal-case space-y-3">
                {(s.paras || []).map((p, i) => <p key={i}>{p}</p>)}
                {s.lead && <p>{s.lead}</p>}
                {s.bullets && (
                  <ul className="list-disc pl-5 space-y-1.5">
                    {s.bullets.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                )}
                {(s.parasAfter || []).map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
