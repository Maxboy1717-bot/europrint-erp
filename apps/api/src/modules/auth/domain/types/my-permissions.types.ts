/**
 * Foydalanuvchining position'iga asoslangan ruxsat to'plami.
 * ARCHITECTURE.md §7.7 — frontendda `usePermissions` hook'iga uzatish uchun.
 *
 * Cache: Redis 15 daqiqa, position_permissions o'zgarganida invalidate.
 */

export interface ModulePermission {
  module: string;        // CRM, SD, PP, MM, FI, WMS, QC, HR, LMS, DESIGN, LOGISTICS, POS, ECOMMERCE, BI, MDM
  level: string;         // FULL | READ_PLUS | READ | LIMITED | NONE
}

export interface MyPermissions {
  userId: number;
  username: string;
  role: string | null;            // Tizim roli (super_admin, system.readonly_audit) — system-level
  positionId: number | null;
  positionCode: string | null;
  positionNameUz: string | null;
  positionNameRu: string | null;
  departmentCode: string | null;
  departmentNameUz: string | null;
  rbacTier: string | null;        // owner | executive | manager | specialist | operator | standard
  modules: ReadonlyArray<ModulePermission>;
  featureFlags: ReadonlyArray<string>;
  isAdmin: boolean;               // role 'super_admin' yoki 'admin' — barchasi FULL
}
