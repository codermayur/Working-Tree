import React from 'react';
import { Search } from 'lucide-react';

const SORT_OPTIONS = [
  { id: 'latest', label: 'Latest' },
  { id: 'popular', label: 'Popular' },
  { id: 'category', label: 'Category' },
];

export default function SchemeFilters({
  searchValue,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  sortBy,
  onSortChange,
  totalCount,
}) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name or category…"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label
          htmlFor="scheme-category"
          className="text-xs font-semibold text-gray-500 dark:text-gray-400"
        >
          Category:
        </label>
        <select
          id="scheme-category"
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="min-w-[180px] max-w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSortChange(opt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                sortBy === opt.id
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {totalCount} scheme{totalCount !== 1 ? 's' : ''} found
        </p>
      </div>
    </div>
  );
}
