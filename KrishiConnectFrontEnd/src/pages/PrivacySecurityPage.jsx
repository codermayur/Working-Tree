import React, { useCallback, useState } from 'react';
import { Shield, UserX, Loader, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  usePrivacySettings,
  useUpdatePrivacySettings,
  useBlockedUsers,
  useUnblockUser,
} from '../hooks/usePrivacySecurity';
import ToggleSetting from '../components/privacy-security/ToggleSetting';
import BlockedUsersList from '../components/privacy-security/BlockedUsersList';
import { UnblockConfirmModal } from '../components/BlockModals';

// ---------------------------------------------------------------------------
// Section card (matches Settings page style)
// ---------------------------------------------------------------------------
function SectionCard({ children, className = '' }) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-colors duration-200 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/80 flex items-center gap-3 transition-colors duration-200">
      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-green-700 dark:text-green-400" />
      </div>
      <div>
        <h2 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{title}</h2>
        {subtitle && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page skeleton (initial load)
// ---------------------------------------------------------------------------
function PageSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <SectionCard>
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-gray-600" />
          <div className="space-y-1.5">
            <div className="h-4 w-40 bg-gray-200 dark:bg-gray-600 rounded" />
            <div className="h-3 w-56 bg-gray-100 dark:bg-gray-700 rounded" />
          </div>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-700">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between px-5 sm:px-6 py-4">
              <div className="space-y-1.5">
                <div className="h-3.5 w-36 bg-gray-200 dark:bg-gray-600 rounded" />
                <div className="h-2.5 w-52 bg-gray-100 dark:bg-gray-700 rounded" />
              </div>
              <div className="h-6 w-11 bg-gray-200 dark:bg-gray-600 rounded-full" />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state with retry
// ---------------------------------------------------------------------------
function ErrorState({ message, onRetry }) {
  return (
    <SectionCard className="p-8 text-center">
      <AlertCircle
        size={40}
        className="text-red-400 dark:text-red-500 mx-auto mb-3"
        aria-hidden
      />
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{message}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Check your connection and try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 dark:bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-700 dark:hover:bg-green-600 transition"
      >
        <RefreshCw size={16} />
        Retry
      </button>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function PrivacySecurityPage() {
  const {
    data: privacyData,
    isLoading: privacyLoading,
    isError: privacyError,
    refetch: refetchPrivacy,
  } = usePrivacySettings();

  const {
    data: blockedUsers = [],
    isLoading: blockedLoading,
    isError: blockedError,
    refetch: refetchBlocked,
  } = useBlockedUsers();

  const updatePrivacy = useUpdatePrivacySettings({
    onError: () => toast.error('Failed to update setting'),
    onSuccess: (_, variables) => {
      if (Object.keys(variables).some((k) => k.includes('twoFactor'))) {
        toast.success(
          variables.twoFactorEnabled ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled'
        );
      } else {
        toast.success('Privacy setting updated');
      }
    },
  });

  const unblockUser = useUnblockUser({
    onError: () => toast.error('Failed to unblock user'),
    onSuccess: () => {
      toast.success('User unblocked');
      setUnblockConfirm(null);
    },
  });

  const [unblockConfirm, setUnblockConfirm] = useState(null);

  const handleRetry = useCallback(() => {
    refetchPrivacy();
    refetchBlocked();
  }, [refetchPrivacy, refetchBlocked]);

  const handleToggleTwoFactor = useCallback(
    (value) => {
      updatePrivacy.mutate({ twoFactorEnabled: value });
    },
    [updatePrivacy]
  );

  const handleToggleActivityStatus = useCallback(
    (value) => {
      updatePrivacy.mutate({ activityStatusEnabled: value });
    },
    [updatePrivacy]
  );

  const handleUnblockClick = useCallback((userId) => {
    const idStr = userId != null ? String(userId) : '';
    const user = blockedUsers.find((u) => String(u.id ?? u._id) === idStr);
    setUnblockConfirm({ userId: idStr, username: user?.name ?? 'this user' });
  }, [blockedUsers]);

  const handleUnblockConfirm = useCallback(() => {
    if (unblockConfirm?.userId != null) {
      unblockUser.mutate(String(unblockConfirm.userId));
    }
  }, [unblockConfirm, unblockUser]);

  const handleUnblockCancel = useCallback(() => setUnblockConfirm(null), []);

  const isLoading = privacyLoading && !privacyData;
  const hasError = privacyError || blockedError;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="font-black text-gray-900 dark:text-gray-100 text-xl">Privacy & Security</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Protect your account and control your data
            </p>
          </div>
          <PageSkeleton />
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="font-black text-gray-900 dark:text-gray-100 text-xl">Privacy & Security</h1>
          </div>
          <ErrorState
            message={privacyError?.message || blockedError?.message || 'Failed to load settings'}
            onRetry={handleRetry}
          />
        </div>
      </div>
    );
  }

  const twoFactorEnabled = privacyData?.twoFactorEnabled ?? false;
  const activityStatusEnabled = privacyData?.activityStatusEnabled ?? true;
  const updatingTwoFactor = updatePrivacy.isPending;
  const updatingActivity = updatePrivacy.isPending;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {unblockConfirm && (
        <UnblockConfirmModal
          username={unblockConfirm.username}
          onConfirm={handleUnblockConfirm}
          onCancel={handleUnblockCancel}
          loading={unblockUser.isPending}
        />
      )}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <header className="mb-6">
          <h1 className="font-black text-gray-900 dark:text-gray-100 text-xl flex items-center gap-2">
            <Shield size={24} className="text-green-600 dark:text-green-400" />
            Privacy & Security
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Protect your account and control your data
          </p>
        </header>

        <div className="space-y-5">
          {/* Privacy toggles card */}
          <SectionCard>
            <SectionHeader
              icon={Shield}
              title="Privacy & Security"
              subtitle="Protect your account and control your data"
            />
            <div className="divide-y divide-gray-50 dark:divide-gray-700">
              {/* Two-Factor Authentication */}
              <div className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      twoFactorEnabled ? 'bg-green-50 dark:bg-green-900/40' : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    <Shield
                      size={15}
                      className={
                        twoFactorEnabled
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Two-Factor Authentication
                      </span>
                      {twoFactorEnabled && (
                        <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/40 px-1.5 py-0.5 rounded-full border border-green-100 dark:border-green-800">
                          ON
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      Add an extra security layer to your account
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {updatingTwoFactor ? (
                    <Loader
                      size={20}
                      className="text-green-600 dark:text-green-400 animate-spin"
                      aria-hidden
                    />
                  ) : (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={twoFactorEnabled}
                      aria-label="Two-Factor Authentication"
                      onClick={() => handleToggleTwoFactor(!twoFactorEnabled)}
                      disabled={updatingTwoFactor}
                      className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-green-300 dark:focus:ring-green-600 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                        twoFactorEnabled
                          ? 'bg-green-500 dark:bg-green-600'
                          : 'bg-gray-300 dark:bg-gray-600'
                      } cursor-pointer`}
                    >
                      <span
                        className="inline-block w-5 h-5 bg-white dark:bg-gray-200 rounded-full shadow-sm transition-transform duration-200 mt-0.5"
                        style={{
                          transform: twoFactorEnabled ? 'translateX(22px)' : 'translateX(2px)',
                        }}
                      />
                    </button>
                  )}
                </div>
              </div>

              {/* Activity Status */}
              <ToggleSetting
                id="activity-status"
                label="Activity Status"
                description="Show when you were last active to your connections"
                checked={activityStatusEnabled}
                onChange={handleToggleActivityStatus}
                loading={updatingActivity}
                ariaLabel="Activity Status"
              />
            </div>
          </SectionCard>

          {/* Blocked users card */}
          <SectionCard>
            <div className="px-5 sm:px-6 py-3 bg-gray-50/40 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserX size={12} aria-hidden />
                Blocked Users ({blockedUsers.length})
              </p>
            </div>
            <BlockedUsersList
              users={blockedUsers}
              loading={blockedLoading}
              onUnblock={handleUnblockClick}
              unblockingById={
                unblockUser.isPending && unblockUser.variables != null
                  ? { [String(unblockUser.variables)]: true }
                  : {}
              }
            />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
