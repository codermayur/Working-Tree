import React from 'react';
import {
  Heart,
  MessageSquare,
  UserPlus,
  TrendingUp,
  CloudSun,
  AlertTriangle,
  Briefcase,
  Bell,
  Mail,
  Loader2,
  CheckCircle,
  RefreshCw,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNotificationSettings } from '../../hooks/useNotificationSettings';

const NAVY = '#1a2332';
const GREEN = '#00c853';
const GRAY_TEXT = '#8b95a5';

const SECTION_CONFIG = {
  social: {
    label: 'SOCIAL',
    items: [
      { key: 'likes', label: 'When someone likes your posts or content', icon: Heart },
      { key: 'comments', label: 'When someone comments on your posts', icon: MessageSquare },
      { key: 'connections', label: 'New connection requests or acceptances', icon: UserPlus },
      { key: 'messages', label: 'When someone sends you a direct message', icon: MessageSquare },
    ],
  },
  alerts: {
    label: 'ALERTS',
    items: [
      { key: 'market', label: 'Price alerts, market updates, commodity trends', icon: TrendingUp },
      { key: 'weather', label: 'Weather forecasts, warnings, agricultural advisories', icon: CloudSun },
      { key: 'pestDisease', label: 'Pest outbreaks, disease warnings in your region', icon: AlertTriangle },
      { key: 'jobs', label: 'New job opportunities, agricultural employment updates', icon: Briefcase },
    ],
  },
  delivery: {
    label: 'DELIVERY',
    items: [
      { key: 'push', label: 'Enable push notifications to your device', icon: Bell },
      { key: 'emailDigest', label: 'Daily or weekly email summaries', icon: Mail },
    ],
  },
};

function Toggle({ checked, onChange, disabled, 'aria-label': ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-[#1a2332] disabled:cursor-not-allowed disabled:opacity-50 bg-gray-600"
      style={{ backgroundColor: checked ? GREEN : undefined }}
    >
      <span
        className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out mt-0.5"
        style={{
          transform: checked ? 'translateX(20px)' : 'translateX(2px)',
        }}
      />
    </button>
  );
}

function SectionCard({ title, items, values, onToggle, onEnableAll, onDisableAll, loading }) {
  const allOn = items.every(({ key }) => values[key]);
  const allOff = items.every(({ key }) => !values[key]);

  return (
    <div
      className="rounded-lg border border-gray-700/50 bg-[#1e2a3a] shadow-lg overflow-hidden"
      style={{ borderRadius: 8 }}
    >
      <div className="px-4 py-3 border-b border-gray-700/50 flex items-center justify-between flex-wrap gap-2">
        <h3
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: GRAY_TEXT }}
        >
          {title}
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEnableAll}
            disabled={loading || allOn}
            className="text-xs font-semibold px-2.5 py-1 rounded-md transition hover:bg-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ color: GREEN }}
            aria-label={`Enable all ${title}`}
          >
            Enable all
          </button>
          <span className="text-gray-600">|</span>
          <button
            type="button"
            onClick={onDisableAll}
            disabled={loading || allOff}
            className="text-xs font-semibold text-gray-400 px-2.5 py-1 rounded-md transition hover:bg-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={`Disable all ${title}`}
          >
            Disable all
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-700/40">
        {items.map(({ key, label, icon: Icon }) => (
          <div
            key={key}
            role="button"
            tabIndex={0}
            onClick={() => onToggle(key, !values[key])}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggle(key, !values[key]);
              }
            }}
            className="flex items-center justify-between gap-4 px-4 py-4 cursor-pointer transition-colors hover:bg-gray-700/30 focus:outline-none focus:bg-gray-700/30"
            style={{ padding: '16px' }}
            aria-label={`${label}, ${values[key] ? 'on' : 'off'}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-gray-700/50"
                style={{ color: GREEN }}
              >
                <Icon size={20} />
              </div>
              <span className="text-sm font-medium text-gray-200">{label}</span>
            </div>
            <Toggle
              checked={!!values[key]}
              onChange={(v) => onToggle(key, v)}
              aria-label={`Toggle ${label}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function NotificationSettingsPanel() {
  const {
    settings,
    loading,
    saving,
    error,
    hasChanges,
    fetchSettings,
    updateSetting,
    setSection,
    save,
    sendTest,
  } = useNotificationSettings();

  const handleSave = async () => {
    const ok = await save();
    if (ok) toast.success('Settings saved successfully');
    else toast.error('Failed to save settings');
  };

  const handleTest = async () => {
    const ok = await sendTest();
    if (ok) toast.success('Test notification sent! Check your alerts.');
    else toast.error('Failed to send test notification');
  };

  if (loading) {
    return (
      <div
        className="min-h-[320px] flex items-center justify-center rounded-lg"
        style={{ backgroundColor: NAVY }}
      >
        <Loader2 size={32} className="animate-spin text-[#00c853]" />
      </div>
    );
  }

  return (
    <div
      className="space-y-6 animate-in fade-in duration-300"
      style={{ backgroundColor: 'transparent' }}
    >
      {error && (
        <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-red-900/20 border border-red-800/50 text-red-200 text-sm">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchSettings}
            className="flex items-center gap-1.5 text-red-300 hover:text-red-100 font-medium"
          >
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      )}

      {Object.entries(SECTION_CONFIG).map(([category, { label, items }]) => (
        <SectionCard
          key={category}
          title={label}
          items={items}
          values={settings[category] || {}}
          onToggle={(key, value) => updateSetting(category, key, value)}
          onEnableAll={() => setSection(category, true)}
          onDisableAll={() => setSection(category, false)}
          loading={saving}
        />
      ))}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-lg font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
          style={{ backgroundColor: GREEN }}
          aria-label="Save notification settings"
        >
          {saving ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <CheckCircle size={20} />
          )}
          {saving ? 'Saving...' : 'Save settings'}
        </button>
        <button
          type="button"
          onClick={handleTest}
          disabled={saving}
          className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-lg font-semibold text-gray-200 border border-gray-600 hover:bg-gray-700/50 transition disabled:opacity-50"
          aria-label="Send test notification"
        >
          <Zap size={18} />
          Test notification
        </button>
      </div>
    </div>
  );
}

export default NotificationSettingsPanel;
