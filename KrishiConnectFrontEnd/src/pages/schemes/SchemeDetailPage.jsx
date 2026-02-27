import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Landmark, AlertCircle, RefreshCw } from 'lucide-react';
import { useSchemes } from '../../hooks/useSchemes';
import { getSchemeBySlug } from '../../services/schemes.service';
import { getSchemeDetails } from '../../data/schemeDetails';
import SchemeHeader from '../../components/schemes/SchemeHeader';
import SchemeDetails from '../../components/schemes/SchemeDetails';
import SchemeDetailSidebar from '../../components/schemes/SchemeDetailSidebar';
import RelatedSchemes from '../../components/schemes/RelatedSchemes';

function SchemeDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-pulse">
      <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="flex gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-24 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-8 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-48 rounded-2xl bg-gray-200 dark:bg-gray-700" />
          <div className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    </div>
  );
}

export default function SchemeDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { schemes, loading, error } = useSchemes();

  const scheme = getSchemeBySlug(schemes, slug);
  const details = getSchemeDetails(slug || '');

  const relatedSchemes = (schemes || []).filter(
    (s) => s.id !== scheme?.id && s.category === scheme?.category
  );

  const handleApply = (s) => {
    if (!s?.redirect_url) return;
    if (s.redirect_url.startsWith('http')) {
      window.open(s.redirect_url, '_blank', 'noopener,noreferrer');
    } else if (s.redirect_url.startsWith('/')) {
      navigate(s.redirect_url);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <SchemeDetailSkeleton />
      </div>
    );
  }

  if (error || !scheme) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="font-semibold text-gray-700 dark:text-gray-200">
            {!scheme ? 'Scheme not found' : 'Something went wrong'}
            {error && ` — ${error}`}
          </p>
          <button
            type="button"
            onClick={() => navigate('/schemes')}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to schemes
          </button>
          {error && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-2 ml-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <SchemeHeader scheme={scheme} onApply={handleApply} />

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 mt-8">
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 shadow-lg p-6 sm:p-8">
              <SchemeDetails details={details} />
            </div>
          </div>
          <div className="lg:col-span-3">
            <SchemeDetailSidebar
              scheme={scheme}
              details={details}
              onApply={handleApply}
              onBookmark={() => {}}
            />
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700">
          <RelatedSchemes schemes={relatedSchemes} currentSchemeId={scheme.id} />
        </div>
      </div>

      {/* Mobile: sticky Apply at bottom */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <button
          type="button"
          onClick={() => handleApply(scheme)}
          className="w-full py-3.5 rounded-xl font-semibold bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg"
        >
          Apply on Official Portal
        </button>
      </div>
      <div className="lg:hidden h-20" aria-hidden />
    </div>
  );
}
