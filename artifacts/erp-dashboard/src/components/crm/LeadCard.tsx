/**
 * @module LeadCard
 * @description React UI component.
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Building2, User, DollarSign, Calendar } from "lucide-react";
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

interface LeadCardProps {
  lead: Lead;
  isDragging?: boolean;
  onClick?: (leadId: number) => void;
}

export function LeadCard({ lead, isDragging = false, onClick }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: lead.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isActuallyDragging = isDragging || isSortableDragging;

  const handleClick = (e: React.MouseEvent) => {
    if (!isActuallyDragging && onClick) {
      onClick(lead.id);
    }
  };

  const fullName = ([lead.name, lead.lastName]).filter(Boolean).join(" ");
  const primaryPhone = lead.phones?.[0]?.value;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={cn(
        "cursor-grab active:cursor-grabbing hover-elevate active-elevate-2",
        isActuallyDragging && "opacity-50 shadow-lg"
      )}
      data-testid={`card-lead-${lead.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm line-clamp-2">{lead.title}</h3>
          <Badge variant="outline" className="text-xs shrink-0">
            #{lead.id}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {fullName && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{fullName}</span>
          </div>
        )}

        {primaryPhone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{primaryPhone}</span>
          </div>
        )}

        {lead.companyTitle && (
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="line-clamp-1">{lead.companyTitle}</span>
          </div>
        )}

        {lead.sourceId && (
          <Badge variant="secondary" className="text-xs">
            {lead.sourceId}
          </Badge>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
          <Calendar className="h-3 w-3" />
          <span>
            {new Date(lead.dateCreate).toLocaleDateString("uz-UZ", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
