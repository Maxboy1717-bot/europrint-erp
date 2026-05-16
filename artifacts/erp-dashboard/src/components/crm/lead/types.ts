/**
 * @module types
 * @description React UI component.
 */

import { z } from "zod";

import { tLabel } from '@/lib/i18n/tLabel';
export type Lead = {
  id: number;
  title: string;
  name: string | null;
  secondName: string | null;
  lastName: string | null;
  companyTitle: string | null;
  sourceId: string | null;
  sourceDescription: string | null;
  statusId: string;
  statusDescription: string | null;
  phones: { value: string; type: string }[];
  emails: { value: string; type: string }[];
  websites: { value: string; type: string }[];
  assignedById: string | null;
  createdById: string | null;
  dateCreate: string;
  dateModify: string;
  comments: string | null;
  opportunity?: number;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
};

export const leadFormSchema = z.object({
  title: z.string().min(1, "Lead nomi kerak"),
  name: z.string().optional(),
  lastName: z.string().optional(),
  companyTitle: z.string().optional(),
  sourceId: z.string().optional(),
  comments: z.string().optional(),
  opportunity: z.number().optional(),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;

export const STAGE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  NEW: { label: "Ishlov berilmagan", color: "#4CAF50", icon: "🆕" },
  IN_PROGRESS: { label: "Ishda", color: "#2196F3", icon: "⚙️" },
  ANALYSIS: { label: "Tahlil qilish", color: "#FF9800", icon: "🔍" },
  FINAL: { label: "Yakunlash", color: "#9C27B0", icon: "🎯" },
  CONVERTED: { label: "Konvertatsiya", color: "#22C55E", icon: "✅" },
  WON: { label: "Yutildi", color: "#16A34A", icon: "🏆" },
  LOST: { label: tLabel('common..yoqotildi', "Yo'qotildi"), color: "#EF4444", icon: "❌" },
};

export interface Stage {
  id: number;
  stageId: string;
  name: string;
  color: string;
}

export interface Activity {
  id: number;
  subject: string;
  type: string;
  dueDate: string | null;
  isDone: boolean;
}

export interface HistoryItem {
  id: number;
  action: string;
  oldStageId?: string;
  newStageId?: string;
  user?: {
    fullName: string;
  };
  createdAt: string;
}
