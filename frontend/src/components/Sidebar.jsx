import React from 'react';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box, Typography
} from '@mui/material';
import {
  Dashboard as DashboardIcon, NoteAdd as NoteAddIcon, People as PeopleIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../utils/permissions';

const drawerWidth = 260;

// Menu config: each item declares the permission(s) required to see it.
// `permission: null` means always visible to authenticated users.
const MENU_ITEMS = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', permission: null },
  { text: 'Candidates', icon: <PeopleIcon />, path: '/candidates', permission: PERMISSIONS.CANDIDATE_LIST },
  { text: 'Applicant Form', icon: <NoteAddIcon />, path: '/register-candidate', anyOf: [PERMISSIONS.WORKFLOW_RECEPTION_FORWARD, PERMISSIONS.CANDIDATE_UPDATE] },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, hasPermission, hasAnyPermission } = useAuth();

  const isVisible = (item) => {
    if (item.permission === null || item.permission === undefined) {
      if (item.anyOf) return hasAnyPermission(item.anyOf);
      return true;
    }
    return hasPermission(item.permission);
  };

  const menuItems = MENU_ITEMS.filter(isVisible);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        },
      }}
    >
      <Toolbar>
        <Typography variant="h6" color="primary" fontWeight="bold" sx={{ letterSpacing: '-0.5px' }}>
          RecruitPro
        </Typography>
      </Toolbar>
      <Box sx={{ overflow: 'auto', mt: 2, px: 2 }}>
        <List>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: '8px',
                    backgroundColor: isActive ? 'primary.light' : 'transparent',
                    color: isActive ? 'primary.contrastText' : 'text.secondary',
                    '&:hover': {
                      backgroundColor: isActive ? 'primary.main' : 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? 'primary.contrastText' : 'inherit',
                      minWidth: '40px',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
      <Box sx={{ p: 2, mt: 'auto' }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: '8px',
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: '40px' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
