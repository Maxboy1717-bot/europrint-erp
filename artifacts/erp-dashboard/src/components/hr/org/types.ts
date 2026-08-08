/**
 * @module types
 * @description React UI component.
 */

export interface OrgNode {
  id: number;
  name: string;
  nameRu?: string;
  description?: string;
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

// ─── 6-tier canonical taxonomy (owner spec, 2026-07-14) ───────────────────────
// Depth (hierarchyLevel — the parent-chain distance) and TIER (nodeType) are
// deliberately independent axes: a card's parent can be ANY other card
// regardless of tier (egasi: "egasi sektorga ham qarashi mumkin" — the Owner
// may directly parent a Sektor, skipping L1-L4) so HR can model the real wall
// chart's shortcut reporting lines. But every card's own TIER is always one
// of these 6 fixed levels, each with a bilingual (UZ/RU) name and a dedicated
// color — independent of how deep the card sits in the tree. Card color/badge
// must therefore be resolved from nodeType (resolveTierColor/resolveNodeTypeLabel
// below), not from raw hierarchyLevel — see TreeNodeCard.tsx.
export interface OrgTier {
  level: number;
  /** node_type values belonging to this tier — multiple entries are distinct
   *  sub-roles or retired legacy aliases that still share the tier's color/fallback
   *  label (e.g. L2 covers every "Yo'nalish direktori" title; L5 covers the retired
   *  legacy 'section' alongside 'sektsiya'/'sektor'). */
  types: string[];
  uz: string;
  ru: string;
  color: string;
}

export const ORG_TIERS: OrgTier[] = [
  { level: 0, types: ["owner"], uz: "Egasi", ru: "Владелец", color: "var(--ep-org-l0)" },
  { level: 1, types: ["top_director", "ceo"], uz: "Bosh Direktor", ru: "Генеральный директор", color: "var(--ep-org-l1)" },
  { level: 2, types: ["director"], uz: "Yo'nalish direktorlari", ru: "Директора направлений", color: "var(--ep-org-l2)" },
  { level: 3, types: ["otdeleniye"], uz: "Departament", ru: "Департамент", color: "var(--ep-org-l3)" },
  { level: 4, types: ["otdel", "department"], uz: "Bo'lim/Otdel", ru: "Отдел", color: "var(--ep-org-l4)" },
  { level: 5, types: ["sektsiya", "sektor", "section"], uz: "Sektsiya/Sektor", ru: "Секция/Сектор", color: "var(--ep-org-l5)" },
];

// Per-value labels — a finer flavor within each tier (e.g. "Otdel" vs "Bo'lim" both sit in
// tier L4 but read differently in the create-dropdown/badge). G3 (ORG-CARD-MANUAL-ENTRY-
// READINESS-2026-07-06, finding B4) history preserved: node_type='otdeleniye' has 14 live
// rows and no DB/Zod restriction; otdel/sektsiya/sektor are the Vysotskiy-7 values
// (docs/migration/02-vysotskiy-7-tree.md L2-L5). 'section'/'ceo' stay valid on legacy rows
// (org-export.service.ts, HEAD_BEARING_TYPES) but are intentionally NOT offered here — same
// 2026-07-11 reasoning that retired 'section' from the create-dropdown (duplicated 'sektor').
export const NODE_TYPE_LABELS: Record<string, { uz: string; ru: string }> = {
  owner: { uz: "Egasi", ru: "Владелец" },
  top_director: { uz: "Bosh Direktor", ru: "Генеральный директор" },
  director: { uz: "Yo'nalish direktori", ru: "Директор направления" },
  otdeleniye: { uz: "Departament", ru: "Департамент" },
  department: { uz: "Bo'lim", ru: "Подразделение" },
  otdel: { uz: "Otdel", ru: "Отдел" },
  sektsiya: { uz: "Sektsiya", ru: "Секция" },
  sektor: { uz: "Sektor", ru: "Сектор" },
};

const TIER_BY_NODE_TYPE: Record<string, OrgTier> = ORG_TIERS.reduce((acc, tier) => {
  for (const type of tier.types) acc[type] = tier;
  return acc;
}, {} as Record<string, OrgTier>);

function pick(lang: string, uz: string, ru: string): string {
  return lang === "ru" ? ru : uz;
}

/** Badge/dropdown text for a specific node_type value — falls back to its tier's combined
 *  name for any node_type not in the per-value map (e.g. legacy 'ceo'/'section' rows). */
export function resolveNodeTypeLabel(nodeType: string | undefined | null, lang: string): string | undefined {
  if (!nodeType) return undefined;
  const own = NODE_TYPE_LABELS[nodeType];
  if (own) return pick(lang, own.uz, own.ru);
  const tier = TIER_BY_NODE_TYPE[nodeType];
  return tier ? pick(lang, tier.uz, tier.ru) : undefined;
}

/** Legend / depth-fallback text for a raw hierarchyLevel (0-5). */
export function resolveLevelLabel(level: number, lang: string): string {
  const tier = ORG_TIERS[level];
  return tier ? pick(lang, tier.uz, tier.ru) : `D${level}`;
}

/** Card color — TIER-driven (nodeType), NOT raw tree depth, so e.g. a Sektor card reporting
 *  directly to Egasi still renders as a Sektor color (owner 2026-07-14: hierarchy depth is
 *  flexible/parent-skipping, but a card's own tier/color always reflects its chosen type).
 *  Falls back to the depth-indexed color only for node_types outside the 6-tier map. */
export function resolveTierColor(nodeType: string | undefined | null, hierarchyLevel: number): string {
  const tier = nodeType ? TIER_BY_NODE_TYPE[nodeType] : undefined;
  if (tier) return tier.color;
  return ORG_TIERS[hierarchyLevel]?.color ?? "hsl(var(--muted-foreground))";
}

/** Tree-layout ROW (0-5) for a card — TIER-driven (nodeType), same reasoning as
 *  resolveTierColor: a card's vertical row on the org-sxema canvas must reflect its own
 *  tier, not how many parent-hops separate it from the root (owner 2026-07-14: "hammasi
 *  o'zini qatorida bo'lsin" — every card sits in its tier's row, even when its actual
 *  parent lives several tiers up, e.g. Departament parented directly under Egasi). */
export function resolveTierIndex(nodeType: string | undefined | null, hierarchyLevel: number): number {
  const tier = nodeType ? TIER_BY_NODE_TYPE[nodeType] : undefined;
  if (tier) return tier.level;
  return Math.max(0, Math.min(hierarchyLevel, ORG_TIERS.length - 1));
}

export const CARD_W = 256;
export const CARD_H = 142;
export const H_GAP = 32;
export const V_GAP = 64;
