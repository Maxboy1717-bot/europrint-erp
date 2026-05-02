import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw, TrendingUp, TrendingDown, Minus as MinusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { getAuthHeaders } from "@/lib/queryClient";
import { stateConfig } from "./helpers";
import type { CompanyStateCurrent, CompanyStateHistory } from "./types";

export function CompanyStateWidget() {
  const { t: td } = useTranslation("director");
  const { data: currentState, isLoading: currentLoad, isError: currentError, refetch: refetchCurrent } = useQuery<CompanyStateCurrent>({
    queryKey: ["/api/company-state/current"],
    queryFn: async () => {
      const res = await fetch("/api/company-state/current", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("company-state/current failed");
      return res.json() as Promise<CompanyStateCurrent>;
    },
    refetchInterval: 120_000,
  });
  const { data: historyData } = useQuery<CompanyStateHistory>({
    queryKey: ["/api/director/company-state/history"],
    queryFn: async () => {
      const res = await fetch("/api/director/company-state/history", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("history failed");
      return res.json() as Promise<CompanyStateHistory>;
    },
    refetchInterval: 300_000,
  });

  const stateStatusMap: Record<string, { label: string; ru: string; color: string; border: string }> = {
    osish:   { label: "O'SISH",  ru: "РОСТ",       color: "bg-emerald-500", border: "border-emerald-200" },
    normal:  { label: "NORMAL",  ru: "НОРМА",      color: "bg-blue-500",    border: "border-blue-200"    },
    ehtiyot: { label: "EHTIYOT", ru: "ОСТОРОЖНО",  color: "bg-yellow-500",  border: "border-yellow-200"  },
    xavf:    { label: "XAVF",    ru: "РИСК",       color: "bg-amber-500",   border: "border-amber-200"   },
    inqiroz: { label: "INQIROZ", ru: "КРИЗИС",     color: "bg-red-500",     border: "border-red-200"     },
    GROWTH:  { label: "O'SISH",  ru: "РОСТ",       color: "bg-emerald-500", border: "border-emerald-200" },
    NORMAL:  { label: "NORMAL",  ru: "НОРМА",      color: "bg-blue-500",    border: "border-blue-200"    },
    RISK:    { label: "XAVF",    ru: "РИСК",       color: "bg-amber-500",   border: "border-amber-200"   },
    CRITICAL:{ label: "INQIROZ", ru: "КРИЗИС",     color: "bg-red-500",     border: "border-red-200"     },
  };

  const profitPct = currentState?.kpis?.profit_pct ?? 0;
  const revenuePct = currentState?.kpis?.revenue_pct ?? 0;
  const retentionPct = currentState?.kpis?.retention_pct ?? 100;
  const state = stateStatusMap[currentState?.status ?? "normal"] ?? stateStatusMap["normal"];
  const history = historyData?.history ?? [];

  if (currentError) {
    return (
      <Card data-testid="card-company-state" className="border-2 border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            {td("companyState")} — {td("stateFormula")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <span className="text-sm text-red-700">Kompaniya holati yuklanmadi</span>
            <Button size="sm" variant="outline" onClick={() => refetchCurrent()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Qayta yuklash
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const profit = currentState?.kpis?.profit ?? 0;
  const revenue = currentState?.kpis?.revenue ?? 0;
  const profitFormatted = currentState ? (profit >= 1_000_000 ? `${(profit / 1_000_000).toFixed(1)}M` : String(Math.round(profit))) : "—";
  const revenueFormatted = currentState ? (revenue >= 1_000_000 ? `${(revenue / 1_000_000).toFixed(1)}M` : String(Math.round(revenue))) : "—";

  return (
    <Card data-testid="card-company-state" className={cn("border-2", state.border)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            {td("companyState")} — {td("stateFormula")}
          </CardTitle>
          <div className="flex items-center gap-2">
            {currentLoad ? (
              <Skeleton className="h-7 w-28 rounded-full" />
            ) : (
              <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-sm font-bold", state.color)}>
                {state.label} / {state.ru}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {currentLoad ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {([0,1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-24 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl bg-muted/40 p-4 text-center" data-testid="state-profit">
              <div className="flex items-center justify-center gap-1 mb-1">
                {profitPct >= 100 ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                <span className="text-xs text-muted-foreground">{profitFormatted} so'm</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{profitPct}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Foyda / Maqsad</p>
              <p className="text-[10px] text-muted-foreground">{td("weeklyProfitTarget")}</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-4 text-center" data-testid="state-revenue">
              <div className="flex items-center justify-center gap-1 mb-1">
                {revenuePct >= 100 ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <MinusIcon className="w-4 h-4 text-muted-foreground" />}
                <span className="text-xs text-muted-foreground">{revenueFormatted} so'm</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{revenuePct}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Daromad / Maqsad</p>
              <p className="text-[10px] text-muted-foreground">{td("weeklyRevenueTarget")}</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-4 text-center" data-testid="state-retention">
              <div className="flex items-center justify-center gap-1 mb-1">
                {retentionPct >= 95 ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                <span className="text-xs text-muted-foreground">Xodimlar</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{retentionPct.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Xodim Saqlash</p>
              <p className="text-[10px] text-muted-foreground">Maqsad: ≥95%</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-4" data-testid="state-history">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                {td("stateHistory", { days: "30" })}
              </p>
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Tarix yo'q</p>
              ) : (
                <div className="space-y-1">
                  {history.slice(-5).map((h, i) => {
                    const sc = stateConfig(h.state_key);
                    return (
                      <div key={`k-${i}`} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-mono">{h.week_label}</span>
                        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", sc.color, "text-white")}>
                          {sc.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
