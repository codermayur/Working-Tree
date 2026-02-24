import { useState, useEffect, useCallback } from 'react';
import * as notificationApi from '../services/notificationApiService';

const DEFAULT_SETTINGS = {
  social: { likes: true, comments: true, connections: true, messages: true },
  alerts: { market: true, weather: true, pestDisease: true, jobs: true },
  delivery: { push: false, emailDigest: true },
};

export function useNotificationSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const hasChanges = useCallback(() => {
    return (
      JSON.stringify(settings.social) !== JSON.stringify(saved.social) ||
      JSON.stringify(settings.alerts) !== JSON.stringify(saved.alerts) ||
      JSON.stringify(settings.delivery) !== JSON.stringify(saved.delivery)
    );
  }, [settings, saved]);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationApi.getSettings();
      setSettings(data);
      setSaved(data);
      return data;
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load settings');
      setSettings(DEFAULT_SETTINGS);
      setSaved(DEFAULT_SETTINGS);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = useCallback((category, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  }, []);

  const setSection = useCallback((category, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: Object.fromEntries(
        Object.keys(prev[category]).map((k) => [k, value])
      ),
    }));
  }, []);

  const save = useCallback(async () => {
    if (!hasChanges()) return;
    setSaving(true);
    setError(null);
    try {
      const data = await notificationApi.updateSettings(settings);
      setSaved(data || settings);
      return true;
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save');
      return false;
    } finally {
      setSaving(false);
    }
  }, [settings, saved, hasChanges]);

  const sendTest = useCallback(async () => {
    try {
      await notificationApi.sendTestNotification();
      return true;
    } catch (err) {
      return false;
    }
  }, []);

  const resetToSaved = useCallback(() => {
    setSettings(saved);
  }, [saved]);

  return {
    settings,
    saved,
    loading,
    saving,
    error,
    hasChanges: hasChanges(),
    fetchSettings,
    updateSetting,
    setSection,
    save,
    sendTest,
    resetToSaved,
  };
}
