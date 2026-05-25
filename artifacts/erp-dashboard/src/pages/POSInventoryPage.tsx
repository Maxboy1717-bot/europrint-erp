/**
 * @module POSInventoryPage
 * @description React page component. Route-level UI — state, hooks, orchestration only.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Package, AlertTriangle, RefreshCw, List, BarChart3 } from "lucide-react";

import {
  PosProduct,
  InventoryMovement,
  MonthlyRow,
  ChartDataPoint,
} from "./POSInventoryPageTypes";
import { AdjustDialog } from "./POSInventoryPageDialogs";
import { MovementsTab, ProductsTab, LowStockTab } from "./POSInventoryPageSections";
import { ChartTab } from "./POSInventoryPageChart";
import { useTranslation } from '@/lib/i18n';

export default function POSInventoryPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("movements");
  const [adjustProduct, setAdjustProduct] = useState<PosProduct | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustType, setAdjustType] = useState("in");
  const [adjustReason, setAdjustReason] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [movementFilter, setMovementFilter] = useState("");

  // ─── Queries ──────────────────────────────────────────────────────────────

  const { data: movementsData, isLoading: movementsLoading, refetch: refetchMovements } = useQuery({
    queryKey: ["/api/pos/inventory/movements", movementFilter],
    queryFn: () => apiRequest("GET", `/api/pos/inventory/movements?type=${movementFilter}&limit=100`),
    refetchInterval: 30000,
  });

  const { data: lowStockData, refetch: refetchLowStock } = useQuery({
    queryKey: ["/api/pos/inventory/low-stock"],
    queryFn: () => apiRequest("GET", "/api/pos/inventory/low-stock"),
  });

  const { data: monthlyData } = useQuery({
    queryKey: ["/api/pos/inventory/monthly-report"],
    queryFn: () => apiRequest("GET", "/api/pos/inventory/monthly-report"),
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/pos/products", productSearch],
    queryFn: () => apiRequest("GET", `/api/pos/products?search=${encodeURIComponent(productSearch)}&active=all`),
  });

  // ─── Derived data ─────────────────────────────────────────────────────────

  const movements: InventoryMovement[] = (movementsData as { data: InventoryMovement[] } | undefined)?.data ?? [];
  const lowStock: PosProduct[] = (lowStockData as { products: PosProduct[] } | undefined)?.products ?? [];
  const products: PosProduct[] = Array.isArray(productsData) ? productsData : [];
  const monthlyRows: MonthlyRow[] = (monthlyData as { data: MonthlyRow[] } | undefined)?.data ?? [];

  const chartData: ChartDataPoint[] = Object.entries(
    monthlyRows.reduce<Record<string, ChartDataPoint>>((acc, row) => {
      const day = new Date(row.day).toLocaleDateString("uz-UZ", { month: "short", day: "numeric" });
      if (!acc[day]) acc[day] = { day, in: 0, out: 0, sale: 0, adjustment: 0 };
      const typeKey = row.type as keyof ChartDataPoint;
      if (typeKey in acc[day] && typeKey !== "day") {
        (acc[day] as unknown as Record<string, number>)[typeKey] += Number(row.qty);
      }
      return acc;
    }, {})
  ).map(([, v]) => v).slice(-14);

  // ─── Mutation ─────────────────────────────────────────────────────────────

  const adjustMutation = useMutation({
    mutationFn: ({ productId, quantity, type, reason }: {
      productId: number;
      quantity: number;
      type: string;
      reason: string;
    }) =>
      apiRequest("PATCH", `/api/pos/inventory/${productId}/adjust`, { quantity, type, reason }),
    onSuccess: () => {
      toast({ title: "Inventar yangilandi!" });
      setAdjustProduct(null);
      setAdjustQty("");
      setAdjustReason("");
      setAdjustType("in");
      queryClient.invalidateQueries({ queryKey: ["/api/pos/inventory/movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/inventory/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/products"] });
    },
    onError: (err: Error) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    },
  });

  function handleAdjust() {
    if (!adjustProduct || !adjustQty) return;
    adjustMutation.mutate({
      productId: adjustProduct.id,
      quantity: Number(adjustQty),
      type: adjustType,
      reason: adjustReason,
    });
  }

  function handleOpenAdjust(product: PosProduct, type = "in") {
    setAdjustProduct(product);
    setAdjustType(type);
  }

  function handleCloseAdjust() {
    setAdjustProduct(null);
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="px-4 py-3 bg-white dark:bg-gray-800 border-b shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-[var(--ep-green)]" />
          <h1 className="text-xl font-bold">{t("inventarBoshqaruvi")}</h1>
          {lowStock.length > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {lowStock.length} kam qoldiq
            </Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => { refetchMovements(); refetchLowStock(); }}>
          <RefreshCw className="h-4 w-4 mr-1" />{t("refresh")}
        </Button>
      </div>

      {/* Tab shell */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="px-4 pt-3 bg-white dark:bg-gray-800 border-b">
            <TabsList>
              <TabsTrigger value="movements"><List className="h-4 w-4 mr-1" />{t("actions")}</TabsTrigger>
              <TabsTrigger value="products"><Package className="h-4 w-4 mr-1" />{t("mahsulotlar")}</TabsTrigger>
              <TabsTrigger value="low-stock" className="relative">
                <AlertTriangle className="h-4 w-4 mr-1" />Kam qoldiq
                {lowStock.length > 0 && (
                  <Badge className="ml-1 h-5 px-1 text-xs bg-red-500">{lowStock.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="chart"><BarChart3 className="h-4 w-4 mr-1" />{t("grafik")}</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            <MovementsTab
              movements={movements}
              isLoading={movementsLoading}
              movementFilter={movementFilter}
              onFilterChange={setMovementFilter}
            />
            <ProductsTab
              products={products}
              isLoading={productsLoading}
              productSearch={productSearch}
              onSearchChange={setProductSearch}
              onAdjustProduct={handleOpenAdjust}
            />
            <LowStockTab
              lowStock={lowStock}
              onAdjustProduct={handleOpenAdjust}
            />
            <ChartTab
              chartData={chartData}
              monthlyRows={monthlyRows}
            />
          </div>
        </Tabs>
      </div>

      {/* Adjust Dialog */}
      <AdjustDialog
        adjustProduct={adjustProduct}
        adjustQty={adjustQty}
        adjustType={adjustType}
        adjustReason={adjustReason}
        isPending={adjustMutation.isPending}
        onClose={handleCloseAdjust}
        onQtyChange={setAdjustQty}
        onTypeChange={setAdjustType}
        onReasonChange={setAdjustReason}
        onConfirm={handleAdjust}
      />
    </div>
  );
}
