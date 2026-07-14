/**
 * @module TreeCanvas
 * @description React UI component.
 */

import React from "react";
import { OrgNode, LayoutNode, CARD_W, CARD_H, H_GAP, V_GAP } from "./types";
import { computeSubtreeWidth, layoutTree, flattenLayout } from "./helpers";
import { TreeNodeCard } from "./TreeNodeCard";

/** G4 (ORG-CARD-MANUAL-ENTRY-READINESS-2026-07-06, finding B5): OrgNode/LayoutNode don't carry
 * their own parentId (only the nested `children` direction) — walk the tree once to build a
 * child->parent lookup so "duplicate as sibling" (same parent as the source card) knows the
 * right parentId, without changing the tree data shape everywhere else. */
function buildParentMap(roots: LayoutNode[]): Map<number, number | null> {
  const map = new Map<number, number | null>();
  const walk = (node: LayoutNode, parentId: number | null) => {
    map.set(node.node.id, parentId);
    (node.children ?? []).forEach((child) => walk(child, node.node.id));
  };
  (Array.isArray(roots) ? roots : []).forEach((r) => walk(r, null));
  return map;
}

function buildConnectors(nodes: LayoutNode[]): React.ReactNode[] {
  const lines: React.ReactNode[] = [];
  (Array.isArray(nodes) ? nodes : []).forEach((parent) => {
    const px = parent.x + CARD_W / 2;
    const py = parent.y + CARD_H;
    parent.children?.forEach((child, idx) => {
      const cx = child.x + CARD_W / 2;
      const cy = child.y;
      // Jog right after the parent (not the true midpoint of the whole gap) — for an adjacent
      // row this is the same point either way, but for a level-skipping child (owner spec: a
      // card can be parented several tiers up) the true-midpoint jog used to land its horizontal
      // segment in the middle of the intervening rows, visually cutting across unrelated cards
      // and their own connectors ("chiziqlar tushunarsiz bo'lib qolgan"). Jogging right below the
      // parent keeps the horizontal segment short and out of the busy rows; the rest of the drop
      // is a single vertical run down the side to the child, same as any org-chart's direct line.
      const midY = Math.min(py + V_GAP / 2, py + (cy - py) / 2);
      const key = `conn-${parent.node.id}-${child.node.id}-${idx}`;
      lines.push(
        <path
          key={key}
          d={`M ${px} ${py} L ${px} ${midY} L ${cx} ${midY} L ${cx} ${cy}`}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.7}
        />
      );
    });
  });
  return lines;
}

export function TreeCanvas({
  roots,
  onNodeClick,
  onAddChild,
  onDuplicate,
  tierSeqMap,
}: {
  roots: OrgNode[];
  onNodeClick: (id: number) => void;
  onAddChild: (parentId: string) => void;
  /** G4: duplicate-card action — receives the source node plus its resolved parentId (null = root). */
  onDuplicate?: (node: OrgNode, parentId: number | null) => void;
  /** Per-tier "#N" sequence (helpers.ts computeTierSequences), keyed by node.id — computed over
   *  the FULL node set so numbers stay stable across search/level filtering. */
  tierSeqMap?: Map<number, number>;
}) {
  if (!roots || roots.length === 0) return null;

  const layouts: LayoutNode[] = [];
  let xOffset = 0;
  (Array.isArray(roots) ? roots : []).forEach((r) => {
    const w = computeSubtreeWidth(r);
    layouts.push(layoutTree(r, xOffset));
    xOffset += w + H_GAP * 4;
  });

  const allNodes = (Array.isArray(layouts) ? layouts : []).flatMap(flattenLayout);
  const connectors = buildConnectors(allNodes);
  const parentMap = onDuplicate ? buildParentMap(layouts) : null;

  const maxX = (Array.isArray(allNodes) ? allNodes : []).reduce((m, n) => Math.max(m, n.x + CARD_W), 0);
  const maxY = (Array.isArray(allNodes) ? allNodes : []).reduce((m, n) => Math.max(m, n.y + CARD_H), 0);
  const svgW = maxX + 32;
  const svgH = maxY + 32;

  return (
    <div style={{ position: "relative", width: svgW, height: svgH }}>
      <svg
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
        width={svgW}
        height={svgH}
      >
        {connectors}
      </svg>
      {(Array.isArray(allNodes) ? allNodes : []).map(({ node, x, y }) => (
        <div
          key={node.id}
          style={{ position: "absolute", left: x, top: y }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <TreeNodeCard
            node={node}
            onClick={onNodeClick}
            onAdd={onAddChild}
            onDuplicate={onDuplicate ? () => onDuplicate(node, parentMap?.get(node.id) ?? null) : undefined}
            tierSeq={tierSeqMap?.get(node.id)}
          />
        </div>
      ))}
    </div>
  );
}
