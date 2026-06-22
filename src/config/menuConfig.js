import { ROLES } from '../utils/constants';

const menuDefinitions = {
  [ROLES.RECEPTIONIST]: [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: 'DashboardOutlined',
    },
    {
      label: 'Candidates',
      path: '/candidates',
      icon: 'PeopleOutlined',
    },
    {
      label: 'Registration Links',
      path: '/registration-links',
      icon: 'LinkOutlined',
    },
  ],
  [ROLES.HR_ADMIN]: [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: 'DashboardOutlined',
    },
    {
      label: 'Candidates',
      path: '/candidates',
      icon: 'PeopleOutlined',
    },
    {
      label: 'Interviews',
      path: '/interviews',
      icon: 'EventNoteOutlined',
    },
    {
      label: 'Reports',
      path: '/reports',
      icon: 'AssessmentOutlined',
    },
  ],
  [ROLES.TECH_HEAD]: [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: 'DashboardOutlined',
    },
    {
      label: 'Candidates',
      path: '/candidates',
      icon: 'PeopleOutlined',
    },
    {
      label: 'Technical Rounds',
      path: '/interviews',
      icon: 'CodeOutlined',
    },
  ],
  [ROLES.SYSTEM_ADMIN]: [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: 'DashboardOutlined',
    },
    {
      label: 'Users',
      path: '/users',
      icon: 'ManageAccountsOutlined',
    },
    {
      label: 'Candidates',
      path: '/candidates',
      icon: 'PeopleOutlined',
    },
    {
      label: 'Interviews',
      path: '/interviews',
      icon: 'EventNoteOutlined',
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: 'SettingsOutlined',
    },
  ],
};

export const getMenuItems = (role) => {
  if (!role || !menuDefinitions[role]) {
    return [];
  }
  return menuDefinitions[role];
};

export default getMenuItems;
