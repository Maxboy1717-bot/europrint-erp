/**
 * @module DataTable.types
 * @description Types and status config for DataTable component.
 * Split out so the table file stays under 300 lines.
 */

import type * as React from "react";

import { tLabel } from '@/lib/i18n/tLabel';
export type SortDir = "asc" | "desc" | null;

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface DataTableProps<T extends { id: string | number }> {
  title?: string;
  columns: TableColumn<T>[];
  data: T[];
  pageSize?: number;
  onAdd?: () => void;
  addLabel?: string;
  onRowAction?: (id: string | number, action: string) => void;
  searchPlaceholder?: string;
  isLoading?: boolean;
}

export interface EmployeeRow {
  id: number;
  name: string;
  position: string;
  department: string;
  status: string;
  avatar?: string;
}

export const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  active: {
    label: "Aktiv",
    color: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20",
    dot: "bg-[hsl(var(--success))]",
  },
  vacation: {
    label: "Ta'tilda",
    color: "bg-[hsl(var(--info))]/10 text-[hsl(var(--info))] border-[hsl(var(--info))]/20",
    dot: "bg-[hsl(var(--info))]",
  },
  sick: {
    label: "Kasal",
    color: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/20",
    dot: "bg-[hsl(var(--warning))]",
  },
  dismissed: {
    label: tLabel('common.DataTable.ishdanKetgan', "Ishdan ketgan"),
    color: "bg-[hsl(var(--error))]/10 text-[hsl(var(--error))] border-[hsl(var(--error))]/20",
    dot: "bg-[hsl(var(--error))]",
  },
  probation: {
    label: "Sinov muddati",
    color: "bg-secondary/10 text-secondary border-secondary/20",
    dot: "bg-secondary",
  },
};
