/**
 * @module SecurityExtendedTypes
 * @description TypeScript interfaces, types, Zod schemas, and constants for SecurityExtended.
 * No JSX.
 */

import { z } from "zod";
import {
  HardHat, AlertTriangle, MapPin, Users, UserCheck, Star, Siren,
  type LucideIcon
} from "lucide-react";

import { tLabel } from '@/lib/i18n/tLabel';
// ─── Domain Interfaces ─────────────────────────────────────────────────────

export interface SecurityVisitor {
  id: number | string;
  name?: string;
  company?: string;
  purpose?: string;
  host?: string;
  hostEmployee?: string;
  entryTime?: string;
  exitTime?: string;
  status?: string;
  createdAt?: string;
}

export interface AttendanceRecord {
  id: number | string;
  userId?: number | string;
  employeeName?: string;
  checkIn?: string;
  checkOut?: string;
  isLate?: boolean;
  status?: string;
}

export interface PPEStats {
  todayCount?: number;
  total?: number;
  last7Days?: number;
  topViolationType?: { type?: string };
}

export interface PPEViolationsResponse {
  violations?: Record<string, unknown>[];
}

export interface DailySummary {
  present?: number;
  totalEntries?: number;
  denied?: number;
  mainEntries?: number;
  prodEntries?: number;
  storageEntries?: number;
  serverEntries?: number;
  labEntries?: number;
  officeEntries?: number;
  late?: number;
  absent?: number;
  onLeave?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────

export const URL_TAB_MAP: Record<string, string> = {
  "/security/attendance": "attendance",
  "/security/zone-access": "zones",
  "/security/ppe": "ppe",
  "/security/hazmat": "hazmat",
  "/security/evacuation": "evacuation",
  "/security/visitors": "visitors",
  "/security/rating": "rating",
};

export const tabMeta: Record<string, { title: string; icon: LucideIcon }> = {
  zones:      { title: "Kirish Nazorati",   icon: MapPin },
  visitors:   { title: tLabel('common.SecurityExtended.mehmonlar', "Mehmonlar"),         icon: Users },
  attendance: { title: "Davomat",           icon: UserCheck },
  ppe:        { title: "PPE Nazorati",      icon: HardHat },
  hazmat:     { title: tLabel('common.SecurityExtended.xavfliModdalar', "Xavfli Moddalar"),   icon: AlertTriangle },
  evacuation: { title: "Evakuatsiya",       icon: Siren },
  rating:     { title: tLabel('common.SecurityExtended.xavfsizlikReytingi', "Xavfsizlik Reytingi"), icon: Star },
};

export const PPE_ZONES = [
  { zone: "Bosma sexi",         required: ["Kask", "Ko'zoynaklar", "Quloqchin"],       compliance: null },
  { zone: "Kimyo laboratoriya", required: ["Rezina qo'lqop", "Ko'zoynaklar", "Maska"], compliance: null },
  { zone: "Xom ashyo ombori",   required: ["Kask", "Xavfsizlik botinkalar"],           compliance: null },
  { zone: "Elektr xona",        required: ["Izolyatsion qo'lqop", "Ko'zoynaklar"],     compliance: null },
] as const;

// ─── Zod Schemas ──────────────────────────────────────────────────────────

export const VisitorSchema = z.object({
  name:    z.string().min(1),
  company: z.string().min(1),
  host:    z.string().min(1),
  purpose: z.string().min(1),
  phone:   z.string().min(1),
});

export type VisitorFormValues = z.infer<typeof VisitorSchema>;
