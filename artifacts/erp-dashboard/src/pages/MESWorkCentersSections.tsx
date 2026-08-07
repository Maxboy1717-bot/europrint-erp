/**
 * MESWorkCentersSections.tsx
 * Equipment card grid and header section for MESWorkCenters
 */
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { mesApi } from "@/lib/api/mes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Factory, Play, PauseCircle,
  AlertTriangle, Plus, StopCircle, RefreshCw, ArrowUpDown, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from '@/lib/i18n';
import { exportToCSV, exportToExcel } from "@/lib/export-utils";
import {
  EquipmentSummary, SessionFormState, oeeColor, statusBadge, fmtSecs,
} from "./MESWorkCentersTypes";

type EqSortField = "eqId" | "name" | "status" | "orderNumber" | "progress" | "avgOee" | "totalRunning" | "sessionCount";
type SortDirection = "asc" | "desc";

// ─── Page Header ──────────────────────────────────────────────────────────────

interface HeaderProps {
  running: number;
  stopped: number;
  total: number;
  onRefresh: () => void;
  onCreateWC: () => void;
  onCreateSession: () => void;
}

export function WorkCentersHeader({
  running, stopped, total, onRefresh, onCreateWC, onCreateSession,
}: HeaderProps) {
  const { t } = useTranslation("common");
  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("ishMarkazlari")}</h1>
        <p className="text-sm text-muted-foreground">{t("barchaUskunalarVaUlarningHolati")}</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="gap-1.5">
          <Play className="w-3 h-3 text-[var(--ep-green)]" /> {running} faol
        </Badge>
        <Badge variant="outline" className="gap-1.5">
          <AlertTriangle className="w-3 h-3 text-[var(--ep-red)]" /> {stopped} to'xtagan
        </Badge>
        <Badge variant="outline" className="gap-1.5">
          <Factory className="w-3 h-3 text-muted-foreground" /> {total} jami
        </Badge>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-1" /> {t("refresh")}
        </Button>
        <Button variant="outline" size="sm" onClick={onCreateWC}>
          <Plus className="h-4 w-4 mr-1" /> {t("ishMarkazi")}
        </Button>
        <Button size="sm" onClick={onCreateSession}>
          <Play className="h-4 w-4 mr-1" /> {t("yangiSessiya")}
        </Button>
      </div>
    </div>
  );
}

// ─── Equipment Grid ───────────────────────────────────────────────────────────

interface EquipmentGridProps {
  isLoading: boolean;
  equipmentList: EquipmentSummary[];
  onCreateSession: () => void;
  onNewSessionForStopped: (form: SessionFormState) => void;
}

