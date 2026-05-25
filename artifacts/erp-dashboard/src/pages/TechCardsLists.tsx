/**
 * @module TechCardsLists
 * @description Reusable scrollable list sub-components for the TechCards feature:
 * OperationsList (routing steps) and MaterialsList (BOM entries).
 * These are extracted to keep TechCardsSections and TechCardsDialogs under 300 lines.
 */

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TechCard } from "./TechCardsTypes";

// ---------------------------------------------------------------------------
// OperationsList
// ---------------------------------------------------------------------------

type Operation = NonNullable<TechCard["operations"]>[number];

interface OperationsListProps {
  operations: Operation[];
}

/** Scrollable list of routing operations shown in the view-card dialog. */
export function OperationsList({ operations }: OperationsListProps) {
  return (
    <ScrollArea className="max-h-[200px]">
      <div className="space-y-2">
        {(Array.isArray(operations) ? operations : []).map((op, i) => (
          <div
            key={`op-${i}`}
            className="flex items-center gap-3 p-2 rounded border text-sm"
            data-testid={`row-operation-${i}`}
          >
            <Badge variant="outline" className="shrink-0">
              {op.sequence}
            </Badge>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{op.operationName}</p>
              <p className="text-xs text-muted-foreground">Mashina: {op.machineCode}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs">Setup: {op.setupTime} min</p>
              <p className="text-xs text-muted-foreground">Mashina: {op.machineTime} min</p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// ---------------------------------------------------------------------------
// MaterialsList
// ---------------------------------------------------------------------------

type Material = NonNullable<TechCard["materials"]>[number];

interface MaterialsListProps {
  materials: Material[];
}

/** Scrollable list of BOM materials shown in the view-card dialog. */
export function MaterialsList({ materials }: MaterialsListProps) {
  return (
    <ScrollArea className="max-h-[200px]">
      <div className="space-y-2">
        {(Array.isArray(materials) ? materials : []).map((m, i) => (
          <div
            key={`mat-${i}`}
            className="flex items-center justify-between gap-3 p-2 rounded border text-sm"
            data-testid={`row-material-${i}`}
          >
            <span className="font-medium">{m.materialName}</span>
            <div className="text-right shrink-0">
              <span>{m.quantity} {m.unit}</span>
              {m.wastagePercent > 0 && (
                <span className="text-xs text-muted-foreground ml-2">
                  (chiqindi: {m.wastagePercent}%)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
