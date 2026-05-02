import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest , selectArray } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Activity, Brain, Gauge, Layers, RefreshCw, Thermometer, Zap, AlertTriangle, CheckCircle, XCircle, Plus, Bell, BarChart3 , type LucideIcon } from "lucide-react";
import { ModuleSectionHeader } from "@/components/ModuleSectionHeader";

interface IoTSensor {
    id: number | string;
    sensorId?: number | string;
    name?: string;
    type?: string;
    sensorType?: string;
    location?: string;
    machineId?: number | string;
    isActive?: boolean;
    value?: number | string;
    minValue?: number;
    maxValue?: number;
    unit?: string;
    status?: string;
  }
interface IoTAlert {
    id: number | string;
    sensorId?: number | string;
    sensorName?: string;
    message?: string;
    alertMessage?: string;
    severity?: string;
    triggeredValue?: number | string;
    resolvedAt?: string | null;
    createdAt?: string;
  }
interface OEEData {
    name?: string;
    machineId?: number | string;
    workCenter?: string;
    oee?: number | string;
    value?: number | string;
    target?: number | string;
    availability?: number | string;
    performance?: number | string;
    quality?: number | string;
  }
interface PredictionData {
    name?: string;
    machineId?: number | string;
    machine?: string;
    risk?: number;
    daysUntilMaintenance?: number;
    recommendation?: string;
    prediction?: string;
  }

const URL_TAB_MAP: Record<string, string> = {
  "/iot/sensor-monitoring": "sensors",
  "/iot/predictive-maintenance": "predictive",
  "/iot/oee-live": "oee",
  "/iot/digital-twin": "twin",
  "/iot/alerts": "alerts",
};

const tabMeta: Record<string, { title: string; icon: LucideIcon }> = {
  "sensors":    { title: "Sensor Monitoring",     icon: Activity },
  "predictive": { title: "Nosozlik Bashorati",    icon: Brain },
  "oee":        { title: "OEE Live",             icon: BarChart3 },
  "twin":       { title: "Digital Twin",          icon: Layers },
  "alerts":     { title: "Ogohlantirishlar",      icon: AlertTriangle },
};

