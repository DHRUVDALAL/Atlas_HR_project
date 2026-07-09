import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Permission-based route guard. Replaces the old role-name based RoleRoute.
 *
 *   <Route element={<RequirePermission permission="candidate.list" />}> ... </Route>
 *   <Route element={<RequirePermission anyOf={['evaluation.view_all', 'decision.final']} />}> ... </Route>
 *
 * Unauthenticated users are sent to /login; authenticated users lacking the
 * required permission are redirected to the shared /dashboard.
 */
const RequirePermission = ({ permission, anyOf, children }) => {
  const { user, permissions } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const required = permission ? [permission] : (anyOf || []);
  const allowed = required.length === 0 || required.some((code) => permissions.includes(code));

  if (!allowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? children : <Outlet />;
};

export default RequirePermission;
