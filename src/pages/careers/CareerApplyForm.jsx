import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Briefcase, CheckCircle2, Loader2, UploadCloud, FileText, X, ShieldCheck, Download,
} from 'lucide-react';
import { useCareer, useCareers } from '@/hooks/useCareers';
import { isLastDatePassed } from '@/data/careersRepo';
import { createCashfreeOrder } from '@/data/paymentsRepo';
import { startCashfreeCheckout } from '@/utils/cashfreeSdk';
import {
  submitApplication, uploadResume, validateResumeFile, downloadApplicationPDF,
} from '@/data/applicationsRepo';
import {
  INDIAN_STATES,
  DEGREE_OPTIONS, GENDER_OPTIONS,
} from '@/constants/applicationOptions';
import { SITE } from '@/constants/siteData';

const inputClass =
  'w-full border-2 border-secondary/20 focus:border-primary px-4 py-2.5 text-sm outline-none transition-colors bg-white normal-case';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-2';

const SECTION_HEADING = {
  internship: 'Internship Application Form',
  job: 'Job Application Form',
};

export default function CareerApplyForm() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const openingSlug = params.get('opening') || '';
  // Route bhi type batata hai: /internship ya /job
  const routeType = location.pathname.startsWith('/job') ? 'job' : 'internship';

  const { career, loading: careerLoading } = useCareer(openingSlug);
  const { openings, loading: openingsLoading } = useCareers();
  const applicationType = career?.type || routeType;

  // Gate: koi open opening hi nahi (ya URL wali opening closed hai) to form na khule —
  // "We are currently not hiring" message dikhe (Careers page jaisa).
  const checkingOpenings = careerLoading || openingsLoading;
  const openingBlocked = !checkingOpenings && (
    openingSlug
      ? !career || isLastDatePassed(career.lastDateApply)
      : !openings.some((c) => !isLastDatePassed(c.lastDateApply))
  );
  const isInternship = applicationType === 'internship';

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    gender: '',
    city: '',
    state: '',
    college: '',
    degree: '',
    degreeOther: '',
    skills: '',
    expectations: '',
    dec1: false,
    dec2: false,
    dec3: false,
    dec4: false,
  });
  const [resume, setResume] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState('');
  const [submittedData, setSubmittedData] = useState(null);

  const openingTitle = career?.title || '';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleResumeChange = (e) => {
    const file = e.target.files?.[0] || null;
    setResume(file);
    setErrors((prev) => ({ ...prev, resume: '' }));
  };

  const clearResume = () => {
    setResume(null);
    const input = document.getElementById('resume-input');
    if (input) input.value = '';
  };

  // ---------- Validation ----------
  const validate = async () => {
    const next = {};

    // Section 1
    if (!form.fullName.trim()) next.fullName = 'Name is required.';
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';

    // Indian mobile: optional +91/0 prefix, phir 6-9 se start hone wale 10 digits
    const digits = form.mobile.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '');
    if (!form.mobile.trim()) next.mobile = 'Mobile number is required.';
    else if (!/^[6-9]\d{9}$/.test(digits)) next.mobile = 'Enter a valid 10-digit Indian mobile number.';

    if (!form.gender) next.gender = 'Please select an option.';
    if (!form.city.trim()) next.city = 'City is required.';
    if (!form.state) next.state = 'Please select your state.';

    // Section 2 (internship only)


    // Section 3
    if (!form.college.trim()) next.college = 'University / College name is required.';
    if (!form.degree) next.degree = 'Please select your degree.';
    if (form.degree === 'Others' && !form.degreeOther.trim()) {
      next.degreeOther = 'Please write your degree / program name.';
    }
    if (!form.skills.trim()) next.skills = 'Skills are required.';

    // Section 4
    const resumeError = await validateResumeFile(resume);
    if (resumeError) next.resume = resumeError;

    // Section 5
    if (!form.expectations.trim()) next.expectations = 'This field is required.';

    // Section 6 - chaaron declarations zaroori
    ['dec1', 'dec2', 'dec3', 'dec4'].forEach((key) => {
      if (!form[key]) next[key] = 'This confirmation is required.';
    });

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await validate();
    if (!ok) {
      // pehla error wale section tak scroll
      const firstKey = Object.keys(errors)[0];
      if (firstKey) {
        document.getElementById(`field-${firstKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmitting(true);
    try {
      // 1. Resume secure upload
      const { path, name } = await uploadResume(resume);

      // 2. Application record (Application ID DB-side generate hota hai)
      const digits = form.mobile.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '');
      const isPaid = career?.feeType === 'paid' && Number(career?.feeAmount) > 0;
      const result = await submitApplication({
        applicationType,
        openingSlug: openingSlug || '',
        openingTitle,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        mobile: digits,
        gender: form.gender,
        city: form.city.trim(),
        state: form.state,
        openingCode: career?.careerCode || '',
        openingDomain: career?.domain || '',
        college: form.college.trim(),
        degree: form.degree,
        degreeOther: form.degree === 'Others' ? form.degreeOther.trim() : '',
        skills: form.skills.trim(),
        expectations: form.expectations.trim(),
        resumePath: path,
        resumeName: name,
        paymentStatus: isPaid ? 'pending' : 'free',
        paymentAmount: isPaid ? Number(career.feeAmount) : 0,
      });

      const snapshot = {
        applicationId: result.applicationId,
        openingCode: career?.careerCode || '',
        openingDomain: career?.domain || '',
        openingTitle,
        openingDuration: career?.duration || '',
        openingStart: career?.startDate || '',
        openingEnd: career?.endDate || '',
        openingFeeLabel: career?.feeType === 'paid' ? `Paid — ₹${career.feeAmount}` : 'Free — ₹0',
        openingStipendLabel: applicationType === 'internship'
          ? (career?.stipendType === 'paid' ? `Paid — ${career.stipendText}` : 'Unpaid')
          : '',
        applicationType,
        submittedOn: new Date().toLocaleString('en-IN', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        mobile: digits,
        gender: form.gender,
        city: form.city.trim(),
        state: form.state,
        duration: career?.duration || '',
        college: form.college.trim(),
        degree: form.degree,
        degreeOther: form.degree === 'Others' ? form.degreeOther.trim() : '',
        skills: form.skills.trim(),
        expectations: form.expectations.trim(),
      };
      // Paid opening: Cashfree gateway se payment, phir success page par redirect
      if (isPaid) {
        try {
          const order = await createCashfreeOrder({
            leadId: result.id,
            leadType: 'career',
            amount: Number(career.feeAmount),
            customerName: form.fullName.trim(),
            customerEmail: form.email.trim(),
            customerPhone: digits,
            itemTitle: openingTitle,
            applicationId: result.id,
          });
          // Success page par form data wapas lene ke liye snapshot save karo
          try {
            sessionStorage.setItem(`career_app_${order.orderId}`, JSON.stringify({ ...snapshot, id: result.id }));
          } catch { /* ignore */ }
          await startCashfreeCheckout(order.paymentSessionId);
          return; // redirect ho gaya
        } catch (payErr) {
          setErrors((prev) => ({
            ...prev,
            submit: (payErr.message || 'Payment could not be started.') + ' Your application is saved — please contact us if the amount was deducted.',
          }));
          setSubmitting(false);
          return;
        }
      }

      setSubmittedData(snapshot);
      setApplicationId(result.applicationId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: err.message || 'Submission failed. Please try again.' }));
    } finally {
      setSubmitting(false);
    }
  };

  const submissionDateDisplay = useMemo(
    () => new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
    []
  );

  // ---------- Success screen ----------
  if (applicationId) {
    return (
      <div className="pt-32 pb-24 bg-accent min-h-screen">
        <div className="container-section max-w-xl mx-auto">
          <div className="card-base bg-white p-8 sm:p-10 text-center">
            <div className="w-16 h-16 bg-green-100 border-2 border-green-300 mx-auto mb-5 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl text-secondary normal-case mb-3">
              Application submitted successfully!
            </h1>
            <p className="text-sm text-muted normal-case mb-6">
              Thank you for applying{openingTitle ? ` for ${openingTitle}` : ''}. Our team will
              review your application and contact you on your email / mobile.
            </p>
            {submittedData?.openingCode && (
              <div className="bg-accent border-2 border-secondary/15 px-5 py-3 mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">
                  {applicationType === 'job' ? 'Job ID' : 'Internship ID'}
                </p>
                <p className="font-mono font-bold text-secondary text-lg">{submittedData.openingCode}</p>
              </div>
            )}
            <div className="bg-accent border-2 border-primary/30 px-5 py-4 mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">
                Your Application ID
              </p>
              <p className="font-mono font-bold text-primary text-xl break-all">{applicationId}</p>
            </div>
            <p className="text-xs text-muted normal-case mb-6">
              Submitted on {submissionDateDisplay} &bull; Keep your Application ID safe for future
              reference.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => downloadApplicationPDF(submittedData)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Download size={15} /> Download Form
              </button>
              <Link to="/careers" className="btn-secondary inline-flex items-center gap-2">
                <ArrowLeft size={15} /> Back to Careers
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Opening check chal raha hai
  if (!applicationId && checkingOpenings) {
    return (
      <>
        <Helmet>
          <title>{SECTION_HEADING[applicationType]} | {SITE.name}</title>
        </Helmet>
        <div className="pt-32 pb-24 bg-accent min-h-screen">
          <div className="container-section max-w-xl mx-auto">
            <div className="card-base bg-white p-10 text-center">
              <Loader2 size={30} className="animate-spin text-primary mx-auto mb-4" />
              <p className="text-sm text-muted normal-case">Checking available openings…</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Koi open opening nahi / di gayi opening closed — form band, not-hiring message
  if (!applicationId && openingBlocked) {
    return (
      <>
        <Helmet>
          <title>{SECTION_HEADING[applicationType]} | {SITE.name}</title>
          <meta name="description" content={`Careers at ${SITE.name} — currently no open internship or job positions.`} />
        </Helmet>
        <div className="pt-32 pb-24 bg-accent min-h-screen">
          <div className="container-section max-w-xl mx-auto">
            <div className="card-base bg-white p-10 sm:p-14 text-center">
              <div className="w-16 h-16 bg-accent border-2 border-secondary/15 mx-auto mb-5 flex items-center justify-center">
                <Briefcase size={28} className="text-muted" />
              </div>
              <h2 className="text-xl sm:text-2xl text-secondary normal-case mb-3">
                We are currently not hiring
              </h2>
              {openingSlug && career === null ? (
                <p className="text-sm text-muted leading-relaxed normal-case mb-2">
                  This opening is no longer available or the link is incorrect.
                </p>
              ) : (
                <p className="text-sm text-muted leading-relaxed normal-case mb-2">
                  There are no open positions right now, but we are always happy to hear from motivated
                  people.
                </p>
              )}
              <p className="text-sm text-muted leading-relaxed normal-case mb-6">
                Want more information or want to share your profile for future openings?{' '}
                <Link to="/Contect-us" className="text-primary font-bold hover:underline">
                  Contact us
                </Link>
                .
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/careers" className="btn-secondary inline-flex items-center gap-2">
                  <ArrowLeft size={15} /> Back to Careers
                </Link>
                <Link to="/Contect-us" className="btn-primary inline-flex items-center gap-2">
                  Contact Us <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{SECTION_HEADING[applicationType]} | {SITE.name}</title>
        <meta name="description" content={`Apply online — ${SECTION_HEADING[applicationType]} at ${SITE.name}.`} />
      </Helmet>

      <div className="pt-32 pb-20 bg-accent min-h-screen">
        <div className="container-section max-w-3xl mx-auto">
          <Link
            to="/careers"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft size={14} /> Back to Careers
          </Link>

          {/* Header */}
          <div className="mb-7">
            <h1 className="text-secondary text-3xl sm:text-4xl font-heading mb-2">
              {SECTION_HEADING[applicationType]}
            </h1>
            {careerLoading ? (
              <p className="text-sm text-muted normal-case">Loading opening details…</p>
            ) : openingTitle ? (
              <div className="space-y-2">
                <p className="text-sm text-muted normal-case">
                  Applying for: <b className="text-secondary">{openingTitle}</b>
                  {career?.location ? ` — ${career.location}` : ''}
                  {career?.feeType === 'paid' ? ` — Application Fee \u20b9${career.feeAmount} (payable at next step)` : ' — Free to apply'}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {career?.careerCode && (
                    <span className="text-[10px] font-mono font-bold text-primary border-2 border-primary/30 px-2 py-1">
                      Opening ID: {career.careerCode}
                    </span>
                  )}
                  {career?.domain && (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted border-2 border-secondary/15 px-2 py-1">
                      {career.domain}
                    </span>
                  )}
                  {career?.startDate && career?.endDate && (
                    <span className="text-[10px] font-bold text-secondary border-2 border-secondary/15 px-2 py-1 normal-case">
                      {new Date(career.startDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      {' — '}
                      {new Date(career.endDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted normal-case">General application</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Section 1 — Personal Information */}
            <FormSection number={1} title="Personal Information">
              <FormField id="fullName" label="1. Name" error={errors.fullName} required>
                <input name="fullName" value={form.fullName} onChange={handleChange} className={inputClass} placeholder="Your full name" />
              </FormField>
              <FormField id="email" label="2. Email" error={errors.email} required>
                <input type="email" name="email" value={form.email} onChange={handleChange} className={inputClass} placeholder="you@example.com" />
              </FormField>
              <FormField id="mobile" label="3. Mobile No." error={errors.mobile} required>
                <input type="tel" name="mobile" value={form.mobile} onChange={handleChange} className={inputClass} placeholder="10-digit mobile number" />
              </FormField>
              <FormField id="gender" label="4. Gender" error={errors.gender} required>
                <select name="gender" value={form.gender} onChange={handleChange} className={inputClass}>
                  <option value="">Select gender</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </FormField>
              <FormField id="city" label="5. City" error={errors.city} required>
                <input name="city" value={form.city} onChange={handleChange} className={inputClass} placeholder="Your city" />
              </FormField>
              <FormField id="state" label="6. State" error={errors.state} required>
                <select name="state" value={form.state} onChange={handleChange} className={inputClass}>
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </FormField>
            </FormSection>

            {/* Section 2 — Internship Preferences (internship only) */}
            {isInternship && (
              <FormSection number={2} title="Internship Preferences">
                <FormField id="duration" label="7. Internship Duration" required>
                  <input
                    value={career?.duration || 'As per opening'}
                    readOnly
                    disabled
                    className={`${inputClass} bg-accent text-muted cursor-not-allowed`}
                  />
                  <p className="mt-1.5 text-[11px] text-muted normal-case">Duration is fixed for this opening (set by our team).</p>
                </FormField>
                <FormField id="mode" label="8. Preferred Mode" required>
                  <input value="Online" readOnly disabled className={`${inputClass} bg-accent text-muted cursor-not-allowed`} />
                  <p className="mt-1.5 text-[11px] text-muted normal-case">This internship is conducted online (fixed).</p>
                </FormField>

              </FormSection>
            )}

            {/* Section 3 — Education & Skills */}
            <FormSection number={isInternship ? 3 : 2} title="Education & Skills">
              <FormField id="college" label="10. University / College Name" error={errors.college} required>
                <input name="college" value={form.college} onChange={handleChange} className={inputClass} placeholder="e.g. AKTU, Lucknow" />
              </FormField>
              <FormField id="degree" label="11. Degree / Program" error={errors.degree} required>
                <select name="degree" value={form.degree} onChange={handleChange} className={inputClass}>
                  <option value="">Select degree</option>
                  {DEGREE_OPTIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </FormField>
              {form.degree === 'Others' && (
                <FormField id="degreeOther" label="Specify Degree / Program" error={errors.degreeOther} required>
                  <input name="degreeOther" value={form.degreeOther} onChange={handleChange} className={inputClass} placeholder="Write your degree / program name" />
                </FormField>
              )}
              <FormField id="skills" label="12. Skills" error={errors.skills} required>
                <textarea name="skills" rows={3} value={form.skills} onChange={handleChange} className={`${inputClass} resize-y`} placeholder="Example: HTML, CSS, JavaScript, React, Python, Canva, etc." />
              </FormField>
            </FormSection>

            {/* Section 4 — Resume */}
            <FormSection number={isInternship ? 4 : 3} title="Resume">
              <FormField id="resume" label="13. Resume" error={errors.resume} required>
                <p className="text-[11px] text-muted normal-case mb-2.5">
                  Max 5 MB &bull; PDF or DOCX only &bull; Stored securely, visible only to our hiring team.
                </p>
                {resume ? (
                  <div className="flex items-center justify-between gap-3 border-2 border-primary/40 bg-primary/5 px-4 py-3">
                    <span className="flex items-center gap-2.5 text-sm text-secondary normal-case min-w-0">
                      <FileText size={16} className="text-primary shrink-0" />
                      <span className="truncate">{resume.name}</span>
                      <span className="text-xs text-muted shrink-0">({(resume.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </span>
                    <button type="button" onClick={clearResume} className="text-muted hover:text-primary transition-colors shrink-0" title="Remove file">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-3 border-2 border-dashed border-secondary/25 px-4 py-4 text-sm text-muted cursor-pointer hover:border-primary transition-colors">
                    <UploadCloud size={18} className="text-primary shrink-0" />
                    Click to upload resume (PDF / DOCX)
                    <input id="resume-input" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={handleResumeChange} />
                  </label>
                )}
              </FormField>
            </FormSection>

            {/* Section 5 — Expectations */}
            <FormSection number={isInternship ? 5 : 4} title="Internship/Job Expectations">
              <FormField
                id="expectations"
                label="14. What do you expect to learn during this internship/job?"
                error={errors.expectations}
                required
              >
                <textarea name="expectations" rows={4} value={form.expectations} onChange={handleChange} className={`${inputClass} resize-y`} placeholder="Write 2-4 lines about your learning goals…" />
              </FormField>
            </FormSection>

            {/* Section 6 — Declaration & Consent */}
            <FormSection number={isInternship ? 6 : 5} title="Declaration & Consent">
              <Declaration
                name="dec1"
                text="I confirm that the information provided by me is accurate."
                checked={form.dec1}
                onChange={handleChange}
                error={errors.dec1}
              />
              <Declaration
                name="dec2"
                text="I agree to follow NexRNN Technologies' internship policies and guidelines."
                checked={form.dec2}
                onChange={handleChange}
                error={errors.dec2}
              />
              <Declaration
                name="dec3"
                text="I understand that submission of this form does not guarantee selection."
                checked={form.dec3}
                onChange={handleChange}
                error={errors.dec3}
              />
              <Declaration
                name="dec4"
                text="I consent to NexRNN Technologies contacting me regarding my internship application."
                checked={form.dec4}
                onChange={handleChange}
                error={errors.dec4}
              />
            </FormSection>

            {/* Submit error */}
            {errors.submit && (
              <div className="border-2 border-red-300 bg-red-50 text-red-700 px-4 py-3 text-sm normal-case">
                {errors.submit}
              </div>
            )}

            {/* Submit */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Submitting…</>
                ) : (
                  <><ShieldCheck size={16} /> Submit Application</>
                )}
              </button>
              <p className="text-xs text-muted normal-case">
                Application ID will be generated automatically after submission.
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

/* ---------- Small building blocks ---------- */

function FormSection({ number, title, children }) {
  return (
    <div className="card-base bg-white p-6 sm:p-7">
      <h2 className="text-base font-bold text-secondary uppercase tracking-wide border-l-4 border-primary pl-3 mb-5">
        Section {number} — {title}
      </h2>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function FormField({ id, label, error, required = false, children }) {
  return (
    <div id={`field-${id}`}>
      <label className={labelClass}>
        {label} {required && <span className="text-primary">*</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs font-semibold text-red-600 normal-case">{error}</p>}
    </div>
  );
}

function Declaration({ name, text, checked, onChange, error }) {
  return (
    <div>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          name={name}
          checked={checked || false}
          onChange={onChange}
          className="w-5 h-5 accent-primary mt-0.5 shrink-0"
        />
        <span className="text-sm text-secondary normal-case leading-relaxed">{text}</span>
      </label>
      {error && <p className="mt-1 text-xs font-semibold text-red-600 normal-case">{error}</p>}
    </div>
  );
}
