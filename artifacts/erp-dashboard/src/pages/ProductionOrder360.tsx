import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Factory, CheckCircle2, TrendingUp, TrendingDown, AlertTriangle,
  Clock, Users, Package, ShieldCheck, Wrench, BarChart2, Coins,
  Calendar, Gauge, Activity, Zap,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  created:     { label: "Yaratildi",    variant: "secondary" },
  released:    { label: "Chiqarildi",   variant: "default" },
  in_progress: { label: "Jarayonda",   variant: "default" },
  completed:   { label: "Bajarildi",   variant: "default" },
  closed:      { label: "Yopildi",     variant: "secondary" },
  qc_hold:     { label: "QC To'xtatdi", variant: "destructive" },
};

const STAGE_LABELS: Record<string, string> = {
  incoming: "Kirish nazorat",
  process:  "Jarayon nazorat",
  outgoing: "Chiqish nazorat",
};

const TYPE_LABELS: Record<string, string> = {
  flexo: "Flexo bosma", offset: "Offset bosma", cutting: "Kesish",
  laminate: "Laminatsiya", digital: "Digital", other: "Boshqa",
};

function fmt(n: number | null | undefined, d = 0) {
  if (n == null) return "—";
  return n.toLocaleString("uz-UZ", { maximumFractionDigits: d });
}

function fmtMoney(n: number | null | undefined) {
  if (n == null) return "—";
  return n.toLocaleString("uz-UZ", { maximumFractionDigits: 0 }) + " so'm";
}

function fmtTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}s ${m}d`;
  return `${m} daqiqa`;
}

interface QcCheck { id: string | number; checkStage: string; failedQty: number; checkedQty: number; passedQty: number; defectTypes?: DefectType[]; notes?: string; checkerName?: string; checkedAt?: string }
interface DefectType { type: string; count: number; decision?: string }
interface EquipItem { id: string | number; name?: string; equipmentType?: string; location?: string; status?: string }
interface EquipSession { equipmentId: string | number; actualQuantity?: number | null; oee?: number | null }
interface Downtime { reasonDescription?: string; reasonCode?: string; eventType?: string; durationSeconds?: number | null; startedAt?: string; isPlanned?: boolean }
interface MaterialComponent { id: string | number; materialName?: string; rawMaterialId?: string | number; requiredQuantity?: number; issuedQuantity?: number; diff?: number; unit?: string; materialUnit?: string; totalPlannedCost?: number; totalActualCost?: number }
interface CostComponent { id: string | number; materialName?: string; rawMaterialId?: string | number; issuedQuantity?: number; unit?: string; materialUnit?: string; totalActualCost?: number; totalPlannedCost?: number }

function KpiCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: React.ReactNode; sub?: React.ReactNode; color?: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${color || ""}`} data-testid={`kpi-${label}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${color || "text-muted-foreground"}`} />
        </div>
      </CardContent>
    </Card>
  );
}

interface Production360Overview {
  status: string;
  orderNumber?: string;
  productionType?: string;
  productName?: string;
  notes?: string;
  priority?: number;
  responsibleManagerName?: string;
  shiftSupervisorName?: string;
  qcInspectorName?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  statusHistory?: { id: string | number; oldStatus?: string; newStatus: string; changerName?: string; changedAt?: string; reason?: string }[];
}
interface Production360Kpi {
  completionRate: number;
  produced: number;
  planned: number;
  avgOee?: number | null;
  qcPassRate: number;
  defective?: number;
  scrapped?: number;
  costVariance: number;
  costVariancePct: number;
  leadTimeDays?: number | null;
  totalDowntimeMins?: number;
}
interface Production360ShiftSession { id: string | number; sessionNumber: string; workerName?: string; workerId?: string | number; status: string; oee?: number | null; targetQuantity?: number; actualQuantity?: number; defects?: number; defectQuantity?: number; availability?: number | null; performance?: number | null; quality?: number | null; startedAt?: string; endedAt?: string }
interface Production360Materials { totalPlannedCost?: number; totalActualCost?: number; components?: MaterialComponent[] }
interface TimeAnalysis { totalRunningSeconds?: number; totalStoppedSeconds?: number; plannedStartDate?: string; plannedEndDate?: string; actualStartDate?: string; actualEndDate?: string; downtimes?: Downtime[] }
interface CostAnalysis { plannedCost?: number; actualCost?: number; variance?: number; variancePct?: number; materialCost?: number; components?: CostComponent[] }
interface Production360Equipment { list?: EquipItem[]; sessions?: EquipSession[] }
interface Production360Response {
  overview: Production360Overview;
  kpi: Production360Kpi;
  shifts?: { sessions?: Production360ShiftSession[]; downtimes?: Downtime[]; totalRunningHours?: number; totalStoppedHours?: number };
  materials?: Production360Materials;
  quality?: { totalFailed?: number; totalChecked?: number; checks?: QcCheck[] };
  equipment?: Production360Equipment;
  timeAnalysis?: TimeAnalysis;
  costAnalysis?: CostAnalysis;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value || <span className="text-muted-foreground">—</span>}</span>
    </div>
  );
}

