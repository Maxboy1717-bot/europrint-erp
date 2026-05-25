/**
 * @module ReceivingList
 * @description React UI component.
 */

import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { GoodsReceipt, STATUS_COLORS } from "./types";
import { useGoodsReceivingTranslations } from "./useGoodsReceivingTranslations";

interface ReceivingListProps {
  receipts: GoodsReceipt[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  dateFrom: string;
  setDateFrom: (date: string) => void;
  dateTo: string;
  setDateTo: (date: string) => void;
  onViewDetail: (receipt: GoodsReceipt) => void;
}

export function ReceivingList({
  receipts = [],
  isLoading,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  onViewDetail,
}: ReceivingListProps) {
  const t = useGoodsReceivingTranslations();
  const safeReceipts = Array.isArray(receipts) ? receipts : [];

  return (
    <div className="bg-card rounded-xl p-6">
      <div className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-9" data-testid="select-status-filter">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t.allStatuses} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allStatuses}</SelectItem>
              <SelectItem value="draft">{t.statuses.draft}</SelectItem>
              <SelectItem value="pending_qc">{t.statuses.pending_qc}</SelectItem>
              <SelectItem value="qc_passed">{t.statuses.qc_passed}</SelectItem>
              <SelectItem value="qc_failed">{t.statuses.qc_failed}</SelectItem>
              <SelectItem value="received">{t.statuses.received}</SelectItem>
              <SelectItem value="cancelled">{t.statuses.cancelled}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full sm:w-[150px]"
            data-testid="input-date-from"
          />
          <span className="text-muted-foreground">—</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full sm:w-[150px]"
            data-testid="input-date-to"
          />
        </div>
      </div>
      <div>
        {isLoading ? (
          <div className="space-y-2">
            {([...Array(5)]).map((_, i) => (
              <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t.receiptNumber}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t.date}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t.supplier}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t.warehouse}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-center">{t.items}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right">{t.value}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t.status}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeReceipts.map((receipt) => (
                <TableRow key={receipt.id} data-testid={`row-receipt-${receipt.id}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">{receipt.receiptNumber}</TableCell>
                  <TableCell>{receipt.receiptDate}</TableCell>
                  <TableCell className={receipt.status === 'KIRIM' ? 'border-l-4 border-green-500' : receipt.status === 'CHIQIM' ? 'border-l-4 border-error' : ''}>{receipt.supplierName || "—"}</TableCell>
                  <TableCell>{receipt.warehouseName || "—"}</TableCell>
                  <TableCell className="text-center">{receipt.totalItems}</TableCell>
                  <TableCell className="text-right">
                    {Number(receipt.totalValue || 0).toLocaleString()} UZS
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[receipt.status] || ""}>
                      {t.statuses[receipt.status as keyof typeof t.statuses] || receipt.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewDetail(receipt)}
                      data-testid={`button-view-${receipt.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {safeReceipts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    {t.noDataFound}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table></div>
        )}
      </div>
    </div>
  );
}
