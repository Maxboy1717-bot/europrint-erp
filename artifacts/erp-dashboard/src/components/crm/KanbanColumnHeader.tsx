import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface KanbanColumnHeaderProps {
  stageName: string;
  stageColor?: string;
  itemCount: number;
  totalValue: number;
  currency?: string;
  onQuickAdd?: () => void;
}


export function KanbanColumnHeader({
  stageName,
  stageColor,
  itemCount,
  totalValue,
  currency = "UZS",
  onQuickAdd,
}: KanbanColumnHeaderProps) {
  return (
    <div
      className="flex flex-col gap-2 pb-3"
      data-testid={`kanban-header-${stageName.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {stageColor && (
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: stageColor }}
              data-testid="stage-color-indicator"
            />
          )}
          <h3 className="font-semibold text-sm truncate">{stageName}</h3>
          <Badge
            variant="secondary"
            className="text-xs shrink-0"
            data-testid="item-count-badge"
          >
            {itemCount}
          </Badge>
        </div>

        {onQuickAdd && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0"
            onClick={onQuickAdd}
            data-testid="button-quick-add"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {totalValue > 0 && (
        <p
          className="text-xs text-muted-foreground"
          data-testid="total-value-display"
        >
          {formatCurrency(totalValue, currency)}
        </p>
      )}
    </div>
  );
}
