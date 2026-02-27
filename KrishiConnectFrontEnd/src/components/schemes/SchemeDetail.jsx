import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Landmark, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
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

function Accordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800 text-left font-semibold text-gray-900 dark:text-gray-100"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-300">{children}</div>}
    </div>
  );
}

export default function SchemeDetail({ scheme, relatedSchemes = [], onApply }) {
  const categoryClass = CATEGORY_COLORS[scheme.category] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  const isExternal = isExternalUrl(scheme.redirect_url);

  const handleApply = () => {
    if (onApply) onApply(scheme);
    else if (scheme.redirect_url) {
      if (isExternal) window.open(scheme.redirect_url, '_blank', 'noopener,noreferrer');
      else window.location.href = scheme.redirect_url;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
          <Landmark className="w-7 h-7 text-green-600 dark:text-green-400" />
        </div>
        <div className="min-w-0 flex-1">
          <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${categoryClass}`}>
            {scheme.category}
          </span>
          <h1 className="mt-2 text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {scheme.name}
          </h1>
          {scheme.description && (
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              {scheme.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleApply}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md hover:from-green-700 hover:to-emerald-700 transition"
        >
          Apply Now
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {Array.isArray(scheme.benefits) && scheme.benefits.length > 0 && (
        <Accordion title="Benefits" defaultOpen>
          <ul className="space-y-2">
            {scheme.benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </Accordion>
      )}

      {Array.isArray(scheme.eligibility) && scheme.eligibility.length > 0 && (
        <Accordion title="Eligibility">
          <ul className="space-y-2">
            {scheme.eligibility.map((e, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </Accordion>
      )}

      {Array.isArray(scheme.documents) && scheme.documents.length > 0 && (
        <Accordion title="Required Documents">
          <ul className="space-y-2">
            {scheme.documents.map((d, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </Accordion>
      )}

      {Array.isArray(scheme.faq) && scheme.faq.length > 0 && (
        <Accordion title="FAQ">
          <div className="space-y-4">
            {scheme.faq.map((item, i) => (
              <div key={i}>
                <p className="font-medium text-gray-900 dark:text-gray-100">{item.q}</p>
                <p className="mt-1 text-gray-600 dark:text-gray-400">{item.a}</p>
              </div>
            ))}
          </div>
        </Accordion>
      )}

      {relatedSchemes.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Related Schemes</h2>
          <ul className="space-y-2">
            {relatedSchemes.slice(0, 5).map((s) => (
              <li key={s.id}>
                <Link
                  to={`/schemes/${s.slug || s.id}`}
                  className="text-green-600 dark:text-green-400 hover:underline font-medium"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
