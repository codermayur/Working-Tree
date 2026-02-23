import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell, BellOff, Check, CheckCheck, Trash2, Filter, X,
  Loader, AlertCircle, RefreshCw, Heart, MessageSquare,
  UserPlus, Briefcase, TrendingUp, Droplet, Wind, AlertTriangle,
  Settings, ChevronRight, CheckCircle
} from 'lucide-react';

// ============================================================================
// API PLACEHOLDER FUNCTIONS
// ============================================================================
const API_BASE = 'http://localhost:5000/api';
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const alertsApi = {
  fetchNotifications: async (filter = 'all') => {
    // TODO: GET ${API_BASE}/notifications?type=${filter}
    await delay(700);
    const all = DEMO_NOTIFICATIONS;
    if (filter === 'unread') return { notifications: all.filter(n => !n.read) };
    return { notifications: all };
  },
  markAsRead: async (notificationId) => {
    // TODO: PUT ${API_BASE}/notifications/${notificationId}/read
    await delay(200);
    return { success: true };
  },
  markAllAsRead: async () => {
    // TODO: PUT ${API_BASE}/notifications/read-all
    await delay(500);
    return { success: true };
  },
  deleteNotification: async (notificationId) => {
    // TODO: DELETE ${API_BASE}/notifications/${notificationId}
    await delay(300);
    return { success: true };
  },
  clearAll: async () => {
    // TODO: DELETE ${API_BASE}/notifications
    await delay(600);
    return { success: true };
  },
  fetchNotificationSettings: async () => {
    // TODO: GET ${API_BASE}/notifications/settings
    await delay(400);
    return { settings: DEMO_SETTINGS };
  },
  updateNotificationSettings: async (settings) => {
    // TODO: PUT ${API_BASE}/notifications/settings  body: settings
    await delay(500);
    return { settings };
  },
};

