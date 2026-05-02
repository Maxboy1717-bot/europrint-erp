import { useQuery } from "@tanstack/react-query";
import { safeArray } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Factory, Gauge, Clock, AlertTriangle, CheckCircle,
  Wrench, Play, Users, ChevronRight, BarChart3,
  Package, Activity, RefreshCw, ArrowUpRight, Cpu,
  Timer, TrendingUp, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashStats {
  activeSessions: number;
  completedToday: number;
  onlineDevices: number;
  averageOee: number;
}

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
}

interface ProductionOrder {
  id: string;
  orderNumber: string;
  status: string;
  productName?: string;
  plannedQuantity: number;
  confirmedQuantity: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function oeeColor(v: number) {
  if (v >= 0.85) return "text-emerald-600";
  if (v >= 0.70) return "text-amber-600";
  return "text-red-600";
}

function oeeBar(v: number) {
  if (v >= 0.85) return "bg-emerald-500";
  if (v >= 0.70) return "bg-amber-500";
  return "bg-red-500";
}

function statusInfo(s: string) {
  const map: Record<string, { label: string; color: string; dot: string }> = {
    running: { label: "Ishlamoqda", color: "text-emerald-600", dot: "bg-emerald-500" },
    active:  { label: "Aktiv",      color: "text-emerald-600", dot: "bg-emerald-500" },
    paused:  { label: "To'xtatildi", color: "text-amber-600", dot: "bg-amber-500" },
    stopped: { label: "To'xtadi",   color: "text-red-600",    dot: "bg-red-500" },
    pending: { label: "Kutilmoqda", color: "text-muted-foreground", dot: "bg-muted-foreground" },
    completed:{ label: "Tugadi",    color: "text-blue-600",   dot: "bg-blue-500" },
  };
  return map[s] ?? { label: s, color: "text-muted-foreground", dot: "bg-muted-foreground" };
}

function fmt(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}s ${m}d` : `${m} daqiqa`;
}

function SectionTitle({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

function KpiCard({
  title, value, sub, icon: Icon, color, loading, accent,
}: {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; loading?: boolean; accent?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        {loading ? (
          <><Skeleton className="h-4 w-20 mb-3" /><Skeleton className="h-8 w-16 mb-1" /><Skeleton className="h-3 w-20" /></>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground">{title}</span>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", accent ?? "bg-primary/10")}>
                <Icon className={cn("w-4 h-4", color)} />
              </div>
            </div>
            <p className={cn("text-3xl font-bold tracking-tight", color)}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MESHomeDashboard() {
  const { data: stats, isLoading: sLoad, refetch: refetchStats } = useQuery<DashStats>({
    queryKey: ["/api/iot/dashboard/stats"],
    refetchInterval: 30000,
  });

  const { data: sessionsRaw, isLoading: sessLoad, refetch: refetchSess } = useQuery<Session[]>({
    queryKey: ["/api/iot/production-sessions"],
    refetchInterval: 30000,
  });

  const { data: downtimesRaw, isLoading: dtLoad } = useQuery<Downtime[]>({
    queryKey: ["/api/iot/downtime-events"],
    refetchInterval: 60000,
  });

  const { data: ordersRaw } = useQuery<{ orders: ProductionOrder[] }>({
    queryKey: ["/api/production/orders/report"],
    refetchInterval: 60000,
  });

  const sessions: Session[] = safeArray<Session>(sessionsRaw);
  const downtimes: Downtime[] = safeArray<Downtime>(downtimesRaw);
  const orders: ProductionOrder[] = safeArray<ProductionOrder>(ordersRaw, "orders");

  const activeSessions = (Array.isArray(sessions) ? sessions : []).filter(s => s.status === "running" || s.status === "active");
  const stoppedSessions = (Array.isArray(sessions) ? sessions : []).filter(s => s.status === "stopped" || s.status === "paused");

  const avgOee = stats?.averageOee ?? 0;
  const oeePercent = Math.round(avgOee * 100);

  const totalProduced = (Array.isArray(sessions) ? sessions : []).reduce((a, s) => a + (s.actualQuantity || 0), 0);
  const totalDefects  = (Array.isArray(sessions) ? sessions : []).reduce((a, s) => a + (s.defectQuantity || 0), 0);
  const defectRate    = totalProduced > 0 ? ((totalDefects / totalProduced) * 100).toFixed(1) : "0";

  const recentDowntimes = (Array.isArray(downtimes) ? [...downtimes] : []).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()).slice(0, 6);

  const inProgressOrders = (Array.isArray(orders) ? orders : []).filter(o => o.status === "in_progress");

  function refreshAll() {
    refetchStats(); refetchSess();
  }

  return (
    <div className="flex-1 overflow-auto bg-background p-5 space-y-6 pb-12">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            MES <span className="text-primary">Dashboard</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ishlab chiqarish real-vaqt monitoringi — {new Date().toLocaleDateString("uz-UZ")}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {stoppedSessions.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
              <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                {stoppedSessions.length} sessiya to'xtagan
              </span>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={refreshAll} data-testid="button-refresh-mes">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Yangilash
          </Button>
          <Button size="sm" asChild data-testid="button-orders-report">
            <Link href="/production/orders">
              <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> Hisobot
            </Link>
          </Button>
        </div>
      </div>

      {/* ── KPI KARTALAR ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Faol sessiyalar"
          value={sLoad ? "..." : (stats?.activeSessions ?? activeSessions.length)}
          sub={`Bugun bajarildi: ${stats?.completedToday ?? 0}`}
          icon={Play}
          color="text-emerald-600"
          accent="bg-emerald-50 dark:bg-emerald-900/20"
          loading={sLoad}
        />
        <KpiCard
          title="O'rtacha OEE"
          value={sLoad ? "..." : `${oeePercent}%`}
          sub={oeePercent >= 85 ? "Yaxshi" : oeePercent >= 70 ? "Qabul qilinadi" : "Yaxshilash kerak"}
          icon={Gauge}
          color={oeeColor(avgOee)}
          accent={oeePercent >= 85 ? "bg-emerald-50 dark:bg-emerald-900/20" : oeePercent >= 70 ? "bg-amber-50 dark:bg-amber-900/20" : "bg-red-50 dark:bg-red-900/20"}
          loading={sLoad}
        />
        <KpiCard
          title="Ishlab chiqarildi"
          value={sessLoad ? "..." : totalProduced.toLocaleString()}
          sub={`Brak: ${defectRate}%`}
          icon={Factory}
          color="text-blue-600"
          accent="bg-blue-50 dark:bg-blue-900/20"
          loading={sessLoad}
        />
        <KpiCard
          title="To'xtashlar"
          value={dtLoad ? "..." : downtimes.length}
          sub={`Rejalashmagan: ${(Array.isArray(downtimes) ? downtimes : []).filter(d => !d.isPlanned).length}`}
          icon={AlertTriangle}
          color={(Array.isArray(downtimes) ? downtimes : []).filter(d => !d.isPlanned).length > 3 ? "text-red-600" : "text-amber-600"}
          accent="bg-amber-50 dark:bg-amber-900/20"
          loading={dtLoad}
        />
      </div>

      {/* ── MASHINA HOLATI GRIDI ────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle icon={Cpu} title="Mashina holati" sub="Hozirgi sessiyalar" />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/mes/work-centers">
              Barchasi <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>
        {sessLoad ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {([1,2,3,4]).map(i => <Skeleton key={`k-${i}`} className="h-28 rounded-xl" />)}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">Sessiya topilmadi</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {sessions?.slice(0, 8).map(s => {
              const st = statusInfo(s.status);
              const progress = s.targetQuantity > 0 ? Math.min(100, Math.round((s.actualQuantity / s.targetQuantity) * 100)) : 0;
              const oeeVal = s.oee ? Math.round(s.oee * 100) : null;
              return (
                <div
                  key={s.id}
                  className={cn(
                    "rounded-xl border p-4 space-y-2",
                    s.status === "running" || s.status === "active"
                      ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-900/10"
                      : s.status === "stopped" || s.status === "paused"
                      ? "border-red-200 bg-red-50/60 dark:border-red-800 dark:bg-red-900/10"
                      : "border-border bg-muted/30"
                  )}
                  data-testid={`machine-cell-${s.equipmentId}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full shrink-0", st.dot)} />
                    <span className="text-xs font-bold text-foreground truncate">
                      {s.equipmentName || s.equipmentId}
                    </span>
                  </div>
                  <p className={cn("text-xs font-medium", st.color)}>{st.label}</p>
                  {s.orderNumber && (
                    <p className="text-[10px] text-muted-foreground truncate">{s.orderNumber}</p>
                  )}
                  <div className="space-y-1">
                    <Progress value={progress} className="h-1.5" />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{s.actualQuantity}/{s.targetQuantity}</span>
                      {oeeVal !== null && <span className={oeeColor(s.oee ?? 0)}>OEE {oeeVal}%</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 2 USTUNLI BLOK: Buyurtmalar + To'xtashlar ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Faol buyurtmalar */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-violet-500" />
                Faol buyurtmalar
              </CardTitle>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                <Link href="/production/orders">
                  Barchasi <ChevronRight className="w-3 h-3 ml-0.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {inProgressOrders.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                Hozir faol buyurtma yo'q
              </div>
            ) : (
              <div className="space-y-2">
                {inProgressOrders?.slice(0, 5).map(o => {
                  const pct = o.plannedQuantity > 0
                    ? Math.round((o.confirmedQuantity / o.plannedQuantity) * 100)
                    : 0;
                  return (
                    <div key={o.id} className="flex items-center gap-3" data-testid={`row-order-${o.id}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-foreground truncate">{o.orderNumber}</p>
                          <span className="text-[10px] text-muted-foreground ml-2 shrink-0">{pct}%</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                        {o.productName && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{o.productName}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" asChild className="shrink-0">
                        <Link href={`/production/orders/${o.id}`}>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* So'nggi to'xtashlar */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                So'nggi to'xtashlar
              </CardTitle>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                <Link href="/mes/downtimes">
                  Barchasi <ChevronRight className="w-3 h-3 ml-0.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {dtLoad ? (
              <div className="space-y-2">{([1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-10 w-full" />)}</div>
            ) : recentDowntimes.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                To'xtash qayd etilmagan
              </div>
            ) : (
              <div className="space-y-2">
                {(Array.isArray(recentDowntimes) ? recentDowntimes : []).map(d => {
                  const mins = d.durationSeconds ? Math.round(d.durationSeconds / 60) : null;
                  return (
                    <div key={d.id} className="flex items-start justify-between gap-2 text-sm" data-testid={`row-downtime-${d.id}`}>
                      <div className="flex items-start gap-2 min-w-0">
                        <span className={cn("mt-0.5 w-2 h-2 rounded-full shrink-0",
                          d.isPlanned ? "bg-blue-400" : "bg-red-500")} />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {d.reasonDescription || d.reasonCode}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {d.isPlanned ? "Rejalashtirilgan" : "Rejalashmagan"}
                            {mins !== null && ` · ${mins} daq`}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(d.startedAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── FAOL SESSIYALAR JADVALI ────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle icon={Activity} title="Faol sessiyalar" sub="Ishlayotgan xodimlar" />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/mes/workers">
              Tayinlashlar <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>
        {sessLoad ? (
          <Skeleton className="h-40 w-full" />
        ) : activeSessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Faol sessiya yo'q</div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="px-4 py-2 text-xs font-semibold text-muted-foreground">Uskuna</th>
                  <th className="px-4 py-2 text-xs font-semibold text-muted-foreground">Buyurtma</th>
                  <th className="px-4 py-2 text-xs font-semibold text-muted-foreground">Holat</th>
                  <th className="px-4 py-2 text-xs font-semibold text-muted-foreground text-right">Ish vaqti</th>
                  <th className="px-4 py-2 text-xs font-semibold text-muted-foreground text-right">OEE</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(activeSessions) ? activeSessions : []).map((s, i) => {
                  const st = statusInfo(s.status);
                  const oeeVal = s.oee !== undefined && s.oee !== null ? Math.round(s.oee * 100) : null;
                  return (
                    <tr key={s.id} className={cn("border-t", i % 2 === 0 ? "" : "bg-muted/20")} data-testid={`row-session-${s.id}`}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className={cn("w-2 h-2 rounded-full", st.dot)} />
                          <span className="font-medium text-foreground">{s.equipmentName || s.equipmentId}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{s.orderNumber || "—"}</td>
                      <td className="px-4 py-2.5">
                        <span className={cn("text-xs font-medium", st.color)}>{st.label}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">
                        <div className="flex items-center justify-end gap-1">
                          <Timer className="w-3 h-3" />
                          {fmt(s.runningTimeSeconds)}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold">
                        {oeeVal !== null ? (
                          <span className={oeeColor(s.oee ?? 0)}>{oeeVal}%</span>
                        ) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── TEZKOR HAVOLALAR ────────────────────────────────────────────────── */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Tezkor havolalar</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {([
            { label: "Ish markazlari", icon: Factory, href: "/mes/work-centers", color: "text-blue-500" },
            { label: "Mahsulotlar", icon: Package, href: "/mes/products", color: "text-violet-500" },
            { label: "Buyurtmalar", icon: BarChart3, href: "/production/orders", color: "text-emerald-500" },
            { label: "To'xtashlar", icon: AlertTriangle, href: "/mes/downtimes", color: "text-amber-500" },
            { label: "Xodimlar", icon: Users, href: "/mes/workers", color: "text-pink-500" },
            { label: "OEE Monitor", icon: TrendingUp, href: "/mes/oee-monitor", color: "text-primary" },
          ]).map(link => (
            <Link key={link.href} href={link.href}>
              <div className="rounded-xl border p-4 flex flex-col items-center gap-2 text-center hover-elevate cursor-pointer" data-testid={`link-quick-${link.href}`}>
                <div className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center">
                  <link.icon className={cn("w-4 h-4", link.color)} />
                </div>
                <span className="text-xs font-medium text-foreground">{link.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
