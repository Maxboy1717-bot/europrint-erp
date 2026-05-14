/**
 * @module TransactionTable
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
import { ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { FinanceCategory, IncomeExpenseTransaction } from "./types";

interface TransactionTableProps {
  transactions: IncomeExpenseTransaction[];
  categories: FinanceCategory[];
  loading: boolean;
}

export function TransactionTable({
  transactions,
  categories,
  loading,
}: TransactionTableProps) {
  const { t } = useTranslation("finance");
  const { t: tCommon } = useTranslation('common');

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "-";
    const category = (Array.isArray(categories) ? categories : []).find((c) => c.id === categoryId);
    return category?.name || "-";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40"
          >
            {t("draft")}
          </Badge>
        );
      case "posted":
        return (
          <Badge
            variant="outline"
            className="bg-green-500/20 text-green-400 border-green-500/40"
          >
            {t("approved")}
          </Badge>
        );
      case "cancelled":
        return (
          <Badge
            variant="outline"
            className="bg-red-500/20 text-red-400 border-red-500/40"
          >
            {tCommon("cancelled")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (transactions.length === 0 && !loading) {
    return (
      <div className="text-center py-8 text-[13px] text-muted-foreground">
        <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>{tCommon("noData")}</p>
      </div>
    );
  }

  return (
    <div className="ep-table-scroll"><Table data-testid="table-transactions">
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>{tCommon("date")}</TableHead>
          <TableHead>{tCommon("type")}</TableHead>
          <TableHead>{t("category")}</TableHead>
          <TableHead>{t("customer")}</TableHead>
          <TableHead className="text-right">{t("amount")}</TableHead>
          <TableHead>{tCommon("status")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(Array.isArray(transactions) ? transactions : []).map((tx, index) => (
          <TableRow
            key={tx.id}
            className={index % 2 === 0 ? "bg-muted/30" : ""}
            data-testid={`row-transaction-${tx.id}`}
          >
            <TableCell className="font-mono text-sm">
              {tx.transactionNumber}
            </TableCell>
            <TableCell>{formatDate(tx.transactionDate)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {tx.transactionType === "income" ? (
                  <ArrowUpCircle className="h-4 w-4 text-[var(--ep-green)]" />
                ) : (
                  <ArrowDownCircle className="h-4 w-4 text-[var(--ep-red)]" />
                )}
                <span>
                  {tx.transactionType === "income" ? t("inflow") : t("outflow")}
                </span>
              </div>
            </TableCell>
            <TableCell>{getCategoryName(tx.categoryId)}</TableCell>
            <TableCell>{tx.counterpartyName || "-"}</TableCell>
            <TableCell
              className={`text-right font-medium ${
                tx.transactionType === "income" ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"
              }`}
            >
              {tx.transactionType === "income" ? "+" : "-"}
              {formatCurrency(tx.amount)}
            </TableCell>
            <TableCell>{getStatusBadge(tx.status)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table></div>
  );
}
