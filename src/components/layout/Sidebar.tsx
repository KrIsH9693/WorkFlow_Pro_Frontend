import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PeopleIcon from '@mui/icons-material/People';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import { useNavigate, useLocation } from 'react-router-dom';

const DRAWER_WIDTH = 240;

const menuItems = [
  { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon fontSize="small" /> },
  { text: 'Workspaces', path: '/workspaces', icon: <FolderIcon fontSize="small" /> },
  { text: 'Projects', path: '/projects', icon: <AssignmentIcon fontSize="small" /> },
  { text: 'Team', path: '/team', icon: <PeopleIcon fontSize="small" /> },
  { text: 'Profile', path: '/profile', icon: <PersonOutlinedIcon fontSize="small" /> },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onDrawerToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onDrawerToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const drawerContent = (
    <Box sx={{ overflow: 'auto', p: 2 }}>
      <List>
        {menuItems.map((item) => {
          const isSelected = location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (onDrawerToggle) {
                    onDrawerToggle();
                  }
                }}
                sx={{
                  borderRadius: 2,
                  bgcolor: isSelected ? 'action.selected' : 'transparent',
                  color: isSelected ? 'primary.main' : 'text.secondary',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: isSelected ? 'action.selected' : 'action.hover',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isSelected ? 'primary.main' : 'text.disabled',
                    minWidth: 38,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  slotProps={{
                    primary: {
                      sx: {
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '0.9rem',
                      },
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box component="nav">
      {/* 1. Mobile Drawer (Highest z-index so it overlays everything) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        disableRestoreFocus // Fixes the aria-hidden console warning in screenshot
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          zIndex: 1400, // Guarantees it appears above Navbar (1100) & Backdrop
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
            zIndex: 1400,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* 2. Desktop Permanent Rail */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
            top: '64px',
            height: 'calc(100vh - 64px)',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};