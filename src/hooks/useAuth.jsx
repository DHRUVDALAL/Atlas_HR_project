import React, { createContext, useContext, useState, useCallback } from 'react';
import { mockUsers } from '../mock/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('recruitpro_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const foundUser = mockUsers.find((u) => u.email === email);
    if (foundUser) {
      const userData = { ...foundUser };
      setUser(userData);
      localStorage.setItem('recruitpro_user', JSON.stringify(userData));
      setLoading(false);
      return { success: true, user: userData };
    }
    setLoading(false);
    return { success: false, error: 'Invalid email or password. Try: sarah@recruitpro.com' };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('recruitpro_user');
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
