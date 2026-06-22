import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  DashboardOutlined,
  PeopleOutlined,
  EventNoteOutlined,
  ManageAccountsOutlined,
  AssessmentOutlined,
  SettingsOutlined,
  LinkOutlined,
  ChevronLeftRounded,
  ChevronRightRounded,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

import AppLogo from '../common/AppLogo';
import useAuth from '../../hooks/useAuth';
import menuConfig from '../../config/menuConfig';

/* ─── Icon key → MUI component map ──────────────────── */
const iconMap = {
  Dashboard: DashboardOutlined,
  Candidates: PeopleOutlined,
  Interviews: EventNoteOutlined,
  Users: ManageAccountsOutlined,
  Reports: AssessmentOutlined,
  Settings: SettingsOutlined,
  Registration: LinkOutlined,
};

const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 72;

/**
 * Sidebar — Collapsible sidebar navigation.
 *
 * @param {boolean}  open              - Controls the mobile Drawer visibility.
 * @param {Function} onClose           - Close the mobile Drawer.
 * @param {boolean}  collapsed         - Whether the sidebar is collapsed (desktop).
 * @param {Function} onToggleCollapse  - Toggle collapsed state.
 */
const Sidebar = ({ open, onClose, collapsed, onToggleCollapse }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const role = user?.role || 'hr';

  /* Filter menu items by role */
  const visibleItems = menuConfig.filter((item) =>
    item.roles.includes(role),
  );

  /* Navigation item renderer */
  const renderNavItem = (item) => {
    const Icon = iconMap[item.icon] || DashboardOutlined;
    const isActive = location.pathname.startsWith(item.path);

    return (
      <ListItem key={item.path} disablePadding sx={{ px: 1, mb: 0.3 }}>
        <Tooltip
          title={collapsed && !isMobile ? item.label : ''}
          placement="right"
          arrow
        >
          <ListItemButton
            onClick={() => {
              navigate(item.path);
              if (isMobile) onClose?.();
            }}
            sx={{
              borderRadius: '10px',
              minHeight: 44,
              px: collapsed && !isMobile ? 1.5 : 2,
              justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
              backgroundColor: isActive ? 'action.selected' : 'transparent',
              color: isActive ? 'text.primary' : 'text.secondary',
              '&:hover': {
                backgroundColor: isActive
                  ? 'action.selected'
                  : 'action.hover',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: collapsed && !isMobile ? 0 : 40,
                justifyContent: 'center',
                color: isActive ? 'text.primary' : 'text.secondary',
              }}
            >
              <Icon sx={{ fontSize: 22 }} />
            </ListItemIcon>
            {!(collapsed && !isMobile) && (
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  fontFamily: '"Inter", sans-serif',
                }}
              />
            )}

            {/* Active indicator bar */}
            {isActive && (
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  top: '20%',
                  height: '60%',
                  width: 3,
                  borderRadius: '0 4px 4px 0',
                  backgroundColor: 'primary.main',
                }}
              />
            )}
          </ListItemButton>
        </Tooltip>
      </ListItem>
    );
  };

  /* Sidebar content (shared between desktop & mobile) */
  const sidebarContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: '"Inter", sans-serif',
      }}
    >
      {/* Logo */}
      <Box sx={{ py: 1 }}>
        <AppLogo collapsed={collapsed && !isMobile} />
      </Box>

      <Divider sx={{ mx: 2, borderColor: (theme) => theme.palette.divider }} />

      {/* Nav items */}
      <List sx={{ flex: 1, pt: 1.5, overflowY: 'auto', overflowX: 'hidden' }}>
        {visibleItems.map(renderNavItem)}
      </List>

      <Divider sx={{ mx: 2, borderColor: (theme) => theme.palette.divider }} />

      {/* Collapse toggle (desktop only) */}
      {!isMobile && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}>
          <IconButton
            onClick={onToggleCollapse}
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': { backgroundColor: 'action.hover' },
            }}
          >
            {collapsed ? (
              <ChevronRightRounded fontSize="small" />
            ) : (
              <ChevronLeftRounded fontSize="small" />
            )}
          </IconButton>
        </Box>
      )}
    </Box>
  );

  /* ─── Mobile: MUI Drawer (temporary) ─────────────── */
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }} // better perf on mobile
        sx={{
          '& .MuiDrawer-paper': {
            width: EXPANDED_WIDTH,
            borderRight: 'none',
            boxShadow: '4px 0 24px rgba(0,0,0,0.08)',
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  /* ─── Desktop: persistent sidebar ─────────────────── */
  return (
    <Box
      component="nav"
      sx={{
        width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
        flexShrink: 0,
        transition: 'width 0.3s ease',
      }}
    >
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
          height: '100vh',
          backgroundColor: 'background.paper',
          borderRight: (theme) => `1px solid ${theme.palette.divider}`,
          overflowX: 'hidden',
          transition: 'width 0.3s ease',
          zIndex: (t) => t.zIndex.drawer,
        }}
      >
        {sidebarContent}
      </Box>
    </Box>
  );
};

export { EXPANDED_WIDTH, COLLAPSED_WIDTH };
export default Sidebar;
