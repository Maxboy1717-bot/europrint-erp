import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  SdTeamKpi, SdFunnelStage,
  fmt, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS 
} from "./types";

export function KPITab() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const { data: team = [], isLoading: teamLoading } = useQuery<SdTeamKpi[]>({
    queryKey: ["/api/sd/kpi/team", year, month],
    queryFn: () => apiRequest("GET", `/api/sd/kpi/team?year=${year}&month=${month}`),
  });

  const { data: funnel = [], isLoading: funnelLoading } = useQuery<SdFunnelStage[]>({
    queryKey: ["/api/sd/reports/funnel"],
  });

  const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];

  const totalTeamSales = (Array.isArray(team) ? team : []).reduce((s, m) => s + (Number(m.totalSales) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex gap-3 flex-wrap">
        <Select value={String(month)} onValueChange={v => setMonth(+v)}>
          <SelectTrigger className="w-40" data-testid="select-kpi-month"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Array.isArray(MONTHS) ? MONTHS : []).map((m, i) => <SelectItem key={`k-${i}`} value={String(i + 1)}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={v => setYear(+v)}>
          <SelectTrigger className="w-32" data-testid="select-kpi-year"><SelectValue /></SelectTrigger>
          <SelectContent>
            {([2024, 2025, 2026, 2027]).map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Menejerlar reytingi</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            {teamLoading && <div className="text-sm text-muted-foreground">Yuklanmoqda...</div>}
            {[...team]
              .sort((a: SdTeamKpi, b: SdTeamKpi) => (Number(b.totalSales) || 0) - (Number(a.totalSales) || 0))
              .map((m: SdTeamKpi, i: number) => (
                <div key={m.managerId || i} data-testid={`card-manager-kpi-${i}`} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">#{i + 1} Menejer</span>
                    <span className="font-bold">{fmt(Number(m.totalSales) || 0)} so'm</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: totalTeamSales > 0 ? `${Math.round((Number(m.totalSales || 0) / totalTeamSales) * 100)}%` : "0%" }} />
                  </div>
                  <div className="text-xs text-muted-foreground">{m.ordersCount} ta buyurtma</div>
                </div>
              ))}
            {!teamLoading && team.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-4">Ushbu oyda buyurtmalar yo'q</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Leed funnel tahlili</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            {funnelLoading && <div className="text-sm text-muted-foreground">Yuklanmoqda...</div>}
            {(Array.isArray(funnel) ? funnel : []).map((f: SdFunnelStage) => (
              <div key={f.status} data-testid={`card-funnel-${f.status}`} className="flex items-center gap-3 text-sm">
                <span className={`text-xs px-2 py-0.5 rounded-md min-w-28 text-center font-medium ${LEAD_STATUS_COLORS[f.status] || ""}`}>
                  {LEAD_STATUS_LABELS[f.status] || f.status}
                </span>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div className="bg-primary/70 h-2 rounded-full"
                    style={{ width: `${Math.min(100, Math.round((Number(f.count) / 20) * 100))}%` }} />
                </div>
                <span className="font-bold min-w-8 text-right">{f.count}</span>
                {Number(f.totalValue || 0) > 0 && (
                  <span className="text-muted-foreground text-xs">{fmt(Number(f.totalValue || 0))} so'm</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
