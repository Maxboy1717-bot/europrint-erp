/**
 * @module InventoryValuation
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  ClipboardList, 
  Plus, 
  RefreshCw,
  Package,
  Building2
} from "lucide-react";

import { 
  InventoryCount, 
  InventoryCountLine, 
  AssetInventoryItem, 
  Warehouse,
  InventoryValuationCountForm,
  AssetInventoryForm,
  inventoryValuationCountSchema,
  assetInventorySchema
} from "@/components/wms/valuation/types";
import { ValuationOverview } from "@/components/wms/valuation/ValuationOverview";
import { MaterialInventoryFilters } from "@/components/wms/valuation/MaterialInventoryFilters";
import { MaterialInventoryTable } from "@/components/wms/valuation/MaterialInventoryTable";
import { AssetInventoryTable } from "@/components/wms/valuation/AssetInventoryTable";
import { CountLinesDialog } from "@/components/wms/valuation/CountLinesDialog";
import { CreateCountDialog } from "@/components/wms/valuation/CreateCountDialog";
import { CreateAssetDialog } from "@/components/wms/valuation/CreateAssetDialog";
import { useInventoryValuationMutations } from "@/components/wms/valuation/useInventoryValuationMutations";
import { EPErrorState } from "@/components/ep";


export default function InventoryValuation() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("material");
  const [searchQuery, setSearchQuery] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [countTypeFilter, setCountTypeFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLinesDialogOpen, setIsLinesDialogOpen] = useState(false);
  const [selectedCount, setSelectedCount] = useState<InventoryCount | null>(null);
  const [isCreateAssetDialogOpen, setIsCreateAssetDialogOpen] = useState(false);

  const [newCountForm, setNewCountForm] = useState<InventoryValuationCountForm>({
    countDate: new Date().toISOString().split("T")[0],
    warehouseId: "",
    countType: "full",
    notes: "",
  });

  const [newAssetForm, setNewAssetForm] = useState<AssetInventoryForm>({
    assetCode: "",
    assetName: "",
    assetType: "equipment",
    location: "",
    purchaseDate: "",
    purchaseValue: 0,
    currentValue: 0,
    usefulLife: 5,
    salvageValue: 0,
    condition: "good",
    serialNumber: "",
    notes: "",
  });

  const { data: inventoryCounts = [], isLoading: countsLoading, isError: countsError, refetch: refetchCounts } = useQuery<InventoryCount[]>({
    queryKey: ["/api/finance-extended/inventory-counts", { 
      warehouseId: warehouseFilter !== "all" ? warehouseFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      countType: countTypeFilter !== "all" ? countTypeFilter : undefined,
    }],
  });

  const { data: warehouses = [] } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
  });

  const { data: countLines = [], isLoading: linesLoading } = useQuery<InventoryCountLine[]>({
    queryKey: ["/api/finance-extended/inventory-counts", selectedCount?.id, "lines"],
    enabled: !!selectedCount,
  });

  const { data: assets = [], refetch: refetchAssets } = useQuery<AssetInventoryItem[]>({
    queryKey: ["/api/finance-extended/asset-inventory"],
  });

  const { createCountMutation, createAssetMutation } = useInventoryValuationMutations({
    setNewCountForm,
    setIsCreateDialogOpen,
    setNewAssetForm,
    setIsCreateAssetDialogOpen,
  });

  const filteredCounts = (Array.isArray(inventoryCounts) ? inventoryCounts : []).filter(count => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return count.countNumber.toLowerCase().includes(query);
    }
    return true;
  });

  const filteredAssets = (Array.isArray(assets) ? assets : []).filter(asset => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        asset.assetCode.toLowerCase().includes(query) ||
        asset.assetName.toLowerCase().includes(query) ||
        (asset.serialNumber || "").toLowerCase().includes(query)
      );
    }
    return true;
  });

  const totalCounts = inventoryCounts.length;
  const inProgressCounts = (Array.isArray(inventoryCounts) ? inventoryCounts : []).filter(c => c.status === "in_progress").length;
  const completedCounts = (Array.isArray(inventoryCounts) ? inventoryCounts : []).filter(c => c.status === "completed" || c.status === "approved").length;
  const totalVarianceValue = (Array.isArray(inventoryCounts) ? inventoryCounts : []).reduce((sum, c) => sum + (c.totalVariance || 0), 0);

  if (countsError) {
    return (
      <div className="p-6" data-testid="inventory-valuation-page">
        <EPErrorState onRetry={refetchCounts} />
      </div>
    );
  }

  return (
    <div data-testid="inventory-valuation-page">
      <div className="-mx-4 -mt-4 lg:-mx-6 lg:-mt-6 border-b from-primary to-amber-500 text-white">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-page-title">Inventarizatsiya</h1>
                <p className="text-white/75 text-sm">Material va asosiy vositalar inventarizatsiyasi</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => activeTab === "material" ? refetchCounts() : refetchAssets()}
                data-testid="button-refresh"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Yangilash
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 pt-6">
        <ValuationOverview 
          totalCounts={totalCounts}
          inProgressCounts={inProgressCounts}
          completedCounts={completedCounts}
          totalVarianceValue={totalVarianceValue}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-1 sm:grid-cols-2">
            <TabsTrigger value="material" data-testid="tab-material-inventory">
              <Package className="h-4 w-4 mr-2" />
              Material Inventarizatsiyasi
            </TabsTrigger>
            <TabsTrigger value="asset" data-testid="tab-asset-inventory">
              <Building2 className="h-4 w-4 mr-2" />
              Aktiv Inventarizatsiyasi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="material" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-1 flex-wrap">
                <div>
                  <CardTitle>Inventarizatsiya Hisoblari</CardTitle>
                  <CardDescription>Material va mahsulotlar sanovi</CardDescription>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-count">
                  <Plus className="h-4 w-4 mr-1" />
                  Yangi Inventarizatsiya
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <MaterialInventoryFilters 
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  warehouseFilter={warehouseFilter}
                  setWarehouseFilter={setWarehouseFilter}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  countTypeFilter={countTypeFilter}
                  setCountTypeFilter={setCountTypeFilter}
                  warehouses={warehouses}
                  clearFilters={() => {
                    setWarehouseFilter("all");
                    setStatusFilter("all");
                    setCountTypeFilter("all");
                    setSearchQuery("");
                  }}
                />

                {countsLoading ? (
                  <div className="space-y-2">
                    {([...Array(5)]).map((_, i) => (
                      <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <MaterialInventoryTable 
                    counts={filteredCounts}
                    warehouses={warehouses}
                    onViewLines={(count) => {
                      setSelectedCount(count);
                      setIsLinesDialogOpen(true);
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="asset" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-1 flex-wrap">
                <div>
                  <CardTitle>Asosiy vositalar</CardTitle>
                  <CardDescription>Korxona aktivlari va ularning holati</CardDescription>
                </div>
                <Button onClick={() => setIsCreateAssetDialogOpen(true)} data-testid="button-create-asset">
                  <Plus className="h-4 w-4 mr-1" />
                  Yangi Aktiv
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <AssetInventoryTable assets={filteredAssets} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <CreateCountDialog 
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        form={newCountForm}
        setForm={setNewCountForm}
        warehouses={warehouses}
        isPending={createCountMutation.isPending}
        onSubmit={() => {
          const validation = inventoryValuationCountSchema.safeParse(newCountForm);
          if (!validation.success) {
            const firstError = validation.error.errors[0];
            toast({ title: firstError.message, variant: "destructive" });
            return;
          }
          createCountMutation.mutate(newCountForm);
        }}
      />

      <CreateAssetDialog 
        isOpen={isCreateAssetDialogOpen}
        onOpenChange={setIsCreateAssetDialogOpen}
        form={newAssetForm}
        setForm={setNewAssetForm}
        isPending={createAssetMutation.isPending}
        onSubmit={() => {
          const validation = assetInventorySchema.safeParse(newAssetForm);
          if (!validation.success) {
            const firstError = validation.error.errors[0];
            toast({ title: firstError.message, variant: "destructive" });
            return;
          }
          createAssetMutation.mutate(newAssetForm);
        }}
      />

      <CountLinesDialog 
        isOpen={isLinesDialogOpen}
        onOpenChange={setIsLinesDialogOpen}
        selectedCount={selectedCount}
        countLines={countLines}
        isLoading={linesLoading}
      />
    </div>
  );
}
