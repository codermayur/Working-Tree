import React from 'react';
import { MessageCircle } from 'lucide-react';

const DEFAULT_AVATAR =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23e5e7eb" width="100" height="100"/><text x="50" y="58" font-size="40" fill="%239ca3af" text-anchor="middle" dominant-baseline="middle">?</text></svg>'
  );

function getAvatarUrl(expert) {
  return expert?.profilePhoto?.url ?? expert?.avatar?.url ?? expert?.avatar ?? DEFAULT_AVATAR;
}

/**
 * Expert card for CropDoctor "Ask an Expert" row.
 * Props: expert { _id, name, avatar, profilePhoto, expertDetails: { specialization, experience } }, onAsk
 */
export function ExpertCard({ expert, onAsk, isOnline = false }) {
  const avatarUrl = getAvatarUrl(expert);
  const name = expert?.name || 'Expert';
  const expertise = expert?.expertDetails?.specialization || 'Agriculture';
  const experience = expert?.expertDetails?.experience ?? 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-colors duration-200 flex flex-col">
      <div className="p-4 flex flex-col items-center text-center">
        <div className="relative">
          <img
            src={avatarUrl}
            alt={name}
            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
          />
          {isOnline && (
            <span
              className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"
              title="Online"
            />
          )}
        </div>
        <h3 className="mt-2 text-sm font-bold text-gray-900 dark:text-gray-100 truncate w-full">
          {name}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-full">
          {expertise}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {experience > 0 ? `${experience} yrs exp` : 'Expert'}
        </p>
        <button
          type="button"
          onClick={() => onAsk(expert)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-green-600 text-white hover:bg-green-700 transition"
        >
          <MessageCircle size={14} /> Ask Expert
        </button>
      </div>
    </div>
  );
}

export default ExpertCard;
