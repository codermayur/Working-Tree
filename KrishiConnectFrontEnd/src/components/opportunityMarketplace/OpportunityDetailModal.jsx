import React from 'react';
import { X, MapPin, Users, Clock, BadgeCheck, Sparkles, IndianRupee, Phone, MessageCircle } from 'lucide-react';
import OpportunityTypeIcon from './OpportunityTypeIcon';
import { formatShortDate, getTypeLabel } from './opportunityUtils';

function InfoPill({ icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300">
      {icon}
      {children}
    </span>
  );
}

export default function OpportunityDetailModal({ item, onClose, onPrimaryAction, onViewApplicants, isOwner }) {
  if (!item) return null;
  const typeLabel = getTypeLabel(item.type);
  const showViewApplicants = isOwner ?? !!item.isOwner;

  return (
    <div className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-100 dark:border-gray-800 overflow-hidden my-6">
        <div className="relative">
          <div className="h-52 w-full overflow-hidden">
            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 inline-flex items-center justify-center w-9 h-9 rounded-full bg-black/35 hover:bg-black/50 text-white"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-600/90 text-white shadow-sm">
                <OpportunityTypeIcon type={item.type} className="w-3.5 h-3.5" />
                {typeLabel}
              </span>
              {item.urgent && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-red-500/90 text-white shadow-sm">
                  <Sparkles className="w-3 h-3" />
                  Urgent
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
              {item.title}
            </h2>
            <div className="mt-1 flex items-center gap-2 text-xs text-emerald-50/90">
              <MapPin className="w-3.5 h-3.5 text-amber-200" />
              <span className="truncate">{item.location}</span>
              <span className="opacity-60">•</span>
              <span className="inline-flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5" /> {item.priceLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Full description
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {item.description || '—'}
              </p>
            </div>

            {Array.isArray(item.raw?.requirements) && item.raw.requirements.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Requirements
                </p>
                <div className="flex flex-wrap gap-2">
                  {item.raw.requirements.map((r) => (
                    <span
                      key={r}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                    >
                      <BadgeCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="bg-gray-50 dark:bg-gray-950/30 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                Farmer / Owner
              </p>
              <div className="mt-2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold">
                  {(item.owner?.name || 'F')[0]?.toUpperCase?.() || 'F'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">
                    {item.owner?.name || 'Farmer'}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Verified profile details inside Khetibari
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {item.workersRequired ? (
                <InfoPill icon={<Users className="w-3.5 h-3.5 text-emerald-500" />}>
                  {item.workersRequired} workers
                </InfoPill>
              ) : null}
              {item.startDate ? (
                <InfoPill icon={<Clock className="w-3.5 h-3.5 text-emerald-500" />}>
                  From {formatShortDate(item.startDate)}
                </InfoPill>
              ) : null}
              {item.raw?.foodIncluded ? (
                <InfoPill icon={<span className="text-emerald-600 font-bold">🍲</span>}>Food included</InfoPill>
              ) : null}
              {item.raw?.stayIncluded ? (
                <InfoPill icon={<span className="text-emerald-600 font-bold">🏠</span>}>Stay included</InfoPill>
              ) : null}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                Contact & actions
              </p>
              {showViewApplicants ? (
                <>
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                    You posted this opportunity. View and manage applications below.
                  </p>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => onViewApplicants?.(item)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 shadow-sm"
                    >
                      <Users className="w-4 h-4" />
                      View applicants
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                    You can apply here; the owner can contact you via the selected method.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onPrimaryAction?.(item)}
                      className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 shadow-sm"
                    >
                      {item.type === 'job' ? 'Apply' : 'Rent now / Request'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onPrimaryAction?.(item)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <Phone className="w-4 h-4 text-emerald-600" /> Call
                    </button>
                    <button
                      type="button"
                      onClick={() => onPrimaryAction?.(item)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600" /> Chat
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

