/**
 * @module SDQuotaDashboardSections
 * @description Major section components for SDQuotaDashboard:
 *   - QuotaPlanFactCard  — monthly plan/fact card with progress bar and daily stats
 *   - KpiStatsRow        — 4-column KPI summary cards
 *   - LeadStatusCard     — lead status breakdown
 *   - ProposalStatusCard — proposal status breakdown
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Target, FileText, User, BarChart2, Zap } from "lucide-react";
import { fmt } from "@/lib/sd-helpers";
import { cn } from "@/lib/utils";
import { useTranslation } from '@/lib/i18n';
import {
  QuotaData,
  LEAD_STATUS_UZ,
  PROPOSAL_STATUS_UZ,
  PROPOSAL_STATUS_COLORS,
} from "./SDQuotaDashboardTypes";

// ---------------------------------------------------------------------------
// QuotaPlanFactCard
// ---------------------------------------------------------------------------

interface QuotaPlanFactCardProps {
  quota: QuotaData["quota"];
  isOnTrack: boolean;
}

export function QuotaPlanFactCard({ quota: q, isOnTrack }: QuotaPlanFactCardProps) {
  const { t } = useTranslation("common");
  return (
    <Card className="bg-card border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Oylik savdo rejasi (Plan / Fakt)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        {/* Asosiy raqamlar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-muted/40 rounded-xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">REJA (maqsad)</p>
            <p className="text-3xl font-bold text-foreground" data-testid="text-quota-target">
              {fmt(q.target)}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">{t("som")}</p>
          </div>
          <div className={cn("text-center p-4 rounded-xl", isOnTrack ? "bg-green-50" : "bg-red-50")}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">FAKT (bajarilgan)</p>
            <p className={cn("text-3xl font-bold", isOnTrack ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]")} data-testid="text-quota-achieved">
              {fmt(q.achieved)}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">{t("som")}</p>
          </div>
          <div className="text-center p-4 bg-muted/40 rounded-xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">QOLDI</p>
            <p className="text-3xl font-bold text-[var(--ep-yellow)]" data-testid="text-quota-remaining">
              {fmt(q.remaining)}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">{t("som")}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-foreground">Bajarilish: {q.percent}%</span>
            <span className={isOnTrack ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}>
              {q.percent >= 100 ? "Reja bajarildi!" : `${q.percent}% bajarildi`}
            </span>
          </div>
          <Progress
            value={Math.min(q.percent, 100)}
            className="h-4 bg-muted"
            data-testid="progress-quota"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>{fmt(q.target / 2)}</span>
            <span>{fmt(q.target)}</span>
          </div>
        </div>

        {/* Kunlik plan/fakt */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("kunlikReja")}</p>
              <p className="text-lg font-bold text-foreground">{fmt(q.dailyTarget)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn("p-2.5 rounded-lg", isOnTrack ? "bg-green-100" : "bg-red-100")}>
              <BarChart2 className={cn("w-4 h-4", isOnTrack ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]")} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("kunlikFakt")}</p>
              <p className={cn("text-lg font-bold", isOnTrack ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]")}>
                {fmt(q.dailyActual)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn("p-2.5 rounded-lg", q.pace >= 100 ? "bg-green-100" : "bg-amber-100")}>
              <Zap className={cn("w-4 h-4", q.pace >= 100 ? "text-[var(--ep-green)]" : "text-[var(--ep-yellow)]")} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Temp (Pace)</p>
              <p className={cn("text-lg font-bold", q.pace >= 100 ? "text-[var(--ep-green)]" : "text-[var(--ep-yellow)]")}>
                {q.pace}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// KpiStatsRow
// ---------------------------------------------------------------------------

interface KpiStatsRowProps {
  ordersThisMonth: number;
  leadsWon: number;
  conversionRate: number;
  totalProposals: number;
}

export function KpiStatsRow({
  ordersThisMonth,
  leadsWon,
  conversionRate,
  totalProposals,
}: KpiStatsRowProps) {
  const { t } = useTranslation("common");
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="bg-card border-none shadow-sm">
        <CardContent className="p-5 flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-lg">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground" data-testid="text-orders-month">
              {ordersThisMonth}
            </p>
            <p className="text-xs text-muted-foreground">{t("oylikBuyurtmalar")}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-none shadow-sm">
        <CardContent className="p-5 flex items-center gap-3">
          <div className="p-2.5 bg-green-100 rounded-lg">
            <User className="w-5 h-5 text-[var(--ep-green)]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground" data-testid="text-leads-won">
              {leadsWon}
            </p>
            <p className="text-xs text-muted-foreground">{t("yutilganLeadlar")}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-none shadow-sm">
        <CardContent className="p-5 flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-[var(--ep-blue)]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground" data-testid="text-conversion-rate">
              {conversionRate}%
            </p>
            <p className="text-xs text-muted-foreground">{t("konversiya")}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-none shadow-sm">
        <CardContent className="p-5 flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 rounded-lg">
            <FileText className="w-5 h-5 text-[var(--ep-purple)]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground" data-testid="text-total-proposals">
              {totalProposals}
            </p>
            <p className="text-xs text-muted-foreground">{t("oylikTakliflar")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LeadStatusCard
// ---------------------------------------------------------------------------

interface LeadStatusCardProps {
  leadsByStatus: Record<string, number>;
}

export function LeadStatusCard({ leadsByStatus }: LeadStatusCardProps) {
  const { t } = useTranslation("common");
  const entries = Object.entries(leadsByStatus);

  return (
    <Card className="bg-card border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("leadHolatlari")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3 pt-2">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">{t("malumotYoq")}</p>
        ) : (
          entries.map(([status, cnt]) => (
            <div
              key={status}
              className="flex flex-col items-center p-4 bg-muted/40 rounded-xl min-w-[100px] border border-border/30"
              data-testid={`card-lead-status-${status}`}
            >
              <span className="text-2xl font-bold text-foreground">{cnt as number}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">
                {LEAD_STATUS_UZ[status] || status}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// ProposalStatusCard
// ---------------------------------------------------------------------------

interface ProposalStatusCardProps {
  proposalsByStatus: Record<string, number>;
}

export function ProposalStatusCard({ proposalsByStatus }: ProposalStatusCardProps) {
  const { t } = useTranslation("common");
  const entries = Object.entries(proposalsByStatus);

  return (
    <Card className="bg-card border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Taklifnomalar holati (oylik)
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3 pt-2">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">{t("buOydaTaklifYaratilmagan")}</p>
        ) : (
          entries.map(([status, cnt]) => (
            <div
              key={status}
              className={cn(
                "flex flex-col items-center p-4 rounded-xl min-w-[110px]",
                PROPOSAL_STATUS_COLORS[status] || "bg-muted/40 text-foreground",
              )}
              data-testid={`card-proposal-status-${status}`}
            >
              <span className="text-2xl font-bold">{cnt as number}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider mt-1">
                {PROPOSAL_STATUS_UZ[status] || status}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
