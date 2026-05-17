/**
 * orgChartTypes.ts — Phase 6 T6.1/T6.2
 *
 * Shared interfaces for the OrgChart tree, search index, and node-click
 * navigation. Split out of OrgChartPage.tsx to keep it under 300 lines.
 */

export interface OrgChartNode {
  id: string;
  name: string;
  vep?: string;
  /** Numeric employee/user id used to deep-link into the employee profile. */
  vepUserId?: number;
  /** Optional alias for `vepUserId` (some endpoints emit camelCase). */
  headUserId?: number;
  employeeCount?: number;
  color?: string;
  icon?: string;
  children?: OrgChartNode[];
}

export interface OrgChartStats {
  totalDepartments: number;
  totalEmployees: number;
  maxDepth: number;
}

export interface OrgChartData {
  tree: OrgChartNode[];
  stats?: OrgChartStats;
}

/**
 * Flat index produced once per data refresh.
 *
 * - `nodes`: array of every node in the tree (DFS order).
 * - `parentOf`: id → parentId map, lets us expand all ancestors of a match in O(depth).
 * - `lowerName`: id → lowercased name for case-insensitive prefix/substring search.
 *
 * Building the index is O(n); searching is O(n) per keystroke (single linear scan
 * + O(depth) ancestor walk per hit), replacing the previously possible O(n²)
 * "filter inside recursion" pattern.
 */
export interface OrgChartIndex {
  nodes: OrgChartNode[];
  parentOf: Map<string, string | null>;
  lowerName: Map<string, string>;
}
