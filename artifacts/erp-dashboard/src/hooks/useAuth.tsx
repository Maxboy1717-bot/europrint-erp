import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { safeStorage } from '@/lib/safeStorage';

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

interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  email?: string;
  employeeId?: number;
}

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

  const fetchUser = useCallback(async () => {
    try {
      const token = safeStorage.getItem("access_token");
      // Token yo'q bo'lsa /api/auth/me chaqirmaymiz — 401 spam'ni oldini olamiz.
      // Foydalanuvchi login qilganda token saqlanadi va refetch() chaqiriladi.
      if (!token) {
        setUser(null);
        return;
      }
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      const res = await fetch("/api/auth/me", { credentials: "include", headers });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
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
    const token = safeStorage.getItem("access_token");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    await fetch("/api/auth/logout", { method: "POST", credentials: "include", headers });
    safeStorage.removeItem("access_token");
    safeStorage.removeItem("refresh_token");
    setUser(null);
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
