/**
 * @module KanbanColumn
 * @description React UI component.
 */

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DealCard } from "./DealCard";
import { cn } from "@/lib/utils";
import { useTranslation } from '@/lib/i18n';

interface Deal {
  id: number;
  title: string;
  stageId: string;
  opportunity: string;
  currencyId: string;
  contactId: number | null;
  companyId: number | null;
  assignedById: string | null;
  dateCreate: string;
  dateModify: string;
}

interface Stage {
  id: number;
  stageId: string;
  name: string;
  sort: number;
  color: string | null;
}

interface KanbanColumnProps {
  stage: Stage;
  deals: Deal[];
  onDealClick?: (dealId: number) => void;
}

export function KanbanColumn({ stage, deals, onDealClick }: KanbanColumnProps) {
  const { t } = useTranslation("common");
  const { setNodeRef, isOver } = useDroppable({
    id: stage.stageId,
    data: {
      stageId: stage.stageId,
    },
  });

  const currencyTotals: Record<string, number> = {};
  (Array.isArray(deals) ? deals : []).forEach(deal => {
    const cur = deal.currencyId ?? 'UZS';
    const amt = Number(deal.opportunity || 0);
    if (!isNaN(amt)) currencyTotals[cur] = (currencyTotals[cur] ?? 0) + amt;
  });
  const totalDisplay = Object.entries(currencyTotals)
    .filter(([, v]) => v > 0)
    .map(([c, v]) => `${v.toLocaleString()} ${c}`)
    .join(' | ');

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "w-80 flex-shrink-0 flex flex-col",
        isOver && "ring-2 ring-primary"
      )}
      data-testid={`column-${stage.stageId}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            {stage.color && (
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
            )}
            {stage.name}
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {deals.length}
          </Badge>
        </div>
        {totalDisplay && (
          <p className="text-xs text-muted-foreground mt-1">
            {totalDisplay}
          </p>
        )}
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        <ScrollArea className="h-[calc(100vh-300px)]">
          <SortableContext
            id={stage.stageId}
            items={(Array.isArray(deals) ? deals : []).map((d) => d.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {(Array.isArray(deals) ? deals : []).map((deal) => (
                <DealCard key={deal.id} deal={deal} onClick={onDealClick} />
              ))}
            </div>
          </SortableContext>

          {deals.length === 0 && (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              {t("bosh")}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
