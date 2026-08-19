import { useLocation, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, Mail } from 'lucide-react';
import { SITE } from '@/constants/siteData';

export default function EnrollmentSuccess() {
  const location = useLocation();
  const { name, courseTitle } = location.state ?? {};

  // If someone lands here directly (no submission just happened), send them back.
  if (!name || !courseTitle) return <Navigate to="/course" replace />;

  return (
    <>
      <Helmet>
        <title>Enrollment Submitted | {SITE.name}</title>
      </Helmet>

      <section className="min-h-screen flex items-center justify-center bg-accent bg-grid-light px-4 py-24">
        <div className="card-base bg-white max-w-xl w-full p-8 sm:p-10 text-center">
          <div className="w-16 h-16 bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-primary" />
          </div>

          <h1 className="text-2xl sm:text-3xl text-secondary mb-6">Enrollment Submitted!</h1>

          <div className="text-left text-sm text-secondary/85 leading-relaxed normal-case space-y-4">
            <p>Dear {name},</p>
            <p>
              Your enrollment request for <strong className="text-primary">{courseTitle}</strong> has been submitted
              successfully.
            </p>
            <p>
              Thank you for choosing NexRNN Technologies. Our team will review and verify the details you provided.
              Once your enrollment is verified, we will contact you with the next steps, including information about
              your live classes and course materials.
            </p>
            <p>
              If you have any questions, please contact us at{' '}
              <a href="mailto:nexrnntechnology@gmail.com" className="text-primary font-semibold hover:underline inline-flex items-center gap-1">
                <Mail size={13} /> nexrnntechnology@gmail.com
              </a>
              .
            </p>
            <p className="font-semibold text-secondary">Congratulations, and welcome to NexRNN Technologies!</p>
            <p>You will receive a confirmation and welcome email after successful verification of your enrollment details.</p>
            <p>— Team NexRNN Technologies</p>
          </div>

          <Link to="/" className="btn-primary mt-8 min-w-[200px]">
            Back to Home
          </Link>
        </div>
      </section>
    </>
  );
}
