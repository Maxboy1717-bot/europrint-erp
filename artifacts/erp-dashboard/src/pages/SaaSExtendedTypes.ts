/**
 * @module SaaSExtendedTypes
 * @description TypeScript interfaces, types, and constants for SaaSExtended page.
 */

import { z } from "zod";
import { Building2, Users, Shield, Layers, Activity, AlertTriangle, type LucideIcon } from "lucide-react";

import { tLabel } from '@/lib/i18n/tLabel';
export interface SaaSTenant {
  id: number | string;
  name?: string;
  companyName?: string;
  plan?: string;
  status?: string;
  domain?: string;
  contactEmail?: string;
  city?: string;
  country?: string;
  usersCount?: number;
  usersLimit?: number;
  monthlyFee?: number | string;
  modulesEnabled?: string[];
  expiresAt?: string;
  createdAt?: string;
}

export interface ErrorLog {
  id?: number | string;
  tenantId?: number | string;
  level?: string;
  message?: string;
  module?: string;
  service?: string;
  requestPath?: string;
  createdAt?: string;
}

export interface PlatformStats {
  uptimeHours?: number;
  uptime?: number;
  version?: string;
  environment?: string;
  database?: { sizeMB?: number };
  memory?: { heapUsed?: number; rss?: number };
  errors?: { last24h?: number };
  tenants?: { total?: number; active?: number; trial?: number; suspended?: number; cancelled?: number };
  users?: { total?: number };
}

export const URL_TAB_MAP: Record<string, string> = {
  "/saas/tenant-management": "tenants",
  "/saas/onboarding": "onboarding",
  "/saas/licensing": "licensing",
  "/saas/module-control": "modules",
  "/saas/monitoring": "monitoring",
  "/saas/error-log": "errors",
};

export const PLAN_LABELS: Record<string, string> = {
  basic: "Basic",
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
};

export const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  trial: "secondary",
  suspended: "destructive",
  cancelled: "outline",
};

export const ALL_MODULES = [
  { name: tLabel('common.SaaSExtended.crmSavdo', "CRM + Savdo"), key: "crm", tiers: ["basic", "starter", "professional", "enterprise"] },
  { name: "Marketing", key: "marketing", tiers: ["starter", "professional", "enterprise"] },
  { name: "Dizayn + Texnolog", key: "design", tiers: ["starter", "professional", "enterprise"] },
  { name: "Sifat Nazorati (QC)", key: "qc", tiers: ["basic", "starter", "professional", "enterprise"] },
  { name: "AI PP", key: "pp", tiers: ["professional", "enterprise"] },
  { name: "MES", key: "mes", tiers: ["starter", "professional", "enterprise"] },
  { name: "Ombor (WMS)", key: "wms", tiers: ["basic", "starter", "professional", "enterprise"] },
  { name: tLabel('common.SaaSExtended.taminotMm', "Ta'minot (MM)"), key: "mm", tiers: ["starter", "professional", "enterprise"] },
  { name: "Moliya (FI)", key: "fi", tiers: ["starter", "professional", "enterprise"] },
  { name: "HR", key: "hr", tiers: ["basic", "starter", "professional", "enterprise"] },
  { name: tLabel('common.SaaSExtended.lmsTalim', "LMS Ta'lim"), key: "lms", tiers: ["starter", "professional", "enterprise"] },
  { name: tLabel('common.SaaSExtended.xavfsizlik', "Xavfsizlik"), key: "security", tiers: ["professional", "enterprise"] },
  { name: tLabel('common.SaaSExtended.mroXojalik', "MRO Xo'jalik"), key: "mro", tiers: ["professional", "enterprise"] },
  { name: "IoT + Kamera", key: "iot", tiers: ["enterprise"] },
  { name: "Direktor Panel", key: "director", tiers: ["professional", "enterprise"] },
  { name: "SaaS Admin", key: "saas", tiers: ["enterprise"] },
];

export const tabMeta: Record<string, { title: string; icon: LucideIcon }> = {
  "tenants":    { title: "Tenant Boshqaruvi",  icon: Building2 },
  "onboarding": { title: "Tenant Onboarding",  icon: Users },
  "licensing":  { title: "Litsenziya",          icon: Shield },
  "modules":    { title: "Modul Nazorati",      icon: Layers },
  "monitoring": { title: "Monitoring",          icon: Activity },
  "errors":     { title: tLabel('common.SaaSExtended.xatolarJurnali', "Xatolar Jurnali"),    icon: AlertTriangle },
};

export const AddTenantSchema = z.object({
  name: z.string().min(1),
  domain: z.string().min(1),
  plan: z.string().min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(1),
  usersLimit: z.number().positive(),
});
