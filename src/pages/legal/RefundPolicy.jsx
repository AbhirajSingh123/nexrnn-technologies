import { Helmet } from 'react-helmet-async';
import { SITE } from '@/constants/siteData';

/**
 * Refund & Cancellation Policy (final, live version). Data-driven sections.
 * Sub-points (1.1, 2.1, 3.x) "subs" me hain — chhota heading + content.
 */

const INTRO = [
  'This policy explains, in simple terms, how refunds and cancellations work for courses, workshops, and service projects with NexRNN Technologies ("we", "us", "Company").',
  'By making a payment, enrolling in a course or workshop, or hiring our services, you agree to this policy.',
];

const SECTIONS = [
  {
    title: '1. Course Refunds',
    paras: ['Once you have enrolled in a course and your payment is confirmed, that enrollment is final.'],
    bullets: [
      'We do not offer refunds after this point.',
      'This includes if you change your mind, don\u2019t attend, or don\u2019t finish the course.',
      'Please review all course details, fees, and requirements carefully before paying.',
    ],
    subs: [
      {
        title: '1.1 Paid Twice for the Same Course by Mistake?',
        paras: [
          'If you accidentally paid twice for the same course (due to a technical or banking issue), please tell us within 24\u201348 hours of the payment.',
          'You will need to share your transaction details and payment proof. We will:',
        ],
        bullets: [
          'Review your complaint',
          'Check the payment and enrollment records',
          'Confirm if it really was a duplicate payment',
          'Approve the refund if everything checks out',
        ],
        parasAfter: ['If reported after 24\u201348 hours, we generally cannot process the refund. If approved, refunds are usually processed within 5\u20137 business days.'],
      },
    ],
  },
  {
    title: '2. Workshop Refunds',
    paras: ['Once you have enrolled in a workshop and your payment is confirmed, that enrollment is final.'],
    bullets: [
      'We do not offer refunds after this point.',
      'This includes if you change your mind, can\u2019t attend, or don\u2019t participate.',
      'Please review all workshop details, schedule, and fees before paying.',
    ],
    subs: [
      {
        title: '2.1 Paid Twice for the Same Workshop by Mistake?',
        paras: [
          'The same process applies as for courses: report it within 24\u201348 hours, share your payment proof, and we will verify and process an approved refund within 5\u20137 business days.',
        ],
      },
    ],
  },
  {
    title: '3. Service Project Refunds',
    paras: ['Whether a service payment can be refunded depends on how far along the project is.'],
    subs: [
      {
        title: '3.1 You Paid, But Haven\u2019t Signed the Agreement Yet',
        paras: [
          'If you paid us but have not yet signed the service agreement, and you decide not to go ahead, you can ask for a refund. We will review your request and, if approved, process the refund.',
        ],
      },
      {
        title: '3.2 You\u2019ve Signed the Agreement',
        paras: [
          'Once you have signed the service agreement, your payment generally becomes non-refundable — unless the agreement itself says something different.',
        ],
      },
      {
        title: '3.3 Work Has Been Confirmed or Started',
        paras: [
          'If you have confirmed the work, or we have already started, your payment is generally non-refundable. Cancelling at this stage will not normally qualify for a refund.',
        ],
      },
    ],
  },
  {
    title: '4. How to Ask for a Refund',
    paras: ['To request a refund or report a duplicate payment, please contact us:'],
    bullets: [
      'Email: nexrnntechnologies@gmail.com',
      'Phone: +91 75204 24645',
    ],
    parasAfter: ['For duplicate payments, please contact us within 24\u201348 hours of the payment.', 'Please include:'],
    bulletsAfter: [
      'Your full name',
      'Course, workshop, or service name',
      'Enrollment or project details',
      'Transaction / Payment ID',
      'Date and time of payment',
      'Amount paid',
      'Reason for your refund request',
      'Payment receipt or proof',
    ],
    parasEnd: ['We may ask for more information if needed to verify your request.'],
  },
  {
    title: '5. How We Review Refund Requests',
    paras: ['Sending a refund request does not automatically mean it will be approved. Here\u2019s how we handle it:'],
    bullets: [
      'Step 1 — You submit your request with the required details',
      'Step 2 — We verify the payment and enrollment/service details',
      'Step 3 — We review the request against this policy (and the service agreement, if any)',
      'Step 4 — We let you know the outcome',
      'Step 5 — If approved, we process the refund',
    ],
  },
  {
    title: '6. How Long Refunds Take',
    paras: [
      'If approved, we usually start processing your refund within 5\u20137 business days after it has been reviewed and confirmed. Refunds go back to your original payment method.',
      'How long it takes for the money to actually show up in your account depends on your bank, card issuer, or payment provider — we are not responsible for delays caused by them once we\u2019ve sent the refund.',
    ],
  },
  {
    title: '7. What Is Not Refundable',
    paras: ['Except for the cases listed in this policy, payments are generally non-refundable. This includes:'],
    bullets: [
      'Confirmed course enrollments',
      'Confirmed workshop enrollments',
      'Service payments once the agreement is signed (unless stated otherwise)',
      'Payments for confirmed or started service work',
    ],
    parasAfter: ['Duplicate course or workshop payments may be refunded, but only if reported within 24\u201348 hours and verified.'],
  },
  {
    title: '8. No Automatic Refunds',
    paras: [
      'Sending a refund request doesn\u2019t automatically guarantee you\u2019ll get one. All requests must meet the conditions in this policy (and any signed agreement). We may decline a request if it doesn\u2019t meet these conditions, and we reserve the right to verify all information before approving a refund.',
    ],
  },
  {
    title: '9. Payment or Bank Issues',
    paras: [
      'If money was deducted from your account but your enrollment or payment wasn\u2019t confirmed, please contact us with your transaction details. We will check the payment status and take appropriate action.',
    ],
  },
  {
    title: '10. Changes to This Policy',
    paras: [
      'We may update this Refund & Cancellation Policy from time to time. Updates will be posted on our website with a new "Last Updated" date.',
    ],
  },
  {
    title: '11. Agreement',
    paras: [
      'By making a payment, enrolling in a course or workshop, or confirming a service project, you agree to this Refund & Cancellation Policy. Please review all course, workshop, service, and pricing details carefully before making any payment.',
    ],
  },
  {
    title: '12. Contact Us',
    paras: ['For refund requests, duplicate-payment issues, or questions about this policy, please contact:'],
    bullets: [
      'Email: nexrnntechnologies@gmail.com',
      'Phone: +91 75204 24645',
      'Website: https://www.nexrnntechnologies.in/',
    ],
    parasAfter: ['Please contact us as soon as possible if you notice a duplicate payment or any other payment issue.'],
  },
];

