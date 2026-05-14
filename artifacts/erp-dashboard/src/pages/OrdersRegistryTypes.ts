/**
 * @module OrdersRegistryTypes
 * @description Types, interfaces, and constants for the OrdersRegistry feature.
 */

export interface OrdersRegistryEntry {
  id: number;
  number: string;
  category: string;
  title: string;
  content?: string;
  issuedBy: string | null;
  issuedDate: string;
  status: string;
  departmentIds: number[] | null;
  createdAt: string;
}

export const CATEGORIES = ["OT", "OM", "OR", "OP", "OX"] as const;
export type Category = typeof CATEGORIES[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  OT: "Umumiy buyruq",
  OM: "Mehnat buyruqi",
  OR: "Rejalashtiruv buyruqi",
  OP: "Ishlab chiqarish buyruqi",
  OX: "Xo'jalik buyruqi",
};

export const CATEGORY_COLORS: Record<Category, string> = {
  OT: "bg-blue-100 text-blue-800",
  OM: "bg-green-100 text-green-800",
  OR: "bg-purple-100 text-purple-800",
  OP: "bg-orange-100 text-orange-800",
  OX: "bg-teal-100 text-teal-800",
};

export const STATUS_LABELS: Record<string, string> = {
  active: "Faol",
  cancelled: "Bekor qilingan",
  expired: "Muddati o'tgan",
};

export const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  expired: "bg-gray-100 text-gray-600",
};
