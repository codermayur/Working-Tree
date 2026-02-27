import React from 'react';
import { Gift } from 'lucide-react';

export default function SchemeBenefits({ items }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <ul className="space-y-3">
      {items.map((text, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400">
            <Gift className="w-3 h-3" />
          </span>
          <span className="text-sm text-gray-700 dark:text-gray-300">{text}</span>
        </li>
      ))}
    </ul>
  );
}
