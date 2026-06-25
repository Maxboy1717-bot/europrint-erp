/**
 * @module helpers
 * @description React UI component.
 */

import React from "react";
import { OrgNode, LayoutNode, CARD_W, CARD_H, H_GAP, V_GAP } from "./types";

// Vysotskiy-7 tugun turlari → rang. Avval faqat owner/top_director/director +
// department/section taniylardi; 'ceo' va 'otdeleniye' (asosiy model turlari) fallback
// kulrangda qolardi (bug). Endi butun ierarxiya rangli; faqat 'position' (xodim-lavozim) kulrang.
const DIRECTOR_TYPES = new Set(["owner", "ceo", "top_director", "director"]); // L0-L2 rahbariyat
const OTDELENIYE_TYPES = new Set(["otdeleniye"]);                              // 7 Departament
const MANAGER_TYPES = new Set(["department", "section", "sector"]);            // Bo'lim/Sektsiya/Sektor

export function getCardColor(nodeType: string): string {
  if (DIRECTOR_TYPES.has(nodeType)) return "#7c3aed";   // binafsha — Rahbariyat
  if (OTDELENIYE_TYPES.has(nodeType)) return "#0ea5e9";  // havorang — Departament (otdeleniye)
  if (MANAGER_TYPES.has(nodeType)) return "#1d4ed8";    // ko'k — Bo'lim/Sektsiya/Sektor
  return "#4b5563"; // kulrang — Lavozim (xodim kartasi)
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
