import React, { memo, Suspense, lazy } from 'react';

const OpportunitiesPreview = lazy(() => import('./OpportunitiesPreview'));
const SchemesPreview = lazy(() => import('./SchemesPreview'));

function HomeWidgetsFallback() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-4 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function HomeWidgets() {
  return (
    <div
      className="home-widgets-wrapper w-full max-w-[320px] lg:max-w-sm"
      style={{
        animation: 'fadeSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
      }}
    >
      <div className="flex flex-col gap-4">
        <section className="card rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md p-4">
          <Suspense fallback={<HomeWidgetsFallback />}>
            <OpportunitiesPreview />
          </Suspense>
        </section>
        <section className="card rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md p-4">
          <Suspense fallback={<HomeWidgetsFallback />}>
            <SchemesPreview />
          </Suspense>
        </section>
      </div>
    </div>
  );
}

export default memo(HomeWidgets);
