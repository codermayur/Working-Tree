import React, { useState, useEffect, useRef } from 'react';
import { Loader, CheckCircle, Award, ChevronRight, ChevronLeft, Info, FileText, Image } from 'lucide-react';
import { expertApplicationService, expertApplicationConstants } from '../../services/expertApplication.service';

const SectionCard = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-colors duration-200 ${className}`}>
    {children}
  </div>
);
const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/80 flex items-center gap-3">
    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
      <Icon size={16} className="text-green-700 dark:text-green-400" />
    </div>
    <div>
      <h2 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{title}</h2>
      {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const { EXPERTISE_AREAS, GOVERNMENT_ID_TYPES, ISSUING_AUTHORITY_CHIPS } = expertApplicationConstants;

const STEP_LABELS = ['Personal & Professional', 'Government Certificate', 'Additional Credentials', 'Review & Submit'];

const MAX_CERT_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_CERT_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

function getExperienceBadge(years) {
  const y = Number(years) || 0;
  if (y <= 3) return { label: 'Junior (1-3 yrs)', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' };
  if (y <= 8) return { label: 'Mid-level (4-8 yrs)', class: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300' };
  if (y <= 15) return { label: 'Senior (9-15 yrs)', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' };
  return { label: 'Expert (16+ yrs)', class: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' };
}

export default function ExpertUpgradeSection({ user, myApplication, onRefresh, onToast }) {
  const role = user?.role || 'farmer';
  const roleUpgradeStatus = user?.roleUpgradeStatus || 'none';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber?.replace(/\D/g, '').slice(-10) || '',
    expertiseArea: '',
    yearsOfExperience: '',
    specializedDomain: '',
    qualifications: '',
    currentOrganization: '',
    governmentIdType: '',
    governmentIdNumber: '',
    linkedInProfile: '',
    shortBio: '',
    certificateName: '',
    issuingAuthority: '',
    certificateNumber: '',
    issueDate: '',
    expiryDate: '',
    isLifelong: false,
    certificateFileUrl: '',
    certificateFile: null,
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user?.name) setForm((f) => ({ ...f, fullName: user.name }));
    if (user?.email) setForm((f) => ({ ...f, email: user.email }));
    if (user?.phoneNumber) setForm((f) => ({ ...f, phoneNumber: user.phoneNumber?.replace(/\D/g, '').slice(-10) || f.phoneNumber }));
  }, [user?.name, user?.email, user?.phoneNumber]);

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.fullName?.trim()) e.fullName = 'Full name is required';
    if (!form.email?.trim()) e.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.phoneNumber?.trim()) e.phoneNumber = 'Phone is required';
    if (!form.expertiseArea) e.expertiseArea = 'Select expertise area';
    const yrs = Number(form.yearsOfExperience);
    if (!form.yearsOfExperience || yrs < 1 || yrs > 50) e.yearsOfExperience = 'Years of experience is required and must be between 1 and 50';
    const spec = (form.specializedDomain || '').trim();
    if (spec.length < 10) e.specializedDomain = 'Please describe your specialized domain (min 10 characters)';
    if (spec.length > 200) e.specializedDomain = 'Specialized domain must be at most 200 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!(form.certificateName || '').trim()) e.certificateName = 'Certificate name is required (min 3 characters)';
    if ((form.certificateName || '').trim().length > 0 && (form.certificateName || '').trim().length < 3) e.certificateName = 'Certificate name must be at least 3 characters';
    if (!(form.issuingAuthority || '').trim()) e.issuingAuthority = 'Issuing authority is required (min 3 characters)';
    if (!(form.certificateNumber || '').trim()) e.certificateNumber = 'Certificate number is required (min 5 characters)';
    if ((form.certificateNumber || '').trim().length > 0 && (form.certificateNumber || '').trim().length < 5) e.certificateNumber = 'Certificate number must be at least 5 characters';
    if (!form.issueDate) e.issueDate = 'Issue date is required';
    if (form.issueDate && new Date(form.issueDate) > new Date()) e.issueDate = 'Issue date cannot be a future date';
    if (!form.isLifelong) {
      if (!form.expiryDate) e.expiryDate = 'Expiry date is required when certificate is not lifelong';
      else if (form.issueDate && new Date(form.expiryDate) <= new Date(form.issueDate)) e.expiryDate = 'Expiry date must be after the issue date';
      else if (new Date(form.expiryDate) < new Date()) e.expiryDate = 'Your certificate has expired. Please provide a valid certificate.';
    }
    if (!form.certificateFileUrl && !form.certificateFile) e.certificateFile = 'Please upload your certificate (PDF, JPG, or PNG, max 5MB)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e = {};
    if (!form.governmentIdType) e.governmentIdType = 'Select government ID type';
    if (!(form.governmentIdNumber || '').trim()) e.governmentIdNumber = 'Government ID number is required';
    if (!(form.shortBio || '').trim()) e.shortBio = 'Short bio is required';
    if ((form.shortBio || '').length > 500) e.shortBio = 'Short bio must be at most 500 characters';
    if (form.linkedInProfile && !/^https?:\/\/.+/i.test(form.linkedInProfile)) e.linkedInProfile = 'Enter a valid URL';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    setStep((s) => Math.min(4, s + 1));
  };

  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const handleCertificateFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_CERT_TYPES.includes(file.type)) {
      onToast?.('Invalid file type. Please upload a PDF, JPG, or PNG file.', 'error');
      setErrors((prev) => ({ ...prev, certificateFile: 'Only PDF, JPG, or PNG files are accepted.' }));
      return;
    }
    if (file.size > MAX_CERT_FILE_BYTES) {
      onToast?.('File size exceeds 5MB. Please compress your file and try again.', 'error');
      setErrors((prev) => ({ ...prev, certificateFile: 'File size exceeds 5MB. Please compress your file and try again.' }));
      return;
    }
    setErrors((prev) => ({ ...prev, certificateFile: '' }));
    set('certificateFile', file);
    set('certificateFileUrl', '');
  };

  const uploadCertificateThenSubmit = async () => {
    let certificateFileUrl = form.certificateFileUrl;
    if (form.certificateFile && !certificateFileUrl) {
      setUploadProgress(30);
      try {
        const res = await expertApplicationService.uploadCertificate(form.certificateFile);
        certificateFileUrl = res?.certificateFileUrl || res?.url;
        setUploadProgress(100);
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || 'Certificate upload failed';
        onToast?.(msg, 'error');
        setErrors((prev) => ({ ...prev, certificateFile: msg }));
        return;
      }
    }
    if (!certificateFileUrl) {
      setErrors((prev) => ({ ...prev, certificateFile: 'Please upload your certificate (PDF, JPG, or PNG, max 5MB).' }));
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      const payload = {
        fullName: form.fullName,
        email: form.email,
        phoneNumber: form.phoneNumber,
        expertiseArea: form.expertiseArea,
        yearsOfExperience: Number(form.yearsOfExperience),
        specializedDomain: form.specializedDomain.trim(),
        governmentApprovedCertificate: {
          certificateName: form.certificateName.trim(),
          issuingAuthority: form.issuingAuthority.trim(),
          certificateNumber: form.certificateNumber.trim(),
          issueDate: form.issueDate,
          expiryDate: form.isLifelong ? null : form.expiryDate,
          certificateFileUrl,
          isLifelong: !!form.isLifelong,
        },
        qualifications: form.qualifications || '',
        currentOrganization: form.currentOrganization || '',
        governmentIdType: form.governmentIdType,
        governmentIdNumber: form.governmentIdNumber,
        linkedInProfile: form.linkedInProfile || '',
        shortBio: form.shortBio.trim(),
      };
      await expertApplicationService.applyForExpert(payload);
      onToast?.('Application submitted successfully!', 'success');
      onRefresh?.();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to submit';
      onToast?.(msg, 'error');
      const details = err?.response?.data?.errors;
      if (Array.isArray(details)) {
        const e = {};
        details.forEach((d) => { e[d.field] = d.message; });
        setErrors(e);
      }
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = () => {
    if (!(form.shortBio || '').trim() || form.shortBio.length > 500) {
      setErrors({ shortBio: 'Short bio required (max 500 characters)' });
      return;
    }
    uploadCertificateThenSubmit();
  };

  // Already expert or admin
  if (role === 'expert' || role === 'admin') {
    return (
      <SectionCard>
        <SectionHeader icon={Award} title="Expert Access" subtitle="You have expert-level access on KrishiConnect" />
        <div className="px-5 sm:px-6 py-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
            <CheckCircle size={18} /> You are an expert
          </div>
        </div>
      </SectionCard>
    );
  }

  if (roleUpgradeStatus === 'approved') {
    return (
      <SectionCard>
        <SectionHeader icon={Award} title="Upgrade to Expert" subtitle="Your status" />
        <div className="px-5 sm:px-6 py-6 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800 font-semibold">
            <CheckCircle size={20} /> You are now an Expert!
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Refresh the page or re-login to see expert features.</p>
        </div>
      </SectionCard>
    );
  }

  if (roleUpgradeStatus === 'pending' && myApplication) {
    const badge = getExperienceBadge(myApplication.yearsOfExperience);
    return (
      <SectionCard>
        <SectionHeader icon={Award} title="Upgrade to Expert" subtitle="Application under review" />
        <div className="px-5 sm:px-6 py-5 space-y-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
            <Loader size={16} className="animate-spin" /> Under Review
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <p><strong>Applied:</strong> {myApplication.appliedAt ? new Date(myApplication.appliedAt).toLocaleDateString() : '—'}</p>
            <p><strong>Expertise:</strong> {myApplication.expertiseArea}</p>
            <p><strong>Experience:</strong> {myApplication.yearsOfExperience} years <span className={`ml-1 px-1.5 py-0.5 rounded text-xs font-medium ${badge.class}`}>{badge.label}</span></p>
            {myApplication.specializedDomain && <p><strong>Specialized domain:</strong> {myApplication.specializedDomain}</p>}
          </div>
        </div>
      </SectionCard>
    );
  }

  if (roleUpgradeStatus === 'rejected') {
    return (
      <SectionCard>
        <SectionHeader icon={Award} title="Upgrade to Expert" subtitle="Re-apply after rejection" />
        <div className="px-5 sm:px-6 py-5 space-y-4">
          {myApplication?.adminNote && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
              <strong>Reason:</strong> {myApplication.adminNote}
            </div>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400">You can submit a new application with updated information.</p>
          <button onClick={() => { setStep(1); onRefresh?.(); }} className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-700 dark:hover:bg-green-600 transition">Re-apply</button>
        </div>
      </SectionCard>
    );
  }

  const totalSteps = 4;
  const experienceBadge = getExperienceBadge(form.yearsOfExperience);

  return (
    <SectionCard>
      <SectionHeader icon={Award} title="Upgrade to Expert" subtitle="Apply to become a verified expert and help farmers" />
      <div className="px-5 sm:px-6 py-5 space-y-5">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition ${step >= s ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'}`} />
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">Step {step} of {totalSteps}: {STEP_LABELS[step - 1]}</p>

        {/* Step 1 — Personal & Professional */}
        {step === 1 && (
          <div className="space-y-4">
            {['fullName', 'email', 'phoneNumber'].map((field) => (
              <div key={field}>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">{field === 'fullName' ? 'Full Name' : field === 'email' ? 'Email' : 'Phone Number'}</label>
                <input
                  type={field === 'email' ? 'email' : 'text'}
                  value={form[field] || ''}
                  onChange={(e) => set(field, e.target.value)}
                  onBlur={() => step === 1 && validateStep1()}
                  className={`w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors[field] ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`}
                />
                {errors[field] && <p className="text-xs text-red-500 mt-0.5">{errors[field]}</p>}
              </div>
            ))}
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">Years of Experience (1–50)</label>
              <input
                type="number"
                min={1}
                max={50}
                value={form.yearsOfExperience || ''}
                onChange={(e) => set('yearsOfExperience', e.target.value)}
                onBlur={() => step === 1 && validateStep1()}
                className={`w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.yearsOfExperience ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`}
              />
              <p className="text-xs text-gray-400 mt-0.5">Total years actively working in your field</p>
              {form.yearsOfExperience && (
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-lg text-xs font-medium ${experienceBadge.class}`}>{experienceBadge.label}</span>
              )}
              {errors.yearsOfExperience && <p className="text-xs text-red-500 mt-0.5">{errors.yearsOfExperience}</p>}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">Expertise Area</label>
              <select
                value={form.expertiseArea}
                onChange={(e) => set('expertiseArea', e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.expertiseArea ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`}
              >
                <option value="">Select</option>
                {EXPERTISE_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              {errors.expertiseArea && <p className="text-xs text-red-500 mt-0.5">{errors.expertiseArea}</p>}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">Specialized Domain</label>
              <input
                type="text"
                value={form.specializedDomain || ''}
                onChange={(e) => set('specializedDomain', e.target.value)}
                onBlur={() => step === 1 && validateStep1()}
                placeholder="e.g. Drip Irrigation for Semi-Arid Regions"
                className={`w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.specializedDomain ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`}
              />
              <p className="text-xs text-gray-400 mt-0.5">Describe your specific niche within your expertise area (10–200 characters)</p>
              {errors.specializedDomain && <p className="text-xs text-red-500 mt-0.5">{errors.specializedDomain}</p>}
            </div>
          </div>
        )}

        {/* Step 2 — Government Certificate */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
              <Info size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <p className="text-xs text-blue-800 dark:text-blue-200">Only certificates issued by recognized government bodies are accepted (e.g. ICAR, NABARD, State Agriculture Departments, Ministry of Agriculture)</p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">Certificate Name</label>
              <input
                type="text"
                value={form.certificateName || ''}
                onChange={(e) => set('certificateName', e.target.value)}
                onBlur={() => step === 2 && validateStep2()}
                placeholder="e.g. Certified Crop Advisor, ICAR"
                className={`w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.certificateName ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`}
              />
              {errors.certificateName && <p className="text-xs text-red-500 mt-0.5">{errors.certificateName}</p>}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">Issuing Authority</label>
              <input
                type="text"
                value={form.issuingAuthority || ''}
                onChange={(e) => set('issuingAuthority', e.target.value)}
                onBlur={() => step === 2 && validateStep2()}
                placeholder="e.g. Indian Council of Agricultural Research (ICAR)"
                className={`w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.issuingAuthority ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`}
              />
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {ISSUING_AUTHORITY_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => set('issuingAuthority', chip)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30 border border-gray-200 dark:border-gray-600"
                  >
                    {chip}
                  </button>
                ))}
              </div>
              {errors.issuingAuthority && <p className="text-xs text-red-500 mt-0.5">{errors.issuingAuthority}</p>}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">Certificate Number</label>
              <input
                type="text"
                value={form.certificateNumber || ''}
                onChange={(e) => set('certificateNumber', e.target.value)}
                onBlur={() => step === 2 && validateStep2()}
                placeholder="Official certificate/license number"
                className={`w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.certificateNumber ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`}
              />
              {errors.certificateNumber && <p className="text-xs text-red-500 mt-0.5">{errors.certificateNumber}</p>}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">Issue Date</label>
              <input
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={form.issueDate || ''}
                onChange={(e) => set('issueDate', e.target.value)}
                onBlur={() => step === 2 && validateStep2()}
                className={`w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.issueDate ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`}
              />
              {errors.issueDate && <p className="text-xs text-red-500 mt-0.5">{errors.issueDate}</p>}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isLifelong"
                checked={!!form.isLifelong}
                onChange={(e) => set('isLifelong', e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="isLifelong" className="text-sm text-gray-700 dark:text-gray-300">This is a lifelong certificate (no expiry)</label>
            </div>
            {!form.isLifelong && (
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">Expiry Date</label>
                <input
                  type="date"
                  min={form.issueDate || undefined}
                  value={form.expiryDate || ''}
                  onChange={(e) => set('expiryDate', e.target.value)}
                  onBlur={() => step === 2 && validateStep2()}
                  className={`w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.expiryDate ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`}
                />
                {errors.expiryDate && <p className="text-xs text-red-500 mt-0.5">{errors.expiryDate}</p>}
              </div>
            )}
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">Upload Certificate (PDF, JPG, PNG — max 5MB)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/jpg,image/png"
                onChange={handleCertificateFileChange}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 dark:file:bg-green-900/30 dark:file:text-green-300"
              />
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
              {form.certificateFile && (
                <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  {form.certificateFile.type === 'application/pdf' ? <FileText size={14} /> : <Image size={14} />}
                  {form.certificateFile.name} — Ready to upload
                </p>
              )}
              {form.certificateFileUrl && !form.certificateFile && <p className="mt-1.5 text-xs text-green-600 dark:text-green-400">✓ Uploaded</p>}
              {errors.certificateFile && <p className="text-xs text-red-500 mt-0.5">{errors.certificateFile}</p>}
            </div>
          </div>
        )}

        {/* Step 3 — Additional Credentials */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">Government ID Type</label>
              <select value={form.governmentIdType} onChange={(e) => set('governmentIdType', e.target.value)} className={`w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.governmentIdType ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`}>
                <option value="">Select</option>
                {GOVERNMENT_ID_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.governmentIdType && <p className="text-xs text-red-500 mt-0.5">{errors.governmentIdType}</p>}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">Government ID Number</label>
              <input type="text" value={form.governmentIdNumber || ''} onChange={(e) => set('governmentIdNumber', e.target.value)} className={`w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.governmentIdNumber ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`} />
              {errors.governmentIdNumber && <p className="text-xs text-red-500 mt-0.5">{errors.governmentIdNumber}</p>}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">Qualifications / Certifications</label>
              <textarea value={form.qualifications || ''} onChange={(e) => set('qualifications', e.target.value)} rows={2} className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">Current Organization (optional)</label>
              <input type="text" value={form.currentOrganization || ''} onChange={(e) => set('currentOrganization', e.target.value)} className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">LinkedIn Profile (optional)</label>
              <input type="url" value={form.linkedInProfile || ''} onChange={(e) => set('linkedInProfile', e.target.value)} placeholder="https://linkedin.com/in/..." onBlur={() => step === 3 && validateStep3()} className={`w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.linkedInProfile ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`} />
              {errors.linkedInProfile && <p className="text-xs text-red-500 mt-0.5">{errors.linkedInProfile}</p>}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">Short Bio (max 500)</label>
              <textarea value={form.shortBio || ''} onChange={(e) => set('shortBio', e.target.value)} maxLength={500} rows={4} onBlur={() => step === 3 && validateStep3()} className={`w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.shortBio ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`} />
              <p className="text-xs text-gray-400 text-right">{(form.shortBio || '').length}/500</p>
              {errors.shortBio && <p className="text-xs text-red-500 mt-0.5">{errors.shortBio}</p>}
            </div>
          </div>
        )}

        {/* Step 4 — Review & Submit */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm space-y-1">
              <p><strong>Name:</strong> {form.fullName}</p>
              <p><strong>Email:</strong> {form.email}</p>
              <p><strong>Phone:</strong> {form.phoneNumber}</p>
              <p><strong>Expertise:</strong> {form.expertiseArea}</p>
              <p><strong>Experience:</strong> {form.yearsOfExperience} years <span className={`ml-1 px-1.5 py-0.5 rounded text-xs font-medium ${experienceBadge.class}`}>{experienceBadge.label}</span></p>
              <p><strong>Specialized domain:</strong> {form.specializedDomain}</p>
              <p><strong>Certificate:</strong> {form.certificateName} — {form.issuingAuthority} (#{form.certificateNumber})</p>
              <p><strong>Issue:</strong> {form.issueDate} {form.isLifelong ? '(Lifelong)' : `— Expiry: ${form.expiryDate}`}</p>
              <p><strong>Certificate file:</strong> 📄 {form.certificateFile?.name || 'Uploaded'} — {form.certificateFileUrl ? 'Uploaded ✓' : (form.certificateFile ? 'Ready ✓' : '—')}</p>
              <p><strong>Gov. ID:</strong> {form.governmentIdType} — {form.governmentIdNumber}</p>
              <p><strong>Bio:</strong> {(form.shortBio || '').slice(0, 100)}...</p>
            </div>
            <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" required className="mt-1 rounded border-gray-300" />
              I confirm all submitted information is accurate.
            </label>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {step > 1 && (
            <button type="button" onClick={handleBack} className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1">
              <ChevronLeft size={16} /> Back
            </button>
          )}
          <div className="flex-1" />
          {step < 4 ? (
            <button type="button" onClick={handleNext} className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-700 dark:hover:bg-green-600 flex items-center gap-1">
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 flex items-center gap-2">
              {loading ? <Loader size={14} className="animate-spin" /> : null} Submit Application
            </button>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
