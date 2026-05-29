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
import { tLabel } from '@/lib/i18n/tLabel';
import { fmtMoney } from "./SDDashboardTypes";
import { EPPageHeader, EPKpiCard, EPSkeletonKpiRow, EPErrorState } from "@/components/ep";

// ─── Response Shapes ──────────────────────────────────────────────────────────

interface SdStats {
  total_orders?: number; pending_orders?: number; in_production?: number; delivered?: number;
  monthly_revenue?: string | number; weekly_revenue?: string | number;
  today_revenue?: string | number; pending_advance?: number;
}
interface TopCustomer {
  customer_id?: string | number; customer_name?: string;
  order_count?: number; total_revenue?: string | number;
}
interface OverviewResponse { stats?: SdStats; top_customers?: TopCustomer[]; }

interface FunnelData {
  total_leads?: number; active_leads?: number; total_deals?: number;
  won_deals?: number; won_revenue?: string | number; conversion_rate?: number; period?: string;
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
    data: funnel,
    isLoading: funnelLoad,
  } = useQuery<FunnelData>({
    queryKey: ["/api/sd/reports/funnel"],
    queryFn: () => apiRequest("GET", "/api/sd/reports/funnel"),
    enabled: isAuthenticated === true,
  });

  const stats: SdStats = overview?.stats ?? {};
  const tcRaw = overview?.top_customers;
  const topCustomers: TopCustomer[] = Array.isArray(tcRaw) ? tcRaw : [];
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
            label={tLabel("sd.jamiBuyurtmalar", "Jami buyurtmalar (90 kun)")}
            value={Number(stats.total_orders ?? 0)}
            icon={ShoppingCart}
            iconBg="sd"
            enterDelayMs={0}
          />
          <EPKpiCard
            label={tLabel("sd.kutilmoqda", "Kutilmoqda")}
            value={Number(stats.pending_orders ?? 0)}
            icon={AlertCircle}
            iconBg="var(--ep-yellow)"
            enterDelayMs={60}
          />
          <EPKpiCard
            label={tLabel("sd.ishlabChiqarishda", "Ishlab chiqarishda")}
            value={Number(stats.in_production ?? 0)}
            icon={Factory}
            iconBg="var(--ep-blue)"
            enterDelayMs={120}
          />
          <EPKpiCard
            label={tLabel("sd.yetkazilgan", "Yetkazilgan")}
            value={Number(stats.delivered ?? 0)}
            icon={Truck}
            iconBg="var(--ep-green)"
            enterDelayMs={180}
          />
          <EPKpiCard
            label={tLabel("sd.oylikDaromad", "Oylik daromad")}
            staticValue={fmtMoney(Number(stats.monthly_revenue ?? 0))}
            icon={TrendingUp}
            iconBg="var(--ep-purple)"
            enterDelayMs={240}
          />
          <EPKpiCard
            label={tLabel("sd.avansKutilmoqda", "Avans kutilmoqda")}
            value={Number(stats.pending_advance ?? 0)}
            icon={Warehouse}
            iconBg="var(--ep-red)"
            enterDelayMs={300}
          />
        </div>
      )}

      {/* Sales funnel (CRM leads/deals) — BE returns a single object, not an array */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {tLabel("sd.savdoFunnel", "Savdo funnel")}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-border">
          {[
            { l: tLabel("sd.leadlar", "Leadlar"), v: String(funnel?.total_leads ?? 0) },
            { l: tLabel("sd.faolLeadlar", "Faol leadlar"), v: String(funnel?.active_leads ?? 0) },
            { l: tLabel("sd.bitimlar", "Bitimlar"), v: String(funnel?.total_deals ?? 0) },
            { l: tLabel("sd.yutilgan", "Yutilgan"), v: String(funnel?.won_deals ?? 0) },
            { l: tLabel("sd.yutilganDaromad", "Yutilgan daromad"), v: fmtMoney(Number(funnel?.won_revenue ?? 0)) },
          ].map((s) => (
            <div key={s.l} className="px-5 py-4">
              <div className="text-2xl font-bold text-foreground">{s.v}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top customers (monthly) — real BE data */}
      {topCustomers.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {tLabel("sd.topMijozlar", "Top mijozlar (oylik)")}
            </p>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{tLabel("sd.mijoz", "Mijoz")}</th>
                <th className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right">{tLabel("sd.buyurtmalarSoni", "Buyurtmalar")}</th>
                <th className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right">{tLabel("sd.daromad", "Daromad")}</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((c, i) => (
                <tr key={`tc-${c.customer_id ?? i}`} className="hover:bg-muted/40 transition-colors border-b border-border last:border-0">
                  <td className="py-3 px-6 text-sm font-medium">{c.customer_name ?? "—"}</td>
                  <td className="py-3 px-6 text-sm text-right font-semibold">{Number(c.order_count ?? 0)}</td>
                  <td className="py-3 px-6 text-sm text-right font-semibold text-[var(--ep-green)]">{fmtMoney(Number(c.total_revenue ?? 0))} so'm</td>
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
