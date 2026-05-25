
import { tLabel } from '@/lib/i18n/tLabel';
/** @module AIProductionPlanningTypes @description TypeScript interfaces, types, constants, and pure utility functions for the AI Production Planning feature. No JSX. */

// ─── Data Interfaces ──────────────────────────────────────────────────────────

export interface PlanDataItem {
  sequence: number;
  papkaNo: string;
  machineName: string;
  startTime: string;
  endTime: string;
  duration: number;
  shift?: string;
  orderId?: string;
}

export interface AiRecommendation {
  type: string;
  message: string;
}

export interface AiDecision {
  id: string;
  planId: string;
  decisionType: string;
  description: string;
  confidenceScore: number | null;
  impact: string;
  status: string;
  createdAt: string;
}

export interface AiPlan {
  id: string;
  planNumber: string;
  planDate: string;
  planType: string;
  status: string;
  confidenceScore: number;
  autoApproved: boolean;
  autoApprovalThreshold: number | null;
  totalOrders: number | null;
  totalMachineHours: number | null;
  estimatedCompletion: string | null;
  planData: PlanDataItem[];
  optimizationMetrics: Record<string, number>;
  aiRecommendations: AiRecommendation[];
  createdAt: string;
  approvedAt?: string;
  decisions?: AiDecision[];
}

export interface DashboardData {
  activePlans: number;
  totalPlans: number;
  avgConfidence: number;
  autoApprovedPct: number;
  totalOrdersScheduled: number;
  avgMachineUtilization: number;
  recentPlans: AiPlan[];
}

export interface BatchGroup {
  machine: string;
  count: number;
  totalDuration: number;
  orders: string[];
  changeoverReduction: string;
  estimatedEnergySaving: string;
}

export type DetailTab = "schedule" | "gantt" | "batch" | "decisions";
export type RescheduleType = "machine_stop" | "material_shortage" | "priority_change" | "manual";

// ─── Gantt Chart Constants ────────────────────────────────────────────────────

export const GANTT_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981",
  "#06b6d4", "#f97316", "#84cc16", "#6366f1", "#14b8a6",
];

export const GANTT_TOTAL_WIDTH = 24 * 60; // 1440 minutes
export const GANTT_ROW_H = 48;
export const GANTT_LABEL_W = 140;
export const GANTT_CHART_W = 900;

// ─── Pure Utility Functions ───────────────────────────────────────────────────

/** XSS-safe HTML escaping for print output */
export const escHtml = (v: unknown): string =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Returns a Tailwind colour class based on confidence score */
export const getConfidenceColor = (score: number): string =>
  score >= 85
    ? "text-[var(--ep-green)] dark:text-green-400"
    : score >= 60
    ? "text-[var(--ep-yellow)] dark:text-yellow-400"
    : "text-[var(--ep-red)] dark:text-red-400";

/** Status badge label + class map */
export const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  draft:             { label: "Qoralama",          cls: "bg-muted/60 text-foreground" },
  pending_review:    { label: "Tekshiruvda",        cls: "bg-amber-100 text-amber-800" },
  auto_approved:     { label: tLabel('production.AIProductionPlanning.avtoTasdiqlangan', "Avto-tasdiqlangan"),  cls: "bg-green-100 text-green-800" },
  manually_approved: { label: tLabel('production.AIProductionPlanning.tasdiqlangan', "Tasdiqlangan"),       cls: "bg-green-100 text-green-800" },
  rejected:          { label: "Rad etilgan",        cls: "bg-red-100 text-red-800" },
  executing:         { label: tLabel('production.AIProductionPlanning.bajarilmoqda', "Bajarilmoqda"),       cls: "bg-blue-100 text-blue-800" },
  executed:          { label: "Bajarilgan",         cls: "bg-green-100 text-green-800" },
};

/** Opens a browser print window with a formatted HTML representation of an AiPlan */
export function printPlan(plan: AiPlan): void {
  const rows = (Array.isArray(plan.planData) ? plan.planData : [])
    .map(
      (item, i) => `
    <tr>
      <td>${escHtml(item.sequence || i + 1)}</td>
      <td><strong>${escHtml(item.papkaNo)}</strong></td>
      <td>${escHtml(item.machineName)}</td>
      <td>${escHtml(item.shift || "1-smena")}</td>
      <td>${escHtml(item.startTime)} – ${escHtml(item.endTime)}</td>
      <td>${escHtml(item.duration || 0)} min</td>
    </tr>`
    )
    .join("");

  const metrics = Object.entries(plan.optimizationMetrics || {})
    .map(([k, v]) => `<li>${escHtml(k.replace(/([A-Z])/g, " $1"))}: <strong>${escHtml(v)}%</strong></li>`)
    .join("");

  const html = `<!DOCTYPE html><html lang="uz"><head><meta charset="UTF-8">
  <title>PP Reja — ${escHtml(plan.planNumber)}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #111; }
    h1 { font-size: 18px; margin: 0; } h2 { font-size: 13px; margin: 12px 0 4px; color: #444; border-bottom: 1px solid #ddd; }
    .header { border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
    .logo { font-weight: bold; font-size: 20px; } .meta { display: flex; gap: 30px; flex-wrap: wrap; font-size: 11px; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    th { background: #f0f0f0; padding: 5px 8px; text-align: left; border: 1px solid #ccc; font-size: 10px; text-transform: uppercase; }
    td { padding: 4px 8px; border: 1px solid #ddd; }
    tr:nth-child(even) { background: #fafafa; }
    .footer { margin-top: 16px; border-top: 1px solid #ccc; padding-top: 6px; color: #888; font-size: 10px; display: flex; justify-content: space-between; }
    ul { margin: 0; padding-left: 18px; }
    @media print { body { margin: 8px; } }
  </style></head><body>
  <div class="header">
    <div class="logo">EUROPRINT ERP</div>
    <h1>PP Ishlab chiqarish rejasi — ${escHtml(plan.planNumber)}</h1>
    <div class="meta">
      <span>Sana: <strong>${escHtml(plan.planDate)}</strong></span>
      <span>Turi: <strong>${plan.planType === "daily" ? "Kunlik" : "Haftalik"}</strong></span>
      <span>Holat: <strong>${escHtml(plan.status)}</strong></span>
      <span>Ishonch: <strong>${escHtml(plan.confidenceScore)}%</strong></span>
      <span>Buyurtmalar: <strong>${escHtml(plan.totalOrders)}</strong></span>
      <span>Mashina soat: <strong>${escHtml(plan.totalMachineHours)}</strong></span>
    </div>
  </div>
  <h2>{tLabel('common.AIProductionPlanningTypes.ishlabChiqarishJadvali', "Ishlab chiqarish jadvali")}</h2>
  <table>
    <thead><tr><th>#</th><th>Papka raqami</th><th>Mashina</th><th>{tLabel('common.AIProductionPlanningTypes.smena', "Smena")}</th><th>Vaqt</th><th>Davomiylik</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <h2>{tLabel('common.AIProductionPlanningTypes.optimallashtirishKorsatkichlari', "Optimallashtirish ko'rsatkichlari")}</h2>
  <ul>${metrics}</ul>
  <div class="footer">
    <span>Europrint ERP — PP Reja eksporti</span>
    <span>Sana: ${escHtml(new Date().toLocaleDateString("uz-UZ"))} ${escHtml(new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }))}</span>
  </div>
  <script>window.onload = () => window.print();</script>
  </body></html>`;

  const w = window.open("", "_blank", "width=900,height=700");
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}
