import { Helmet } from 'react-helmet-async';
import { SITE } from '@/constants/siteData';

/**
 * Privacy Policy (final, live version).
 * Data-driven: SECTIONS render loop me — naya section add karna ho to array me daalo.
 */

const INTRO = [
  'At NexRNN Technologies ("we", "us", "our", "Company"), we respect your privacy. This policy explains, in simple words, what information we collect from you, why we collect it, and how we look after it.',
  'This applies when you visit our website (https://www.nexrnntechnologies.in/), enroll in a course or workshop, send us an enquiry, or hire us for a service.',
  'By using our website or giving us your information, you agree to this policy.',
];

const SECTIONS = [
  {
    title: '1. What Information We Collect',
    paras: ['We may collect the following types of information, depending on how you use our website or services:'],
    bullets: [
      'Your name, email address, and phone number',
      'Your company name (if any)',
      'Your address or location, if needed for a service',
      'Details of the course, workshop, or service you are interested in',
      'Anything you type into our contact or enquiry forms',
      'Payment and transaction details (like transaction ID, amount, and date — not your full card or bank details)',
      'Attendance, assessment, or certificate details, if you join a course or workshop',
      'Project details, business information, and access you give us while we work on your project',
      'Basic technical details when you visit our website, such as browser type, device type, IP address, and pages viewed',
    ],
  },
  {
    title: '2. How We Collect Your Information',
    paras: ['We usually get your information when you:'],
    bullets: [
      'Visit our website',
      'Fill out a contact or enquiry form',
      'Call or email us',
      'Enroll in a course or workshop',
      'Pay us or hire us for a service',
      'Talk to our team during a project',
    ],
  },
  {
    title: '3. How We Use Your Information',
    paras: ['We use your information to:'],
    bullets: [
      'Reply to your questions and enquiries',
      'Provide the course, workshop, or service you signed up for',
      'Confirm your enrollment and process payments',
      'Send you updates about your course, workshop, or project',
      'Issue certificates, where applicable',
      'Give you customer support',
      'Improve our website and services',
      'Keep our website safe and working properly',
      'Follow the law where required',
    ],
    parasAfter: ['We only use your information for reasons connected to how you interact with us.'],
  },
  {
    title: '4. How We Contact You',
    paras: ['If you enquire, enroll, or hire us, we may contact you about:'],
    bullets: [
      'Your enquiry or enrollment',
      'Payments',
      'Project updates',
      'Important changes or notices',
      'Support',
    ],
    parasAfter: [
      'We may also send helpful or promotional messages where the law allows it. If you don\u2019t want promotional messages, just let us know and we will stop sending them.',
    ],
  },
  {
    title: '5. Payments',
    paras: [
      'Payments are usually processed through trusted third-party payment gateways. We do not normally store your full card or bank details ourselves — the payment provider handles that safely.',
      'We do keep basic transaction records (like transaction ID, amount paid, and date) for accounting, support, and refund purposes.',
    ],
  },
  {
    title: '6. Do We Share Your Information?',
    paras: ['We do not sell or rent your personal information to anyone.'],
    parasAfter: [],
    bullets: [
      'Payment gateways, to process your payment',
      'Hosting and technology providers, to run our website and services',
      'Professional advisors (like accountants or lawyers), when needed',
      'Government or law-enforcement authorities, if required by law',
      'Anyone else you clearly give us permission to share with',
    ],
    lead: 'We may share it only when reasonably necessary, such as with:',
  },
  {
    title: '7. Cookies',
    paras: [
      'Our website may use cookies (small files stored on your device) to help it work properly, stay secure, and understand how visitors use it. You can turn off cookies in your browser settings, but some website features may not work as well if you do.',
    ],
  },
  {
    title: '8. Other Websites',
    paras: [
      'Our website may link to other websites. We are not responsible for how those websites handle your information. Please check their own privacy policies before sharing your details with them.',
    ],
  },
  {
    title: '9. Keeping Your Information Safe',
    paras: [
      'We take reasonable steps to protect your information from misuse, loss, or unauthorized access. However, no method of sending or storing information online is 100% secure, so we cannot promise complete security.',
      'Please also keep any login details we give you private and secure.',
    ],
  },
  {
    title: '10. How Long We Keep Your Information',
    paras: [
      'We keep your information only as long as we reasonably need it — for example, to provide our services, keep business records, handle disputes, or follow legal and tax requirements. After that, we delete or securely dispose of it.',
    ],
  },
  {
    title: '11. Your Choices and Rights',
    paras: ['You can contact us to:'],
    bullets: [
      'Ask if we hold any information about you',
      'Ask for a copy of that information',
      'Ask us to correct wrong or incomplete information',
      'Ask us to delete your information, where possible',
      'Ask questions about how we use your information',
      'Opt out of promotional messages',
    ],
    parasAfter: ['Some information may need to be kept for legal, accounting, or business reasons even after your request.'],
  },
  {
    title: '12. Children\u2019s Privacy',
    paras: [
      'Our website and services are not meant for children where the law does not allow us to collect their information. If you believe a child has given us personal information without proper permission, please contact us and we will look into it.',
    ],
  },
  {
    title: '13. Important Service Communications',
    paras: [
      'Some messages — such as those about payments, enrollments, projects, or policy changes — are necessary for us to provide our services. We may still send these even if you opt out of promotional messages.',
    ],
  },
  {
    title: '14. Accuracy of Information You Give Us',
    paras: [
      'Please make sure the information you give us is correct, and that you have the right to share it (for example, if you are sharing someone else\u2019s details or business content).',
    ],
  },
  {
    title: '15. Changes to This Policy',
    paras: [
      'We may update this Privacy Policy from time to time. Any changes will be posted on our website with a new "Last Updated" date. Please check back occasionally to stay informed.',
    ],
  },
  {
    title: '16. Contact Us',
    paras: ['If you have any questions about this Privacy Policy or how we handle your information, please reach out:'],
    bullets: [
      'Email: nexrnntechnologies@gmail.com',
      'Phone: +91 75204 24645',
      'Website: https://www.nexrnntechnologies.in/',
    ],
  },
  {
    title: '17. Agreement',
    paras: [
      'By using our website, giving us your information, enrolling in a course or workshop, or hiring our services, you agree to this Privacy Policy. If you do not agree, please stop using our website and services.',
    ],
  },
];

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
