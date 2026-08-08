/**
 * @module GraphViewTypes
 * @description Shared types + constants for the Knowledge Graph Faza B
 * canvas UI. Entity-type colors reuse the EXISTING `--ep-*` status palette
 * (europrint-mockup-theme.css) rather than inventing new tokens — Qoida 21
 * compliant (`var(--ep-*)`), no new CSS variables needed for a narrow
 * per-entity-type accent.
 */

export interface KgNode {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  summary: string | null;
  updatedAt: string;
}

export interface KgEdge {
  id: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  relationType: string;
  isBroken: boolean;
  brokenReason: string | null;
}

export type GraphView = 'canvas' | 'table';
export type LayoutMode = 'grid' | 'circular';

/** entity_type -> existing --ep-* CSS var (reused, not new tokens). */
export const ENTITY_COLOR_MAP: Record<string, string> = {
  customer: 'var(--ep-blue)',
  sales_order: 'var(--ep-cyan)',
  production_order: 'var(--ep-purple)',
  production_session: 'var(--ep-yellow)',
  qc_inspection: 'var(--ep-green)',
  material: 'var(--ep-pink)',
  document: 'var(--ep-muted)',
  sop: 'var(--ep-muted)',
};

export function colorForType(entityType: string): string {
  return ENTITY_COLOR_MAP[entityType] ?? 'var(--ep-subtle)';
}

export function nodeKey(entityType: string, entityId: string): string {
  return `${entityType}:${entityId}`;
}
