import React, { useState } from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC = () => {
  // Mobile drawer open/close state
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((prevState) => !prevState);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* 1. Navbar me hamburger click listener */}
      <Navbar onDrawerToggle={handleDrawerToggle} />

      <Box sx={{ display: 'flex', flexGrow: 1, position: 'relative' }}>
        {/* 2. Sidebar me state aur toggle function */}
        <Sidebar mobileOpen={mobileOpen} onDrawerToggle={handleDrawerToggle} />

        {/* 3. Main content area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3.5 },
            width: { xs: '100%', md: 'calc(100% - 240px)' },
            minHeight: 'calc(100vh - 64px)',
            overflowX: 'hidden',
            bgcolor: 'background.default',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};