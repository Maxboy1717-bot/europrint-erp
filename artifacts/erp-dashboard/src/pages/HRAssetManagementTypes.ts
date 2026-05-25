/**
 * @module HRAssetManagementTypes
 * @description Shared interfaces, types, and UI-label constants for the HR Asset
 * Management feature. Contains no JSX — safe to import from both .ts and .tsx files.
 */

import { Monitor, Smartphone, Key, Shirt, Printer, Laptop, Package } from "lucide-react";

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export type ReportType = "lost" | "broken" | "damaged";

export interface AssignmentHistory {
  id: string;
  employee_id: string;
  employee_name: string | null;
  assigned_date: string;
  return_date: string | null;
  condition_on_assign: string;
  condition_on_return: string | null;
}

export interface Asset {
  id: string;
  serial_number: string | null;
  name: string;
  category: string;
  status: string;
  purchase_date: string | null;
  value: number;
  department_id: string | null;
  notes: string | null;
  created_at: string;
  assigned_to: string | null;
  assigned_employee_name: string | null;
  assigned_date: string | null;
  history?: AssignmentHistory[];
}

export interface Department {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  full_name: string;
  employee_id: string;
}

// ---------------------------------------------------------------------------
// Form-state shapes
// ---------------------------------------------------------------------------

export interface AssetForm {
  serial_number: string;
  name: string;
  category: string;
  status: string;
  purchase_date: string;
  value: string;
  notes: string;
}

export interface AssignForm {
  employee_id: string;
  assigned_date: string;
  condition_on_assign: string;
  notes: string;
}

export interface ReturnForm {
  return_date: string;
  condition_on_return: string;
  notes: string;
}

export interface ReportForm {
  report_type: ReportType;
  description: string;
}

// ---------------------------------------------------------------------------
// Default / empty form values
// ---------------------------------------------------------------------------

export const EMPTY_FORM: AssetForm = {
  serial_number: "",
  name: "",
  category: "laptop",
  status: "available",
  purchase_date: "",
  value: "",
  notes: "",
};

export const EMPTY_ASSIGN: AssignForm = {
  employee_id: "",
  assigned_date: new Date().toISOString().slice(0, 10),
  condition_on_assign: "good",
  notes: "",
};

export const EMPTY_RETURN: ReturnForm = {
  return_date: new Date().toISOString().slice(0, 10),
  condition_on_return: "good",
  notes: "",
};

export const EMPTY_REPORT: ReportForm = {
  report_type: "broken",
  description: "",
};

// ---------------------------------------------------------------------------
// Label/icon lookup tables
// ---------------------------------------------------------------------------

export const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  laptop: Laptop,
  computer: Monitor,
  phone: Smartphone,
  printer: Printer,
  key: Key,
  uniform: Shirt,
  other: Package,
};

export const CATEGORY_LABELS: Record<string, string> = {
  laptop: "Noutbuk",
  computer: "Kompyuter",
  phone: "Telefon",
  printer: "Printer",
  key: "Kalit",
  uniform: "Forma kiyim",
  other: "Boshqa",
};

export const STATUS_LABELS: Record<string, string> = {
  available: "Bo'sh",
  assigned: "Berilgan",
  broken: "Buzilgan",
  lost: "Yo'qolgan",
  damaged: "Shikastlangan",
  maintenance: "Ta'mirda",
};

export const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  available: "outline",
  assigned: "default",
  broken: "destructive",
  lost: "destructive",
  damaged: "destructive",
  maintenance: "secondary",
};

export const CONDITION_LABELS: Record<string, string> = {
  new: "Yangi",
  good: "Yaxshi",
  fair: "Qoniqarli",
  poor: "Yomon",
  broken: "Buzilgan",
};
