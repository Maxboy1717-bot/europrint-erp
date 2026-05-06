/**
 * usePositionPermissions — backend `/api/auth/me/permissions` dan ruxsat to'plamini o'qiydi.
 *
 * ARCHITECTURE.md §7.7 — position-based RBAC. Frontend hardcoded role map'dan voz kechib,
 * backend `position_permissions` jadvalidan keluvchi haqiqiy ruxsat ko'rsatkichlarini ishlatadi.
 *
 * Cache: TanStack Query 15 daqiqa staleTime (server-side Redis cache ham 1 soat).
 * Fallback: agar foydalanuvchi authenticated emas — null qaytaradi.
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

const STALE_TIME_MS = 15 * 60 * 1000;
const GC_TIME_MS = 30 * 60 * 1000;

export interface ServerModulePermission {
  module: string;
  level: string; // FULL | READ_PLUS | READ | LIMITED | NONE
}

export interface ServerMyPermissions {
  userId: number;
  username: string;
  role: string | null;
  positionId: number | null;
  positionCode: string | null;
  positionNameUz: string | null;
  positionNameRu: string | null;
  departmentCode: string | null;
  departmentNameUz: string | null;
  rbacTier: string | null;
  modules: ServerModulePermission[];
  featureFlags: string[];
  isAdmin: boolean;
}

export function usePositionPermissions() {
  const { isAuthenticated } = useAuth();

  const { data, isLoading, isError, refetch } = useQuery<ServerMyPermissions>({
    queryKey: ["/api/auth/me/permissions"],
    enabled: isAuthenticated === true,
    staleTime: STALE_TIME_MS,
    gcTime: GC_TIME_MS,
  });

  return {
    permissions: data ?? null,
    isLoading,
    isError,
    refetch,
  };
}
