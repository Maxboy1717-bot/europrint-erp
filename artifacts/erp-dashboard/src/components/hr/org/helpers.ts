/**
 * @module helpers
 * @description React UI component.
 */

import React from "react";
import { OrgNode, LayoutNode, CARD_W, CARD_H, H_GAP, V_GAP, resolveTierIndex } from "./types";

export function computeSubtreeWidth(node: OrgNode): number {
  if (!node.children || node.children.length === 0) return CARD_W;
  const childrenWidth = node.children?.reduce(
    (sum, c) => sum + computeSubtreeWidth(c),
    0
  ) + H_GAP * (node.children.length - 1);
  return Math.max(CARD_W, childrenWidth);
}

/** Row (Y) is TIER-driven (resolveTierIndex), NOT tree-recursion depth — owner 2026-07-14:
 *  "hammasi o'zini qatorida bo'lsin" (every card sits in its own tier's row). A card whose
 *  parent lives several tiers up (e.g. Departament parented directly under Egasi, skipping
 *  Bosh Direktor/Yo'nalish direktori) still renders in the Departament row; the connector
 *  (TreeCanvas.tsx buildConnectors) draws the longer vertical drop to reach it. X-centering
 *  still follows the actual parent-child tree structure (recursion), only Y changed. */
export function layoutTree(
  node: OrgNode,
  offsetX: number
): LayoutNode {
  const totalChildWidth = node.children && node.children.length > 0
    ? node.children?.reduce((s, c) => s + computeSubtreeWidth(c), 0) +
      H_GAP * (node.children.length - 1)
    : 0;
  const myWidth = Math.max(CARD_W, totalChildWidth);
  const myX = offsetX + (myWidth - CARD_W) / 2;
  const myRow = resolveTierIndex(node.nodeType, node.hierarchyLevel ?? 0);
  const myY = myRow * (CARD_H + V_GAP);

  let childX = offsetX;
  const layoutChildren: LayoutNode[] = (node.children || []).map((c) => {
    const cw = computeSubtreeWidth(c);
    const laid = layoutTree(c, childX);
    childX += cw + H_GAP;
    return laid;
  });

  return { node, x: myX, y: myY, children: layoutChildren };
}

export function flattenLayout(root: LayoutNode): LayoutNode[] {
  const result: LayoutNode[] = [root];
  root.children?.forEach((c) => result.push(...flattenLayout(c)));
  return result;
}

export function countNodes(nodes: OrgNode[]): number {
  return (Array.isArray(nodes) ? nodes : []).reduce((sum, n) => sum + 1 + countNodes(n.children || []), 0);
}

export function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}
