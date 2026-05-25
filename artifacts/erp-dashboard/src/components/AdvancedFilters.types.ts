/**
 * @module AdvancedFilters.types
 * @description Types, interfaces and constants for AdvancedFilters component.
 * Split from AdvancedFilters.tsx (Rule 16).
 */

export type { Course } from '@/types/lms';

export interface OrgDepartment {
  id: string;
  name: string;
}

export interface CoursePagination {
  total: number;
  page: number;
  limit: number;
}

export interface FilterConfig {
  dateRange: { start: string; end: string } | null;
  orgDepartments: string[];
  courses: string[];
  status: string | null;
}

export interface AdvancedFiltersProps {
  onFilterChange: (filters: FilterConfig) => void;
}

export const DATE_RANGES = [
  { value: "today",   label: "Bugun" },
  { value: "week",    label: "Bu hafta" },
  { value: "month",   label: "Bu oy" },
  { value: "quarter", label: "Bu chorak" },
  { value: "year",    label: "Bu yil" },
  { value: "custom",  label: "Maxsus oraliq" },
];
