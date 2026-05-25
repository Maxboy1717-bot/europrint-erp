/**
 * @module WeeklyPlanPageTypes
 * @description Type definitions and pure helpers for WeeklyPlanPage.
 */

export interface WeeklyPlan {
  id: number;
  employeeId: number;
  weekStart: string;
  gsdTarget: string;
  top5Tasks: string[];
  successFactors?: string;
  resourcesNeeded?: string;
  status: "draft" | "submitted" | "approved";
  approvedBy?: number;
  approvedAt?: string;
  createdAt: string;
}

export interface PlanResponse {
  plans: WeeklyPlan[];
  weekStart: string;
}

export function getWeekLabel(weekStart: string): string {
  const d = new Date(weekStart);
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  const fmt = (dt: Date) =>
    dt.toLocaleDateString("uz-UZ", { day: "numeric", month: "short" });
  return `${fmt(d)} — ${fmt(end)}`;
}

export function offsetWeek(weekStart: string, delta: number): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + delta * 7);
  return d.toISOString().split("T")[0];
}

export function getMondayOfWeek(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

export const MANAGER_ROLES = ["director", "super_admin", "department_head", "manager"] as const;
