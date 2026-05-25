
import { tLabel } from '@/lib/i18n/tLabel';
/**
 * @module UsersPageTypes
 * @description Types and constants for UsersPage.
 */

export const ALL_ROLES = [
  { value: "super_admin",     label: "Super Admin" },
  { value: "director",        label: "Direktor" },
  { value: "department_head", label: tLabel('common.UsersPage.bolimBoshligi', "Bo'lim boshlig'i") },
  { value: "accountant",      label: "Buxgalter" },
  { value: "employee",        label: tLabel('common.UsersPage.xodim', "Xodim") },
] as const;

export const ROLE_COLORS: Record<string, string> = {
  super_admin:      "bg-purple-100 text-purple-800",
  director:         "bg-blue-100 text-blue-800",
  department_head:  "bg-indigo-100 text-indigo-800",
  accountant:       "bg-amber-100 text-amber-800",
  employee:         "bg-gray-100 text-gray-700",
};

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
}

export interface UsersResponse {
  users: AdminUser[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

export interface UserCreateForm {
  username: string;
  email: string;
  password: string;
  role: string;
}

export const EMPTY_FORM: UserCreateForm = {
  username: "",
  email: "",
  password: "",
  role: "employee",
};
