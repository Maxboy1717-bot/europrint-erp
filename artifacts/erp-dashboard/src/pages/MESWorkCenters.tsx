import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { mesApi } from "@/lib/api/mes";
import { ppApi } from "@/lib/api/pp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Factory, Gauge, Timer, Play, PauseCircle, CheckCircle,
  AlertTriangle, Plus, StopCircle, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Session {
  id: string;
  sessionNumber: string;
  equipmentId: string;
  equipmentName?: string;
  status: string;
  targetQuantity: number;
  actualQuantity: number;
  defectQuantity: number;
  runningTimeSeconds: number;
  stoppedTimeSeconds: number;
  oee?: number;
  orderNumber?: string;
  workerId?: string;
}

function oeeColor(v: number) {
  if (v >= 0.85) return "text-emerald-600";
  if (v >= 0.70) return "text-amber-600";
  return "text-red-600";
}

function statusBadge(s: string) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    running: { label: "Ishlamoqda", variant: "default" },
    active: { label: "Aktiv", variant: "default" },
    paused: { label: "To'xtatildi", variant: "secondary" },
    stopped: { label: "To'xtadi", variant: "destructive" },
    pending: { label: "Kutilmoqda", variant: "outline" },
    completed: { label: "Tugadi", variant: "secondary" },
  };
  return map[s] ?? { label: s, variant: "outline" as const };
}

