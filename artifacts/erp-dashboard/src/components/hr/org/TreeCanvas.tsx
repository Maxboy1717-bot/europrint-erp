/**
 * @module TreeCanvas
 * @description React UI component.
 */

import React, { useState } from "react";
import { OrgNode, LayoutNode, CARD_W, CARD_H, H_GAP, V_GAP } from "./types";
import { computeSubtreeWidth, layoutTree, flattenLayout } from "./helpers";
import { TreeNodeCard } from "./TreeNodeCard";

function buildConnectors(nodes: LayoutNode[]): React.ReactNode[] {
  const lines: React.ReactNode[] = [];
  (Array.isArray(nodes) ? nodes : []).forEach((parent) => {
    const px = parent.x + CARD_W / 2;
    const py = parent.y + CARD_H;
    parent.children?.forEach((child, idx) => {
      const cx = child.x + CARD_W / 2;
      const cy = child.y;
      const midY = py + V_GAP / 2;
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
}: {
  roots: OrgNode[];
  onNodeClick: (id: number) => void;
  onAddChild: (parentId: string) => void;
  onMoveNode?: (args: { nodeId: number; newParentId: number }) => void;
}) {
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);

  if (!roots || roots.length === 0) return null;

  const layouts: LayoutNode[] = [];
  let xOffset = 0;
  (Array.isArray(roots) ? roots : []).forEach((r) => {
    const w = computeSubtreeWidth(r);
    layouts.push(layoutTree(r, xOffset, 0));
    xOffset += w + H_GAP * 4;
  });

  const allNodes = (Array.isArray(layouts) ? layouts : []).flatMap(flattenLayout);
  const connectors = buildConnectors(allNodes);

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
            isDragging={draggedId === node.id}
            isDragTarget={dropTargetId === node.id}
          />
        </div>
      ))}
    </div>
  );
}
