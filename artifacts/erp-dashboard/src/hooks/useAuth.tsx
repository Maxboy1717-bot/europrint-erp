/**
 * @module useAuth
 * @description Canonical auth Context + hook. Reads the current user from
 * `/api/auth/me` (auth carried by httpOnly cookies — see auth-refresh.ts).
 * Exposes the AuthUser plus login/logout helpers, and surfaces role aliases
 * that mirror the backend's RBAC table (so the UI never grants a permission
 * the server would refuse).
 *
 * All new code MUST import from this file; `use-auth.ts` is a deprecated shim.
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { apiRequest } from '@/lib/queryClient';

// Mirror backend ROLE_ALIASES so UI permissions consistently match server authorization
const ROLE_ALIASES: Record<string, string> = {
  admin: "super_admin", superadmin: "super_admin", super_admin: "super_admin",
  director: "director", ceo: "director", manager: "director",
  sales: "sales_manager", sales_manager: "sales_manager", crm_manager: "sales_manager", marketing: "sales_manager",
  designer: "designer",
  technologist: "technologist", technolog: "technologist",
  pp_manager: "pp_viewer", pp_viewer: "pp_viewer", production_manager: "pp_viewer",
  operator: "operator",
  warehouse: "warehouse_manager", warehouse_manager: "warehouse_manager", wm_manager: "warehouse_manager", logistics_manager: "warehouse_manager",
  qc: "qc_manager", qc_manager: "qc_manager",
  finance: "finance_manager", finance_manager: "finance_manager", cfo: "finance_manager", accountant: "finance_manager",
  hr: "hr_manager", hr_manager: "hr_manager", lms_admin: "hr_manager",
  department_head: "department_head",
};

/**
 * Authenticated user as exposed to the React tree. Mirrors the JWT payload
 * minus secrets. `positionId` / `position_id` coexist because the server
 * historically used snake_case; new code should read `positionId`.
 */
export interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  role: string;
  email?: string;
  employeeId?: number;
  positionId?: number;
  /** @deprecated use positionId */
  position_id?: number;
  firstName?: string;
  lastName?: string;
  name?: string;
}

/** @deprecated use AuthUser */
type User = AuthUser;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasRole: (...roles: string[]) => boolean;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  hasRole: () => false,
  logout: async () => {},
  refetch: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isRefreshingRef = useRef(false);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
      // Auth carried by the httpOnly access_token cookie (sent automatically
      // when `credentials: 'include'`). We can't tell client-side whether the
      // cookie is present, so we just call /me and let the server respond
      // 401 if it isn't — then attempt a refresh, mirroring api-request.ts.
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        if (res.status === 401 && !isRefreshingRef.current) {
          isRefreshingRef.current = true;
          try {
            // Refresh: server reads refresh_token cookie and sets a new
            // access_token cookie on success. No body / no Authorization
            // header is required.
            const refreshRes = await fetch('/api/auth/refresh', {
              method: 'POST',
              credentials: 'include',
            });
            if (refreshRes.ok) {
              isRefreshingRef.current = false;
              const retryRes = await fetch('/api/auth/me', {
                credentials: 'include',
              });
              if (retryRes.ok) {
                setUser(await retryRes.json());
                return;
              }
            }
          } catch { /* refresh failed, fall through to logout */ }
          isRefreshingRef.current = false;
        }
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const hasRole = useCallback((...roles: string[]) => {
    if (!user) return false;
    const effective = ROLE_ALIASES[user.role?.toLowerCase()] ?? user.role;
    if (effective === 'super_admin') return true;
    const normalizedAllowed = (Array.isArray(roles) ? roles : []).map(r => ROLE_ALIASES[r?.toLowerCase()] ?? r);
    return normalizedAllowed.includes(effective);
  }, [user]);

  const logout = useCallback(async () => {
    // The server clears the httpOnly cookies on /auth/logout.
    // We also purge any legacy tokens that might still be in localStorage
    // from before the cookie migration, so they don't linger.
    try {
      await apiRequest('POST', "/api/auth/logout");
    } catch { /* swallow — we still want to clear local state and redirect */ }
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("token");
      }
    } catch { /* localStorage may be unavailable */ }
    setUser(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      hasRole,
      logout,
      refetch: fetchUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