function fmtSecs(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}s ${m}d` : `${m} daq`;
}

export default function MESWorkCenters() {
  const { toast } = useToast();
  const [createWCOpen, setCreateWCOpen] = useState(false);
  const [createSessionOpen, setCreateSessionOpen] = useState(false);
  const [wcForm, setWcForm] = useState({ name: "", code: "", type: "machine", capacity: "" });
  const [sessionForm, setSessionForm] = useState({ equipmentId: "", targetQuantity: "", orderNumber: "" });

  const { data: raw, isLoading, refetch } = useQuery<Session[]>({
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

  const createWCMutation = useMutation({
    mutationFn: (data: typeof wcForm) =>
      ppApi.createWorkCenter({ ...data, capacity: Number(data.capacity) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pp/work-centers"] });
      setCreateWCOpen(false);
      setWcForm({ name: "", code: "", type: "machine", capacity: "" });
      toast({ title: "Ish markazi yaratildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const createSessionMutation = useMutation({
    mutationFn: (data: typeof sessionForm) =>
      mesApi.createSession({
        equipmentId: data.equipmentId,
        targetQuantity: Number(data.targetQuantity),
        orderNumber: data.orderNumber,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iot/production-sessions"] });
      setCreateSessionOpen(false);
      setSessionForm({ equipmentId: "", targetQuantity: "", orderNumber: "" });
      toast({ title: "Sessiya yaratildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const byEquipment = sessions.reduce<Record<string, Session[]>>((acc, s) => {
    if (!acc[s.equipmentId]) acc[s.equipmentId] = [];
    acc[s.equipmentId].push(s);
    return acc;
  }, {});

  const equipmentList = Object.entries(byEquipment).map(([eqId, ss]) => {
    const latest = ss.sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime())[0];
    const totalProduced = (ss ?? []).reduce((a, s) => a + (s.actualQuantity || 0), 0);
    const totalTarget = (ss ?? []).reduce((a, s) => a + (s.targetQuantity || 0), 0);
    const totalDefects = (ss ?? []).reduce((a, s) => a + (s.defectQuantity || 0), 0);
    const totalRunning = (ss ?? []).reduce((a, s) => a + (s.runningTimeSeconds || 0), 0);
    const oeeVals = (ss ?? []).filter(s => s.oee != null).map(s => s.oee!);
    const avgOee = oeeVals.length ? (Array.isArray(oeeVals) ? oeeVals : []).reduce((a, v) => a + v, 0) / oeeVals.length : null;
    const progress = totalTarget > 0 ? Math.min(100, Math.round((totalProduced / totalTarget) * 100)) : 0;
    return { eqId, name: latest.equipmentName || eqId, latest, totalProduced, totalTarget, totalDefects, totalRunning, avgOee, progress, sessionCount: ss.length };
  });

  const running = (Array.isArray(equipmentList) ? equipmentList : []).filter(e => e.latest.status === "running" || e.latest.status === "active").length;
  const stopped = (Array.isArray(equipmentList) ? equipmentList : []).filter(e => e.latest.status === "stopped" || e.latest.status === "paused").length;

  return (
    <div className="flex-1 overflow-auto p-5 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ish markazlari</h1>
          <p className="text-sm text-muted-foreground">Barcha uskunalar va ularning holati</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="gap-1.5">
            <Play className="w-3 h-3 text-emerald-500" /> {running} faol
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <AlertTriangle className="w-3 h-3 text-red-500" /> {stopped} to'xtagan
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <Factory className="w-3 h-3 text-muted-foreground" /> {equipmentList.length} jami
          </Badge>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Yangilash
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCreateWCOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Ish markazi
          </Button>
          <Button size="sm" onClick={() => setCreateSessionOpen(true)}>
            <Play className="h-4 w-4 mr-1" /> Yangi sessiya
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {([1, 2, 3, 4, 5, 6]).map(i => <Skeleton key={`k-${i}`} className="h-52 rounded-xl" />)}
        </div>
      ) : equipmentList.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Factory className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Sessiya topilmadi</p>
          <Button className="mt-4" onClick={() => setCreateSessionOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Sessiya yaratish
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Array.isArray(equipmentList) ? equipmentList : []).map(eq => {
            const sb = statusBadge(eq.latest.status);
            const isRunning = eq.latest.status === "running" || eq.latest.status === "active";
            const isPaused = eq.latest.status === "paused";
            const isStopped = eq.latest.status === "stopped";
            const defectRate = eq.totalProduced > 0 ? ((eq.totalDefects / eq.totalProduced) * 100).toFixed(1) : "0";
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
                          isRunning ? "text-emerald-600" :
                          isStopped ? "text-red-500" : "text-muted-foreground"
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
                      <span className="text-muted-foreground">Bajarilish</span>
                      <span className="font-semibold">{eq.progress}%</span>
                    </div>
                    <Progress value={eq.progress} className="h-2" />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>{eq.totalProduced.toLocaleString()} / {eq.totalTarget.toLocaleString()} dona</span>
                      <span>Brak: {defectRate}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
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
                      <p className="text-[10px] text-muted-foreground">Ish vaqti</p>
                    </div>
                    <div className="text-center">
                      <CheckCircle className="w-3 h-3 text-muted-foreground mx-auto mb-0.5" />
                      <p className="text-sm font-bold text-foreground">{eq.sessionCount}</p>
                      <p className="text-[10px] text-muted-foreground">Sessiya</p>
                    </div>
                  </div>

                  {eq.latest.orderNumber && (
                    <div className="pt-1 border-t">
                      <p className="text-[10px] text-muted-foreground">Joriy buyurtma</p>
                      <p className="text-xs font-medium text-foreground">{eq.latest.orderNumber}</p>
                    </div>
                  )}

                  {/* Session control buttons */}
                  <div className="flex gap-1 pt-1 border-t">
                    {isRunning && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 text-xs"
                          onClick={() => pauseSessionMutation.mutate(eq.latest.id)}
                          disabled={pauseSessionMutation.isPending}
                        >
                          <PauseCircle className="h-3 w-3 mr-1" />
                          To'xtat
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 text-xs"
                          onClick={() => completeSessionMutation.mutate(eq.latest.id)}
                          disabled={completeSessionMutation.isPending}
                        >
                          <StopCircle className="h-3 w-3 mr-1" />
                          Yakunla
                        </Button>
                      </>
                    )}
                    {isPaused && (
                      <Button
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        onClick={() => resumeSessionMutation.mutate(eq.latest.id)}
                        disabled={resumeSessionMutation.isPending}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Davom ettir
                      </Button>
                    )}
                    {isStopped && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-xs"
                        onClick={() => createSessionMutation.mutate({ equipmentId: eq.eqId, targetQuantity: String(eq.totalTarget), orderNumber: eq.latest.orderNumber || "" })}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Yangi sessiya
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Work Center Dialog */}
      <Dialog open={createWCOpen} onOpenChange={setCreateWCOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ish markazi yaratish</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nomi</Label>
              <Input value={wcForm.name} onChange={e => setWcForm(p => ({ ...p, name: e.target.value }))} placeholder="Ish markazi nomi" />
            </div>
            <div className="space-y-2">
              <Label>Kodi</Label>
              <Input value={wcForm.code} onChange={e => setWcForm(p => ({ ...p, code: e.target.value }))} placeholder="WC-001" />
            </div>
            <div className="space-y-2">
              <Label>Turi</Label>
              <Select value={wcForm.type} onValueChange={v => setWcForm(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="machine">Mashina</SelectItem>
                  <SelectItem value="manual">Qo'lda</SelectItem>
                  <SelectItem value="assembly">Yig'ish</SelectItem>
                  <SelectItem value="quality">Sifat nazorat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quvvat (soat/smena)</Label>
              <Input type="number" value={wcForm.capacity} onChange={e => setWcForm(p => ({ ...p, capacity: e.target.value }))} placeholder="8" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateWCOpen(false)}>Bekor qilish</Button>
            <Button onClick={() => createWCMutation.mutate(wcForm)} disabled={createWCMutation.isPending || !wcForm.name}>Yaratish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Session Dialog */}
      <Dialog open={createSessionOpen} onOpenChange={setCreateSessionOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yangi sessiya yaratish</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Uskunа ID</Label>
              <Input value={sessionForm.equipmentId} onChange={e => setSessionForm(p => ({ ...p, equipmentId: e.target.value }))} placeholder="EQ-001" />
            </div>
            <div className="space-y-2">
              <Label>Maqsadli miqdor</Label>
              <Input type="number" value={sessionForm.targetQuantity} onChange={e => setSessionForm(p => ({ ...p, targetQuantity: e.target.value }))} placeholder="100" />
            </div>
            <div className="space-y-2">
              <Label>Buyurtma raqami</Label>
              <Input value={sessionForm.orderNumber} onChange={e => setSessionForm(p => ({ ...p, orderNumber: e.target.value }))} placeholder="PP-2026-001" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateSessionOpen(false)}>Bekor qilish</Button>
            <Button onClick={() => createSessionMutation.mutate(sessionForm)} disabled={createSessionMutation.isPending || !sessionForm.equipmentId}>Yaratish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
