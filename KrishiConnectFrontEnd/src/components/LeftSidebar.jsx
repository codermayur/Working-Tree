import React, { memo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Users, Briefcase, MessageSquare, AlertCircle, User, Settings, Menu, LogIn, CloudRain, BarChart2, Leaf, Award, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

// ============================================================================
// LEFT SIDEBAR COMPONENT
// ============================================================================
const LeftSidebar = ({ open, setOpen }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = !!user;
  const isAdmin = user?.role === 'admin';
  const profilePhotoUrl =
    (user?.profilePhoto && (typeof user.profilePhoto === 'string' ? user.profilePhoto : user.profilePhoto?.url)) ||
    (user?.avatar && (typeof user.avatar === 'string' ? user.avatar : user.avatar?.url));

  const navItems = [
    { id: 'home', icon: Home, labelKey: 'nav.home', route: '/' },
    { id: 'network', icon: Users, labelKey: 'nav.network', route: '/network' },
    { id: 'jobs', icon: Briefcase, labelKey: 'nav.opportunities', badge: 'New', route: '/opportunities' },
    { id: 'messages', icon: MessageSquare, labelKey: 'nav.messages', route: '/messages' },
    { id: 'notifications', icon: AlertCircle, labelKey: 'nav.alerts', route: '/alerts' },
    { id: 'weather', icon: CloudRain, labelKey: 'nav.weather', route: '/weather' },
    { id: 'market', icon: BarChart2, labelKey: 'nav.market', route: '/market' },
    { id: 'cropDoctor', icon: Leaf, labelKey: 'nav.cropDoctor', route: '/crop-doctor' },
    { id: 'profile', icon: User, labelKey: 'nav.profile', route: '/profile' },
  ];

  // Determine active nav based on current route (pathname-driven)
  const getActiveNav = () => {
    const path = location.pathname;
    if (path === '/' || path === '/feed') return 'home';
    if (path.startsWith('/network')) return 'network';
    if (path.startsWith('/opportunities') || path.startsWith('/jobs')) return 'jobs';
    if (path.startsWith('/messages')) return 'messages';
    if (path.startsWith('/alerts') || path.startsWith('/notifications')) return 'notifications';
    if (path.startsWith('/weather')) return 'weather';
    if (path.startsWith('/market')) return 'market';
    if (path.startsWith('/crop-doctor')) return 'cropDoctor';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/settings')) return 'settings';
    if (path.startsWith('/admin/expert-applications')) return 'adminExpert';
    if (path.startsWith('/admin/manage-admins')) return 'adminManage';
    return 'home';
  };

  const activeNav = getActiveNav();

  const handleNavClick = (item) => {
    navigate(item.route);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 z-40 transition-all duration-300 ${open ? 'w-60' : 'w-20'} overflow-hidden shadow-sm`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between min-h-[64px] gap-2">
          {open && <span className="text-xl font-black text-green-700 dark:text-green-400 whitespace-nowrap truncate">🌾 Khetibari</span>}
          <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
            <button
              onClick={() => setOpen(!open)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition text-gray-500 dark:text-gray-400"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all relative ${
                activeNav === item.id
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              } ${!open ? 'justify-center' : ''}`}
              title={!open ? t(item.labelKey) : ''}
            >
              <item.icon size={19} className="flex-shrink-0" />
              {open && <span className="text-sm flex-1 text-left">{t(item.labelKey)}</span>}
              {open && item.badge && (
                <span className={`text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ${
                  item.badge === 'New' ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {item.badge === 'New' ? '!' : item.badge}
                </span>
              )}
              {!open && item.badge && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
              )}
            </button>
          ))}
        </nav>

        {/* Settings & Auth */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-700 space-y-1">
          {isAdmin && (
            <>
              <button
                onClick={() => navigate('/admin/manage-admins')}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition ${!open ? 'justify-center' : ''} ${
                  activeNav === 'adminManage'
                    ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Shield size={19} />
                {open && <span className="text-sm">Admin Management</span>}
              </button>
              <button
                onClick={() => navigate('/admin/expert-applications')}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition ${!open ? 'justify-center' : ''} ${
                  activeNav === 'adminExpert'
                    ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Award size={19} />
                {open && <span className="text-sm">Expert Applications</span>}
              </button>
            </>
          )}
          <button
            onClick={() => navigate('/settings')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition ${!open ? 'justify-center' : ''} ${
              activeNav === 'settings'
                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Settings size={19} />
            {open && <span className="text-sm">{t('nav.settings')}</span>}
          </button>
          {isLoggedIn ? (
            <button
              onClick={() => navigate(user?._id ? `/profile/${user._id}` : '/profile')}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-emerald-600 hover:bg-emerald-50 transition ${!open ? 'justify-center' : ''}`}
            >
              {profilePhotoUrl ? (
                <img src={profilePhotoUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-emerald-600" />
                </div>
              )}
              {open && <span className="text-sm font-medium truncate">{user?.name || t('nav.profile')}</span>}
            </button>
          ) : (
            <Link
              to="/login"
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-emerald-600 hover:bg-emerald-50 transition ${!open ? 'justify-center' : ''}`}
            >
              <LogIn size={19} />
              {open && <span className="text-sm font-medium">{t('nav.login')}</span>}
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile FAB (Floating Action Button) */}
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed bottom-20 right-4 bg-green-600 text-white p-3 rounded-full shadow-xl hover:bg-green-700 transition z-50"
      >
        <Menu size={22} />
      </button>

      {/* Mobile Overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      {open && (
        <aside className="lg:hidden fixed left-0 top-0 h-screen bg-white dark:bg-gray-800 z-50 w-72 shadow-2xl animate-slide-in">
          {/* Logo */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between min-h-[64px]">
            <span className="text-xl font-black text-green-700 dark:text-green-400 whitespace-nowrap">🌾 Khetibari</span>
            <button
              onClick={() => setOpen(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition text-gray-500 dark:text-gray-400"
            >
              <Menu size={18} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  handleNavClick(item);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all relative ${
                  activeNav === item.id
                    ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <item.icon size={19} className="flex-shrink-0" />
                <span className="text-sm flex-1 text-left">{t(item.labelKey)}</span>
                {item.badge && (
                  <span className={`text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ${
                    item.badge === 'New' ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {item.badge === 'New' ? '!' : item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Settings & Auth */}
          <div className="p-3 border-t border-gray-100 dark:border-gray-700 space-y-1">
            {isAdmin && (
              <>
                <button
                  onClick={() => {
                    navigate('/admin/manage-admins');
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition ${
                    activeNav === 'adminManage'
                      ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Shield size={19} />
                  <span className="text-sm">Admin Management</span>
                </button>
                <button
                  onClick={() => {
                    navigate('/admin/expert-applications');
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition ${
                    activeNav === 'adminExpert'
                      ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Award size={19} />
                  <span className="text-sm">Expert Applications</span>
                </button>
              </>
            )}
            <button
              onClick={() => {
                navigate('/settings');
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition ${
                activeNav === 'settings'
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Settings size={19} />
              <span className="text-sm">{t('nav.settings')}</span>
            </button>
            {isLoggedIn ? (
              <button
                onClick={() => {
                  navigate(user?._id ? `/profile/${user._id}` : '/profile');
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition"
              >
                {profilePhotoUrl ? (
                  <img src={profilePhotoUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-emerald-600" />
                  </div>
                )}
                <span className="text-sm font-medium truncate">{user?.name || t('nav.profile')}</span>
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition"
              >
                <LogIn size={19} />
                <span className="text-sm font-medium">{t('nav.login')}</span>
              </Link>
            )}
          </div>
        </aside>
      )}
    </>
  );
};

export default memo(LeftSidebar);
