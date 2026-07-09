import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { getCurrentUser } from '../api/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Build a lightweight display object. The `role` is kept ONLY for display
// (e.g. TopNav label); it is never used for authorization/gating.
const buildUser = (data) => {
  const u = { ...data };
  u.name = u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'User';
  return u;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setPermissions([]);
  }, []);

  // Fetch /auth/me and refresh both the user and the permission list.
  // Permissions are always sourced fresh from the backend — never trusted
  // from a stale localStorage copy for gating.
  const loadCurrentUser = useCallback(async () => {
    const res = await getCurrentUser();
    if (res.success && res.user) {
      const mappedUser = buildUser(res.user);
      localStorage.setItem('user', JSON.stringify(mappedUser));
      setUser(mappedUser);
      setPermissions(Array.isArray(res.permissions) ? res.permissions : []);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const ok = await loadCurrentUser();
          if (!ok) logout();
        } catch (error) {
          logout();
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, [loadCurrentUser, logout]);

  // Called after a successful /auth/login. Persists tokens, then pulls the
  // fresh user + permissions from /auth/me.
  const login = useCallback(async (token, refreshTokenValue) => {
    if (token) localStorage.setItem('token', token);
    if (refreshTokenValue) localStorage.setItem('refresh_token', refreshTokenValue);
    return loadCurrentUser();
  }, [loadCurrentUser]);

  const hasPermission = useCallback(
    (code) => permissions.includes(code),
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (...codes) => codes.flat().some((code) => permissions.includes(code)),
    [permissions]
  );

  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        login,
        logout,
        loading,
        hasPermission,
        hasAnyPermission,
        refreshUser: loadCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
