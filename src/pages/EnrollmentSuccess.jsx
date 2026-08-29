import { useEffect, useRef } from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, Mail, MessageCircle } from 'lucide-react';
import { SITE } from '@/constants/siteData';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { trackEnrollmentSuccess } from '@/utils/analytics';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

function renderTemplate(template, { name, title }) {
  return template.replace(/{name}/g, name || 'Student').replace(/{title}/g, title || 'the program');
}

export default function EnrollmentSuccess() {
  const location = useLocation();
  const { name, itemTitle, whatsappGroupLink, referenceId } = location.state ?? {};
  const { settings, loading } = useSiteSettings();
  const trackedRef = useRef(false);

  // Enrollment success tracking (ek hi baar fire ho)
  useEffect(() => {
    if (!trackedRef.current && itemTitle) {
      trackedRef.current = true;
      trackEnrollmentSuccess(itemTitle);
    }
  }, [itemTitle]);

  // If someone lands here directly (no submission just happened), send them back.
  if (!name || !itemTitle) return <Navigate to="/course" replace />;

  if (loading) return <LoadingSpinner className="min-h-screen" />;

  const bodyLines = renderTemplate(settings.paymentSuccessBody, { name, title: itemTitle }).split('\n');

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

          <h1 className="text-2xl sm:text-3xl text-secondary mb-6">{settings.paymentSuccessHeading}</h1>

          {referenceId && (
            <div className="card-base bg-accent border-primary/30 px-6 py-4 mb-8 inline-block">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Your Reference ID</p>
              <p className="font-heading text-xl text-primary tracking-wide">{referenceId}</p>
              <p className="text-[11px] text-muted normal-case mt-1">Please save this for any future queries.</p>
            </div>
          )}

          <div className="text-left text-sm text-secondary/85 leading-relaxed normal-case space-y-3 mb-8">
            {bodyLines.map((line, i) => (
              <p key={i}>{line || '\u00a0'}</p>
            ))}
          </div>

          {whatsappGroupLink && (
            <a
              href={whatsappGroupLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full mb-4 bg-[#25D366] hover:bg-secondary"
            >
              <MessageCircle size={16} /> Join WhatsApp Group
            </a>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={`mailto:${SITE.email}`} className="btn-secondary">
              <Mail size={15} /> Email Us
            </a>
            <Link to="/" className="btn-primary">
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
