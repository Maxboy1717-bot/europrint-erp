/**
 * @module WarehouseHub
 * @description React page component. Route-level UI.
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import WarehouseDashboard from "@/pages/WarehouseDashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ScanBarcode, Boxes, ArrowRightLeft, Eye } from "lucide-react";
import { apiRequest, queryClient, selectArray } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWarehousePosSync } from "@/hooks/useWarehousePosSync";

import { 
  WarehouseItem, 
  WarehouseStockData, 
  BarcodeItem, 
  PickingTask, 
  ExitLog, 
  OperatorDebt, 
  MaterialCardItem,
  RecentMovement
} from "@/components/wms/hub/types";
import { WarehouseHeader } from "@/components/wms/hub/WarehouseHeader";
import { WarehouseStatsPanel } from "@/components/wms/hub/WarehouseStatsPanel";
import { StockTable } from "@/components/wms/hub/StockTable";
import { ReceiveMaterialPanel } from "@/components/wms/hub/ReceiveMaterialPanel";
import { QCPanel } from "@/components/wms/hub/QCPanel";
import { PickingPanel } from "@/components/wms/hub/PickingPanel";
import { ProductionCompletePanel } from "@/components/wms/hub/ProductionCompletePanel";
import { ExitControlPanel } from "@/components/wms/hub/ExitControlPanel";
import { OperatorDebtsPanel } from "@/components/wms/hub/OperatorDebtsPanel";
import { RecentMovementsPanel } from "@/components/wms/hub/RecentMovementsPanel";
import { ScanResultDialog } from "@/components/wms/hub/ScanResultDialog";
import { EPErrorState, EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function WarehouseHub() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const params = useParams<{ code?: string }>();
  const [, navigate] = useLocation();
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseItem | null>(null);
  const [activeTab, setActiveTab] = useState("zaxira");
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState<BarcodeItem | null>(null);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  
  const [receiveForm, setReceiveForm] = useState({
    materialCardId: "",
    quantity: "",
    actualWeight: "",
    unit: "kg",
    lotNumber: "",
    purchaseOrderNumber: "",
    pricePerUnit: "",
    warehouseId: "",
  });

  const [completeForm, setCompleteForm] = useState({
    consumptionId: "",
    usedQty: "",
    wasteQty: "",
    returnQty: "",
  });

  const { data: warehouses = [], isLoading: whLoading, isError, refetch } = useQuery<WarehouseItem[]>({
    queryKey: ["/api/warehouse/warehouses"],
    select: selectArray<WarehouseItem>,
  });

  // POS Monitor bilan real-time sinxronizatsiya
  const { syncToPos, isSyncing } = useWarehousePosSync(selectedWarehouse?.id);

  useEffect(() => {
    if (params.code && warehouses) {
      const wh = (Array.isArray(warehouses) ? warehouses : []).find(w => w.code === params.code && w.isActive);
      if (wh) {
        if (!selectedWarehouse || selectedWarehouse.code !== wh.code) {
          setSelectedWarehouse(wh);
          setActiveTab("zaxira");
          setReceiveForm(f => ({ ...f, warehouseId: wh.id }));
        }
      } else {
        setSelectedWarehouse(null);
      }
    } else if (!params.code) {
      setSelectedWarehouse(null);
    }
  }, [params.code, warehouses]);

  const { data: materials = [] } = useQuery<MaterialCardItem[]>({
    queryKey: ["/api/material-cards"],
    select: selectArray<MaterialCardItem>,
  });

  const { data: warehouseStockData, isLoading: stockLoading } = useQuery<WarehouseStockData>({
    queryKey: ["/api/warehouse/warehouses", selectedWarehouse?.id, "stock"],
    enabled: !!selectedWarehouse,
  });

  const { data: barcodes = [] } = useQuery<BarcodeItem[]>({
    queryKey: ["/api/barcode-warehouse/barcodes"],
    enabled: !!selectedWarehouse,
    select: selectArray<BarcodeItem>,
  });

  const { data: pickingTasks = [] } = useQuery<PickingTask[]>({
    queryKey: ["/api/barcode-warehouse/picking-tasks"],
    enabled: !!selectedWarehouse,
    select: selectArray<PickingTask>,
  });

  const { data: exitLogs = [] } = useQuery<ExitLog[]>({
    queryKey: ["/api/barcode-warehouse/exit-logs"],
    enabled: !!selectedWarehouse && activeTab === "nazorat",
    select: selectArray<ExitLog>,
  });

  const { data: operatorDebts = [] } = useQuery<OperatorDebt[]>({
    queryKey: ["/api/barcode-warehouse/operator-balance"],
    enabled: !!selectedWarehouse && activeTab === "nazorat",
    select: selectArray<OperatorDebt>,
  });

  const { data: dashboardData } = useQuery<{ recentMovements: RecentMovement[] }>({
    queryKey: ["/api/barcode-warehouse/dashboard"],
    enabled: !!selectedWarehouse,
  });

  const receiveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/barcode-warehouse/receive", data),
    onSuccess: () => {
      toast({ title: "Material qabul qilindi" });
      queryClient.invalidateQueries({ queryKey: ["/api/barcode-warehouse/barcodes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/barcode-warehouse/dashboard"] });
      setReceiveForm({ materialCardId: "", quantity: "", actualWeight: "", unit: "kg", lotNumber: "", purchaseOrderNumber: "", pricePerUnit: "", warehouseId: selectedWarehouse?.id || "" });
    },
    onError: (err: Error) => toast({ title: "Xatolik", description: err.message, variant: "destructive" }),
  });

  const qcMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: string }) => apiRequest("PATCH", `/api/barcode-warehouse/qc/${id}`, { action }),
    onSuccess: () => {
      toast({ title: "QC holati yangilandi" });
      queryClient.invalidateQueries({ queryKey: ["/api/barcode-warehouse/barcodes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/barcode-warehouse/dashboard"] });
    },
    onError: (err: Error) => toast({ title: "Xatolik", description: err.message, variant: "destructive" }),
  });

  const completeMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/barcode-warehouse/production-complete", data),
    onSuccess: () => {
      toast({ title: "Ishlab chiqarish yakunlandi" });
      queryClient.invalidateQueries({ queryKey: ["/api/barcode-warehouse/barcodes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/barcode-warehouse/operator-balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/barcode-warehouse/dashboard"] });
      setCompleteForm({ consumptionId: "", usedQty: "", wasteQty: "", returnQty: "" });
    },
    onError: (err: Error) => toast({ title: "Xatolik", description: err.message, variant: "destructive" }),
  });

  const pickMutation = useMutation({
    mutationFn: ({ taskId, barcodeId }: { taskId: number; barcodeId: string }) => apiRequest("POST", `/api/barcode-warehouse/pick/${taskId}`, { scannedBarcode: barcodeId }),
    onSuccess: () => {
      toast({ title: "Picking bajarildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/barcode-warehouse/picking-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/barcode-warehouse/barcodes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/barcode-warehouse/dashboard"] });
    },
    onError: (err: Error) => toast({ title: "Xatolik", description: err.message, variant: "destructive" }),
  });

  const handleScan = async () => {
    if (!scanInput.trim()) return;
    try {
      const res = (await apiRequest('GET', `/api/barcode-warehouse/barcodes/scan/${encodeURIComponent(scanInput.trim())}`)) as unknown as Response;
      if (res.ok) {
        setScanResult(await res.json());
        setScanDialogOpen(true);
      } else {
        toast({ title: "Barcode topilmadi", variant: "destructive" });
      }
    } catch {
      toast({ title: "Skan xatoligi", variant: "destructive" });
    }
    setScanInput("");
  };

  const filteredBarcodes = barcodes.filter(b => !selectedWarehouse || b.warehouseId === selectedWarehouse.id || !b.warehouseId);
  const availableCount = warehouseStockData?.totalItems ?? filteredBarcodes.filter(b => b.status === "AVAILABLE").length;
  const qcHoldCount = filteredBarcodes.filter(b => b.status === "QC_HOLD").length;
  const pendingPickingCount = pickingTasks.filter(t => t.status === "pending").length;
  const debtCount = operatorDebts.filter(d => d.status === "open").length;

  if (whLoading) return <div className="flex items-center justify-center h-screen bg-background"><EPLoader size={40} /></div>;
  if (isError) return <div className="h-screen bg-background"><EPErrorState onRetry={refetch} /></div>;
  if (!selectedWarehouse) return <WarehouseDashboard />;

  return (
    <div className="space-y-6 font-inter">
      <WarehouseHeader warehouse={selectedWarehouse} onBack={() => { setSelectedWarehouse(null); navigate("/warehouse/hub"); }} />
      
      <div className="flex items-center gap-4 mb-8">
        <div className="relative flex-1">
          <ScanBarcode className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={t("barcodeSkanerlangYokiQoldaKiriting")}
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
            className="pl-12 h-14 rounded-xl border-border bg-card text-lg font-medium shadow-sm focus:ring-primary/20"
          />
        </div>
        <Button onClick={handleScan} className="h-14 w-14 rounded-xl bg-primary text-white hover:scale-105 transition-transform"><Search className="h-6 w-6" /></Button>
        <Button
          onClick={() => selectedWarehouse && syncToPos(selectedWarehouse.id)}
          disabled={isSyncing || !selectedWarehouse}
          variant="outline"
          className="h-14 px-4 rounded-xl border-border text-sm font-semibold"
          title={t("posMonitorTerminallarigaStokMalumotini")}
          data-testid="button-sync-pos"
        >
          {isSyncing ? (
            <EPLoader size={20} />
          ) : (
            <ArrowRightLeft className="h-4 w-4 mr-1" />
          )}
          {isSyncing ? "Yuborilmoqda..." : "POS Sync"}
        </Button>
      </div>

      <WarehouseStatsPanel availableCount={availableCount} qcHoldCount={qcHoldCount} pendingPickingCount={pendingPickingCount} debtCount={debtCount} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/60 p-1 rounded-xl border border-border h-auto w-full grid grid-cols-1 md:grid-cols-3">
          <TabsTrigger value="zaxira" className="rounded-xl py-3 font-black text-xs uppercase tracking-wider"><Boxes className="h-4 w-4 mr-2" />{t("zaxira1")}</TabsTrigger>
          <TabsTrigger value="jarayon" className="rounded-xl py-3 font-black text-xs uppercase tracking-wider"><ArrowRightLeft className="h-4 w-4 mr-2" />{t("jarayon")}</TabsTrigger>
          <TabsTrigger value="nazorat" className="rounded-xl py-3 font-black text-xs uppercase tracking-wider"><Eye className="h-4 w-4 mr-2" />{t("nazorat")}</TabsTrigger>
        </TabsList>

        <TabsContent value="zaxira" className="space-y-4 focus-visible:outline-none">
          <StockTable loading={stockLoading} data={warehouseStockData} />
        </TabsContent>

        <TabsContent value="jarayon" className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <ReceiveMaterialPanel 
            form={receiveForm} 
            materials={materials} 
            onChange={(upd) => setReceiveForm(f => ({ ...f, ...upd }))}
            onReceive={() => receiveMutation.mutate({ ...receiveForm, warehouseId: selectedWarehouse.id })}
            isPending={receiveMutation.isPending}
          />
          <QCPanel count={qcHoldCount} items={filteredBarcodes} onApprove={(id) => qcMutation.mutate({ id, action: "approve" })} onReject={(id) => qcMutation.mutate({ id, action: "reject" })} isPending={qcMutation.isPending} />
          <PickingPanel count={pendingPickingCount} tasks={pickingTasks || []} onPick={(taskId, barcodeId) => pickMutation.mutate({ taskId, barcodeId })} isPending={pickMutation.isPending} />
          <ProductionCompletePanel 
            form={completeForm} 
            onChange={(upd) => setCompleteForm(f => ({ ...f, ...upd }))} 
            onComplete={() => completeMutation.mutate(completeForm)} 
            isPending={completeMutation.isPending} 
          />
        </TabsContent>

        <TabsContent value="nazorat" className="space-y-4 mt-4">
          <ExitControlPanel logs={exitLogs || []} />
          <OperatorDebtsPanel count={debtCount} debts={operatorDebts || []} />
          <RecentMovementsPanel movements={dashboardData?.recentMovements || []} />
        </TabsContent>
      </Tabs>

      <ScanResultDialog open={scanDialogOpen} onOpenChange={setScanDialogOpen} result={scanResult} />
    </div>
  );
}
