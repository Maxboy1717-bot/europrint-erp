import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Shield, CheckCircle, AlertTriangle, XCircle, Package,
  FlaskConical, TrendingDown, Star, ChevronRight, BarChart3,
  ClipboardList, Truck, Gauge, RefreshCw, Search, FileWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QcStats {
  braks: { count: number; totalQty: number; totalCostImpact?: number };
  tests: { total: number; passed: number; passRate: number };
  reclamations: { total: number; open: number };
  suppliers: number;
  finalInspections: number;
  openRca?: number;
}

interface QcFlowStream {
  label: string;
  total?: number;
  lowQuality?: number;
  inProduction?: number;
  pendingOrders?: number;
  resultCounts?: Record<string, number>;
  open?: number;
  investigating?: number;
  status: "ok" | "warning" | "active" | "needs_attention";
}

interface QcFlowData {
  streams: {
    incoming: QcFlowStream;
    inline: QcFlowStream;
    finalInspection: QcFlowStream;
    reclamation: QcFlowStream;
  };
  rca: { open: number };
}

interface QcBrak {
  id: string; quantity: number; reason?: string; stage?: string;
  costImpact?: string | number;
}

interface QcReclamation {
  id: string; status?: string; clientName?: string; claimDate?: string;
}

interface QcSupplierQuality {
  id: string; supplierName?: string; qualityScore?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function KpiCard({ title, value, sub, icon: Icon, color, loading }: {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        {loading ? (
          <><Skeleton className="h-4 w-20 mb-2" /><Skeleton className="h-8 w-12 mb-1" /><Skeleton className="h-3 w-16" /></>
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

function StreamCard({ label, status, children, icon: Icon }: {
  label: string;
  status: "ok" | "warning" | "active" | "needs_attention";
  children: React.ReactNode;
  icon: React.ElementType;
}) {
  const statusBadge = {
    ok: { label: "Normal", cls: "bg-green-50 text-green-700" },
    warning: { label: "Diqqat", cls: "bg-amber-50 text-amber-700" },
    active: { label: "Faol", cls: "bg-blue-50 text-blue-700" },
    needs_attention: { label: "E'tibor kerak", cls: "bg-orange-50 text-orange-700" },
  }[status];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span>{label}</span>
          <Badge className={cn("ml-auto text-xs", statusBadge.cls)}>{statusBadge.label}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// ─── Final result label ───────────────────────────────────────────────────────

const RESULT_LABELS: Record<string, { label: string; cls: string }> = {
  passed:           { label: "O'tdi", cls: "bg-green-50 text-green-700" },
  conditional_pass: { label: "Shartli o'tdi", cls: "bg-teal-50 text-teal-700" },
  rework_required:  { label: "Qayta ishlash", cls: "bg-amber-50 text-amber-700" },
  failed:           { label: "Muvaffaqiyatsiz", cls: "bg-red-50 text-red-700" },
  pending:          { label: "Kutilmoqda", cls: "bg-muted text-muted-foreground" },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QCDashboard() {
  const { data: stats, isLoading: sLoad } = useQuery<QcStats>({ queryKey: ["/api/qc/dashboard/stats"] });
  const { data: flow, isLoading: fLoad } = useQuery<QcFlowData>({ queryKey: ["/api/qc/dashboard/flow"] });
  const { data: braks, isLoading: bLoad } = useQuery<QcBrak[]>({ queryKey: ["/api/qc/braks"] });
  const { data: recRaw, isLoading: rLoad } = useQuery<QcReclamation[]>({ queryKey: ["/api/qc/reclamations"] });
  const { data: supplier, isLoading: suLoad } = useQuery<QcSupplierQuality[]>({ queryKey: ["/api/qc/supplier-quality"] });

  const recs: QcReclamation[] = Array.isArray(recRaw) ? recRaw : [];
  const suppliers: QcSupplierQuality[] = Array.isArray(supplier) ? supplier : [];
  const brakList: QcBrak[] = Array.isArray(braks) ? braks : [];

  const passRate = stats?.tests?.passRate || 0;
  const passColor = passRate >= 95 ? "text-green-600" : passRate >= 85 ? "text-amber-600" : "text-red-600";

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">QC — Sifat Nazorati</h1>
          <p className="text-sm text-muted-foreground">4 ta QC oqimi | Sifat bo'limi boshlig'ining kunlik ko'rinishi</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={cn("text-sm font-semibold px-3",
            passRate >= 95 ? "bg-green-50 text-green-700" :
            passRate >= 85 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
          )}>
            O'tish darajasi: {sLoad ? "..." : `${passRate}%`}
          </Badge>
          {(stats?.openRca || 0) > 0 && (
            <Badge className="bg-orange-50 text-orange-700 text-sm px-3">
              {stats!.openRca} ochiq RCA
            </Badge>
          )}
        </div>
      </div>

      {/* ── SECTION 1: KPI Kartalar ────────────────────────── */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Hozirgi holat</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard title="Jami testlar" value={stats?.tests?.total || 0}
            sub={`${stats?.tests?.passed || 0} ta o'tdi`} icon={FlaskConical} color="text-blue-500" loading={sLoad} />
          <KpiCard title="O'tish darajasi" value={`${passRate}%`}
            sub="passed / total" icon={Gauge} color={passColor} loading={sLoad} />
          <KpiCard title="Braklar" value={stats?.braks?.count || 0}
            sub={`${stats?.braks?.totalQty || 0} dona`} icon={XCircle} color="text-red-500" loading={sLoad} />
          <KpiCard title="Brak xarajat" value={stats?.braks?.totalCostImpact ? `${Number(stats.braks.totalCostImpact).toLocaleString()} so'm` : "0"}
            sub="umumiy yo'qotish" icon={TrendingDown} color="text-red-400" loading={sLoad} />
          <KpiCard title="Reklamatsiyalar" value={stats?.reclamations?.total || 0}
            sub={`${stats?.reclamations?.open || 0} ta ochiq`} icon={AlertTriangle} color="text-amber-500" loading={sLoad} />
          <KpiCard title="Ochiq RCA" value={stats?.openRca || 0}
            sub="ildiz sabab tahlil" icon={Search} color="text-orange-500" loading={sLoad} />
        </div>
      </section>

      {/* ── SECTION 2: 4 ta QC Oqimi ─────────────────────── */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">4 ta QC oqimi</p>
        {fLoad ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {([1,2,3,4]).map(i => <Card key={`k-${i}`}><CardContent className="p-5"><Skeleton className="h-24 w-full" /></CardContent></Card>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* 1-oqim: Kiruvchi material */}
            <StreamCard label="Kiruvchi material" status={flow?.streams?.incoming?.status || "ok"} icon={Package}>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jami tekshiruvlar</span>
                  <span className="font-semibold">{flow?.streams?.incoming?.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Past sifat (&lt;70)</span>
                  <span className={cn("font-semibold", (flow?.streams?.incoming?.lowQuality || 0) > 0 ? "text-red-600" : "text-green-600")}>
                    {flow?.streams?.incoming?.lowQuality || 0}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground pt-1">MM reytingi avtomatik pasaytiriladi</p>
              </div>
            </StreamCard>

            {/* 2-oqim: Inline nazorat */}
            <StreamCard label="Inline nazorat" status={flow?.streams?.inline?.status || "active"} icon={Shield}>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ishlab chiqarishda</span>
                  <span className="font-semibold">{flow?.streams?.inline?.inProduction || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground pt-1">Kritik og'ish → QC hold avtomatik</p>
              </div>
            </StreamCard>

            {/* 3-oqim: Final inspeksiya */}
            <StreamCard label="Final inspeksiya" status={flow?.streams?.finalInspection?.status || "ok"} icon={ClipboardList}>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kutilmoqda</span>
                  <span className="font-semibold">{flow?.streams?.finalInspection?.pendingOrders || 0}</span>
                </div>
                {flow?.streams?.finalInspection?.resultCounts && Object.entries(flow.streams.finalInspection.resultCounts).slice(0, 3).map(([result, cnt]) => (
                  <div key={result} className="flex justify-between items-center">
                    <Badge className={cn("text-xs", RESULT_LABELS[result]?.cls || "bg-muted text-muted-foreground")}>
                      {RESULT_LABELS[result]?.label || result}
                    </Badge>
                    <span className="font-semibold text-xs">{cnt}</span>
                  </div>
                ))}
              </div>
            </StreamCard>

            {/* 4-oqim: Reklamatsiya */}
            <StreamCard label="Reklamatsiyalar" status={flow?.streams?.reclamation?.status || "ok"} icon={FileWarning}>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Yangi</span>
                  <span className={cn("font-semibold", (flow?.streams?.reclamation?.open || 0) > 0 ? "text-red-600" : "text-green-600")}>
                    {flow?.streams?.reclamation?.open || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ko'rib chiqilmoqda</span>
                  <span className="font-semibold text-amber-600">{flow?.streams?.reclamation?.investigating || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground pt-1">RCA avtomatik ochiladi</p>
              </div>
            </StreamCard>

          </div>
        )}
      </section>

      {/* ── SECTION 3: E'tibor kerak ─────────────────────── */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">E'tibor kerak</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Ochiq reklamatsiyalar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Ochiq reklamatsiyalar
                <Badge variant="outline" className="ml-auto text-xs">{(Array.isArray(recs) ? recs : []).filter(r => r.status === "new").length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rLoad ? <div className="space-y-2">{([1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-8 w-full" />)}</div> :
               recs.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Reklamatsiya yo'q</p> : (
                <div className="space-y-2">
                  {(Array.isArray(recs) ? recs : []).slice(0, 5).map(r => (
                    <div key={r.id} className="flex items-center justify-between text-sm py-1">
                      <span className="truncate max-w-[160px] text-muted-foreground">
                        {r.clientName || `#${r.id}`}
                      </span>
                      <Badge className={cn("text-xs shrink-0 ml-2",
                        r.status === "new" ? "bg-red-50 text-red-700" :
                        r.status === "investigating" ? "bg-amber-50 text-amber-700" :
                        "bg-green-50 text-green-700"
                      )}>
                        {r.status === "new" ? "Yangi" : r.status === "investigating" ? "Ko'rilmoqda" : r.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Brak tahlili */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                Brak sabablari
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bLoad ? <div className="space-y-2">{([1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-8 w-full" />)}</div> :
               brakList.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Brak topilmadi</p> : (
                <div className="space-y-2">
                  {(Array.isArray(brakList) ? brakList : []).slice(0, 5).map((b, i) => (
                    <div key={b.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground truncate max-w-[180px]">
                        {b.reason || `Brak #${i + 1}`}
                      </span>
                      <span className="font-semibold text-red-600 ml-2">{b.quantity} dona</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Yetkazuvchi sifati */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-violet-500" />
                Yetkazuvchi sifati
                <Badge variant="outline" className="ml-auto text-xs">{suppliers.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {suLoad ? <div className="space-y-2">{([1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-8 w-full" />)}</div> :
               suppliers.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Ma'lumot yo'q</p> : (
                <div className="space-y-2">
                  {(Array.isArray(suppliers) ? suppliers : []).slice(0, 5).map(s => (
                    <div key={s.id} className="flex items-center justify-between text-sm py-1">
                      <span className="truncate max-w-[140px] text-muted-foreground">
                        {s.supplierName || `#${s.id}`}
                      </span>
                      <span className={cn("font-semibold text-xs ml-2",
                        (s.qualityScore || 0) >= 90 ? "text-green-600" :
                        (s.qualityScore || 0) >= 70 ? "text-amber-600" : "text-red-600"
                      )}>
                        {s.qualityScore !== undefined ? `${s.qualityScore}/100` : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── SECTION 4: Sifat xulosa ────────────────── */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Sifat ko'rsatkichlari</p>
        <Card>
          <CardContent className="p-5">
            {sLoad ? <div className="space-y-3">{([1,2,3,4]).map(i => <Skeleton key={`k-${i}`} className="h-5 w-full" />)}</div> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  { label: "O'tish darajasi", value: `${stats?.tests?.passRate || 0}%`, target: "≥ 95%", ok: (stats?.tests?.passRate || 0) >= 95 },
                  { label: "Ochiq reklamatsiyalar", value: stats?.reclamations?.open || 0, target: "= 0", ok: (stats?.reclamations?.open || 0) === 0 },
                  { label: "Brak soni", value: stats?.braks?.count || 0, target: "< 5", ok: (stats?.braks?.count || 0) < 5 },
                  { label: "Ochiq RCA", value: stats?.openRca || 0, target: "= 0", ok: (stats?.openRca || 0) === 0 },
                ]).map(row => (
                  <div key={row.label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{row.value}</span>
                      <span className="text-xs text-muted-foreground">({row.target})</span>
                      {row.ok
                        ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Tezkor harakatlar */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild><Link href="/qc-module">QC Moduli <ChevronRight className="w-3.5 h-3.5 ml-1" /></Link></Button>
        <Button variant="outline" size="sm" asChild><Link href="/qc-extended">QC Extended <ChevronRight className="w-3.5 h-3.5 ml-1" /></Link></Button>
        <Button variant="outline" size="sm" asChild><Link href="/qc-final">Final Inspeksiya <ChevronRight className="w-3.5 h-3.5 ml-1" /></Link></Button>
        <Button variant="outline" size="sm" asChild><Link href="/qc-approval">Tasdiqlash <ChevronRight className="w-3.5 h-3.5 ml-1" /></Link></Button>
      </div>
    </div>
  );
}
