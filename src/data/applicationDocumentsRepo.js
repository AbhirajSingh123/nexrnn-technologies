/**
 * Career application documents (PDF download, dynamic jspdf):
 *  1. downloadApplicationPDF   - poora application form (already used)
 *  2. downloadCertificatePDF   - Certificate of Completion (certificate-style card)
 *  3. downloadLorPDF           - Letter of Recommendation (same style)
 *
 * Dono documents ki details application record se aati hain:
 * name, opening ID, application ID, domain, type, start/end dates.
 */

const BRAND_DARK = { r: 11, g: 18, b: 32 };
const BRAND_BLUE = { r: 29, g: 111, b: 224 };

// Official NexRNN logo (public folder, transparent PNG) - PDF me embed hota hai
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
 * Certificate-style document: heading, name, details grid, paragraph.
 * docKind: 'certificate' | 'lor'
 */
export async function downloadCareerDocumentPDF(application, docKind) {
  const { jsPDF } = await import('jspdf');
  const isLor = docKind === 'lor';
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = 595;
  const H = 842;
  const M = 46; // margin

  // Outer border (double-line frame, certificate jaisa)
  doc.setDrawColor(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b);
  doc.setLineWidth(1.4);
  doc.rect(M, M, W - M * 2, H - M * 2);
  doc.setLineWidth(0.5);
  doc.rect(M + 7, M + 7, W - M * 2 - 14, H - M * 2 - 14);

  // Official NexRNN logo (badge ki jagah)
  const cx = W / 2;
  const logoUrl = await getLogoDataUrl();
  let y;
  if (logoUrl) {
    const lw = 120;
    doc.addImage(logoUrl, 'PNG', cx - lw / 2, 54, lw, lw);
    y = 54 + lw + 16;
  } else {
    y = 110;
  }

  // Heading
  doc.setTextColor(110, 120, 140);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(isLor ? 'LETTER OF RECOMMENDATION' : 'CERTIFICATE OF COMPLETION', cx, y, { align: 'center' });
  y += 28;

  // Brand
  // Divider (logo ke baad seedha divider - NEXRNN TECHNOLOGIES text hataya)
  doc.setDrawColor(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b);
  doc.setLineWidth(1);
  doc.line(cx - 52, y, cx + 52, y);
  y += 26;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11.5);
  doc.setTextColor(90, 100, 120);
  doc.text(isLor ? 'This letter certifies that' : 'This certifies that', cx, y, { align: 'center' });
  y += 36;

  // Student name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(BRAND_DARK.r, BRAND_DARK.g, BRAND_DARK.b);
  doc.text((application.fullName || '[ Student Name ]').toUpperCase(), cx, y, { align: 'center' });
  y += 28;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11.5);
  doc.setTextColor(90, 100, 120);
  doc.text(isLor ? 'for the successful completion of the' : 'has successfully completed the', cx, y, { align: 'center' });
  y += 20;

  // Opening title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b);
  doc.text(doc.splitTextToSize(application.openingTitle || 'Internship/Job Program', W - 160), cx, y, { align: 'center' });
  y += 18 + (doc.splitTextToSize(application.openingTitle || '', W - 160).length - 1) * 15;

  // Details grid
  y += 8;
  const rows = [
    ['Opening ID', application.openingCode || '-'],
    ['Application ID', application.applicationId || '-'],
    ['Domain', application.domain || '-'],
    ['Type', application.typeLabel || (application.applicationType === 'job' ? 'Job' : 'Internship')],
    ['Internship/Job Start Date', fmtDate(application.startDate)],
    ['Internship/Job End Date', fmtDate(application.endDate)],
  ];
  const colW = (W - M * 2 - 60) / 2;
  let gy = y;
  rows.forEach(([label, value], i) => {
    const gx = M + 30 + (i % 2) * (colW + 12);
    if (i % 2 === 0 && i > 0) gy += 36;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(130, 140, 160);
    doc.text(label.toUpperCase(), gx, gy);
    doc.setFontSize(11);
    doc.setTextColor(BRAND_DARK.r, BRAND_DARK.g, BRAND_DARK.b);
    doc.text(String(value), gx, gy + 15);
  });
  y = gy + 44;

  // Paragraph
  doc.setFontSize(10.5);
  doc.setTextColor(80, 90, 110);
  const paragraph = isLor
    ? `During the program, ${application.fullName || 'the candidate'} worked with dedication, curiosity and a professional attitude. They explored the core areas of the domain, completed the assigned tasks on time and showed steady improvement in both technical skills and communication. Their willingness to learn, take feedback positively and collaborate with the team made a positive impression. We believe these qualities will help them in their future academic and professional journey, and we gladly recommend them for suitable opportunities.`
    : `${application.fullName || 'The candidate'} actively participated in the program and completed all the assigned learning modules and practical tasks. During the program, they gained hands-on exposure to the core concepts of the domain, worked on guided practical assignments and developed strong foundational skills along with professional discipline, communication and teamwork. We appreciate their consistency and enthusiasm throughout the program and wish them great success in their future endeavours.`;
  // Paragraph: user ka naam BOLD+ITALIC, baaki normal (jsPDF mixed-style render)
  const personName = application.fullName || 'The candidate';
  const idx = paragraph.indexOf(personName);
  let beforeName = '';
  let afterName = paragraph;
  if (idx >= 0) {
    beforeName = paragraph.slice(0, idx);
    afterName = paragraph.slice(idx + personName.length);
  }
  const width = W - M * 2 - 60;
  let ly = y;
  doc.setFont('helvetica', 'normal');
  const beforeLines = doc.splitTextToSize(beforeName, width);
  for (const line of beforeLines) {
    doc.text(line, cx, ly, { align: 'center' });
    ly += 14;
  }
  // BOLD + ITALIC naam (apni centered line par)
  doc.setFont('helvetica', 'bolditalic');
  doc.text(personName, cx, ly, { align: 'center' });
  ly += 17;
  // Baaki paragraph normal
  doc.setFont('helvetica', 'normal');
  const afterLines = doc.splitTextToSize(afterName.trim(), width);
  for (const line of afterLines) {
    doc.text(line, cx, ly, { align: 'center' });
    ly += 14;
  }
  y = ly + 18;

  // Signature line + digital note (2 clean lines, sign block ke neeche)
  if (y > H - 170) y = H - 170;
  doc.setDrawColor(150, 158, 175);
  doc.setLineWidth(0.8);
  doc.line(W - 210, y, W - 60, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90, 100, 120);
  doc.text('Authorised Signatory', W - 135, y + 14, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('NexRNN Technologies', W - 135, y + 27, { align: 'center' });

  // Digital / system-generated note (2 lines, grey italic, centered)
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(130, 140, 160);
  const noteLine1 = 'This is a digitally / system generated document.';
  const noteLine2 = 'No physical signature is needed on this';
  const noteLine3 = isLor ? 'Letter of Recommendation.' : 'Certificate of Completion.';
  doc.text(noteLine1, W - 135, y + 48, { align: 'center' });
  doc.text(noteLine2, W - 135, y + 61, { align: 'center' });
  doc.text(noteLine3, W - 135, y + 74, { align: 'center' });

  // Issue note + website (bottom)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(130, 140, 160);
  doc.text(`Issued on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, M + 14, H - M - 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b);
  doc.text('https://www.nexrnntechnologies.in/', W - M - 14, H - M - 14, { align: 'right' });

  const fileName = isLor
    ? `LOR-${application.applicationId || 'draft'}.pdf`
    : `Certificate-${application.applicationId || 'draft'}.pdf`;
  doc.save(fileName);
}
