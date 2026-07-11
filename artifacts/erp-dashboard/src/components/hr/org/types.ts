/**
 * @module types
 * @description React UI component.
 */

export interface OrgNode {
  id: number;
  name: string;
  nameRu?: string;
  description?: string;
  color: string;
  tskp?: string;
  tskpRu?: string;
  headUserId?: number | null;
  headUserName?: string | null;
  headUserPhoto?: string | null;
  headUserEmployeeId?: string | null;
  headUserQYM?: string | null;
  employeeCount?: number;
  hierarchyLevel: number;
  nodeType: string;
  razryadLevelId?: number | null;
  children: OrgNode[];
  hrcLatest?: Record<string, number> | null;
  iqLevel?: string | null;
  leadershipScore?: number | null;
  syndrome?: string | null;
  portretFilled?: boolean;
  isMachineOperator?: boolean;
}

export interface OrgStats {
  totalNodes: number;
  totalDepartments: number;
  totalEmployees: number;
  vacantCount: number;
  vacantPercent: number;
  recentChanges: number;
}

export interface LayoutNode {
  node: OrgNode;
  x: number;
  y: number;
  children: LayoutNode[];
}

export const HRC_INDICATORS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"] as const;

export const HRC_COLORS: Record<string, string> = {
  A: "#6366f1",
  B: "#22c55e",
  C: "#f59e0b",
  D: "#ef4444",
  E: "#8b5cf6",
  F: "#06b6d4",
  G: "#f97316",
  H: "#14b8a6",
  I: "#84cc16",
  J: "#ec4899",
};

// Org hierarchy level accents — sourced from --ep-org-l0..l6 design tokens
// (src/erp-modern-ui/ep-motion-helpers.css) so the Org-sxema karta ramp stays
// centrally themeable instead of hardcoded per-component hex.
export const LEVEL_COLORS: Record<number, string> = {
  0: "var(--ep-org-l0)", // Egasi
  1: "var(--ep-org-l1)", // Boshqarma
  2: "var(--ep-org-l2)", // Bo'lim
  3: "var(--ep-org-l3)", // Sektor
  4: "var(--ep-org-l4)", // Lavozim
  5: "var(--ep-org-l5)", // 5-daraja
  6: "var(--ep-org-l6)", // 6-daraja
};

export const LEVEL_LABELS: Record<number, string> = {
  0: "Egasi",
  1: "Boshqarma",
  2: "Bo'lim",
  3: "Sektor",
  4: "Lavozim",
};

export const NODE_TYPE_LABELS: Record<string, string> = {
  owner: "Egasi",
  top_director: "Bosh Direktor",
  director: "Direktor",
  department: "Bo'lim",
  // G3 (ORG-CARD-MANUAL-ENTRY-READINESS-2026-07-06, finding B4): the Vysotskiy-7 wall chart's
  // Otdeleniye/Otdel/Sektsiya/Sektor tiers had no create-dropdown entries — HR could nest 4
  // levels (depth is uncapped) but couldn't label them with the owner's tier names.
  // node_type='otdeleniye' already has 14 live rows and no DB/Zod restriction; otdel/sektsiya/
  // sektor are net-new string values (docs/migration/02-vysotskiy-7-tree.md L2-L5).
  otdeleniye: "Otdeleniye",
  otdel: "Otdel",
  sektsiya: "Sektsiya",
  sektor: "Sektor",
  // 2026-07-11: legacy 'section' (also "Sektor") retired from this create-dropdown map — it
  // duplicated 'sektor' with an identical label, making the two indistinguishable when adding a
  // karta. 'sektor' (Vysotskiy-7 canonical) is now the only creatable "Sektor" tier. 'section'
  // stays valid elsewhere (org-export.service.ts display map, HEAD_BEARING_TYPES) for any
  // pre-existing rows, it's just no longer offered for new cards.
};

export const CARD_W = 256;
export const CARD_H = 142;
export const H_GAP = 32;
export const V_GAP = 64;
