import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import LeftSidebar from './LeftSidebar';

// ============================================================================
// APP LAYOUT – Shared sidebar + Outlet for Home, Profile, etc.
// ============================================================================
const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationCount] = useState(5); // TODO: Fetch from API

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200 flex">
      <LeftSidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        notificationCount={notificationCount}
      />
      {/* Main content: reserve space for fixed sidebar so it never overlaps */}
      <main
        className={`flex-1 min-w-0 transition-all duration-300 bg-gray-50 dark:bg-gray-900 min-h-screen ${sidebarOpen ? 'lg:ml-60' : 'lg:ml-20'}`}
      >
        <Outlet context={{ sidebarOpen, setSidebarOpen }} />
      </main>
    </div>
  );
};

export default AppLayout;
