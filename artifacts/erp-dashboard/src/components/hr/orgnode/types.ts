/**
 * @module types
 * @description React UI component.
 */

export interface NodeEmployee {
  id: number;
  fullName: string;
  employeeId?: string;
  phone?: string;
  role?: string;
  status?: string;
  salary?: number | null;
  yearsOfService?: number | null;
}

export interface ChildNode {
  id: number;
  name: string;
  color: string;
  nodeType: string;
  employeeCount: number;
}

export interface NodeDetail {
  id: number;
  name: string;
  nameRu?: string;
  description?: string;
  descriptionRu?: string;
  color: string;
  tskp?: string;
  tskpRu?: string;
  parentId?: number | null;
  parentName?: string | null;
  hierarchyLevel: number;
  nodeType: string;
  isActive: boolean;
  headUserId?: number | null;
  headUserName?: string | null;
  headUserEmployeeId?: string | null;
  razryadLevelId?: number | null;
  // VISION node=karta — to'liq karta-maydonlari
  salaryType?: string | null;
  minSalary?: number | string | null;
  maxSalary?: number | string | null;
  rbacTier?: string | null;
  tskpTarget?: number | string | null;
  tskpMeasurementUnit?: string | null;
  // T11-02: ЦКП achievement% formula-turi (org_departments.ckp_formula_type).
  // 'quantity_pct' (fakt/norma) | 'boolean' (ha/yo'q→100/0) | null (default=quantity_pct).
  ckpFormulaType?: string | null;
  // T11-05: kunlik ЦКП-hisobot deadline soat (org_departments.ckp_report_deadline_hours).
  // NULL=deadline qoidasi yo'q. FE OVERDUE-badge shu + fakt submitted_at orqali hisoblaydi (fabrikatsiya yo'q).
  ckpReportDeadlineHours?: number | null;
  workSchedule?: string | null;
  currentState?: string | null;
  // VISION (A35 — Vysotskiy 7-otdeleniye): karta qaysi 7 bo'limdan biriga tegishli (1-7, NULL=belgilanmagan).
  otdeleniyeNo?: number | null;
  // VISION 5-holat lifecycle (A32): muzlatish meta — org_departments.freeze_*/archived_at/frozen_at
  freezeReason?: string | null;
  freezeUntil?: string | null;
  frozenAt?: string | null;
  archivedAt?: string | null;
  bonusConfig?: string | null;
  employeeCount: number;
  childCount: number;
  vacantChildCount?: number;
  employees: NodeEmployee[];
  children: ChildNode[];
}

export interface HistoryEntry {
  id: number;
  action: string;
  changedBy: string;
  changedAt: string;
  details: string;
}

export interface FolderItem {
  id: number;
  nodeId: number;
  itemType: "document" | "video" | "test";
  title: string;
  url?: string;
  description?: string;
  lmsCourseId?: number;
  createdAt: string;
}

export const NODE_TYPE_LABELS: Record<string, string> = {
  owner: "Egasi",
  top_director: "Bosh Direktor",
  director: "Direktor",
  department: "Bo'lim",
  // G3 (ORG-CARD-MANUAL-ENTRY-READINESS-2026-07-06, finding B4) — kept in sync with the sibling
  // map in components/hr/org/types.ts (see that file's comment for the full rationale).
  otdeleniye: "Otdeleniye",
  otdel: "Otdel",
  sektsiya: "Sektsiya",
  sektor: "Sektor",
  // 2026-07-11: legacy 'section' retired here too — see components/hr/org/types.ts comment.
};

// Sourced from --ep-org-l0..l6 design tokens (src/erp-modern-ui/ep-motion-helpers.css) —
// keep in sync with the sibling LEVEL_COLORS in components/hr/org/types.ts.
export const LEVEL_COLORS: Record<number, string> = {
  0: "var(--ep-org-l0)",
  1: "var(--ep-org-l1)",
  2: "var(--ep-org-l2)",
  3: "var(--ep-org-l3)",
  4: "var(--ep-org-l4)",
};

/**
 * KARTA 5-HOLAT LIFECYCLE (A32 — VISION EP-ORG-084/086).
 *   active   — kartada faol xodim, normal ish.
 *   vacant   — karta ochiq (xodim/rahbar yo'q) — ishga olish kerak.
 *   io       — i.o. (ispolnyayushchiy obyazannosti) — vaqtincha o'rinbosar.
 *   frozen   — muzlatilgan (sabab + muddat) — vaqtincha to'xtatilgan.
 *   archived — arxivlangan — endi ishlatilmaydi (yumshoq o'chirish).
 * Holat `org_departments.current_state` ustunida saqlanadi (kanonik enum).
 * `tone` — EPStatusPill rang ohangi.
 */
export type CardState = "active" | "vacant" | "io" | "frozen" | "archived";

export interface CardStateMeta {
  value: CardState;
  label: string;
  /** EPStatusPill tone. */
  tone: "success" | "warning" | "danger" | "info" | "neutral";
}

export const CARD_STATES: Record<CardState, CardStateMeta> = {
  active:   { value: "active",   label: "Faol",        tone: "success" },
  vacant:   { value: "vacant",   label: "Vakant",      tone: "warning" },
  io:       { value: "io",       label: "I.o.",        tone: "info" },
  frozen:   { value: "frozen",   label: "Muzlatilgan", tone: "info" },
  archived: { value: "archived", label: "Arxivlangan", tone: "neutral" },
};

export const CARD_STATE_ORDER: CardState[] = ["active", "vacant", "io", "frozen", "archived"];

/** Joriy holatni aniqlash: current_state bo'lsa o'sha; aks holda rahbar yo'q → vacant, bor → active. */
export function resolveCardState(node: Pick<NodeDetail, "currentState" | "headUserName" | "isActive">): CardState {
  const raw = (node.currentState ?? "").trim().toLowerCase();
  if (raw && raw in CARD_STATES) return raw as CardState;
  if (node.isActive === false) return "archived";
  return node.headUserName ? "active" : "vacant";
}
