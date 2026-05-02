import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { wmsApi } from "@/lib/api/wms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { useToast } from "@/hooks/use-toast";
import {
  Package, AlertTriangle, ArrowDownCircle, ArrowUpCircle,
  BarChart3, Truck, Clock, TrendingUp, BoxesIcon, Layers,
  Plus, Bell, RefreshCw, ArrowRightLeft,
} from "lucide-react";
import { Link } from "wouter";

interface WMSKPIs {
  totalMaterials: number;
  totalValue: number;
  lowStockCount: number;
  pendingReceipts: number;
  pendingTransfers: number;
  overdueReservations: number;
}
interface MovementSummary {
  totalIn: number; totalOut: number; netChange: number; transactionCount: number;
}
interface AlertData {
  lowStock: { id: number; name: string; kod: string; currentStock: number; minStock: number }[];
  lowStockCount: number; pendingQC: number; expiringBatches: number; overdueTasks: number;
}
interface TopMaterial {
  materialId: number; name: string; kod: string; value: number; movement: number;
}

function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={`k-${i}`}><CardContent className="pt-6">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-20" />
        </CardContent></Card>
      ))}
    </div>
  );
}

export default function WMSDashboard() {
  const { toast } = useToast();
  const [createWarehouseOpen, setCreateWarehouseOpen] = useState(false);
  const [createRequestOpen, setCreateRequestOpen] = useState(false);
  const [warehouseForm, setWarehouseForm] = useState({ name: "", code: "", type: "main" });
  const [requestForm, setRequestForm] = useState({ materialId: "", quantity: "", reason: "" });

  const { data: kpis, isLoading: kpisLoading, isError, refetch } = useQuery<WMSKPIs>({
    queryKey: ["/api/warehouse/dashboard/kpis"],
  });
  const { data: todayMovement, isLoading: movementLoading } = useQuery<MovementSummary>({
    queryKey: ["/api/warehouse/dashboard/movement-summary"],
  });
  const { data: weekMovement } = useQuery<MovementSummary>({
    queryKey: ["/api/warehouse/dashboard/movement-summary", "week"],
    queryFn: () => fetch("/api/warehouse/dashboard/movement-summary?period=week").then(r => r.json()),
  });
  const { data: alerts, isLoading: alertsLoading } = useQuery<AlertData>({
    queryKey: ["/api/warehouse/dashboard/alerts"],
  });
  const { data: topMaterials, isLoading: topLoading } = useQuery<TopMaterial[]>({
    queryKey: ["/api/warehouse/dashboard/top-materials"],
    queryFn: () => fetch("/api/warehouse/dashboard/top-materials?by=value&limit=8").then(r => r.json()),
  });

  const checkAlertsMutation = useMutation({
    mutationFn: () => wmsApi.checkAlerts(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/dashboard/alerts"] });
      toast({ title: "Alertlar tekshirildi", description: "Ombor holatidagi muammolar yangilandi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const createWarehouseMutation = useMutation({
    mutationFn: (data: typeof warehouseForm) => wmsApi.createWarehouseCompat(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/dashboard/kpis"] });
      setCreateWarehouseOpen(false);
      setWarehouseForm({ name: "", code: "", type: "main" });
      toast({ title: "Ombor yaratildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const createRequestMutation = useMutation({
    mutationFn: (data: typeof requestForm) => wmsApi.createInternalRequest({
      materialId: Number(data.materialId),
      quantity: Number(data.quantity),
      reason: data.reason,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wms/internal-requests"] });
      setCreateRequestOpen(false);
      setRequestForm({ materialId: "", quantity: "", reason: "" });
      toast({ title: "Ichki so'rov yaratildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const reserveStockMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => wmsApi.reserveStock(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/dashboard/kpis"] });
      toast({ title: "Zaxira band qilindi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  if (isError) return <ErrorState onRetry={refetch} />;
  const totalAlerts = (alerts?.lowStockCount || 0) + (alerts?.pendingQC || 0) + (alerts?.overdueTasks || 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Ombor Boshqaruvi"
        subtitle="WMS — Joriy holat va operatsiyalar"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => checkAlertsMutation.mutate()}
              disabled={checkAlertsMutation.isPending}
            >
              <Bell className="h-4 w-4 mr-2" />
              Alertlarni tekshirish
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Yangilash
            </Button>
            <Button
              size="sm"
              onClick={() => setCreateRequestOpen(true)}
            >
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Ichki so'rov
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setCreateWarehouseOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Yangi ombor
            </Button>
            <Link href="/wms">
              <Badge variant="outline" className="cursor-pointer">
                Ombor moduliga o'tish
              </Badge>
            </Link>
          </div>
        }
      />

      {/* KPI cards */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Joriy holat</h2>
        {kpisLoading ? <KPISkeleton /> : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Jami materiallar</p>
                    <p className="text-3xl font-bold mt-1">{kpis?.totalMaterials || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">nomenklatura pozitsiya</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-500 opacity-70" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ombor qiymati</p>
                    <p className="text-2xl font-bold mt-1">
                      {(kpis?.totalValue || 0) >= 1_000_000
                        ? `${((kpis?.totalValue || 0) / 1_000_000).toFixed(1)}M`
                        : (kpis?.totalValue || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">so'm</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-emerald-500 opacity-70" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Kam qoldiq</p>
                    <p className="text-3xl font-bold mt-1 text-red-600">{kpis?.lowStockCount || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">minimal ostida</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-400 opacity-70" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Kutilayotgan qabul</p>
                    <p className="text-3xl font-bold mt-1">{kpis?.pendingReceipts || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">goods receipt</p>
                  </div>
                  <ArrowDownCircle className="h-8 w-8 text-green-500 opacity-70" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Aktiv transferlar</p>
                    <p className="text-3xl font-bold mt-1">{kpis?.pendingTransfers || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">harakatda</p>
                  </div>
                  <Truck className="h-8 w-8 text-purple-500 opacity-70" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Muddati o'tgan</p>
                    <p className="text-3xl font-bold mt-1 text-orange-600">{kpis?.overdueReservations || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">rezervatsiya</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-400 opacity-70" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Movement + Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              Bugungi harakat
            </CardTitle>
          </CardHeader>
          <CardContent>
            {movementLoading ? (
              <div className="space-y-3"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-md bg-green-50">
                  <div className="flex items-center gap-2">
                    <ArrowDownCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">Kirim</span>
                  </div>
                  <span className="text-lg font-bold text-green-700">{(todayMovement?.totalIn || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-red-50">
                  <div className="flex items-center gap-2">
                    <ArrowUpCircle className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium">Chiqim</span>
                  </div>
                  <span className="text-lg font-bold text-red-700">{(todayMovement?.totalOut || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Sof o'zgarish</span>
                  </div>
                  <span className={`text-lg font-bold ${(todayMovement?.netChange || 0) >= 0 ? "text-green-700" : "text-red-700"}`}>
                    {(todayMovement?.netChange || 0) >= 0 ? "+" : ""}{(todayMovement?.netChange || 0).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Jami {todayMovement?.transactionCount || 0} ta tranzaksiya | Hafta: {weekMovement?.transactionCount || 0} ta
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => reserveStockMutation.mutate({ auto: true })}
                  disabled={reserveStockMutation.isPending}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Avtomatik zaxira tekshirish
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Diqqat talab qiluvchi
              </span>
              <div className="flex items-center gap-2">
                {totalAlerts > 0 && <Badge variant="destructive">{totalAlerts}</Badge>}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => checkAlertsMutation.mutate()}
                  disabled={checkAlertsMutation.isPending}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${checkAlertsMutation.isPending ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-10 w-full" />)}</div>
            ) : (
              <div className="space-y-2">
                {(alerts?.pendingQC || 0) > 0 && (
                  <div className="flex items-center justify-between p-2 rounded-md border border-yellow-200 bg-yellow-50">
                    <span className="text-sm">QC nazoratida kutayotgan</span>
                    <Badge variant="secondary">{alerts?.pendingQC}</Badge>
                  </div>
                )}
                {(alerts?.expiringBatches || 0) > 0 && (
                  <div className="flex items-center justify-between p-2 rounded-md border border-orange-200 bg-orange-50">
                    <span className="text-sm">Muddati yaqin partiyalar (30 kun)</span>
                    <Badge variant="secondary">{alerts?.expiringBatches}</Badge>
                  </div>
                )}
                {(alerts?.overdueTasks || 0) > 0 && (
                  <div className="flex items-center justify-between p-2 rounded-md border border-red-200 bg-red-50">
                    <span className="text-sm">Muddati o'tgan rezervatsiyalar</span>
                    <Badge variant="destructive">{alerts?.overdueTasks}</Badge>
                  </div>
                )}
                {(alerts?.lowStock || []).slice(0, 4).map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded-md border border-red-100 bg-red-50/60">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.kod} · Min: {m.minStock}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <Badge variant="destructive">{m.currentStock}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs px-2"
                        onClick={() => reserveStockMutation.mutate({ materialId: m.id, urgent: true })}
                      >
                        So'rov
                      </Button>
                    </div>
                  </div>
                ))}
                {totalAlerts === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Hozircha muammolar yo'q</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top materials */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BoxesIcon className="h-4 w-4 text-blue-500" />
            Top materiallar (qiymat bo'yicha)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-10 w-full" />)}</div>
          ) : (
            <div className="space-y-1">
              {(topMaterials || []).map((m, idx) => {
                const maxVal = topMaterials?.[0]?.value || 1;
                const pct = Math.round((m.value / maxVal) * 100);
                return (
                  <div key={m.materialId} className="flex items-center gap-3 py-2">
                    <span className="text-xs text-muted-foreground w-5 text-right">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">{m.name}</p>
                        <span className="text-sm font-semibold shrink-0 ml-2">
                          {m.value >= 1_000_000 ? `${(m.value / 1_000_000).toFixed(1)}M` : m.value.toLocaleString()} so'm
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!topMaterials || topMaterials.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">Material ma'lumotlari topilmadi</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Warehouse Dialog */}
      <Dialog open={createWarehouseOpen} onOpenChange={setCreateWarehouseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi ombor yaratish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nomi</Label>
              <Input
                value={warehouseForm.name}
                onChange={e => setWarehouseForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Ombor nomi"
              />
            </div>
            <div className="space-y-2">
              <Label>Kodi</Label>
              <Input
                value={warehouseForm.code}
                onChange={e => setWarehouseForm(p => ({ ...p, code: e.target.value }))}
                placeholder="WH-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Turi</Label>
              <Select value={warehouseForm.type} onValueChange={v => setWarehouseForm(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Asosiy</SelectItem>
                  <SelectItem value="transit">Tranzit</SelectItem>
                  <SelectItem value="production">Ishlab chiqarish</SelectItem>
                  <SelectItem value="finished_goods">Tayyor mahsulot</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateWarehouseOpen(false)}>Bekor qilish</Button>
            <Button
              onClick={() => createWarehouseMutation.mutate(warehouseForm)}
              disabled={createWarehouseMutation.isPending || !warehouseForm.name}
            >
              Yaratish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Internal Request Dialog */}
      <Dialog open={createRequestOpen} onOpenChange={setCreateRequestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ichki so'rov yaratish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Material ID</Label>
              <Input
                type="number"
                value={requestForm.materialId}
                onChange={e => setRequestForm(p => ({ ...p, materialId: e.target.value }))}
                placeholder="Material raqami"
              />
            </div>
            <div className="space-y-2">
              <Label>Miqdor</Label>
              <Input
                type="number"
                value={requestForm.quantity}
                onChange={e => setRequestForm(p => ({ ...p, quantity: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Sabab</Label>
              <Input
                value={requestForm.reason}
                onChange={e => setRequestForm(p => ({ ...p, reason: e.target.value }))}
                placeholder="So'rov sababi"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateRequestOpen(false)}>Bekor qilish</Button>
            <Button
              onClick={() => createRequestMutation.mutate(requestForm)}
              disabled={createRequestMutation.isPending || !requestForm.materialId || !requestForm.quantity}
            >
              Yuborish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
