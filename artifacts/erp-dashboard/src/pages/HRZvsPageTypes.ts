/**
 * @module HRZvsPageTypes
 * @description Type definitions and constants for HRZvsPage.
 */

import type React from "react";

import { tLabel } from '@/lib/i18n/tLabel';
export interface ZvsRequest {
  id: string | number;
  purpose: string;
  amount: number | string;
  status?: string;
  priority?: string;
  submitter_name?: string;
  submitterName?: string;
  department_id?: number;
  departmentId?: number;
  week_date?: string;
  weekDate?: string;
  comment?: string;
  created_at?: string;
  createdAt?: string;
}

export interface ZvsFormState {
  purpose: string;
  amount: string;
  submitter_name: string;
  priority: string;
  week_date: string;
}

export interface ActionDialogState {
  id: string | number;
  type: "approve" | "reject";
}

export const STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ReactNode }
> = {
  pending:  { label: tLabel('hr.HRZvsPage.kutilmoqda', "Kutilmoqda"),   variant: "secondary",   icon: null },
  approved: { label: tLabel('hr.HRZvsPage.tasdiqlangan', "Tasdiqlangan"), variant: "default",     icon: null },
  rejected: { label: "Rad etildi",   variant: "destructive", icon: null },
};

export const PRIORITY_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  low:    { label: "Past",         color: "text-muted-foreground", icon: null },
  normal: { label: tLabel('hr.HRZvsPage.ortacha', "O'rtacha"),     color: "text-[var(--ep-blue)]",         icon: null },
  high:   { label: "Yuqori",       color: "text-[var(--ep-primary)]",       icon: null },
  urgent: { label: "Shoshilinch",  color: "text-destructive",      icon: null },
};

export const formatAmount = (v: number | string): string =>
  Number(v).toLocaleString("uz-UZ") + " so'm";
