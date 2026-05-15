/**
 * @module WarehouseRentalTable
 * @description `RecordsTable` component for the Warehouse Rental feature.
 * Renders the status-filter pill row and the paginated data table of rental
 * records, with inline close/paid action buttons per row.
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarDays, Clock, Warehouse } from "lucide-react";
import {
  formatMoney,
  STATUS_FILTER_OPTIONS,
  type RentalRecord,
} from "./WarehouseRentalTypes";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ─── Status Badge ─────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  const { t } = useTranslation("common");
  if (status === "active")
    return (
      <EPStatusPill tone="info">
        {t("aktiv")}
      </EPStatusPill>
    );
  if (status === "closed")
    return (
      <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">
        {t("yopildi")}
      </Badge>
    );
  return (
    <EPStatusPill tone="success">
      {t("tolangan")}
    </EPStatusPill>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface RecordsTableProps {
  records: RentalRecord[];
  isLoading: boolean;
  statusFilter: string;
  onStatusFilter: (s: string) => void;
  onClose: (id: string) => void;
  onPaid: (id: string) => void;
  closePending: boolean;
  paidPending: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RecordsTable({
  records,
  isLoading,
  statusFilter,
  onStatusFilter,
  onClose,
  onPaid,
  closePending,
  paidPending,
}: RecordsTableProps) {
  const { t } = useTranslation("common");
  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_FILTER_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={statusFilter === opt.value ? "default" : "outline"}
            size="sm"
            onClick={() => onStatusFilter(opt.value)}
            data-testid={`filter-${opt.value || "all"}`}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`k-${i}`} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-md">
          <Warehouse className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p>{t("haliIjaraYozuviYoqYangi")}</p>
        </div>
      ) : (
        <div className="border rounded-md overflow-auto">
          <div className="ep-table-scroll"><Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead>{t("raqam")}</TableHead>
                <TableHead>{t("Mahsulot")}</TableHead>
                <TableHead>Mijoz / Menejer</TableHead>
                <TableHead>Maydon (m²)</TableHead>
                <TableHead>{t("qabulSanasi2")}</TableHead>
                <TableHead>{t("jamiKun")}</TableHead>
                <TableHead>{t("pullikKun")}</TableHead>
                <TableHead className="text-right">{t("summa")}</TableHead>
                <TableHead>{t("status28")}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(records) ? records : []).map((r) => (
                <TableRow key={r.id} data-testid={`row-rental-${r.id}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-xs">{r.recordNumber}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{r.productName}</div>
                    {r.orderNumber && (
                      <div className="text-xs text-muted-foreground">{r.orderNumber}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{r.customerName || "—"}</div>
                    <div className="text-xs text-muted-foreground">{r.managerName || "—"}</div>
                  </TableCell>
                  <TableCell data-testid={`text-area-${r.id}`}>
                    {Number(r.areaM2).toFixed(1)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <CalendarDays className="h-3 w-3 text-muted-foreground" />
                      {r.admittedDate}
                    </div>
                    <div className="text-xs text-muted-foreground">{r.freeDays} kun bepul</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span data-testid={`text-total-days-${r.id}`}>{r.totalDays}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      data-testid={`text-billable-days-${r.id}`}
                      className={
                        Number(r.billableDays) > 0
                          ? "text-[var(--ep-primary)] font-semibold dark:text-orange-400"
                          : "text-muted-foreground"
                      }
                    >
                      {r.billableDays}
                    </span>
                  </TableCell>
                  <TableCell
                    className="text-right font-semibold"
                    data-testid={`text-amount-${r.id}`}
                  >
                    {Number(r.billableDays) > 0 ? (
                      <span className="text-[var(--ep-primary)] dark:text-orange-400">
                        {formatMoney(Number(r.totalAmount))}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{t("bepul")}</span>
                    )}
                  </TableCell>
                  <TableCell>{statusBadge(r.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {r.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onClose(r.id)}
                          disabled={closePending}
                          data-testid={`button-close-${r.id}`}
                        >
                          {t("close2")}
                        </Button>
                      )}
                      {r.status === "closed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onPaid(r.id)}
                          disabled={paidPending}
                          data-testid={`button-paid-${r.id}`}
                        >
                          {t("tolandi1")}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </div>
      )}
    </>
  );
}
