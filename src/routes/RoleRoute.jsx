import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RoleRoute = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // If user tries to access unauthorized route, send them to their own dashboard
    const defaultRoute = `/${user.role.split(' ')[0].toLowerCase()}/dashboard`;
    return <Navigate to={defaultRoute} replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
