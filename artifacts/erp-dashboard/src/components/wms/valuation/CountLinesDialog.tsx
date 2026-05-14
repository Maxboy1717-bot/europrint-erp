/**
 * @module CountLinesDialog
 * @description React UI component.
 */

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatNumber } from "@/lib/format";
import { InventoryCount, InventoryCountLine } from "./types";

import { useTranslation } from '@/lib/i18n';
interface CountLinesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: InventoryCount | null;
  countLines: InventoryCountLine[];
  isLoading: boolean;
}

export function CountLinesDialog({isOpen,
  onOpenChange,
  selectedCount,
  countLines,
  isLoading
}: CountLinesDialogProps) {
  const { t } = useTranslation('common');
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Inventarizatsiya tafsilotlari: {selectedCount?.countNumber}</DialogTitle>
          <DialogDescription>
            Barcha elementlar va ularning hisob-kitob farqlari
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            {([...Array(5)]).map((_, i) => (
              <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="ep-table-scroll"><Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead>{t('mahsulotMaterial')}</TableHead>
                <TableHead className="text-right">Kitob miqdori</TableHead>
                <TableHead className="text-right">Sanalgan miqdor</TableHead>
                <TableHead className="text-right">Farq</TableHead>
                <TableHead className="text-right">Birlik narxi</TableHead>
                <TableHead className="text-right">Qiymat farqi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(countLines) ? countLines : []).map((line) => (
                <TableRow key={line.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">
                    {line.itemType === 'material' ? 'Material' : 'Tayyor mahsulot'}
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(line.bookQuantity)}</TableCell>
                  <TableCell className="text-right">{line.countedQuantity !== null ? formatNumber(line.countedQuantity) : "-"}</TableCell>
                  <TableCell className="text-right">
                    {line.variance !== null && (
                      <Badge variant={line.variance === 0 ? "outline" : line.variance > 0 ? "default" : "destructive"}>
                        {line.variance > 0 ? "+" : ""}{formatNumber(line.variance)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(line.unitCost)}</TableCell>
                  <TableCell className="text-right">
                    <span className={line.valueVariance && line.valueVariance > 0 ? "text-[var(--ep-green)]" : line.valueVariance && line.valueVariance < 0 ? "text-[var(--ep-red)]" : ""}>
                      {line.valueVariance !== null ? formatCurrency(line.valueVariance) : "-"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        )}
      </DialogContent>
    </Dialog>
  );
}