export default function IoTExtended() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState(URL_TAB_MAP[location] || "sensors");

  useEffect(() => {
    const tab = URL_TAB_MAP[location];
    if (tab) setActiveTab(tab);
  }, [location]);
  const meta = tabMeta[activeTab] || tabMeta["sensors"];
  const { toast } = useToast();
  const [showSensorDialog, setShowSensorDialog] = useState(false);

  const sensorForm = useForm({
    defaultValues: { sensorId: "", machineId: "", sensorType: "temperature", unit: "°C", minValue: 0, maxValue: 100, criticalMin: 0, criticalMax: 95 }
  });

  const { data: sensors = [], isLoading: sensorsLoading, refetch: refetchSensors } = useQuery<IoTSensor[]>({
    queryKey: ["/api/iot-sensors"],
    select: selectArray<IoTSensor>,
  });

  const { data: alerts = [], isLoading: alertsLoading, refetch: refetchAlerts } = useQuery<IoTAlert[]>({
    queryKey: ["/api/iot-sensors/alerts"],
    select: selectArray<IoTAlert>,
  });

  const { data: oeeData = [], isLoading: oeeLoading } = useQuery<OEEData[]>({
    queryKey: ["/api/iot-sensors/oee"],
    select: selectArray<OEEData>,
  });

  const { data: dashboard, isLoading: dashLoading } = useQuery<{ predictions?: PredictionData[] } & Record<string, unknown>>({
    queryKey: ["/api/iot-sensors/dashboard"]
  });

  const { data: liveSummary } = useQuery<{ activeMachines?: number | string; avgOee?: number | string; totalProduced?: number | string; totalDefects?: number | string } & Record<string, unknown>>({
    queryKey: ["/api/iot/live-dashboard/summary"],
    refetchInterval: 30000,
  });

  const createSensor = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/iot-sensors", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iot-sensors"] });
      setShowSensorDialog(false);
      toast({ title: "Sensor qo'shildi" });
    },
  });

  const resolveAlert = useMutation({
    mutationFn: (id: number | string) => apiRequest("POST", `/api/iot-sensors/alerts/${id}/resolve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iot-sensors/alerts"] });
      toast({ title: "Ogohlantirish hal qilindi" });
    },
  });

  const criticalAlerts = (Array.isArray(alerts) ? alerts : []).filter((a: IoTAlert) => a.severity === "critical" && !a.resolvedAt);
  const warningAlerts = (Array.isArray(alerts) ? alerts : []).filter((a: IoTAlert) => a.severity === "warning" && !a.resolvedAt);
  const activeSensors = (Array.isArray(sensors) ? sensors : []).filter((s: IoTSensor) => s.isActive);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border/50 px-6 py-3 flex items-center gap-3">
        <Activity className="h-5 w-5 text-primary" />
        <h1 className="font-semibold text-base">IoT + Sensor Monitoring</h1>
        {criticalAlerts.length > 0 && (
          <Badge variant="destructive" className="ml-2">
            <AlertTriangle className="h-3 w-3 mr-1" />{criticalAlerts.length} Kritik
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border/50 px-4 overflow-x-auto">
                  </div>

        <div className="flex-1 overflow-auto p-6">

      <ModuleSectionHeader
        moduleName="IoT"
        moduleColor="text-sky-600"
        sectionTitle={meta?.title || ""}
        icon={meta?.icon || (() => null)}
      />
          {/* Sensors Tab */}
          <TabsContent value="sensors" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Real-time Sensor Ma'lumotlari</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => refetchSensors()} data-testid="button-refresh-sensors">
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Yangilash
                </Button>
                <Button size="sm" onClick={() => setShowSensorDialog(true)} data-testid="button-add-sensor">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />Sensor Qo'shish
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {([
                { l: "Faol sensorlar", v: activeSensors.length, c: "text-green-600" },
                { l: "Kritik ogohlantirishlar", v: criticalAlerts.length, c: "text-red-600" },
                { l: "Ogohlantirishlar", v: warningAlerts.length, c: "text-orange-600" },
                { l: "Jami sensorlar", v: sensors.length, c: "text-blue-600" },
              ]).map(s => (
                <Card key={s.l}><CardContent className="pt-4 pb-3">
                  <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
                </CardContent></Card>
              ))}
            </div>

            {sensorsLoading ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Yuklanmoqda...</CardContent></Card>
            ) : sensors.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">
                <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <div>Sensorlar yo'q. Yangi sensor qo'shing.</div>
              </CardContent></Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Sensor ID</TableHead>
                      <TableHead>Tur</TableHead>
                      <TableHead>Mashina</TableHead>
                      <TableHead>Birlik</TableHead>
                      <TableHead>Min/Max</TableHead>
                      <TableHead>Holati</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {(Array.isArray(sensors) ? sensors : []).slice(0, 20).map((s: IoTSensor) => (
                        <TableRow key={s.id} data-testid={`row-sensor-${s.id}`}>
                          <TableCell className="font-mono text-sm">{s.sensorId}</TableCell>
                          <TableCell><Badge variant="outline">{s.sensorType}</Badge></TableCell>
                          <TableCell className="text-muted-foreground">{s.machineId || "—"}</TableCell>
                          <TableCell>{s.unit}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{s.minValue} / {s.maxValue}</TableCell>
                          <TableCell>
                            {s.isActive ? (
                              <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />Faol</Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" />Nofaol</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            <Dialog open={showSensorDialog} onOpenChange={setShowSensorDialog}>
              <DialogContent>
                <DialogHeader><DialogTitle>Yangi Sensor Qo'shish</DialogTitle></DialogHeader>
                <form onSubmit={sensorForm.handleSubmit(d => createSensor.mutate(d))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Sensor ID</Label><Input {...sensorForm.register("sensorId")} placeholder="SENS-001" data-testid="input-sensor-id" /></div>
                    <div className="space-y-2"><Label>Mashina ID</Label><Input {...sensorForm.register("machineId")} placeholder="MACH-001" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Tur</Label><Input {...sensorForm.register("sensorType")} placeholder="temperature" /></div>
                    <div className="space-y-2"><Label>Birlik</Label><Input {...sensorForm.register("unit")} placeholder="°C" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Min qiymat</Label><Input type="number" {...sensorForm.register("minValue", { valueAsNumber: true })} /></div>
                    <div className="space-y-2"><Label>Max qiymat</Label><Input type="number" {...sensorForm.register("maxValue", { valueAsNumber: true })} /></div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setShowSensorDialog(false)}>Bekor</Button>
                    <Button type="submit" disabled={createSensor.isPending}>Saqlash</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">IoT Ogohlantirishlar</h2>
              <Button variant="outline" size="sm" onClick={() => refetchAlerts()} data-testid="button-refresh-alerts">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Yangilash
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {([
                { l: "Kritik", v: criticalAlerts.length, c: "text-red-600" },
                { l: "Ogohlantirish", v: warningAlerts.length, c: "text-orange-600" },
                { l: "Hal qilingan (bugun)", v: (Array.isArray(alerts) ? alerts : []).filter((a: IoTAlert) => !!a.resolvedAt).length, c: "text-green-600" },
              ]).map(s => (
                <Card key={s.l}><CardContent className="pt-4 pb-3">
                  <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
                </CardContent></Card>
              ))}
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Sensor</TableHead><TableHead>Xabar</TableHead>
                    <TableHead>Og'irlik</TableHead><TableHead>Qiymat</TableHead>
                    <TableHead>Vaqt</TableHead><TableHead>Harakat</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {alertsLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
                    ) : alerts.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        Hozirda ogohlantirishlar yo'q
                      </TableCell></TableRow>
                    ) : (Array.isArray(alerts) ? alerts : []).slice(0, 15).map((a: IoTAlert) => (
                      <TableRow key={a.id} data-testid={`row-alert-${a.id}`}>
                        <TableCell className="font-mono text-sm">{a.sensorId}</TableCell>
                        <TableCell className="max-w-[200px] text-sm">{a.alertMessage}</TableCell>
                        <TableCell>
                          <Badge variant={a.severity === "critical" ? "destructive" : a.severity === "warning" ? "secondary" : "outline"}>
                            {a.severity === "critical" ? "Kritik" : a.severity === "warning" ? "Ogohlantirish" : "Ma'lumot"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{a.triggeredValue ?? "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {a.createdAt ? new Date(a.createdAt).toLocaleString("uz-UZ") : "—"}
                        </TableCell>
                        <TableCell>
                          {!a.resolvedAt ? (
                            <Button size="sm" variant="outline" onClick={() => resolveAlert.mutate(a.id)}
                              disabled={resolveAlert.isPending} data-testid={`button-resolve-alert-${a.id}`}>
                              Hal qilish
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-green-600 border-green-600">Hal qilindi</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* OEE Tab */}
          <TabsContent value="oee" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">OEE Live Monitor</h2>
              <Badge variant="outline" className="text-green-600 border-green-600">Jonli ma'lumot</Badge>
            </div>

            {oeeLoading ? (
              <div className="text-center py-8 text-muted-foreground">OEE yuklanmoqda...</div>
            ) : oeeData.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  <Gauge className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <div>OEE ma'lumotlari yo'q</div>
                  <div className="text-xs mt-1">MES orqali ishlab chiqarish seansini boshlang</div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {(Array.isArray(oeeData) ? oeeData : []).slice(0, 6).map((item: OEEData, i: number) => {
                  const oee = Number(item.oee ?? 0);
                  return (
                    <Card key={`k-${i}`} className={oee < 50 ? "border-red-300" : ""}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-sm">{item.machineId || item.workCenter || `Mashina ${i + 1}`}</span>
                          <span className={`text-2xl font-bold ${oee >= 85 ? "text-green-600" : oee >= 70 ? "text-yellow-600" : "text-red-600"}`}>
                            {oee.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-3 bg-muted rounded mb-3">
                          <div className={`h-3 rounded transition-all ${oee >= 85 ? "bg-green-500" : oee >= 70 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${Math.min(oee, 100)}%` }} />
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          {([
                            { l: "Mavjudlik", v: item.availability ? `${Number(item.availability).toFixed(1)}%` : "—" },
                            { l: "Unumdorlik", v: item.performance ? `${Number(item.performance).toFixed(1)}%` : "—" },
                            { l: "Sifat", v: item.quality ? `${Number(item.quality).toFixed(1)}%` : "—" },
                          ]).map(m => (
                            <div key={m.l} className="p-1.5 rounded bg-muted/50">
                              <div className="font-bold">{m.v}</div>
                              <div className="text-muted-foreground">{m.l}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {liveSummary && (
              <Card>
                <CardHeader><CardTitle className="text-base">Live Dashboard Xulosasi</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    {([
                      { l: "Faol mashinalar", v: liveSummary.activeMachines ?? "—" },
                      { l: "Bugungi OEE", v: liveSummary.avgOee ? `${Number(liveSummary.avgOee).toFixed(1)}%` : "—" },
                      { l: "Ishlab chiqarilgan", v: liveSummary.totalProduced ?? "—" },
                      { l: "Brak", v: liveSummary.totalDefects ?? "—" },
                    ]).map(s => (
                      <div key={s.l} className="text-center p-3 rounded-md bg-muted/50">
                        <div className="text-xl font-bold text-primary">{s.v}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Predictive Maintenance */}
          <TabsContent value="predictive" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">AI Predictive Maintenance</h2>

            {dashboard?.predictions && dashboard.predictions.length > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  {([
                    { l: "Bashorat qilingan nosozliklar", v: dashboard.predictions.length, c: "text-orange-600" },
                    { l: "Kritik holatlar", v: dashboard.predictions?.filter((p: PredictionData) => ((p.risk ?? 0) ?? 0) >= 80).length, c: "text-red-600" },
                    { l: "Texnik xizmat kerak", v: dashboard.predictions?.filter((p: PredictionData) => ((p.daysUntilMaintenance ?? 0) ?? 99) <= 7).length, c: "text-blue-600" },
                  ]).map(s => (
                    <Card key={s.l}><CardContent className="pt-4 pb-3">
                      <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
                    </CardContent></Card>
                  ))}
                </div>
                <Card>
                  <CardHeader><CardTitle className="text-base">AI prognozlar</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {(Array.isArray(dashboard.predictions) ? dashboard.predictions : []).map((p: PredictionData, i: number) => (
                      <div key={`k-${i}`} className="p-4 rounded-md bg-muted/50 space-y-2" data-testid={`row-prediction-${i}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{p.machineId || p.machine}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant={((p.risk ?? 0) ?? 0) >= 80 ? "destructive" : (p.risk ?? 0) >= 60 ? "secondary" : "outline"}>
                              {(p.risk ?? 0)}% xavf
                            </Badge>
                            {(p.daysUntilMaintenance ?? 0) && <span className="text-xs text-muted-foreground">{(p.daysUntilMaintenance ?? 0)} kun</span>}
                          </div>
                        </div>
                        {p.prediction && <p className="text-sm text-muted-foreground">{p.prediction}</p>}
                        <div className="h-1.5 bg-muted rounded">
                          <div className={`h-1.5 rounded ${((p.risk ?? 0) ?? 0) >= 80 ? "bg-red-500" : (p.risk ?? 0) >= 60 ? "bg-yellow-500" : "bg-green-500"}`}
                            style={{ width: `${Math.min((p.risk ?? 0), 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  <Brain className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <div className="font-medium">AI Predictive Engine</div>
                  <div className="text-sm mt-1">Sensor ma'lumotlari yig'ilgandan so'ng bashoratlar paydo bo'ladi</div>
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    {([
                      { l: "Model aniqligi", v: "—", c: "text-green-600" },
                      { l: "Oldini olingan to'xtashlar", v: "—", c: "text-blue-600" },
                      { l: "Tejash (so'm)", v: "—", c: "text-purple-600" },
                    ]).map(s => (
                      <div key={s.l} className="p-3 rounded-md bg-muted/50">
                        <div className={`text-xl font-bold ${s.c}`}>{s.v}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Digital Twin */}
          <TabsContent value="twin" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">Digital Twin — Virtual Zavod</h2>
            <Card>
              <CardContent className="pt-4">
                <div className="h-64 bg-muted/30 rounded-md border border-dashed flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Layers className="h-12 w-12 mx-auto mb-3 opacity-40" />
                    <div className="text-sm font-medium">3D Digital Twin Vizualizatsiya</div>
                    <div className="text-xs mt-1">Three.js / BIM integratsiya tayyorlanmoqda</div>
                    <div className="text-xs mt-0.5 text-muted-foreground/70">Real vaqtda sensor ma'lumotlari bilan yangilanadi</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="grid grid-cols-3 gap-4">
              {([
                { l: "Virtual stanoqlar", v: sensors.length || "0", c: "text-primary" },
                { l: "Sensor aloqalari", v: activeSensors.length || "0", c: "text-green-600" },
                { l: "Faol ogohlantirishlar", v: criticalAlerts.length + warningAlerts.length, c: "text-orange-600" },
              ]).map(s => (
                <Card key={s.l}><CardContent className="pt-4 pb-3">
                  <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
                </CardContent></Card>
              ))}
            </div>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
