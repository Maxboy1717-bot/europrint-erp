/**
 * AuditLogPageTypes.ts
 * Interfaces and constants for AuditLogPage
 */

export interface AuditLogRow {
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

export interface FilteredResponse {
  data: AuditLogRow[];
  total: number;
}

export interface TablesResponse {
  tables: string[];
}

export const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-600",
  UPDATE: "bg-blue-600",
  DELETE: "bg-red-600",
  READ:   "bg-gray-500",
};

export const PAGE_SIZE = 50;
