import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest , selectArray } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Package, GitBranch, Layers, BarChart3, Home, Plus, Search, QrCode, RefreshCw, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { PillTabs } from "@/components/ui/pill-tabs";

interface StockItem {
  id: number | string;
  name?: string; materialName?: string;
  quantity?: number | string; currentStock?: number | string;
  minQuantity?: number; minStock?: number;
  location?: string; unit?: string; unitOfMeasure?: string; warehouseName?: string;
}
interface WarehouseTransfer {
  id: number | string; fromWarehouse?: string; toWarehouse?: string;
  materialName?: string; quantity?: number | string; status?: string; createdAt?: string;
}
interface LotRecord {
  id: number | string; batchNumber?: string; lotNumber?: string;
  name?: string; materialName?: string; quantity?: number | string;
  remainingQty?: number | string; expiryDate?: string; receivedDate?: string;
  location?: string; status?: string; supplierName?: string; supplier?: string; unit?: string;
}
interface InternalReq {
  id: number | string; description?: string; requestedBy?: string;
  department?: string; reason?: string; status?: string;
  quantity?: number | string; materialName?: string;
}
interface WarehouseOccupancy {
  id?: number | string; name?: string;
  used?: number; capacity?: number; occupancyRate?: number;
}
interface OccupancyData {
  occupancyRate?: number;
  averageOccupancy?: number;
  warehouses?: WarehouseOccupancy[];
}
interface RentalRecord {
  id: string; orderId?: string; clientName?: string; orderNumber?: string;
  areaM2?: number | string; startDate?: string; endDate?: string;
  dailyRate?: number | string; totalAmount?: number | string; billed?: boolean;
}

const URL_TAB_MAP: Record<string, string> = {
  "/wms/production-balance": "balance",
  "/wms/transfer": "transfer",
  "/wms/lot-traceability": "lot",
  "/wms/internal-requests": "requests",
  "/wms/kpi": "kpi",
  "/wms/rental": "rental",
};

const WMS_TABS = [
  { key: "balance", label: "Material Balansi", icon: Package },
  { key: "transfer", label: "Ko'chirish", icon: GitBranch },
  { key: "lot", label: "Lot Traceability", icon: QrCode },
  { key: "requests", label: "Ichki So'rovlar", icon: Layers },
  { key: "kpi", label: "KPI", icon: BarChart3 },
  { key: "rental", label: "Ijara", icon: Home },
];

