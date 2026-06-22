import { ROLES } from '../utils/constants';

export const ROLE_PERMISSIONS = {
  [ROLES.RECEPTIONIST]: {
    allowedRoutes: ['/dashboard', '/candidates', '/candidates/:id', '/registration-links'],
    canManageCandidates: true,
    canManageInterviews: false,
    canManageUsers: false,
    canViewReports: false,
    canConductTechnicalRound: false,
    canConductHRRound: false,
  },
  [ROLES.HR_ADMIN]: {
    allowedRoutes: ['/dashboard', '/candidates', '/candidates/:id', '/interviews', '/interviews/:id', '/reports'],
    canManageCandidates: true,
    canManageInterviews: true,
    canManageUsers: false,
    canViewReports: true,
    canConductTechnicalRound: false,
    canConductHRRound: true,
  },
  [ROLES.TECH_HEAD]: {
    allowedRoutes: ['/dashboard', '/candidates', '/candidates/:id', '/interviews', '/interviews/:id'],
    canManageCandidates: true,
    canManageInterviews: true,
    canManageUsers: false,
    canViewReports: false,
    canConductTechnicalRound: true,
    canConductHRRound: false,
  },
  [ROLES.SYSTEM_ADMIN]: {
    allowedRoutes: ['/dashboard', '/candidates', '/candidates/:id', '/interviews', '/interviews/:id', '/users', '/settings', '/reports'],
    canManageCandidates: true,
    canManageInterviews: true,
    canManageUsers: true,
    canViewReports: true,
    canConductTechnicalRound: true,
    canConductHRRound: true,
  },
};

export const hasPermission = (role, permission) => {
  if (!role || !ROLE_PERMISSIONS[role]) {
    return false;
  }
  const permissions = ROLE_PERMISSIONS[role];
  if (typeof permissions[permission] === 'undefined') {
    return false;
  }
  return permissions[permission];
};

export const isRouteAllowed = (role, path) => {
  if (!role || !ROLE_PERMISSIONS[role]) {
    return false;
  }
  const { allowedRoutes } = ROLE_PERMISSIONS[role];
  return allowedRoutes.some((route) => {
    const routePattern = route.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${routePattern}$`);
    return regex.test(path);
  });
};

export default ROLE_PERMISSIONS;
