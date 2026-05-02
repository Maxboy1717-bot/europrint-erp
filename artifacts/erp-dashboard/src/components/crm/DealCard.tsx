import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building2, User, DollarSign, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface DealCardProps {
  deal: Deal;
  isDragging?: boolean;
  onClick?: (dealId: number) => void;
}

export function DealCard({ deal, isDragging = false, onClick }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: deal.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isActuallyDragging = isDragging || isSortableDragging;

  const handleClick = (e: React.MouseEvent) => {
    // Don't open sheet if dragging
    if (!isActuallyDragging && onClick) {
      onClick(deal.id);
    }
  };

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
      data-testid={`card-deal-${deal.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm line-clamp-2">{deal.title}</h3>
          <Badge variant="outline" className="text-xs shrink-0">
            #{deal.id}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Opportunity */}
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-green-600">
            {Number(deal.opportunity).toLocaleString()} {deal.currencyId}
          </span>
        </div>

        {/* Contact/Company */}
        {(deal.contactId || deal.companyId) && (
          <div className="space-y-1">
            {deal.contactId && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span>Kontakt #{deal.contactId}</span>
              </div>
            )}
            {deal.companyId && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3" />
                <span>Kompaniya #{deal.companyId}</span>
              </div>
            )}
          </div>
        )}

        {/* Date */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>
            {new Date(deal.dateCreate).toLocaleDateString("uz-UZ", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>

        {/* Assigned User */}
        {deal.assignedById && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {deal.assignedById.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">Mas'ul</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
