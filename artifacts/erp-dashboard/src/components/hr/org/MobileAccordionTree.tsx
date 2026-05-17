/**
 * @module MobileAccordionTree
 * @description Phase 2 / Task 2.3 — mobile-first accordion view of the
 *   organisational tree.
 *
 *   Renders top-level departments as Radix accordion items. Each panel
 *   recursively lists children using nested <Accordion> instances so users
 *   can drill in vertically instead of fighting horizontal scroll. Used by
 *   OrgChartPage at viewports below the 768px breakpoint (`useIsMobile`).
 *
 *   Design notes:
 *     1. Touch-friendly hit targets — desktop tree rows are ~36px tall,
 *        below the 44px iOS guideline; the accordion trigger is thumb-sized.
 *     2. No indentation explosion — deep hierarchies show one nesting per
 *        accordion panel, not N*24px of left padding.
 *     3. Keyboard semantics out of the box — Radix provides space/enter
 *        toggle and arrow-key navigation between triggers.
 */

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Building2, UserCircle, Users } from "lucide-react";

export interface OrgChartNode {
  id: string;
  name: string;
  vep?: string;
  employeeCount?: number;
  color?: string;
  icon?: string;
  children?: OrgChartNode[];
}

interface MobileAccordionTreeProps {
  nodes: OrgChartNode[];
  depth?: number;
}

export function MobileAccordionTree({ nodes, depth = 0 }: MobileAccordionTreeProps) {
  if (!Array.isArray(nodes) || nodes.length === 0) return null;
  return (
    <Accordion
      type="multiple"
      className="w-full"
      data-testid={`mobile-accordion-d${depth}`}
    >
      {nodes.map((node) => {
        const hasChildren = Array.isArray(node.children) && node.children.length > 0;
        return (
          <AccordionItem
            key={node.id}
            value={node.id}
            data-testid={`mobile-accordion-item-${node.id}`}
          >
            <AccordionTrigger
              className="px-3 py-3 hover-elevate"
              disabled={!hasChildren}
              data-testid={`mobile-accordion-trigger-${node.id}`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: node.color || "hsl(var(--primary))" }}
                />
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <span
                  className="font-medium text-sm flex-1 text-left truncate"
                  data-testid={`mobile-text-dept-name-${node.id}`}
                >
                  {node.name}
                </span>
                {node.employeeCount !== undefined && (
                  <Badge
                    variant="secondary"
                    data-testid={`mobile-badge-employee-count-${node.id}`}
                  >
                    <Users className="h-3 w-3 mr-1" />
                    {node.employeeCount}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            {hasChildren && (
              <AccordionContent className="px-2 pb-1">
                {node.vep && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground px-3 py-2">
                    <UserCircle className="h-3 w-3" />
                    <span data-testid={`mobile-text-vep-${node.id}`}>{node.vep}</span>
                  </div>
                )}
                <MobileAccordionTree
                  nodes={node.children ?? []}
                  depth={depth + 1}
                />
              </AccordionContent>
            )}
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
