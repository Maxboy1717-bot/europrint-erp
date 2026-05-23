/**
 * @module @workspace/types/employee
 * @description Canonical Employee type — yagona manba. Avval har joyda
 *   alohida `interface Employee` mavjud edi (35 fayl). Endi shu yerdan import qilinadi.
 *
 *   Backend asosan snake_case (full_name, department_name), frontend asosan
 *   camelCase (fullName, departmentName) ishlatadi. Ikkisi ham canon'ga
 *   `optional` qilib qo'shilgan — har bir consumer o'z preferensi bilan ishlaydi.
 */

export interface Employee {
  // ── Identifier ────────────────────────────────────────────────────────────
  id: number | string;
  user_id?: number | string | null;
  employee_code?: string | null;
  employeeId?: string | null;          // FE alias for employee_code

  // ── Names ─────────────────────────────────────────────────────────────────
  first_name?: string | null;
  firstName?: string | null;
  last_name?: string | null;
  lastName?: string | null;
  middle_name?: string | null;
  full_name?: string | null;
  fullName?: string | null;
  name?: string | null;                // generic alias

  // ── Contact ───────────────────────────────────────────────────────────────
  email?: string | null;
  phone?: string | null;
  address?: string | null;

  // ── Position / Department ─────────────────────────────────────────────────
  position_id?: number | string | null;
  positionId?: string | null;
  position_name?: string | null;
  positionName?: string | null;
  position?: string | null;            // generic alias
  positionOfficialTitle?: string | null;
  positionCkp?: string | null;
  department_id?: number | string | null;
  departmentId?: string | null;
  department_name?: string | null;
  departmentName?: string | null;
  department?: string | null;          // generic alias
  org_department_id?: number | string | null;

  // ── Manager hierarchy ─────────────────────────────────────────────────────
  manager_id?: number | string | null;
  managerId?: string | null;
  managerName?: string | null;
  managerEmployeeId?: string | null;
  managerProfileImageUrl?: string | null;

  // ── Dates ─────────────────────────────────────────────────────────────────
  hire_date?: string | Date | null;
  hireDate?: string | null;
  termination_date?: string | Date | null;
  birthDate?: string | null;
  birth_date?: string | null;

  // ── Status ────────────────────────────────────────────────────────────────
  status?: 'active' | 'inactive' | 'on_leave' | 'terminated' | 'resigned' | string;
  is_active?: boolean;

  // ── Avatars / images ──────────────────────────────────────────────────────
  avatar_url?: string | null;
  profileImageUrl?: string | null;
  photoUrl?: string | null;

  // ── Financial ─────────────────────────────────────────────────────────────
  base_salary?: number | string | null;
  salary?: number | null;
  bonusAmount?: number | null;

  // ── Personal ──────────────────────────────────────────────────────────────
  gender?: string | null;
  age?: number | string | null;
  maritalStatus?: string | null;
  childrenCount?: number | null;
  householdSize?: number | string | null;
  householdMembers?: string | null;
  housingType?: string | null;
  childrenEducation?: string | null;
  district?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | null;
  lng?: number | null;

  // ── Shift / scheduling ────────────────────────────────────────────────────
  shift?: string | null;

  // ── LMS / training ────────────────────────────────────────────────────────
  rating?: number | null;
  coursesCompleted?: number | null;
  coursesTotal?: number | null;
  failedTests?: number | null;
  disciplineCount?: number | null;

  // ── Telegram / external ───────────────────────────────────────────────────
  telegramId?: string | null;
  telegramChatId?: string | null;

  // ── Org structure / misc ──────────────────────────────────────────────────
  orgStructure?: string | null;
  attestationDate?: string | null;
  avatarUrl?: string | null;

  // ── Timestamps ────────────────────────────────────────────────────────────
  created_at?: string | Date | null;
  createdAt?: string | Date | null;
  updated_at?: string | Date | null;
}

export interface Department {
  id: number | string;
  code?: string | null;
  name?: string | null;
  name_uz?: string | null;
  name_ru?: string | null;
  parent_id?: number | string | null;
  manager_id?: number | string | null;
  head_user_id?: number | string | null;
  level?: number | null;
  sort_order?: number | null;
  is_active?: boolean;
  description?: string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
}

export interface Position {
  id: number | string;
  code?: string | null;
  name?: string | null;
  name_uz?: string | null;
  name_ru?: string | null;
  position_name?: string | null;
  position_name_ru?: string | null;
  department_id?: number | string | null;
  is_active?: boolean;
  display_order?: number | null;
  level?: number | null;
  rbac_tier?: string | null;
  is_management?: boolean | null;
  headcount?: number | null;
}

export interface AttendanceRecord {
  id: number | string;
  employee_id: number | string;
  date: string | Date;
  check_in?: string | Date | null;
  check_out?: string | Date | null;
  status?: 'present' | 'absent' | 'late' | 'early_leave' | 'on_leave' | string;
  hours_worked?: number | null;
  notes?: string | null;
}
