/**
 * @module TechDashboard
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ClipboardList, CheckCircle, Clock, AlertTriangle,
  RotateCcw, Layers, Zap, ChevronRight, Package,
  ArrowUpRight, Star, BarChart3, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DesignOrder {
  id: string; orderNumber?: string; clientName?: string;
  productName?: string; status?: string; productType?: string;
  createdAt?: string;
}

interface DesignStats {
  totalOrders: number; activeOrders: number; completedOrders: number;
  totalDesigns: number; approvedDesigns: number; totalTemplates: number;
  totalPrompts: number;
  ordersByStatus: Array<{ status: string; count: number }>;
  recentOrders: Array<{ id: string; orderNumber: string; clientName: string; productName: string; status: string }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  yangi: "Yangi",
  jarayonda: "Jarayonda",
  "tasdiq-kutilmoqda": "Mijoz tasdig'i kutilmoqda",
  tasdiqlangan: "Tasdiqlangan",
  "ishlab-chiqarish": "Ishlab chiqarishga o'tdi",
  yakunlangan: "Yakunlandi",
  "qayta-ishlash": "Qayta ishlash",
  pending_technology: "Texnolog tasdiqini kutmoqda",
  approved: "Tasdiqlandi",
  rejected: "Rad etildi",
};

const STATUS_COLOR: Record<string, string> = {
  yangi: "bg-blue-50 text-[var(--ep-blue)]",
  pending_technology: "bg-amber-50 text-[var(--ep-yellow)]",
  jarayonda: "bg-cyan-50 text-[var(--ep-cyan)]",
  "tasdiq-kutilmoqda": "bg-violet-50 text-[var(--ep-purple)]",
  tasdiqlangan: "bg-green-50 text-[var(--ep-green)]",
  "qayta-ishlash": "bg-red-50 text-[var(--ep-red)]",
  yakunlangan: "bg-muted text-muted-foreground",
  approved: "bg-green-50 text-[var(--ep-green)]",
  rejected: "bg-red-50 text-[var(--ep-red)]",
};

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
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TechDashboard() {
  const { data: stats, isLoading: sLoad } = useQuery<DesignStats>({
    queryKey: ["/api/design/statistics"],
  });
  const { data: ordersRaw, isLoading: oLoad } = useQuery<DesignOrder[] | { data?: DesignOrder[] }>({
    queryKey: ["/api/design/orders"],
  });
  const { data: templatesRaw, isLoading: tLoad } = useQuery<Record<string, unknown>[] | { data?: Record<string, unknown>[] }>({
    queryKey: ["/api/design/templates"],
  });

  const orders: DesignOrder[] = Array.isArray(ordersRaw) ? ordersRaw : (ordersRaw as { data?: DesignOrder[] })?.data || [];
  const templates: Record<string, unknown>[] = Array.isArray(templatesRaw) ? templatesRaw : (templatesRaw as { data?: Record<string, unknown>[] })?.data || [];

  const pendingTech = (Array.isArray(orders) ? orders : []).filter(o => o.status === "pending_technology" || o.status === "yangi");
  const needsRevision = (Array.isArray(orders) ? orders : []).filter(o => o.status === "qayta-ishlash");
  const awaitingClient = (Array.isArray(orders) ? orders : []).filter(o => o.status === "tasdiq-kutilmoqda");
  const todayApproved = (Array.isArray(orders) ? orders : []).filter(o => o.status === "tasdiqlangan" || o.status === "approved");

  const approvedDesigns = stats?.approvedDesigns || 0;
  const totalDesigns = stats?.totalDesigns || 0;
  const approvalRate = totalDesigns > 0 ? Math.round((approvedDesigns / totalDesigns) * 100) : 0;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Texnolog Dashbordi</h1>
          <p className="text-sm text-muted-foreground">Dizayn va texnologik tasdiq ko'rinishi</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn("text-sm font-semibold px-3",
            pendingTech.length === 0 ? "bg-green-50 text-[var(--ep-green)]" :
            pendingTech.length < 5 ? "bg-amber-50 text-[var(--ep-yellow)]" : "bg-red-50 text-[var(--ep-red)]"
          )}>
            Kutilmoqda: {sLoad ? "..." : pendingTech.length}
          </Badge>
          <Button variant="outline" size="sm" asChild>
            <Link href="/tech-approval">Tasdiqlash <ChevronRight className="w-3.5 h-3.5 ml-1" /></Link>
          </Button>
        </div>
      </div>

      {/* ── SECTION 1: Hozirgi holat ─────────────────────────── */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Hozirgi holat</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <KpiCard title="Jami buyurtmalar" value={stats?.totalOrders || 0}
            icon={ClipboardList} color="text-[var(--ep-blue)]" loading={sLoad} />
          <KpiCard title="Faol buyurtmalar" value={stats?.activeOrders || 0}
            sub="jarayonda" icon={Zap} color="text-[var(--ep-cyan)]" loading={sLoad} />
          <KpiCard title="Tasdiqlash kutilmoqda" value={pendingTech.length}
            icon={Clock} color="text-[var(--ep-yellow)]" loading={oLoad} />
          <KpiCard title="Qayta ishlash" value={needsRevision.length}
            icon={RotateCcw} color="text-[var(--ep-red)]" loading={oLoad} />
          <KpiCard title="Qoliplar" value={templates.length}
            sub="faol" icon={Layers} color="text-[var(--ep-purple)]" loading={tLoad} />
        </div>
      </section>

      {/* ── SECTION 2: E'tibor kerak ─────────────────────────── */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">E'tibor kerak</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* Texnolog tasdiqini kutuvchilar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--ep-yellow)]" />
                Tasdiq kutilmoqda
                {pendingTech.length > 0 && (
                  <Badge className="ml-auto bg-amber-50 text-[var(--ep-yellow)] text-xs">{pendingTech.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {oLoad ? <div className="space-y-2">{([1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-8 w-full rounded-lg" />)}</div> :
               pendingTech.length === 0 ? (
                <div className="flex items-center gap-2 py-4 justify-center text-sm text-[var(--ep-green)]">
                  <CheckCircle className="w-4 h-4" />
                  Hamma tasdiqlandi!
                </div>
               ) : (
                <div className="space-y-2">
                  {(Array.isArray(pendingTech) ? pendingTech : []).slice(0, 5).map(o => (
                    <div key={o.id} className="flex items-center justify-between text-sm py-0.5">
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate max-w-[140px]">{o.clientName || o.orderNumber || `#${o.id}`}</span>
                        {o.productName && <span className="text-xs text-muted-foreground truncate max-w-[140px]">{o.productName}</span>}
                      </div>
                      <Badge className={cn("text-xs ml-2 shrink-0", STATUS_COLOR[o.status || "yangi"])}>
                        {STATUS_LABELS[o.status || "yangi"] || o.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Qayta ishlash so'ralganlari */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[var(--ep-red)]" />
                Qayta ishlash
                {needsRevision.length > 0 && (
                  <Badge className="ml-auto bg-red-50 text-[var(--ep-red)] text-xs">{needsRevision.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {oLoad ? <div className="space-y-2">{([1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-8 w-full rounded-lg" />)}</div> :
               needsRevision.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Qayta ishlash yo'q</p>
               ) : (
                <div className="space-y-2">
                  {(Array.isArray(needsRevision) ? needsRevision : []).slice(0, 5).map(o => (
                    <div key={o.id} className="flex items-center justify-between text-sm py-0.5">
                      <span className="truncate max-w-[160px] text-muted-foreground">{o.clientName || o.orderNumber || `#${o.id}`}</span>
                      <Badge className="text-xs ml-2 shrink-0 bg-red-50 text-[var(--ep-red)]">Revision</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mijoz tasdig'i kutilmoqda */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-[var(--ep-purple)]" />
                Mijoz tasdig'ini kutmoqda
                {awaitingClient.length > 0 && (
                  <Badge className="ml-auto bg-violet-50 text-[var(--ep-purple)] text-xs">{awaitingClient.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {oLoad ? <div className="space-y-2">{([1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-8 w-full rounded-lg" />)}</div> :
               awaitingClient.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Kutilayotgan yo'q</p>
               ) : (
                <div className="space-y-2">
                  {(Array.isArray(awaitingClient) ? awaitingClient : []).slice(0, 5).map(o => (
                    <div key={o.id} className="flex items-center justify-between text-sm py-0.5">
                      <span className="truncate max-w-[160px] text-muted-foreground">{o.clientName || o.orderNumber || `#${o.id}`}</span>
                      <Badge className="text-xs ml-2 shrink-0 bg-violet-50 text-[var(--ep-purple)]">Kutilmoqda</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── SECTION 3: Statistika ─────────────────────────────── */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Statistika va trend</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Status bo'yicha */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[var(--ep-blue)]" />
                Buyurtmalar status bo'yicha
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sLoad ? <div className="space-y-2">{([1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-5 w-full rounded-lg" />)}</div> :
               !stats?.ordersByStatus?.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">Ma'lumot yo'q</p>
               ) : (
                <div className="space-y-2">
                  {(Array.isArray(stats?.ordersByStatus) ? stats.ordersByStatus : []).slice(0, 6).map(s => (
                    <div key={s.status} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{STATUS_LABELS[s.status] || s.status}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.min(100, (s.count / Math.max(1, stats.totalOrders)) * 100)}%` }} />
                        </div>
                        <span className="font-semibold w-6 text-right">{s.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Umumiy xulosa */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-[var(--ep-green)]" />
                Umumiy xulosa
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sLoad ? <div className="space-y-3">{([1,2,3,4]).map(i => <Skeleton key={`k-${i}`} className="h-5 w-full rounded-lg" />)}</div> : (
                <div className="space-y-3">
                  {([
                    { label: "Jami dizaynlar", value: stats?.totalDesigns || 0, color: "text-foreground" },
                    { label: "Tasdiqlangan dizaynlar", value: stats?.approvedDesigns || 0, color: "text-[var(--ep-green)]" },
                    { label: "Tasdiqlash darajasi", value: `${approvalRate}%`, color: approvalRate >= 70 ? "text-[var(--ep-green)]" : "text-[var(--ep-yellow)]" },
                    { label: "AI prompts", value: stats?.totalPrompts || 0, color: "text-[var(--ep-purple)]" },
                    { label: "Faol qoliplar", value: stats?.totalTemplates || 0, color: "text-[var(--ep-blue)]" },
                  ]).map(row => (
                    <div key={row.label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{row.label}</span>
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
        <Button variant="outline" size="sm" asChild><Link href="/tech-approval">Tasdiqlash navbati</Link></Button>
        <Button variant="outline" size="sm" asChild><Link href="/tech-cards">Texnik kartalar</Link></Button>
        <Button variant="outline" size="sm" asChild><Link href="/tech/parallel-orders">Parallel buyurtmalar</Link></Button>
        <Button variant="outline" size="sm" asChild><Link href="/design-dashboard">Dizayn dashbordi</Link></Button>
      </div>
    </div>
  );
}
