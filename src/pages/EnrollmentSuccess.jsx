import { useEffect, useRef, useState } from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, Mail, MessageCircle, Download } from 'lucide-react';
import { SITE } from '@/constants/siteData';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { trackEnrollmentSuccess } from '@/utils/analytics';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { parseRupeeAmount } from '@/utils/format';

function renderTemplate(template, { name, title }) {
  return template.replace(/{name}/g, name || 'Student').replace(/{title}/g, title || 'the program');
}

// Enrollment receipt PDF download (browser mein hi banta hai)
async function downloadEnrollmentPDF({ name, itemTitle, referenceId, batchId, fee, isFree }) {
  // jspdf sirf download ke waqt load hota hai (bundle chhota rakhne ke liye)
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  // Header band
  doc.setFillColor(11, 18, 32);
  doc.rect(0, 0, 595, 90, 'F');
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 90, 595, 6, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('NexRNN Technologies', 40, 45);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Enrollment Confirmation Receipt', 40, 68);

  // Body
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Successfully Enrolled!', 40, 140);

  const rows = [
    ['Student Name', name || '-'],
    ['Program', itemTitle || '-'],
    ['Batch ID', batchId || 'Will be shared soon'],
    ['Fees', fee != null ? `\u20B9${Number(fee).toLocaleString('en-IN')}` : '\u20B90'],
    ['Payment Type', isFree ? 'Free' : 'Paid'],
    ['Reference No.', referenceId || '-'],
    ['Date', new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
  ];

  let y = 180;
  rows.forEach(([label, value]) => {
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.rect(40, y - 18, 515, 34, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), 56, y + 3);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(String(value), 250, y + 3);
    y += 44;
  });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(40, y + 10, 555, y + 10);

  // Contact / Need Help section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Need Help?', 40, y + 34);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text('For any queries regarding your enrollment, please contact us.', 40, y + 52);

  // Contact Us -> website contact page (clickable)
  doc.setTextColor(37, 99, 235);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.textWithLink('Contact Us', 40, y + 74, { url: 'https://www.nexrnntechnologies.in/Contect-us' });

  // Email (clickable mailto)
  doc.textWithLink('Email: nexrnntechnologies@gmail.com', 130, y + 74, {
    url: 'mailto:nexrnntechnologies@gmail.com',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.textWithLink('Website: www.nexrnntechnologies.in', 40, y + 94, {
    url: 'https://www.nexrnntechnologies.in/',
  });

  doc.save(`NexRNN-Enrollment-${referenceId || 'Receipt'}.pdf`);
}

export default function EnrollmentSuccess() {
  const location = useLocation();
  const { name, itemTitle, whatsappGroupLink, referenceId, batchId, batchIdFallback, isFree: stateIsFree, fee: stateFee } = location.state ?? {};
  const [catalogFee, setCatalogFee] = useState(null);
  const [catalogBatchId, setCatalogBatchId] = useState(null);

  // Fee fallback: agar state mein fee nahi mili (paid flow) to catalog se
  // course/workshop ki configured price laao (admin panel se hi aati hai)
  useEffect(() => {
    if (stateIsFree === true || stateFee != null || !itemTitle) return;
    let alive = true;
    Promise.allSettled([import('@/data/coursesRepo').then((m) => m.fetchCourses()), import('@/data/workshopsRepo').then((m) => m.fetchWorkshops())])
      .then(([c, w]) => {
        if (!alive) return;
        const all = [...(c.status === 'fulfilled' ? c.value : []), ...(w.status === 'fulfilled' ? w.value : [])];
        // Batch ID course/workshop ki STATIC property hai - catalog se direct milti hai
        const match = all.find((x) => x.title === itemTitle);
        if (match) {
          setCatalogFee(parseRupeeAmount(match.price));
          setCatalogBatchId(match.batchId || null);
        }
      });
    return () => {
      alive = false;
    };
  }, [itemTitle, stateIsFree, stateFee]);
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

  // Fees & payment type (Free = \u20B90 + gateway skip, Paid = configured fee)
  const isFree = stateIsFree === true;
  const rawFee = isFree ? 0 : Number(stateFee ?? catalogFee ?? 0);
  const fee = Number.isNaN(rawFee) ? 0 : rawFee;

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
            <div className="card-base bg-accent border-primary/30 px-6 py-4 mb-4 inline-block">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Your Reference ID</p>
              <p className="font-heading text-xl text-primary tracking-wide">{referenceId}</p>
              <p className="text-[11px] text-muted normal-case mt-1">Please save this for any future queries.</p>
            </div>
          )}

          {/* Batch ID - batch-specific unique ID */}
          <div className="mb-8">
            <div className="card-base bg-secondary text-white px-6 py-4 inline-block border-b-4 border-primary">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">Your Batch ID</p>
              <p className="font-mono font-bold text-xl">{batchId || batchIdFallback || catalogBatchId || 'Will be shared soon'}</p>
              <p className="text-[11px] text-white/50 normal-case mt-1">
                This is your unique batch ID. All classes and updates related to your batch
                will be shared through this ID.
              </p>
            </div>
          </div>

          {/* PDF Receipt Download */}
          <div className="mb-8">
            <button
              onClick={() => downloadEnrollmentPDF({ name, itemTitle, referenceId, batchId: batchId || batchIdFallback || catalogBatchId, fee, isFree })}
              className="btn-secondary w-full inline-flex items-center justify-center gap-2"
            >
              <Download size={16} /> Download Receipt (PDF)
            </button>
          </div>

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
