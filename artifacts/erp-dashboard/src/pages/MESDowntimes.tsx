/**
 * @module MESDowntimes
 * @description React page component. Route-level UI.
 */

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, selectArray } from "@/lib/queryClient";
import { mesApi } from "@/lib/api/mes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Clock, CheckCircle, Calendar, Timer, Plus, StopCircle, ArrowUpDown, Download, Factory } from "lucide-react";
import { cn } from "@/lib/utils";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
import { tLabel } from '@/lib/i18n/tLabel';
import { exportToCSV, exportToExcel } from "@/lib/export-utils";

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
  // Audit 2026-08-08: `downtime_events.work_center_id` is a live `uuid` column
  // (schema-manufacturing.ts declares it `text NOT NULL` — drift, see commit
  // message) with NO confirmed referent table (no uuid-PK table named
  // work_center/machine/station exists live) — rendered as a raw id, not
  // resolved to a name, so we don't fabricate a join to the wrong table (Q-40).
  workCenterId?: string | null;
}

type DtSortField = "startedAt" | "durationSeconds";
type SortDirection = "asc" | "desc";

function fmtSecs(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const soat = tLabel("common.MESDowntimes.soat", "soat");
  const daq = tLabel("common.MESDowntimes.daq", "daq");
  const daqiqa = tLabel("common.MESDowntimes.daqiqa", "daqiqa");
  return h > 0 ? `${h} ${soat} ${m} ${daq}` : `${m} ${daqiqa}`;
}

// VISION-3340 #44 (08-mes#10): downtime reasons come from the LIVE
// mes_downtime_reasons catalog (GET /api/mes/downtime-reasons), not a hardcoded
// dictionary, so the operator's pick carries a real reason_code_id and root-cause
// stats can group by it. One row of that catalog.
interface DowntimeReasonRow {
  id?: number | string;
  code?: string;
  name?: string;
}

