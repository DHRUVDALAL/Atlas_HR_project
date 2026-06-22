import React from 'react';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box, Typography
} from '@mui/material';
import {
  Dashboard as DashboardIcon, People as PeopleIcon, Event as EventIcon,
  Settings as SettingsIcon, Assignment as AssignmentIcon, DashboardCustomize as KanbanIcon,
  Analytics as AnalyticsIcon, ViewList as ListIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useColorMode } from '../theme/ThemeContext';

const drawerWidth = 260;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toggleColorMode } = useColorMode();

  const getMenuItems = () => {
    const role = user?.role;
    
    let dashPath = '/';
    if (role === 'RECEPTIONIST') dashPath = '/receptionist/dashboard';
    else if (role === 'HR_ADMIN') dashPath = '/hr/dashboard';
    else if (role === 'INTERVIEWER') dashPath = '/tech/dashboard';
    else if (role === 'SYSTEM_ADMIN') dashPath = '/admin/dashboard';

    const items = [
      { text: 'Dashboard', icon: <DashboardIcon />, path: dashPath },
    ];

    if (role === 'RECEPTIONIST') {
      items.push({ text: 'Today\'s Queue', icon: <ListIcon />, path: '/candidates' });
    }

    if (role === 'HR_ADMIN') {
      items.push({ text: 'Interview Pipeline', icon: <KanbanIcon />, path: '/workspace' });
      items.push({ text: 'Candidate Search', icon: <PeopleIcon />, path: '/candidates' });
      items.push({ text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' });
      items.push({ text: 'Job Postings', icon: <AssignmentIcon />, path: '/jobs' });
    }

    if (role === 'INTERVIEWER') {
      items.push({ text: 'Review Queue', icon: <AssignmentIcon />, path: '/candidates' });
      items.push({ text: 'Skill Matrix', icon: <PeopleIcon />, path: '/skills' });
    }

    if (role === 'SYSTEM_ADMIN') {
      items.push({ text: 'All Candidates', icon: <PeopleIcon />, path: '/candidates' });
      items.push({ text: 'User Management', icon: <PeopleIcon />, path: '/users' });
      items.push({ text: 'System Settings', icon: <SettingsIcon />, path: '/settings' });
    }

    return items;
  };

  const menuItems = getMenuItems();

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
            const isActive = location.pathname.startsWith(item.path);
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
            onClick={toggleColorMode}
            sx={{
              borderRadius: '8px',
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: '40px' }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Toggle Theme" />
          </ListItemButton>
        </ListItem>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
