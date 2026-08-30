/**
 * Internship/Job applications repo.
 * - Public: submit application (resume private bucket me upload + record insert)
 * - Admin: list/update/download-resume
 * Application ID database-side trigger se banta hai (NRT-INT-YYMMM####).
 */
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';

const RESUME_BUCKET = 'internship-resumes';
const RESUME_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function mapRow(row) {
  return {
    id: row.id,
    applicationId: row.application_id || '',
    applicationType: row.application_type === 'job' ? 'job' : 'internship',
    openingSlug: row.opening_slug || '',
    openingTitle: row.opening_title || '',
    openingCode: row.opening_code || '',
    openingDomain: row.opening_domain || '',
    fullName: row.full_name || '',
    email: row.email || '',
    mobile: row.mobile || '',
    gender: row.gender || '',
    city: row.city || '',
    state: row.state || '',
    duration: row.duration || '',
    preferredMode: row.preferred_mode || 'Online',
    college: row.college || '',
    degree: row.degree || '',
    degreeOther: row.degree_other || '',
    skills: row.skills || '',
    resumePath: row.resume_path || '',
    resumeName: row.resume_name || '',
    expectations: row.expectations || '',
    status: row.status || 'Applied',
    paymentStatus: row.payment_status || 'free',
    paymentAmount: Number(row.payment_amount) || 0,
    orderId: row.order_id || '',
    cfPaymentId: row.cf_payment_id || '',
    paymentMethod: row.payment_method || '',
    paidAt: row.paid_at || '',
    startDate: row.start_date || '',
    endDate: row.end_date || '',
    certificateStatus: row.certificate_status || 'Not Applicable',
    adminRemarks: row.admin_remarks || '',
    submissionDate: row.submission_date || '',
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Client-side resume validation (extension par bharosa nahi):
 * 1. size <= 5MB  2. MIME whitelist  3. magic bytes (PDF/DOCX)
 */
export async function validateResumeFile(file) {
  if (!file) return 'Please attach your resume.';
  if (file.size > RESUME_MAX_BYTES) return 'Resume is larger than 5 MB.';
  if (file.size === 0) return 'Resume file is empty.';
  if (!ALLOWED_MIME.includes(file.type)) {
    return 'Only PDF or DOCX files are allowed.';
  }

  // Magic bytes: PDF -> %PDF, DOCX -> PK\x03\x04
  const header = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result || []));
    reader.onerror = () => resolve(null);
    reader.readAsArrayBuffer(file.slice(0, 8));
  });
  if (!header) return 'Could not read the resume file. Please try again.';

  const isPdf = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46;
  const isDocx = header[0] === 0x50 && header[1] === 0x4b && (header[2] === 0x03 || header[2] === 0x04);
  if (!isPdf && !isDocx) return 'This file is not a valid PDF or DOCX. Please re-export and try again.';

  return ''; // empty string = valid
}

