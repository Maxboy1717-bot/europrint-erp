/**
 * @module AccountsReceivableSections
 * @description Section UI components for AccountsReceivable (KPI cards, aging table, overdue list).
 */

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Calendar, ArrowUpDown } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import type { ArAgingBucket, ArAgingData, OverdueInvoice, SortField } from "./AccountsReceivableTypes";
import { calculateDaysOverdue } from "./AccountsReceivableTypes";
import { EPStatusPill } from "@/components/ep";

// ─── Badge helper ──────────────────────────────────────────────────────────────

function getDaysOverdueBadge(days: number) {
  if (days > 90) {
    return <EPStatusPill tone="danger">{days} kun</EPStatusPill>;
  } else if (days > 60) {
    return <EPStatusPill tone="warning">{days} kun</EPStatusPill>;
  } else if (days > 30) {
    return <EPStatusPill tone="warning">{days} kun</EPStatusPill>;
  }
  return <EPStatusPill tone="success">{days} kun</EPStatusPill>;
}

// ─── KPI Summary Cards ─────────────────────────────────────────────────────────

interface ArKpiCardsProps {
  totals: ArAgingData["totals"];
}

export function ArKpiCards({ totals }: ArKpiCardsProps) {
  const { t } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');
  const overdue31to90 = totals.days31to60 + totals.days61to90;
  const overdue90Plus = totals.days91to120 + totals.over120;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="bg-card rounded-lg p-5" data-testid="card-total-ar">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('accountsReceivable')}</p>
        <p className="text-4xl font-bold tracking-tight text-foreground mt-1" data-testid="text-total-ar">
          {formatCurrency(totals.totalOutstanding)}
        </p>
        <p className="text-xs text-muted-foreground mt-2">{tCommon('total')}</p>
      </div>

      <div className="bg-card rounded-lg p-5" data-testid="card-current">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('currentPeriod')}</p>
        <p className="text-4xl font-bold tracking-tight text-[var(--ep-green)] mt-1" data-testid="text-current">
          {formatCurrency(totals.current)}
        </p>
        <p className="text-xs text-muted-foreground mt-2">{t('paid')}</p>
      </div>

      <div className="bg-card rounded-lg p-5" data-testid="card-overdue-31-90">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('overdue')} 31-90</p>
        <p className="text-4xl font-bold tracking-tight text-[var(--ep-yellow)] mt-1" data-testid="text-overdue-31-90">
          {formatCurrency(overdue31to90)}
        </p>
        <p className="text-xs text-muted-foreground mt-2">{t('overdue')}</p>
      </div>

      <div className="bg-card rounded-lg p-5" data-testid="card-overdue-90-plus">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('overdue')} 90+</p>
        <p className="text-4xl font-bold tracking-tight text-[var(--ep-red)] mt-1" data-testid="text-overdue-90-plus">
          {formatCurrency(overdue90Plus)}
        </p>
        <p className="text-xs text-muted-foreground mt-2">{t('overdue')}</p>
      </div>
    </div>
  );
}

// ─── Aging Table ───────────────────────────────────────────────────────────────

interface ArAgingTableProps {
  sortedBuckets: ArAgingBucket[];
  totals: ArAgingData["totals"];
  onSort: (field: SortField) => void;
}

