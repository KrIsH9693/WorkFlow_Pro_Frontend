import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from '../common/NotificationBell';
import { useThemeMode } from '../../theme/ThemeModeContext';

interface NavbarProps {
  onDrawerToggle?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onDrawerToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeMode();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorEl(null);
  };

  const roleName = typeof user?.role === 'object' ? (user?.role as any)?.name : user?.role;

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 1.5, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Mobile Hamburger Button */}
          <IconButton
            color="inherit"
            aria-label="open navigation drawer"
            edge="start"
            onClick={onDrawerToggle}
            sx={{ display: { md: 'none' }, color: 'text.secondary', mr: 0.5 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            onClick={() => navigate('/dashboard')}
            sx={{
              fontWeight: 800,
              color: 'primary.main',
              cursor: 'pointer',
              letterSpacing: '-0.02em',
              fontSize: { xs: '1.05rem', sm: '1.25rem' },
            }}
          >
            WorkFlow Pro
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1.5 } }}>
          {/* Dark / Light Mode Toggle Button */}
          <Tooltip title={`Switch to ${mode === 'light' ? 'Dark' : 'Light'} Mode`}>
            <IconButton onClick={toggleTheme} sx={{ color: 'text.secondary' }}>
              {mode === 'light' ? <DarkModeOutlinedIcon fontSize="small" /> : <LightModeOutlinedIcon fontSize="small" sx={{ color: '#f59e0b' }} />}
            </IconButton>
          </Tooltip>

          {/* Real-time Notification Bell */}
          <NotificationBell />

          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: 'text.secondary', display: { xs: 'none', sm: 'block' }, ml: 0.5 }}
          >
            {user?.name} {roleName ? `(${roleName})` : ''}
          </Typography>

          {/* User Account Avatar */}
          <Tooltip title="Account settings">
            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0, ml: 0.5 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 34, height: 34, fontSize: '0.85rem', fontWeight: 700 }}>
                {user?.name ? user.name[0].toUpperCase() : <AccountCircleIcon />}
              </Avatar>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseUserMenu}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            slotProps={{ paper: { sx: { width: 190, borderRadius: 2.5, mt: 1, border: '1px solid', borderColor: 'divider' } } }}
          >
            <MenuItem
              onClick={() => {
                handleCloseUserMenu();
                navigate('/profile');
              }}
              sx={{ gap: 1.2, fontWeight: 600, fontSize: '0.9rem' }}
            >
              <PersonOutlinedIcon fontSize="small" sx={{ color: 'primary.main' }} />
              My Profile
            </MenuItem>

            <Divider sx={{ my: 0.5 }} />

            <MenuItem onClick={logout} sx={{ color: '#ef4444', gap: 1.2, fontWeight: 600, fontSize: '0.9rem' }}>
              <LogoutIcon fontSize="small" />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};