import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/utils";
import { useLocation } from "wouter";
import { safeStorage } from '@/lib/safeStorage';

export interface AuthUser {
  id: number;
  username: string;
  role?: string;
  employeeId?: number;
  positionId?: number;
  position_id?: number;
  name?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export function useAuth() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["/auth/me"],
    queryFn: () => fetchApi("/auth/me").then(res => res.data as unknown as AuthUser | null),
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: Record<string, unknown>) => fetchApi("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials)
    }),
    onSuccess: (res) => {
      safeStorage.setItem("erp_auth_token", res.data.token as string);
      queryClient.setQueryData(["/auth/me"], res.data.user as AuthUser);
      setLocation("/");
    }
  });

  const logout = () => {
    safeStorage.removeItem("erp_auth_token");
    queryClient.setQueryData(["/auth/me"], null);
    setLocation("/login");
  };

  return {
    user,
    isLoading,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    logout
  };
}
