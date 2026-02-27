import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Landmark, AlertCircle, RefreshCw } from 'lucide-react';
import { useSchemes } from '../../hooks/useSchemes';
import SchemeCard from '../../components/schemes/SchemeCard';
import SchemeFilters from '../../components/schemes/SchemeFilters';
import SchemeSidebar from '../../components/schemes/SchemeSidebar';

function SchemeCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 animate-pulse">
      <div className="flex justify-between">
        <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="w-16 h-6 rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="mt-3 h-5 w-4/5 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mt-2 h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mt-2 h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mt-3 h-6 w-20 rounded-lg bg-gray-200 dark:bg-gray-700" />
      <div className="mt-4 flex gap-2">
        <div className="h-9 w-24 rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="h-9 w-20 rounded-xl bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}

export default function SchemesPage() {
  const navigate = useNavigate();
  const { schemes, categories, loading, error, refetch } = useSchemes();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('latest');

  const filtered = useMemo(() => {
    let list = [...(schemes || [])];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.category && s.category.toLowerCase().includes(q)) ||
          (s.description && s.description.toLowerCase().includes(q))
      );
    }
    if (category) {
      list = list.filter((s) => s.category === category);
    }
    if (sortBy === 'popular') {
      list = list.filter((s) => s.trending).concat(list.filter((s) => !s.trending));
    } else if (sortBy === 'category') {
      list.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
    } else {
      list.sort((a, b) => {
        const idA = a.id != null ? Number(a.id) : NaN;
        const idB = b.id != null ? Number(b.id) : NaN;
        if (!Number.isNaN(idA) && !Number.isNaN(idB)) return idB - idA;
        return String(b.id || '').localeCompare(String(a.id || ''));
      });
    }
    return list;
  }, [schemes, search, category, sortBy]);

  const featured = useMemo(
    () => (schemes || []).filter((s) => s.featured).slice(0, 4),
    [schemes]
  );

  const handleCategorySidebar = (cat) => {
    setCategory(cat);
  };

  const handleView = (scheme) => {
    const slug = scheme.slug ?? (scheme.redirect_url?.startsWith('/schemes/') ? scheme.redirect_url.replace(/^\/schemes\/?/, '') : null);
    if (slug) navigate(`/schemes/${slug}`);
    else if (scheme.redirect_url && scheme.redirect_url.startsWith('http')) window.open(scheme.redirect_url, '_blank', 'noopener,noreferrer');
    else if (scheme.redirect_url?.startsWith('/')) navigate(scheme.redirect_url);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Government Schemes for Farmers
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Discover benefits, subsidies, and support programs available for you
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - hidden on small screens, show as top filters on mobile */}
          <div className="lg:w-56 flex-shrink-0">
            <div className="hidden lg:block sticky top-4">
              <SchemeSidebar
                categories={categories}
                selectedCategory={category}
                onCategoryClick={handleCategorySidebar}
                onPopularClick={() => setSortBy('popular')}
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <SchemeFilters
              searchValue={search}
              onSearchChange={setSearch}
              selectedCategory={category}
              onCategoryChange={setCategory}
              categories={categories}
              sortBy={sortBy}
              onSortChange={setSortBy}
              totalCount={filtered.length}
            />

            {error && (
              <div className="mt-4 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800 dark:text-red-200">Could not load schemes</p>
                  <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
                  <button
                    type="button"
                    onClick={refetch}
                    className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 font-medium text-sm hover:bg-red-200 dark:hover:bg-red-900/50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </button>
                </div>
              </div>
            )}

            {loading && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <SchemeCardSkeleton key={i} />
                ))}
              </div>
            )}

            {!loading && !error && (
              <>
                {featured.length > 0 && (
                  <section className="mt-6">
                    <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Featured schemes</h2>
                    <div className="overflow-x-auto pb-2 -mx-1 flex gap-3 sm:grid sm:grid-cols-2 xl:grid-cols-4 sm:overflow-visible">
                      {featured.map((s) => (
                        <div key={s.id} className="min-w-[280px] sm:min-w-0">
                          <SchemeCard
                            scheme={s}
                            onView={handleView}
                            onApply={(sch) => {
                              if (sch.redirect_url?.startsWith('http')) window.open(sch.redirect_url, '_blank');
                              else {
                                const s = sch.slug ?? (sch.redirect_url?.startsWith('/schemes/') ? sch.redirect_url.replace(/^\/schemes\/?/, '') : null);
                                if (s) navigate(`/schemes/${s}`);
                                else if (sch.redirect_url?.startsWith('/')) navigate(sch.redirect_url);
                              }
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <section className="mt-8">
                  <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4">
                    {category ? `${category} schemes` : 'All schemes'}
                  </h2>
                  {filtered.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-10 text-center">
                      <Landmark className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="font-semibold text-gray-700 dark:text-gray-200">No schemes found</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Try changing your search or category filter.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filtered.map((scheme) => (
                        <SchemeCard
                          key={scheme.id}
                          scheme={scheme}
                          onView={handleView}
                          onApply={(sch) => {
                            if (sch.redirect_url?.startsWith('http')) window.open(sch.redirect_url, '_blank');
                            else {
                              const s = sch.slug ?? (sch.redirect_url?.startsWith('/schemes/') ? sch.redirect_url.replace(/^\/schemes\/?/, '') : null);
                              if (s) navigate(`/schemes/${s}`);
                              else if (sch.redirect_url?.startsWith('/')) navigate(sch.redirect_url);
                            }
                          }}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
