import React, { useRef, useState } from 'react';
import { X, CheckCircle2, Loader, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { opportunityService } from '../../services/opportunity.service';
import { chatService } from '../../services/chat.service';

const MAX_ID_PROOF_BYTES = 5 * 1024 * 1024; // 5MB

export default function ApplyOpportunityModal({ item, onClose, onSubmitted }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    govtIdNumber: '',
    experienceYears: '',
    experience: '',
    skills: '',
    idProofUrl: '',
    idProofName: '',
    confirm: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const setField = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleToggleConfirm = () =>
    setForm((prev) => ({ ...prev, confirm: !prev.confirm }));

  const handlePickFile = () => {
    fileInputRef.current?.click?.();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only image (JPG/PNG) or PDF files are allowed.');
      return;
    }
    if (file.size > MAX_ID_PROOF_BYTES) {
      toast.error('ID proof is too large. Max size is 5MB.');
      return;
    }

    setUploading(true);
    try {
      const uploaded = await chatService.uploadMedia(file);
      const url = uploaded?.url ?? uploaded;
      if (!url) {
        throw new Error('Upload failed');
      }
      setForm((prev) => ({
        ...prev,
        idProofUrl: url,
        idProofName: file.name,
      }));
      toast.success('ID proof uploaded');
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to upload ID proof';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    const name = form.name.trim();
    const phone = form.phone.trim();
    const govtIdNumber = form.govtIdNumber.trim();
    const skills = form.skills.trim();
    const experienceYears = Number(form.experienceYears || '0');

    if (!name || !phone || !govtIdNumber || !skills) {
      toast.error('Please fill all required fields.');
      return;
    }
    if (!/^[0-9]{10}$/.test(phone)) {
      toast.error('Phone number must be 10 digits.');
      return;
    }
    if (Number.isNaN(experienceYears) || experienceYears < 0) {
      toast.error('Experience (years) must be a valid number.');
      return;
    }
    if (!form.idProofUrl) {
      toast.error('Please upload your government ID proof.');
      return;
    }
    if (!form.confirm) {
      toast.error('Please confirm that the information is correct.');
      return;
    }

    setSubmitting(true);
    try {
      await opportunityService.apply(item._id, {
        name,
        phone,
        govtIdNumber,
        experienceYears,
        experience: form.experience.trim(),
        skills,
        idProofUrl: form.idProofUrl,
        confirm: true,
      });
      setDone(true);
      onSubmitted?.();
      setTimeout(() => onClose?.(), 1400);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to submit';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-full sm:max-w-lg border border-gray-100 dark:border-gray-800 overflow-hidden max-h-[90vh]">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
              {item.type === 'job' ? 'Apply to opportunity' : 'Request rental'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
              {item.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-300"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="py-10 px-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
              Submitted successfully
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              The owner will review your request.
            </p>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
                    Full name<span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={setField('name')}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
                    Phone number<span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.phone}
                    onChange={setField('phone')}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
                    Aadhaar / Govt ID number<span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.govtIdNumber}
                    onChange={setField('govtIdNumber')}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                    placeholder="Will be securely stored"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
                    Experience (years)<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.experienceYears}
                    onChange={setField('experienceYears')}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                    placeholder="e.g. 3"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  Skill type<span className="text-red-500">*</span>
                </label>
                <input
                  value={form.skills}
                  onChange={setField('skills')}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
                  placeholder="e.g. Sugarcane harvesting, tractor driving"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  Experience details (optional)
                </label>
                <textarea
                  value={form.experience}
                  onChange={setField('experience')}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700 resize-none h-20"
                  placeholder="Share any important details about your work history…"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                  Upload ID proof (image / PDF)<span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePickFile}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-[11px] font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    {uploading ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {form.idProofUrl ? 'Replace file' : 'Upload ID proof'}
                  </button>
                  {form.idProofName ? (
                    <span className="text-[11px] text-gray-600 dark:text-gray-300 truncate">
                      {form.idProofName}
                    </span>
                  ) : (
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      Max 5MB, clear government ID only.
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleToggleConfirm}
                  className="mt-0.5 w-4 h-4 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center bg-white dark:bg-gray-800"
                >
                  {form.confirm && (
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />
                  )}
                </button>
                <p className="text-[11px] text-gray-600 dark:text-gray-300">
                  I confirm that the information provided is correct and I agree for my
                  government ID details to be used only for safety verification.
                </p>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || uploading}
                onClick={submit}
                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold py-2 shadow-sm"
              >
                {submitting ? 'Submitting…' : 'Submit application'}
              </button>
            </div>
          </>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

