import React, { useEffect, useState } from 'react';
import { X, Loader, CheckCircle2, XCircle, ShieldCheck, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { opportunityService } from '../../services/opportunity.service';

function StatusBadge({ status }) {
  const styles =
    status === 'accepted'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-800'
      : status === 'rejected'
      ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800'
      : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800';
  return (
    <span className={`inline-flex px-2 py-1 rounded-full text-[11px] font-semibold border ${styles}`}>
      {status}
    </span>
  );
}

export default function ApplicantsModal({ opportunityId, title, onClose }) {
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await opportunityService.getApplicationsForOpportunity(opportunityId);
        setApps(res.applications || []);
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to load applicants');
      } finally {
        setLoading(false);
      }
    };
    if (opportunityId) load();
  }, [opportunityId]);

  const updateStatus = async (applicationId, status) => {
    try {
      await opportunityService.updateApplicationStatus(opportunityId, applicationId, status);
      setApps((prev) => prev.map((a) => (a._id === applicationId ? { ...a, status } : a)));
      toast.success(`Marked as ${status}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update');
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-100 dark:border-gray-800 overflow-hidden my-6">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
              Applications received
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
              {title}
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

        <div className="p-5">
          {loading ? (
            <div className="py-10 flex items-center justify-center">
              <Loader className="w-5 h-5 animate-spin text-emerald-600" />
            </div>
          ) : apps.length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-4xl mb-2">📩</div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                No applications yet
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                When someone applies, you’ll see them here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {apps.map((a) => (
                <div
                  key={a._id}
                className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">
                        {a.name}
                      </p>
                    <div className="mt-1 space-y-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                      {a.phone && (
                        <p className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{a.phone}</span>
                        </p>
                      )}
                      {typeof a.experienceYears === 'number' && !Number.isNaN(a.experienceYears) && (
                        <p>
                          Experience:{' '}
                          <span className="font-medium text-gray-700 dark:text-gray-200">
                            {a.experienceYears} year{a.experienceYears === 1 ? '' : 's'}
                          </span>
                        </p>
                      )}
                      {a.skills && (
                        <p className="whitespace-pre-line">
                          Skills: <span className="font-medium text-gray-700 dark:text-gray-200">{a.skills}</span>
                        </p>
                      )}
                    </div>
                    </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {a.aadhaarLast4 && a.idProofUrl && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Govt ID verified • ****{a.aadhaarLast4}
                      </span>
                    )}
                    <StatusBadge status={a.status} />
                  </div>
                  </div>
                {a.experience && (
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 whitespace-pre-line">
                    {a.experience}
                  </div>
                )}
                  {a.status === 'pending' && (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateStatus(a._id, 'accepted')}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(a._id, 'rejected')}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <XCircle className="w-4 h-4 text-red-500" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

