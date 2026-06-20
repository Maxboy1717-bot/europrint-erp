/** @module CoordinationPageTypes @description TypeScript interfaces, types, constants, and pure utility functions for the CoordinationPage feature. No JSX. */

import {
  Crown, Building2, Users, Handshake, Settings,
} from "lucide-react";

// ─── Council hierarchy data ────────────────────────────────────────────────
export const COUNCIL_LEVELS = [
  {
    level: 1, key: "founderCouncil" as const,
    freqKey: "founderCouncilFreq", purposeKey: "founderCouncilPurpose",
    icon: Crown,
    color: "bg-amber-50 border-amber-300 text-amber-900",
    badgeClass: "bg-[var(--ep-yellow)] text-white",
    dotClass: "bg-amber-400",
  },
  {
    level: 2, key: "executiveCouncil" as const,
    freqKey: "executiveCouncilFreq", purposeKey: "executiveCouncilPurpose",
    icon: Building2,
    color: "bg-blue-50 border-blue-300 text-blue-900",
    badgeClass: "bg-[var(--ep-blue)] text-white",
    dotClass: "bg-blue-400",
  },
  {
    level: 3, key: "recommendationCouncil" as const,
    freqKey: "recommendationCouncilFreq", purposeKey: "recommendationCouncilPurpose",
    icon: Users,
    color: "bg-emerald-50 border-emerald-300 text-emerald-900",
    badgeClass: "bg-[var(--ep-green)] text-white",
    dotClass: "bg-emerald-400",
  },
  {
    level: 4, key: "recommendationCommittee" as const,
    freqKey: "recommendationCommitteeFreq", purposeKey: "recommendationCommitteePurpose",
    icon: Handshake,
    color: "bg-violet-50 border-violet-300 text-violet-900",
    badgeClass: "bg-[var(--ep-purple)] text-white",
    dotClass: "bg-violet-400",
  },
  {
    level: 5, key: "deputyCouncil" as const,
    freqKey: "deputyCouncilFreq", purposeKey: "deputyCouncilPurpose",
    icon: Settings,
    color: "bg-slate-50 border-slate-300 text-slate-800",
    badgeClass: "bg-slate-500 text-white",
    dotClass: "bg-slate-400",
  },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────
export interface Council {
  id: number;
  name: string;
  council_type: string;
  description: string | null;
  is_active: boolean;
  chairperson_name?: string | null;
  meeting_schedule?: string | null;
}

export type DoklaStatus   = "sent" | "read" | "resolved";
export type RaspoStatus   = "assigned" | "in_progress" | "done" | "overdue";
export type BasketType    = "incoming" | "pending" | "outgoing";

export interface Dokla {
  id: string;
  from_name: string;
  subject: string;
  created_at: string;
  status: DoklaStatus;
  council_level: number;
  problem?: string;
  result?: string;
  proposal?: string;
}

export interface Raspo {
  id: string;
  to_user: string;
  to_name?: string | null;
  task: string;
  deadline?: string;
  status: RaspoStatus;
  priority: string;
  from_name?: string;
}

export interface BasketDoc {
  id: string;
  title: string;
  from_name?: string;
  deadline?: string;
  basket: BasketType;
  created_at: string;
  overdue?: boolean;
}

export interface CoordinationStats {
  dokla: { sent: string; read: string; resolved: string; total: string };
  rasporyazhenie: { assigned: string; in_progress: string; done: string; overdue: string; total: string };
}

export type DoklaFormState = {
  subject: string;
  problem: string;
  result: string;
  proposal: string;
  councilLevel: string;
};

export type RaspoFormState = {
  to: string;
  task: string;
  deadline: string;
  priority: string;
};

export const VALID_TABS = ["overview", "dokla", "raspo", "baskets", "councils"] as const;
export type CoordinationTab = typeof VALID_TABS[number];

// ─── Pure utility functions ───────────────────────────────────────────────
export function shortDate(dt?: string): string {
  if (!dt) return "—";
  return dt.split("T")[0] || dt.slice(0, 10);
}

export function isOverdue(deadline?: string): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}
