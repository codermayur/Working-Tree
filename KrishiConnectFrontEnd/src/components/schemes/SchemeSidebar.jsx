import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Landmark,
  FileText,
  TrendingUp,
  Bookmark,
} from 'lucide-react';

export default function SchemeSidebar({
  categories,
  selectedCategory = '',
  onCategoryClick,
  popularSlugs = [],
  onPopularClick,
}) {
  const { pathname } = useLocation();
  const isAllSchemes = pathname === '/schemes' || (pathname.startsWith('/schemes') && pathname.split('/').filter(Boolean).length <= 1);

  const navigate = useNavigate();

  return (
    <aside className="space-y-4">
      <nav className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-sm">
        <button
          type="button"
          onClick={() => navigate('/schemes')}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition ${
            isAllSchemes ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <Landmark className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">All Schemes</span>
        </button>

        <div className="mt-1">
          <label className="flex items-center gap-2 px-3 pt-2 pb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            <FileText className="w-4 h-4" />
            Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryClick?.(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All categories</option>
            {categories?.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => onPopularClick?.()}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mt-1 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          <TrendingUp className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">Popular Schemes</span>
        </button>

        <button
          type="button"
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mt-1 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          <Bookmark className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">Saved Schemes</span>
          <span className="text-[10px] bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded">Soon</span>
        </button>
      </nav>
    </aside>
  );
}
