/**
 * Mentor documents (PDF, dynamic jspdf - rule: jspdf hamesha dynamic import):
 *  1. downloadMentorOfferLetterPDF - Offer Letter (mentor network join)
 *  2. downloadMentorProfilePDF     - Full profile sheet (saari details)
 *  3. downloadMentorLorPDF         - Letter of Recommendation
 *  4. downloadWithdrawalSlipPDF    - Withdrawal Payment Slip (NX-W-...)
 *
 * Style certificate jaisa hi hai: double blue border + official logo +
 * digital-note + website URL. Details mentor row se aati hain.
 */
const BRAND_BLUE = { r: 29, g: 111, b: 224 };

let logoDataUrlCache = null;
async function getLogoDataUrl() {
  if (logoDataUrlCache) return logoDataUrlCache;
  try {
    const res = await fetch('/nexrnn-logo.png');
    const blob = await res.blob();
    logoDataUrlCache = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    logoDataUrlCache = null;
  }
  return logoDataUrlCache;
}

function fmtDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * jsPDF ki standard fonts (WinAnsi) me \u20B9 (\u20b9) supported NAHI hai -
 * PDF me garbage character dikhta hai. Isliye PDFs me hamesha 'Rs. ' use karo.
 */
function rs(n) {
  return `Rs. ${(Number(n) || 0).toLocaleString('en-IN')}`;
}

/** Kisi bhi text se \u20b9 hatao (admin-typed labels/messages safe) */
function noRupeeText(t) {
  return String(t ?? '').replace(/\u20B9/g, 'Rs. ');
}

function typeLabel(t) {
  return t === 'course' ? 'Courses' : t === 'workshop' ? 'Workshops' : 'Courses & Workshops (Both)';
}

/** Certificate-style frame + logo + heading (dono documents common) */
async function drawCardFrame(doc, heading) {
  const W = 595;
  const H = 842;
  const M = 46;
  const cx = W / 2;

  doc.setDrawColor(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b);
  doc.setLineWidth(1.4);
  doc.rect(M, M, W - M * 2, H - M * 2);
  doc.setLineWidth(0.5);
  doc.rect(M + 7, M + 7, W - M * 2 - 14, H - M * 2 - 14);

  const logoUrl = await getLogoDataUrl();
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

  return { W, H, M, cx, y };
}

/** Details grid ki ek row (label left, value right) */
function gridRow(doc, y, W, M, label, value) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(130, 140, 160);
  doc.text(label, M + 40, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 40, 60);
  const lines = doc.splitTextToSize(noRupeeText(value) || '-', W - M * 2 - 200);
  doc.text(lines, W - M - 40, y, { align: 'right' });
  doc.setDrawColor(225, 230, 240);
  doc.setLineWidth(0.5);
  doc.line(M + 40, y + 10, W - M - 40, y + 10);
  return y + 12 + (lines.length - 1) * 12 + 14;
}

