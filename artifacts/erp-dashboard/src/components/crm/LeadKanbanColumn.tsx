/**
 * @module LeadKanbanColumn
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
import { LeadCard } from "./LeadCard";
import { cn } from "@/lib/utils";

interface Lead {
  id: number;
  title: string;
  name: string | null;
  lastName: string | null;
  companyTitle: string | null;
  statusId: string;
  phones: { value: string; type: string }[];
  emails: { value: string; type: string }[];
  sourceId: string | null;
  assignedById: string | null;
  dateCreate: string;
}

interface LeadStage {
  id: number;
  stageId: string;
  name: string;
  nameRu: string | null;
  sort: number;
  color: string | null;
}

interface LeadKanbanColumnProps {
  stage: LeadStage;
  leads: Lead[];
  onLeadClick?: (leadId: number) => void;
}

export function LeadKanbanColumn({ stage, leads, onLeadClick }: LeadKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.stageId,
    data: {
      stageId: stage.stageId,
    },
  });

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
          <Badge variant="secondary" className="text-xs" data-testid={`badge-count-${stage.stageId}`}>
            {leads.length}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        <ScrollArea className="h-[calc(100vh-300px)]">
          <SortableContext
            id={stage.stageId}
            items={(Array.isArray(leads) ? leads : []).map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {(Array.isArray(leads) ? leads : []).map((lead) => (
                <LeadCard key={lead.id} lead={lead} onClick={onLeadClick} />
              ))}
            </div>
          </SortableContext>

          {leads.length === 0 && (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              Bo'sh
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
