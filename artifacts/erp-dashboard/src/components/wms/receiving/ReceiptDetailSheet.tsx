/**
 * @module ReceiptDetailSheet
 * @description React UI component.
 */

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Package, Plus, ClipboardCheck, CheckCircle, XCircle, AlertTriangle, FileText, Calendar, Building, Truck, PackageCheck } from "lucide-react";
import { GoodsReceipt, GoodsReceiptLine, STATUS_COLORS } from "./types";
import { useGoodsReceivingTranslations } from "./useGoodsReceivingTranslations";

import { EPLoader } from "@/components/ep";
interface ReceiptDetailSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  receiptDetail: GoodsReceipt | undefined;
  onAddLine: () => void;
  onQcAction: (line: GoodsReceiptLine, action: "pass" | "fail") => void;
  onComplete: (id: string) => void;
  isCompleting: boolean;
}

export function ReceiptDetailSheet({
  isOpen,
  onOpenChange,
  receiptDetail,
  onAddLine,
  onQcAction,
  onComplete,
  isCompleting,
}: ReceiptDetailSheetProps) {
  const t = useGoodsReceivingTranslations();

  const canComplete = useMemo(() => {
    if (!receiptDetail?.lines) return false;
    return receiptDetail.lines?.every((l) => l.qcStatus !== "pending");
  }, [receiptDetail]);

  if (!receiptDetail) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl overflow-y-auto p-6">
        <SheetHeader className="pb-6 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              {receiptDetail.receiptNumber}
            </SheetTitle>
            <Badge className={STATUS_COLORS[receiptDetail.status] || ""}>
              {t.statuses[receiptDetail.status as keyof typeof t.statuses] || receiptDetail.status}
            </Badge>
          </div>
        </SheetHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-8 border-b">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.date}</p>
              <p className="font-medium mt-0.5">{receiptDetail.receiptDate}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Building className="h-5 w-5 text-[var(--ep-blue)]" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.warehouse}</p>
              <p className="font-medium mt-0.5">{receiptDetail.warehouseName}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Truck className="h-5 w-5 text-[var(--ep-purple)]" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.supplier}</p>
              <p className="font-medium mt-0.5">{receiptDetail.supplierName}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <FileText className="h-5 w-5 text-[var(--ep-green)]" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.invoiceNumber}</p>
              <p className="font-medium mt-0.5">{receiptDetail.invoiceNumber || "—"}</p>
            </div>
          </div>
        </div>

        <div className="py-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              {t.lines}
            </h3>
            {receiptDetail.status === "draft" && (
              <Button size="sm" onClick={onAddLine} data-testid="button-add-line">
                <Plus className="h-4 w-4 mr-2" />
                {t.addLine}
              </Button>
            )}
          </div>

          <div className="border rounded-xl overflow-hidden bg-card">
            <div className="ep-table-scroll"><Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow className="bg-muted/60/50 hover:bg-muted/40 transition-colors">
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">{t.material}</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-center">{t.receivedQty}</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">{t.totalCost}</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-center">{t.qcStatus}</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receiptDetail.lines?.map((line) => (
                  <TableRow key={line.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell>
                      <p className="font-medium">{line.materialName}</p>
                      <p className="text-xs text-muted-foreground">{line.materialCode}</p>
                      {line.batchNumber && (
                        <p className="text-[10px] mt-1 text-primary">Batch: {line.batchNumber}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {line.receivedQuantity} {line.unitOfMeasure}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {Number(line.totalCost).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={STATUS_COLORS[line.qcStatus] || ""}>
                        {t.statuses[line.qcStatus as keyof typeof t.statuses] || line.qcStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {line.qcStatus === "pending" ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[var(--ep-green)] hover:text-green-600 hover:bg-[var(--ep-green)]/90/10"
                            onClick={() => onQcAction(line, "pass")}
                            data-testid={`button-qc-pass-${line.id}`}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[var(--ep-red)] hover:text-red-600 hover:bg-[var(--ep-red)]/90/10"
                            onClick={() => onQcAction(line, "fail")}
                            data-testid={`button-qc-fail-${line.id}`}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end">
                          {line.qcStatus === "passed" ? (
                            <CheckCircle className="h-4 w-4 text-[var(--ep-green)]" />
                          ) : (
                            <XCircle className="h-5 w-5 text-[var(--ep-red)]" />
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(!receiptDetail.lines || receiptDetail.lines.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      {t.noLines}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table></div>
          </div>
        </div>

        {receiptDetail.status === "pending_qc" && (
          <div className="mt-8 p-6 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <PackageCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-bold text-lg">{t.complete}</p>
                <p className="text-sm text-muted-foreground">Barcha materiallar QC tekshiruvidan o'tgandan so'ng qabulni yakunlang</p>
              </div>
            </div>
            <Button
              disabled={!canComplete || isCompleting}
              onClick={() => onComplete(receiptDetail.id)}
              className="px-8"
              data-testid="button-complete-receipt"
            >
              {isCompleting && <EPLoader className="mr-2" />}
              {t.complete}
            </Button>
            {!canComplete && (
              <p className="text-xs text-[var(--ep-red)] mt-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Hali tekshirilmagan materiallar bor
              </p>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
