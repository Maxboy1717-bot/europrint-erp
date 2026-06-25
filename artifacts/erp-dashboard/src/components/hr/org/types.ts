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

export const LEVEL_COLORS: Record<number, string> = {
  0: "#7c3aed", // Binafsha — Egasi
  1: "#1d4ed8", // Ko'k     — Boshqarma
  2: "#16a34a", // Yashil   — Bo'lim
  3: "#b45309", // Sariq    — Sektor
  4: "#dc2626", // Qizil    — Lavozim
  5: "#0d9488", // Teal     — 5-daraja
  6: "#be185d", // Pushti   — 6-daraja
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
  section: "Sektor",
};

export const CARD_W = 256;
export const CARD_H = 142;
export const H_GAP = 32;
export const V_GAP = 64;
