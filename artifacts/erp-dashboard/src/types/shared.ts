/**
 * @module types/shared
 * @description Canonical shared interfaces for Employee, Department, and Position.
 *
 * All fields are merged from 23 duplicate definitions found across the codebase.
 * Optional fields cover domain-specific usage; required fields are the common
 * minimum needed across all consumers.
 *
 * IMPORTANT: Do NOT redefine Employee, Department, or Position in individual
 * page/component files. Import from here instead:
 *   import type { Employee } from '@/types/shared';
 */

// ---------------------------------------------------------------------------
// Employee
// ---------------------------------------------------------------------------

/**
 * Canonical Employee interface.
 *
 * Required: id, fullName, status
 * All other fields are optional — they may be absent depending on the API endpoint.
 *
 * NOTE: Chat-module files use id: number and avatarUrl — see ChatEmployee below.
 * NOTE: Warehouse assignment records use a different shape — see WarehouseAssignedEmployee below.
 */
export interface Employee {
  id: string;
  fullName: string;
  employeeId?: string;
  status?: string;

  // Contact & personal
  email?: string;
  phone?: string;
  birthDate?: string;
  hireDate?: string;
  gender?: string;
  address?: string;
  district?: string;
  age?: number | string;
  maritalStatus?: string;
  childrenCount?: number;
  childrenEducation?: string;
  householdSize?: number | string;
  householdMembers?: string;
  housingType?: string;

  // Identity / profile
  profileImageUrl?: string | null;
  telegramId?: string;
  telegramChatId?: string;

  // Org placement
  departmentId?: string | null;
  departmentName?: string;
  positionId?: string;
  positionName?: string;
  positionOfficialTitle?: string;
  positionCkp?: string;
  ckpCode?: string;
  hierarchyLevel?: string;

  // Compensation
  salary?: number;
  salaryType?: string;

  // Manager / hierarchy
  managerId?: string;
  managerName?: string;
  managerEmployeeId?: string;
  managerProfileImageUrl?: string;
  manager?: { fullName: string };
  subordinates?: Array<{
    id: string;
    fullName: string;
    employeeId?: string;
    positionName?: string;
    departmentName?: string;
    status: string;
    profileImageUrl?: string | null;
  }>;

  // Location (HR map / transport)
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | null;
  lng?: number | null;

  // Work details
  shift?: string;
  workshopZone?: string;
  attestationDate?: string;
  orgStructure?: string;

  // Machine operator
  is_machine_operator?: boolean;
  machine_id?: string;
  machine_name?: string;

  // Auth / access
  role?: string;
  hasPassword?: boolean;

  // HR stats (used in hr/stats context)
  rating?: number;
  failedTests?: number;
  bonusAmount?: number;

  // LMS / training (used in EmployeeTable context)
  coursesCompleted?: number;
  coursesTotal?: number;
  disciplineCount?: number;

  // Metadata
  createdAt?: string | Date | null;
}

/**
 * Chat-specific employee variant.
 * Chat API returns id as number and uses avatarUrl instead of profileImageUrl.
 * Used in: ChatWidget.helpers.tsx, CreateRoomModal.tsx, DirectMessageModal.tsx, CreateTaskModal.tsx
 */
export interface ChatEmployee {
  id: number;
  fullName: string;
  employeeId?: string;
  avatarUrl?: string;
  departmentName?: string;
}

/**
 * Warehouse-assigned employee (employees tab inside a warehouse record).
 * Completely different shape from the HR Employee — it represents an assignment row.
 */
export interface WarehouseAssignedEmployee {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  role: string;
  isPrimary: boolean;
  assignedAt: string;
}

// ---------------------------------------------------------------------------
// Department
// ---------------------------------------------------------------------------

/**
 * Canonical Department interface.
 *
 * Merges the full DB shape (from Departments.tsx) with org-hierarchy fields
 * (from OrgDepartmentsPage.tsx) and bilingual name fields used in dropdowns.
 */
export interface Department {
  id: string;
  name: string;

  // Bilingual names (from ApplicationsTypes / camera-heatmap / employee-dialog)
  nameRu?: string;
  name_uz?: string | null;
  name_ru?: string | null;

  // Full DB shape (from Departments.tsx)
  code?: string | null;
  level?: number | null;
  sort_order?: number | null;
  is_active?: boolean;
  description?: string | null;
  color?: string | null;
  created_at?: string;

  // Org hierarchy (from OrgDepartmentsPage.tsx)
  parentId?: string | null;
  employeeCount?: number;
  isActive?: boolean;
  head?: string;
}

// ---------------------------------------------------------------------------
// Position
// ---------------------------------------------------------------------------

/**
 * Canonical Position interface.
 *
 * Merges the full DB shape (from PositionsTypes.ts) with the optional fields
 * used in dropdowns / employee-dialog.
 */
export interface Position {
  id: string;
  name: string;

  // Bilingual names
  nameRu?: string;
  name_uz?: string | null;
  name_ru?: string | null;

  // Full DB shape (from PositionsTypes.ts)
  code?: string | null;
  department_id?: string | null;
  /** Also surfaced as departmentId in some contexts */
  departmentId?: string;
  level?: number | null;
  rbac_tier?: string | null;
  is_management?: boolean;
  min_salary?: number | null;
  max_salary?: number | null;
  headcount?: number | null;
  is_active?: boolean;
  description?: string | null;
  official_title?: string | null;
}
