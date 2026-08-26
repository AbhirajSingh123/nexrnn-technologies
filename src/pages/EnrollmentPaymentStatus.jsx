import { useEffect, useState } from 'react';
import { useSearchParams, Navigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { XCircle, Clock, Phone, Mail } from 'lucide-react';
import { verifyCashfreePayment } from '@/data/paymentsRepo';
import { SITE } from '@/constants/siteData';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function EnrollmentPaymentStatus() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) return;
    verifyCashfreePayment(orderId)
      .then(setResult)
      .catch((err) => setError(err.message || 'Could not verify your payment.'));
  }, [orderId]);

  if (!orderId) return <Navigate to="/course" replace />;

  if (error) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-accent bg-grid-light px-4 py-24">
        <div className="card-base bg-white max-w-lg w-full p-8 sm:p-10 text-center">
          <div className="w-16 h-16 bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <XCircle size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl text-secondary mb-3">Couldn&rsquo;t Verify Payment</h1>
          <p className="text-sm text-muted normal-case leading-relaxed mb-6">{error}</p>
          <p className="text-xs text-muted normal-case mb-6">
            If money was deducted, don&rsquo;t worry — contact us with your details and we&rsquo;ll confirm it manually.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={`tel:${SITE.phone}`} className="btn-secondary"><Phone size={15} /> {SITE.phoneDisplay}</a>
            <a href={`mailto:${SITE.email}`} className="btn-secondary"><Mail size={15} /> Email Us</a>
          </div>
        </div>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="min-h-screen flex flex-col items-center justify-center bg-accent bg-grid-light px-4">
        <LoadingSpinner />
        <p className="text-sm text-muted normal-case mt-4">Verifying your payment…</p>
      </section>
    );
  }

  if (result.status === 'paid') {
    return (
      <Navigate
        to="/enrollment-success"
        replace
        state={{
          name: result.studentName,
          itemTitle: result.itemTitle,
          leadType: result.leadType,
          whatsappGroupLink: result.whatsappGroupLink,
          referenceId: result.referenceId,
        }}
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>Payment {result.status === 'failed' ? 'Failed' : 'Pending'} | {SITE.name}</title>
      </Helmet>
      <section className="min-h-screen flex items-center justify-center bg-accent bg-grid-light px-4 py-24">
        <div className="card-base bg-white max-w-lg w-full p-8 sm:p-10 text-center">
          <div className="w-16 h-16 bg-primary/10 flex items-center justify-center mx-auto mb-6">
            {result.status === 'failed' ? (
              <XCircle size={32} className="text-primary" />
            ) : (
              <Clock size={32} className="text-primary" />
            )}
          </div>
          <h1 className="text-2xl text-secondary mb-3">
            {result.status === 'failed' ? 'Payment Not Completed' : 'Payment Pending'}
          </h1>
          <p className="text-sm text-muted normal-case leading-relaxed mb-8">
            {result.status === 'failed'
              ? 'Your payment could not be completed. No amount has been charged. You can try enrolling again.'
              : "We haven't received confirmation of your payment yet. If you completed the payment, it may still be processing — please check back in a few minutes or contact us."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/course" className="btn-primary">Back to Courses</Link>
            <a href={`tel:${SITE.phone}`} className="btn-secondary"><Phone size={15} /> {SITE.phoneDisplay}</a>
          </div>
        </div>
      </section>
    </>
  );
}
