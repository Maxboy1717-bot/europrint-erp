/**
 * @module TreeCanvas
 * @description React UI component.
 */

import React, { useState } from "react";
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
      // Midpoint between parent-bottom and child-top — not a fixed V_GAP/2, because a child's
      // tier row can now sit several rows below its parent (skipped levels render in their own
      // row per owner spec; see helpers.ts layoutTree), making the gap bigger than one V_GAP.
      const midY = py + (cy - py) / 2;
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
  onMoveNode,
  onDuplicate,
}: {
  roots: OrgNode[];
  onNodeClick: (id: number) => void;
  onAddChild: (parentId: string) => void;
  onMoveNode?: (args: { nodeId: number; newParentId: number }) => void;
  /** G4: duplicate-card action — receives the source node plus its resolved parentId (null = root). */
  onDuplicate?: (node: OrgNode, parentId: number | null) => void;
}) {
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);

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
          draggable={!!onMoveNode}
          onMouseDown={(e) => e.stopPropagation()}
          onDragStart={(e) => { e.stopPropagation(); setDraggedId(node.id); e.dataTransfer.effectAllowed = "move"; }}
          onDragEnd={() => { setDraggedId(null); setDropTargetId(null); }}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (draggedId !== node.id) setDropTargetId(node.id); }}
          onDragLeave={() => setDropTargetId(null)}
          onDrop={(e) => {
            e.preventDefault(); e.stopPropagation();
            if (draggedId && draggedId !== node.id && onMoveNode) {
              onMoveNode({ nodeId: draggedId, newParentId: node.id });
            }
            setDraggedId(null); setDropTargetId(null);
          }}
        >
          <TreeNodeCard
            node={node}
            onClick={onNodeClick}
            onAdd={onAddChild}
            onDuplicate={onDuplicate ? () => onDuplicate(node, parentMap?.get(node.id) ?? null) : undefined}
            isDragging={draggedId === node.id}
            isDragTarget={dropTargetId === node.id}
          />
        </div>
      ))}
    </div>
  );
}