const statusBadge = (status?: string) => {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    approved: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    depleted: "bg-surface-container-low text-on-surface-variant dark:bg-slate-800 dark:text-on-surface-variant",
    rejected: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  };
  const label: Record<string, string> = {
    active: "Faol", approved: "Tasdiqlangan", depleted: "Tugagan",
    rejected: "Rad etilgan", pending: "Kutilmoqda",
  };
  const key = status || "pending";
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${map[key] || "bg-surface-container-low text-on-surface-variant"}`}>
      {label[key] || status || "Kutilmoqda"}
    </span>
  );
};

export default function WMSExtended() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState(URL_TAB_MAP[location] || "balance");

  useEffect(() => {
    const tab = URL_TAB_MAP[location];
    if (tab) setActiveTab(tab);
  }, [location]);

  const { toast } = useToast();
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [lotSearch, setLotSearch] = useState("");

  const { data: stockResponse, isLoading: stockLoading } = useQuery<{
    totalItems: number; lowStockItems: number; outOfStock: number; totalStockValue: number; items: StockItem[];
  }>({ queryKey: ["/api/warehouse/stock"] });
  const stock: StockItem[] = stockResponse?.items ?? [];

  const { data: transfers = [] } = useQuery<WarehouseTransfer[]>({ queryKey: ["/api/warehouse/transfers"] });
  const { data: internalReqsResponse } = useQuery<{ success: boolean; count: number; data: InternalReq[] }>({ queryKey: ["/api/warehouse/internal-requests"] });
  const internalReqs: InternalReq[] = internalReqsResponse?.data ?? [];
  const { data: wmsKpis } = useQuery<Record<string, unknown>>({
    queryKey: ["/api/warehouse/dashboard/kpis"],
    enabled: activeTab === "kpi",
  });
  const { data: topMaterials = [] } = useQuery<Record<string, unknown>[]>({
    queryKey: ["/api/warehouse/dashboard/top-materials"],
    enabled: activeTab === "balance",
  });
  const { data: lots = [], isLoading: lotsLoading } = useQuery<LotRecord[]>({
    queryKey: ["/api/warehouse/lots"],
    enabled: activeTab === "lot",
  });
  const { data: occupancy } = useQuery<OccupancyData>({
    queryKey: ["/api/warehouse/dashboard/warehouse-occupancy"],
    enabled: activeTab === "kpi",
  });
  const { data: rentalData = [], isLoading: rentalLoading } = useQuery<RentalRecord[]>({
    queryKey: ["/api/sd/active-rentals"],
    enabled: activeTab === "rental",
  });

  const transferForm = useForm({ defaultValues: { fromWarehouse: "", toWarehouse: "", materialName: "", quantity: 0 } });
  const requestForm = useForm({ defaultValues: { department: "", materialName: "", quantity: 0, reason: "" } });

  const createTransfer = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/warehouse/transfers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/transfers"] });
      setShowTransferDialog(false);
      toast({ title: "Ko'chirish hujjati yaratildi" });
    },
  });
  const createRequest = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/warehouse/internal-requests", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/internal-requests"] });
      setShowRequestDialog(false);
      toast({ title: "So'rov yuborildi" });
    },
  });

  const lowStockCount = (Array.isArray(stock) ? stock : []).filter((s) => Number(s.quantity ?? 0) < (s.minQuantity || 10)).length;
  const activeCount = (Array.isArray(stock) ? stock : []).filter((s) => Number(s.quantity || 0) > 0).length;

  return (
    <div className="flex-1 overflow-auto bg-surface p-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            Ombor <span className="font-bold text-primary">Kengaytirilgan</span>
          </h1>
          <p className="text-muted-foreground mt-1">Material balansi, ko'chirish, lot kuzatish va KPI</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/warehouse/stock"] });
          queryClient.invalidateQueries({ queryKey: ["/api/warehouse/transfers"] });
        }} data-testid="button-refresh-wms">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Yangilash
        </Button>
      </div>

      {/* ─── Unified KPI Bar ─── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {stockLoading ? (
          ([0,1,2,3]).map(i => (
            <div key={`k-${i}`} className="bg-surface-container-lowest rounded-lg p-5">
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-9 w-28" />
            </div>
          ))
        ) : (
          ([
            { label: "Jami Materiallar", value: stock.length, desc: "Pozitsiya soni", icon: Package, accent: "text-blue-500" },
            { label: "Faol Pozitsiyalar", value: activeCount, desc: "Stokda mavjud", icon: BarChart3, accent: "text-green-500" },
            { label: "Kam Qolgan", value: lowStockCount, desc: "Ogohlantirish", icon: Layers, accent: "text-orange-500" },
            { label: "Top Materiallar", value: topMaterials.length, desc: "Tahlil qilingan", icon: GitBranch, accent: "text-purple-500" },
          ]).map((item, i) => (
            <div key={`k-${i}`} className="bg-surface-container-lowest rounded-lg p-5" data-testid={`kpi-wms-${i}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{item.label}</p>
              <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">
                {item.value}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Pill Tabs */}
      <PillTabs
        tabs={(Array.isArray(WMS_TABS) ? WMS_TABS : []).map((t) => ({ key: t.key, label: t.label }))}
        active={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab: Balance */}
      {activeTab === "balance" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-500" />
              Material Qoldiqlari — Ishlab Chiqarish Balansi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Material</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Miqdor</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Birlik</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Ombor</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Holati</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-on-surface-variant text-sm">Yuklanmoqda...</TableCell>
                  </TableRow>
                ) : stock.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-on-surface-variant text-sm">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      Materiallar yo'q
                    </TableCell>
                  </TableRow>
                ) : (Array.isArray(stock) ? stock : []).slice(0, 12).map((item) => {
                  const qty = Number(item.quantity || item.currentStock || 0);
                  const minQty = Number(item.minQuantity || item.minStock || 10);
                  const statusKey = qty <= 0 ? "out" : qty < minQty ? "low" : "ok";
                  return (
                    <TableRow key={item.id} data-testid={`row-balance-${item.id}`} className="hover:bg-surface dark:hover:bg-slate-800/50">
                      <TableCell className="text-sm font-medium">{item.materialName || item.name || `Material #${item.id}`}</TableCell>
                      <TableCell className={`text-sm font-semibold ${qty <= 0 ? "text-red-600" : qty < minQty ? "text-orange-600" : "text-on-surface dark:text-slate-100"}`}>
                        {qty.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-on-surface-variant">{item.unit || item.unitOfMeasure || "kg"}</TableCell>
                      <TableCell className="text-sm text-on-surface-variant">{item.warehouseName || item.location || "—"}</TableCell>
                      <TableCell>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          statusKey === "out" ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" :
                          statusKey === "low" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400" :
                          "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                        }`}>
                          {statusKey === "out" ? "Tugagan" : statusKey === "low" ? "Kam" : "Normal"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Tab: Transfer */}
      {activeTab === "transfer" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-on-surface-variant">Jami: <span className="font-semibold text-on-surface dark:text-slate-100">{transfers.length} ta</span></p>
            <Button onClick={() => setShowTransferDialog(true)} data-testid="button-create-transfer">
              <Plus className="h-4 w-4 mr-1.5" />Ko'chirish Yaratish
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Hujjat №</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Qayerdan</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Qayerga</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Material</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Miqdor</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Holati</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-on-surface-variant text-sm">Ko'chirish hujjatlari yo'q</TableCell>
                    </TableRow>
                  ) : (Array.isArray(transfers) ? transfers : []).slice(0, 10).map((t) => (
                    <TableRow key={t.id} data-testid={`row-transfer-${t.id}`} className="hover:bg-surface dark:hover:bg-slate-800/50">
                      <TableCell className="text-sm font-semibold text-blue-600">TR-{t.id}</TableCell>
                      <TableCell className="text-sm">{t.fromWarehouse}</TableCell>
                      <TableCell className="text-sm">{t.toWarehouse}</TableCell>
                      <TableCell className="text-sm font-medium">{t.materialName}</TableCell>
                      <TableCell className="text-sm">{t.quantity}</TableCell>
                      <TableCell>{statusBadge(t.status || "active")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
            <DialogContent>
              <DialogHeader><DialogTitle>Ko'chirish Hujjati Yaratish</DialogTitle></DialogHeader>
              <form onSubmit={transferForm.handleSubmit((d) => createTransfer.mutate(d))} className="space-y-4">
                <div className="space-y-2"><Label>Qayerdan</Label><Input {...transferForm.register("fromWarehouse")} placeholder="Xom ashyo ombori" data-testid="input-from-wh" /></div>
                <div className="space-y-2"><Label>Qayerga</Label><Input {...transferForm.register("toWarehouse")} placeholder="Sex ombori" /></div>
                <div className="space-y-2"><Label>Material nomi</Label><Input {...transferForm.register("materialName")} /></div>
                <div className="space-y-2"><Label>Miqdor</Label><Input type="number" {...transferForm.register("quantity", { valueAsNumber: true })} /></div>
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setShowTransferDialog(false)}>Bekor</Button>
                  <Button type="submit" disabled={createTransfer.isPending}>Yaratish</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Tab: Lot Traceability */}
      {activeTab === "lot" && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-on-surface-variant" />
              <Input
                placeholder="Lot raqami yoki material kiriting..."
                className="pl-8"
                data-testid="input-lot-search"
                value={lotSearch}
                onChange={(e) => setLotSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/warehouse/lots"] })} data-testid="button-scan-lot">
              <QrCode className="h-4 w-4 mr-1.5" />Yangilash
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Lot №</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Material</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Kirgan sana</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Yetkazuvchi</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Qoldig'i</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Holati</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lotsLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-on-surface-variant text-sm">Yuklanmoqda...</TableCell></TableRow>
                  ) : (() => {
                    const filtered = (Array.isArray(lots) ? lots : []).filter((l) =>
                      !lotSearch ||
                      (l.batchNumber || l.lotNumber || "").toLowerCase().includes(lotSearch.toLowerCase()) ||
                      (l.materialName || "").toLowerCase().includes(lotSearch.toLowerCase())
                    );
                    return filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-on-surface-variant text-sm">
                          <QrCode className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          Lot/partiyalar yo'q
                        </TableCell>
                      </TableRow>
                    ) : (Array.isArray(filtered) ? filtered : []).slice(0, 12).map((r, i) => (
                      <TableRow key={r.id || i} data-testid={`row-lot-${r.id || i}`} className="hover:bg-surface dark:hover:bg-slate-800/50">
                        <TableCell className="text-sm font-semibold text-blue-600">{r.batchNumber || r.lotNumber || `LOT-${r.id}`}</TableCell>
                        <TableCell className="text-sm font-medium">{r.materialName || r.name || "—"}</TableCell>
                        <TableCell className="text-xs text-on-surface-variant">{r.receivedDate ? new Date(r.receivedDate).toLocaleDateString("uz-UZ") : "—"}</TableCell>
                        <TableCell className="text-sm">{r.supplierName || r.supplier || "—"}</TableCell>
                        <TableCell className="text-sm font-semibold">{r.remainingQty != null ? `${Number(r.remainingQty).toLocaleString()} ${r.unit || ""}` : `${Number(r.quantity || 0).toLocaleString()} ${r.unit || ""}`}</TableCell>
                        <TableCell>{statusBadge(r.status || "active")}</TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Internal Requests */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-on-surface-variant">Jami: <span className="font-semibold text-on-surface dark:text-slate-100">{internalReqs.length} ta so'rov</span></p>
            <Button onClick={() => setShowRequestDialog(true)} data-testid="button-create-request">
              <Plus className="h-4 w-4 mr-1.5" />So'rov Yuborish
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Bo'lim</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Material</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Miqdor</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Sabab</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Holati</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {internalReqs.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10 text-on-surface-variant text-sm">So'rovlar yo'q</TableCell></TableRow>
                  ) : (Array.isArray(internalReqs) ? internalReqs : []).slice(0, 10).map((r) => (
                    <TableRow key={r.id} data-testid={`row-req-${r.id}`} className="hover:bg-surface dark:hover:bg-slate-800/50">
                      <TableCell className="text-sm font-medium">{r.department}</TableCell>
                      <TableCell className="text-sm">{r.materialName}</TableCell>
                      <TableCell className="text-sm">{r.quantity}</TableCell>
                      <TableCell className="text-xs text-on-surface-variant max-w-[180px] truncate">{r.reason}</TableCell>
                      <TableCell>{statusBadge(r.status || "pending")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
            <DialogContent>
              <DialogHeader><DialogTitle>Material So'rovi</DialogTitle></DialogHeader>
              <form onSubmit={requestForm.handleSubmit((d) => createRequest.mutate(d))} className="space-y-4">
                <div className="space-y-2"><Label>Bo'lim</Label><Input {...requestForm.register("department")} placeholder="Bosma sexi" data-testid="input-department" /></div>
                <div className="space-y-2"><Label>Material</Label><Input {...requestForm.register("materialName")} /></div>
                <div className="space-y-2"><Label>Miqdor</Label><Input type="number" {...requestForm.register("quantity", { valueAsNumber: true })} /></div>
                <div className="space-y-2"><Label>Sabab</Label><Input {...requestForm.register("reason")} /></div>
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setShowRequestDialog(false)}>Bekor</Button>
                  <Button type="submit" disabled={createRequest.isPending}>Yuborish</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Tab: KPI */}
      {activeTab === "kpi" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-on-surface-variant">Ombor KPI Dashboard</p>
            <Button variant="outline" size="sm" onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/warehouse/dashboard/kpis"] });
              queryClient.invalidateQueries({ queryKey: ["/api/warehouse/dashboard/warehouse-occupancy"] });
            }}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Yangilash
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {([
              { l: "Ombor to'liqligi", v: occupancy ? `${Number(occupancy.occupancyRate || occupancy.averageOccupancy || 0).toFixed(0)}%` : wmsKpis?.occupancyRate ? `${wmsKpis.occupancyRate}%` : "—", target: "80%", colorClass: "text-orange-600" },
              { l: "Material aylanmasi", v: wmsKpis?.turnoverRate ? `${wmsKpis.turnoverRate}x` : "—", target: "10x", colorClass: "text-blue-600" },
              { l: "Inventar aniqligi", v: wmsKpis?.inventoryAccuracy ? `${wmsKpis.inventoryAccuracy}%` : "—", target: "99%", colorClass: "text-green-600" },
              { l: "Bajarish vaqti", v: wmsKpis?.avgFulfillmentTime ? `${wmsKpis.avgFulfillmentTime}s` : "—", target: "4s", colorClass: "text-orange-600" },
              { l: "Qaytarish darajasi", v: wmsKpis?.returnRate ? `${wmsKpis.returnRate}%` : "—", target: "<1%", colorClass: "text-green-600" },
              { l: "Faol omborlar", v: "—", target: "—", colorClass: "text-purple-600" },
            ]).map((s) => (
              <div key={s.l} className="rounded-xl bg-surface-container-lowest dark:bg-slate-900 shadow-sm p-4">
                <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">{s.l}</p>
                <p className={`text-2xl font-bold ${s.colorClass}`}>{s.v}</p>
                <p className="text-[10px] text-on-surface-variant mt-1">Maqsad: {s.target}</p>
              </div>
            ))}
          </div>

          {Array.isArray(occupancy?.warehouses) && (occupancy?.warehouses?.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Omborlar To'liqligi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(occupancy?.warehouses ?? []).slice(0, 6).map((w: WarehouseOccupancy) => (
                  <div key={w.id || w.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-on-surface dark:text-slate-300">{w.name}</span>
                      <span className="font-bold text-on-surface-variant dark:text-on-surface-variant">{Number(w.occupancyRate || 0).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-container-low dark:bg-slate-800 rounded-full">
                      <div
                        className={`h-1.5 rounded-full ${Number(w.occupancyRate || 0) > 85 ? "bg-red-500" : Number(w.occupancyRate || 0) > 70 ? "bg-yellow-500" : "bg-green-500"}`}
                        style={{ width: `${w.occupancyRate || 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tab: Rental */}
      {activeTab === "rental" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-on-surface-variant">Tayyor Mahsulot Saqlash Ijara</p>
            <Button data-testid="button-add-rental">
              <Plus className="h-4 w-4 mr-1.5" />Ijara Shartnomasi
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-surface-container-lowest dark:bg-slate-900 shadow-sm p-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Faol Shartnomalar</p>
              <p className="text-2xl font-bold text-on-surface dark:text-slate-100">{rentalData.length}</p>
            </div>
            <div className="rounded-xl bg-surface-container-lowest dark:bg-slate-900 shadow-sm p-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Jami Maydon</p>
              <p className="text-2xl font-bold text-blue-600">{(rentalData ?? []).reduce((s, r) => s + Number(r.areaM2 || 0), 0)} m²</p>
            </div>
            <div className="rounded-xl bg-surface-container-lowest dark:bg-slate-900 shadow-sm p-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">To'langan</p>
              <p className="text-2xl font-bold text-green-600">{(Array.isArray(rentalData) ? rentalData : []).filter(r => r.billed).length} ta</p>
            </div>
          </div>
          <Card>
            <CardContent className="p-0">
              {rentalLoading ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Mijoz</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Maydon</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Kunlik narx</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Muddat</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Holati</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rentalData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-on-surface-variant text-sm">
                          Faol ijara shartnomalari mavjud emas
                        </TableCell>
                      </TableRow>
                    ) : (Array.isArray(rentalData) ? rentalData : []).map((r, i) => (
                      <TableRow key={r.id} data-testid={`row-rental-${i}`} className="hover:bg-surface dark:hover:bg-slate-800/50">
                        <TableCell className="text-sm font-medium">{r.clientName || r.orderNumber || r.orderId || "—"}</TableCell>
                        <TableCell className="text-sm">{r.areaM2 ? `${r.areaM2} m²` : "—"}</TableCell>
                        <TableCell className="text-sm">{r.dailyRate ? `${Number(r.dailyRate).toLocaleString()} so'm` : "—"}</TableCell>
                        <TableCell className="text-xs text-on-surface-variant">
                          {r.startDate ? r.startDate.slice(0, 10) : "—"}
                          {r.endDate ? ` – ${r.endDate.slice(0, 10)}` : ""}
                        </TableCell>
                        <TableCell>{statusBadge(r.billed ? "active" : "pending")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
