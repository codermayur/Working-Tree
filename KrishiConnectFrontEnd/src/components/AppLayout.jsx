import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import LeftSidebar from './LeftSidebar';
import { WeatherProvider } from '../context/WeatherContext';

// ============================================================================
// APP LAYOUT – Shared sidebar + Outlet for Home, Profile, etc.
// ============================================================================
const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200 flex">
      <LeftSidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />
      {/* Main content: reserve space for fixed sidebar so it never overlaps */}
      <main
        className={`flex-1 min-w-0 transition-all duration-300 bg-gray-50 dark:bg-gray-900 min-h-screen ${sidebarOpen ? 'lg:ml-60' : 'lg:ml-20'}`}
      >
        <WeatherProvider>
          <Outlet context={{ sidebarOpen, setSidebarOpen }} />
        </WeatherProvider>
      </main>
    </div>
  );
};

export default AppLayout;
