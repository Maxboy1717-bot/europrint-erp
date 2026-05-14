/**
 * @module RaciCrisisPageTypes
 * @description Shared TypeScript interfaces, types, and constants for RaciCrisisPage.
 */

export interface RaciTask {
  id: string | number;
  title?: string;
  description?: string;
  status?: string;
  responsible_id?: string | number;
  responsibleId?: string | number;
  accountable_id?: string | number;
  accountableId?: string | number;
  deadline?: string;
  created_by?: string | number;
  createdBy?: string | number;
}

export interface Crisis {
  id: string | number;
  title?: string;
  status?: string;
  risk_level?: string;
  riskLevel?: string;
  description?: string;
  created_at?: string;
  createdAt?: string;
}

export const TASK_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  open:        { label: "Ochiq",      variant: "secondary"   },
  in_progress: { label: "Jarayonda",  variant: "default"     },
  completed:   { label: "Tugallandi", variant: "outline"     },
  cancelled:   { label: "Bekor",      variant: "destructive" },
};

export const RISK_COLORS: Record<string, string> = {
  low:      "text-[var(--ep-green)]",
  medium:   "text-[var(--ep-yellow)]",
  high:     "text-[var(--ep-primary)]",
  critical: "text-destructive",
};

export type TabType = "tasks" | "crises";

export const TASK_QUERY_KEY = ["/api/raci-crisis/tasks"];
export const CRISIS_QUERY_KEY = ["/api/raci-crisis/crises"];

export interface TaskFormState {
  title: string;
  description: string;
  responsible_id: string;
  accountable_id: string;
  deadline: string;
}

export const INITIAL_TASK_FORM: TaskFormState = {
  title: "",
  description: "",
  responsible_id: "",
  accountable_id: "",
  deadline: "",
};
