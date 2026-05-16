/**
 * @module RobotsViewTypes
 * @description Types, constants, and schema for RobotsView.
 */

import { z } from "zod";
import { Mail, Bell, CheckSquare, GitBranch, Send, Timer, Zap, Settings } from "lucide-react";

import { tLabel } from '@/lib/i18n/tLabel';
// ── Types ────────────────────────────────────────────────────────────────────

export interface Robot {
  id: number;
  name: string;
  description?: string;
  entityType: string;
  triggerType: string;
  triggerConditions: unknown;
  actionType: string;
  actionConfig: unknown;
  isActive: boolean;
}

export interface RobotFormData {
  name: string;
  description?: string;
  entityType: string;
  triggerType: string;
  triggerConditions: Record<string, unknown>;
  actionType: string;
  actionConfig: Record<string, unknown>;
  isActive: boolean;
}

export interface RobotsViewProps {
  robots: Robot[];
  isLoading: boolean;
}

// ── Zod schema ───────────────────────────────────────────────────────────────

export const robotFormSchema = z.object({
  name: z.string().min(1, "Robot nomini kiriting"),
  description: z.string().optional(),
  entityType: z.string().min(1, "Obyekt turini tanlang"),
  triggerType: z.string().min(1, "Trigger turini tanlang"),
  triggerConditions: z.record(z.unknown()).default({}),
  actionType: z.string().min(1, "Harakat turini tanlang"),
  actionConfig: z.record(z.unknown()).default({}),
  isActive: z.boolean().default(true),
});

export type RobotFormValues = z.infer<typeof robotFormSchema>;

// ── Constants ────────────────────────────────────────────────────────────────

export const TRIGGER_TYPES = [
  { value: "CREATED", label: tLabel('crm.RobotsView.yaratilganda', "Yaratilganda"), icon: Zap },
  { value: "STAGE_CHANGED", label: tLabel('crm.RobotsView.bosqichOzgarganda', "Bosqich o'zgarganda"), icon: GitBranch },
  { value: "FIELD_CHANGED", label: tLabel('crm.RobotsView.maydonOzgarganda', "Maydon o'zgarganda"), icon: Settings },
  { value: "TIME_ELAPSED", label: tLabel('crm.RobotsView.vaqtOtganda', "Vaqt o'tganda"), icon: Timer },
];

export const ACTION_TYPES = [
  { value: "SEND_NOTIFICATION", label: tLabel('crm.RobotsView.xabarnomaYuborish', "Xabarnoma yuborish"), icon: Bell },
  { value: "CREATE_TASK", label: tLabel('crm.RobotsView.vazifaYaratish', "Vazifa yaratish"), icon: CheckSquare },
  { value: "CHANGE_STAGE", label: tLabel('crm.RobotsView.bosqichniOzgartirish', "Bosqichni o'zgartirish"), icon: GitBranch },
  { value: "SEND_EMAIL", label: tLabel('crm.RobotsView.emailYuborish', "Email yuborish"), icon: Mail },
  { value: "SEND_TELEGRAM", label: tLabel('crm.RobotsView.telegramYuborish', "Telegram yuborish"), icon: Send },
];

export const ENTITY_COLORS: Record<string, string> = {
  leads: "border-l-4 border-l-blue-500",
  deals: "border-l-4 border-l-green-500",
  contacts: "border-l-4 border-l-purple-500",
  companies: "border-l-4 border-l-orange-500",
};

export const DEFAULT_ROBOT_FORM: RobotFormValues = {
  name: "",
  description: "",
  entityType: "",
  triggerType: "",
  triggerConditions: {},
  actionType: "",
  actionConfig: {},
  isActive: true,
};
