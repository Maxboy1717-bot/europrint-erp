/**
 * @module SuperAdminPanelTypes
 * @description Interfaces, types, schemas, and constants for SuperAdminPanel.
 */

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  plan: "basic" | "professional" | "enterprise";
  status: "active" | "suspended" | "trial";
  usersCount: number;
  modulesEnabled: string[];
  expiresAt: string;
  createdAt: string;
  contactEmail: string;
  contactPhone: string;
}

export interface ModuleDef {
  key: string;
  label: string;
  labelRu: string;
}

export interface PlatformStats {
  tenants: { total: number; active: number; trial: number; suspended: number };
  users: { total: number };
  database: { sizeBytes: number; sizeMB: number };
  uptime: number;
  version: string;
  environment: string;
  errors: { last24h: number };
}

export interface ExpiryAlert {
  id: string;
  name: string;
  plan: string;
  status: string;
  expiresAt: string;
  daysRemaining: number;
  isExpired: boolean;
  contactEmail: string | null;
  contactPhone: string | null;
}

export interface ExpiryAlertsData {
  total: number;
  expired: number;
  expiring: number;
  tenants: ExpiryAlert[];
}

export interface AuditLogEntry {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  changed_fields: string[] | null;
  reason: string | null;
  user_id: string | null;
  user_full_name: string | null;
  user_role: string | null;
  user_display_name: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface AuditFilters {
  action: string;
  table: string;
  userId: string;
  search: string;
  from: string;
  to: string;
}

export const PLAN_LABELS: Record<string, string> = {
  basic: "Basic",
  professional: "Professional",
  enterprise: "Enterprise",
};

export const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  trial: "secondary",
  suspended: "destructive",
};

export const STATUS_LABELS: Record<string, string> = {
  active: "Faol",
  trial: "Sinov",
  suspended: "To'xtatilgan",
};

export const ACTION_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  CREATE: "default",
  INSERT: "default",
  UPDATE: "secondary",
  DELETE: "destructive",
  ARCHIVE: "outline",
};

export const ACTION_LABELS: Record<string, string> = {
  CREATE: "Yaratish",
  INSERT: "Qo'shish",
  UPDATE: "Yangilash",
  DELETE: "O'chirish",
  ARCHIVE: "Arxiv",
};

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("uz-UZ", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
