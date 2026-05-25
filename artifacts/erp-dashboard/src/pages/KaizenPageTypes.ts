/**
 * @module KaizenPageTypes
 * @description Type definitions and constants for KaizenPage.
 */

import type { ElementType } from "react";
import { Clock, CheckCircle, XCircle, Cog, BarChart3, Layers } from "lucide-react";

import { tLabel } from '@/lib/i18n/tLabel';
export interface KaizenSuggestion {
  id: number;
  employeeId: string;
  departmentId: number | null;
  title: string;
  description: string;
  expectedImpact: string | null;
  status: string;
  approvedBy: string | null;
  implementedAt: string | null;
  resultMeasured: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export const STATUS_CONFIG: Record<string, { label: string; color: string; icon: ElementType }> = {
  submitted:    { label: "Topshirildi",           color: "bg-blue-100 text-blue-800",     icon: Clock },
  review:       { label: tLabel('common.KaizenPage.koribChiqilmoqda', "Ko'rib chiqilmoqda"),    color: "bg-yellow-100 text-yellow-800", icon: Layers },
  approved:     { label: "Tasdiqlandi",           color: "bg-green-100 text-green-800",   icon: CheckCircle },
  rejected:     { label: "Rad etildi",            color: "bg-red-100 text-red-800",       icon: XCircle },
  implementing: { label: tLabel('common.KaizenPage.amalgaOshirilmoqda', "Amalga oshirilmoqda"),  color: "bg-purple-100 text-purple-800", icon: Cog },
  completed:    { label: "Yakunlandi",            color: "bg-teal-100 text-teal-800",     icon: BarChart3 },
};

export const KANBAN_COLUMNS = [
  "submitted", "review", "approved", "implementing", "completed", "rejected",
] as const;

export type KanbanColumn = (typeof KANBAN_COLUMNS)[number];

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  submitted:    ["review", "rejected"],
  review:       ["approved", "rejected"],
  approved:     ["implementing", "rejected"],
  implementing: ["completed"],
  rejected:     [],
  completed:    [],
};