// ============================================================================
// DEMO DATA
// ============================================================================
const DEMO_NOTIFICATIONS = [
  { _id: 'n1', type: 'like', read: false, actor: { name: 'Priya Singh', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop' }, content: 'liked your post about drip irrigation', target: { type: 'post', id: 'post-1', preview: 'Just harvested 50 quintals using drip...' }, time: '2 minutes ago', timestamp: Date.now() - 120000 },
  { _id: 'n2', type: 'comment', read: false, actor: { name: 'Amit Patel', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop' }, content: 'commented on your post', target: { type: 'post', id: 'post-1', preview: 'Great technique! Which fertilizer ratio worked best for you?' }, time: '15 minutes ago', timestamp: Date.now() - 900000 },
  { _id: 'n3', type: 'weather_alert', read: false, actor: null, content: 'Heavy rainfall expected in Bijnor district over next 48 hours. Protect your crops!', target: { type: 'weather' }, time: '1 hour ago', timestamp: Date.now() - 3600000 },
  { _id: 'n4', type: 'connection', read: false, actor: { name: 'Neha Sharma', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop' }, content: 'sent you a connection request', target: { type: 'user', id: 'u3' }, time: '2 hours ago', timestamp: Date.now() - 7200000 },
  { _id: 'n5', type: 'market_alert', read: false, actor: null, content: 'Wheat prices surged 8% today — ₹2,150/quintal in Bijnor mandi. Best time to sell!', target: { type: 'market' }, time: '3 hours ago', timestamp: Date.now() - 10800000 },
  { _id: 'n6', type: 'job', read: true, actor: null, content: 'New job posting matches your profile: Farm Manager – GreenHarvest Farms, Punjab', target: { type: 'job', id: 'j1' }, time: '5 hours ago', timestamp: Date.now() - 18000000 },
  { _id: 'n7', type: 'like', read: true, actor: { name: 'Meena Kumari', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=60&h=60&fit=crop' }, content: 'liked your post about organic farming subsidies', target: { type: 'post', id: 'post-2' }, time: 'Yesterday', timestamp: Date.now() - 86400000 },
  { _id: 'n8', type: 'comment', read: true, actor: { name: 'Ramesh Yadav', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop' }, content: 'replied to your comment on Priya Singh\'s post', target: { type: 'comment' }, time: 'Yesterday', timestamp: Date.now() - 90000000 },
  { _id: 'n9', type: 'market_alert', read: true, actor: null, content: 'Onion prices dropped 12% in Maharashtra mandis. Delay selling if possible.', target: { type: 'market' }, time: '2 days ago', timestamp: Date.now() - 172800000 },
  { _id: 'n10', type: 'pest_alert', read: true, actor: null, content: 'Fall Armyworm outbreak reported in Eastern UP. Apply recommended pesticides immediately.', target: { type: 'advisory' }, time: '3 days ago', timestamp: Date.now() - 259200000 },
];

const DEMO_SETTINGS = {
  likes: true,
  comments: true,
  connections: true,
  weather_alerts: true,
  market_alerts: true,
  job_alerts: true,
  pest_alerts: true,
  government_schemes: true,
  push_notifications: false,
  email_digest: true,
};

// ============================================================================
// NOTIFICATION CONFIG
// ============================================================================
const NOTIFICATION_CONFIG = {
  like: { icon: Heart, color: 'bg-red-50 text-red-500', bgLight: 'bg-red-50', label: 'Like' },
  comment: { icon: MessageSquare, color: 'bg-blue-50 text-blue-500', bgLight: 'bg-blue-50', label: 'Comment' },
  connection: { icon: UserPlus, color: 'bg-green-50 text-green-500', bgLight: 'bg-green-50', label: 'Connection' },
  job: { icon: Briefcase, color: 'bg-purple-50 text-purple-500', bgLight: 'bg-purple-50', label: 'Job' },
  market_alert: { icon: TrendingUp, color: 'bg-orange-50 text-orange-500', bgLight: 'bg-orange-50', label: 'Market' },
  weather_alert: { icon: Droplet, color: 'bg-cyan-50 text-cyan-500', bgLight: 'bg-cyan-50', label: 'Weather' },
  pest_alert: { icon: AlertTriangle, color: 'bg-yellow-50 text-yellow-600', bgLight: 'bg-yellow-50', label: 'Pest Alert' },
};

const FILTER_TYPES = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'like', label: 'Likes' },
  { id: 'comment', label: 'Comments' },
  { id: 'connection', label: 'Connections' },
  { id: 'market_alert', label: 'Market' },
  { id: 'weather_alert', label: 'Weather' },
  { id: 'pest_alert', label: 'Alerts' },
];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================
const NotificationCard = ({ notification, onRead, onDelete }) => {
  const [deleting, setDeleting] = useState(false);
  const config = NOTIFICATION_CONFIG[notification.type] || NOTIFICATION_CONFIG.comment;
  const IconComponent = config.icon;

  const handleDelete = async (e) => {
    e.stopPropagation();
    setDeleting(true);
    try {
      await alertsApi.deleteNotification(notification._id);
      onDelete(notification._id);
    } catch { } finally { setDeleting(false); }
  };

  const handleClick = async () => {
    if (!notification.read) {
      await alertsApi.markAsRead(notification._id);
      onRead(notification._id);
    }
    // TODO: Navigate to the target (post, job, user profile, etc.)
    console.log('[Navigate] →', notification.target);
  };

  return (
    <div onClick={handleClick}
      className={`group flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-sm ${
        notification.read ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600' : 'bg-green-50/30 dark:bg-green-900/20 border-green-100 dark:border-green-800 hover:border-green-200 dark:hover:border-green-700'
      }`}>
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bgLight}`}>
        {notification.actor ? (
          <div className="relative">
            <img src={notification.actor.avatar} alt={notification.actor.name}
              className="w-10 h-10 rounded-xl object-cover" />
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white ${config.color.split(' ')[0]}`}>
              <IconComponent size={10} className={config.color.split(' ')[1]} />
            </div>
          </div>
        ) : (
          <IconComponent size={18} className={config.color.split(' ')[1]} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-relaxed ${notification.read ? 'text-gray-600 dark:text-gray-300' : 'text-gray-900 dark:text-gray-100 font-medium'}`}>
          {notification.actor && (
            <span className="font-bold text-gray-900 dark:text-gray-100">{notification.actor.name} </span>
          )}
          {notification.content}
        </p>
        {notification.target?.preview && (
          <p className="text-xs text-gray-400 mt-1 truncate italic">"{notification.target.preview}"</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`text-xs font-semibold ${config.color.split(' ')[1]}`}>{config.label}</span>
          <span className="text-gray-300 dark:text-gray-500 text-xs">·</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">{notification.time}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {!notification.read && (
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
        )}
        <button onClick={handleDelete} disabled={deleting}
          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-gray-400 hover:text-red-500 transition-all">
          {deleting ? <Loader size={13} className="animate-spin" /> : <Trash2 size={13} />}
        </button>
      </div>
    </div>
  );
};

const SettingsPanel = ({ settings, onUpdate }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (key) => setLocalSettings(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await alertsApi.updateNotificationSettings(localSettings);
      onUpdate(localSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { } finally { setSaving(false); }
  };

  const settingGroups = [
    {
      label: 'Social Activity', items: [
        { key: 'likes', label: 'Likes on my posts', icon: Heart },
        { key: 'comments', label: 'Comments on my posts', icon: MessageSquare },
        { key: 'connections', label: 'Connection requests', icon: UserPlus },
      ]
    },
    {
      label: 'Agri Alerts', items: [
        { key: 'market_alerts', label: 'Market price alerts', icon: TrendingUp },
        { key: 'weather_alerts', label: 'Weather alerts', icon: Droplet },
        { key: 'pest_alerts', label: 'Pest & disease alerts', icon: AlertTriangle },
        { key: 'government_schemes', label: 'New government schemes', icon: CheckCircle },
      ]
    },
    {
      label: 'Career', items: [
        { key: 'job_alerts', label: 'New job opportunities', icon: Briefcase },
      ]
    },
    {
      label: 'Delivery Preferences', items: [
        { key: 'push_notifications', label: 'Push notifications', icon: Bell },
        { key: 'email_digest', label: 'Daily email digest', icon: CheckCheck },
      ]
    },
  ];

  return (
    <div className="space-y-5">
      {settingGroups.map(group => (
        <div key={group.label} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-600">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{group.label}</h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-600">
            {group.items.map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Icon size={16} className="text-green-600 dark:text-green-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">{label}</span>
                </div>
                <button onClick={() => toggle(key)}
                  className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 ${localSettings[key] ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <span className={`inline-block w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 mt-0.5 ${localSettings[key] ? 'translate-x-5.5 ml-0.5' : 'translate-x-0.5'}`}
                    style={{ transform: localSettings[key] ? 'translateX(20px)' : 'translateX(2px)' }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <button onClick={handleSave} disabled={saving}
        className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition flex items-center justify-center gap-2 shadow-md">
        {saving ? <Loader size={15} className="animate-spin" /> : saved ? <CheckCircle size={15} /> : <Settings size={15} />}
        {saving ? 'Saving...' : saved ? 'Settings Saved!' : 'Save Settings'}
      </button>
    </div>
  );
};

// ============================================================================
// MAIN ALERTS PAGE
// ============================================================================
const AlertsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('notifications');
  const [markingAll, setMarkingAll] = useState(false);
  const [clearing, setClearing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [notifRes, settingsRes] = await Promise.all([
        alertsApi.fetchNotifications(),
        alertsApi.fetchNotificationSettings(),
      ]);
      setNotifications(notifRes.notifications);
      setSettings(settingsRes.settings);
    } catch {
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.read;
    return n.type === activeFilter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await alertsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { } finally { setMarkingAll(false); }
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      await alertsApi.clearAll();
      setNotifications([]);
    } catch { } finally { setClearing(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-20 shadow-sm transition-colors duration-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Bell size={22} className="text-green-600 dark:text-green-400" />
              <h1 className="text-xl font-black text-gray-900 dark:text-gray-100">Alerts</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-bold">{unreadCount} new</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} disabled={markingAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-xl transition border border-green-200 dark:border-green-700">
                  {markingAll ? <Loader size={12} className="animate-spin" /> : <CheckCheck size={12} />}
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={handleClearAll} disabled={clearing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition border border-gray-200 dark:border-gray-600">
                  {clearing ? <Loader size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-3">
            {[
              { id: 'notifications', label: 'Notifications' },
              { id: 'settings', label: 'Settings' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition ${activeTab === tab.id ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filter chips */}
          {activeTab === 'notifications' && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {FILTER_TYPES.map(ft => (
                <button key={ft.id} onClick={() => setActiveFilter(ft.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition border ${
                    activeFilter === ft.id ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600'
                  }`}>
                  {ft.label}
                  {ft.id === 'unread' && unreadCount > 0 && (
                    <span className={`ml-1 px-1 rounded-full text-xs font-bold ${activeFilter === 'unread' ? 'bg-white/30' : 'bg-green-100 text-green-700'}`}>{unreadCount}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {activeTab === 'notifications' && (
          <>
            {error && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-100 dark:border-red-900/50 p-8 text-center shadow-sm mb-4">
                <AlertCircle size={36} className="text-red-400 mx-auto mb-2" />
                <p className="text-gray-700 dark:text-gray-200 font-semibold text-sm">{error}</p>
                <button onClick={loadData} className="mt-3 px-5 py-2 bg-green-600 text-white rounded-xl text-xs font-semibold hover:bg-green-700 transition flex items-center gap-1.5 mx-auto">
                  <RefreshCw size={13} /> Retry
                </button>
              </div>
            )}

            {loading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex items-start gap-3 animate-pulse shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-600 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-full" />
                      <div className="h-2.5 bg-gray-100 dark:bg-gray-600 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-16 text-center shadow-sm">
                <BellOff size={48} className="text-gray-200 dark:text-gray-500 mx-auto mb-4" />
                <p className="font-bold text-gray-700 dark:text-gray-200 text-lg">
                  {activeFilter !== 'all' ? 'No notifications in this category' : 'All caught up!'}
                </p>
                <p className="text-gray-400 dark:text-gray-400 text-sm mt-2">
                  {activeFilter !== 'all' ? 'Try a different filter' : "You have no notifications right now. We'll notify you when something happens."}
                </p>
                {activeFilter !== 'all' && (
                  <button onClick={() => setActiveFilter('all')} className="mt-4 px-5 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition">
                    View All
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map(n => (
                  <NotificationCard key={n._id} notification={n}
                    onRead={(id) => setNotifications(prev => prev.map(x => x._id === id ? { ...x, read: true } : x))}
                    onDelete={(id) => setNotifications(prev => prev.filter(x => x._id !== id))} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'settings' && settings && (
          <SettingsPanel settings={settings} onUpdate={setSettings} />
        )}
      </div>
    </div>
  );
};

export default AlertsPage;