export default function ProductionOrder360() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const { data, isLoading } = useQuery<Production360Response>({
    queryKey: ["/api/production/orders", id, "360-card"],
    queryFn: async () => {
      const res = await fetch(`/api/production/orders/${id}/360-card`);
      if (!res.ok) throw new Error("Xato");
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!data) return (
    <div className="p-8 text-center text-muted-foreground">Ma'lumot topilmadi</div>
  );

  const { overview, kpi, shifts: rawShifts, materials: rawMaterials, quality: rawQuality, equipment: rawEq, timeAnalysis: rawTimeAnalysis, costAnalysis: rawCostAnalysis } = data;
  const shifts = rawShifts ?? {} as NonNullable<Production360Response['shifts']>;
  const materials = rawMaterials ?? {} as Production360Materials;
  const quality = rawQuality ?? {} as NonNullable<Production360Response['quality']>;
  const eq = rawEq ?? {} as Production360Equipment;
  const timeAnalysis = rawTimeAnalysis ?? {} as TimeAnalysis;
  const costAnalysis = rawCostAnalysis ?? {} as CostAnalysis;
  const statusInfo = STATUS_LABELS[overview.status] || { label: overview.status, variant: "secondary" as const };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="border-b px-6 py-4 flex items-center gap-3 flex-wrap">
        <Button size="icon" variant="ghost" onClick={() => navigate("/production/orders")} data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold font-mono" data-testid="text-order-number">
              {overview.orderNumber}
            </h1>
            <Badge variant={statusInfo.variant} data-testid="badge-status">{statusInfo.label}</Badge>
            {overview.productionType && (
              <Badge variant="outline" data-testid="badge-type">
                {TYPE_LABELS[overview.productionType] || overview.productionType}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{overview.productName || "Mahsulot ko'rsatilmagan"}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard
              icon={CheckCircle2}
              label="Bajarish foizi"
              value={`${kpi.completionRate}%`}
              sub={`${fmt(kpi.produced)} / ${fmt(kpi.planned)} dona`}
              color={kpi.completionRate >= 100 ? "text-green-600" : kpi.completionRate >= 50 ? "text-yellow-600" : "text-red-500"}
            />
            <KpiCard
              icon={Gauge}
              label="O'rtacha OEE"
              value={kpi.avgOee != null ? `${fmt(kpi.avgOee * 100, 1)}%` : "—"}
              sub="Umumiy samaradorlik"
              color={kpi.avgOee != null && kpi.avgOee >= 0.85 ? "text-green-600" : kpi.avgOee != null && kpi.avgOee >= 0.65 ? "text-yellow-600" : "text-muted-foreground"}
            />
            <KpiCard
              icon={ShieldCheck}
              label="QC o'tish darajasi"
              value={`${kpi.qcPassRate}%`}
              sub={`${fmt(quality?.totalFailed)} rad etildi`}
              color={kpi.qcPassRate >= 95 ? "text-green-600" : kpi.qcPassRate >= 85 ? "text-yellow-600" : "text-red-500"}
            />
            <KpiCard
              icon={kpi.costVariance > 0 ? TrendingUp : TrendingDown}
              label="Tannarx og'ishi"
              value={kpi.costVariance !== 0 ? fmtMoney(Math.abs(kpi.costVariance)) : "0"}
              sub={kpi.costVariancePct !== 0 ? `${kpi.costVariance > 0 ? "+" : ""}${kpi.costVariancePct}% (${kpi.costVariance > 0 ? "ortiq" : "tejaldi"})` : "Reja bajarildi"}
              color={kpi.costVariance > 0 ? "text-red-500" : kpi.costVariance < 0 ? "text-green-600" : "text-muted-foreground"}
            />
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="flex flex-wrap h-auto gap-1" data-testid="tabs-360">
              <TabsTrigger value="overview" data-testid="tab-overview">
                <Factory className="w-3.5 h-3.5 mr-1.5" />Umumiy
              </TabsTrigger>
              <TabsTrigger value="shifts" data-testid="tab-shifts">
                <Clock className="w-3.5 h-3.5 mr-1.5" />Smenalar
              </TabsTrigger>
              <TabsTrigger value="materials" data-testid="tab-materials">
                <Package className="w-3.5 h-3.5 mr-1.5" />Materiallar
              </TabsTrigger>
              <TabsTrigger value="quality" data-testid="tab-quality">
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />Sifat
              </TabsTrigger>
              <TabsTrigger value="equipment" data-testid="tab-equipment">
                <Wrench className="w-3.5 h-3.5 mr-1.5" />Uskuna
              </TabsTrigger>
              <TabsTrigger value="time" data-testid="tab-time">
                <Activity className="w-3.5 h-3.5 mr-1.5" />Vaqt tahlili
              </TabsTrigger>
              <TabsTrigger value="cost" data-testid="tab-cost">
                <Coins className="w-3.5 h-3.5 mr-1.5" />Tannarx
              </TabsTrigger>
            </TabsList>

            {/* ── TAB 1: OVERVIEW ── */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
                    <CardTitle className="text-sm font-semibold">Asosiy ma'lumotlar</CardTitle>
                    <Factory className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="space-y-0 divide-y">
                    <InfoRow label="Buyurtma raqami" value={<span className="font-mono">{overview.orderNumber}</span>} />
                    <InfoRow label="Mahsulot" value={overview.productName} />
                    <InfoRow label="Turi" value={TYPE_LABELS[overview.productionType ?? ''] || overview.productionType} />
                    <InfoRow label="Ustuvorlik" value={
                      <Badge variant="outline">P{overview.priority}</Badge>
                    } />
                    <InfoRow label="Holati" value={<Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>} />
                    <InfoRow label="Eslatmalar" value={overview.notes} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
                    <CardTitle className="text-sm font-semibold">Miqdor ko'rsatkichlari</CardTitle>
                    <BarChart2 className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Bajarish</span>
                        <span className="font-medium">{kpi.completionRate}%</span>
                      </div>
                      <Progress value={Math.min(100, kpi.completionRate)} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Ishlab chiq.: {fmt(kpi.produced)}</span>
                        <span>Reja: {fmt(kpi.planned)}</span>
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Nosoz</p>
                        <p className="font-semibold text-orange-500">{fmt(kpi.defective)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Chiqindi</p>
                        <p className="font-semibold text-red-500">{fmt(kpi.scrapped)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
                    <CardTitle className="text-sm font-semibold">Mas'ul shaxslar</CardTitle>
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="space-y-0 divide-y">
                    <InfoRow label="Mas'ul menejer" value={overview.responsibleManagerName} />
                    <InfoRow label="Smena nazoratchisi" value={overview.shiftSupervisorName} />
                    <InfoRow label="QC inspektori" value={overview.qcInspectorName} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
                    <CardTitle className="text-sm font-semibold">Sana rejasi</CardTitle>
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="space-y-0 divide-y">
                    <InfoRow label="Reja boshlanish" value={overview.plannedStartDate} />
                    <InfoRow label="Reja tugash" value={overview.plannedEndDate} />
                    <InfoRow label="Haqiqiy boshlanish" value={overview.actualStartDate} />
                    <InfoRow label="Haqiqiy tugash" value={overview.actualEndDate} />
                    {kpi.leadTimeDays != null && (
                      <InfoRow label="Davom etish" value={`${kpi.leadTimeDays} kun`} />
                    )}
                  </CardContent>
                </Card>
              </div>

              {(overview.statusHistory?.length ?? 0) > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Holat tarixi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {overview.statusHistory?.map((h: { id: string | number; oldStatus?: string; newStatus: string; changerName?: string; changedAt?: string; reason?: string }) => (
                        <div key={h.id} className="flex items-start gap-3 text-sm">
                          <div className="mt-0.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {h.oldStatus && (
                                <>
                                  <Badge variant="outline" className="text-xs">
                                    {STATUS_LABELS[h.oldStatus]?.label || h.oldStatus}
                                  </Badge>
                                  <span className="text-muted-foreground">→</span>
                                </>
                              )}
                              <Badge variant="default" className="text-xs">
                                {STATUS_LABELS[h.newStatus]?.label || h.newStatus}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {h.changerName || "—"} · {h.changedAt ? new Date(h.changedAt).toLocaleString("uz-UZ") : ""}
                            </p>
                            {h.reason && <p className="text-xs text-muted-foreground">{h.reason}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── TAB 2: SHIFTS ── */}
            <TabsContent value="shifts" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground">Smenalar soni</p>
                    <p className="text-2xl font-bold mt-0.5">{shifts.sessions?.length || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground">Ishlagan vaqt</p>
                    <p className="text-2xl font-bold mt-0.5 text-green-600">{shifts.totalRunningHours}s</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground">To'xtash vaqti</p>
                    <p className="text-2xl font-bold mt-0.5 text-yellow-600">{shifts.totalStoppedHours}s</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                {(shifts.sessions || []).map((sess: { id: string | number; sessionNumber: string; workerName?: string; workerId?: string | number; status: string; oee?: number | null; targetQuantity?: number; actualQuantity?: number; defects?: number; defectQuantity?: number; availability?: number | null; performance?: number | null; quality?: number | null; startedAt?: string; endedAt?: string }) => (
                  <Card key={sess.id}>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-mono text-sm font-medium">{sess.sessionNumber}</p>
                          <p className="text-xs text-muted-foreground">{sess.workerName || sess.workerId || "—"}</p>
                        </div>
                        <Badge variant={sess.status === "completed" ? "default" : sess.status === "running" ? "secondary" : "outline"}>
                          {sess.status === "completed" ? "Tugatildi" : sess.status === "running" ? "Ishlayapti" : sess.status}
                        </Badge>
                      </div>

                      {sess.oee != null && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">OEE</span>
                            <span className="font-medium">{fmt(Number(sess.oee) * 100, 1)}%</span>
                          </div>
                          <Progress value={Number(sess.oee) * 100} className="h-1.5" />
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">Reja</p>
                          <p className="font-semibold">{fmt(sess.targetQuantity)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Ishlab chiq.</p>
                          <p className="font-semibold text-green-600">{fmt(sess.actualQuantity)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Nosoz</p>
                          <p className="font-semibold text-orange-500">{fmt(sess.defectQuantity)}</p>
                        </div>
                      </div>

                      {(sess.availability != null || sess.performance != null || sess.quality != null) && (
                        <div className="grid grid-cols-3 gap-2 mt-2 text-xs border-t pt-2">
                          <div>
                            <p className="text-muted-foreground">A (mavjudlik)</p>
                            <p className="font-medium">{fmt(Number(sess.availability) * 100, 1)}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">P (unumdorlik)</p>
                            <p className="font-medium">{fmt(Number(sess.performance) * 100, 1)}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Q (sifat)</p>
                            <p className="font-medium">{fmt(Number(sess.quality) * 100, 1)}%</p>
                          </div>
                        </div>
                      )}

                      {(sess.startedAt || sess.endedAt) && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {sess.startedAt ? new Date(sess.startedAt).toLocaleString("uz-UZ") : "—"}
                          {" — "}
                          {sess.endedAt ? new Date(sess.endedAt).toLocaleString("uz-UZ") : "davom etmoqda"}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {(!shifts.sessions || shifts.sessions.length === 0) && (
                  <Card>
                    <CardContent className="py-8 text-center text-sm text-muted-foreground">
                      Smenalar ma'lumoti yo'q
                    </CardContent>
                  </Card>
                )}
              </div>

              {(shifts.downtimes?.length ?? 0) > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">To'xtash sabablari</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {shifts.downtimes?.map((dt: Downtime, i: number) => (
                      <div key={`k-${i}`} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium">{dt.reasonDescription || dt.reasonCode || "Sabab ko'rsatilmagan"}</p>
                          <p className="text-xs text-muted-foreground">
                            {dt.isPlanned ? "Rejalashtirilgan" : "Rejalashtirilmagan"} ·{" "}
                            {dt.startedAt ? new Date(dt.startedAt).toLocaleTimeString("uz-UZ") : "—"}
                          </p>
                        </div>
                        <Badge variant={dt.isPlanned ? "secondary" : "destructive"}>
                          {dt.durationSeconds ? fmtTime(Number(dt.durationSeconds)) : "—"}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── TAB 3: MATERIALS ── */}
            <TabsContent value="materials" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground">Reja material xarajati</p>
                    <p className="text-xl font-bold mt-0.5">{fmtMoney(materials.totalPlannedCost)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground">Haqiqiy material xarajati</p>
                    <p className={`text-xl font-bold mt-0.5 ${(materials.totalActualCost ?? 0) > (materials.totalPlannedCost ?? 0) ? "text-red-500" : "text-green-600"}`}>
                      {fmtMoney(materials.totalActualCost)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                {(materials.components || []).map((c: MaterialComponent) => {
                  const pct = (c.requiredQuantity ?? 0) > 0 ? ((c.issuedQuantity ?? 0) / (c.requiredQuantity ?? 1)) * 100 : 0;
                  const overuse = Number(c.diff || 0) > 0;
                  return (
                    <Card key={c.id}>
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm">{c.materialName || `Material ${c.rawMaterialId}`}</p>
                            <p className="text-xs text-muted-foreground">{c.unit || c.materialUnit || "—"}</p>
                          </div>
                          {c.diff !== 0 && (
                            <Badge variant={overuse ? "destructive" : "default"} className="shrink-0">
                              {overuse ? "+" : ""}{fmt(c.diff, 2)} ortiqcha
                            </Badge>
                          )}
                        </div>
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Sarflash</span>
                            <span>{fmt(c.issuedQuantity, 2)} / {fmt(c.requiredQuantity, 2)}</span>
                          </div>
                          <Progress value={Math.min(110, pct)} className="h-1.5" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">Reja tannarx</p>
                            <p className="font-medium">{fmtMoney(c.totalPlannedCost)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Haqiqiy tannarx</p>
                            <p className={`font-medium ${(c.totalActualCost ?? 0) > (c.totalPlannedCost ?? 0) ? "text-red-500" : "text-green-600"}`}>
                              {fmtMoney(c.totalActualCost)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {(!materials.components || materials.components.length === 0) && (
                  <Card>
                    <CardContent className="py-8 text-center text-sm text-muted-foreground">
                      Material ma'lumotlari yo'q
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* ── TAB 4: QUALITY ── */}
            <TabsContent value="quality" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground">QC o'tish darajasi</p>
                    <p className={`text-2xl font-bold mt-0.5 ${kpi.qcPassRate >= 95 ? "text-green-600" : kpi.qcPassRate >= 85 ? "text-yellow-600" : "text-red-500"}`}>
                      {kpi.qcPassRate}%
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground">Tekshirilgan</p>
                    <p className="text-2xl font-bold mt-0.5">{fmt(quality.totalChecked)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground">Rad etilgan</p>
                    <p className="text-2xl font-bold mt-0.5 text-red-500">{fmt(quality.totalFailed)}</p>
                  </CardContent>
                </Card>
              </div>

              {(quality.checks || []).map((check: QcCheck) => (
                <Card key={check.id}>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
                    <CardTitle className="text-sm font-semibold">
                      {STAGE_LABELS[check.checkStage] || check.checkStage}
                    </CardTitle>
                    <Badge variant={check.failedQty > 0 ? "destructive" : "default"}>
                      {check.failedQty > 0 ? `${check.failedQty} rad` : "O'tdi"}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Tekshirildi</p>
                        <p className="font-bold">{fmt(check.checkedQty)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">O'tdi</p>
                        <p className="font-bold text-green-600">{fmt(check.passedQty)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Rad etildi</p>
                        <p className="font-bold text-red-500">{fmt(check.failedQty)}</p>
                      </div>
                    </div>

                    {check.defectTypes && Array.isArray(check.defectTypes) && check.defectTypes.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Nuqson turlari:</p>
                        {check.defectTypes?.map((dt, i) => (
                          <div key={`k-${i}`} className="flex items-center justify-between text-xs">
                            <span>{dt.type || "Noma'lum"}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{fmt(dt.count)} dona</span>
                              <Badge variant="outline" className="text-xs">{dt.decision || "—"}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {check.notes && (
                      <p className="mt-2 text-xs text-muted-foreground">{check.notes}</p>
                    )}

                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                      <span>{check.checkerName || "—"}</span>
                      {check.checkedAt && <span>· {new Date(check.checkedAt).toLocaleString("uz-UZ")}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {(!quality.checks || quality.checks.length === 0) && (
                <Card>
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    QC nazorat ma'lumotlari yo'q
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── TAB 5: EQUIPMENT ── */}
            <TabsContent value="equipment" className="space-y-4 mt-4">
              {(eq.list || []).map((equip: EquipItem) => {
                const equipSessions = ((eq.sessions || []) as EquipSession[]).filter((s) => s.equipmentId === equip.id);
                const totalProd = (Array.isArray(equipSessions) ? equipSessions : []).reduce((a: number, s) => a + Number(s.actualQuantity || 0), 0);
                const avgOee = (Array.isArray(equipSessions) ? equipSessions : []).filter((s) => s.oee != null);
                const oeeAvg = avgOee.length > 0
                  ? (Array.isArray(avgOee) ? avgOee : []).reduce((a: number, s) => a + Number(s.oee), 0) / avgOee.length
                  : null;

                return (
                  <Card key={equip.id}>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
                      <div>
                        <CardTitle className="text-sm font-semibold">{equip.name || equip.id}</CardTitle>
                        <p className="text-xs text-muted-foreground">{equip.equipmentType || "—"} · {equip.location || "—"}</p>
                      </div>
                      <Badge variant={equip.status === "active" ? "default" : "secondary"}>
                        {equip.status || "—"}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Smenalar</p>
                          <p className="font-bold">{equipSessions.length}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Jami ishlab chiq.</p>
                          <p className="font-bold">{fmt(totalProd)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">O'rtacha OEE</p>
                          <p className={`font-bold ${oeeAvg != null && oeeAvg >= 0.85 ? "text-green-600" : oeeAvg != null && oeeAvg >= 0.65 ? "text-yellow-600" : "text-muted-foreground"}`}>
                            {oeeAvg != null ? `${fmt(oeeAvg * 100, 1)}%` : "—"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {(!eq.list || eq.list.length === 0) && (
                <Card>
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    Uskuna ma'lumotlari yo'q
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── TAB 6: TIME ANALYSIS ── */}
            <TabsContent value="time" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <KpiCard
                  icon={Zap}
                  label="Ishlash vaqti"
                  value={fmtTime(timeAnalysis.totalRunningSeconds ?? 0)}
                  color="text-green-600"
                />
                <KpiCard
                  icon={Clock}
                  label="To'xtash vaqti"
                  value={fmtTime(timeAnalysis.totalStoppedSeconds ?? 0)}
                  color="text-yellow-600"
                />
                <KpiCard
                  icon={AlertTriangle}
                  label="Rejalashtirilmagan to'xtash"
                  value={`${kpi.totalDowntimeMins} daq`}
                  color="text-red-500"
                />
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Sana rejasi vs haqiqati</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0 divide-y">
                  <InfoRow label="Reja boshlanish" value={timeAnalysis.plannedStartDate} />
                  <InfoRow label="Reja tugash" value={timeAnalysis.plannedEndDate} />
                  <InfoRow label="Haqiqiy boshlanish" value={timeAnalysis.actualStartDate} />
                  <InfoRow label="Haqiqiy tugash" value={timeAnalysis.actualEndDate} />
                  {kpi.leadTimeDays != null && (
                    <InfoRow label="Umumiy davr" value={`${kpi.leadTimeDays} kun`} />
                  )}
                </CardContent>
              </Card>

              {(timeAnalysis.downtimes?.length ?? 0) > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">To'xtash hodisalari</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {timeAnalysis.downtimes?.map((dt: Downtime, i: number) => (
                      <div key={`k-${i}`} className="flex items-center justify-between gap-2 text-sm">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{dt.reasonDescription || dt.reasonCode || "Sabab yo'q"}</p>
                          <p className="text-xs text-muted-foreground">
                            {dt.eventType === "planned_stop" ? "Rejalashtirilgan" : "Rejalashtirilmagan"}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-semibold">{dt.durationSeconds ? fmtTime(Number(dt.durationSeconds)) : "—"}</p>
                          <p className="text-xs text-muted-foreground">
                            {dt.startedAt ? new Date(dt.startedAt).toLocaleTimeString("uz-UZ") : "—"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── TAB 7: COST ANALYSIS ── */}
            <TabsContent value="cost" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <KpiCard
                  icon={Coins}
                  label="Reja tannarx"
                  value={fmtMoney(costAnalysis.plannedCost)}
                  color="text-muted-foreground"
                />
                <KpiCard
                  icon={(costAnalysis.variance ?? 0) > 0 ? TrendingUp : TrendingDown}
                  label="Haqiqiy tannarx"
                  value={fmtMoney(costAnalysis.actualCost)}
                  color={(costAnalysis.variance ?? 0) > 0 ? "text-red-500" : (costAnalysis.variance ?? 0) < 0 ? "text-green-600" : "text-muted-foreground"}
                />
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Tannarx tahlili</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0 divide-y">
                  <InfoRow label="Reja tannarx" value={fmtMoney(costAnalysis.plannedCost)} />
                  <InfoRow label="Haqiqiy tannarx" value={fmtMoney(costAnalysis.actualCost)} />
                  <InfoRow
                    label="Og'ish"
                    value={
                      <span className={(costAnalysis.variance ?? 0) > 0 ? "text-red-500" : (costAnalysis.variance ?? 0) < 0 ? "text-green-600" : ""}>
                        {(costAnalysis.variance ?? 0) > 0 ? "+" : ""}
                        {fmtMoney(costAnalysis.variance)}
                        {" "}
                        ({(costAnalysis.variance ?? 0) > 0 ? "+" : ""}{costAnalysis.variancePct}%)
                      </span>
                    }
                  />
                  <InfoRow label="Material xarajati" value={fmtMoney(costAnalysis.materialCost)} />
                </CardContent>
              </Card>

              {(costAnalysis.components?.length ?? 0) > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Material xarajatlar tafsiloti</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(costAnalysis.components || []).map((c: CostComponent) => (
                        <div key={c.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{c.materialName || c.rawMaterialId}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">{fmt(c.issuedQuantity, 2)} {c.unit || c.materialUnit}</span>
                            <span className={`font-medium ${(c.totalActualCost ?? 0) > (c.totalPlannedCost ?? 0) ? "text-red-500" : "text-green-600"}`}>
                              {fmtMoney(c.totalActualCost)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
