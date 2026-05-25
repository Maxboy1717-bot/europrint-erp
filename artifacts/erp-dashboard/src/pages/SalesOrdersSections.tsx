/**
 * @module SalesOrdersSections
 * @description Stats grid and orders table section components for the SalesOrders page.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { formatCurrency } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import type { SalesOrder } from "@shared/schema";
import type { CustomerRecord, SalesOrderStats } from "./SalesOrdersTypes";
import { getCustomerName } from "./SalesOrdersTypes";
import { EPStatusPill } from "@/components/ep";

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');

  switch (status) {
    case "IN_PROCESS":
      return <Badge className="bg-primary/10 text-primary rounded-full border-none px-3 text-xs font-semibold">{tCommon('inProgress')}</Badge>;
    case "COMPLETED":
      return <EPStatusPill tone="success">{tCommon('completed')}</EPStatusPill>;
    case "CANCELLED":
      return <EPStatusPill tone="danger">{tCommon('cancelled') || tCommon('deleted')}</EPStatusPill>;
    case "NOT_DELIVERED":
      return <Badge className="bg-amber-100 text-amber-800 rounded-full border-none px-3 text-xs font-semibold">{t('unpaid')}</Badge>;
    case "PARTIALLY_DELIVERED":
      return <Badge className="bg-amber-100 text-amber-800 rounded-full border-none px-3 text-xs font-semibold">{t('partiallyPaid')}</Badge>;
    case "FULLY_DELIVERED":
      return <EPStatusPill tone="success">{t('paid')}</EPStatusPill>;
    case "NOT_BILLED":
      return <Badge className="bg-amber-100 text-amber-800 rounded-full border-none px-3 text-xs font-semibold">{t('unpaid')}</Badge>;
    case "PARTIALLY_BILLED":
      return <Badge className="bg-amber-100 text-amber-800 rounded-full border-none px-3 text-xs font-semibold">{t('partiallyPaid')}</Badge>;
    case "FULLY_BILLED":
      return <EPStatusPill tone="success">{t('paid')}</EPStatusPill>;
    default:
      return <Badge className="bg-muted/60 text-muted-foreground rounded-full px-3 text-xs font-semibold border-none">{status}</Badge>;
  }
}

// ---------------------------------------------------------------------------
// Stats grid
// ---------------------------------------------------------------------------

interface SalesOrdersStatsGridProps {
  stats: SalesOrderStats;
}

export function SalesOrdersStatsGrid({ stats }: SalesOrdersStatsGridProps) {
  const { t } = useTranslation('finance');

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-card rounded-lg p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{"Jami"}</p>
        <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{stats.total}</p>
      </div>
      <div className="bg-card rounded-lg p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{"Jarayonda"}</p>
        <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{stats.inProcess}</p>
      </div>
      <div className="bg-card rounded-lg p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('paid')}</p>
        <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{stats.fullyDelivered}</p>
      </div>
      <div className="bg-card rounded-lg p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('calculated')}</p>
        <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{stats.fullyBilled}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Orders table
// ---------------------------------------------------------------------------

interface SalesOrdersTableProps {
  salesOrders: SalesOrder[];
  customers: CustomerRecord[];
  onEdit: (order: SalesOrder) => void;
  onDelete: (id: string) => void;
}

export function SalesOrdersTable({
  salesOrders,
  customers,
  onEdit,
  onDelete,
}: SalesOrdersTableProps) {
  const { t } = useTranslation('finance');

  return (
    <div className="bg-card rounded-xl p-6">
      <div className="rounded-md border overflow-hidden">
        <div className="ep-table-scroll"><Table data-testid="table-sales-orders">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t('documentNumber')}</TableHead>
              <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t('customerName') || "Nomi"}</TableHead>
              <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{"Sana"}</TableHead>
              <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t('amount')}</TableHead>
              <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{"Holat"}</TableHead>
              <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t('payment')}</TableHead>
              <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t('invoice')}</TableHead>
              <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right">{"Harakatlar"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salesOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground bg-transparent">
                  {"Ma'lumot topilmadi"}
                </TableCell>
              </TableRow>
            ) : (
              (Array.isArray(salesOrders) ? salesOrders : []).map((order) => (
                <TableRow
                  key={order.id}
                  data-testid={`row-sales-order-${order.id}`}
                  className="hover:bg-muted/40 transition-colors border-none"
                >
                  <TableCell className="py-4 px-6 font-medium border-none">{order.documentNumber || "-"}</TableCell>
                  <TableCell className="py-4 px-6 border-none">{getCustomerName(order.customerId, customers)}</TableCell>
                  <TableCell className="py-4 px-6 border-none">{order.orderDate}</TableCell>
                  <TableCell className="py-4 px-6 border-none font-bold">
                    {formatCurrency(order.totalValue, order.currency)}
                  </TableCell>
                  <TableCell className="py-4 px-6 border-none"><StatusBadge status={order.overallStatus} /></TableCell>
                  <TableCell className="py-4 px-6 border-none"><StatusBadge status={order.deliveryStatus} /></TableCell>
                  <TableCell className="py-4 px-6 border-none"><StatusBadge status={order.billingStatus} /></TableCell>
                  <TableCell className="py-4 px-6 text-right border-none">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(order)}
                        data-testid={`button-edit-${order.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <DeleteConfirmDialog
                        title={"Haqiqatan ham o'chirmoqchimisiz?"}
                        description={"Bu amalni qaytarib bo'lmaydi"}
                        onConfirm={() => onDelete(order.id)}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid={`button-delete-${order.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </DeleteConfirmDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table></div>
      </div>
    </div>
  );
}
