/**
 * Sales member documents (PDF, dynamic jspdf - rule: jspdf hamesha dynamic import):
 *  1. downloadSalesOfferLetterPDF - Offer Letter (sales team join)
 *  2. downloadSalesProfilePDF     - Full profile sheet (saari details)
 * Style mentor documents jaisa hi hai: double blue border + official logo +
 * digital-note + website URL. PDF me hamesha 'Rs.' (₹ kabhi nahi).
 */
const BRAND_BLUE = { r: 29, g: 111, b: 224 };

let salesLogoCache = null;
async function getSalesLogoDataUrl() {
  if (salesLogoCache) return salesLogoCache;
  try {
    const res = await fetch('/nexrnn-logo.png');
    const blob = await res.blob();
    salesLogoCache = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    salesLogoCache = null;
  }
  return salesLogoCache;
}

function salesFmtDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function salesGridRow(doc, y, W, M, label, value) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(130, 140, 160);
  doc.text(label, M + 40, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 40, 60);
  const lines = doc.splitTextToSize(String(value ?? '') || '-', W - M * 2 - 200);
  doc.text(lines, W - M - 40, y, { align: 'right' });
  doc.setDrawColor(225, 230, 240);
  doc.setLineWidth(0.5);
  doc.line(M + 40, y + 10, W - M - 40, y + 10);
  return y + 12 + (lines.length - 1) * 12 + 14;
}

function salesDrawSignAndFooter(doc, W, H, M, y) {
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
}

async function newSalesDoc(heading) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const W = 595;
  const H = 842;
  const M = 46;
  const cx = W / 2;

  doc.setDrawColor(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b);
  doc.setLineWidth(1.4);
  doc.rect(M, M, W - M * 2, H - M * 2);
  doc.setLineWidth(0.5);
  doc.rect(M + 7, M + 7, W - M * 2 - 14, H - M * 2 - 14);

  const logoUrl = await getSalesLogoDataUrl();
  if (logoUrl) {
    doc.addImage(logoUrl, 'PNG', cx - 60, 54, 120, 120);
  }

  let y = logoUrl ? 54 + 120 + 26 : 120;
  doc.setTextColor(110, 120, 140);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(heading, cx, y, { align: 'center' });
  y += 20;
  doc.setDrawColor(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b);
  doc.setLineWidth(1);
  doc.line(cx - 52, y, cx + 52, y);
  y += 30;

  return { doc, W, H, M, cx, y };
}

/**
 * OFFER LETTER — sales team member ka joining letter.
 * m = { salesId, referralCode, name, email, phone, location,
 *       commissionCourse, commissionWorkshop, commissionService, dateOfJoining }
 */
export async function downloadSalesOfferLetterPDF(m) {
  const { doc, W, H, M, y: yStart } = await newSalesDoc('OFFER LETTER — SALES TEAM');
  let y = yStart;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 40, 60);
  const intro = doc.splitTextToSize(
    `Dear ${m.name || 'Member'}, welcome to the NexRNN Technologies sales team. You are associated with us as a Sales Team Member to promote our services, courses and workshops. Your details and commission structure are given below.`,
    W - M * 2 - 60
  );
  doc.text(intro, M + 30, y);
  y += intro.length * 14 + 20;

  y = salesGridRow(doc, y, W, M, 'Name', m.name);
  y = salesGridRow(doc, y, W, M, 'Sales ID', m.salesId);
  y = salesGridRow(doc, y, W, M, 'Referral Code', m.referralCode);
  y = salesGridRow(doc, y, W, M, 'Email', m.email);
  y = salesGridRow(doc, y, W, M, 'Number', m.phone);
  y = salesGridRow(doc, y, W, M, 'Location', m.location);
  y = salesGridRow(doc, y, W, M, 'Course Commission', `${m.commissionCourse ?? 0}%`);
  y = salesGridRow(doc, y, W, M, 'Workshop Commission', `${m.commissionWorkshop ?? 0}%`);
  y = salesGridRow(doc, y, W, M, 'Service Commission', `${m.commissionService ?? 0}%`);
  y = salesGridRow(doc, y, W, M, 'Date of Joining', salesFmtDate(m.dateOfJoining));

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 40, 60);
  const note = doc.splitTextToSize(
    'Commission is paid on confirmed (paid) conversions carrying your referral code. We look forward to a great association.',
    W - M * 2 - 60
  );
  doc.text(note, M + 30, y + 10);

  salesDrawSignAndFooter(doc, W, H, M, y + 16 + note.length * 14 + 20);
  const safe = String(m.salesId || 'member').replace(/[^A-Za-z0-9-]/g, '');
  doc.save(`SalesOfferLetter-${safe}.pdf`);
}

/**
 * FULL PROFILE — sales member ki saari details (payout included).
 */
export async function downloadSalesProfilePDF(m) {
  const { doc, W, H, M, y: yStart } = await newSalesDoc('SALES MEMBER PROFILE');
  let y = yStart;

  // Details grid (saari info)
  y = salesGridRow(doc, y, W, M, 'Sales ID', m.salesId);
  y = salesGridRow(doc, y, W, M, 'Referral Code', m.referralCode);
  y = salesGridRow(doc, y, W, M, 'Name', m.name);
  y = salesGridRow(doc, y, W, M, 'Email', m.email);
  y = salesGridRow(doc, y, W, M, 'Number', m.phone);
  y = salesGridRow(doc, y, W, M, 'Location', m.location);
  y = salesGridRow(doc, y, W, M, 'Gender', m.gender || '-');
  y = salesGridRow(doc, y, W, M, 'Course Commission', `${m.commissionCourse ?? 0}%`);
  y = salesGridRow(doc, y, W, M, 'Workshop Commission', `${m.commissionWorkshop ?? 0}%`);
  y = salesGridRow(doc, y, W, M, 'Service Commission', `${m.commissionService ?? 0}%`);
  y = salesGridRow(doc, y, W, M, 'Date of Joining', salesFmtDate(m.dateOfJoining));
  if (m.bankAccNo) {
    y = salesGridRow(doc, y, W, M, 'Account Number', m.bankAccNo);
    y = salesGridRow(doc, y, W, M, 'Account Name', m.bankAccName || '-');
    y = salesGridRow(doc, y, W, M, 'IFSC Code', m.bankIfsc || '-');
  } else if (m.upiId) {
    y = salesGridRow(doc, y, W, M, 'UPI ID', m.upiId);
  }

  salesDrawSignAndFooter(doc, W, H, M, y + 16);
  const safe = String(m.salesId || 'member').replace(/[^A-Za-z0-9-]/g, '');
  doc.save(`SalesProfile-${safe}.pdf`);
}
