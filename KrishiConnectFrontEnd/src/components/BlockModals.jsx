import React from 'react';
import { X, Loader } from 'lucide-react';

/**
 * Block confirmation modal (Instagram-style).
 * Title: "Block [username]?"
 * Description: They won't be able to see your posts, follow you, or message you. They won't be notified.
 * Buttons: Block (red/destructive) | Cancel
 */
export function BlockConfirmModal({ username, onConfirm, onCancel, loading = false }) {
  const displayName = username || 'this user';
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="block-modal-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-700">
        <div className="p-6 text-center">
          <h2 id="block-modal-title" className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Block {displayName}?
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
            They won't be able to see your posts, follow you, or message you. They won't be notified that you blocked them.
          </p>
        </div>
        <div className="flex flex-col gap-1 px-4 pb-5">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader size={16} className="animate-spin" /> : null}
            Block
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Unblock confirmation modal.
 * Title: "Unblock [username]?"
 * Description: They will be able to see your posts and follow you again.
 * Buttons: Unblock | Cancel
 */
export function UnblockConfirmModal({ username, onConfirm, onCancel, loading = false }) {
  const displayName = username || 'this user';
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unblock-modal-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-700">
        <div className="p-6 text-center">
          <h2 id="unblock-modal-title" className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Unblock {displayName}?
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
            They will be able to see your posts and follow you again.
          </p>
        </div>
        <div className="flex flex-col gap-1 px-4 pb-5">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader size={16} className="animate-spin" /> : null}
            Unblock
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
