import React, { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, Eye } from 'lucide-react';
import { opportunityService } from '../../services/opportunity.service';

const PREVIEW_LIMIT = 5;

const typeBadgeClass = {
  job: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300',
  equipment: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300',
  cattle: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300',
};

function OpportunityCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-md animate-pulse">
      <div className="h-24 bg-gray-200 dark:bg-gray-700" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-full mt-2" />
      </div>
    </div>
  );
}

const OpportunityCard = memo(function OpportunityCard({ item, onView }) {
  const type = item.type || 'job';
  const badgeClass = typeBadgeClass[type] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';

  return (
    <article
      className="group rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
      style={{ animation: 'fadeSlideUp 0.35s ease both' }}
    >
      <div className="relative h-24 overflow-hidden bg-gray-100 dark:bg-gray-700">
        <img
          src={item.imageUrl}
          alt=""
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <span
          className={`absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wide py-1 px-2 rounded-md ${badgeClass}`}
        >
          {type}
        </span>
      </div>
      <div className="p-3">
        <h4 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">
          {item.title}
        </h4>
        <p className="text-xs font-semibold text-green-600 dark:text-green-400 mt-1">{item.priceLabel}</p>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1 truncate">
          <MapPin size={10} className="flex-shrink-0" />
          {item.location}
        </p>
        <button
          type="button"
          onClick={() => onView(item._id)}
          className="btn w-full mt-2.5 py-2 px-3 rounded-lg text-xs font-semibold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/50 flex items-center justify-center gap-1.5 transition-colors"
        >
          <Eye size={12} />
          View
        </button>
      </div>
    </article>
  );
});

function OpportunitiesPreview() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { opportunities } = await opportunityService.list({ limit: PREVIEW_LIMIT });
        if (!cancelled) setList(Array.isArray(opportunities) ? opportunities : []);
      } catch (e) {
        if (!cancelled) {
          setError('Unable to load opportunities');
          setList([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleViewAll = () => navigate('/opportunities');
  const handleViewOne = () => navigate('/opportunities');

  return (
    <div className="opportunities-preview-widget">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-[13px] text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Briefcase size={16} className="text-green-600 dark:text-green-400" />
          Latest Opportunities
        </h3>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <OpportunityCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="py-4 px-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-300">{error}</p>
        </div>
      ) : list.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-400 py-4 text-center">No opportunities yet.</p>
      ) : (
        <div className="space-y-3">
          {list.map((item, idx) => (
            <OpportunityCard
              key={item._id}
              item={item}
              onView={handleViewOne}
              style={{ animationDelay: `${idx * 0.05}s` }}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleViewAll}
        className="btn w-full mt-3 py-2.5 rounded-xl text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/40 flex items-center justify-center gap-1.5 transition-colors"
      >
        View All Opportunities
      </button>
    </div>
  );
}

export default memo(OpportunitiesPreview);
