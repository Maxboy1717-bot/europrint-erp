/**
 * @module SDDashboardTypes
 * @description TypeScript interfaces, types, and constants for SDDashboard.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const LEAD_STATUS_LABELS: Record<string, string> = {
  "1": "Yangi",
  "2": "Aloqa o'rnatildi",
  "3": "Taklif yuborildi",
  "4": "Muzokara",
  "5": "Yutildi",
  "6": "Yutqazildi",
  yangi: "Yangi",
  aloqa: "Aloqa o'rnatildi",
  taklif: "Taklif yuborildi",
  muzokara: "Muzokara",
  yutildi: "Yutildi",
  yutqazildi: "Yutqazildi",
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CrmDashboardAnalysis {
  stats: { leads: number; deals: number; contacts: number; companies: number };
  analysis: {
    overallHealth: string;
    keyInsights: string[];
    recommendations: string[];
    priorityActions: string[];
    summary: string;
  };
}

export interface Lead {
  id: number;
  title: string;
  statusId?: number;
  opportunity?: number;
}

export interface Deal {
  id: number;
  title: string;
  opportunity?: number;
  currencyId?: string;
}

export interface Invoice {
  id: number;
  title?: string;
  opportunity?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function fmtMoney(v: number): string {
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + " mlrd";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + " mln";
  if (v >= 1_000) return (v / 1_000).toFixed(0) + " ming";
  return String(v);
}
