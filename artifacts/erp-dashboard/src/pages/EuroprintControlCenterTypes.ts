/**
 * @module EuroprintControlCenterTypes
 * @description Shared interfaces, type aliases, constants, and utility functions
 * used across all EuroprintControlCenter sub-modules. No JSX.
 */

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface CompanyStateCurrent {
  state: "osish" | "normal" | "ehtiyot" | "xavf" | "inqiroz";
  label: { uz: string; ru: string; emoji: string };
  kpis: {
    profit: number;
    revenue: number;
    expenses: number;
    retentionPct: number;
  };
  generatedAt: string;
}

export interface BusinessRule {
  id: string;
  ruleCode: string;
  ruleName: string;
  ruleType: string;
  category: string;
  isActive: boolean;
  errorMessageUz: string;
}

export interface UnitOfMeasure {
  id: string;
  code: string;
  name: string;
  category: string;
}

export interface ValidationRule {
  id: string;
  ruleCode: string;
  ruleName: string;
  severity: string;
  category: string;
}

export interface KpiDefinition {
  id: string;
  kpiCode: string;
  kpiName: string;
  category: string;
  targetValue: number;
  unit: string;
  blockOnViolation: boolean;
}

export interface SapPatternSummary {
  documentLifecycle: { count: number; name: string; nameRu: string };
  changeRequests: { count: number; name: string; nameRu: string };
  separationOfDuties: { count: number; name: string; nameRu: string };
  exceptionInbox: { count: number; name: string; nameRu: string };
  postingEngine: { count: number; name: string; nameRu: string };
  costObjects: { count: number; name: string; nameRu: string };
  sops: { count: number; name: string; nameRu: string };
  roleUiConfigs: { count: number; name: string; nameRu: string };
}

export interface AllRulesSummary {
  sapPatterns: SapPatternSummary;
  nonBypassableRules: {
    processChains: { count: number; name: string; nameRu: string };
    auditTrail: { count: number; name: string; nameRu: string };
    fiscalPeriods: { count: number; name: string; nameRu: string };
    masterData: { count: number; name: string; nameRu: string };
    batchLots: { count: number; name: string; nameRu: string };
    multiCurrency: { count: number; name: string; nameRu: string };
  };
}

export interface ModuleCard {
  id: string;
  title: string;
  titleRu?: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  count: number;
  label: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const STATE_COLORS: Record<string, { bg: string; badge: string; border: string }> = {
  osish:   { bg: "bg-emerald-500/10", badge: "bg-[var(--ep-green)] text-white", border: "border-emerald-200" },
  normal:  { bg: "bg-blue-500/10",    badge: "bg-[var(--ep-blue)] text-white",    border: "border-blue-200"    },
  ehtiyot: { bg: "bg-yellow-500/10",  badge: "bg-[var(--ep-yellow)] text-white",  border: "border-yellow-200"  },
  xavf:    { bg: "bg-amber-500/10",   badge: "bg-[var(--ep-yellow)] text-white",   border: "border-amber-200"   },
  inqiroz: { bg: "bg-red-500/10",     badge: "bg-[var(--ep-red)] text-white",     border: "border-red-200"     },
  GROWTH:  { bg: "bg-emerald-500/10", badge: "bg-[var(--ep-green)] text-white", border: "border-emerald-200" },
  NORMAL:  { bg: "bg-blue-500/10",    badge: "bg-[var(--ep-blue)] text-white",    border: "border-blue-200"    },
  RISK:    { bg: "bg-amber-500/10",   badge: "bg-[var(--ep-yellow)] text-white",   border: "border-amber-200"   },
  CRITICAL:{ bg: "bg-red-500/10",     badge: "bg-[var(--ep-red)] text-white",     border: "border-red-200"     },
};

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/** Format a number into a human-readable Uzbek string (mlrd / mln / plain). */
export function fmt(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} mlrd`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} mln`;
  return n.toLocaleString("uz-UZ");
}
