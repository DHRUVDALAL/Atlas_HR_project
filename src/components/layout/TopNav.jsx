import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  MenuRounded,
  SearchRounded,
  NotificationsNoneRounded,
  PersonOutlineRounded,
  SettingsOutlined,
  LogoutRounded,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import useAuth from '../../hooks/useAuth';
import { EXPANDED_WIDTH, COLLAPSED_WIDTH } from './Sidebar';

/* ─── Mock notifications ─────────────────────────────── */
const mockNotifications = [
  { id: 1, text: 'New candidate application received', time: '2 min ago' },
  { id: 2, text: 'Interview with Priya Sharma rescheduled', time: '15 min ago' },
  { id: 3, text: 'Feedback pending for Rahul Verma', time: '1 hr ago' },
  { id: 4, text: 'Offer letter approved for Anita Desai', time: '3 hr ago' },
  { id: 5, text: 'New job requisition submitted', time: '5 hr ago' },
];

const TOP_NAV_HEIGHT = 64;

/**
 * TopNav — Top navigation bar.
 *
 * @param {Function} onMenuToggle    - Toggles the mobile sidebar.
 * @param {boolean}  sidebarCollapsed - Whether the desktop sidebar is collapsed.
 */
const TopNav = ({ onMenuToggle, sidebarCollapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  /* Anchor elements for menus */
  const [userAnchor, setUserAnchor] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);

  const sidebarWidth = sidebarCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        height: TOP_NAV_HEIGHT,
        backgroundColor: 'background.paper',
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        color: 'text.primary',
        zIndex: (t) => t.zIndex.drawer + 1,
        ml: { md: `${sidebarWidth}px` },
        width: { md: `calc(100% - ${sidebarWidth}px)` },
        transition: 'margin-left 0.3s ease, width 0.3s ease',
      }}
    >
      <Toolbar sx={{ height: TOP_NAV_HEIGHT, px: { xs: 1.5, md: 3 } }}>
        {/* ─── Left: Hamburger (mobile) ─── */}
        <IconButton
          onClick={onMenuToggle}
          edge="start"
          sx={{ display: { md: 'none' }, mr: 1, color: 'text.secondary' }}
        >
          <MenuRounded />
        </IconButton>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* ─── Right cluster ─── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1 } }}>
          {/* Search */}
          <Tooltip title="Search">
            <IconButton sx={{ color: 'text.secondary' }}>
              <SearchRounded />
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              onClick={(e) => setNotifAnchor(e.currentTarget)}
              sx={{ color: 'text.secondary' }}
            >
              <Badge
                badgeContent={3}
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.65rem',
                    height: 18,
                    minWidth: 18,
                  },
                }}
              >
                <NotificationsNoneRounded />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Notification menu */}
          <Menu
            anchorEl={notifAnchor}
            open={Boolean(notifAnchor)}
            onClose={() => setNotifAnchor(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            slotProps={{
              paper: {
                sx: {
                  width: 340,
                  maxHeight: 420,
                  borderRadius: '12px',
                  mt: 1,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                },
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: 'text.primary',
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                Notifications
              </Typography>
            </Box>
            <Divider />
            {mockNotifications.map((n) => (
              <MenuItem
                key={n.id}
                onClick={() => setNotifAnchor(null)}
                sx={{
                  py: 1.5,
                  whiteSpace: 'normal',
                  '&:hover': { backgroundColor: 'action.hover' },
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: '0.835rem',
                      color: 'text.primary',
                      fontFamily: '"Inter", sans-serif',
                      lineHeight: 1.4,
                    }}
                  >
                    {n.text}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.7rem',
                      color: 'text.secondary',
                      mt: 0.3,
                      fontFamily: '"Inter", sans-serif',
                    }}
                  >
                    {n.time}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
            <Divider />
            <MenuItem
              onClick={() => {
                setNotifAnchor(null);
                navigate('/notifications');
              }}
              sx={{ justifyContent: 'center', py: 1.2 }}
            >
              <Typography
                sx={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'text.primary',
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                View All Notifications
              </Typography>
            </MenuItem>
          </Menu>

          {/* User avatar */}
          <Tooltip title={user?.name || 'Account'}>
            <IconButton
              onClick={(e) => setUserAnchor(e.currentTarget)}
              sx={{ ml: 0.5 }}
            >
              <Avatar
                src={user?.avatar}
                sx={{
                  width: 36,
                  height: 36,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  backgroundColor: 'primary.main',
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                {user?.name
                  ? user.name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)
                  : 'U'}
              </Avatar>
            </IconButton>
          </Tooltip>

          {/* User dropdown */}
          <Menu
            anchorEl={userAnchor}
            open={Boolean(userAnchor)}
            onClose={() => setUserAnchor(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            slotProps={{
              paper: {
                sx: {
                  width: 220,
                  borderRadius: '12px',
                  mt: 1,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                },
              },
            }}
          >
            {/* User info header */}
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: 'text.primary',
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                {user?.name || 'User'}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                  textTransform: 'capitalize',
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                {user?.role || 'User'}
              </Typography>
            </Box>
            <Divider />

            <MenuItem
              onClick={() => {
                setUserAnchor(null);
                navigate('/profile');
              }}
              sx={{ py: 1.2 }}
            >
              <ListItemIcon>
                <PersonOutlineRounded fontSize="small" sx={{ color: 'text.secondary' }} />
              </ListItemIcon>
              <ListItemText
                primary="My Profile"
                primaryTypographyProps={{
                  fontSize: '0.85rem',
                  fontFamily: '"Inter", sans-serif',
                }}
              />
            </MenuItem>

            <MenuItem
              onClick={() => {
                setUserAnchor(null);
                navigate('/settings');
              }}
              sx={{ py: 1.2 }}
            >
              <ListItemIcon>
                <SettingsOutlined fontSize="small" sx={{ color: 'text.secondary' }} />
              </ListItemIcon>
              <ListItemText
                primary="Settings"
                primaryTypographyProps={{
                  fontSize: '0.85rem',
                  fontFamily: '"Inter", sans-serif',
                }}
              />
            </MenuItem>

            <Divider />

            <MenuItem
              onClick={() => {
                setUserAnchor(null);
                logout?.();
              }}
              sx={{ py: 1.2 }}
            >
              <ListItemIcon>
                <LogoutRounded fontSize="small" sx={{ color: '#F44336' }} />
              </ListItemIcon>
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{
                  fontSize: '0.85rem',
                  color: '#F44336',
                  fontWeight: 500,
                  fontFamily: '"Inter", sans-serif',
                }}
              />
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export { TOP_NAV_HEIGHT };
export default TopNav;
