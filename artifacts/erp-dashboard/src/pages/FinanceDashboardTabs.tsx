/**
 * @module FinanceDashboardTabs
 * @description DashboardOverviewTab component for FinanceDashboard.
 */

import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { Plus, Banknote, AlertCircle } from "lucide-react";
import type { DashboardStats, FpCycleData } from "./FinanceDashboardTypes";

// ---------------------------------------------------------------------------
// DashboardOverviewTab
// ---------------------------------------------------------------------------

interface DashboardOverviewTabProps {
  dashboard: DashboardStats | undefined;
  fpCycle: FpCycleData | undefined;
  sysSettings: { inpsRate?: number; minWage?: number; qqsRate?: number } | undefined;
  onSeedAccounts: () => void;
  isSeedingAccounts: boolean;
}

export function DashboardOverviewTab({
  dashboard,
  fpCycle,
  sysSettings,
  onSeedAccounts,
  isSeedingAccounts,
}: DashboardOverviewTabProps) {
  const { t } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');

  return (
    <TabsContent value="dashboard">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-card rounded-lg p-5" data-testid="card-payroll-stats">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('fiscalPeriod')}</p>
          <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{dashboard?.payroll?.totalPeriods || 0}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {dashboard?.payroll?.openPeriods || 0} {t('periodOpen')}, {dashboard?.payroll?.closedPeriods || 0} {t('periodClosed')}
          </p>
        </div>

        <div className="bg-card rounded-lg p-5" data-testid="card-total-paid">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('paid')}</p>
          <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{formatCurrency(dashboard?.payroll?.totalPaid || 0)}</p>
          <p className="text-xs text-muted-foreground mt-2">{t('periodClosed')}</p>
        </div>

        <div className="bg-card rounded-lg p-5" data-testid="card-receivables">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('accountsReceivable')}</p>
          <p className="text-4xl font-bold tracking-tight text-[var(--ep-green)] mt-1">{formatCurrency(dashboard?.receivables || 0)}</p>
          <p className="text-xs text-muted-foreground mt-2">{t('unpaid')}</p>
        </div>

        <div className="bg-card rounded-lg p-5" data-testid="card-payables">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('accountsPayable')}</p>
          <p className="text-4xl font-bold tracking-tight text-[var(--ep-red)] mt-1">{formatCurrency(dashboard?.payables || 0)}</p>
          <p className="text-xs text-muted-foreground mt-2">{t('unpaid')}</p>
        </div>
      </div>

      {/* ZvsWidget — FP Tsikl Progress */}
      <div className="bg-card rounded-xl p-5 mb-6" data-testid="zvs-widget">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Banknote className="w-4 h-4 text-primary" />
              ФП Tsikl — Haftalik Moliyaviy Reja
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hafta: {fpCycle?.weekStart || "—"} · Kutayotgan ЗВС: <span className="font-semibold text-[var(--ep-yellow)]">{fpCycle?.pending ?? 0}</span>
            </p>
          </div>
          <Link to="/coordination">
            <button className="text-xs text-primary underline underline-offset-2 hover:opacity-70 transition-opacity">
              {t("tasdiqlashNavbati")}
            </button>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {(fpCycle?.cycleDays ?? [
            { day: 2, label: "Seshanba",   event: "ЗВС — Рек.Совет",  color: "emerald" },
            { day: 3, label: "Chorshanba", event: "ФП — Moliyaviy reja", color: "blue" },
            { day: 4, label: "Payshanba",  event: "Bank to'lovlari",  color: "amber" },
            { day: 1, label: "Dushanba",   event: "Naqd to'lovlar",   color: "rose" },
          ]).map((step: { day: number; key?: string; label: string; labelRu?: string; event: string; color: string }) => {
            const isActive = fpCycle?.currentDay === step.day;
            const colorMap: Record<string, string> = {
              emerald: "border-[var(--ep-green)] bg-[var(--ep-green-soft)] text-[var(--ep-green)]",
              blue:    "border-[var(--ep-blue)] bg-[var(--ep-blue-soft)] text-[var(--ep-blue)]",
              amber:   "border-[var(--ep-yellow)] bg-[var(--ep-yellow-soft)] text-[var(--ep-yellow)]",
              rose:    "border-[var(--ep-red)] bg-[var(--ep-red-soft)] text-[var(--ep-red)]",
            };
            const activeCls = colorMap[step.color] ?? "border-muted bg-muted text-muted-foreground";
            const inactiveCls = "border-border bg-background text-muted-foreground";
            return (
              <div
                key={step.day}
                className={cn(
                  "rounded-xl border-2 p-3 flex flex-col gap-1 transition-all",
                  isActive ? activeCls : inactiveCls
                )}
              >
                <div className="flex items-center gap-1.5">
                  {isActive && <span className="w-2 h-2 rounded-full bg-current shrink-0 animate-pulse" />}
                  <span className="text-xs font-bold">{step.label}</span>
                </div>
                <p className="text-[11px] leading-snug opacity-80">{step.event}</p>
                {isActive && (
                  <span className="text-[10px] font-semibold bg-current/10 rounded px-1.5 py-0.5 mt-1 w-fit">
                    {t("active")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {(fpCycle?.pending ?? 0) > 0 && (
          <div className="mt-3 flex items-center gap-2 p-3 bg-[var(--ep-yellow-soft)] border border-[var(--ep-yellow)] rounded-lg">
            <AlertCircle className="w-4 h-4 text-[var(--ep-yellow)] shrink-0" />
            <p className="text-xs text-[var(--ep-yellow)]">
              <span className="font-semibold">{fpCycle?.pending} ta ЗВС ariza</span> tasdiqlashni kutmoqda
              {fpCycle?.approvedTotal ? ` · Tasdiqlangan: ${Number(fpCycle.approvedTotal).toLocaleString()} UZS` : ""}
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-card rounded-xl p-6">
          <div className="flex flex-col gap-1 mb-4">
            <h3 className="text-lg font-semibold">{t('accountType')}</h3>
            <p className="text-sm text-muted-foreground">{t('chartOfAccounts')}</p>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('asset')}</span>
              <Badge variant="outline">{dashboard?.accounts?.assetAccounts || 0}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('liability')}</span>
              <Badge variant="outline">{dashboard?.accounts?.liabilityAccounts || 0}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('equity')}</span>
              <Badge variant="outline">{dashboard?.accounts?.equityAccounts || 0}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('revenue')}</span>
              <Badge variant="outline">{dashboard?.accounts?.revenueAccounts || 0}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('expenses')}</span>
              <Badge variant="outline">{dashboard?.accounts?.expenseAccounts || 0}</Badge>
            </div>
            <hr />
            <div className="flex justify-between items-center font-medium">
              <span>{tCommon('total')}</span>
              <Badge>{dashboard?.accounts?.totalAccounts || 0}</Badge>
            </div>
          </div>
          {(dashboard?.accounts?.totalAccounts || 0) === 0 && (
            <Button
              className="w-full mt-4 gap-2"
              onClick={onSeedAccounts}
              disabled={isSeedingAccounts}
              data-testid="button-seed-accounts"
            >
              <Plus className="h-4 w-4" />
              {tCommon('create')}
            </Button>
          )}
        </div>

        <div className="bg-card rounded-xl p-6">
          <div className="flex flex-col gap-1 mb-4">
            <h3 className="text-lg font-semibold">{t('taxRules')}</h3>
            <p className="text-sm text-muted-foreground">{t('taxReport')}</p>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium">INPS</p>
                <p className="text-sm text-muted-foreground">{t('pensionFund')}</p>
              </div>
              <span className="text-2xl font-bold text-[var(--ep-blue)]">12%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium">JSHD</p>
                <p className="text-sm text-muted-foreground">{t('incomeTax')}</p>
              </div>
              <span className="text-2xl font-bold text-[var(--ep-blue)]">12%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium">{t('minimumWage')}</p>
                <p className="text-sm text-muted-foreground">{t('fiscalYear')}</p>
              </div>
              <span className="text-lg font-bold">{formatCurrency(dashboard?.taxConstants?.MIN_WAGE || sysSettings?.minWage || 1120000)}</span>
            </div>
          </div>
        </div>
      </div>
    </TabsContent>
  );
}
