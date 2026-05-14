/**
 * @module CashFlowManagementSections
 * @description Section components for CashFlowManagement page.
 */

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import type { DailySummary, CashForecast, CashPositionData, CashFlowTransaction } from "./CashFlowManagementTypes";
import { formatShortCurrency, categoryLabels, typeLabels } from "./CashFlowManagementTypes";
import { useTranslation } from "@/lib/i18n";

interface SummaryCardsProps {
  todaySummary: { inflow: number; outflow: number; netFlow: number };
  forecast: CashForecast | undefined;
  summaryLoading: boolean;
  forecastLoading: boolean;
  t: (key: string) => string;
}

export function SummaryCards({ todaySummary, forecast, summaryLoading, forecastLoading, t }: SummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="bg-card rounded-lg p-5" data-testid="card-today-inflows">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('inflow')}</p>
        {summaryLoading ? <Skeleton className="h-10 w-32 mt-1 rounded-lg" /> : (
          <p className="text-4xl font-bold tracking-tight text-[var(--ep-green)] mt-1">{formatCurrency(todaySummary.inflow)}</p>
        )}
      </div>
      <div className="bg-card rounded-lg p-5" data-testid="card-today-outflows">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('outflow')}</p>
        {summaryLoading ? <Skeleton className="h-10 w-32 mt-1 rounded-lg" /> : (
          <p className="text-4xl font-bold tracking-tight text-[var(--ep-red)] mt-1">{formatCurrency(todaySummary.outflow)}</p>
        )}
      </div>
      <div className="bg-card rounded-lg p-5" data-testid="card-net-flow">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('netCashFlow')}</p>
        {summaryLoading ? <Skeleton className="h-10 w-32 mt-1 rounded-lg" /> : (
          <p className={`text-4xl font-bold tracking-tight mt-1 ${todaySummary.netFlow >= 0 ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}`}>
            {todaySummary.netFlow >= 0 ? "+" : ""}{formatCurrency(todaySummary.netFlow)}
          </p>
        )}
      </div>
      <div className="bg-card rounded-lg p-5" data-testid="card-current-balance">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('currentBalance')}</p>
        {forecastLoading ? <Skeleton className="h-10 w-32 mt-1 rounded-lg" /> : (
          <p className="text-4xl font-bold tracking-tight text-primary mt-1">{formatCurrency(forecast?.currentBalance || 0)}</p>
        )}
      </div>
    </div>
  );
}

interface DailyChartProps {
  dailySummary: DailySummary[];
  summaryLoading: boolean;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

export function DailyChart({ dailySummary, summaryLoading, t, tCommon }: DailyChartProps) {
  const chartData = (Array.isArray(dailySummary) ? dailySummary : []).slice(0, 30).reverse().map(s => ({
    date: s.date.substring(5),
    Kirim: s.inflow,
    Chiqim: s.outflow,
  }));

  return (
    <div className="bg-card rounded-xl p-6 lg:col-span-2" data-testid="card-daily-chart">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">{t('cashFlowManagement')}</h2>
        <p className="text-sm text-muted-foreground">{t('inflow')} / {t('outflow')}</p>
      </div>
      {summaryLoading ? (
        <Skeleton className="h-[300px] w-full rounded-lg" />
      ) : chartData.length > 0 ? (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--outline-variant))" />
              <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--on-surface-variant))' }} />
              <YAxis
                className="text-xs"
                tick={{ fill: 'hsl(var(--on-surface-variant))' }}
                tickFormatter={(value) => formatShortCurrency(value)}
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--surface-container-lowest))', borderColor: 'hsl(var(--outline-variant))', color: 'hsl(var(--on-surface))' }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Bar dataKey="Kirim" fill="hsl(145, 65%, 50%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Chiqim" fill="hsl(0, 70%, 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          {tCommon('noData')}
        </div>
      )}
    </div>
  );
}

