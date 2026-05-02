import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatNumber } from "@/lib/format";
import { InventoryCount, InventoryCountLine } from "./types";

interface CountLinesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: InventoryCount | null;
  countLines: InventoryCountLine[];
  isLoading: boolean;
}

export function CountLinesDialog({
  isOpen,
  onOpenChange,
  selectedCount,
  countLines,
  isLoading
}: CountLinesDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inventarizatsiya tafsilotlari: {selectedCount?.countNumber}</DialogTitle>
          <DialogDescription>
            Barcha elementlar va ularning hisob-kitob farqlari
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            {([...Array(5)]).map((_, i) => (
              <Skeleton key={`k-${i}`} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mahsulot/Material</TableHead>
                <TableHead className="text-right">Kitob miqdori</TableHead>
                <TableHead className="text-right">Sanalgan miqdor</TableHead>
                <TableHead className="text-right">Farq</TableHead>
                <TableHead className="text-right">Birlik narxi</TableHead>
                <TableHead className="text-right">Qiymat farqi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(countLines) ? countLines : []).map((line) => (
                <TableRow key={line.id}>
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
                    <span className={line.valueVariance && line.valueVariance > 0 ? "text-green-500" : line.valueVariance && line.valueVariance < 0 ? "text-red-500" : ""}>
                      {line.valueVariance !== null ? formatCurrency(line.valueVariance) : "-"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
