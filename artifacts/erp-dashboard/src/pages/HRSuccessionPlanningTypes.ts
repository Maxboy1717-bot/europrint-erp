/**
 * @module HRSuccessionPlanningTypes
 * @description Types, constants, and interfaces for HRSuccessionPlanning.
 */

import type { BadgeProps } from "@/components/ui/badge";

import { tLabel } from '@/lib/i18n/tLabel';
export const RISK_COLOR: Record<string, BadgeProps["variant"]> = {
  critical: "destructive",
  high: "destructive",
  medium: "default",
  low: "secondary",
};

export const RISK_LABEL: Record<string, string> = {
  critical: "Kritik",
  high: "Yuqori",
  medium: "O'rta",
  low: "Past",
};

export interface NineBoxBlock {
  label: string;
  desc: string;
  color: string;
}

export const NINE_BOX: NineBoxBlock[] = [
  { label: tLabel('hr.HRSuccessionPlanning.yulduzlar', "Yulduzlar"), desc: "Yuqori pot. + A'lo samaradorlik", color: "bg-green-100 dark:bg-green-900/30 border-green-400" },
  { label: "Kelajak yetakchilari", desc: "Yuqori pot. + Yaxshi samaradorlik", color: "bg-blue-100 dark:bg-blue-900/30 border-blue-400" },
  { label: tLabel('hr.HRSuccessionPlanning.ishchiOtliqlar', "Ishchi otliqlar"), desc: "Yuqori pot. + Past samaradorlik", color: "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400" },
  { label: tLabel('hr.HRSuccessionPlanning.yashirinYulduzlar', "Yashirin yulduzlar"), desc: "O'rta pot. + A'lo samaradorlik", color: "bg-teal-100 dark:bg-teal-900/30 border-teal-400" },
  { label: tLabel('hr.HRSuccessionPlanning.asosiyIshchilar', "Asosiy ishchilar"), desc: "O'rta pot. + Yaxshi samaradorlik", color: "bg-muted/40 dark:bg-gray-900/30 border-gray-400" },
  { label: "Muammoli", desc: "O'rta pot. + Past samaradorlik", color: "bg-orange-100 dark:bg-orange-900/30 border-orange-400" },
  { label: "Mutaxassis", desc: "Past pot. + A'lo samaradorlik", color: "bg-purple-100 dark:bg-purple-900/30 border-purple-400" },
  { label: "Barqaror", desc: "Past pot. + Yaxshi samaradorlik", color: "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-400" },
  { label: "Chiqish/Rivojlanish", desc: "Past pot. + Past samaradorlik", color: "bg-red-100 dark:bg-red-900/30 border-red-400" },
];

export interface NewPlanForm {
  userId: string;
  targetPositionId: string;
  targetDate: string;
  notes: string;
}

export const EMPTY_PLAN_FORM: NewPlanForm = {
  userId: "",
  targetPositionId: "",
  targetDate: "",
  notes: "",
};
