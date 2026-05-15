/**
 * @module PapkaOrdersSections
 * @description Table and stats section components for PapkaOrders.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { PapkaOrder } from "@shared/schema";
import type { Lang } from "./PapkaOrdersTypes";
import { STATUS_CONFIG, TRANSLATIONS } from "./PapkaOrdersTypes";

// ---------------------------------------------------------------------------
// Stats row
// ---------------------------------------------------------------------------

interface StatsRowProps {
  totalCount: number;
  activeCount: number;
  completedCount: number;
  lang: Lang;
}

export function StatsRow({ totalCount, activeCount, completedCount, lang }: StatsRowProps) {
  const t = TRANSLATIONS[lang] as typeof TRANSLATIONS[Lang] & ((key: string) => string);
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-card rounded-lg p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.totalOrders}</p>
        <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{totalCount}</p>
      </div>
      <div className="bg-card rounded-lg p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.activeOrders}</p>
        <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{activeCount}</p>
      </div>
      <div className="bg-card rounded-lg p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.completedOrders}</p>
        <p className="text-4xl font-bold tracking-tight text-[var(--ep-green)] mt-1">{completedCount}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

export function StatusBadge({ status, lang }: { status: string; lang: Lang }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  return (
    <Badge className={`${config.className} rounded-full border-none px-2.5 py-0.5 text-xs font-semibold`}>
      {lang === "uz" ? config.label : config.labelRu}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Orders list section
// ---------------------------------------------------------------------------

interface OrdersListProps {
  orders: PapkaOrder[];
  lang: Lang;
  searchQuery: string;
  statusFilter: string;
  onSearchChange: (v: string) => void;
  onStatusFilterChange: (v: string) => void;
  onEdit: (order: PapkaOrder) => void;
  onDelete: (id: string) => void;
  isDeletePending: boolean;
}

export function OrdersList({
  orders, lang, searchQuery, statusFilter,
  onSearchChange, onStatusFilterChange, onEdit, onDelete, isDeletePending,
}: OrdersListProps) {
  const t = TRANSLATIONS[lang] as typeof TRANSLATIONS[Lang] & ((key: string) => string);
  return (
    <div className="bg-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("buyurtmalarRoyxati")}</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 w-64 bg-muted/40 border-border rounded-lg"
              data-testid="input-search"
            />
          </div>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-40 bg-muted/40 border-border rounded-lg h-9" data-testid="filter-status">
              <SelectValue placeholder={t.status} />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              <SelectItem value="all">{t.all}</SelectItem>
              <SelectItem value="new">{t.new}</SelectItem>
              <SelectItem value="planning">{t.planning}</SelectItem>
              <SelectItem value="production">{t.production}</SelectItem>
              <SelectItem value="completed">{t.completed}</SelectItem>
              <SelectItem value="cancelled">{t.cancelled}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        {orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground italic bg-transparent">
            {t.noOrders}
          </div>
        ) : (
          <div className="ep-table-scroll"><Table data-testid="table-papka-orders">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-none">
                {[t.papkaNo, t.product, t.client, t.tiraj, t.orderDate, t.deadline, t.status, t.actions].map((h) => (
                  <TableHead key={h} className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(orders) ? orders : []).map((order) => (
                <TableRow key={order.id} data-testid={`row-order-${order.id}`}
                  className="hover:bg-muted/40 transition-colors border-none group">
                  <TableCell className="py-4 px-6 font-mono text-xs font-bold text-primary border-none">{order.papkaNo}</TableCell>
                  <TableCell className="py-4 px-6 font-bold text-foreground border-none">{order.mahsulotNomi}</TableCell>
                  <TableCell className="py-4 px-6 text-sm text-foreground border-none">{order.mijozNomi}</TableCell>
                  <TableCell className="py-4 px-6 font-bold text-foreground border-none">{order.tiraj?.toLocaleString()}</TableCell>
                  <TableCell className="py-4 px-6 text-sm text-muted-foreground border-none">
                    {order.sana ? format(new Date(order.sana), "dd.MM.yyyy") : "-"}
                  </TableCell>
                  <TableCell className="py-4 px-6 text-sm text-muted-foreground border-none">
                    {order.tayyorBolishSanasi ? format(new Date(order.tayyorBolishSanasi), "dd.MM.yyyy") : "-"}
                  </TableCell>
                  <TableCell className="py-4 px-6 border-none">
                    <StatusBadge status={order.status || "new"} lang={lang} />
                  </TableCell>
                  <TableCell className="py-4 px-6 text-right border-none">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" onClick={() => onEdit(order)}
                        data-testid={`action-edit-${order.id}`}
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <DeleteConfirmDialog
                        title={t.cancelled}
                        description={t("buAmalniQaytaribBolmaydi")}
                        onConfirm={() => onDelete(order.id)}
                        isPending={isDeletePending}
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DeleteConfirmDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        )}
      </div>
    </div>
  );
}
