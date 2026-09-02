import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';

// supabase.functions.invoke() only puts a generic "non-2xx status" message on
// `error.message` for failed calls — the actual JSON error body our edge
// functions return has to be read separately from `error.context` (a Response).
async function extractFunctionErrorMessage(error, fallback) {
  try {
    if (error?.context && typeof error.context.json === 'function') {
      const body = await error.context.json();
      if (body?.error) return body.error;
    }
  } catch {
    // context wasn't valid JSON — fall through to the generic message below.
  }
  return error?.message || fallback;
}

// leadType: 'course' | 'workshop'
export async function createCashfreeOrder({ leadId, leadType, amount, customerName, customerEmail, customerPhone, itemTitle, promoCode, itemId }) {
  if (!isSupabaseConfigured) {
    throw new Error('Payment backend is not configured yet. Please contact us directly to enroll.');
  }
  const { data, error } = await supabase.functions.invoke('create-cashfree-order', {
    body: { leadId, leadType, amount, customerName, customerEmail, customerPhone, itemTitle, promoCode: promoCode || '', itemId: itemId || null },
  });
  if (error) throw new Error(await extractFunctionErrorMessage(error, 'Failed to start payment. Please try again.'));
  if (data?.error) throw new Error(data.error);
  if (!data?.paymentSessionId) {
    // Never hand an empty/undefined session to Cashfree's checkout — that's
    // what produces the confusing "payment_session_id is not present" error
    // on Cashfree's own page instead of a clear message on ours.
    throw new Error('Payment could not be started (no session returned by the payment gateway). Please try again.');
  }
  return data; // { orderId, paymentSessionId }
}

export async function verifyCashfreePayment(orderId) {
  if (!isSupabaseConfigured) {
    throw new Error('Payment backend is not configured yet.');
  }
  const { data, error } = await supabase.functions.invoke('verify-cashfree-payment', {
    body: { orderId },
  });
  if (error) throw new Error(await extractFunctionErrorMessage(error, 'Failed to verify payment.'));
  if (data?.error) throw new Error(data.error);
  return data; // { status, orderId, leadType, itemTitle, studentName, whatsappGroupLink }
}

/* ----------------------------------------------------------------------------
 * ADMIN PAYMENT SLIP (PDF, dynamic jspdf - rule: jspdf hamesha dynamic import)
 * Payment ki full receipt: item fee, promo code + discount, platform fees,
 * total pay, order/payment IDs. Withdrawal slip jaisa hi certificate-style
 * frame (double blue border + official logo + digital note + website URL).
 * ------------------------------------------------------------------------- */
const BRAND_BLUE = { r: 29, g: 111, b: 224 };

let slipLogoCache = null;
async function getSlipLogoDataUrl() {
  if (slipLogoCache) return slipLogoCache;
  try {
    const res = await fetch('/nexrnn-logo.png');
    const blob = await res.blob();
    slipLogoCache = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    slipLogoCache = null;
  }
  return slipLogoCache;
}

// jsPDF ke standard fonts me ₹ render nahi hota - PDF me hamesha 'Rs. '
function slipRs(n) {
  return `Rs. ${(Number(n) || 0).toLocaleString('en-IN')}`;
}

function slipNoRupee(t) {
  return String(t ?? '').replace(/\u20B9/g, 'Rs. ');
}

function slipDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return slipNoRupee(dateStr);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function slipGridRow(doc, y, W, M, label, value) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(130, 140, 160);
  doc.text(label, M + 40, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 40, 60);
  const lines = doc.splitTextToSize(slipNoRupee(value) || '-', W - M * 2 - 200);
  doc.text(lines, W - M - 40, y, { align: 'right' });
  doc.setDrawColor(225, 230, 240);
  doc.setLineWidth(0.5);
  doc.line(M + 40, y + 10, W - M - 40, y + 10);
  return y + 12 + (lines.length - 1) * 12 + 14;
}

/**
 * Payment Slip download (Admin Payments).
 * p = { orderId, cfPaymentId, status, amount, baseAmount, discountAmount,
 *       promoCode, platformFee, createdAt, itemName, itemTypeLabel,
 *       referenceId, studentName, email, phone }
 * amount = Total Pay (base - discount + platform fee); purane rows me
 * base_amount nahi hota to Item Fee = amount dikhta hai.
 */
