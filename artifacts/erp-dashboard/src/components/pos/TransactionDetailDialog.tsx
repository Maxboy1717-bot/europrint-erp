/**
 * @module TransactionDetailDialog
 * @description React UI component.
 */

import { useTranslation } from "@/lib/i18n";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PosTransaction, TransactionItem } from "./types";

interface TransactionDetailDialogProps {
  transaction: PosTransaction | null;
  onClose: () => void;
  paymentMethodLabels: Record<string, { uz: string; ru: string }>;
}

export function TransactionDetailDialog({
  transaction,
  onClose,
  paymentMethodLabels,
}: TransactionDetailDialogProps) {
  const { t } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');

  if (!transaction) return null;

  return (
    <Dialog open={!!transaction} onOpenChange={(open) => !open && onClose()}>
      <DialogContent data-testid="dialog-view-transaction" className="p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t('transactions')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div><span className="text-muted-foreground">Tranzaksiya:</span> <span className="font-mono">{transaction.transactionNumber}</span></div>
            <div><span className="text-muted-foreground">Chek:</span> <span className="font-mono">{transaction.receiptNumber || "-"}</span></div>
            <div><span className="text-muted-foreground">Sana:</span> {formatDateTime(transaction.createdAt)}</div>
            <div><span className="text-muted-foreground">Mijoz:</span> {transaction.customerName || "-"}</div>
            <div><span className="text-muted-foreground">To'lov:</span> {paymentMethodLabels[transaction.paymentMethod]?.uz || transaction.paymentMethod}</div>
            <div>
              <span className="text-muted-foreground">Holat:</span>{" "}
              <Badge variant={transaction.status === "completed" ? "secondary" : "destructive"}>
                {transaction.status === "completed" ? tCommon('success') : transaction.status === "refunded" ? t('refund') : transaction.status}
              </Badge>
            </div>
          </div>
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mahsulot</TableHead>
                <TableHead className="text-center">Soni</TableHead>
                <TableHead className="text-right">Narx</TableHead>
                <TableHead className="text-right">Jami</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(transaction.items) ? transaction.items : []).map((item: TransactionItem, idx: number) => (
                <TableRow key={idx} className="hover:bg-muted/40 transition-colors">
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
          <div className="border-t pt-2 space-y-1">
            <div className="flex justify-between"><span>Jami:</span><span>{formatCurrency(transaction.subtotal)}</span></div>
            {transaction.discountAmount > 0 && (
              <div className="flex justify-between"><span>Chegirma:</span><span>-{formatCurrency(transaction.discountAmount)}</span></div>
            )}
            <div className="flex justify-between"><span>QQS ({transaction.taxRate}%):</span><span>{formatCurrency(transaction.taxAmount)}</span></div>
            <div className="flex justify-between font-bold"><span>UMUMIY:</span><span>{formatCurrency(transaction.totalAmount)}</span></div>
          </div>
          {transaction.notes && (
            <div className="border-t pt-2"><span className="text-muted-foreground">Izoh:</span> {transaction.notes}</div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-close-tx-detail">{tCommon('cancel')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