/** Signature block + digital note (3 lines) + website URL */
function drawSignAndFooter(doc, W, H, M, y) {
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

/** Hoisted jsPDF so helpers ke andar bhi save ho sake */
async function newDoc() {
  const { jsPDF } = await import('jspdf');
  return new jsPDF({ unit: 'pt', format: 'a4' });
}

/**
 * OFFER LETTER - mentor join karne par
 * Filename: OfferLetter-{mentorId}.pdf
 */
export async function downloadMentorOfferLetterPDF(mentor) {
  const doc = await newDoc();
  const { W, H, M, cx, y: yStart } = await drawCardFrame(doc, 'OFFER LETTER — MENTOR NETWORK');
  let y = yStart;

  // Mentor name + ID
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(30, 40, 60);
  doc.text((mentor.name || 'Mentor').toUpperCase(), cx, y, { align: 'center' });
  y += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(110, 120, 140);
  doc.text(`Mentor ID: ${mentor.mentorId || '-'}`, cx, y, { align: 'center' });
  y += 28;

  // Letter body
  doc.setFontSize(10.5);
  doc.setTextColor(70, 80, 100);
  const paras = [
    `Dear ${mentor.name || 'Mentor'},`,
    `We are pleased to welcome you as a Mentor with NexRNN Technologies. Based on our discussion, you are associated with us for ${typeLabel(mentor.mentorType)} mentoring, starting from ${fmtDate(mentor.dateOfJoining)}.`,
    `For the programs you mentor, you will be entitled to a commission of ${mentor.commissionCourse ?? mentor.commissionPercent ?? 0}% for courses and ${mentor.commissionWorkshop ?? mentor.commissionPercent ?? 0}% for workshops, as mutually agreed. Your association details are summarised below.`,
  ];
  for (const p of paras) {
    const lines = doc.splitTextToSize(p, W - M * 2 - 60);
    for (const line of lines) {
      doc.text(line, cx, y, { align: 'center' });
      y += 15;
    }
    y += 10;
  }
  y += 8;

  // Details grid
  y = gridRow(doc, y, W, M, 'Mentor ID', mentor.mentorId);
  y = gridRow(doc, y, W, M, 'Type', typeLabel(mentor.mentorType));
  y = gridRow(doc, y, W, M, 'Course Commission', `${mentor.commissionCourse ?? mentor.commissionPercent ?? 0}%`);
  y = gridRow(doc, y, W, M, 'Workshop Commission', `${mentor.commissionWorkshop ?? mentor.commissionPercent ?? 0}%`);
  y = gridRow(doc, y, W, M, 'Date of Joining', fmtDate(mentor.dateOfJoining));

  drawSignAndFooter(doc, W, H, M, y + 14);
  doc.save(`OfferLetter-${(mentor.mentorId || 'mentor').replace(/[^A-Za-z0-9-]/g, '')}.pdf`);
}

/**
 * LOR - mentor ke liye Letter of Recommendation
 * Filename: LOR-{mentorId}.pdf
 */
export async function downloadMentorLorPDF(mentor) {
  const doc = await newDoc();
  const { W, H, M, cx, y: yStart } = await drawCardFrame(doc, 'LETTER OF RECOMMENDATION');
  let y = yStart;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(30, 40, 60);
  doc.text((mentor.name || 'Mentor').toUpperCase(), cx, y, { align: 'center' });
  y += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(110, 120, 140);
  doc.text(`Mentor ID: ${mentor.mentorId || '-'}`, cx, y, { align: 'center' });
  y += 28;

  doc.setFontSize(10.5);
  doc.setTextColor(70, 80, 100);
  const paras = [
    `This letter certifies that ${mentor.name || 'the mentor'} has been associated with NexRNN Technologies as a Mentor since ${fmtDate(mentor.dateOfJoining)}, guiding learners across ${typeLabel(mentor.mentorType).toLowerCase()}.`,
    `During this association, they have demonstrated strong subject knowledge, professionalism and a genuine commitment to student growth. Their mentoring has consistently reflected the quality standards we uphold at NexRNN Technologies.`,
    `We gladly recommend them for mentoring, training and related professional opportunities, and wish them continued success ahead.`,
  ];
  for (const p of paras) {
    const lines = doc.splitTextToSize(p, W - M * 2 - 60);
    for (const line of lines) {
      doc.text(line, cx, y, { align: 'center' });
      y += 15;
    }
    y += 10;
  }
  y += 8;

  y = gridRow(doc, y, W, M, 'Mentor ID', mentor.mentorId);
  y = gridRow(doc, y, W, M, 'Type', typeLabel(mentor.mentorType));
  y = gridRow(doc, y, W, M, 'Course Commission', `${mentor.commissionCourse ?? mentor.commissionPercent ?? 0}%`);
  y = gridRow(doc, y, W, M, 'Workshop Commission', `${mentor.commissionWorkshop ?? mentor.commissionPercent ?? 0}%`);
  y = gridRow(doc, y, W, M, 'Date of Joining', fmtDate(mentor.dateOfJoining));

  drawSignAndFooter(doc, W, H, M, y + 14);
  doc.save(`LOR-${(mentor.mentorId || 'mentor').replace(/[^A-Za-z0-9-]/g, '')}.pdf`);
}

/**
 * FULL PROFILE - mentor ki saari details ek sheet par
 * Filename: MentorProfile-{mentorId}.pdf
 */
export async function downloadMentorProfilePDF(mentor) {
  const doc = await newDoc();
  const { W, H, M, cx, y: yStart } = await drawCardFrame(doc, 'MENTOR PROFILE');
  let y = yStart;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(30, 40, 60);
  doc.text((mentor.name || 'Mentor').toUpperCase(), cx, y, { align: 'center' });
  y += 26;

  // Details grid (saari info)
  y = gridRow(doc, y, W, M, 'Mentor ID', mentor.mentorId);
  y = gridRow(doc, y, W, M, 'Name', mentor.name);
  y = gridRow(doc, y, W, M, 'Email', mentor.email);
  y = gridRow(doc, y, W, M, 'Number', mentor.phone);
  y = gridRow(doc, y, W, M, 'Location', mentor.location);
  y = gridRow(doc, y, W, M, 'Type', typeLabel(mentor.mentorType));
  y = gridRow(doc, y, W, M, 'Course Commission', `${mentor.commissionCourse ?? mentor.commissionPercent ?? 0}%`);
  y = gridRow(doc, y, W, M, 'Workshop Commission', `${mentor.commissionWorkshop ?? mentor.commissionPercent ?? 0}%`);
  y = gridRow(doc, y, W, M, 'Date of Joining', fmtDate(mentor.dateOfJoining));

  drawSignAndFooter(doc, W, H, M, y + 14);
  doc.save(`MentorProfile-${(mentor.mentorId || 'mentor').replace(/[^A-Za-z0-9-]/g, '')}.pdf`);
}

/**
 * WITHDRAWAL PAYMENT SLIP - mentor withdrawal request ka receipt.
 * Admin (Mentor Payments) aur mentor (Withdrawal History) dono use karte hain.
 * w = { withdrawalCode, name, mentorId, amount, method, accNo, accName,
 *       bankIfsc, upiId, status, refNo, adminMessage, requestedAt, processedAt }
 * contact = optional { email, phone } (mentor ki mail/number slip par)
 * Filename: PaymentSlip-{withdrawalCode}.pdf
 */
export async function downloadWithdrawalSlipPDF(w, contact = {}) {
  const doc = await newDoc();
  const { W, H, M, cx, y: yStart } = await drawCardFrame(doc, 'PAYMENT SLIP — WITHDRAWAL');
  let y = yStart;

  // Payment ID + status
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(30, 40, 60);
  doc.text(w.withdrawalCode || 'NX-W-XXXXXXXX', cx, y, { align: 'center' });
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(110, 120, 140);
  doc.text(`Status: ${w.status || 'Created'}`, cx, y, { align: 'center' });
  y += 24;

  // Amount bada (PDF me 'Rs. ' - \u20b9 jsPDF me render nahi hota)
  const amt = rs(w.amount);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b);
  doc.text(amt, cx, y, { align: 'center' });
  y += 30;

  // Details grid
  // idLabel: sales withdrawal slip par 'Sales ID' dikhta hai (mentor par 'Mentor ID')
  const idLabel = w.idLabel || 'Mentor ID';
  const whoLabel = w.idLabel ? 'Member Name' : 'Mentor Name';
  y = gridRow(doc, y, W, M, whoLabel, w.name || '-');
  y = gridRow(doc, y, W, M, idLabel, w.mentorId || '-');
  if (contact.email) y = gridRow(doc, y, W, M, 'Email', contact.email);
  if (contact.phone) y = gridRow(doc, y, W, M, 'Phone', contact.phone);
  y = gridRow(doc, y, W, M, 'Payment Method', w.method === 'bank' ? 'Bank Account' : 'UPI');
  if (w.method === 'bank') {
    y = gridRow(doc, y, W, M, 'Account Number', w.accNo || '-');
    y = gridRow(doc, y, W, M, 'Account Name', w.accName || '-');
    y = gridRow(doc, y, W, M, 'IFSC Code', w.bankIfsc || '-');
  } else {
    y = gridRow(doc, y, W, M, 'UPI ID', w.upiId || '-');
  }
  y = gridRow(doc, y, W, M, 'Requested On', fmtDate((w.requestedAt || '').slice(0, 10)));
  y = gridRow(doc, y, W, M, 'Processed On', w.processedAt ? fmtDate(w.processedAt.slice(0, 10)) : '-');
  y = gridRow(doc, y, W, M, 'Payment Ref No', w.refNo || '-');

  // Admin message (hamesha dikhe - na ho to '-')
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(130, 140, 160);
  doc.text('Message from NexRNN Admin:', M + 40, y + 6);
  y += 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 40, 60);
  const msgLines = doc.splitTextToSize(noRupeeText(w.adminMessage) || '-', W - M * 2 - 80);
  doc.text(msgLines, M + 40, y + 4);
  y += 18 + (msgLines.length - 1) * 13;

  drawSignAndFooter(doc, W, H, M, y + 16);
  doc.save(`PaymentSlip-${w.withdrawalCode || 'request'}.pdf`);
}
