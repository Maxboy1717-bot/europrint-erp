/**
 * @module HROnboardingTypes
 * @description Shared TypeScript interfaces for the HROnboarding page and
 * its split section/dialog components. No JSX — safe to import from .ts.
 */

export interface ChecklistItem {
  id: string;
  userId: number;
  fullName?: string;
  type: "onboarding" | "offboarding";
  completedItems?: number;
  totalItems?: number;
  status?: string;
}

export interface Employee {
  id: number | string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  positionName?: string;
  position?: string;
  hireDate?: string;
  createdAt?: string;
  departmentName?: string;
  department?: string;
}

export interface FolderItem {
  id: number;
  nodeId: number;
  nodeName?: string;
  itemType: "document" | "video" | "test";
  title: string;
  url?: string;
  createdAt: string;
}

export interface OnboardingRoadmap {
  id: number;
  pipeline_entry_id: number | null;
  employee_id: number | null;
  nastavnik_id: number | null;
  nastavnik_name?: string | null;
  kirish_sanasi: string | null;
  roadmap_data: {
    lavozim_nomi?: string;
    bolim?: string;
    sinov_muddat_oy?: number;
    nastavnik_name?: string;
  };
  candidate_name?: string | null;
  vacancy_title?: string | null;
  funnel_stage?: string | null;
  created_at: string;
}

export interface OnboardingForm {
  userId: string;
  fullName: string;
  positionName: string;
  type: string;
}

export interface ViewRoadmapEntry {
  id: number;
  name: string;
  vacancyTitle?: string;
}

/** Display name helper — shared between sections and helpers. */
export function employeeDisplayName(emp: Employee): string {
  return (
    emp.fullName ||
    `${emp.firstName || ""} ${emp.lastName || ""}`.trim() ||
    emp.name ||
    `#${emp.id}`
  );
}
