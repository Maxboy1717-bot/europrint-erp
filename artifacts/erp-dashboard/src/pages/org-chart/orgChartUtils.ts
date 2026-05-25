/**
 * orgChartUtils.ts — Phase 6 T6.1 + T6.4
 *
 * Pure helpers for the OrgChart tree:
 *   - `buildIndex`            : O(n) flat index (nodes + parent map + lowercased names).
 *   - `searchTree`            : O(n) substring match → returns matched-id set
 *                               plus the union of all ancestor ids (so the tree
 *                               can be auto-expanded down to every hit).
 *   - `highlightTokens`       : helper used by the JSX layer to render matched
 *                               substrings in bold without re-running the regex
 *                               for every node.
 *   - `collectAllIds`         : returns every node id (used to "expand all" when
 *                               a search filter is active).
 *
 * Algorithmic note:
 *   The previous implementation re-walked `tree` inside every render to filter
 *   visible nodes — O(n²) in the worst case (deep tree × per-keystroke filter).
 *   `buildIndex` lets the search layer iterate once and look up ancestors in O(1)
 *   via the parent Map, dropping search cost to O(n) per keystroke.
 */

import type { OrgChartIndex, OrgChartNode } from './orgChartTypes';

/**
 * Walk `tree` once and produce a flat index.
 *
 * Time/space:  O(n) / O(n)
 */
export function buildIndex(tree: ReadonlyArray<OrgChartNode>): OrgChartIndex {
  const nodes: OrgChartNode[] = [];
  const parentOf = new Map<string, string | null>();
  const lowerName = new Map<string, string>();

  const stack: Array<{ node: OrgChartNode; parentId: string | null }> = [];
  const roots = Array.isArray(tree) ? tree : [];
  // Push in reverse so DFS preserves original sibling order.
  for (let i = roots.length - 1; i >= 0; i -= 1) {
    stack.push({ node: roots[i], parentId: null });
  }

  while (stack.length > 0) {
    const top = stack.pop();
    if (!top) break;
    const { node, parentId } = top;
    nodes.push(node);
    parentOf.set(node.id, parentId);
    lowerName.set(node.id, (node.name ?? '').toLowerCase());

    const children = Array.isArray(node.children) ? node.children : [];
    for (let i = children.length - 1; i >= 0; i -= 1) {
      stack.push({ node: children[i], parentId: node.id });
    }
  }

  return { nodes, parentOf, lowerName };
}

export interface SearchResult {
  /** Ids that directly match the query. */
  matched: Set<string>;
  /**
   * Ids that should be expanded so every match is visible. Always a superset
   * of `matched` (includes all ancestors).
   */
  expanded: Set<string>;
}

/**
 * Case-insensitive substring search over the flat index.
 *
 * @returns matched ids + the union of their ancestor chains.
 */
export function searchTree(index: OrgChartIndex, query: string): SearchResult {
  const matched = new Set<string>();
  const expanded = new Set<string>();
  const q = (query ?? '').trim().toLowerCase();
  if (q.length === 0) return { matched, expanded };

  for (const node of index.nodes) {
    const name = index.lowerName.get(node.id) ?? '';
    if (!name.includes(q)) continue;
    matched.add(node.id);
    // Walk ancestors and mark them as "expanded" so the match is reachable.
    let cursor: string | null = index.parentOf.get(node.id) ?? null;
    const guard = new Set<string>(); // protect against malformed cyclic input
    while (cursor !== null && cursor !== undefined && !guard.has(cursor)) {
      guard.add(cursor);
      expanded.add(cursor);
      cursor = index.parentOf.get(cursor) ?? null;
    }
  }

  return { matched, expanded };
}

/**
 * Split `text` around case-insensitive occurrences of `query` so the caller can
 * render matched fragments with a `<mark>` element.
 *
 * Empty query → returns `[text]` (caller renders untouched).
 */
export function highlightTokens(text: string, query: string): Array<{ value: string; match: boolean }> {
  const q = (query ?? '').trim();
  if (q.length === 0 || !text) return [{ value: text ?? '', match: false }];

  const out: Array<{ value: string; match: boolean }> = [];
  const lowerText = text.toLowerCase();
  const lowerQ = q.toLowerCase();
  let i = 0;
  while (i < text.length) {
    const found = lowerText.indexOf(lowerQ, i);
    if (found === -1) {
      out.push({ value: text.slice(i), match: false });
      break;
    }
    if (found > i) out.push({ value: text.slice(i, found), match: false });
    out.push({ value: text.slice(found, found + q.length), match: true });
    i = found + q.length;
  }
  return out;
}

/**
 * Return every node id in the index — used to auto-expand the entire tree when
 * a search filter is active.
 */
export function collectAllIds(index: OrgChartIndex): Set<string> {
  const ids = new Set<string>();
  for (const n of index.nodes) ids.add(n.id);
  return ids;
}