/** Resume private bucket me secure upload (public URL kabhi nahi deta) */
export async function uploadResume(file) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }
  const ext = (file.name.split('.').pop() || 'pdf').toLowerCase();
  const path = `applications/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(RESUME_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message || 'Resume upload failed.');

  return { path, name: file.name };
}

/** Public: application submit (Application ID DB trigger se aata hai) */
export async function submitApplication(payload) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const record = {
    application_type: payload.applicationType,
    opening_slug: payload.openingSlug || '',
    opening_title: payload.openingTitle || '',
    opening_code: payload.openingCode || '',
    opening_domain: payload.openingDomain || '',
    full_name: payload.fullName,
    email: payload.email,
    mobile: payload.mobile,
    gender: payload.gender,
    city: payload.city,
    state: payload.state,
    duration: payload.duration || '',
    preferred_mode: 'Online',
    college: payload.college,
    degree: payload.degree,
    degree_other: payload.degreeOther || '',
    skills: payload.skills || '',
    resume_path: payload.resumePath || '',
    resume_name: payload.resumeName || '',
    expectations: payload.expectations || '',
    // Paid opening: pehle 'pending', payment success par edge function 'paid' karta hai
    payment_status: payload.paymentStatus === 'pending' ? 'pending' : 'free',
    payment_amount: Number(payload.paymentAmount) || 0,
    // status/certificate/remarks DB defaults lenge
    // submitted_at/submission_date DB default (server clock)
  };

  const { data, error } = await supabase
    .from('internship_applications')
    .insert(record)
    .select('id, application_id')
    .single();

  if (error) throw new Error(error.message || 'Application submit failed.');
  return { id: data?.id || '', applicationId: data?.application_id || '' };
}

/** Admin: saari applications (latest first) */
export async function fetchAdminApplications() {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('internship_applications')
    .select('*')
    .order('submitted_at', { ascending: false });
  if (error) throw error;

  const rows = data ?? [];

  // Cashfree payments ka latest paid record merge karo — application row
  // 'pending' atki ho (purana verify fn) to bhi admin ko paid info auto dikhe
  const ids = rows.map((r) => r.id).filter(Boolean);
  const paidByApp = {};
  if (ids.length) {
    try {
      const { data: pays } = await supabase
        .from('payments')
        .select('application_id, status, amount, cf_payment_id, payment_method, cashfree_order_id, created_at')
        .in('application_id', ids)
        .order('created_at', { ascending: false });
      for (const pay of pays ?? []) {
        if (pay.status === 'paid' && !paidByApp[pay.application_id]) paidByApp[pay.application_id] = pay;
      }
    } catch { /* payments table available na ho to skip */ }
  }

  return rows.map((r) => {
    const pay = paidByApp[r.id];
    if (pay && r.payment_status !== 'paid') {
      r = {
        ...r,
        payment_status: 'paid',
        payment_amount: Number(r.payment_amount) || Number(pay.amount) || 0,
        order_id: r.order_id || pay.cashfree_order_id || '',
        cf_payment_id: r.cf_payment_id || pay.cf_payment_id || '',
        payment_method: r.payment_method || pay.payment_method || '',
        paid_at: r.paid_at || pay.created_at || '',
      };
    }
    return mapRow(r);
  });
}

/** Admin: application update (status, domain, dates, certificate, remarks) */
export async function updateApplicationAdmin(id, fields) {
  if (!isSupabaseConfigured) return;
  const payload = {
    updated_at: new Date().toISOString(),
  };
  if (fields.status !== undefined) payload.status = fields.status;
  if (fields.startDate !== undefined) payload.start_date = fields.startDate || null;
  if (fields.endDate !== undefined) payload.end_date = fields.endDate || null;
  if (fields.certificateStatus !== undefined) payload.certificate_status = fields.certificateStatus;
  if (fields.adminRemarks !== undefined) payload.admin_remarks = fields.adminRemarks || null;
  // Admin-controlled payment info (offline/manual payments ke liye)
  if (fields.paymentStatus !== undefined) {
    payload.payment_status = fields.paymentStatus;
    if (fields.paymentStatus === 'paid' && !fields.paidAt) payload.paid_at = new Date().toISOString();
  }
  if (fields.paymentAmount !== undefined) payload.payment_amount = Number(fields.paymentAmount) || 0;
  if (fields.paymentId !== undefined) payload.cf_payment_id = fields.paymentId || '';
  if (fields.orderId !== undefined) payload.order_id = fields.orderId || '';
  if (fields.paymentMethod !== undefined) payload.payment_method = fields.paymentMethod || '';
  if (fields.paidAt !== undefined) payload.paid_at = fields.paidAt || null;

  const { error } = await supabase
    .from('internship_applications')
    .update(payload)
    .eq('id', id);
  if (error) throw error;
}

/** Admin: resume ka secure signed download link (5 min valid) */
export async function getResumeDownloadUrl(resumePath) {
  if (!isSupabaseConfigured || !resumePath) return '';
  const { data, error } = await supabase.storage
    .from(RESUME_BUCKET)
    .createSignedUrl(resumePath, 300);
  if (error) throw new Error(error.message || 'Could not create download link.');
  return data?.signedUrl || '';
}

/**
 * Application form PDF download (success screen se).
 * jspdf dynamic import - bundle halka rehta hai.
 */
export async function downloadApplicationPDF(data) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = 595;
  let y = 0;

  // Header band
  doc.setFillColor(11, 18, 32);
  doc.rect(0, 0, W, 92, 'F');
  doc.setFillColor(29, 111, 224);
  doc.rect(0, 92, W, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('NexRNN Technologies', 40, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const typeLabel = data.applicationType === 'job' ? 'Job Application' : 'Internship Application';
  doc.text(typeLabel + ' - Application Form', 40, 64);
  doc.setTextColor(11, 18, 32);
  y = 130;

  const line = (label, value) => {
    if (!value) value = '-';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(String(label), 40, y);
    doc.setFont('helvetica', 'normal');
    const wrapped = doc.splitTextToSize(String(value), W - 220);
    doc.text(wrapped, 220, y);
    y += 18 * Math.max(1, wrapped.length);
    if (y > 770) {
      doc.addPage();
      y = 60;
    }
  };

  // IDs
  doc.setFillColor(240, 245, 255);
  doc.rect(40, y - 14, W - 80, 52, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Application ID: ' + (data.applicationId || '-'), 52, y + 6);
  doc.text('Opening ID: ' + (data.openingCode || '-'), 52, y + 26);
  y += 62;

  // Opening details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Opening Details', 40, y);
  y += 16;
  line('Job / Internship Name', data.openingTitle);
  line('Application Fee', data.openingFeeLabel || 'Free — ₹0');
  if (data.openingStipendLabel) line('Stipend', data.openingStipendLabel);
  if (data.openingDomain) line('Domain', data.openingDomain);
  if (data.openingDuration) line('Duration', data.openingDuration);
  if (data.openingStart) line('Start Date', data.openingStart);
  if (data.openingEnd) line('End Date', data.openingEnd);
  line('Type', data.applicationType === 'job' ? 'Job' : 'Internship');
  line('Submitted On', data.submittedOn);
  y += 8;

  doc.setDrawColor(200, 210, 230);
  doc.line(40, y, W - 40, y);
  y += 20;

  // Personal
  line('Name', data.fullName);
  line('Email', data.email);
  line('Mobile', data.mobile);
  line('Gender', data.gender);
  line('City', data.city);
  line('State', data.state);
  y += 8;

  // Preferences
  if (data.applicationType === 'internship') {
    line('Duration', data.duration);
    line('Preferred Mode', 'Online');
    y += 8;
  }

  // Education
  line('University / College', data.college);
  line('Degree / Program', data.degree === 'Others' && data.degreeOther ? data.degree + ' - ' + data.degreeOther : data.degree);
  line('Skills', data.skills);
  line('Expectations', data.expectations);

  // Payment info (sirf paid applications par)
  if (data.payment) {
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Payment Details', 40, y);
    y += 16;
    line('Payment ID', data.payment.paymentId);
    line('Amount', data.payment.amount);
    line('Order ID', data.payment.orderId);
    line('Method', data.payment.method);
  }

  // Declaration & Consent (sab required the - isliye ticked)
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Declaration & Consent', 40, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const declarations = [
    'I confirm that the information provided by me is accurate.',
    'I agree to follow NexRNN Technologies\' internship policies and guidelines.',
    'I understand that submission of this form does not guarantee selection.',
    'I consent to NexRNN Technologies contacting me regarding my internship application.',
  ];
  for (const dec of declarations) {
    // Green tick (box ke saath) - [x] ki jagah saaf tick
    doc.setFillColor(22, 163, 74);
    doc.roundedRect(40, y - 9, 12, 12, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('\u2713', 46, y, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(60, 70, 90);
    const wrapped = doc.splitTextToSize(dec, W - 110);
    doc.text(wrapped, 62, y);
    y += 14 * Math.max(1, wrapped.length);
    if (y > 740) {
      doc.addPage();
      y = 60;
    }
  }

  // Signature block
  y += 26;
  if (y > 690) {
    doc.addPage();
    y = 60;
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('Submitted On: ' + (data.submittedOn || '-'), 40, y);
  y += 40;
  doc.setDrawColor(120, 130, 150);
  doc.line(40, y, 200, y);
  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.text('Signature: ' + (data.fullName || ''), 40, y);

  // Footer
  doc.setFontSize(8.5);
  doc.setTextColor(120, 130, 150);
  doc.text('This is a computer-generated application summary. Please keep your Application ID for future reference.', 40, 800);
  doc.text('nexrnntechnologies.in', 40, 814);

  doc.save('Application-' + (data.applicationId || 'form') + '.pdf');
}

export { mapRow };
