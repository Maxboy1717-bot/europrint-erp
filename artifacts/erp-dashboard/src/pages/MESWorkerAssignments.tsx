/**
 * @module MESWorkerAssignments
 * @description React page component. Route-level UI.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { mesApi } from "@/lib/api/mes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Users, Factory, Gauge, Timer, CheckCircle, AlertTriangle, Play, PauseCircle, StopCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from '@/lib/i18n';

interface Session {
  id: string;
  sessionNumber: string;
  productionOrderId: string;
  equipmentId: string;
  equipmentName?: string;
  workerId: string;
  status: string;
  targetQuantity: number;
  actualQuantity: number;
  defectQuantity: number;
  runningTimeSeconds: number;
  stoppedTimeSeconds: number;
  oee?: number;
  orderNumber?: string;
  startedAt?: string;
}

function oeeColor(v: number) {
  if (v >= 0.85) return "text-[var(--ep-green)]";
  if (v >= 0.70) return "text-[var(--ep-yellow)]";
  return "text-[var(--ep-red)]";
}

function statusDot(s: string) {
  const colors: Record<string, string> = {
    running: "bg-emerald-500", active: "bg-emerald-500",
    paused: "bg-amber-500", stopped: "bg-red-500",
    pending: "bg-muted-foreground", completed: "bg-blue-500",
  };
  return colors[s] ?? "bg-muted-foreground";
}

function statusLabel(s: string) {
  const labels: Record<string, string> = {
    running: "Ishlamoqda", active: "Aktiv", paused: "To'xtatildi",
    stopped: "To'xtadi", pending: "Kutilmoqda", completed: "Tugadi",
  };
  return labels[s] ?? s;
}

function fmt(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}s ${m}d` : `${m} daq`;
}

export default function MESWorkerAssignments() {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  const { data: raw, isLoading } = useQuery<Session[]>({
    queryKey: ["/api/iot/production-sessions"],
    refetchInterval: 30000,
  });

  const sessions: Session[] = Array.isArray(raw) ? raw : [];

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

  // Xodimlar bo'yicha guruhlash
  const byWorker = sessions.reduce<Record<string, Session[]>>((acc, s) => {
    const key = s.workerId || "unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const workerList = Object.entries(byWorker).map(([wId, ss]) => {
    const active = (Array.isArray(ss) ? ss : []).filter(s => s.status === "running" || s.status === "active");
    const totalProduced = (Array.isArray(ss) ? ss : []).reduce((a, s) => a + (s.actualQuantity || 0), 0);
    const totalTarget   = (Array.isArray(ss) ? ss : []).reduce((a, s) => a + (s.targetQuantity || 0), 0);
    const totalDefects  = (Array.isArray(ss) ? ss : []).reduce((a, s) => a + (s.defectQuantity || 0), 0);
    const totalRunning  = (Array.isArray(ss) ? ss : []).reduce((a, s) => a + (s.runningTimeSeconds || 0), 0);
    const oeeVals       = (Array.isArray(ss) ? ss : []).filter(s => s.oee != null).map(s => s.oee as number);
    const avgOee        = oeeVals.length ? (Array.isArray(oeeVals) ? oeeVals : []).reduce((a, v) => a + v, 0) / oeeVals.length : null;
    const progress      = totalTarget > 0 ? Math.min(100, Math.round((totalProduced / totalTarget) * 100)) : 0;
    const isActive      = active.length > 0;
    const currentEquipment = active[0]?.equipmentName || active[0]?.equipmentId || null;
    const currentOrder     = active[0]?.orderNumber || null;
    return { wId, isActive, ss, active, totalProduced, totalTarget, totalDefects, totalRunning, avgOee, progress, currentEquipment, currentOrder };
  }).sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0));

  const activeWorkers = (Array.isArray(workerList) ? workerList : []).filter(w => w.isActive).length;

  return (
    <div className="flex flex-col flex-1 overflow-auto p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("xodimTayinlashlari")}</h1>
          <p className="text-sm text-muted-foreground">{t("xodimlarningJoriyVaOtganTayinlashlari")}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="gap-1.5">
            <Play className="w-3 h-3 text-[var(--ep-green)]" /> {activeWorkers} faol
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <Users className="w-3 h-3 text-muted-foreground" /> {workerList.length} xodim
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {([1,2,3,4,5,6]).map(i => <Skeleton key={`k-${i}`} className="h-48 rounded-lg" />)}
        </div>
      ) : workerList.length === 0 ? (
        <div className="text-center py-20 text-[13px] text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t("tayinlashTopilmadi")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Array.isArray(workerList) ? workerList : []).map(w => {
            const defectRate = w.totalProduced > 0
              ? ((w.totalDefects / w.totalProduced) * 100).toFixed(1)
              : "0";
            const latestStatus = w.ss[0]?.status ?? "pending";
            return (
              <Card
                key={w.wId}
                className={cn(
                  "border",
                  w.isActive
                    ? "border-emerald-200 dark:border-emerald-800"
                    : "border-border"
                )}
                data-testid={`card-worker-${w.wId}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold",
                        w.isActive
                          ? "bg-emerald-100 text-[var(--ep-green)] dark:bg-emerald-900/30"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {w.wId.slice(-2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Xodim {w.wId.slice(-6)}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn("w-1.5 h-1.5 rounded-full", statusDot(latestStatus))} />
                          <span className="text-[10px] text-muted-foreground">{statusLabel(latestStatus)}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {w.ss.length} sessiya
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {w.currentEquipment && (
                    <div className="flex items-center gap-2 text-xs bg-muted/40 rounded-md px-2.5 py-1.5">
                      <Factory className="w-3 h-3 text-primary shrink-0" />
                      <span className="text-foreground font-medium truncate">{w.currentEquipment}</span>
                      {w.currentOrder && (
                        <span className="text-muted-foreground truncate">· {w.currentOrder}</span>
                      )}
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{t("progress5")}</span>
                      <span className="font-semibold">{w.progress}%</span>
                    </div>
                    <Progress value={w.progress} className="h-1.5" />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>{w.totalProduced.toLocaleString()} / {w.totalTarget.toLocaleString()} dona</span>
                      <span>Brak: {defectRate}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 border-t">
                    <div className="text-center">
                      <p className={cn("text-sm font-bold",
                        w.avgOee ? oeeColor(w.avgOee) : "text-muted-foreground"
                      )}>
                        {w.avgOee ? `${Math.round(w.avgOee * 100)}%` : "—"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">OEE</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-foreground">{fmt(w.totalRunning)}</p>
                      <p className="text-[10px] text-muted-foreground">{t("ishVaqti")}</p>
                    </div>
                    <div className="text-center">
                      <p className={cn("text-sm font-bold",
                        Number(defectRate) > 5 ? "text-[var(--ep-red)]" : "text-foreground"
                      )}>
                        {defectRate}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">{t("Brak")}</p>
                    </div>
                  </div>

                  {/* Session control buttons for active session */}
                  {w.active.length > 0 && (() => {
                    const activeSession = w.active[0];
                    const isRunning = activeSession.status === "running" || activeSession.status === "active";
                    const isPaused = activeSession.status === "paused";
                    return (
                      <div className="flex gap-1 border-t pt-2">
                        {isRunning && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-7 text-xs"
                            onClick={() => pauseSessionMutation.mutate(activeSession.id)}
                            disabled={pauseSessionMutation.isPending}
                          >
                            <PauseCircle className="h-3 w-3 mr-1" />
                            {t("toxtat")}
                          </Button>
                        )}
                        {isPaused && (
                          <Button
                            size="sm"
                            className="flex-1 h-7 text-xs"
                            onClick={() => resumeSessionMutation.mutate(activeSession.id)}
                            disabled={resumeSessionMutation.isPending}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            {t("davomEttir")}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1 h-7 text-xs"
                          onClick={() => completeSessionMutation.mutate(activeSession.id)}
                          disabled={completeSessionMutation.isPending}
                        >
                          <StopCircle className="h-3 w-3 mr-1" />
                          {t("yakunla")}
                        </Button>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
