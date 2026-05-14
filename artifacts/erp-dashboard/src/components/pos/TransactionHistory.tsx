/**
 * @module TransactionHistory
 * @description React UI component.
 */

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, RotateCcw } from "lucide-react";
import { PosTransaction } from "./types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface TransactionHistoryProps {
  transactions: PosTransaction[];
  setViewTransaction: (tx: PosTransaction) => void;
  refundMutation: {
    mutate: (id: string) => void;
    isPending: boolean;
  };
  paymentMethodLabels: Record<string, { uz: string; ru: string }>;
}

export function TransactionHistory({
  transactions,
  setViewTransaction,
  refundMutation,
  paymentMethodLabels,
}: TransactionHistoryProps) {
  const { t } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');
  const [confirmRefundId, setConfirmRefundId] = useState<string | null>(null);

  return (
    <>
    <Card>
      <CardContent className="p-0">
        <div className="ep-table-scroll"><Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('transactions')} #</TableHead>
              <TableHead>{tCommon('date')}</TableHead>
              <TableHead>{t('customer')}</TableHead>
              <TableHead className="text-right">{tCommon('total')}</TableHead>
              <TableHead>{t('payment')}</TableHead>
              <TableHead>{tCommon('status')}</TableHead>
              <TableHead className="w-24 text-right">{tCommon('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-[13px] text-muted-foreground">
                  {t("tranzaksiyalarMavjudEmas")}
                </TableCell>
              </TableRow>
            ) : (
              (Array.isArray(transactions) ? transactions : []).map((tx) => (
                <TableRow key={tx.id} data-testid={`row-transaction-${tx.id}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-xs">{tx.transactionNumber}</TableCell>
                  <TableCell className="text-xs">{formatDateTime(tx.createdAt)}</TableCell>
                  <TableCell className="text-sm">{tx.customerName || "-"}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(tx.totalAmount)}</TableCell>
                  <TableCell className="text-xs">
                    {paymentMethodLabels[tx.paymentMethod]?.uz || tx.paymentMethod}
                  </TableCell>
                  <TableCell>
                    <Badge variant={tx.status === "completed" ? "secondary" : "destructive"}>
                      {tx.status === "completed" ? tCommon('success') : tx.status === "refunded" ? t('refund') : tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setViewTransaction(tx)}
                        data-testid={`button-view-tx-${tx.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {tx.status === "completed" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setConfirmRefundId(tx.id)}
                          disabled={refundMutation.isPending}
                          data-testid={`button-refund-tx-${tx.id}`}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table></div>
      </CardContent>
    </Card>
    <ConfirmDialog
      open={confirmRefundId !== null}
      onOpenChange={(open) => { if (!open) setConfirmRefundId(null); }}
      title={t("tranzaksiyaniQaytarish")}
      description={t("ushbuTranzaksiyaniQaytarishniTasdiqlaysizmi")}
      confirmText="Qaytarish"
      cancelText="Bekor qilish"
      variant="destructive"
      onConfirm={() => { if (confirmRefundId !== null) refundMutation.mutate(confirmRefundId); }}
    />
    </>
  );
}
