/**
 * @module auth
 * @description Frontend utility / library module.
 */

import { apiRequest } from "@/lib/queryClient";

export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    apiRequest("POST", "/api/auth/login", credentials),

  logout: () =>
    apiRequest("POST", "/api/auth/logout"),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiRequest("PATCH", "/api/auth/change-password", data),
};
