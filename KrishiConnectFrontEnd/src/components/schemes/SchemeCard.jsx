import React from 'react';
import { Landmark, ExternalLink, Bookmark, Share2 } from 'lucide-react';
import { isExternalUrl } from '../../services/schemes.service';

const CATEGORY_COLORS = {
  'Income Support': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  'Credit': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  'Crop Insurance': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  'Soil & Inputs': 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200',
  'Soil Management': 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200',
  'Subsidy': 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
  'Credit Subsidy': 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
  'Irrigation': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200',
  'Organic Farming': 'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-200',
  'Organic Certification': 'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-200',
  'Market': 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  'Marketing': 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  'Infrastructure': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
  'Development': 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
  'Renewable Energy': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  'Pension': 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  'Farmer Organizations': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  'Livestock': 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
  'Livestock Development': 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
  'Livestock Credit': 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
  'Horticulture': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  'Water Management': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200',
  'Water Conservation': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200',
  'Natural Farming': 'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-200',
  'Price Support': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  'Price Policy': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  'Insurance': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  'Dairy': 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  'Fisheries': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  'Training': 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
  'Education': 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
  'Rural Employment': 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  'Health Insurance': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  'Life Insurance': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  'Accident Insurance': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  'Housing': 'bg-stone-100 text-stone-800 dark:bg-stone-900/40 dark:text-stone-200',
};

export default function SchemeCard({ scheme, onView, onApply, onBookmark, onShare, compact }) {
  const categoryClass = CATEGORY_COLORS[scheme.category] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  const isExternal = isExternalUrl(scheme.redirect_url);

  const handleView = (e) => {
    e?.stopPropagation();
    if (onView) onView(scheme);
    else if (scheme.redirect_url) {
      if (isExternal) window.open(scheme.redirect_url, '_blank', 'noopener,noreferrer');
      else window.location.href = scheme.redirect_url;
    }
  };

  const handleApply = (e) => {
    e?.stopPropagation();
    if (onApply) onApply(scheme);
    else if (scheme.redirect_url) {
      if (isExternal) window.open(scheme.redirect_url, '_blank', 'noopener,noreferrer');
      else window.location.href = scheme.redirect_url;
    }
  };

  const shareWhatsApp = (e) => {
    e?.stopPropagation();
    if (onShare) onShare(scheme);
    else {
      const text = encodeURIComponent(`${scheme.name} - ${scheme.redirect_url || ''}`);
      window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <article
      className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden focus-within:ring-2 focus-within:ring-green-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-gray-900"
      style={{ borderRadius: '16px' }}
    >
      {/* Gradient top border on hover */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <Landmark className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex items-center gap-1">
            {scheme.trending && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                Trending
              </span>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onBookmark?.(scheme); }}
              className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition"
              aria-label="Save scheme"
            >
              <Bookmark className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={shareWhatsApp}
              className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition"
              aria-label="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <h3 className="mt-3 font-semibold text-gray-900 dark:text-gray-100 text-base line-clamp-2">
          {scheme.name}
        </h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
          {scheme.description || 'Government scheme for farmers.'}
        </p>
        <div className="mt-3">
          <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-medium ${categoryClass}`}>
            {scheme.category}
          </span>
        </div>

        {!compact && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleView}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              View Details
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-sm hover:from-green-700 hover:to-emerald-700 transition"
            >
              Apply Now
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
