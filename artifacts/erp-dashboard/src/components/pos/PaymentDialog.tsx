/**
 * @module PaymentDialog
 * @description React UI component.
 */

import { useTranslation } from "@/lib/i18n";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt, Printer } from "lucide-react";
import { ReceiptData, TransactionItem } from "./types";

interface PaymentDialogProps {
  showReceipt: boolean;
  setShowReceipt: (show: boolean) => void;
  receiptData: ReceiptData | null;
  handlePrintReceipt: () => void;
  paymentMethodLabels: Record<string, { uz: string; ru: string }>;
}

export function PaymentDialog({
  showReceipt,
  setShowReceipt,
  receiptData,
  handlePrintReceipt,
  paymentMethodLabels,
}: PaymentDialogProps) {
  const { t } = useTranslation('finance');

  return (
    <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
      <DialogContent className="max-w-md p-6" data-testid="dialog-receipt">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" /> Chek / Receipt
          </DialogTitle>
        </DialogHeader>
        {receiptData && (
          <div className="space-y-3 text-sm">
            <div className="text-center border-b pb-2">
              <h3 className="font-bold text-lg">{receiptData.companyName}</h3>
              <p className="text-xs text-muted-foreground">{receiptData.companyAddress}</p>
              <p className="text-xs text-muted-foreground">Tel: {receiptData.companyPhone}</p>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chek:</span>
                <span className="font-mono">{receiptData.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sana:</span>
                <span>{formatDateTime(receiptData.createdAt)}</span>
              </div>
              {receiptData.customerName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mijoz:</span>
                  <span>{receiptData.customerName}</span>
                </div>
              )}
            </div>
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Mahsulot</TableHead>
                  <TableHead className="text-xs text-center">Soni</TableHead>
                  <TableHead className="text-xs text-right">Narx</TableHead>
                  <TableHead className="text-xs text-right">Jami</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(receiptData.items) ? receiptData.items : []).map((item: TransactionItem, idx: number) => (
                  <TableRow key={idx} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="text-xs">{item.name}</TableCell>
                    <TableCell className="text-xs text-center">{item.quantity}</TableCell>
                    <TableCell className="text-xs text-right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-xs text-right">{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jami:</span>
                <span>{formatCurrency(receiptData.subtotal)}</span>
              </div>
              {receiptData.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chegirma:</span>
                  <span>-{formatCurrency(receiptData.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">QQS ({receiptData.taxRate}%):</span>
                <span>{formatCurrency(receiptData.taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-1">
                <span>UMUMIY:</span>
                <span>{formatCurrency(receiptData.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>To'lov:</span>
                <span>{paymentMethodLabels[receiptData.paymentMethod]?.uz || receiptData.paymentMethod}</span>
              </div>
              {(receiptData.paymentDetails?.changeAmount ?? 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Qaytim:</span>
                  <span>{formatCurrency(receiptData.paymentDetails.changeAmount ?? 0)}</span>
                </div>
              )}
            </div>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setShowReceipt(false)} data-testid="button-close-receipt">
            Yopish
          </Button>
          <Button onClick={handlePrintReceipt} data-testid="button-print-receipt">
            <Printer className="h-4 w-4 mr-1" /> Chop etish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