export function EquipmentGrid({
  isLoading, equipmentList, onCreateSession, onNewSessionForStopped,
}: EquipmentGridProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [sortField, setSortField] = useState<EqSortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (field: EqSortField) => {
    if (sortField === field) {
      setSortDirection(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sorted = useMemo(() => {
    const dir = sortDirection === "asc" ? 1 : -1;
    const list = Array.isArray(equipmentList) ? equipmentList : [];
    return [...list].sort((a, b) => {
      const av = sortField === "status" ? a.latest.status
        : sortField === "orderNumber" ? (a.latest.orderNumber ?? "")
        : (a as unknown as Record<string, unknown>)[sortField];
      const bv = sortField === "status" ? b.latest.status
        : sortField === "orderNumber" ? (b.latest.orderNumber ?? "")
        : (b as unknown as Record<string, unknown>)[sortField];
      if (typeof av === "number" || typeof bv === "number") {
        return ((Number(av) || 0) - (Number(bv) || 0)) * dir;
      }
      return String(av ?? "").localeCompare(String(bv ?? "")) * dir;
    });
  }, [equipmentList, sortField, sortDirection]);

  const exportRows = (): Record<string, unknown>[] => sorted.map(eq => ({
    eqId: eq.eqId,
    name: eq.name,
    status: statusBadge(eq.latest.status).label,
    orderNumber: eq.latest.orderNumber ?? "",
    progress: eq.progress,
    oee: eq.avgOee != null ? Math.round(eq.avgOee * 100) : "",
    totalRunning: fmtSecs(eq.totalRunning),
    sessionCount: eq.sessionCount,
  }));

  const handleExportCsv = () => exportToCSV(exportRows(), "mes_ish_markazlari", [
    { key: "eqId", label: t("kodi") },
    { key: "name", label: t("nomiUz") },
    { key: "status", label: t("holat") },
    { key: "orderNumber", label: t("joriyBuyurtma") },
    { key: "progress", label: t("progress5") },
    { key: "oee", label: "OEE" },
    { key: "totalRunning", label: t("ishVaqti") },
    { key: "sessionCount", label: t("sessiya") },
  ]);

  const handleExportExcel = () => exportToExcel(exportRows(), "mes_ish_markazlari", [
    { header: t("kodi"), accessor: (r) => String(r["eqId"] ?? "") },
    { header: t("nomiUz"), accessor: (r) => String(r["name"] ?? "") },
    { header: t("holat"), accessor: (r) => String(r["status"] ?? "") },
    { header: t("joriyBuyurtma"), accessor: (r) => String(r["orderNumber"] ?? "") },
    { header: t("progress5"), accessor: (r) => Number(r["progress"] ?? 0) },
    { header: "OEE", accessor: (r) => r["oee"] === "" ? "" : Number(r["oee"]) },
    { header: t("ishVaqti"), accessor: (r) => String(r["totalRunning"] ?? "") },
    { header: t("sessiya"), accessor: (r) => Number(r["sessionCount"] ?? 0) },
  ]);

  const pauseSessionMutation = useMutation({
    mutationFn: (id: string) => mesApi.pauseSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iot/production-sessions"] });
      toast({ title: "Sessiya to'xtatildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const resumeSessionMutation = useMutation({
    mutationFn: (id: string) => mesApi.resumeSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iot/production-sessions"] });
      toast({ title: "Sessiya davom ettirildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const completeSessionMutation = useMutation({
    mutationFn: (id: string) => mesApi.completeSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iot/production-sessions"] });
      toast({ title: "Sessiya yakunlandi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const sortHead = (field: EqSortField, label: string, alignRight = false) => (
    <TableHead
      className={cn("cursor-pointer hover:bg-muted/50", alignRight && "text-right")}
      onClick={() => handleSort(field)}
      data-testid={`th-eq-${field}`}
    >
      <div className={cn("flex items-center gap-1", alignRight && "justify-end")}>
        {label} <ArrowUpDown className="h-3 w-3" />
      </div>
    </TableHead>
  );

  return (
    <Card data-testid="card-equipment-table">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Factory className="h-5 w-5" /> {t("ishMarkazlari")}
        </CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleExportCsv} disabled={sorted.length === 0} data-testid="button-export-eq-csv">
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportExcel} disabled={sorted.length === 0} data-testid="button-export-eq-excel">
            <Download className="h-4 w-4 mr-1" /> Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20 text-[13px] text-muted-foreground">
            <Factory className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{t("sessiyaTopilmadi")}</p>
            <Button className="mt-4 gap-2" onClick={onCreateSession}>
              <Plus className="h-4 w-4" /> {t("sessiyaYaratish")}
            </Button>
          </div>
        ) : (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                {sortHead("eqId", t("kodi"))}
                {sortHead("name", t("nomiUz"))}
                {sortHead("status", t("holat"))}
                {sortHead("orderNumber", t("joriyBuyurtma"))}
                {sortHead("progress", t("progress5"))}
                {sortHead("avgOee", "OEE", true)}
                {sortHead("totalRunning", t("ishVaqti"), true)}
                {sortHead("sessionCount", t("sessiya"), true)}
                <TableHead className="text-right">{t("amallar")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(eq => {
                const sb         = statusBadge(eq.latest.status);
                const isRunning  = eq.latest.status === "running" || eq.latest.status === "active";
                const isPaused   = eq.latest.status === "paused";
                const isStopped  = eq.latest.status === "stopped";
                const defectRate = eq.totalProduced > 0
                  ? ((eq.totalDefects / eq.totalProduced) * 100).toFixed(1)
                  : "0";

                return (
                  <TableRow key={eq.eqId} className="hover:bg-muted/40 transition-colors" data-testid={`row-eq-${eq.eqId}`}>
                    <TableCell className="font-mono text-xs">{eq.eqId}</TableCell>
                    <TableCell className="font-medium">{eq.name}</TableCell>
                    <TableCell><Badge variant={sb.variant} className="text-[10px]">{sb.label}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{eq.latest.orderNumber || "—"}</TableCell>
                    <TableCell className="min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <Progress value={eq.progress} className="h-2 flex-1" />
                        <span className="text-xs font-semibold w-9 text-right">{eq.progress}%</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                        <span>{eq.totalProduced.toLocaleString()}/{eq.totalTarget.toLocaleString()}</span>
                        <span>Brak: {defectRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell className={cn("text-right font-semibold", eq.avgOee ? oeeColor(eq.avgOee) : "text-muted-foreground")}>
                      {eq.avgOee ? `${Math.round(eq.avgOee * 100)}%` : "—"}
                    </TableCell>
                    <TableCell className="text-right text-xs">{fmtSecs(eq.totalRunning)}</TableCell>
                    <TableCell className="text-right text-xs">{eq.sessionCount}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {isRunning && (
                          <>
                            <Button
                              size="sm" variant="outline" className="h-7 text-xs"
                              onClick={() => pauseSessionMutation.mutate(eq.latest.id)}
                              disabled={pauseSessionMutation.isPending}
                            >
                              <PauseCircle className="h-3 w-3 mr-1" /> {t("toxtat")}
                            </Button>
                            <Button
                              size="sm" variant="outline" className="h-7 text-xs"
                              onClick={() => completeSessionMutation.mutate(eq.latest.id)}
                              disabled={completeSessionMutation.isPending}
                            >
                              <StopCircle className="h-3 w-3 mr-1" /> {t("yakunla")}
                            </Button>
                          </>
                        )}
                        {isPaused && (
                          <Button
                            size="sm" className="h-7 text-xs"
                            onClick={() => resumeSessionMutation.mutate(eq.latest.id)}
                            disabled={resumeSessionMutation.isPending}
                          >
                            <Play className="h-3 w-3 mr-1" /> {t("davomEttir")}
                          </Button>
                        )}
                        {isStopped && (
                          <Button
                            size="sm" variant="outline" className="h-7 text-xs"
                            onClick={() => onNewSessionForStopped({
                              equipmentId: eq.eqId,
                              targetQuantity: String(eq.totalTarget),
                              orderNumber: eq.latest.orderNumber || "",
                            })}
                          >
                            <Play className="h-3 w-3 mr-1" /> {t("yangiSessiya")}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table></div>
        )}
      </CardContent>
    </Card>
  );
}
