/**
 * Enrollment/Registration Certificate PDF (admin download).
 * Style: certificate card (double border + logo + divider) - career certificate jaisa.
 * Details lead row se fetch hote hain: name, reference ID, batch ID, type, course/workshop name.
 */

const BRAND_DARK = { r: 11, g: 18, b: 32 };
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

/**
 * lead: {
 *   name, referenceId, batchId, itemTitle,
 *   type: 'course' | 'workshop'
 * }
 */
export async function downloadEnrollmentCertificatePDF(lead) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = 595;
  const H = 842;
  const M = 46;

  // Double border frame
  doc.setDrawColor(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b);
  doc.setLineWidth(1.4);
  doc.rect(M, M, W - M * 2, H - M * 2);
  doc.setLineWidth(0.5);
  doc.rect(M + 7, M + 7, W - M * 2 - 14, H - M * 2 - 14);

  // Official logo
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
  doc.text('CERTIFICATE OF COMPLETION', cx, y, { align: 'center' });
  y += 28;

  doc.setDrawColor(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b);
  doc.setLineWidth(1);
  doc.line(cx - 52, y, cx + 52, y);
  y += 26;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11.5);
  doc.setTextColor(90, 100, 120);
  doc.text('This certifies that', cx, y, { align: 'center' });
  y += 30;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(BRAND_DARK.r, BRAND_DARK.g, BRAND_DARK.b);
  doc.text((lead.name || '[ Student Name ]').toUpperCase(), cx, y, { align: 'center' });
  y += 28;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11.5);
  doc.setTextColor(90, 100, 120);
  doc.text('has successfully completed the', cx, y, { align: 'center' });
  y += 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b);
  doc.text(doc.splitTextToSize(lead.itemTitle || 'Program', W - 160), cx, y, { align: 'center' });
  const titleLines = doc.splitTextToSize(lead.itemTitle || '', W - 160).length;
  y += 18 + (titleLines - 1) * 15;

  // Details grid: Reference ID, Batch ID, Type, Program
  y += 8;
  const rows = [
    ['Reference ID', lead.referenceId || '-'],
    ['Batch ID', lead.batchId || '-'],
    ['Type', lead.type === 'workshop' ? 'Workshop' : 'Course'],
    ['Program', lead.itemTitle || '-'],
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
    const wrapped = doc.splitTextToSize(String(value), colW - 8);
    doc.text(wrapped, gx, gy + 15);
    if (wrapped.length > 1) gy += (wrapped.length - 1) * 13;
  });
  y = gy + 44;

  // Paragraph
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(80, 90, 110);
  const typeName = lead.type === 'workshop' ? 'workshop' : 'course';
  const paragraph = `${lead.name || 'The participant'} actively participated in this ${typeName} and completed all the assigned learning modules and practical tasks. During the ${typeName}, they gained hands-on exposure to the core concepts of the subject, worked on guided practical assignments and developed strong foundational skills along with professional discipline, communication and teamwork. We appreciate their consistency and enthusiasm throughout the program and wish them great success in their future endeavours.`;
  // Paragraph me user ka naam BOLD+ITALIC (apni line par)
  const personName = lead.name || 'The participant';
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
  doc.setFont('helvetica', 'bolditalic');
  doc.text(personName, cx, ly, { align: 'center' });
  ly += 17;
  doc.setFont('helvetica', 'normal');
  const afterLines = doc.splitTextToSize(afterName.trim(), width);
  for (const line of afterLines) {
    doc.text(line, cx, ly, { align: 'center' });
    ly += 14;
  }
  y = ly + 18;

  // Signature line + digital note
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

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(130, 140, 160);
  doc.text('This is a digitally / system generated document.', W - 135, y + 48, { align: 'center' });
  doc.text('No physical signature is needed on this', W - 135, y + 61, { align: 'center' });
  doc.text('Certificate of Completion.', W - 135, y + 74, { align: 'center' });

  // Issue note + website
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Issued on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, M + 14, H - M - 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b);
  doc.text('https://www.nexrnntechnologies.in/', W - M - 14, H - M - 14, { align: 'right' });

  doc.save(`Certificate-${lead.referenceId || 'draft'}.pdf`);
}
