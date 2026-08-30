import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, Clock, Download, ArrowLeft, XCircle } from 'lucide-react';
import { verifyCashfreePayment } from '@/data/paymentsRepo';
import { downloadApplicationPDF } from '@/data/applicationsRepo';
import { SITE } from '@/constants/siteData';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

/**
 * Career/Internship application payment return page.
 * Cashfree yahan redirect karta hai: /application-payment-status?order_id=...
 * Verify ke baad success screen (Application ID + Download Form).
 */
export default function ApplicationPaymentStatus() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [result, setResult] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) return;

    // Form bharte waqt ka snapshot (PDF download ke liye)
    try {
      const saved = sessionStorage.getItem(`career_app_${orderId}`);
      if (saved) {
        setSnapshot(JSON.parse(saved));
        sessionStorage.removeItem(`career_app_${orderId}`);
      }
    } catch {
      /* ignore */
    }

    verifyCashfreePayment(orderId)
      .then((data) => setResult(data))
      .catch((err) => setError(err.message || 'Could not verify your payment.'));
  }, [orderId]);

  if (!orderId) return <Link to="/careers" replace />;

  const loading = !result && !error;

  return (
    <>
      <Helmet>
        <title>Application Payment Status | {SITE.name}</title>
      </Helmet>

      <div className="pt-32 pb-24 bg-accent min-h-screen">
        <div className="container-section max-w-xl mx-auto">
          {loading && (
            <div className="card-base bg-white p-10 text-center">
              <LoadingSpinner />
              <p className="text-sm text-muted normal-case mt-4">Verifying your payment…</p>
            </div>
          )}

          {error && (
            <div className="card-base bg-white p-8 sm:p-10 text-center">
              <div className="w-16 h-16 bg-red-50 border-2 border-red-200 mx-auto mb-5 flex items-center justify-center">
                <XCircle size={30} className="text-red-500" />
              </div>
              <h1 className="text-2xl text-secondary normal-case mb-3">Couldn&rsquo;t verify payment</h1>
              <p className="text-sm text-muted normal-case mb-6">{error}</p>
              <p className="text-xs text-muted normal-case mb-6">
                If money was deducted, don&rsquo;t worry — contact us with your details and we&rsquo;ll
                confirm it manually.
              </p>
              <Link to="/careers" className="btn-primary inline-flex items-center gap-2">
                <ArrowLeft size={15} /> Back to Careers
              </Link>
            </div>
          )}

          {result && result.leadType === 'career' && (
            <div className="card-base bg-white p-8 sm:p-10 text-center">
              {result.status === 'paid' ? (
                <>
                  <div className="w-16 h-16 bg-green-100 border-2 border-green-300 mx-auto mb-5 flex items-center justify-center">
                    <CheckCircle2 size={32} className="text-green-600" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl text-secondary normal-case mb-3">
                    Application submitted successfully!
                  </h1>
                  <p className="text-sm text-muted normal-case mb-6">
                    Your payment was received and your application is confirmed. Our team will
                    review it and contact you on your email / mobile.
                  </p>

                  <div className="bg-accent border-2 border-primary/30 px-5 py-4 mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">
                      Your Application ID
                    </p>
                    <p className="font-mono font-bold text-primary text-xl break-all">
                      {result.applicationId || snapshot?.applicationId || '—'}
                    </p>
                  </div>

                  {/* Payment summary */}
                  <div className="grid grid-cols-2 gap-3 text-left mb-6">
                    <MiniStat label="Amount Paid" value={`\u20b9${Number(result.amount || 0).toLocaleString('en-IN')}`} />
                    <MiniStat label="Order ID" value={result.orderId || orderId} mono />
                    <MiniStat label="Payment ID" value={result.cfPaymentId || '—'} mono />
                    <MiniStat label="Method" value={result.method || '—'} />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        downloadApplicationPDF({
                          ...snapshot,
                          applicationId: result.applicationId || snapshot?.applicationId,
                          payment: {
                            paymentId: result.cfPaymentId,
                            amount: `\u20b9${Number(result.amount || 0).toLocaleString('en-IN')}`,
                            orderId: result.orderId || orderId,
                            method: result.method || '\u2014',
                          },
                        })
                      }
                      className="btn-primary inline-flex items-center gap-2"
                    >
                      <Download size={15} /> Download Form
                    </button>
                    <Link to="/careers" className="btn-secondary inline-flex items-center gap-2">
                      <ArrowLeft size={15} /> Back to Careers
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-orange-50 border-2 border-orange-200 mx-auto mb-5 flex items-center justify-center">
                    <Clock size={30} className="text-orange-500" />
                  </div>
                  <h1 className="text-2xl text-secondary normal-case mb-3">Payment pending</h1>
                  <p className="text-sm text-muted normal-case mb-6">
                    Your application is saved but the payment is not confirmed yet. If you have
                    completed the payment, it will reflect shortly — or contact us for help.
                  </p>
                  <Link to="/careers" className="btn-primary inline-flex items-center gap-2">
                    <ArrowLeft size={15} /> Back to Careers
                  </Link>
                </>
              )}
            </div>
          )}

          {result && result.leadType !== 'career' && (
            <div className="card-base bg-white p-10 text-center">
              <p className="text-sm text-muted normal-case mb-6">Unknown payment reference.</p>
              <Link to="/careers" className="btn-primary inline-flex items-center gap-2">
                <ArrowLeft size={15} /> Back to Careers
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function MiniStat({ label, value, mono = false }) {
  return (
    <div className="bg-accent border border-secondary/15 px-3.5 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-0.5">{label}</p>
      <p className={`text-sm font-bold text-secondary ${mono ? 'font-mono break-all' : 'normal-case'}`}>
        {value}
      </p>
    </div>
  );
}
