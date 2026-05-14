/**
 * @module PositionsTypes
 * @description TypeScript interfaces, types, and constants for the Positions page.
 */

export interface Position {
  id: string;
  code: string | null;
  name: string;
  name_uz: string | null;
  name_ru: string | null;
  department_id: string | null;
  level: number | null;
  rbac_tier: string | null;
  is_management: boolean;
  min_salary: number | null;
  max_salary: number | null;
  headcount: number | null;
  is_active: boolean;
  description: string | null;
  official_title: string | null;
}

export interface Department {
  id: string;
  name: string;
  name_uz: string | null;
}

export interface KpiTemplate {
  key: string;
  label: string;
  description: string;
}

export const KPI_TEMPLATES: KpiTemplate[] = [
  { key: "standard_employee", label: "Standart xodim", description: "Davomat, sifat, vazifalar, LMS, jamoa ishlashi" },
  { key: "machine_operator",  label: "Mashinа operatori", description: "Ishlab chiqarish, nuqsonlar, ish vaqti, xavfsizlik" },
  { key: "manager",           label: "Menejer",          description: "Jamoa samaradorligi, maqsad bajarish, qoniqish" },
  { key: "sales",             label: "Sotuv menejeri",   description: "Daromad, bitimlar, lead konversiyasi, NPS" },
  { key: "hr_specialist",     label: "HR mutaxassis",    description: "Yollash tezligi, ushlab qolish, suhbat samarasi" },
];

export const EMPTY_FORM = {
  name: "", name_uz: "", name_ru: "", code: "", official_title: "",
  department_id: "", level: 1, is_management: false, is_active: true,
  headcount: 1, min_salary: "", max_salary: "", description: "",
};

export type PositionForm = typeof EMPTY_FORM;

export const RBAC_TIERS: Record<string, string> = {
  owner: "Egasi", director: "Direktor", manager: "Menejer",
  specialist: "Mutaxassis", employee: "Xodim",
};
