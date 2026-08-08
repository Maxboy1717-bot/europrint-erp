/**
 * @module AccountsPayableSections
 * @description Section UI components for AccountsPayable (KPI cards, aging table, overdue list).
 */

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Calendar, ArrowUpDown } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import type { ApAgingBucket, ApAgingData, OverduePayable, SortField } from "./AccountsPayableTypes";
import { calculateDaysOverdue } from "./AccountsPayableTypes";
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

interface ApKpiCardsProps {
  totals: ApAgingData["totals"];
}

export function ApKpiCards({ totals }: ApKpiCardsProps) {
  const { t } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');
  const overdue31to90 = totals.days31to60 + totals.days61to90;
  const overdue90Plus = totals.days91to120 + totals.over120;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="bg-card rounded-lg p-5" data-testid="card-total-ap">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('accountsPayable')}</p>
        <p className="text-4xl font-bold tracking-tight text-foreground mt-1" data-testid="text-total-ap">
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

      <div className="bg-card rounded-lg p-5" data-testid="card-due-31-90">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('overdue')} 31-90</p>
        <p className="text-4xl font-bold tracking-tight text-[var(--ep-yellow)] mt-1" data-testid="text-due-31-90">
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

interface ApAgingTableProps {
  sortedBuckets: ApAgingBucket[];
  totals: ApAgingData["totals"];
  onSort: (field: SortField) => void;
}

export function ApAgingTable({ sortedBuckets, totals, onSort }: ApAgingTableProps) {
  const { t } = useTranslation('finance');

  return (
    <div className="bg-card rounded-xl border border-[var(--ep-border)] p-6" data-testid="card-aging-table">
      <div className="flex flex-col gap-1 mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {t('accountsPayable')}
        </h3>
      </div>
      {sortedBuckets.length === 0 ? (
        <div className="text-center py-8 text-[13px] text-muted-foreground">{"Ma'lumot topilmadi"}</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => onSort("vendorName")} data-testid="th-vendor">
                  <div className="flex items-center gap-1">{t('vendor')}<ArrowUpDown className="h-3 w-3" /></div>
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
                <TableRow key={bucket.id} className="hover:bg-muted/40 transition-colors" data-testid={`row-vendor-${bucket.id}`}>
                  <TableCell className="font-medium py-3 px-6">{bucket.vendorName || bucket.vendorId}</TableCell>
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

// ─── Overdue Payables Table ────────────────────────────────────────────────────

interface ApOverdueTableProps {
  filteredOverdue: OverduePayable[];
  overdueFilter: string;
  onFilterChange: (v: string) => void;
}

export function ApOverdueTable({ filteredOverdue, overdueFilter, onFilterChange }: ApOverdueTableProps) {
  const { t } = useTranslation('finance');

  return (
    <div className="bg-card rounded-xl p-6" data-testid="card-overdue-payables">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {t('overdue')}
        </h3>
        <Select value={overdueFilter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px] h-9" data-testid="select-overdue-filter">
            <SelectValue placeholder={t('filter')} />
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
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6" data-testid="th-po-number">{t('documentNumber')}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6" data-testid="th-vendor-name">{t('vendor')}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right" data-testid="th-amount">{t('amount')}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6" data-testid="th-due-date">{t('dueDate')}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right" data-testid="th-days-overdue">{t('overdue')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(filteredOverdue) ? filteredOverdue : []).map((payable) => {
                const daysOverdue = calculateDaysOverdue(payable.dueDate);
                const outstandingAmount = payable.totalAmount - (payable.paidAmount || 0);
                return (
                  <TableRow key={payable.id} className="hover:bg-muted/40 transition-colors" data-testid={`row-payable-${payable.id}`}>
                    <TableCell className="font-medium py-3 px-6">{payable.poNumber}</TableCell>
                    <TableCell className="py-3 px-6">{payable.vendorName}</TableCell>
                    <TableCell className="text-right py-3 px-6">{formatCurrency(outstandingAmount)}</TableCell>
                    <TableCell className="py-3 px-6">{formatDate(payable.dueDate)}</TableCell>
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