function SubBlock({ sub }) {
  return (
    <div className="mt-4 pl-4 border-l-2 border-secondary/15">
      <h3 className="text-base font-bold text-secondary normal-case mb-2">{sub.title}</h3>
      <div className="text-sm text-muted leading-relaxed normal-case space-y-3">
        {(sub.paras || []).map((p, i) => <p key={i}>{p}</p>)}
        {sub.lead && <p>{sub.lead}</p>}
        {sub.bullets && (
          <ul className="list-disc pl-5 space-y-1.5">
            {sub.bullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        )}
        {(sub.parasAfter || []).map((p, i) => <p key={i}>{p}</p>)}
      </div>
    </div>
  );
}

export default function RefundPolicy() {
  return (
    <>
      <Helmet>
        <title>Refund &amp; Cancellation Policy | {SITE.name}</title>
      </Helmet>

      <section className="bg-accent bg-grid-light pt-32 pb-16">
        <div className="container-section text-center max-w-3xl mx-auto">
          <span className="badge-tag mb-5">Legal</span>
          <h1 className="text-secondary text-4xl sm:text-5xl leading-[1.05] mb-4">Refund &amp; Cancellation Policy</h1>
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
                {s.bulletsAfter && (
                  <ul className="list-disc pl-5 space-y-1.5">
                    {s.bulletsAfter.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                )}
                {(s.parasEnd || []).map((p, i) => <p key={i}>{p}</p>)}
                {(s.subs || []).map((sub) => <SubBlock key={sub.title} sub={sub} />)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
