/**
 * @module SDKpi
 * @description React page component. Route-level UI.
 */

import { cn } from "@/lib/utils";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target } from "lucide-react";
import { fmt, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from "@/lib/sd-helpers";
import { EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface TeamKpiItem {
  managerId: string;
  totalSales: number | string;
  ordersCount: number;
}

interface FunnelItem {
  status: string;
  count: number | string;
  totalValue: number | string;
}

const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];

export default function SDKpi() {
  const { t } = useTranslation("common");
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const { data: team = [], isLoading: teamLoading, refetch } = useQuery<TeamKpiItem[]>({
    queryKey: ["/api/sd/kpi/team", year, month],
    queryFn: () => apiRequest("GET", `/api/sd/kpi/team?year=${year}&month=${month}`),
  });

  const { data: funnel = [], isLoading: funnelLoading } = useQuery<FunnelItem[]>({
    queryKey: ["/api/sd/reports/funnel"],
  });

  const totalTeamSales = (Array.isArray(team) ? team : []).reduce((s, m) => s + (Number(m.totalSales) || 0), 0);

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("savdoKpi")}</b></>}
        title={t("savdoKpi")}
        subtitle={t("menejerReytingiKvotalarVaFunnel")}
      />
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Select value={String(month)} onValueChange={v => setMonth(+v)}>
            <SelectTrigger className="w-40 bg-card border-border h-9" data-testid="select-kpi-month"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Array.isArray(MONTHS) ? MONTHS : []).map((m, i) => <SelectItem key={`k-${i}`} value={String(i + 1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={v => setYear(+v)}>
            <SelectTrigger className="w-28 bg-card border-border h-9" data-testid="select-kpi-year"><SelectValue /></SelectTrigger>
            <SelectContent>
              {([2024, 2025, 2026, 2027]).map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">{t("menejerlarReytingi")}</h3>
          <div className="space-y-4">
            {teamLoading && <div className="text-sm text-muted-foreground">{t("Yuklanmoqda...")}</div>}
            {[...(Array.isArray(team) ? team : [])]
              .sort((a, b) => (Number(b.totalSales) || 0) - (Number(a.totalSales) || 0))
              .map((m, i) => (
                <div key={m.managerId || i} data-testid={`card-manager-kpi-${i}`} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">#{i + 1} Menejer</span>
                    <span className="font-bold text-foreground">{fmt(Number(m.totalSales) || 0)} so'm</span>
                  </div>
                  <div className="w-full bg-muted/60 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: totalTeamSales > 0 ? `${Math.round((Number(m.totalSales) / totalTeamSales) * 100)}%` : "0%" }} />
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{m.ordersCount} ta buyurtma</div>
                </div>
              ))}
            {!teamLoading && (Array.isArray(team) ? team : []).length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-4">{t("ushbuOydaBuyurtmalarYoq")}</div>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl p-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">{t("leadFunnelTahlili")}</h3>
          <div className="space-y-3">
            {funnelLoading && <div className="text-sm text-muted-foreground">{t("Yuklanmoqda...")}</div>}
            {(Array.isArray(funnel) ? funnel : []).map((f) => (
              <div key={f.status} data-testid={`card-funnel-${f.status}`} className="flex items-center gap-3 text-sm">
                <span className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold min-w-[120px] text-center",
                  f.status === "won" ? "bg-green-100 text-green-800" :
                  f.status === "lost" ? "bg-red-100 text-red-800" :
                  f.status === "negotiating" ? "bg-amber-100 text-amber-800" :
                  "bg-primary/10 text-primary"
                )}>
                  {LEAD_STATUS_LABELS[f.status] || f.status}
                </span>
                <div className="flex-1 bg-muted/60 rounded-full h-2">
                  <div className="bg-primary/10 h-2 rounded-full"
                    style={{ width: `${Math.min(100, Math.round((Number(f.count) / 20) * 100))}%` }} />
                </div>
                <span className="font-bold min-w-8 text-right">{f.count}</span>
                {Number(f.totalValue) > 0 && (
                  <span className="text-muted-foreground text-xs">{fmt(Number(f.totalValue))} so'm</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