interface BankAccountsCardProps {
  cashPosition: CashPositionData | undefined;
  cashPositionLoading: boolean;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

export function BankAccountsCard({ cashPosition, cashPositionLoading, t, tCommon }: BankAccountsCardProps) {
  return (
    <div className="bg-card rounded-xl p-6" data-testid="card-bank-accounts">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">{t('bankAccount')}</h2>
        <p className="text-sm text-muted-foreground">{t('currentBalance')}</p>
      </div>
      {cashPositionLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      ) : cashPosition?.accounts && cashPosition.accounts.length > 0 ? (
        <div className="space-y-3">
          {(Array.isArray(cashPosition.accounts) ? cashPosition.accounts : []).map((account) => (
            <div key={account.id} className="flex items-center justify-between p-3 bg-muted/60 rounded-lg">
              <div>
                <p className="font-medium text-sm text-foreground">{account.bankName}</p>
                <p className="text-xs text-muted-foreground">{account.accountNumber}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm text-foreground">{formatShortCurrency(account.balance)}</p>
                <Badge className="bg-primary/10 text-primary rounded-full px-2 py-0 text-[10px] font-semibold">{account.currency}</Badge>
              </div>
            </div>
          ))}
          <div className="pt-3 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{tCommon('total')}:</span>
              <span className="font-bold text-foreground">{formatCurrency(cashPosition.summary.totalBalance)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-[13px] text-muted-foreground">{tCommon('noData')}</div>
      )}
    </div>
  );
}

interface TransactionsTableProps {
  transactions: CashFlowTransaction[];
  transactionsLoading: boolean;
  filterType: string;
  setFilterType: (v: string) => void;
  filterCategory: string;
  setFilterCategory: (v: string) => void;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

export function TransactionsTable({
  transactions, transactionsLoading, filterType, setFilterType,
  filterCategory, setFilterCategory, t, tCommon,
}: TransactionsTableProps) {
  return (
    <div className="bg-card rounded-xl p-6">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="bg-background border-border text-foreground w-full sm:w-[180px] h-9">
            <SelectValue placeholder={tCommon('type')} />
          </SelectTrigger>
          <SelectContent className="bg-card border-none">
            <SelectItem value="all">{tCommon('all')}</SelectItem>
            <SelectItem value="inflow">{t('inflow')}</SelectItem>
            <SelectItem value="outflow">{t('outflow')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="bg-background border-border text-foreground w-full sm:w-[180px] h-9">
            <SelectValue placeholder={t('category')} />
          </SelectTrigger>
          <SelectContent className="bg-card border-none">
            <SelectItem value="all">{tCommon('all')}</SelectItem>
            {Object.entries(categoryLabels).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-x-auto">
        {transactionsLoading ? (
          <div className="space-y-2">
            {([...Array(5)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{tCommon('noData')}</p>
          </div>
        ) : (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow className="bg-muted/60 border-none hover:bg-muted/60 transition-colors">
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{tCommon('date')}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{tCommon('type')}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t('category')}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right">{t('amount')}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{tCommon('description')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(transactions) ? transactions : []).map((tx) => (
                <TableRow key={tx.id} className="hover:bg-muted/40 transition-colors border-none">
                  <TableCell className="py-3 px-6 text-foreground">{tx.transactionDate}</TableCell>
                  <TableCell className="py-3 px-6">
                    <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tx.transactionType === "inflow" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {typeLabels[tx.transactionType as keyof typeof typeLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 px-6 text-foreground">{categoryLabels[tx.category as keyof typeof categoryLabels] || tx.category}</TableCell>
                  <TableCell className={`py-3 px-6 text-right font-medium ${tx.transactionType === "inflow" ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}`}>
                    {tx.transactionType === "inflow" ? "+" : "-"}{formatCurrency(tx.amount)}
                  </TableCell>
                  <TableCell className="py-3 px-6 text-muted-foreground truncate max-w-[200px]">{tx.description || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        )}
      </div>
    </div>
  );
}
