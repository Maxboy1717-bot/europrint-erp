/**
 * @module TaskDetailSheetTypes
 * @description Shared types, constants, and pure helpers for the TaskDetailSheet
 * family of components. No JSX — safe to import from plain .ts files.
 */

import type React from "react";
import type { KanbanColumn, KanbanCard } from "@shared/schema";
import type {
  CardWithOwner,
  Employee,
  T,
} from "./kanban-types";

import { tLabel } from '@/lib/i18n/tLabel';
// ── Priority badge colours (light theme) ─────────────────────────────────────
export const PRIORITY_DARK: Record<
  string,
  { color: string; bg: string; border: string; label: string }
> = {
  urgent: { color: "#C05050", bg: "rgba(240,128,128,0.14)", border: "rgba(240,128,128,0.30)", label: "Kritik"   },
  high:   { color: "#A07020", bg: "rgba(245,158,11,0.14)",  border: "rgba(245,158,11,0.30)",  label: "Yuqori"   },
  normal: { color: "#2563EB", bg: "rgba(59,130,246,0.10)",  border: "rgba(59,130,246,0.25)",  label: tLabel('kanban.TaskDetailSheet.ortacha', "O'rtacha") },
  low:    { color: "#2D8060", bg: "rgba(109,197,160,0.14)", border: "rgba(109,197,160,0.30)", label: "Past"     },
};

// ── Avatar helpers ────────────────────────────────────────────────────────────
export const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#6366F1,#8B5CF6)",
  "linear-gradient(135deg,#3B82F6,#06B6D4)",
  "linear-gradient(135deg,#10B981,#059669)",
  "linear-gradient(135deg,#F59E0B,#EF4444)",
  "linear-gradient(135deg,#EC4899,#A855F7)",
];

export function initials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
}

export function avatarGradient(name: string): string {
  return AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];
}

// ── Action-button tone classes (light theme) ──────────────────────────────────
export const TONE: Record<string, string> = {
  emerald:     "bg-emerald-50 text-[var(--ep-green)] hover:bg-emerald-100 border-emerald-200",
  destructive: "bg-red-50 text-[var(--ep-red)] hover:bg-red-100 border-red-200",
  blue:        "bg-blue-50 text-[var(--ep-blue)] hover:bg-blue-100 border-blue-200",
  violet:      "bg-violet-50 text-[var(--ep-purple)] hover:bg-violet-100 border-violet-200",
  slate:       "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200",
};

// ── Component prop interfaces ─────────────────────────────────────────────────

/** Props shared by ActionBtn. */
export interface ActionBtnProps {
  onClick: () => void;
  disabled?: boolean;
  tone: string;
  icon: React.ReactNode;
  label: string;
  "data-testid"?: string;
}

/** Top-level props for TaskDetailSheet (and sub-components that need them). */
export interface TaskDetailSheetProps {
  card:         CardWithOwner;
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  employees:    Employee[];
  columns:      KanbanColumn[];
  onUpdate:     (data: Partial<KanbanCard>) => void;
  onDelete:     () => void;
  t: (key: string) => string;
}

/** Props for TaskDetailSheetHeader. */
export interface TaskDetailSheetHeaderProps {
  card:         CardWithOwner;
  onOpenChange: (open: boolean) => void;
  onUpdate:     (data: Partial<KanbanCard>) => void;
  isCompleted:  boolean;
  isAccepted:   boolean;
  isTracking:   boolean;
  ownerName:    string | null;
}

/** Props for TaskDetailSheetActions (action bar + complete dialog). */
export interface TaskDetailSheetActionsProps {
  isTracking:            boolean;
  isCompleted:           boolean;
  isAccepted:            boolean;
  onStartTime:           () => void;
  onStopTime:            () => void;
  isTimerPending:        boolean;
  onAccept:              () => void;
  isAcceptPending:       boolean;
  onOpenComplete:        () => void;
  isCompletePending:     boolean;
  onTabChange:           (tab: string) => void;
  onDelete:              () => void;
  showCompleteDialog:    boolean;
  onCompleteDialogChange:(open: boolean) => void;
  completionReport:      string;
  onCompletionReportChange: (v: string) => void;
  onConfirmComplete:     () => void;
  t: ((key: string) => string) & { actions: { delete: string } };
}