export default function MESDowntimes() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [filter, setFilter] = useState<"all" | "planned" | "unplanned">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortField, setSortField] = useState<DtSortField>("startedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<{ sessionId: string; reasonCode: string; reasonId: number | null; notes: string; isPlanned: boolean }>(
    { sessionId: "", reasonCode: "", reasonId: null, notes: "", isPlanned: false },
  );

  const { data: raw, isLoading } = useQuery<Downtime[]>({
    queryKey: ["/api/iot/downtime-events"],
    refetchInterval: 30000,
  });

  // VISION-3340 #44 (08-mes#10): live downtime-reason catalog (same source the
  // sibling MESExtended page reads). Operators pick from this list; the picked
  // row's id flows through as reasonId so the backend can persist reason_code_id.
  const { data: reasonRows = [], isLoading: reasonsLoading } = useQuery<DowntimeReasonRow[]>({
    queryKey: ["/api/mes/downtime-reasons"],
    select: selectArray<DowntimeReasonRow>,
  });

  const reasonNameByCode = new Map<string, string>();
  (Array.isArray(reasonRows) ? reasonRows : []).forEach(r => {
    if (r.code) reasonNameByCode.set(String(r.code), String(r.name || r.code));
  });
  const reasonName = (code: string) => reasonNameByCode.get(code) || code;

  const downtimes: Downtime[] = Array.isArray(raw) ? raw : [];

  const startDowntimeMutation = useMutation({
    mutationFn: (data: typeof form) =>
      mesApi.startDowntime({
        sessionId: data.sessionId,
        reasonCode: data.reasonCode,
        reasonId: data.reasonId ?? undefined,
        notes: data.notes,
        isPlanned: data.isPlanned,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iot/downtime-events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/iot/production-sessions"] });
      setCreateOpen(false);
      setForm({ sessionId: "", reasonCode: "", reasonId: null, notes: "", isPlanned: false });
      toast({ title: t("MESDowntimes.toxtashBoshlandi"), description: t("MESDowntimes.downtimeQaydQilindi") });
    },
    onError: () => toast({ title: t("MESDowntimes.xatolik"), variant: "destructive" }),
  });

  const endDowntimeMutation = useMutation({
    mutationFn: (id: string) => mesApi.endDowntime(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iot/downtime-events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/iot/production-sessions"] });
      toast({ title: t("MESDowntimes.toxtashYakunlandi") });
    },
    onError: () => toast({ title: t("MESDowntimes.xatolik"), variant: "destructive" }),
  });

  const handleSort = (field: DtSortField) => {
    if (sortField === field) {
      setSortDirection(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const filtered = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom).getTime() : null;
    const to = dateTo ? new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1 : null;
    const dir = sortDirection === "asc" ? 1 : -1;
    return (Array.isArray(downtimes) ? downtimes : []).filter(d => {
      if (filter === "planned" && !d.isPlanned) return false;
      if (filter === "unplanned" && d.isPlanned) return false;
      const startedMs = new Date(d.startedAt).getTime();
      if (from != null && startedMs < from) return false;
      if (to != null && startedMs > to) return false;
      return true;
    }).sort((a, b) => {
      const av = sortField === "durationSeconds" ? (a.durationSeconds || 0) : new Date(a.startedAt).getTime();
      const bv = sortField === "durationSeconds" ? (b.durationSeconds || 0) : new Date(b.startedAt).getTime();
      return (av - bv) * dir;
    });
  }, [downtimes, filter, dateFrom, dateTo, sortField, sortDirection]);

  const totalMins = Math.round((Array.isArray(downtimes) ? downtimes : []).reduce((a, d) => a + (d.durationSeconds || 0), 0) / 60);
  const unplanned = (Array.isArray(downtimes) ? downtimes : []).filter(d => !d.isPlanned);
  const unplannedMins = Math.round((Array.isArray(unplanned) ? unplanned : []).reduce((a, d) => a + (d.durationSeconds || 0), 0) / 60);
  const activeDowntimes = (Array.isArray(downtimes) ? downtimes : []).filter(d => !d.endedAt);

  const reasonCounts = downtimes.reduce<Record<string, number>>((acc, d) => {
    const key = d.reasonCode; acc[key] = (acc[key] || 0) + 1; return acc;
  }, {});
  const topReasons = Object.entries(reasonCounts).sort(([, a], [, b]) => b - a).slice(0, 5);

  // Faqat workCenterId mavjud bo'lgan hodisalar hisoblanadi — Q-40 (bo'sh/noma'lum
  // mashina uchun soxta "0-ID" guruh yaratilmaydi).
  const machineStats = downtimes.reduce<Record<string, { count: number; mins: number }>>((acc, d) => {
    if (!d.workCenterId) return acc;
    const key = String(d.workCenterId);
    if (!acc[key]) acc[key] = { count: 0, mins: 0 };
    acc[key].count += 1;
    acc[key].mins += Math.round((d.durationSeconds || 0) / 60);
    return acc;
  }, {});
  const topMachines = Object.entries(machineStats).sort(([, a], [, b]) => b.count - a.count).slice(0, 5);

  const exportRows = (): Record<string, unknown>[] => filtered.map(d => ({
    workCenterId: d.workCenterId ? String(d.workCenterId).slice(0, 8) : "",
    reason: d.reasonDescription || reasonName(d.reasonCode),
    status: !d.endedAt ? t("MESDowntimes.aktiv") : d.isPlanned ? t("MESDowntimes.rejalashtirilganStatus") : t("MESDowntimes.rejalanmaganStatus"),
    startedAt: new Date(d.startedAt).toLocaleString("uz-UZ"),
    duration: d.durationSeconds ? fmtSecs(d.durationSeconds) : "",
    notes: d.notes || "",
  }));

  const handleExportCsv = () => exportToCSV(exportRows(), "mes_toxtashlar", [
    { key: "workCenterId", label: t("ishMarkazi") },
    { key: "reason", label: t("sabab") },
    { key: "status", label: t("holat") },
    { key: "startedAt", label: t("boshlanishVaqti") },
    { key: "duration", label: t("davomiylik") },
    { key: "notes", label: t("Izoh") },
  ]);

  const handleExportExcel = () => exportToExcel(exportRows(), "mes_toxtashlar", [
    { header: t("ishMarkazi"), accessor: (r) => String(r["workCenterId"] ?? "") },
    { header: t("sabab"), accessor: (r) => String(r["reason"] ?? "") },
    { header: t("holat"), accessor: (r) => String(r["status"] ?? "") },
    { header: t("boshlanishVaqti"), accessor: (r) => String(r["startedAt"] ?? "") },
    { header: t("davomiylik"), accessor: (r) => String(r["duration"] ?? "") },
    { header: t("Izoh"), accessor: (r) => String(r["notes"] ?? "") },
  ]);

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
              {t("MESDowntimes.aktivToxtash", { count: activeDowntimes.length })}
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
          { label: t("MESDowntimes.jamiToxtash"), value: downtimes.length, icon: AlertTriangle, color: "text-[var(--ep-yellow)]" },
          { label: t("MESDowntimes.jamiVaqt"), value: `${totalMins} ${t("MESDowntimes.daq")}`, icon: Timer, color: "text-foreground" },
          { label: t("MESDowntimes.rejalanmaganKpi"), value: unplanned.length, icon: AlertTriangle, color: "text-[var(--ep-red)]" },
          { label: t("MESDowntimes.rejalanmaganVaqt"), value: `${unplannedMins} ${t("MESDowntimes.daq")}`, icon: Clock, color: "text-[var(--ep-red)]" },
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

      {/* Tahlil */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-2">{t("toxtashTahlili")}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t("topSabablar")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(Array.isArray(topReasons) ? topReasons : []).map(([code, cnt]) => (
                <div key={code} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-foreground truncate flex-1">{reasonName(code)}</span>
                  <EPStatusPill tone="neutral" className="text-[10px] shrink-0">{cnt}</EPStatusPill>
                </div>
              ))}
              {topReasons.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">{t("malumotYoq")}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t("engKopToxtaganMashina")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(Array.isArray(topMachines) ? topMachines : []).map(([wcId, stat]) => (
                <div key={wcId} className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-foreground truncate flex-1">{wcId.slice(0, 8)}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{stat.mins} {t("MESDowntimes.daq")}</span>
                  <EPStatusPill tone="neutral" className="text-[10px] shrink-0">{stat.count}</EPStatusPill>
                </div>
              ))}
              {topMachines.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">{t("malumotYoq")}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card data-testid="card-downtimes-table">
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5" /> {t("toxtashlar")}
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleExportCsv} disabled={filtered.length === 0} data-testid="button-export-dt-csv">
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportExcel} disabled={filtered.length === 0} data-testid="button-export-dt-excel">
              <Download className="h-4 w-4 mr-1" /> Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end gap-2 flex-wrap">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("holat")}</Label>
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
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("danSana")}</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 w-40" data-testid="input-dt-from" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("gachaSana")}</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 w-40" data-testid="input-dt-to" />
            </div>
            <span className="text-xs text-muted-foreground pb-2">{t("MESDowntimes.taHodisa", { count: filtered.length })}</span>
          </div>

          {isLoading ? (
            <div className="space-y-2">{([1, 2, 3, 4, 5]).map(i => <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-[13px] text-muted-foreground">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
              <p>{t("toxtashTopilmadi")}</p>
            </div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead><div className="flex items-center gap-1"><Factory className="h-3 w-3" /> {t("ishMarkazi")}</div></TableHead>
                  <TableHead>{t("sabab")}</TableHead>
                  <TableHead>{t("holat")}</TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("startedAt")} data-testid="th-dt-started">
                    <div className="flex items-center gap-1">{t("boshlanishVaqti")} <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("durationSeconds")} data-testid="th-dt-duration">
                    <div className="flex items-center gap-1">{t("davomiylik")} <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead>{t("Izoh")}</TableHead>
                  <TableHead className="text-right">{t("amallar")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(filtered) ? filtered : []).map(d => {
                  const start = new Date(d.startedAt);
                  const isActive = !d.endedAt;
                  return (
                    <TableRow key={d.id} className="hover:bg-muted/40 transition-colors" data-testid={`row-dt-${d.id}`}>
                      <TableCell className="font-mono text-xs">{d.workCenterId ? String(d.workCenterId).slice(0, 8) : "—"}</TableCell>
                      <TableCell className="font-medium text-sm">{d.reasonDescription || reasonName(d.reasonCode)}</TableCell>
                      <TableCell>
                        <span className={cn("text-[10px] font-medium",
                          isActive ? "text-[var(--ep-red)] font-bold" :
                          d.isPlanned ? "text-[var(--ep-blue)]" : "text-[var(--ep-red)]"
                        )}>
                          {isActive ? `⚡ ${t("MESDowntimes.aktiv")}` : d.isPlanned ? t("MESDowntimes.rejalashtirilganStatus") : t("MESDowntimes.rejalanmaganStatus")}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {start.toLocaleDateString("uz-UZ")} {start.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {d.durationSeconds ? (
                          <span className="flex items-center gap-1"><Timer className="w-2.5 h-2.5" /> {fmtSecs(d.durationSeconds)}</span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{d.notes || "—"}</TableCell>
                      <TableCell className="text-right">
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
                            {d.eventType === "planned_stop" ? t("MESDowntimes.rejalashtirilganStatus") : t("MESDowntimes.muammo")}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>

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
              <Select
                value={form.reasonCode}
                onValueChange={v => {
                  const picked = (Array.isArray(reasonRows) ? reasonRows : []).find(r => String(r.code) === v);
                  setForm(p => ({ ...p, reasonCode: v, reasonId: picked?.id != null ? Number(picked.id) : null }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("MESDowntimes.sababniTanlang", "Sababni tanlang")} />
                </SelectTrigger>
                <SelectContent>
                  {reasonsLoading ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">{t("loading", "Yuklanmoqda...")}</div>
                  ) : (Array.isArray(reasonRows) ? reasonRows : []).length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">{t("malumotYoq")}</div>
                  ) : (
                    (Array.isArray(reasonRows) ? reasonRows : [])
                      .filter(r => r.code)
                      .map(r => (
                        <SelectItem key={String(r.id ?? r.code)} value={String(r.code)}>
                          {r.name || r.code}
                        </SelectItem>
                      ))
                  )}
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
              disabled={startDowntimeMutation.isPending || !form.sessionId || !form.reasonCode}
            >
              {t("qaydEtish")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
