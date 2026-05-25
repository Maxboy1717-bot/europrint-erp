/**
 * OrgChartTreeNode.tsx — Phase 6 T6.1 + T6.2
 *
 * Tree node renderer used by `OrgChartPage`. Adds:
 *   T6.1 — highlight matched substrings via <mark>; matched nodes get a subtle ring.
 *   T6.2 — when `node.vepUserId` is set, the VEP (head) chip becomes a Link to
 *          `/employees/:id` (project's actual employee profile route).
 *
 * Performance:
 *   - No nested loops over the whole tree. Only inspects its own subtree via
 *     React recursion.
 *   - `highlightTokens` is O(n) over the node name only (small string).
 */

import { Link } from "wouter";
import { Building2, ChevronDown, ChevronRight, UserCircle, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrgChartNode } from "./orgChartTypes";
import { highlightTokens } from "./orgChartUtils";

interface Props {
  node: OrgChartNode;
  expandedIds: Set<string>;
  matchedIds: Set<string>;
  onToggle: (id: string) => void;
  query: string;
  depth?: number;
}

function renderName(name: string, query: string): React.ReactNode {
  const tokens = highlightTokens(name ?? '', query);
  return tokens.map((tok, i) => tok.match
    ? <mark key={i} className="bg-yellow-200/70 dark:bg-yellow-500/40 rounded px-0.5" data-testid="search-mark">{tok.value}</mark>
    : <span key={i}>{tok.value}</span>,
  );
}

export function OrgChartTreeNode({
  node,
  expandedIds,
  matchedIds,
  onToggle,
  query,
  depth = 0,
}: Props) {
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const isMatch = matchedIds.has(node.id);
  const headUserId = node.vepUserId ?? node.headUserId;

  return (
    <div data-testid={`tree-node-${node.id}`}>
      <div
        className={cn(
          "flex items-center gap-2 p-3 rounded-md cursor-pointer hover-elevate",
          isMatch && "ring-2 ring-yellow-400/60",
        )}
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
        onClick={() => onToggle(node.id)}
        data-testid={`tree-node-toggle-${node.id}`}
      >
        {hasChildren ? (
          isExpanded
            ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <span className="w-4 shrink-0" />
        )}

        <div
          className="h-3 w-3 rounded-full shrink-0"
          style={{ backgroundColor: node.color || "hsl(var(--primary))" }}
        />

        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />

        <span className="font-medium text-sm flex-1" data-testid={`text-dept-name-${node.id}`}>
          {renderName(node.name, query)}
        </span>

        {node.vep && (
          headUserId !== undefined && headUserId !== null
            ? (
              <Link
                href={`/employees/${headUserId}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary hover:underline"
                data-testid={`link-employee-${node.id}`}
              >
                <UserCircle className="h-3 w-3" />
                <span data-testid={`text-vep-${node.id}`}>{node.vep}</span>
              </Link>
            )
            : (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <UserCircle className="h-3 w-3" />
                <span data-testid={`text-vep-${node.id}`}>{node.vep}</span>
              </div>
            )
        )}

        {node.employeeCount !== undefined && (
          <Badge variant="secondary" data-testid={`badge-employee-count-${node.id}`}>
            <Users className="h-3 w-3 mr-1" />
            {node.employeeCount}
          </Badge>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div data-testid={`tree-children-${node.id}`}>
          {(node.children ?? []).map((child) => (
            <OrgChartTreeNode
              key={child.id}
              node={child}
              expandedIds={expandedIds}
              matchedIds={matchedIds}
              onToggle={onToggle}
              query={query}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
