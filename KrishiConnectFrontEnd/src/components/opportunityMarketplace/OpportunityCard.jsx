import React from 'react';
import { MapPin, IndianRupee, Star, Sparkles, Users, Clock, Trash2 } from 'lucide-react';
import OpportunityTypeIcon from './OpportunityTypeIcon';
import { formatShortDate, getTypeLabel } from './opportunityUtils';

const FALLBACK_IMAGES = {
  job: 'https://images.unsplash.com/photo-1592982537447-9fea6aff1093?w=800&auto=format&fit=crop&q=80',
  equipment:
    'https://images.unsplash.com/photo-1614358145930-2a892f54a5f0?w=800&auto=format&fit=crop&q=80',
  cattle:
    'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800&auto=format&fit=crop&q=80',
};

export default function OpportunityCard({ item, onOpen, onPrimaryAction, onDelete, deleting, isOwner }) {
  const typeLabel = getTypeLabel(item.type);
  const hasDistance = typeof item.distanceKm === 'number' && Number.isFinite(item.distanceKm);
  const showViewApplicants = isOwner ?? !!item.isOwner;

  const handleImageError = (e) => {
    const img = e.target;
    if (img.dataset.fallbackApplied === 'true') return;
    img.dataset.fallbackApplied = 'true';
    const key = item.type && FALLBACK_IMAGES[item.type] ? item.type : 'job';
    img.src = FALLBACK_IMAGES[key];
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(item)}
      onKeyDown={(e) => (e.key === 'Enter' ? onOpen?.(item) : null)}
      className="group cursor-pointer bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.02] transition-transform transition-shadow duration-200 overflow-hidden focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700"
    >
      <div className="relative h-40 w-full overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={handleImageError}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-1.5">
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
        {Number(item.ratingCount) > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[11px] font-medium text-amber-100 bg-black/40 backdrop-blur px-2 py-1.5 rounded-full">
            <Star className="w-3.5 h-3.5 text-amber-300" />
            <span>
              {Number(item.ratingAverage || 0).toFixed(1)} ({item.ratingCount})
            </span>
          </div>
        )}

        {typeof onDelete === 'function' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item);
            }}
            disabled={!!deleting}
            className="absolute top-3 right-3 inline-flex items-center justify-center w-9 h-9 rounded-full bg-black/40 hover:bg-black/55 text-white disabled:opacity-60"
            title="Delete opportunity"
            aria-label="Delete opportunity"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-50 text-sm line-clamp-2">
              {item.title}
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              {item.description}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 text-xs">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span className="truncate">{item.location}</span>
              {hasDistance && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                    ~{Math.round(item.distanceKm)} km away
                  </span>
                </>
              )}
            </div>
            {item.owner?.name && (
              <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                by <span className="font-medium text-gray-600 dark:text-gray-300">{item.owner.name}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300 flex-shrink-0">
            <IndianRupee className="w-3.5 h-3.5" />
            <span>{item.priceLabel}</span>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-2 min-w-0">
            {item.workersRequired ? (
              <span className="inline-flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-500" />
                {item.workersRequired} workers
              </span>
            ) : null}
            {item.startDate ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                From {formatShortDate(item.startDate)}
              </span>
            ) : null}
          </div>
          {Number(item.applicantsCount) > 0 ? (
            <span className="inline-flex items-center gap-1 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-full border border-gray-100 dark:border-gray-700 flex-shrink-0">
              <Users className="w-3 h-3 text-emerald-500" />
              {item.applicantsCount} applied
            </span>
          ) : (
            <span className="text-transparent select-none">.</span>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrimaryAction?.(item);
            }}
            className="flex-1 inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 shadow-sm transition-colors"
          >
            {showViewApplicants ? 'View applicants' : (item.type === 'job' ? 'Apply' : 'Rent / Request')}
          </button>
        </div>
      </div>
    </div>
  );
}

