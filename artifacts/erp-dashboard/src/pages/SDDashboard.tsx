/**
 * @module SDDashboard
 * @description React page component. Route-level UI.
 * State management, hooks, and orchestration only — sections live in SDDashboardSections.tsx.
 */

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ChevronRight, ShoppingCart, Factory, Warehouse, Truck, AlertCircle, TrendingUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from '@/lib/i18n';
import { fmtMoney } from "./SDDashboardTypes";
import { EPPageHeader, EPKpiCard, EPSkeletonKpiRow, EPErrorState } from "@/components/ep";

// ─── Response Shapes ──────────────────────────────────────────────────────────

interface OverviewResponse {
  newOrdersThisWeek?: { count: number; totalAmount: number };
  inProduction?: { count: number; totalAmount: number };
  arrivedInWarehouse?: { count: number; totalAmount: number };
  inDelivery?: { count: number };
  debtors?: { totalAmount: number; count: number };
  monthlyRevenue?: { amount: number; collected: number };
}

interface FunnelItem {
  status: string;
  count: number;
  totalValue: number;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SDDashboard() {
  const { t } = useTranslation('common');
  const { isAuthenticated } = useAuth();

  const {
    data: overview,
    isLoading: overviewLoad,
    isError: overviewError,
    refetch: refetchOverview,
  } = useQuery<OverviewResponse>({
    queryKey: ["/api/sd/dashboard/overview"],
    queryFn: () => apiRequest("GET", "/api/sd/dashboard/overview"),
    enabled: isAuthenticated === true,
  });

  const {
    data: funnelRaw,
    isLoading: funnelLoad,
  } = useQuery<FunnelItem[]>({
    queryKey: ["/api/sd/reports/funnel"],
    queryFn: () => apiRequest("GET", "/api/sd/reports/funnel"),
    enabled: isAuthenticated === true,
  });

  const funnel: FunnelItem[] = Array.isArray(funnelRaw) ? funnelRaw : [];
  const loading = overviewLoad || funnelLoad;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <EPPageHeader
        breadcrumb={<>{t("dashboardSd")}<b className="text-foreground">{t("crmSavdoDashbordi")}</b></>}
        title={t("crmSavdoDashbordi")}
        subtitle={t("savdoMenejeriningKunlikKorinishi")}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/sd/sales-management">
              {t("buyurtmalar")} <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        }
      />

      {/* KPI Row */}
      {loading ? (
        <EPSkeletonKpiRow count={6} />
      ) : overviewError ? (
        <EPErrorState onRetry={refetchOverview} />
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <EPKpiCard
            label={t("yangiOrderlarHafta") || "Yangi buyurtmalar (hafta)"}
            value={overview?.newOrdersThisWeek?.count ?? 0}
            icon={ShoppingCart}
            iconBg="sd"
            enterDelayMs={0}
          />
          <EPKpiCard
            label={t("ishlabyiqarishda") || "Ishlab chiqarishda"}
            value={overview?.inProduction?.count ?? 0}
            icon={Factory}
            iconBg="var(--ep-yellow)"
            enterDelayMs={60}
          />
          <EPKpiCard
            label={t("omborGeldi") || "Omborga keldi"}
            value={overview?.arrivedInWarehouse?.count ?? 0}
            icon={Warehouse}
            iconBg="var(--ep-green)"
            enterDelayMs={120}
          />
          <EPKpiCard
            label={t("yetkazishda") || "Yetkazishda"}
            value={overview?.inDelivery?.count ?? 0}
            icon={Truck}
            iconBg="var(--ep-blue)"
            enterDelayMs={180}
          />
          <EPKpiCard
            label={t("debitorlar") || "Debitorlar"}
            value={overview?.debtors?.count ?? 0}
            staticValue={overview?.debtors?.totalAmount
              ? fmtMoney(overview.debtors.totalAmount)
              : undefined}
            icon={AlertCircle}
            iconBg="var(--ep-red)"
            enterDelayMs={240}
          />
          <EPKpiCard
            label={t("oylikDaromad") || "Oylik daromad"}
            staticValue={overview?.monthlyRevenue?.amount
              ? fmtMoney(overview.monthlyRevenue.amount)
              : "0"}
            icon={TrendingUp}
            iconBg="var(--ep-purple)"
            enterDelayMs={300}
          />
        </div>
      )}

      {/* Funnel table */}
      {funnel.length > 0 && (
        <div className="bg-card rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("savdoFunneli") || "Savdo funnel"}
            </p>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("status28") || "Status"}</th>
                <th className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right">{t("soni") || "Soni"}</th>
                <th className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right">{t("qiymati") || "Qiymati"}</th>
              </tr>
            </thead>
            <tbody>
              {funnel.map((row, i) => (
                <tr key={`funnel-${i}`} className="hover:bg-muted/40 transition-colors border-b last:border-0">
                  <td className="py-3 px-6 text-sm font-medium capitalize">{row.status}</td>
                  <td className="py-3 px-6 text-sm text-right font-semibold">{row.count}</td>
                  <td className="py-3 px-6 text-sm text-right font-semibold text-[var(--ep-green)]">
                    {fmtMoney(row.totalValue)} so'm
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/sd/sales-management">{t("buyurtmalar")}</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/sd/dashboard/quota">{t("kvota")}</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/sd/dashboard/overview">{t('overview') || "Overview"}</Link>
        </Button>
      </div>
    </div>
  );
}
