import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function SchemeEligibility({ items }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <ul className="space-y-3">
      {items.map((text, i) => (
        <li key={i} className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-500 dark:text-green-400 mt-0.5" />
          <span className="text-sm text-gray-700 dark:text-gray-300">{text}</span>
        </li>
      ))}
    </ul>
  );
}
