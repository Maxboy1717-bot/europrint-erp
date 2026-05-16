
import { tLabel } from '@/lib/i18n/tLabel';
/**
 * @module SDCustomersTypes
 * @description TypeScript interfaces, types, and constants for the SDCustomers page.
 * No JSX in this file.
 */

export interface Customer {
  id: number;
  name: string;
  customerCode?: string;
  customerType: "legal" | "individual";
  customerCategory?: string;
  segment?: string;
  status: string;
  stir?: string;
  inn?: string;
  industry?: string;
  phone?: string;
  email?: string;
  address?: string;
  openDebt?: number;
  order_count?: number;
  lifetime_value?: string | number;
  lastContactedAt?: string;
  created_at?: string;
}

export type CustomerFormData = {
  title: string;
  customerType: "legal" | "individual";
  stir?: string;
  phone?: string;
  email?: string;
  address?: string;
  industry?: string;
  source?: string;
  creditLimit?: number;
  paymentTermsDays?: number;
};

export const SEGMENT_CONF: Record<string, { label: string; bg: string; text: string; ring: string; icon: string }> = {
  A: { label: "VIP", bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-[var(--ep-green)] dark:text-emerald-300", ring: "ring-emerald-200 dark:ring-emerald-800", icon: "A" },
  B: { label: "Doimiy", bg: "bg-sky-50 dark:bg-sky-950/40", text: "text-[var(--ep-blue)] dark:text-sky-300", ring: "ring-sky-200 dark:ring-sky-800", icon: "B" },
  C: { label: "Oddiy", bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-[var(--ep-yellow)] dark:text-amber-300", ring: "ring-amber-200 dark:ring-amber-800", icon: "C" },
  D: { label: "Xavfli", bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-[var(--ep-red)] dark:text-rose-300", ring: "ring-rose-200 dark:ring-rose-800", icon: "D" },
  new: { label: tLabel('common.SDCustomers.yangi', "Yangi"), bg: "bg-violet-50 dark:bg-violet-950/40", text: "text-[var(--ep-purple)] dark:text-violet-300", ring: "ring-violet-200 dark:ring-violet-800", icon: "N" },
};

export const STATUS_CONF: Record<string, { label: string; dot: string }> = {
  active: { label: "Aktiv", dot: "bg-emerald-500" },
  inactive: { label: tLabel('common.SDCustomers.nofaol', "Nofaol"), dot: "bg-gray-400" },
  blacklist: { label: tLabel('common.SDCustomers.qoraRoyxat', "Qora ro'yxat"), dot: "bg-rose-500" },
};
