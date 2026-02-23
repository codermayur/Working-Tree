import React from 'react';
import { Loader } from 'lucide-react';

/**
 * Accessible toggle switch with label, description, and loading state.
 * @param {Object} props
 * @param {string} props.id - Unique id for aria-labelledby / input id
 * @param {string} props.label - Main label
 * @param {string} [props.description] - Optional description
 * @param {boolean} props.checked - Checked state
 * @param {(value: boolean) => void} props.onChange - Called when user toggles
 * @param {boolean} [props.loading] - Show spinner instead of toggle
 * @param {string} [props.ariaLabel] - Override for aria-label (defaults to label)
 */
export default function ToggleSetting({
  id,
  label,
  description,
  checked,
  onChange,
  loading = false,
  ariaLabel,
}) {
  const labelId = `${id}-label`;
  const descId = description ? `${id}-desc` : undefined;

  return (
    <div
      className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
      role="group"
      aria-labelledby={labelId}
    >
      <div className="min-w-0 flex-1">
        <span id={labelId} className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {label}
        </span>
        {description && (
          <p id={descId} className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">
        {loading ? (
          <Loader
            size={20}
            className="text-green-600 dark:text-green-400 animate-spin"
            aria-hidden
          />
        ) : (
          <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel ?? label}
            aria-describedby={descId}
            id={id}
            disabled={loading}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-green-300 dark:focus:ring-green-600 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
              checked ? 'bg-green-500 dark:bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className="inline-block w-5 h-5 bg-white dark:bg-gray-200 rounded-full shadow-sm transition-transform duration-200 mt-0.5"
              style={{ transform: checked ? 'translateX(22px)' : 'translateX(2px)' }}
            />
          </button>
        )}
      </div>
    </div>
  );
}
