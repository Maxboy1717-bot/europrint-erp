/**
 * @module CFODashboardExtra
 * @description Quick-links panel, financial risk breakdown, and financial summary
 *              section for CFODashboard.
 */

import React from "react";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Banknote,
  Target,
  Calculator,
  FileText,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Percent,
  ShieldAlert,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import {
  CFODashboardData,
  FinancialRiskData,
} from "./CFODashboardTypes";

// ─── Quick Links ──────────────────────────────────────────────────────────────

export function QuickLinksSection() {
  const { t } = useTranslation('finance');
  return (
    <div className="bg-card rounded-xl p-6" data-testid="card-quick-links">
      <div className="flex flex-col gap-1 mb-6">
        <h3 className="text-lg font-semibold">{t('quickLinks')}</h3>
        <p className="text-sm text-muted-foreground">{t('cfoMainModules')}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/cash-flow">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 hover-elevate" data-testid="link-cash-flow">
            <Banknote className="h-6 w-6 text-[var(--ep-green)]" />
            <span>{t('cashFlow')}</span>
            <span className="text-xs text-muted-foreground">{t("pulOqimi1")}</span>
          </Button>
        </Link>
        <Link href="/finance/budgets">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 hover-elevate" data-testid="link-budgets">
            <Target className="h-6 w-6 text-[var(--ep-blue)]" />
            <span>{t('budgets')}</span>
            <span className="text-xs text-muted-foreground">{t("byudjetBoshqarish")}</span>
          </Button>
        </Link>
        <Link href="/finance/order-costing">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 hover-elevate" data-testid="link-order-costing">
            <Calculator className="h-6 w-6 text-[var(--ep-purple)]" />
            <span>{t('orderCosting')}</span>
            <span className="text-xs text-muted-foreground">{t("buyurtmaTannarxi")}</span>
          </Button>
        </Link>
        <Link href="/financial-reports">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 hover-elevate" data-testid="link-reports">
            <FileText className="h-6 w-6 text-[var(--ep-yellow)]" />
            <span>{t('financialReports')}</span>
            <span className="text-xs text-muted-foreground">{t("moliyaviyHisobotlar")}</span>
          </Button>
        </Link>
        <Link href="/finance/variance">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 hover-elevate" data-testid="link-variance">
            <TrendingDown className="h-6 w-6 text-[var(--ep-red)]" />
            <span>{t("varianceTahlili")}</span>
            <span className="text-xs text-muted-foreground">{t("mpvMqvLrvLevOv")}</span>
          </Button>
        </Link>
        <Link href="/finance/break-even">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 hover-elevate" data-testid="link-break-even">
            <BarChart3 className="h-6 w-6 text-[var(--ep-cyan)]" />
            <span>{t('breakEven')}</span>
            <span className="text-xs text-muted-foreground">{t("cvpBepTahlili")}</span>
          </Button>
        </Link>
        <Link href="/finance/pricing-tiers">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 hover-elevate" data-testid="link-pricing">
            <Percent className="h-6 w-6 text-[var(--ep-blue)]" />
            <span>{t("narxlarTizimi")}</span>
            <span className="text-xs text-muted-foreground">{t("tieredPricing")}</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ─── Financial Risk Section ───────────────────────────────────────────────────

interface RiskSectionProps {
  financialRisk: FinancialRiskData | undefined;
  riskLoading: boolean;
}

export function RiskSection({ financialRisk, riskLoading }: RiskSectionProps) {
  const { t } = useTranslation('finance');
  return (
    <div className="grid gap-4 lg:grid-cols-2" data-testid="section-financial-risk">
      <div className={`rounded-xl p-6 text-white ${
        financialRisk?.overallRiskLevel === "critical" ? "bg-red-500" :
        financialRisk?.overallRiskLevel === "high"     ? "bg-primary" :
        financialRisk?.overallRiskLevel === "medium"   ? "bg-amber-500" :
        "bg-emerald-500"
      }`} data-testid="card-risk-score">
        {riskLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-40 bg-white/20 rounded-lg" />
            <Skeleton className="h-12 w-28 bg-white/20 rounded-lg" />
            <Skeleton className="h-4 w-full bg-white/20 rounded-lg" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {(financialRisk?.overallRiskLevel === "critical" || financialRisk?.overallRiskLevel === "high")
                  ? <ShieldAlert className="h-6 w-6" />
                  : <ShieldCheck className="h-6 w-6" />}
                <h3 className="text-lg font-bold">{t("moliyaviyRiskTahlili")}</h3>
              </div>
              <Badge className="bg-white/20 text-white border-white/30 text-xs">{t("aiRuleBased")}</Badge>
            </div>
            <div className="flex items-end gap-3 mb-3">
              <span className="text-5xl font-bold">{financialRisk?.overallRiskScore ?? 0}</span>
              <span className="text-white/70 mb-2">/100</span>
              <span className="mb-2 text-lg font-semibold uppercase tracking-wide">
                {financialRisk?.overallRiskLevel === "critical" ? t('cfo.risk.critical') :
                 financialRisk?.overallRiskLevel === "high"     ? t('cfo.risk.high') :
                 financialRisk?.overallRiskLevel === "medium"   ? t('cfo.risk.medium') : t('cfo.risk.low')}
              </span>
            </div>
            <p className="text-white/90 text-sm leading-relaxed mb-4">{financialRisk?.aiInsight}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="bg-white/10 rounded-lg p-2 text-center">
                <p className="text-xs text-white/70 uppercase tracking-wide mb-1">{t('cfo.risk.cash')}</p>
                <p className="text-sm font-bold">{financialRisk?.summary?.cashRunwayDays ?? "—"} {t('cfo.risk.days')}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-2 text-center">
                <p className="text-xs text-white/70 uppercase tracking-wide mb-1">{t('cfo.risk.arDelay')}</p>
                <p className="text-sm font-bold">{financialRisk?.summary?.collectionRisk?.toFixed(0) ?? "—"}%</p>
              </div>
              <div className="bg-white/10 rounded-lg p-2 text-center">
                <p className="text-xs text-white/70 uppercase tracking-wide mb-1">{t('cfo.risk.gpmTrend')}</p>
                <p className="text-sm font-bold flex items-center justify-center gap-1">
                  {financialRisk?.summary?.profitMarginTrend === "improving" ? (
                    <><TrendingUp className="h-3 w-3" /> {t('cfo.risk.improving')}</>
                  ) : financialRisk?.summary?.profitMarginTrend === "declining" ? (
                    <><TrendingDown className="h-3 w-3" /> {t('cfo.risk.declining')}</>
                  ) : t('cfo.risk.stable')}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bg-card rounded-xl p-6" data-testid="card-risk-breakdown">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="text-lg font-semibold">{t('cfo.risk.title')}</h3>
        </div>
        {riskLoading ? (
          <div className="space-y-3">
            {([1,2,3,4,5]).map(i => <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {(financialRisk?.risks || []).map((risk, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-muted/60" data-testid={`risk-item-${idx}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">{risk.category}</span>
                    <Badge variant="outline" className={`text-xs shrink-0 ${
                      risk.level === "critical" ? "border-red-500 text-[var(--ep-red)] dark:text-red-400" :
                      risk.level === "high"     ? "border-orange-500 text-[var(--ep-primary)] dark:text-orange-400" :
                      risk.level === "medium"   ? "border-amber-500 text-[var(--ep-yellow)] dark:text-amber-400" :
                      "border-emerald-500 text-[var(--ep-green)] dark:text-emerald-400"
                    }`}>
                      {risk.level === "critical" ? t('cfo.risk.criticalBadge') :
                       risk.level === "high"     ? t('cfo.risk.highBadge') :
                       risk.level === "medium"   ? t('cfo.risk.mediumBadge') : t('cfo.risk.lowBadge')}
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                    <div className={`h-1.5 rounded-full transition-all ${
                      risk.level === "critical" ? "bg-red-500" :
                      risk.level === "high"     ? "bg-orange-500" :
                      risk.level === "medium"   ? "bg-amber-500" : "bg-emerald-500"
                    }`} style={{ width: `${(risk.score / 25) * 100}%` }} />
                  </div>
                </div>
                <span className="text-sm font-bold text-muted-foreground w-8 text-right shrink-0">{risk.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Financial Summary ────────────────────────────────────────────────────────

interface FinancialSummaryProps {
  dashboard: CFODashboardData | undefined;
  netProfit: number;
  netProfitTrend: boolean;
}

export function FinancialSummarySection({ dashboard, netProfit, netProfitTrend }: FinancialSummaryProps) {
  const { t } = useTranslation('finance');
  return (
    <div className="bg-card rounded-xl p-6" data-testid="card-financial-summary">
      <h3 className="text-lg font-semibold mb-4">{t('financialSummary')}</h3>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="flex justify-between items-center pb-3 border-b border-border md:border-b-0 md:border-r md:pr-4">
          <div>
            <span className="text-sm text-muted-foreground">{t("debitorlarAr")}</span>
            <p className="font-bold text-[var(--ep-green)] text-lg">{formatCurrency(dashboard?.accountsReceivable || 0)}</p>
          </div>
        </div>
        <div className="flex justify-between items-center pb-3 border-b border-border md:border-b-0 md:border-r md:px-4">
          <div>
            <span className="text-sm text-muted-foreground">{t("kreditorlarAp")}</span>
            <p className="font-bold text-[var(--ep-red)] text-lg">{formatCurrency(dashboard?.accountsPayable || 0)}</p>
          </div>
        </div>
        <div className="flex justify-between items-center pb-3 border-b border-border md:border-b-0 md:border-r md:px-4">
          <div>
            <span className="text-sm text-muted-foreground">{t("yalpiFoyda")}</span>
            <p className="font-bold text-lg">{formatCurrency(dashboard?.grossProfit || 0)}</p>
          </div>
        </div>
        <div className="flex justify-between items-center md:pl-4">
          <div>
            <span className="text-sm text-muted-foreground">{t("sofPozitsiya")}</span>
            <p className={`font-bold text-xl ${netProfitTrend ? "text-[var(--ep-green)]" : "text-[var(--ep-primary)]"}`}>
              {formatCurrency(netProfit)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
