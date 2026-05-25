/**
 * @module MESDashboard
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { safeArray } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Factory, Gauge, Clock, AlertTriangle, CheckCircle,
  Wrench, Play, Users, ChevronRight, BarChart3,
  Zap, Package, Star, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

import { useTranslation } from '@/lib/i18n';
// ─── Types ────────────────────────────────────────────────────────────────────

interface MesStats {
  maintenance: { total: number; pending: number; inProgress: number; completed: number };
  tasks: { total: number; active: number; completed: number };
  oee: { overall: number; availability: number; performance: number; quality: number };
}

interface MesOee {
  machineId?: number; machineName?: string; overall?: number;
  availability?: number; performance?: number; quality?: number;
  status?: string;
}

interface MesTask {
  id: number; machineName?: string; status?: string;
  operatorName?: string; targetQuantity?: number;
  completedQuantity?: number; plannedStart?: string;
}

interface PapkaOrder {
  id: number; orderNumber?: string; clientName?: string;
  tiraj?: number; status?: string; deadline?: string;
  productType?: string;
}

interface MesSession {
  id: number; machineName?: string; status?: string;
  shiftName?: string; operatorName?: string; startTime?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function oeeColor(v: number) {
  return v >= 85 ? "text-[var(--ep-green)]" : v >= 70 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]";
}

function KpiCard({ title, value, sub, icon: Icon, color, loading }: {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        {loading ? (
          <><Skeleton className="h-4 w-20 mb-2 rounded-lg" /><Skeleton className="h-8 w-12 mb-1 rounded-lg" /><Skeleton className="h-3 w-16 rounded-lg" /></>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={cn("w-4 h-4", color)} />
              <span className="text-xs font-medium text-muted-foreground">{title}</span>
            </div>
            <p className={cn("text-2xl font-bold tracking-tight", color)}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MESDashboard() {
  const { t } = useTranslation('common');
  const { data: stats, isLoading: sLoad } = useQuery<MesStats>({ queryKey: ["/api/mes/stats"] });
  const { data: oeeRaw, isLoading: oLoad } = useQuery<unknown>({ queryKey: ["/api/mes/oee"] });
  const { data: tasksRaw, isLoading: tLoad } = useQuery<unknown>({ queryKey: ["/api/mes/tasks"] });
  const { data: ordersRaw, isLoading: pLoad } = useQuery<unknown>({ queryKey: ["/api/mes/papka-orders"] });
  const { data: sessionsRaw, isLoading: seLoad } = useQuery<unknown>({ queryKey: ["/api/mes/sessions"] });

  const loading = sLoad || oLoad || tLoad || pLoad || seLoad;

  const oeeList: MesOee[] = safeArray<MesOee>(oeeRaw);
  const tasks: MesTask[] = safeArray<MesTask>(tasksRaw);
  const orders: PapkaOrder[] = safeArray<PapkaOrder>(ordersRaw);
  const sessions: MesSession[] = safeArray<MesSession>(sessionsRaw);

  const oeeGlobal = stats?.oee?.overall || 0;
  const activeTasks = (Array.isArray(tasks) ? tasks : []).filter(t => t.status === "in_progress").length;
  const activeOrders = (Array.isArray(orders) ? orders : []).filter(o => o.status === "ishlab_chiqarishda" || o.status === "production").length;

  const statusBadge: Record<string, { label: string; cls: string }> = {
    in_progress: { label: "Jarayonda", cls: "bg-blue-50 text-[var(--ep-blue)]" },
    completed: { label: "Tugadi", cls: "bg-green-50 text-[var(--ep-green)]" },
    pending: { label: "Kutilmoqda", cls: "bg-amber-50 text-[var(--ep-yellow)]" },
    stopped: { label: "To'xtadi", cls: "bg-red-50 text-[var(--ep-red)]" },
    idle: { label: "Bo'sh", cls: "bg-muted text-muted-foreground" },
    active: { label: "Aktiv", cls: "bg-blue-50 text-[var(--ep-blue)]" },
  };

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("mesIshlabChiqarish")}</h1>
          <p className="text-sm text-muted-foreground">{t("sexBoshliginingRealTimeKorinishi")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn("text-sm font-semibold px-3", oeeGlobal >= 85 ? "bg-green-50 text-[var(--ep-green)]" : oeeGlobal >= 70 ? "bg-amber-50 text-[var(--ep-yellow)]" : "bg-red-50 text-[var(--ep-red)]")}>
            OEE: {sLoad ? "..." : `${oeeGlobal}%`}
          </Badge>
          <Button variant="outline" size="sm" asChild>
            <Link href="/mes/oee-monitor">{t("mesMonitor")}<ChevronRight className="w-3.5 h-3.5 ml-1" /></Link>
          </Button>
        </div>
      </div>

      {/* ── SECTION 1: Hozirgi holat ─────────────────────────── */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{t("hozirgiHolatRealTime")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <KpiCard title="OEE" value={`${stats?.oee?.overall || 0}%`}
            sub="Overall Equipment" icon={Gauge} color={oeeColor(oeeGlobal)} loading={sLoad} />
          <KpiCard title={t("Mavjudlik")} value={`${stats?.oee?.availability || 0}%`}
            sub="Availability" icon={Activity} color="text-[var(--ep-blue)]" loading={sLoad} />
          <KpiCard title={t("faolVazifalar")} value={activeTasks}
            sub="hozir ishlayapti" icon={Play} color="text-[var(--ep-green)]" loading={tLoad} />
          <KpiCard title={t("buyurtmalar")} value={activeOrders}
            sub="ishlab chiqarishda" icon={Package} color="text-[var(--ep-purple)]" loading={pLoad} />
          <KpiCard title={t("tamirlash")} value={stats?.maintenance?.pending || 0}
            sub="kutilmoqda" icon={Wrench} color="text-[var(--ep-yellow)]" loading={sLoad} />
        </div>
      </section>

      {/* ── SECTION 2: E'tibor kerak ─────────────────────────── */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{t("etiborKerak")}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* Mashinalar OEE */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Factory className="w-4 h-4 text-[var(--ep-blue)]" />
                {t("mashinalarOee")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {oLoad ? <div className="space-y-2">{([1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-6 w-full rounded-lg" />)}</div> :
               oeeList.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">{t("mashinaTopilmadi")}</p> : (
                <div className="space-y-2">
                  {oeeList?.slice(0, 6).map((m, i) => (
                    <div key={m.machineId || i} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground truncate max-w-[130px]">{m.machineName || `Mashina #${m.machineId}`}</span>
                      <div className="flex items-center gap-2 ml-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", (m.overall||0) >= 85 ? "bg-green-500" : (m.overall||0) >= 70 ? "bg-amber-500" : "bg-red-500")}
                            style={{ width: `${Math.min(100, m.overall || 0)}%` }} />
                        </div>
                        <span className={cn("font-semibold text-xs w-8 text-right", oeeColor(m.overall || 0))}>
                          {m.overall || 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Faol vazifalar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Play className="w-4 h-4 text-[var(--ep-green)]" />
                {t("faolVazifalar")}
                <Badge variant="outline" className="ml-auto text-xs">{tasks.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tLoad ? <div className="space-y-2">{([1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-8 w-full rounded-lg" />)}</div> :
               tasks.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">{t("vazifaYoq")}</p> : (
                <div className="space-y-2">
                  {tasks?.slice(0, 5).map(t => (
                    <div key={t.id} className="flex items-center justify-between text-sm py-0.5">
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate max-w-[130px]">{t.machineName || `Vazifa #${t.id}`}</span>
                        {t.operatorName && <span className="text-xs text-muted-foreground">{t.operatorName}</span>}
                      </div>
                      <Badge className={cn("text-xs ml-2 shrink-0", statusBadge[t.status || "pending"]?.cls || "bg-muted text-muted-foreground")}>
                        {statusBadge[t.status || "pending"]?.label || t.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Buyurtmalar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-[var(--ep-purple)]" />
                {t("buyurtmalar")}
                <Badge variant="outline" className="ml-auto text-xs">{orders.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pLoad ? <div className="space-y-2">{([1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-8 w-full rounded-lg" />)}</div> :
               orders.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">{t("buyurtmaYoq")}</p> : (
                <div className="space-y-2">
                  {orders?.slice(0, 5).map(o => (
                    <div key={o.id} className="flex items-center justify-between text-sm py-0.5">
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate max-w-[130px]">{o.clientName || o.orderNumber || `#${o.id}`}</span>
                        {o.tiraj && <span className="text-xs text-muted-foreground">{o.tiraj} dona</span>}
                      </div>
                      <Badge className={cn("text-xs ml-2 shrink-0", statusBadge[o.status || "pending"]?.cls || "bg-muted text-muted-foreground")}>
                        {statusBadge[o.status || "pending"]?.label || o.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── SECTION 3: Tarix va trend ────────────────────────── */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{t("smenaVaTamirlash")}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Smenalar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--ep-blue)]" />
                {t("faolSmenalar")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {seLoad ? <div className="space-y-2">{([1,2]).map(i => <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg" />)}</div> :
               sessions.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">{t("smenaTopilmadi")}</p> : (
                <div className="space-y-2">
                  {sessions?.slice(0, 4).map(s => (
                    <div key={s.id} className="flex items-center justify-between text-sm py-1">
                      <div className="flex flex-col">
                        <span className="font-medium">{s.machineName || s.shiftName || `Smena #${s.id}`}</span>
                        {s.operatorName && <span className="text-xs text-muted-foreground">{s.operatorName}</span>}
                      </div>
                      <Badge className={cn("text-xs", statusBadge[s.status || "active"]?.cls)}>
                        {statusBadge[s.status || "active"]?.label || s.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ta'mirlash holati */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[var(--ep-yellow)]" />
                {t("tamirlashHolati")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sLoad ? <div className="space-y-3">{([1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-5 w-full rounded-lg" />)}</div> : (
                <div className="space-y-3">
                  {([
                    { label: "Jami ta'mirlash", value: stats?.maintenance?.total || 0, icon: Wrench, color: "text-muted-foreground" },
                    { label: "Jarayonda", value: stats?.maintenance?.inProgress || 0, icon: Play, color: "text-[var(--ep-blue)]" },
                    { label: "Kutilmoqda", value: stats?.maintenance?.pending || 0, icon: Clock, color: "text-[var(--ep-yellow)]" },
                    { label: "Bajarildi", value: stats?.maintenance?.completed || 0, icon: CheckCircle, color: "text-[var(--ep-green)]" },
                  ]).map(row => (
                    <div key={row.label} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <row.icon className={cn("w-3.5 h-3.5", row.color)} />
                        <span className="text-muted-foreground">{row.label}</span>
                      </div>
                      <span className={cn("font-semibold", row.color)}>{row.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tezkor harakatlar */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild><Link href="/mes/oee-monitor">{t('oeeMonitor')}</Link></Button>
        <Button variant="outline" size="sm" asChild><Link href="/mes/reason-log">{t("toxtashLog")}</Link></Button>
        <Button variant="outline" size="sm" asChild><Link href="/mes/maintenance-request">{t("tamirlashSorovi")}</Link></Button>
        <Button variant="outline" size="sm" asChild><Link href="/mes/gamification">{t("reyting")}</Link></Button>
      </div>
    </div>
  );
}
