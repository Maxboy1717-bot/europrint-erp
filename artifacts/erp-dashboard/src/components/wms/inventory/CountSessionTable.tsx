/**
 * @module CountSessionTable
 * @description React UI component.
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Eye } from "lucide-react";
import { format } from "date-fns";
import { InventoryCountData, STATUS_COLORS } from "./types";
import { useInventoryCountTranslations } from "./useInventoryCountTranslations";

interface CountSessionTableProps {
  counts: InventoryCountData[];
  onEdit: (count: InventoryCountData) => void;
  onView: (count: InventoryCountData) => void;
}

export function CountSessionTable({ counts, onEdit, onView }: CountSessionTableProps) {
  const t = useInventoryCountTranslations();

  return (
    <div className="rounded-md border">
      <div className="ep-table-scroll"><Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.table.countNumber}</TableHead>
            <TableHead>{t.table.date}</TableHead>
            <TableHead>{t.table.warehouse}</TableHead>
            <TableHead>{t.table.type}</TableHead>
            <TableHead>{t.table.status}</TableHead>
            <TableHead className="text-right">{t.table.totalItems}</TableHead>
            <TableHead className="text-right">{t.table.countedItems}</TableHead>
            <TableHead className="text-right">{t.table.variances}</TableHead>
            <TableHead className="text-right">{t.table.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {counts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center">
                {t.noDataFound}
              </TableCell>
            </TableRow>
          ) : (
            (Array.isArray(counts) ? counts : []).map((count) => (
              <TableRow key={count.id} className="hover:bg-muted/40 transition-colors">
                <TableCell className="font-medium">{count.countNumber}</TableCell>
                <TableCell>{format(new Date(count.countDate), "dd.MM.yyyy")}</TableCell>
                <TableCell>{count.warehouseName || "-"}</TableCell>
                <TableCell>{t.countTypes[count.countType as keyof typeof t.countTypes] || count.countType}</TableCell>
                <TableCell>
                  <Badge className={STATUS_COLORS[count.status]}>
                    {t.statuses[count.status as keyof typeof t.statuses] || count.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{count.totalItems}</TableCell>
                <TableCell className="text-right">{count.countedItems}</TableCell>
                <TableCell className="text-right">
                  <span className={count.varianceItems > 0 ? "text-[var(--ep-red)] font-medium" : "text-[var(--ep-green)]"}>
                    {count.varianceItems}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(count)} data-testid={`edit-button-${count.id}`}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onView(count)} data-testid={`view-button-${count.id}`}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table></div>
    </div>
  );
}
