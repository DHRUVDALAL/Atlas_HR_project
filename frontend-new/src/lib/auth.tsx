import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  clearAuth,
  getStoredUser,
  setStoredUser,
  setTokens,
  getAccessToken,
  getRefreshToken,
  api,
} from "./api";
import type { AuthUser, Role } from "./types";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  hasRole: (role: Role) => boolean;
  hasAnyRole: (roles: Role[]) => boolean;
  hasPermission: (perm: string) => boolean;
  hasAnyPermission: (perms: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    const refresh_token = getRefreshToken();
    if (refresh_token) {
      api("/api/auth/logout", {
        method: "POST",
        body: { refresh_token },
        auth: false,
      }).catch((e) => console.error("Error during API logout:", e));
    }
    clearAuth();
    setUser(null);
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      const token = getAccessToken();
      if (token) {
        try {
          const res = await api<{
            success: boolean;
            user: {
              user_id: string;
              email: string;
              first_name: string;
              last_name: string;
              role: string;
              secondary_role?: string;
            };
            permissions: string[];
          }>("/api/auth/me");
          if (res.success && res.user) {
            const authUser: AuthUser = {
              user_id: res.user.user_id,
              email: res.user.email,
              first_name: res.user.first_name,
              last_name: res.user.last_name,
              roles: [res.user.role, res.user.secondary_role].filter(Boolean) as Role[],
              permissions: res.permissions || [],
            };
            setStoredUser(authUser);
            setUser(authUser);
          } else {
            logout();
          }
        } catch (error) {
          console.error("Failed to restore session:", error);
          logout();
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{
      success: boolean;
      token: string;
      refresh_token: string;
      role: string;
              secondary_role?: string;
      message: string;
    }>("/api/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });

    if (!res.success) {
      throw new Error(res.message || "Invalid credentials");
    }

    setTokens(res.token, res.refresh_token);

    const meRes = await api<{
      success: boolean;
      user: {
        user_id: string;
        email: string;
        first_name: string;
        last_name: string;
        role: string;
              secondary_role?: string;
      };
      permissions: string[];
    }>("/api/auth/me");

    const authUser: AuthUser = {
      user_id: meRes.user.user_id,
      email: meRes.user.email,
      first_name: meRes.user.first_name,
      last_name: meRes.user.last_name,
      roles: [meRes.user.role, meRes.user.secondary_role].filter(Boolean) as Role[],
      permissions: meRes.permissions || [],
    };

    setStoredUser(authUser);
    setUser(authUser);
    return authUser;
  }, []);

  const hasRole = useCallback((role: Role) => !!user?.roles?.includes(role), [user]);
  const hasAnyRole = useCallback(
    (roles: Role[]) => !!user?.roles?.some((r) => roles.includes(r)),
    [user],
  );
  const hasPermission = useCallback(
    (perm: string) => !!user?.permissions?.includes(perm) || !!user?.permissions?.includes("*"),
    [user],
  );
  const hasAnyPermission = useCallback(
    (perms: string[]) =>
      !!user?.permissions?.includes("*") || !!user?.permissions?.some((p) => perms.includes(p)),
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        hasRole,
        hasAnyRole,
        hasPermission,
        hasAnyPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
