import { apiRequest } from "@/lib/queryClient";

export const adminApi = {
  updateSettings: (data: Record<string, unknown>) =>
    apiRequest("PATCH", "/api/admin/settings", data),

  createUser: (data: { username: string; password: string; role: string; fullName?: string }) =>
    apiRequest("POST", "/api/admin/users", data),

  updateUserRole: (id: number | string, role: string) =>
    apiRequest("PATCH", `/api/admin/users/${id}/role`, { role }),

  deleteUser: (id: number | string) =>
    apiRequest("DELETE", `/api/admin/users/${id}`),
};
