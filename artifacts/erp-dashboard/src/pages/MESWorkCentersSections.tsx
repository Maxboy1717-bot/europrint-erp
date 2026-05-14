/**
 * MESWorkCentersSections.tsx
 * Equipment card grid and header section for MESWorkCenters
 */
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { mesApi } from "@/lib/api/mes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Factory, Gauge, Timer, Play, PauseCircle, CheckCircle,
  AlertTriangle, Plus, StopCircle, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from '@/lib/i18n';
import {
  EquipmentSummary, SessionFormState, oeeColor, statusBadge, fmtSecs,
} from "./MESWorkCentersTypes";

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
  const { toast } = useToast();

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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={`k-${i}`} className="h-52 rounded-lg" />
        ))}
      </div>
    );
  }

  if (equipmentList.length === 0) {
    return (
      <div className="text-center py-20 text-[13px] text-muted-foreground">
        <Factory className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>{t("sessiyaTopilmadi")}</p>
        <Button className="mt-4 gap-2" onClick={onCreateSession}>
          <Plus className="h-4 w-4" /> {t("sessiyaYaratish")}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {(Array.isArray(equipmentList) ? equipmentList : []).map(eq => {
        const sb         = statusBadge(eq.latest.status);
        const isRunning  = eq.latest.status === "running" || eq.latest.status === "active";
        const isPaused   = eq.latest.status === "paused";
        const isStopped  = eq.latest.status === "stopped";
        const defectRate = eq.totalProduced > 0
          ? ((eq.totalDefects / eq.totalProduced) * 100).toFixed(1)
          : "0";

        return (
          <Card key={eq.eqId} className={cn(
            "border",
            isRunning ? "border-emerald-200 dark:border-emerald-800" :
            isStopped ? "border-red-200 dark:border-red-800" : ""
          )}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    isRunning ? "bg-emerald-100 dark:bg-emerald-900/30" :
                    isStopped ? "bg-red-100 dark:bg-red-900/30" : "bg-muted"
                  )}>
                    <Factory className={cn("w-4 h-4",
                      isRunning ? "text-[var(--ep-green)]" :
                      isStopped ? "text-[var(--ep-red)]" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-sm truncate">{eq.name}</CardTitle>
                    <p className="text-[10px] text-muted-foreground">{eq.eqId}</p>
                  </div>
                </div>
                <Badge variant={sb.variant} className="shrink-0 text-[10px]">{sb.label}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{t("progress5")}</span>
                  <span className="font-semibold">{eq.progress}%</span>
                </div>
                <Progress value={eq.progress} className="h-2" />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>{eq.totalProduced.toLocaleString()} / {eq.totalTarget.toLocaleString()} dona</span>
                  <span>Brak: {defectRate}%</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                <div className="text-center">
                  <Gauge className="w-3 h-3 text-muted-foreground mx-auto mb-0.5" />
                  <p className={cn("text-sm font-bold", eq.avgOee ? oeeColor(eq.avgOee) : "text-muted-foreground")}>
                    {eq.avgOee ? `${Math.round(eq.avgOee * 100)}%` : "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">OEE</p>
                </div>
                <div className="text-center">
                  <Timer className="w-3 h-3 text-muted-foreground mx-auto mb-0.5" />
                  <p className="text-sm font-bold text-foreground">{fmtSecs(eq.totalRunning)}</p>
                  <p className="text-[10px] text-muted-foreground">{t("ishVaqti")}</p>
                </div>
                <div className="text-center">
                  <CheckCircle className="w-3 h-3 text-muted-foreground mx-auto mb-0.5" />
                  <p className="text-sm font-bold text-foreground">{eq.sessionCount}</p>
                  <p className="text-[10px] text-muted-foreground">{t("sessiya")}</p>
                </div>
              </div>

              {eq.latest.orderNumber && (
                <div className="pt-1 border-t">
                  <p className="text-[10px] text-muted-foreground">{t("joriyBuyurtma")}</p>
                  <p className="text-xs font-medium text-foreground">{eq.latest.orderNumber}</p>
                </div>
              )}

              <div className="flex gap-1 pt-1 border-t">
                {isRunning && (
                  <>
                    <Button
                      size="sm" variant="outline" className="flex-1 h-7 text-xs"
                      onClick={() => pauseSessionMutation.mutate(eq.latest.id)}
                      disabled={pauseSessionMutation.isPending}
                    >
                      <PauseCircle className="h-3 w-3 mr-1" /> {t("toxtat")}
                    </Button>
                    <Button
                      size="sm" variant="outline" className="flex-1 h-7 text-xs"
                      onClick={() => completeSessionMutation.mutate(eq.latest.id)}
                      disabled={completeSessionMutation.isPending}
                    >
                      <StopCircle className="h-3 w-3 mr-1" /> {t("yakunla")}
                    </Button>
                  </>
                )}
                {isPaused && (
                  <Button
                    size="sm" className="flex-1 h-7 text-xs"
                    onClick={() => resumeSessionMutation.mutate(eq.latest.id)}
                    disabled={resumeSessionMutation.isPending}
                  >
                    <Play className="h-3 w-3 mr-1" /> {t("davomEttir")}
                  </Button>
                )}
                {isStopped && (
                  <Button
                    size="sm" variant="outline" className="flex-1 h-7 text-xs"
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
