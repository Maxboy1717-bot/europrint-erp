/**
 * @module MaterialInventoryTable
 * @description React UI component.
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, ClipboardList } from "lucide-react";
import { formatDate, formatCurrency, formatNumber } from "@/lib/format";
import { InventoryCount, statusLabels, countTypeLabels, Warehouse } from "./types";

interface MaterialInventoryTableProps {
  counts: InventoryCount[];
  warehouses: Warehouse[];
  onViewLines: (count: InventoryCount) => void;
}

export function MaterialInventoryTable({
  counts,
  warehouses,
  onViewLines
}: MaterialInventoryTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
      case "planned":
        return <Badge variant="outline" className="bg-gray-500/20 text-muted-foreground border-gray-500/40">{statusLabels[status] || status}</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/40">{statusLabels[status]}</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/40">{statusLabels[status]}</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/40">{statusLabels[status]}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (counts.length === 0) {
    return (
      <div className="text-center py-8 text-[13px] text-muted-foreground">
        <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Inventarizatsiya ma'lumotlari topilmadi</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="ep-table-scroll"><Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/40 transition-colors">
            <TableHead>Hisob №</TableHead>
            <TableHead>Sana</TableHead>
            <TableHead>Tur</TableHead>
            <TableHead>Holat</TableHead>
            <TableHead className="text-right">Jami elementlar</TableHead>
            <TableHead className="text-right">Jami qiymat (kitob)</TableHead>
            <TableHead className="text-right">Farq qiymati</TableHead>
            <TableHead className="text-right w-[100px]">Amallar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(Array.isArray(counts) ? counts : []).map((count) => (
            <TableRow key={count.id} className="hover:bg-muted/40 transition-colors">
              <TableCell className="font-medium">{count.countNumber}</TableCell>
              <TableCell>{formatDate(count.countDate)}</TableCell>
              <TableCell>{countTypeLabels[count.countType] || count.countType}</TableCell>
              <TableCell>{getStatusBadge(count.status)}</TableCell>
              <TableCell className="text-right">{formatNumber(count.totalItems)}</TableCell>
              <TableCell className="text-right">{formatCurrency(count.totalBookValue)}</TableCell>
              <TableCell className="text-right">
                <span className={count.totalVariance > 0 ? "text-[var(--ep-green)]" : count.totalVariance < 0 ? "text-[var(--ep-red)]" : ""}>
                  {formatCurrency(count.totalVariance)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => onViewLines(count)}
                  data-testid={`button-view-lines-${count.id}`}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table></div>
    </div>
  );
}
