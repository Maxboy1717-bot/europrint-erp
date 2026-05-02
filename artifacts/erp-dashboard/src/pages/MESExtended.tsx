import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest , selectArray } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import {
  Activity, AlertTriangle, Map, Wrench, Trophy, Cpu,
  Plus, Settings, RefreshCw, ClipboardList, Clock,
  type LucideIcon
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { PillTabs } from "@/components/ui/pill-tabs";

interface MESMachine {
    id: number | string;
    name?: string;
    machineName?: string;
    machineId?: number | string;
    status?: string;
    oee?: number | string;
    location?: string;
    availability?: number | string;
    avail?: number | string;
    performance?: number | string;
    perf?: number | string;
    quality?: number | string;
    qual?: number | string;
  }
interface MESShift {
  shiftName?: string;
  operatorName?: string;
  producedQty?: number | string;
  brakQty?: number | string;
  oee?: number | string;
  startTime?: string;
  machineStatus?: string;
  notes?: string;
}
interface MESTask {
    id: number | string;
    title?: string;
    name?: string;
    taskName?: string;
    orderNumber?: string;
    status?: string;
    priority?: string;
    machineId?: number | string;
    machineName?: string;
    quantity?: number;
    plannedQuantity?: number;
    scheduledDate?: string;
    createdAt?: string;
    dueDate?: string;
  }
interface MaintenanceRequest {
    id: number | string;
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    machineId?: number | string;
    equipmentId?: number | string;
    issue?: string;
    createdAt?: string;
    resolvedAt?: string;
  }
interface DowntimeReason {
    id?: number | string;
    reason?: string;
    name?: string;
    type?: string;
    duration?: number;
    avgDuration?: number;
    pct?: number;
    count?: number;
  }
interface MESLeaderboard {
    id?: number | string;
    name?: string;
    fullName?: string;
    username?: string;
    department?: string;
    score?: number | string;
    points?: number | string;
    tasks?: number | string;
    completedTasks?: number | string;
    efficiency?: number | string;
    quality?: number | string;
    qualityRate?: number | string;
  }

const URL_TAB_MAP: Record<string, string> = {
  "/mes/oee-monitor": "oee",
  "/mes/reason-log": "reasons",
  "/mes/zone-management": "zones",
  "/mes/maintenance-request": "maintenance",
  "/mes/gamification": "gamification",
  "/mes/machine-norms": "norms",
  "/mes/smena-handover": "smena",
};

const tabMeta: Record<string, { title: string; icon: LucideIcon }> = {
  "oee": { title: "OEE Monitoring", icon: Activity },
  "reasons": { title: "To'xtash Sabablar", icon: AlertTriangle },
  "zones": { title: "Ishlab Chiqarish Vazifalari", icon: ClipboardList },
  "maintenance": { title: "Texnik Xizmat", icon: Wrench },
  "gamification": { title: "Gamifikatsiya", icon: Trophy },
  "norms": { title: "Uskuna Normalari", icon: Settings },
  "smena": { title: "Smena O'tkazish", icon: Clock },
};

export default function MESExtended() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState(URL_TAB_MAP[location] || "oee");

  useEffect(() => {
    const tab = URL_TAB_MAP[location];
    if (tab) setActiveTab(tab);
  }, [location]);
    const meta = tabMeta[activeTab] || tabMeta["oee"];

  const { toast } = useToast();
  const [showMaintDialog, setShowMaintDialog] = useState(false);

  const maintForm = useForm({ defaultValues: { machineId: "", issue: "", priority: "medium" } });

  // Real API queries
  const { data: oeeData, isLoading: oeeLoading, refetch: refetchOee } = useQuery<Record<string, unknown>>({
    queryKey: ["/api/mes/oee"]
  });

  const { data: maintenanceRequests = [], isLoading: maintLoading, refetch: refetchMaint } = useQuery<MaintenanceRequest[]>({
    queryKey: ["/api/mes/maintenance-requests"],
    select: selectArray<MaintenanceRequest>,
  });

  const { data: leaderboard = [], isLoading: lbLoading } = useQuery<MESLeaderboard[]>({
    queryKey: ["/api/mes/gamification/leaderboard"],
    select: selectArray<MESLeaderboard>,
  });

  const { data: mesStats } = useQuery<Record<string, unknown>>({
    queryKey: ["/api/mes/stats"]
  });

  const { data: downtimeReasons = [] } = useQuery<Record<string, unknown>[]>({
    queryKey: ["/api/mes/downtime-reasons"],
    select: selectArray,
  });

  const { data: currentShift } = useQuery<MESShift>({
    queryKey: ["/api/mes/shifts/current"]
  });

  const { data: mesTasks = [], isLoading: tasksLoading } = useQuery<MESTask[]>({
    queryKey: ["/api/mes/tasks"],
    select: selectArray<MESTask>,
  });

  const createMaint = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/mes/maintenance-requests", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mes/maintenance-requests"] });
      setShowMaintDialog(false);
      maintForm.reset();
      toast({ title: "Texnik xizmat so'rovi yuborildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  // Derived stats from real data
  const machines = Array.isArray(oeeData?.machines) ? oeeData.machines : [];
  const avgOee = machines.length > 0 ? Math.round((Array.isArray(machines) ? machines : []).reduce((s: number, m: MESMachine) => s + Number(m.oee || 0), 0) / machines.length) : (oeeData?.averageOee || 0);
  const worldClass = (Array.isArray(machines) ? machines : []).filter((m: MESMachine) => Number(m.oee || 0) >= 85).length;

  const displayMachines = machines;

  const MES_PILLS = [
    { key: "oee", label: "OEE Monitor" },
    { key: "reasons", label: "To'xtash Sabablar" },
    { key: "zones", label: "Vazifalari" },
    { key: "maintenance", label: "Texnik Xizmat" },
    { key: "gamification", label: "Gamifikatsiya" },
    { key: "norms", label: "Normalari" },
    { key: "smena", label: "Smena O'tkazish" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        label="Europrint ERP · Ishlab chiqarish boshqaruvi"
        title="MES —"
        boldWord="Sex Boshqaruvi"
        subtitle="OEE monitoring, smena boshqaruvi, texnik xizmat"
      >
        {currentShift && (
          <Badge variant="secondary" className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            {currentShift.shiftName || "Aktiv smena"}
          </Badge>
        )}
        <Button variant="outline" size="sm" onClick={() => refetchOee()}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Yangilash
        </Button>
      </PageHeader>

      {/* ─── Unified KPI Bar ─── */}
      <div
        className="rounded-2xl bg-surface-container-lowest dark:bg-slate-900 overflow-hidden"
        style={{ boxShadow: "0 2px 12px rgba(15,23,42,0.06)" }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4  md:divide-y-0 divide-x-0 md:divide-x  dark:divide-slate-800">
          {([
            { label: "O'rtacha OEE", value: `${avgOee || (mesStats?.avgOee as number) || 0}%`, desc: "Uskunalar samaradorligi", icon: Activity, accent: "text-blue-500" },
            { label: "World Class (≥85%)", value: worldClass || (mesStats?.worldClassCount as number) || 0, desc: "Stanoq", icon: Trophy, accent: "text-green-500" },
            { label: "Ta'mirlashda", value: (Array.isArray(displayMachines) ? displayMachines : []).filter((m: MESMachine) => m.status?.includes("Ta'mir") || m.status === "maintenance").length, desc: "Hozir nosoz", icon: Wrench, accent: "text-red-500" },
            { label: "Jami Stanoqlar", value: displayMachines.length, desc: "Monitoring ostida", icon: Cpu, accent: "text-purple-500" },
          ]).map((item, i) => (
            <div key={`k-${i}`} className="p-6" data-testid={`kpi-mes-${i}`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant dark:text-on-surface-variant leading-none mb-4">
                {item.label}
              </p>
              <p className="text-4xl font-extrabold text-on-surface dark:text-slate-50 leading-none tracking-tight mb-2">
                {item.value}
              </p>
              <div className="flex items-center gap-2">
                <item.icon className={`w-3.5 h-3.5 ${item.accent}`} />
                <span className="text-xs text-on-surface-variant dark:text-on-surface-variant">{item.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <PillTabs tabs={MES_PILLS} active={activeTab} onChange={setActiveTab} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div>
          {/* OEE */}
          <TabsContent value="oee" className="mt-0 space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">OEE — Uskunalar samaradorligi monitoringi</p>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Stanoq</TableHead><TableHead>OEE</TableHead>
                    <TableHead>Mavjudlik</TableHead><TableHead>Unumdorlik</TableHead>
                    <TableHead>Sifat</TableHead><TableHead>Holati</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {oeeLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
                    ) : (Array.isArray(displayMachines) ? displayMachines : []).map((m: MESMachine) => (
                      <TableRow key={m.id || m.machineId} data-testid={`row-mes-oee-${m.id}`}>
                        <TableCell className="font-medium">{m.name || m.machineName}</TableCell>
                        <TableCell>
                          <span className={`font-bold ${Number(m.oee)>=85?"text-green-600":Number(m.oee)>=70?"text-yellow-600":"text-red-600"}`}>{Number(m.oee || 0).toFixed(0)}%</span>
                          <div className="w-20 h-1.5 bg-muted rounded mt-1">
                            <div className={`h-1.5 rounded ${Number(m.oee)>=85?"bg-green-500":Number(m.oee)>=70?"bg-yellow-500":"bg-red-500"}`} style={{width:`${m.oee}%`}}/>
                          </div>
                        </TableCell>
                        <TableCell>{Number(m.availability || m.avail || 0).toFixed(0)}%</TableCell>
                        <TableCell>{Number(m.performance || m.perf || 0).toFixed(0)}%</TableCell>
                        <TableCell>{Number(m.quality || m.qual || 0).toFixed(0)}%</TableCell>
                        <TableCell>
                          <Badge variant={
                            (m.status === "running" || m.status === "Ishlayapti") ? "default" :
                            (m.status === "maintenance" || m.status?.includes("Ta'mir")) ? "destructive" : "secondary"
                          }>{m.status === "running" ? "Ishlayapti" : m.status === "maintenance" ? "Ta'mirlashda" : m.status || "Noma'lum"}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Downtime Reasons */}
          <TabsContent value="reasons" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">To'xtash Sabablar Logi</h2>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Sabab</TableHead><TableHead>Tur</TableHead><TableHead>Muddat</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {downtimeReasons.length === 0 ? (
                        <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                          <AlertTriangle className="h-6 w-6 mx-auto mb-2 opacity-30" />To'xtash sabablar yo'q
                        </TableCell></TableRow>
                      ) : (Array.isArray(downtimeReasons) ? downtimeReasons : []).slice(0, 10).map((r: DowntimeReason) => (
                        <TableRow key={r.id} data-testid={`row-reason-${r.id}`}>
                          <TableCell className="font-medium">{r.name || r.reason}</TableCell>
                          <TableCell>
                            <Badge variant={r.type === "planned" ? "secondary" : "destructive"}>
                              {r.type === "planned" ? "Rejalashtirilgan" : "Rejalashtirilmagan"}
                            </Badge>
                          </TableCell>
                          <TableCell>{r.avgDuration ? `${r.avgDuration} min` : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Sabab tahlili</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {downtimeReasons.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">To'xtash sabablari qayd etilmagan</div>
                  ) : (Array.isArray(downtimeReasons) ? downtimeReasons : []).slice(0, 4).map((r: DowntimeReason, i: number) => {
                    const pct = r.pct || Math.round(100 / downtimeReasons.length);
                    const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-gray-400"];
                    return (
                      <div key={r.name || r.id || i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{r.name || r.reason}</span>
                          <span>{r.count || "—"} ta ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded">
                          <div className={`h-2 rounded ${colors[i % colors.length]}`} style={{width:`${pct}%`}}/>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Zones / Tasks */}
          <TabsContent value="zones" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Ishlab Chiqarish Vazifalari</h2>
              <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/mes/tasks"] })}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Yangilash
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {([
                { l: "Jami vazifalar", v: mesTasks.length, c: "text-primary" },
                { l: "Bajarilmoqda", v: (Array.isArray(mesTasks) ? mesTasks : []).filter((t: MESTask) => t.status === "in_progress").length, c: "text-blue-600" },
                { l: "Bajarildi", v: (Array.isArray(mesTasks) ? mesTasks : []).filter((t: MESTask) => t.status === "completed").length, c: "text-green-600" },
              ]).map(s => (
                <Card key={s.l}><CardContent className="pt-4 pb-3">
                  <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-muted-foreground">{s.l}</div>
                </CardContent></Card>
              ))}
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Vazifa</TableHead><TableHead>Stanoq</TableHead>
                    <TableHead>Miqdor</TableHead><TableHead>Holati</TableHead><TableHead>Sana</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {tasksLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
                    ) : mesTasks.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30" />Vazifalar yo'q
                      </TableCell></TableRow>
                    ) : (Array.isArray(mesTasks) ? mesTasks : []).slice(0, 15).map((t: MESTask) => (
                      <TableRow key={t.id} data-testid={`row-task-${t.id}`}>
                        <TableCell className="font-medium">{t.orderNumber || t.taskName || `Vazifa #${t.id}`}</TableCell>
                        <TableCell className="text-muted-foreground">{t.machineId || t.machineName || "—"}</TableCell>
                        <TableCell>{t.plannedQuantity || t.quantity || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={t.status === "completed" ? "default" : t.status === "in_progress" ? "secondary" : "outline"}>
                            {t.status === "completed" ? "Bajarildi" : t.status === "in_progress" ? "Jarayonda" : t.status === "pending" ? "Kutilmoqda" : t.status || "Noma'lum"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {t.scheduledDate ? new Date(t.scheduledDate).toLocaleDateString("uz-UZ") : t.createdAt ? new Date(t.createdAt).toLocaleDateString("uz-UZ") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance */}
          <TabsContent value="maintenance" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Texnik Xizmat So'rovlari</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => refetchMaint()}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Yangilash
                </Button>
                <Button size="sm" onClick={() => setShowMaintDialog(true)} data-testid="button-add-maintenance">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />So'rov Yaratish
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {([
                { l: "Jami so'rovlar", v: maintenanceRequests.length, c: "text-primary" },
                { l: "Bajarilmoqda", v: (Array.isArray(maintenanceRequests) ? maintenanceRequests : []).filter((r: MaintenanceRequest) => r.status === "in_progress").length, c: "text-blue-600" },
                { l: "Kutilmoqda", v: (Array.isArray(maintenanceRequests) ? maintenanceRequests : []).filter((r: MaintenanceRequest) => r.status === "pending").length, c: "text-orange-600" },
              ]).map(s => (
                <Card key={s.l}><CardContent className="pt-4 pb-3">
                  <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-muted-foreground">{s.l}</div>
                </CardContent></Card>
              ))}
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Stanoq</TableHead><TableHead>Muammo</TableHead>
                    <TableHead>Ustuvorlik</TableHead><TableHead>Holati</TableHead><TableHead>Sana</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {maintLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
                    ) : maintenanceRequests.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        <Wrench className="h-8 w-8 mx-auto mb-2 opacity-30" />So'rovlar yo'q
                      </TableCell></TableRow>
                    ) : (Array.isArray(maintenanceRequests) ? maintenanceRequests : []).slice(0, 10).map((r: MaintenanceRequest) => (
                      <TableRow key={r.id} data-testid={`row-maint-${r.id}`}>
                        <TableCell className="font-medium">{r.machineId || r.equipmentId || "—"}</TableCell>
                        <TableCell className="max-w-[180px] truncate">{r.issue || r.description || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={r.priority === "high" || r.priority === "critical" ? "destructive" : r.priority === "medium" ? "secondary" : "outline"}>
                            {r.priority === "high" || r.priority === "critical" ? "Kritik" : r.priority === "medium" ? "O'rta" : "Past"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.status === "completed" ? "default" : r.status === "in_progress" ? "secondary" : "outline"}>
                            {r.status === "completed" ? "Bajarildi" : r.status === "in_progress" ? "Bajarilmoqda" : "Kutilmoqda"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString("uz-UZ") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Dialog open={showMaintDialog} onOpenChange={setShowMaintDialog}>
              <DialogContent>
                <DialogHeader><DialogTitle>Texnik Xizmat So'rovi</DialogTitle></DialogHeader>
                <form onSubmit={maintForm.handleSubmit(d => createMaint.mutate(d))} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Stanoq</Label>
                    <Select onValueChange={v => maintForm.setValue("machineId", v)}>
                      <SelectTrigger data-testid="select-machine"><SelectValue placeholder="Stanoq tanlang" /></SelectTrigger>
                      <SelectContent>
                        {(Array.isArray(displayMachines) ? displayMachines : []).map((m: MESMachine) => <SelectItem key={String(m.id)} value={String(m.id)}>{m.name || String(m.id)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Muammo tavsifi</Label>
                    <Input {...maintForm.register("issue")} data-testid="input-maintenance-issue" />
                  </div>
                  <div className="space-y-2">
                    <Label>Ustuvorlik</Label>
                    <Select defaultValue="medium" onValueChange={v => maintForm.setValue("priority", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Past</SelectItem>
                        <SelectItem value="medium">O'rta</SelectItem>
                        <SelectItem value="high">Kritik</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setShowMaintDialog(false)}>Bekor</Button>
                    <Button type="submit" disabled={createMaint.isPending}>Yuborish</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Gamification */}
          <TabsContent value="gamification" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Operator Gamifikatsiya va Reyting</h2>
              <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/mes/gamification/leaderboard"] })}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Yangilash
              </Button>
            </div>
            {leaderboard.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20">
                  <CardContent className="pt-4 pb-4 text-center">
                    <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <div className="font-bold">{String(leaderboard[0]?.name || leaderboard[0]?.username || "—")}</div>
                    <div className="text-2xl font-bold text-yellow-600 mt-1">{Number(leaderboard[0]?.score || leaderboard[0]?.points || 0)} ball</div>
                    <Badge className="mt-2">Oyning eng yaxshi operatori</Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="text-2xl font-bold text-primary">{(leaderboard ?? []).reduce((s: number, o: MESLeaderboard) => s + Number(o.tasks || o.completedTasks || 0), 0)}</div>
                    <div className="text-sm text-muted-foreground">Jami bajarilgan vazifalar</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="text-2xl font-bold text-green-600">
                      {leaderboard.length > 0 ? ((Array.isArray(leaderboard) ? leaderboard : []).reduce((s: number, o: MESLeaderboard) => s + Number(o.quality || o.qualityRate || 0), 0) / leaderboard.length).toFixed(1) : 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">O'rtacha sifat ko'rsatkichi</div>
                  </CardContent>
                </Card>
              </div>
            )}
            <Card>
              <CardHeader><CardTitle className="text-base">Operator reytingi</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="w-12">O'rin</TableHead>
                    <TableHead>Operator</TableHead><TableHead>Ball</TableHead>
                    <TableHead>Vazifalar</TableHead><TableHead>Sifat</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {lbLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
                    ) : leaderboard.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        <Trophy className="h-8 w-8 mx-auto mb-2 opacity-30" />Reyting ma'lumoti yo'q
                      </TableCell></TableRow>
                    ) : (Array.isArray(leaderboard) ? leaderboard : []).slice(0, 10).map((op: MESLeaderboard, i: number) => (
                      <TableRow key={op.id || i} data-testid={`row-operator-${i + 1}`}>
                        <TableCell className="font-bold text-center">#{i + 1}</TableCell>
                        <TableCell className="font-medium">{op.name || op.username || op.fullName || "Operator"}</TableCell>
                        <TableCell><span className="font-bold text-primary">{op.score || op.points || 0}</span></TableCell>
                        <TableCell>{op.tasks || op.completedTasks || 0} ta</TableCell>
                        <TableCell className="text-green-600 font-medium">{Number(op.quality || op.qualityRate || 0).toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Norms */}
          <TabsContent value="norms" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Uskuna Normalari</h2>
              <Button size="sm" data-testid="button-add-norm">
                <Plus className="h-3.5 w-3.5 mr-1.5" />Norma Qo'shish
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Stanoq</TableHead><TableHead>Normativ tezlik</TableHead>
                    <TableHead>Tayyorlov vaqti</TableHead><TableHead>Min. brak %</TableHead><TableHead>OEE maqsad</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {([
                      { m: "Heidelberg CD102", speed: "13,000/h", setup: "45 min", brak: "1.5%", oee: "85%" },
                      { m: "KBA Rapida 106", speed: "16,000/h", setup: "40 min", brak: "1.2%", oee: "88%" },
                      { m: "Folding Machine", speed: "8,000/h", setup: "30 min", brak: "2.0%", oee: "80%" },
                      { m: "Die Cutting", speed: "12,000/h", setup: "35 min", brak: "1.0%", oee: "90%" },
                      { m: "UV Lak", speed: "6,000/h", setup: "50 min", brak: "0.8%", oee: "85%" },
                    ]).map((r, i) => (
                      <TableRow key={`k-${i}`} data-testid={`row-norm-${i}`}>
                        <TableCell className="font-medium">{r.m}</TableCell>
                        <TableCell>{r.speed}</TableCell>
                        <TableCell>{r.setup}</TableCell>
                        <TableCell>{r.brak}</TableCell>
                        <TableCell className="font-bold text-green-600">{r.oee}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Smena Handover */}
          <TabsContent value="smena" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Smena O'tkazish Protokoli</h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" data-testid="badge-current-shift">
                  <Clock className="h-3 w-3 mr-1" />
                  {currentShift ? `${currentShift.shiftName || "Joriy smena"} — ${currentShift.operatorName || "Operator"}` : "Faol smena yo'q"}
                </Badge>
                <Button size="sm" data-testid="button-start-handover" onClick={() => toast({ title: "Smena o'tkazish boshlandi", description: "Yangi operator ma'lumotlarini kiriting" })}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />Smena Yakunlash
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {([
                { l: "Joriy smena ishlab chiqarishi", v: currentShift?.producedQty ?? "—", c: "text-primary" },
                { l: "Brak miqdori", v: currentShift?.brakQty ?? "—", c: "text-red-600" },
                { l: "OEE", v: currentShift?.oee ? `${currentShift.oee}%` : "—", c: "text-green-600" },
              ]).map(s => (
                <Card key={s.l}><CardContent className="pt-4 pb-3">
                  <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-muted-foreground">{s.l}</div>
                </CardContent></Card>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader><h3 className="font-semibold text-sm">Smena Yakuniy Hisobot</h3></CardHeader>
                <CardContent className="space-y-3">
                  {([
                    { label: "Chiquvchi operator", value: currentShift?.operatorName || "—" },
                    { label: "Smena boshlanishi", value: currentShift?.startTime ? new Date(currentShift.startTime).toLocaleTimeString("uz-UZ") : "—" },
                    { label: "Stanoq holati", value: currentShift?.machineStatus || "Ishlamoqda" },
                    { label: "Eslatmalar", value: currentShift?.notes || "Yo'q" },
                  ]).map(item => (
                    <div key={item.label} className="flex items-start justify-between py-1.5 border-b border-border/50 last:border-0">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-medium text-right max-w-[60%]">{item.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><h3 className="font-semibold text-sm">Yangi Smena Ma'lumotlari</h3></CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Kiruvchi operator</Label>
                    <Input placeholder="Operator ismi" data-testid="input-incoming-operator" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Stanoq holati tekshiruvi</Label>
                    <Select>
                      <SelectTrigger data-testid="select-machine-status">
                        <SelectValue placeholder="Holat tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="good">Yaxshi</SelectItem>
                        <SelectItem value="minor_issue">Kichik muammo</SelectItem>
                        <SelectItem value="needs_maintenance">Texnik xizmat kerak</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Izoh</Label>
                    <Input placeholder="Smena bo'yicha izoh..." data-testid="input-shift-note" />
                  </div>
                  <Button className="w-full" data-testid="button-confirm-handover"
                    onClick={() => apiRequest("POST", "/api/mes/shifts/handover", { note: "handover" }).then(() => toast({ title: "Smena muvaffaqiyatli o'tkazildi" }))}>
                    Smena O'tkazishni Tasdiqlash
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
