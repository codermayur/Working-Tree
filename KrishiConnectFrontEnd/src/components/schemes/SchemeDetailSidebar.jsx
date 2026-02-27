import React from 'react';
import { ExternalLink, Share2, Copy, Bookmark } from 'lucide-react';
import { isExternalUrl } from '../../services/schemes.service';

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col gap-0.5 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
      {label}
    </span>
    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{value || '—'}</span>
  </div>
);

export default function SchemeDetailSidebar({ scheme, details, onApply, onBookmark }) {
  const isExternal = isExternalUrl(scheme?.redirect_url);
  const shareUrl = scheme?.redirect_url?.startsWith('http')
    ? scheme.redirect_url
    : typeof window !== 'undefined'
      ? `${window.location.origin}${scheme?.redirect_url || ''}`
      : '';
  const shareText = `${scheme?.name || 'Scheme'} - ${shareUrl}`;

  const handleApply = () => {
    if (onApply) onApply(scheme);
    else if (scheme?.redirect_url) {
      if (isExternal) window.open(scheme.redirect_url, '_blank', 'noopener,noreferrer');
      else window.location.href = scheme.redirect_url;
    }
  };

  const copyLink = () => {
    if (typeof window === 'undefined') return;
    const url = scheme?.redirect_url?.startsWith('http') ? scheme.redirect_url : window.location.href;
    navigator.clipboard?.writeText(url).then(() => {
      // Could use toast here
    });
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <aside className="lg:sticky lg:top-6 space-y-6 animate-[fadeIn_0.5s_ease-out_0.1s_both]">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 shadow-lg p-6">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Scheme Info</h3>
        <InfoRow label="Category" value={scheme?.category} />
        <InfoRow label="Target Beneficiaries" value={details?.targetBeneficiaries} />
        <InfoRow label="Ministry" value={details?.ministry} />
        <InfoRow label="Launch Year" value={details?.launchYear} />
        <InfoRow label="Application Mode" value={details?.applicationMode} />
        <InfoRow label="Status" value={details?.status} />
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 shadow-lg p-6 space-y-4">
        <button
          type="button"
          onClick={handleApply}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-semibold bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md hover:from-green-700 hover:to-emerald-700 hover:shadow-lg transition-all"
        >
          Apply on Official Portal
          <ExternalLink className="w-4 h-4" />
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={shareWhatsApp}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition"
            aria-label="Share on WhatsApp"
          >
            <Share2 className="w-4 h-4" />
            WhatsApp
          </button>
          <button
            type="button"
            onClick={copyLink}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition"
            aria-label="Copy link"
          >
            <Copy className="w-4 h-4" />
            Copy Link
          </button>
        </div>
        <button
          type="button"
          onClick={() => onBookmark?.(scheme)}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition"
          aria-label="Bookmark"
        >
          <Bookmark className="w-4 h-4" />
          Save for later
        </button>
      </div>
    </aside>
  );
}
