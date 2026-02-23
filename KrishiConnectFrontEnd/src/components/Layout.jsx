import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import LeftSidebar from './LeftSidebar';

// ============================================================================
// LAYOUT COMPONENT
// Wraps all pages with the left sidebar
// ============================================================================
const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationCount] = useState(5); // TODO: Fetch from API

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Left Sidebar */}
      <LeftSidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        notificationCount={notificationCount}
      />

      {/* Main Content - same gray background as KrishiConnect feed area */}
      <div className={`transition-all duration-300 bg-gray-50 min-h-screen ${sidebarOpen ? 'lg:ml-60' : 'lg:ml-20'}`}>
        <Outlet context={{ sidebarOpen, setSidebarOpen }} />
      </div>
    </div>
  );
};

export default Layout;
