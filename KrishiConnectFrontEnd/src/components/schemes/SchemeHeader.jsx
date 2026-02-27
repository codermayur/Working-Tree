import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Landmark, ExternalLink } from 'lucide-react';
import { isExternalUrl } from '../../services/schemes.service';

const categoryClassMap = {
  'Income Support': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  Credit: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  'Crop Insurance': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  'Soil Management': 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200',
  'Credit Subsidy': 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
  Irrigation: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200',
  'Organic Farming': 'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-200',
  'Organic Certification': 'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-200',
  Marketing: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  Infrastructure: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
  'Renewable Energy': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  Pension: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  'Farmer Organizations': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  Livestock: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
  'Livestock Development': 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
  'Livestock Credit': 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
  Horticulture: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  'Water Management': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200',
  'Water Conservation': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200',
  'Natural Farming': 'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-200',
  'Price Support': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  'Price Policy': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  Insurance: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  Dairy: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  Fisheries: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  Training: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
  Education: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
  'Rural Employment': 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  'Health Insurance': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  'Life Insurance': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  'Accident Insurance': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  Housing: 'bg-stone-100 text-stone-800 dark:bg-stone-900/40 dark:text-stone-200',
  'Allied Activities': 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200',
  'Sustainable Farming': 'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-200',
  'Micro Irrigation': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200',
  Mechanization: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
  Oilseeds: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  'Agro Forestry': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  'Agricultural Growth': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  'Fertilizer Management': 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
  'Crop Management': 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200',
  'Food Crops': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  Seeds: 'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-200',
  'Climate Resilience': 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  'Farmer Training': 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
  Awareness: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  'Pest Control': 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
  Pulses: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  Poultry: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
  'Post Harvest': 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  Storage: 'bg-stone-100 text-stone-800 dark:bg-stone-900/40 dark:text-stone-200',
  Entrepreneurship: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
  Innovation: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
  'Supply Chain': 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200',
  'Digital Agriculture': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  'Digital Advisory': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200',
  'Digital Farming': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  'Women Farmers': 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-200',
  'Special Crops': 'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-200',
  Inputs: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  'Climate Change': 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  Exports: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  Default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

export default function SchemeHeader({ scheme, onApply }) {
  const navigate = useNavigate();
  const categoryClass = categoryClassMap[scheme?.category] || categoryClassMap.Default;
  const isExternal = isExternalUrl(scheme?.redirect_url);

  const handleApply = () => {
    if (onApply) onApply(scheme);
    else if (scheme?.redirect_url) {
      if (isExternal) window.open(scheme.redirect_url, '_blank', 'noopener,noreferrer');
      else if (scheme.redirect_url.startsWith('/')) navigate(scheme.redirect_url);
    }
  };

  return (
    <header className="animate-[fadeIn_0.4s_ease-out]">
      <button
        type="button"
        onClick={() => navigate('/schemes')}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to schemes
      </button>
      <div className="flex flex-wrap items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 shadow-inner">
          <Landmark className="w-7 h-7 text-green-600 dark:text-green-400" />
        </div>
        <div className="min-w-0 flex-1">
          <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${categoryClass}`}>
            {scheme?.category}
          </span>
          <h1 className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
            {scheme?.name}
          </h1>
        </div>
        <div className="w-full sm:w-auto">
          <button
            type="button"
            onClick={handleApply}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg hover:from-green-700 hover:to-emerald-700 hover:shadow-xl transition-all duration-200"
          >
            Apply Now
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