export async function downloadPaymentSlipPDF(p) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const W = 595;
  const H = 842;
  const M = 46;
  const cx = W / 2;

  // Double blue border + logo
  doc.setDrawColor(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b);
  doc.setLineWidth(1.4);
  doc.rect(M, M, W - M * 2, H - M * 2);
  doc.setLineWidth(0.5);
  doc.rect(M + 7, M + 7, W - M * 2 - 14, H - M * 2 - 14);

  const logoUrl = await getSlipLogoDataUrl();
  if (logoUrl) {
    doc.addImage(logoUrl, 'PNG', cx - 60, 54, 120, 120);
  }

  let y = logoUrl ? 54 + 120 + 26 : 120;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(110, 120, 140);
  doc.text('PAYMENT SLIP — RECEIVED', cx, y, { align: 'center' });
  y += 20;
  doc.setDrawColor(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b);
  doc.setLineWidth(1);
  doc.line(cx - 52, y, cx + 52, y);
  y += 24;

  // Order ID + status
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(30, 40, 60);
  doc.text(slipNoRupee(p.orderId) || '-', cx, y, { align: 'center' });
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(110, 120, 140);
  doc.text(`Status: ${p.status || 'Created'}`, cx, y, { align: 'center' });
  y += 20;

  // Total Pay bada (blue)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b);
  doc.text(slipRs(p.amount), cx, y, { align: 'center' });
  y += 24;

  // Details grid - full payment info
  y = slipGridRow(doc, y, W, M, 'Payment For', p.itemName || '-');
  y = slipGridRow(doc, y, W, M, 'Payment Type', p.itemTypeLabel || '-');
  y = slipGridRow(doc, y, W, M, 'Student Name', p.studentName || '-');
  y = slipGridRow(doc, y, W, M, 'Email', p.email || '-');
  y = slipGridRow(doc, y, W, M, 'Number', p.phone || '-');
  y = slipGridRow(doc, y, W, M, 'Reference ID', p.referenceId || '-');

  // Fee breakdown (naye payments me base_amount hota hai, purane me nahi)
  const baseAmount = p.baseAmount != null ? p.baseAmount : p.amount;
  y = slipGridRow(doc, y, W, M, 'Item Fee', slipRs(baseAmount));
  y = slipGridRow(doc, y, W, M, 'Promo Code', p.promoCode || '-');
  y = slipGridRow(doc, y, W, M, 'Promo Discount', p.discountAmount ? `- ${slipRs(p.discountAmount)}` : '-');
  y = slipGridRow(doc, y, W, M, 'Platform Fees', p.platformFee ? slipRs(p.platformFee) : '-');
  y = slipGridRow(doc, y, W, M, 'Total Pay', slipRs(p.amount));
  y = slipGridRow(doc, y, W, M, 'Payment Method', p.paymentMethod || '-');
  y = slipGridRow(doc, y, W, M, 'Cashfree Payment ID', p.cfPaymentId || '-');
  y = slipGridRow(doc, y, W, M, 'Payment Date', slipDateTime(p.createdAt));

  // Signature block + digital note (3 lines) + website URL
  y += 16; // mentor withdrawal slip jaisa hi gap
  if (y > H - 190) y = H - 190;
  doc.setDrawColor(150, 158, 175);
  doc.setLineWidth(0.8);
  doc.line(W - 210, y, W - 60, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90, 100, 120);
  doc.text('Authorised Signatory', W - 135, y + 14, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('NexRNN Technologies', W - 135, y + 27, { align: 'center' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(130, 140, 160);
  doc.text('This is a digitally / system generated document.', W - 135, y + 48, { align: 'center' });
  doc.text('No physical signature is needed on this', W - 135, y + 61, { align: 'center' });
  doc.text('document.', W - 135, y + 74, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(150, 158, 175);
  doc.text(`Issued on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, M + 14, H - 60);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b);
  doc.text('https://www.nexrnntechnologies.in/', W - M - 14, H - 60, { align: 'right' });

  const safeOrder = String(p.orderId || 'payment').replace(/[^A-Za-z0-9_-]/g, '');
  doc.save(`PaymentSlip-${safeOrder}.pdf`);
}
