/**
 * PosWarehousePage — POS ↔ Warehouse integratsiya sahifasi.
 *
 * Real-time stok ko'rsatish, movement yaratish, stock alerts.
 * Backend: /api/pos/wh/* endpoints.
 */
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package, AlertTriangle, Boxes, History,
} from "lucide-react";
import { toArray } from "@/lib/safe-array";
import {
  StockItem,
  Warehouse,
  MovementHistory,
  MovementForm,
  MOVEMENT_FORM_DEFAULT,
} from "./PosWarehousePageTypes";
import { MovementDialog } from "./PosWarehousePageDialogs";
import { StockTab, AlertsTab, HistoryTab } from "./PosWarehousePageSections";

import { useTranslation } from '@/lib/i18n';
export default function PosWarehousePage() {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  // Filterlar
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [onlyAvailable, setOnlyAvailable] = useState(true);

  // Movement modal
  const [movementOpen, setMovementOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [movementForm, setMovementForm] = useState<MovementForm>(MOVEMENT_FORM_DEFAULT);

  // Real-time stock
  const { data: stockRaw, isLoading } = useQuery({
    queryKey: [
      "/api/pos/wh/stock",
      {
        warehouseId: warehouseFilter !== "all" ? warehouseFilter : "",
        category: categoryFilter !== "all" ? categoryFilter : "",
        onlyAvailable: String(onlyAvailable),
        search,
      },
    ],
  });
  const stockItems = toArray<StockItem>(stockRaw);

  // Warehouses
  const { data: warehousesRaw } = useQuery({ queryKey: ["/api/warehouses"] });
  const warehouses = toArray<Warehouse>(warehousesRaw);

  // Stock alerts
  const { data: alertsRaw } = useQuery({ queryKey: ["/api/pos/wh/alerts"] });
  const alerts = toArray<StockItem>(alertsRaw);

  // Movement history
  const { data: historyRaw } = useQuery({
    queryKey: ["/api/pos/wh/movements", { limit: "20" }],
  });
  const history = toArray<MovementHistory>(historyRaw);

  // Movement create
  const createMovement = useMutation({
    mutationFn: async (data: Record<string, unknown>) =>
      await apiRequest("POST", "/api/pos/wh/movements", data),
    onSuccess: () => {
      toast({ title: "✅ Movement yaratildi", description: "Stok yangilandi" });
      qc.invalidateQueries({ queryKey: ["/api/pos/wh/stock"] });
      qc.invalidateQueries({ queryKey: ["/api/pos/wh/alerts"] });
      qc.invalidateQueries({ queryKey: ["/api/pos/wh/movements"] });
      setMovementOpen(false);
      setMovementForm(MOVEMENT_FORM_DEFAULT);
    },
    onError: (err: Error) => {
      toast({
        title: "❌ Xatolik",
        description: err?.message ?? "Movement yaratish bajarilmadi",
        variant: "destructive",
      });
    },
  });

  // KPI lar
  const kpis = useMemo(() => {
    const totalValue = stockItems.reduce(
      (sum, i) => sum + Number(i.quantity) * Number(i.unitPrice),
      0,
    );
    const totalQty = stockItems.reduce((sum, i) => sum + Number(i.quantity), 0);
    const lowStock = stockItems.filter((i) => i.stockStatus === "LOW_STOCK").length;
    const outOfStock = stockItems.filter((i) => i.stockStatus === "OUT_OF_STOCK").length;
    return { totalValue, totalQty, lowStock, outOfStock, itemCount: stockItems.length };
  }, [stockItems]);

  const categories = useMemo(() => {
    const set = new Set(stockItems.map((i) => i.category).filter(Boolean));
    return Array.from(set);
  }, [stockItems]);

  const handleQuickIssue = (item: StockItem) => {
    setSelectedItem(item);
    setMovementForm({
      movementType: "INTERNAL_ISSUE",
      fromWarehouseId: String(item.warehouseId),
      toWarehouseId: "",
      quantity: "1",
      reason: "",
      barcode: "",
    });
    setMovementOpen(true);
  };

  const handleSubmitMovement = () => {
    if (!selectedItem) return;
    if (!movementForm.quantity || Number(movementForm.quantity) <= 0) {
      toast({ title: "Miqdor noto'g'ri", variant: "destructive" });
      return;
    }
    createMovement.mutate({
      movementType: movementForm.movementType,
      fromWarehouseId: movementForm.fromWarehouseId
        ? Number(movementForm.fromWarehouseId)
        : undefined,
      toWarehouseId: movementForm.toWarehouseId
        ? Number(movementForm.toWarehouseId)
        : undefined,
      materialCardId: selectedItem.materialId,
      quantity: Number(movementForm.quantity),
      reason: movementForm.reason,
      barcode: movementForm.barcode || undefined,
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            POS — Warehouse
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time stok va movement boshqaruvi
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">{t('materialTurlari')}</p>
          <p className="text-2xl font-bold">{kpis.itemCount}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Jami miqdor</p>
          <p className="text-2xl font-bold">
            {kpis.totalQty.toLocaleString("uz-UZ", { maximumFractionDigits: 0 })}
          </p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Jami qiymat (UZS)</p>
          <p className="text-xl font-bold">{(kpis.totalValue / 1_000_000).toFixed(1)}M</p>
        </CardContent></Card>
        <Card className="border-orange-500/50"><CardContent className="p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Kam qoldi
          </p>
          <p className="text-2xl font-bold text-[var(--ep-primary)]">{kpis.lowStock}</p>
        </CardContent></Card>
        <Card className="border-destructive/50"><CardContent className="p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Tugadi
          </p>
          <p className="text-2xl font-bold text-destructive">{kpis.outOfStock}</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">
            <Boxes className="h-4 w-4 mr-1" /> Stok
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <AlertTriangle className="h-4 w-4 mr-1" /> Ogohlantirishlar ({alerts.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-1" /> Tarix
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          <StockTab
            isLoading={isLoading}
            stockItems={stockItems}
            warehouses={warehouses}
            categories={categories}
            search={search}
            onSearchChange={setSearch}
            warehouseFilter={warehouseFilter}
            onWarehouseFilterChange={setWarehouseFilter}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            onlyAvailable={onlyAvailable}
            onToggleOnlyAvailable={() => setOnlyAvailable((v) => !v)}
            onQuickIssue={handleQuickIssue}
          />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertsTab alerts={alerts} />
        </TabsContent>

        <TabsContent value="history">
          <HistoryTab history={history} />
        </TabsContent>
      </Tabs>

      <MovementDialog
        open={movementOpen}
        onOpenChange={setMovementOpen}
        selectedItem={selectedItem}
        form={movementForm}
        onFormChange={setMovementForm}
        onSubmit={handleSubmitMovement}
        isPending={createMovement.isPending}
        warehouses={warehouses}
      />
    </div>
  );
}
