import React, { useState } from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';

import Sidebar, { EXPANDED_WIDTH, COLLAPSED_WIDTH } from './Sidebar';
import TopNav, { TOP_NAV_HEIGHT } from './TopNav';

/**
 * DashboardLayout — Main layout wrapper for all authenticated pages.
 *
 * Composes Sidebar + TopNav + <Outlet /> content area.
 */
const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
      />

      {/* TopNav */}
      <TopNav
        onMenuToggle={() => setMobileOpen((prev) => !prev)}
        sidebarCollapsed={collapsed}
      />

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: { xs: 0, md: `${sidebarWidth}px` },
          mt: `${TOP_NAV_HEIGHT}px`,
          p: 3,
          backgroundColor: 'background.default',
          minHeight: `calc(100vh - ${TOP_NAV_HEIGHT}px)`,
          transition: 'margin-left 0.3s ease',
          fontFamily: '"Inter", sans-serif',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;
