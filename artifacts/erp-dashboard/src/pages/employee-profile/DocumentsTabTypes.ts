/**
 * DocumentsTabTypes — Constants, interfaces, schema, and pure helpers
 * for the DocumentsTab component.  No React/JSX imports needed here.
 */
import { z } from "zod";
import { AlertCircle, Clock, CheckCircle2, XCircle } from "lucide-react";
import {
  User, BookOpen, HeartPulse, Briefcase, FileSignature, FolderOpen,
  ScrollText, FileText, ShoppingBag, Stethoscope, GraduationCap, MoreHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { tLabel } from '@/lib/i18n/tLabel';
// ─── Label maps ───────────────────────────────────────────────────────────────

export const DOC_TYPE_LABELS: Record<string, string> = {
  LEAVE_REQUEST:       "Ta'til so'rovi",
  ADVANCE_REQUEST:     "Avans so'rovi",
  DISCIPLINE_NOTICE:   "Intizom bildirishnomasi",
  EMPLOYMENT_CONTRACT: "Mehnat shartnomasi",
  AMENDMENT_CONTRACT:  "Qo'shimcha kelishuv",
  DISMISSAL_ORDER:     "Ishdan bo'shatish buyrug'i",
  TRANSFER_ORDER:      "O'tkazish buyrug'i",
  TRAINING_REQUEST:    "O'qitish so'rovi",
  TRAINING_CONTRACT:   "O'qitish shartnomasi",
  EXPENSE_CLAIM:       "Xarajatlar da'vosi",
  INVENTORY_RECEIPT:   "Inventar qabul dalolatnomasi",
  INCIDENT_REPORT:     "Hodisa dalolatnomasi",
  PIP_PLAN:            "PIP Reja",
  OTHER:               "Boshqa",
};

export const STATUS_CONFIG: Record<string, { label: string; icon: LucideIcon; className: string }> = {
  draft:     { label: "Qoralama",      icon: AlertCircle,  className: "text-gray-600 border-gray-300" },
  pending:   { label: tLabel('common.DocumentsTab.kutilmoqda', "Kutilmoqda"),    icon: Clock,        className: "text-[var(--ep-yellow)] border-amber-300" },
  approved:  { label: "Tasdiqlandi",   icon: CheckCircle2, className: "text-[var(--ep-green)] border-green-300" },
  rejected:  { label: "Rad etildi",    icon: XCircle,      className: "text-[var(--ep-red)] border-red-300" },
  cancelled: { label: tLabel('common.DocumentsTab.bekorQilindi', "Bekor qilindi"), icon: XCircle,      className: "text-gray-500 border-gray-300" },
};

export const FILE_CATEGORIES: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  personal:  { label: tLabel('common.DocumentsTab.shaxsiyHujjatlar', "Shaxsiy hujjatlar"), icon: User,          color: "text-[var(--ep-blue)]" },
  education: { label: tLabel('common.DocumentsTab.talimHujjatlari', "Ta'lim hujjatlari"), icon: BookOpen,      color: "text-[var(--ep-purple)]" },
  medical:   { label: tLabel('common.DocumentsTab.tibbiyHujjatlar', "Tibbiy hujjatlar"),  icon: HeartPulse,    color: "text-[var(--ep-red)]" },
  labor:     { label: "Mehnat hujjatlari", icon: Briefcase,     color: "text-[var(--ep-yellow)]" },
  contract:  { label: tLabel('common.DocumentsTab.shartnomalar', "Shartnomalar"),      icon: FileSignature, color: "text-[var(--ep-green)]" },
  other:     { label: "Boshqa",            icon: FolderOpen,    color: "text-gray-500" },
};

export const EMP_DOC_CATEGORIES: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  contract: { label: "Mehnat shartnomalari",       icon: ScrollText,     color: "text-[var(--ep-blue)]" },
  personal: { label: tLabel('common.DocumentsTab.shaxsiyHujjatlar', "Shaxsiy hujjatlar"),          icon: User,           color: "text-[var(--ep-blue)]" },
  order:    { label: tLabel('common.DocumentsTab.buyruqlar', "Buyruqlar"),                  icon: FileText,       color: "text-[var(--ep-yellow)]" },
  payroll:  { label: "Oylik hisob-kitob",          icon: ShoppingBag,    color: "text-[var(--ep-green)]" },
  medical:  { label: tLabel('common.DocumentsTab.tibbiyHujjatlar', "Tibbiy hujjatlar"),           icon: Stethoscope,    color: "text-[var(--ep-red)]" },
  training: { label: tLabel('common.DocumentsTab.oqitishVaSertifikatlar', "O'qitish va sertifikatlar"),  icon: GraduationCap,  color: "text-[var(--ep-purple)]" },
  other:    { label: "Boshqa",                     icon: MoreHorizontal, color: "text-gray-500" },
};

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface HrDocument {
  id: number;
  doc_number: string;
  doc_type: string;
  title: string;
  status: string;
  created_at: string;
  submitted_at?: string;
  total_steps?: number;
  approved_steps?: number;
}

export interface EmploymentContract {
  id: number;
  contractNumber: string;
  contractType: string;
  startDate: string;
  endDate?: string;
  salary?: number;
  workSchedule?: string;
  status?: string;
  createdAt?: string;
}

export interface EmployeeFile {
  id: number;
  employee_id: number;
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  category: string;
  description?: string;
  uploaded_by_name?: string;
  created_at: string;
}

export interface EmployeeDocument {
  id: number;
  employee_id: number;
  category: string;
  title: string;
  file_name?: string;
  file_url?: string;
  file_size?: number;
  mime_type?: string;
  notes?: string;
  uploaded_by?: number;
  uploaded_by_name?: string;
  created_at: string;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

export const addDocFormSchema = z.object({
  category: z.string().default("personal"),
  title:    z.string().min(1, "Sarlavha kiritilishi shart"),
  fileName: z.string().optional(),
  fileUrl:  z.string().optional(),
  notes:    z.string().optional(),
});

export type AddDocFormValues = z.infer<typeof addDocFormSchema>;

// ─── Component props ──────────────────────────────────────────────────────────

export interface DocumentsTabProps {
  employeeId: string;
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export function formatBytes(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024)            return `${bytes} B`;
  if (bytes < 1024 * 1024)    return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
