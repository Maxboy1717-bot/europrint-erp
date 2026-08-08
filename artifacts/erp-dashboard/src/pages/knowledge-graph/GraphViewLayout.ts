/**
 * @module GraphViewLayout
 * @description Pure, dependency-free node-position algorithms. Two real,
 * simple layouts (grid-by-entity-type, circular) — NOT a force-directed
 * physics simulation (that needs d3-force, a real added dependency+
 * complexity this Faza B deliberately defers rather than fake with a
 * relabeled grid). Honest scope limit, not a hidden gap.
 */

import type { KgNode } from './GraphViewTypes';

export interface XY { x: number; y: number }

const COL_WIDTH = 240;
const ROW_HEIGHT = 110;
const RADIUS_STEP = 160;

/** Groups nodes into columns by entity_type, rows within each column. */
export function gridLayout(nodes: KgNode[]): Record<string, XY> {
  const byType = new Map<string, KgNode[]>();
  for (const n of nodes) {
    const list = byType.get(n.entityType) ?? [];
    list.push(n);
    byType.set(n.entityType, list);
  }
  const positions: Record<string, XY> = {};
  let col = 0;
  for (const [, list] of Array.from(byType.entries()).sort(([a], [b]) => a.localeCompare(b))) {
    list.forEach((n, row) => {
      positions[`${n.entityType}:${n.entityId}`] = { x: col * COL_WIDTH, y: row * ROW_HEIGHT };
    });
    col += 1;
  }
  return positions;
}

/** Places nodes on concentric rings — one ring per entity_type. */
export function circularLayout(nodes: KgNode[]): Record<string, XY> {
  const byType = new Map<string, KgNode[]>();
  for (const n of nodes) {
    const list = byType.get(n.entityType) ?? [];
    list.push(n);
    byType.set(n.entityType, list);
  }
  const positions: Record<string, XY> = {};
  const types = Array.from(byType.keys()).sort();
  types.forEach((type, ringIdx) => {
    const list = byType.get(type) ?? [];
    const radius = (ringIdx + 1) * RADIUS_STEP;
    list.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / Math.max(1, list.length);
      positions[`${n.entityType}:${n.entityId}`] = {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      };
    });
  });
  return positions;
}

/** BFS depth from a focus node key over the loaded edge set. Returns node-key -> hop distance. */
export function bfsDepth(focusKey: string, edges: Array<{ sourceType: string; sourceId: string; targetType: string; targetId: string }>, maxDepth: number): Map<string, number> {
  const adjacency = new Map<string, string[]>();
  for (const e of edges) {
    const s = `${e.sourceType}:${e.sourceId}`;
    const t = `${e.targetType}:${e.targetId}`;
    adjacency.set(s, [...(adjacency.get(s) ?? []), t]);
    adjacency.set(t, [...(adjacency.get(t) ?? []), s]);
  }
  const dist = new Map<string, number>([[focusKey, 0]]);
  let frontier = [focusKey];
  for (let d = 1; d <= maxDepth && frontier.length > 0; d += 1) {
    const next: string[] = [];
    for (const key of frontier) {
      for (const neighbor of adjacency.get(key) ?? []) {
        if (!dist.has(neighbor)) {
          dist.set(neighbor, d);
          next.push(neighbor);
        }
      }
    }
    frontier = next;
  }
  return dist;
}
