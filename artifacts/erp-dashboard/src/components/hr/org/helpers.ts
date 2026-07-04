/**
 * @module helpers
 * @description React UI component.
 */

import React from "react";
import { OrgNode, LayoutNode, CARD_W, CARD_H, H_GAP, V_GAP, LEVEL_COLORS } from "./types";

// Karta rangi DARAJAGA (hierarchyLevel) qarab beriladi — bir xil daraja = bir xil rang,
// pastdagi legend va karta-yorlig'i (LEVEL_LABELS) bilan to'liq mos. Ilgari rang node_type'dan
// kelardi → bir xil darajadagi kartalar har xil rangda chiqardi (egasi 2026-06-25 e'tirozi).
export function getLevelColor(level: number): string {
  return LEVEL_COLORS[level] ?? "hsl(var(--muted-foreground))"; // aniqlanmagan daraja → kulrang fallback
}

export function computeSubtreeWidth(node: OrgNode): number {
  if (!node.children || node.children.length === 0) return CARD_W;
  const childrenWidth = node.children?.reduce(
    (sum, c) => sum + computeSubtreeWidth(c),
    0
  ) + H_GAP * (node.children.length - 1);
  return Math.max(CARD_W, childrenWidth);
}

export function layoutTree(
  node: OrgNode,
  offsetX: number,
  offsetY: number
): LayoutNode {
  const totalChildWidth = node.children && node.children.length > 0
    ? node.children?.reduce((s, c) => s + computeSubtreeWidth(c), 0) +
      H_GAP * (node.children.length - 1)
    : 0;
  const myWidth = Math.max(CARD_W, totalChildWidth);
  const myX = offsetX + (myWidth - CARD_W) / 2;

  let childX = offsetX;
  const layoutChildren: LayoutNode[] = (node.children || []).map((c) => {
    const cw = computeSubtreeWidth(c);
    const laid = layoutTree(c, childX, offsetY + CARD_H + V_GAP);
    childX += cw + H_GAP;
    return laid;
  });

  return { node, x: myX, y: offsetY, children: layoutChildren };
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
