/**
 * @module MESDowntimes
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { mesApi } from "@/lib/api/mes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Clock, CheckCircle, Calendar, Timer, Plus, StopCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface Downtime {
  id: string;
  sessionId: string;
  eventType: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  reasonCode: string;
  reasonDescription?: string;
  isPlanned: boolean;
  notes?: string;
  createdAt: string;
}

function fmtSecs(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h} soat ${m} daq` : `${m} daqiqa`;
}

const REASON_LABELS: Record<string, string> = {
  unknown: "Noma'lum", material_shortage: "Material yetishmovchiligi",
  tool_change: "Asbob almashtirish", machine_breakdown: "Mashina nosozligi",
  maintenance: "Texnik xizmat", quality_issue: "Sifat muammosi",
  operator_break: "Operator tanaffusi", shift_end: "Smena tugashi",
  setup: "Sozlash", lunch: "Tushlik", quality: "Sifat sozlash",
  planned_maintenance: "Rejalashtirilgan TA", unplanned_stop: "Rejalanmagan to'xtash",
};

export default function MESDowntimes() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [filter, setFilter] = useState<"all" | "planned" | "unplanned">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ sessionId: "", reasonCode: "unknown", notes: "", isPlanned: false });

  const { data: raw, isLoading } = useQuery<Downtime[]>({
    queryKey: ["/api/iot/downtime-events"],
    refetchInterval: 30000,
  });

  const downtimes: Downtime[] = Array.isArray(raw) ? raw : [];

  const startDowntimeMutation = useMutation({
    mutationFn: (data: typeof form) =>
      mesApi.startDowntime({
        sessionId: data.sessionId,
        reasonCode: data.reasonCode,
        notes: data.notes,
        isPlanned: data.isPlanned,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iot/downtime-events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/iot/production-sessions"] });
      setCreateOpen(false);
      setForm({ sessionId: "", reasonCode: "unknown", notes: "", isPlanned: false });
      toast({ title: "To'xtash boshlandi", description: "Downtime hodisasi qayd qilindi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const endDowntimeMutation = useMutation({
    mutationFn: (id: string) => mesApi.endDowntime(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iot/downtime-events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/iot/production-sessions"] });
      toast({ title: "To'xtash yakunlandi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const filtered = (Array.isArray(downtimes) ? downtimes : []).filter(d => {
    if (filter === "planned") return d.isPlanned;
    if (filter === "unplanned") return !d.isPlanned;
    return true;
  }).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  const totalMins = Math.round((Array.isArray(downtimes) ? downtimes : []).reduce((a, d) => a + (d.durationSeconds || 0), 0) / 60);
  const unplanned = (Array.isArray(downtimes) ? downtimes : []).filter(d => !d.isPlanned);
  const unplannedMins = Math.round((Array.isArray(unplanned) ? unplanned : []).reduce((a, d) => a + (d.durationSeconds || 0), 0) / 60);
  const activeDowntimes = (Array.isArray(downtimes) ? downtimes : []).filter(d => !d.endedAt);

  const reasonCounts = downtimes.reduce<Record<string, number>>((acc, d) => {
    const key = d.reasonCode; acc[key] = (acc[key] || 0) + 1; return acc;
  }, {});
  const topReasons = Object.entries(reasonCounts).sort(([, a], [, b]) => b - a).slice(0, 5);

  return (
    <div className="flex flex-col flex-1 overflow-auto p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("toxtashlar")}</h1>
          <p className="text-sm text-muted-foreground">{t("barchaToxtashHodisalariVaTahlili")}</p>
        </div>
        <div className="flex items-center gap-2">
          {activeDowntimes.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              {activeDowntimes.length} aktiv to'xtash
            </Badge>
          )}
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("toxtashQaydEtish")}
          </Button>
        </div>
      </div>

      {/* KPI kartalar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { label: "Jami to'xtash", value: downtimes.length, icon: AlertTriangle, color: "text-[var(--ep-yellow)]" },
          { label: "Jami vaqt", value: `${totalMins} daq`, icon: Timer, color: "text-foreground" },
          { label: "Rejalanmagan", value: unplanned.length, icon: AlertTriangle, color: "text-[var(--ep-red)]" },
          { label: "Rejalanmagan vaqt", value: `${unplannedMins} daq`, icon: Clock, color: "text-[var(--ep-red)]" },
        ]).map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className={cn("w-4 h-4", kpi.color)} />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className={cn("text-2xl font-bold", kpi.color)}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("topSabablar")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(Array.isArray(topReasons) ? topReasons : []).map(([code, cnt]) => (
              <div key={code} className="flex items-center justify-between gap-2">
                <span className="text-xs text-foreground truncate flex-1">{REASON_LABELS[code] || code}</span>
                <EPStatusPill tone="neutral" className="text-[10px] shrink-0">{cnt}</EPStatusPill>
              </div>
            ))}
            {topReasons.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">{t("malumotYoq")}</p>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as "all" | "planned" | "unplanned")}>
              <SelectTrigger className="w-48 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("Barchasi")}</SelectItem>
                <SelectItem value="planned">{t("rejalashtirilgan")}</SelectItem>
                <SelectItem value="unplanned">{t("rejalanmagan")}</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">{filtered.length} ta hodisa</span>
          </div>

          {isLoading ? (
            <div className="space-y-2">{([1, 2, 3, 4, 5]).map(i => <Skeleton key={`k-${i}`} className="h-16 w-full rounded-lg" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-[13px] text-muted-foreground">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
              <p>{t("toxtashTopilmadi")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(Array.isArray(filtered) ? filtered : []).map(d => {
                const start = new Date(d.startedAt);
                const isActive = !d.endedAt;
                return (
                  <div
                    key={d.id}
                    className={cn(
                      "rounded-lg border p-3 flex items-start justify-between gap-3",
                      isActive ? "border-red-300 bg-red-50/70 dark:border-red-800 dark:bg-red-900/20" :
                      d.isPlanned ? "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10" :
                      "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10"
                    )}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <span className={cn(
                        "mt-1 w-2 h-2 rounded-full shrink-0",
                        isActive ? "bg-red-500 animate-pulse" :
                        d.isPlanned ? "bg-blue-500" : "bg-red-500"
                      )} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {d.reasonDescription || REASON_LABELS[d.reasonCode] || d.reasonCode}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className={cn("text-[10px] font-medium",
                            isActive ? "text-[var(--ep-red)] font-bold" :
                            d.isPlanned ? "text-[var(--ep-blue)]" : "text-[var(--ep-red)]"
                          )}>
                            {isActive ? "⚡ Aktiv" : d.isPlanned ? "Rejalashtirilgan" : "Rejalanmagan"}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {start.toLocaleDateString("uz-UZ")} {start.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {d.durationSeconds && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Timer className="w-2.5 h-2.5" /> {fmtSecs(d.durationSeconds)}
                            </span>
                          )}
                        </div>
                        {d.notes && <p className="text-[10px] text-muted-foreground mt-1">{d.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isActive ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-xs"
                          onClick={() => endDowntimeMutation.mutate(d.id)}
                          disabled={endDowntimeMutation.isPending}
                        >
                          <StopCircle className="h-3 w-3 mr-1" />
                          {t("tugatish")}
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          {d.eventType === "planned_stop" ? "Rejalashtirilgan" : "Muammo"}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Downtime Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("toxtashHodisasiniQaydEtish")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
          <Label>{t("sessiyaId")}</Label>
              <Input
                value={form.sessionId}
                onChange={e => setForm(p => ({ ...p, sessionId: e.target.value }))}
                placeholder={t("sessiyaRaqami")}
              />
            </div>
            <div className="space-y-1">
          <Label>{t("sabab")}</Label>
              <Select value={form.reasonCode} onValueChange={v => setForm(p => ({ ...p, reasonCode: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(REASON_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
          <Label>{t("Izoh")}</Label>
              <Input
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder={t("qoshimchaIzoh")}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPlanned"
                checked={form.isPlanned}
                onChange={e => setForm(p => ({ ...p, isPlanned: e.target.checked }))}
                className="h-4 w-4"
              />
              <Label htmlFor="isPlanned">{t("rejalashtirilganToxtash")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{t("cancel")}</Button>
            <Button
              onClick={() => startDowntimeMutation.mutate(form)}
              disabled={startDowntimeMutation.isPending || !form.sessionId}
            >
              {t("qaydEtish")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
