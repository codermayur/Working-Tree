import React, { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Landmark, FileCheck } from 'lucide-react';

const SCHEMES_PREVIEW_COUNT = 4;
const SCHEMES_JSON_URL = '/data/schemes.json';

function SchemeCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 animate-pulse">
      <div className="flex items-start gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        </div>
      </div>
    </div>
  );
}

const SchemeCard = memo(function SchemeCard({ scheme, onApply }) {
  return (
    <article
      className="group rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
      style={{ animation: 'fadeSlideUp 0.35s ease both' }}
    >
      <div className="flex items-start gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
          <Landmark size={18} className="text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[12px] font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">
            {scheme.name}
          </h4>
          <span className="inline-block mt-1.5 text-[10px] font-bold py-0.5 px-2 rounded-md bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
            {scheme.category}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onApply}
        className="btn w-full mt-2.5 py-2 px-3 rounded-lg text-xs font-semibold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/50 flex items-center justify-center gap-1.5 transition-colors"
      >
        <FileCheck size={12} />
        Apply
      </button>
    </article>
  );
});

function SchemesPreview() {
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(SCHEMES_JSON_URL);
        if (!res.ok) throw new Error('Failed to load schemes');
        const data = await res.json();
        const list = Array.isArray(data.schemes) ? data.schemes : [];
        if (!cancelled) setSchemes(list.slice(0, SCHEMES_PREVIEW_COUNT));
      } catch (e) {
        if (!cancelled) {
          setError('Unable to load schemes');
          setSchemes([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleExploreAll = () => navigate('/schemes');
  const handleApply = (scheme) => {
    if (scheme.official_url) {
      window.open(scheme.official_url, '_blank', 'noopener,noreferrer');
    } else {
      navigate('/schemes');
    }
  };

  return (
    <div className="schemes-preview-widget">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-[13px] text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Landmark size={16} className="text-green-600 dark:text-green-400" />
          Government Schemes
        </h3>
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <SchemeCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="py-4 px-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-300">{error}</p>
        </div>
      ) : schemes.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-400 py-4 text-center">No schemes available.</p>
      ) : (
        <div className="space-y-2.5">
          {schemes.map((scheme, idx) => (
            <SchemeCard
              key={scheme.id ?? idx}
              scheme={scheme}
              onApply={() => handleApply(scheme)}
              style={{ animationDelay: `${idx * 0.05}s` }}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleExploreAll}
        className="btn w-full mt-3 py-2.5 rounded-xl text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/40 flex items-center justify-center gap-1.5 transition-colors"
      >
        Explore Schemes
      </button>
    </div>
  );
}

export default memo(SchemesPreview);
