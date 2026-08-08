/**
 * @module FinanceDashboardTabsExtra
 * @description AccountsTab and ReportsTab components for FinanceDashboard.
 */

import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTranslation } from "@/lib/i18n";
import { formatDate, formatCurrency } from "@/lib/format";
import { FileText, TrendingUp, Plus } from "lucide-react";
import type { Account, TrialBalanceData, ProfitLossData } from "./FinanceDashboardTypes";
import { EPStatusPill } from "@/components/ep";

// ---------------------------------------------------------------------------
// AccountsTab
// ---------------------------------------------------------------------------

interface AccountsTabProps {
  accounts: Account[];
  onSeedAccounts: () => void;
  isSeedingAccounts: boolean;
}

export function AccountsTab({ accounts, onSeedAccounts, isSeedingAccounts }: AccountsTabProps) {
  const { t } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');

  return (
    <TabsContent value="accounts">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{t('chartOfAccounts')}</h2>
        {accounts.length === 0 && (
          <Button
            onClick={onSeedAccounts}
            disabled={isSeedingAccounts}
            data-testid="button-seed-accounts-tab"
          >
            <Plus className="h-4 w-4 mr-2" />
            {tCommon('create')}
          </Button>
        )}
      </div>

      <Card>
        <div className="ep-table-scroll"><Table data-testid="table-accounts">
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead>{t('accountCode')}</TableHead>
              <TableHead>{t('accountName')}</TableHead>
              <TableHead>{t('accountName')}</TableHead>
              <TableHead>{t('accountType')}</TableHead>
              <TableHead>{tCommon('status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {tCommon('noData')}
                </TableCell>
              </TableRow>
            ) : (
              (Array.isArray(accounts) ? accounts : []).map((account) => (
                <TableRow key={account.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono font-bold">{account.accountCode}</TableCell>
                  <TableCell>{account.accountName}</TableCell>
                  <TableCell className="text-muted-foreground">{account.accountNameRu}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      account.accountType === "asset" ? "bg-[var(--ep-blue-soft)] text-[var(--ep-blue)]" :
                      account.accountType === "liability" ? "bg-[var(--ep-red-soft)] text-[var(--ep-red)]" :
                      account.accountType === "equity" ? "bg-[var(--ep-purple-soft)] text-[var(--ep-purple)]" :
                      account.accountType === "revenue" ? "bg-[var(--ep-green-soft)] text-[var(--ep-green)]" :
                      "bg-[var(--ep-primary-soft)] text-[var(--ep-primary)]"
                    }>
                      {account.accountType === "asset" ? t('asset') :
                       account.accountType === "liability" ? t('liability') :
                       account.accountType === "equity" ? t('equity') :
                       account.accountType === "revenue" ? t('revenue') : t('expenses')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {account.isActive ? (
                      <EPStatusPill tone="success">{tCommon('active')}</EPStatusPill>
                    ) : (
                      <EPStatusPill tone="neutral">{tCommon('inactive')}</EPStatusPill>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table></div>
      </Card>
    </TabsContent>
  );
}

// ---------------------------------------------------------------------------
// ReportsTab
// ---------------------------------------------------------------------------

interface ReportsTabProps {
  trialBalance: TrialBalanceData | undefined;
  profitLoss: ProfitLossData | undefined;
}

export function ReportsTab({ trialBalance, profitLoss }: ReportsTabProps) {
  const { t } = useTranslation('finance');

  return (
    <TabsContent value="reports">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('balanceSheet')}
            </CardTitle>
            <CardDescription>
              {trialBalance?.asOfDate ? `${"Sana"}: ${formatDate(trialBalance.asOfDate)}` : "Barchasi"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(trialBalance?.accounts?.length ?? 0) > 0 ? (
              <div className="space-y-2 max-h-96 overflow-auto">
                {trialBalance?.accounts?.map((acc: { accountCode: string; accountName: string; debitBalance: number; creditBalance: number }, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm border-b pb-1">
                    <span className="font-mono">{acc.accountCode}</span>
                    <span className="flex-1 ml-2 truncate">{acc.accountName}</span>
                    <span className="text-[var(--ep-green)] w-24 text-right">{acc.debitBalance > 0 ? formatCurrency(acc.debitBalance) : "-"}</span>
                    <span className="text-[var(--ep-red)] w-24 text-right">{acc.creditBalance > 0 ? formatCurrency(acc.creditBalance) : "-"}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold pt-2 border-t-2">
                  <span>{"Jami"}</span>
                  <span className="text-[var(--ep-green)] w-24 text-right">{formatCurrency(trialBalance?.totals?.debitBalance || 0)}</span>
                  <span className="text-[var(--ep-red)] w-24 text-right">{formatCurrency(trialBalance?.totals?.creditBalance || 0)}</span>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">{"Ma'lumot topilmadi"}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('incomeStatement')}
            </CardTitle>
            <CardDescription>
              {profitLoss?.period ? `${formatDate(profitLoss.period.startDate)} - ${formatDate(profitLoss.period.endDate)}` : t('fiscalYear')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">{t('revenue')}</p>
                {(profitLoss?.revenues?.length ?? 0) > 0 ? (
                  profitLoss?.revenues?.map((rev: { accountName: string; amount: number }, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{rev.accountName}</span>
                      <span className="text-[var(--ep-green)]">{formatCurrency(rev.amount)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">-</p>
                )}
                <div className="flex justify-between font-medium pt-1 border-t mt-2">
                  <span>{t('revenue')}</span>
                  <span className="text-[var(--ep-green)]">{formatCurrency(profitLoss?.totalRevenue || 0)}</span>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">{t('expenses')}</p>
                {(profitLoss?.expenses?.length ?? 0) > 0 ? (
                  profitLoss?.expenses?.map((exp: { accountName: string; amount: number }, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{exp.accountName}</span>
                      <span className="text-[var(--ep-red)]">{formatCurrency(exp.amount)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">-</p>
                )}
                <div className="flex justify-between font-medium pt-1 border-t mt-2">
                  <span>{t('expenses')}</span>
                  <span className="text-[var(--ep-red)]">{formatCurrency(profitLoss?.totalExpense || 0)}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted">
                <div className="flex justify-between text-lg font-bold">
                  <span>{t('profit')}</span>
                  <span className={(profitLoss?.netProfit || 0) >= 0 ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}>
                    {formatCurrency(profitLoss?.netProfit || 0)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}