export function ArAgingTable({ sortedBuckets, totals, onSort }: ArAgingTableProps) {
  const { t } = useTranslation('finance');

  return (
    <div className="bg-card rounded-xl p-6" data-testid="card-aging-table">
      <div className="flex flex-col gap-1 mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          {t('accountsReceivable')}
        </h3>
      </div>
      {sortedBuckets.length === 0 ? (
        <div className="text-center py-8 text-[13px] text-muted-foreground">{"Ma'lumot topilmadi"}</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => onSort("customerId")} data-testid="th-customer">
                  <div className="flex items-center gap-1">{t('customer')}<ArrowUpDown className="h-3 w-3" /></div>
                </TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => onSort("current")} data-testid="th-current">
                  <div className="flex items-center justify-end gap-1">{t('currentPeriod')}<ArrowUpDown className="h-3 w-3" /></div>
                </TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => onSort("days31to60")} data-testid="th-31-60">
                  <div className="flex items-center justify-end gap-1"><span className="text-[var(--ep-yellow)]">31-60</span><ArrowUpDown className="h-3 w-3" /></div>
                </TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => onSort("days61to90")} data-testid="th-61-90">
                  <div className="flex items-center justify-end gap-1"><span className="text-[var(--ep-primary)]">61-90</span><ArrowUpDown className="h-3 w-3" /></div>
                </TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => onSort("days91to120")} data-testid="th-91-120">
                  <div className="flex items-center justify-end gap-1"><span className="text-[var(--ep-red)]">91-120</span><ArrowUpDown className="h-3 w-3" /></div>
                </TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => onSort("over120")} data-testid="th-over-120">
                  <div className="flex items-center justify-end gap-1"><span className="text-[var(--ep-red)]">120+</span><ArrowUpDown className="h-3 w-3" /></div>
                </TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => onSort("totalOutstanding")} data-testid="th-total">
                  <div className="flex items-center justify-end gap-1">{"Jami"}<ArrowUpDown className="h-3 w-3" /></div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(sortedBuckets) ? sortedBuckets : []).map((bucket) => (
                <TableRow key={bucket.id} className="hover:bg-muted/40 transition-colors" data-testid={`row-customer-${bucket.id}`}>
                  <TableCell className="font-medium py-3 px-6">{bucket.customerId}</TableCell>
                  <TableCell className="text-right py-3 px-6">{formatCurrency(bucket.current)}</TableCell>
                  <TableCell className="text-right text-[var(--ep-yellow)] py-3 px-6">{formatCurrency(bucket.days31to60)}</TableCell>
                  <TableCell className="text-right text-[var(--ep-primary)] py-3 px-6">{formatCurrency(bucket.days61to90)}</TableCell>
                  <TableCell className="text-right text-[var(--ep-red)] py-3 px-6">{formatCurrency(bucket.days91to120)}</TableCell>
                  <TableCell className="text-right text-[var(--ep-red)] font-medium py-3 px-6">{formatCurrency(bucket.over120)}</TableCell>
                  <TableCell className="text-right font-bold py-3 px-6">{formatCurrency(bucket.totalOutstanding)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/40 font-bold hover:bg-muted/40 transition-colors">
                <TableCell className="py-3 px-6">{"Jami"}</TableCell>
                <TableCell className="text-right py-3 px-6">{formatCurrency(totals.current)}</TableCell>
                <TableCell className="text-right text-[var(--ep-yellow)] py-3 px-6">{formatCurrency(totals.days31to60)}</TableCell>
                <TableCell className="text-right text-[var(--ep-primary)] py-3 px-6">{formatCurrency(totals.days61to90)}</TableCell>
                <TableCell className="text-right text-[var(--ep-red)] py-3 px-6">{formatCurrency(totals.days91to120)}</TableCell>
                <TableCell className="text-right text-[var(--ep-red)] py-3 px-6">{formatCurrency(totals.over120)}</TableCell>
                <TableCell className="text-right py-3 px-6">{formatCurrency(totals.totalOutstanding)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── Overdue Invoices Table ────────────────────────────────────────────────────

interface ArOverdueTableProps {
  filteredOverdue: OverdueInvoice[];
  overdueFilter: string;
  onFilterChange: (v: string) => void;
}

export function ArOverdueTable({ filteredOverdue, overdueFilter, onFilterChange }: ArOverdueTableProps) {
  const { t } = useTranslation('finance');

  return (
    <div className="bg-card rounded-xl p-6" data-testid="card-overdue-invoices">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {t('overdue')}
        </h3>
        <Select value={overdueFilter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px] h-9" data-testid="select-overdue-filter">
            <SelectValue placeholder={t('filter1')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{"Barchasi"}</SelectItem>
            <SelectItem value="30+">30+</SelectItem>
            <SelectItem value="60+">60+</SelectItem>
            <SelectItem value="90+">90+</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {filteredOverdue.length === 0 ? (
        <div className="text-center py-8 text-[13px] text-muted-foreground">{"Ma'lumot topilmadi"}</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6" data-testid="th-invoice-number">{t('invoiceNumber')}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6" data-testid="th-invoice-customer">{t('customer')}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right" data-testid="th-invoice-amount">{t('amount')}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6" data-testid="th-invoice-due-date">{t('dueDate')}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right" data-testid="th-invoice-days-overdue">{t('overdue')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(filteredOverdue) ? filteredOverdue : []).map((invoice) => {
                const daysOverdue = calculateDaysOverdue(invoice.dueDate);
                const outstandingAmount = invoice.totalAmount - (invoice.paidAmount || 0);
                return (
                  <TableRow key={invoice.id} className="hover:bg-muted/40 transition-colors" data-testid={`row-invoice-${invoice.id}`}>
                    <TableCell className="font-medium py-3 px-6">{invoice.invoiceNumber}</TableCell>
                    <TableCell className="py-3 px-6">{invoice.customerName}</TableCell>
                    <TableCell className="text-right py-3 px-6">{formatCurrency(outstandingAmount)}</TableCell>
                    <TableCell className="py-3 px-6">{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell className="text-right py-3 px-6">{getDaysOverdueBadge(daysOverdue)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
