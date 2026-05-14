/** @module BudgetManagementSections @description Section/panel components: detail stat cards, budget lines table, variance chart, list stat cards, list filter+table. Receives all data and callbacks as props. */

import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Eye } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getStatusBadge, getVarianceColor, periodTypeLabels, statusLabels, type Budget, type BudgetDetail, type VarianceData } from "./BudgetManagementTypes";

// ---------------------------------------------------------------------------
// Detail view: four summary stat cards
// ---------------------------------------------------------------------------

interface DetailStatsProps {
  budgetDetail: BudgetDetail;
  varianceData: VarianceData | undefined;
}

export function DetailStats({ budgetDetail, varianceData }: DetailStatsProps) {
  const { t } = useTranslation("finance");
  const totalVariance = varianceData?.summary?.totalVariance ?? 0;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <div className="bg-card rounded-lg p-5" data-testid="card-total-budget">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("budgetManagement")}</p>
        <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{formatCurrency(budgetDetail.totalAmount)}</p>
      </div>
      <div className="bg-card rounded-lg p-5" data-testid="card-planned">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("planned")}</p>
        <p className="text-4xl font-bold tracking-tight text-foreground mt-1">
          {formatCurrency(varianceData?.summary?.totalPlanned ?? 0)}
        </p>
      </div>
      <div className="bg-card rounded-lg p-5" data-testid="card-actual">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("actual")}</p>
        <p className="text-4xl font-bold tracking-tight text-foreground mt-1">
          {formatCurrency(varianceData?.summary?.totalActual ?? 0)}
        </p>
      </div>
      <div className="bg-card rounded-lg p-5" data-testid="card-variance">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("variance")}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <p className={`text-4xl font-bold tracking-tight ${getVarianceColor(totalVariance)}`}>
            {formatCurrency(Math.abs(totalVariance))}
          </p>
          <span className="text-xs text-muted-foreground font-medium">
            {totalVariance > 0 ? t("overBudget") : t("withinBudget")}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail view: budget lines table
// ---------------------------------------------------------------------------

interface BudgetLinesTableProps {
  budgetDetail: BudgetDetail;
  detailLoading: boolean;
}

export function BudgetLinesTable({ budgetDetail, detailLoading }: BudgetLinesTableProps) {
  const { t } = useTranslation("finance");

  return (
    <div className="overflow-x-auto">
      {detailLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />)}
        </div>
      ) : budgetDetail.lines.length === 0 ? (
        <div className="text-center py-8 text-[13px] text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{"Ma'lumot topilmadi"}</p>
          <p className="text-sm">{"Yaratish"}</p>
        </div>
      ) : (
        <div className="ep-table-scroll"><Table>
          <TableHeader>
            <TableRow className="bg-muted/60 border-none hover:bg-muted/60 transition-colors">
              <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("chartOfAccounts")}</TableHead>
              <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("costCenter")}</TableHead>
              <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right">{t("planned")}</TableHead>
              <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right">{t("actual")}</TableHead>
              <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right">{t("variance")}</TableHead>
              <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right">{t("variance")} %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(Array.isArray(budgetDetail.lines) ? budgetDetail.lines : []).map((line) => {
              const variance = (line.actualAmount || 0) - (line.plannedAmount || 0);
              const variancePct = line.plannedAmount > 0 ? (variance / line.plannedAmount) * 100 : 0;
              return (
                <TableRow key={line.id} data-testid={`budget-line-${line.id}`} className="hover:bg-muted/40 transition-colors border-none">
                  <TableCell className="py-3 px-6">
                    <div className="font-medium text-foreground">{line.accountCode || "-"}</div>
                    <div className="text-sm text-muted-foreground">{line.accountName || "-"}</div>
                  </TableCell>
                  <TableCell className="py-3 px-6 text-foreground">{line.costCenterName || "-"}</TableCell>
                  <TableCell className="py-3 px-6 text-right font-medium text-foreground">{formatCurrency(line.plannedAmount)}</TableCell>
                  <TableCell className="py-3 px-6 text-right text-foreground">{formatCurrency(line.actualAmount)}</TableCell>
                  <TableCell className={`py-3 px-6 text-right font-medium ${getVarianceColor(variance)}`}>
                    {variance > 0 ? "+" : ""}{formatCurrency(variance)}
                  </TableCell>
                  <TableCell className={`py-3 px-6 text-right ${getVarianceColor(variancePct)}`}>
                    {variancePct.toFixed(1)}%
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table></div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail view: variance bar chart
// ---------------------------------------------------------------------------

interface VarianceChartProps {
  varianceData: VarianceData;
}

export function VarianceChart({ varianceData }: VarianceChartProps) {
  const { t } = useTranslation("finance");
  if (!varianceData.byCategory || varianceData.byCategory.length === 0) return null;

  return (
    <div className="bg-card rounded-xl p-6" data-testid="card-variance-chart">
      <h2 className="text-xl font-semibold text-foreground mb-6">{t("variance")}</h2>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={varianceData.byCategory}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--outline-variant))" />
            <XAxis dataKey="category" tick={{ fill: "hsl(var(--on-surface-variant))" }} />
            <YAxis tickFormatter={(v) => formatCurrency(v).replace(" UZS", "")} tick={{ fill: "hsl(var(--on-surface-variant))" }} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--surface-container-lowest))", borderColor: "hsl(var(--outline-variant))", color: "hsl(var(--on-surface))" }}
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) => `Kategoriya: ${label}`}
            />
            <Legend />
            <Bar dataKey="planned" name={t("planned")} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="actual" name={t("actual")} fill="hsl(145, 65%, 50%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// List view: five stat count cards
