/**
 * @module CompanyStatePage
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, TrendingUp, TrendingDown, Users, ShoppingCart, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface CompanyKpis {
  profit?: number;
  revenue?: number;
  expenses?: number;
  retentionPct?: number;
  totalEmployees?: number;
  activeEmployees?: number;
  activeOrders?: number;
}

interface CompanyLabel {
  uz?: string;
  ru?: string;
  emoji?: string;
}

interface CompanySummary {
  profitFormatted?: string;
  revenueFormatted?: string;
  expensesFormatted?: string;
}

interface CompanyState {
  state?: string;
  label?: CompanyLabel;
  kpis?: CompanyKpis;
  summary?: CompanySummary;
  generatedAt?: string;
}

const STATE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  osish:   { bg: "bg-green-50",  text: "text-[var(--ep-green)]",  border: "border-green-200" },
  normal:  { bg: "bg-blue-50",   text: "text-[var(--ep-blue)]",   border: "border-blue-200" },
  ehtiyot: { bg: "bg-amber-50",  text: "text-[var(--ep-yellow)]",  border: "border-amber-200" },
  xavf:    { bg: "bg-orange-50", text: "text-[var(--ep-primary)]", border: "border-orange-200" },
  inqiroz: { bg: "bg-red-50",    text: "text-[var(--ep-red)]",    border: "border-red-200" },
};

export default function CompanyStatePage() {
  const { t } = useTranslation("common");
  const { data, isLoading, isError, error, refetch } = useQuery<CompanyState>({
    queryKey: ["/api/company-state/current"],
    queryFn: async () => {
      return await apiRequest("GET", "/api/company-state/current");
    },
  });

  if (isError) return <EPErrorState onRetry={refetch}  error={error} />;

  const state    = data?.state ?? "normal";
  const label    = data?.label;
  const kpis     = data?.kpis ?? {};
  const summary  = data?.summary ?? {};
  const colors   = STATE_COLORS[state] ?? STATE_COLORS.normal;

  const fmt = (n?: number) => {
    if (n === undefined) return "—";
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} mlrd`;
    if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)} mln`;
    return n.toLocaleString("uz-UZ");
  };

  return (
    <ModulePage
      module="finance"
      title={t("kompaniyaHolati")}
      icon={<Building2 className="h-5 w-5" />}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/company-state/current"] })}
          data-testid="button-refresh-state"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t("refresh")}
        </Button>
      }
    >
      <div className="space-y-6">
        {/* State banner */}
        <Card className={`border-2 ${isLoading ? "border-muted" : colors.border}`}>
          <CardContent className={`p-6 ${isLoading ? "" : colors.bg}`}>
            {isLoading ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-48 rounded-lg" />
                  <Skeleton className="h-4 w-32 rounded-lg" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="text-5xl">{label?.emoji ?? "🏢"}</div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className={`text-2xl font-bold ${colors.text}`}>
                      {label?.uz ?? state}
                    </h2>
                    <Badge variant="outline" className={`${colors.text} ${colors.border}`}>
                      {state.toUpperCase()}
                    </Badge>
                  </div>
                  {label?.ru && (
                    <p className={`text-sm mt-0.5 ${colors.text} opacity-80`}>{label.ru}</p>
                  )}
                  {data?.generatedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(data.generatedAt).toLocaleString("uz-UZ")}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label:  "Daromad",
              value:  summary.revenueFormatted ?? fmt(kpis.revenue),
              icon:   <TrendingUp   className="h-4 w-4 text-[var(--ep-green)]" />,
              bg:     "bg-green-100",
              testid: "kpi-revenue",
            },
            {
              label:  "Xarajat",
              value:  summary.expensesFormatted ?? fmt(kpis.expenses),
              icon:   <TrendingDown className="h-4 w-4 text-[var(--ep-red)]" />,
              bg:     "bg-red-100",
              testid: "kpi-expenses",
            },
            {
              label:  "Foyda",
              value:  summary.profitFormatted ?? fmt(kpis.profit),
              icon:   <TrendingUp   className="h-4 w-4 text-[var(--ep-blue)]" />,
              bg:     "bg-blue-100",
              testid: "kpi-profit",
            },
            {
              label:  "Faol buyurtmalar",
              value:  kpis.activeOrders?.toString() ?? "—",
              icon:   <ShoppingCart className="h-4 w-4 text-[var(--ep-purple)]" />,
              bg:     "bg-purple-100",
              testid: "kpi-orders",
            },
          ].map(({ label: l, value, icon, bg, testid }) => (
            <Card key={l}>
              <CardContent className="p-4" data-testid={testid}>
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                    {icon}
                  </div>
                  <div className="min-w-0">
                    {isLoading
                      ? <Skeleton className="h-6 w-20 mb-0.5 rounded-lg" />
                      : <p className="text-lg font-bold truncate">{value}</p>}
                    <p className="text-xs text-muted-foreground">{l}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Employee stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t("xodimlar")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex gap-6">
                <Skeleton className="h-14 w-24 rounded-lg" />
                <Skeleton className="h-14 w-24 rounded-lg" />
                <Skeleton className="h-14 w-24 rounded-lg" />
              </div>
            ) : (
              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-2xl font-bold">{kpis.totalEmployees ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{t("jamiXodimlar1")}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--ep-green)]">{kpis.activeEmployees ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{t("faolXodimlar1")}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--ep-blue)]">
                    {kpis.retentionPct !== undefined ? `${kpis.retentionPct}%` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("ushlabTurish")}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ModulePage>
  );
}
