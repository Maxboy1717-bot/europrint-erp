import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/format";
import { format } from "date-fns";
import { CrmEntityLike, ListViewProps } from "./types";

export function ListView({
  items,
  activeEntity,
  selectedItems,
  onToggleItem,
  onToggleAll,
  onItemClick,
}: ListViewProps) {
  return (
    <ScrollArea className="flex-1">
      <Table>
        <TableHeader className="bg-surface-container-low sticky top-0 z-10 shadow-sm">
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={items.length > 0 && selectedItems.size === items.length}
                onCheckedChange={(checked) => onToggleAll(!!checked)}
                data-testid="checkbox-all"
              />
            </TableHead>
            <TableHead className="w-12">№</TableHead>
            <TableHead>Nomi</TableHead>
            {activeEntity !== "contacts" && activeEntity !== "companies" && (
              <TableHead>Bosqich</TableHead>
            )}
            {(activeEntity === "deals" ||
              activeEntity === "proposals" ||
              activeEntity === "invoices") && <TableHead>Summa</TableHead>}
            <TableHead>Mas'ul</TableHead>
            <TableHead>Yaratilgan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(Array.isArray(items) ? items : []).map((item, index) => {
            const rec = item as CrmEntityLike;
            const title =
              rec.title ||
              rec.name ||
              ([rec.lastName, rec.name]).filter(Boolean).join(" ");
            const date = rec.dateCreate || rec.createdAt;
            const amount = rec.opportunity || rec.totalAmount;

            return (
              <TableRow
                key={item.id}
                className="hover:bg-surface-container-lowest transition-colors cursor-pointer"
                onClick={() => onItemClick(item.id)}
                data-testid={`row-${item.id}`}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={() => onToggleItem(item.id)}
                    data-testid={`checkbox-${item.id}`}
                  />
                </TableCell>
                <TableCell className="text-on-surface-variant font-medium">
                  {index + 1}
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-on-surface line-clamp-1">
                    {title}
                  </div>
                  {rec.companyTitle && (
                    <div className="text-xs text-on-surface-variant truncate">
                      {rec.companyTitle}
                    </div>
                  )}
                </TableCell>
                {activeEntity !== "contacts" && activeEntity !== "companies" && (
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {rec.statusId || rec.stageId || rec.status}
                    </Badge>
                  </TableCell>
                )}
                {(activeEntity === "deals" ||
                  activeEntity === "proposals" ||
                  activeEntity === "invoices") && (
                  <TableCell className="font-semibold">
                    {formatCurrency(amount || 0)}
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px]">
                        {rec.assignedById?.slice(0, 2).toUpperCase() || "UN"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs truncate max-w-[100px]">
                      {rec.assignedById || "Tayinlanmagan"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-on-surface-variant text-xs">
                  {date ? format(new Date(date), "dd.MM.yyyy") : "-"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