// ---------------------------------------------------------------------------

interface ListStatsProps {
  stats: { total: number; draft: number; approved: number; active: number; closed: number };
}

export function ListStats({ stats }: ListStatsProps) {
  const { t: tCommon } = useTranslation("common");

  return (
    <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-5 mb-8">
      <div className="bg-card rounded-lg p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{tCommon("total")}</p>
        <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{stats.total}</p>
      </div>
      {(["draft", "approved", "active", "closed"] as const).map((key) => (
        <div key={key} className="bg-card rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{statusLabels[key]}</p>
          <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{stats[key]}</p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// List view: filter bar + budgets table
// ---------------------------------------------------------------------------

interface BudgetListTableProps {
  budgets: Budget[];
  budgetsLoading: boolean;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  filterYear: string;
  setFilterYear: (v: string) => void;
  currentYear: number;
  onSelectBudget: (id: string) => void;
}

export function BudgetListTable({
  budgets,
  budgetsLoading,
  filterStatus,
  setFilterStatus,
  filterYear,
  setFilterYear,
  currentYear,
  onSelectBudget,
}: BudgetListTableProps) {
  const { t } = useTranslation("finance");

  return (
    <div className="bg-card rounded-xl p-6">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-48">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="bg-background border-border text-foreground h-9">
              <SelectValue placeholder={"Holat"} />
            </SelectTrigger>
            <SelectContent className="bg-card border-none">
              <SelectItem value="all">{"Barchasi"}</SelectItem>
              {(["draft", "approved", "active", "closed"] as const).map((s) => (
                <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-48">
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="bg-background border-border text-foreground h-9" data-testid="select-filter-year">
              <SelectValue placeholder="Yil" />
            </SelectTrigger>
            <SelectContent className="bg-card border-none">
              <SelectItem value="all">{"Barchasi"}</SelectItem>
              {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="overflow-x-auto">
        {budgetsLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{"Ma'lumot topilmadi"}</p>
          </div>
        ) : (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow className="bg-muted/60 border-none hover:bg-muted/60 transition-colors">
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{"Nomi"}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("fiscalYear")}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("periodType")}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right">{t("totalAmount")}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{"Holat"}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right">{"Harakatlar"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(budgets) ? budgets : []).map((budget) => (
                <TableRow
                  key={budget.id}
                  className="hover:bg-muted/40 transition-colors border-none cursor-pointer"
                  onClick={() => onSelectBudget(budget.id)}
                  data-testid={`budget-row-${budget.id}`}
                >
                  <TableCell className="py-3 px-6 font-medium text-foreground">{budget.budgetName}</TableCell>
                  <TableCell className="py-3 px-6 text-foreground">{budget.fiscalYear}</TableCell>
                  <TableCell className="py-3 px-6 text-foreground">{periodTypeLabels[budget.periodType]}</TableCell>
                  <TableCell className="py-3 px-6 text-right font-medium text-foreground">{formatCurrency(budget.totalAmount)}</TableCell>
                  <TableCell className="py-3 px-6">{getStatusBadge(budget.status)}</TableCell>
                  <TableCell className="py-3 px-6 text-right">
                    <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                      <Eye className="h-4 w-4" />
                    </Button>
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
