import React from 'react';
import { Link } from 'react-router-dom';
import { Landmark } from 'lucide-react';

const categoryClassMap = {
  'Income Support': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  Credit: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  'Crop Insurance': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  'Soil Management': 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200',
  Marketing: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  Infrastructure: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
  'Organic Farming': 'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-200',
  Irrigation: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200',
  Default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

export default function RelatedSchemes({ schemes, currentSchemeId }) {
  const list = (schemes || []).filter((s) => s.id !== currentSchemeId).slice(0, 4);
  if (list.length === 0) return null;

  return (
    <section className="animate-[fadeIn_0.5s_ease-out_0.15s_both]">
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Related Schemes</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {list.map((scheme) => {
          const slug = scheme.slug || scheme.id;
          const categoryClass = categoryClassMap[scheme.category] || categoryClassMap.Default;
          return (
            <Link
              key={scheme.id}
              to={`/schemes/${slug}`}
              className="group flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg hover:border-green-200 dark:hover:border-green-800 transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Landmark className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${categoryClass}`}>
                  {scheme.category}
                </span>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  {scheme.name}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
