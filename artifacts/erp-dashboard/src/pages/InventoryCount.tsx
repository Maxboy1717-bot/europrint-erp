/**
 * @module InventoryCount
 * @description React page component. Route-level UI.
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/lib/i18n";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  InventoryCountData,
  StatsData,
  WarehouseData,
  UserData,
  inventoryCountFormSchema,
  InventoryCountFormValues,
  InventoryCountLineData,
} from "@/components/wms/inventory/types";
import { useInventoryCountTranslations } from "@/components/wms/inventory/useInventoryCountTranslations";
import { CountSessionTable } from "@/components/wms/inventory/CountSessionTable";
import { ItemCountForm } from "@/components/wms/inventory/ItemCountForm";
import { DiscrepancyReport } from "@/components/wms/inventory/DiscrepancyReport";
import { CreateUpdateCountDialog } from "@/components/wms/inventory/CreateUpdateCountDialog";
import { InventoryStats } from "@/components/wms/inventory/InventoryStats";
import { CountDetailHeader } from "@/components/wms/inventory/CountDetailHeader";
import { EPErrorState } from "@/components/ep";

export default function InventoryCount() {
  const { toast } = useToast();
  const { language, setLanguage } = useLanguage();
  const t = useInventoryCountTranslations();

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("");
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCount, setEditingCount] = useState<InventoryCountData | null>(null);
  const [selectedCount, setSelectedCount] = useState<InventoryCountData | null>(null);
  const [isDetailView, setIsDetailView] = useState(false);
  
  const [formData, setFormData] = useState<InventoryCountFormValues>({
    countDate: new Date().toISOString().split("T")[0],
    warehouseId: "",
    countType: "full",
    assignedTo: "",
    notes: "",
  });

  const [lineUpdates, setLineUpdates] = useState<Record<string, { countedQuantity: number; reason: string }>>({});

  // Queries
  const { data: stats, isLoading: statsLoading } = useQuery<StatsData>({
    queryKey: ["/api/warehouse/inventory-counts-stats"],
  });

  const { data: counts = [], isLoading: countsLoading, error: countsError, isError, refetch } = useQuery<InventoryCountData[]>({
    queryKey: ["/api/warehouse/inventory-counts", { status: statusFilter, warehouseId: warehouseFilter }],
  });

  const { data: warehouses = [] } = useQuery<WarehouseData[]>({
    queryKey: ["/api/warehouse/warehouses"],
  });

  const { data: users = [] } = useQuery<UserData[]>({
    queryKey: ["/api/users"],
  });

  const { data: countDetail, isLoading: detailLoading, refetch: refetchDetail } = useQuery<InventoryCountData>({
    queryKey: ["/api/warehouse/inventory-counts", selectedCount?.id],
    enabled: !!selectedCount?.id,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: InventoryCountFormValues) => apiRequest("POST", "/api/warehouse/inventory-counts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/inventory-counts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/inventory-counts-stats"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: t.messages.createSuccess });
    },
    onError: (error: Error) => toast({ title: t.error, description: error.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InventoryCountFormValues> }) => apiRequest("PATCH", `/api/warehouse/inventory-counts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/inventory-counts"] });
      setEditingCount(null);
      resetForm();
      toast({ title: t.messages.updateSuccess });
    },
    onError: (error: Error) => toast({ title: t.error, description: error.message, variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => apiRequest("PATCH", `/api/warehouse/inventory-counts/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/inventory-counts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/inventory-counts-stats"] });
      if (selectedCount) refetchDetail();
      toast({ title: t.messages.statusUpdated });
    },
    onError: (error: Error) => toast({ title: t.error, description: error.message, variant: "destructive" }),
  });

  const generateLinesMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("POST", `/api/warehouse/inventory-counts/${id}/generate-lines`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/inventory-counts"] });
      if (selectedCount) refetchDetail();
      toast({ title: t.messages.linesGenerated });
    },
    onError: (error: Error) => toast({ title: t.error, description: error.message, variant: "destructive" }),
  });

  const updateLineMutation = useMutation({
    mutationFn: async ({ lineId, data }: { lineId: string; data: { countedQuantity: number; reason: string } }) => apiRequest("PATCH", `/api/warehouse/inventory-counts/lines/${lineId}`, data),
    onSuccess: () => {
      refetchDetail();
      toast({ title: t.messages.lineUpdated });
    },
    onError: (error: Error) => toast({ title: t.error, description: error.message, variant: "destructive" }),
  });

  const resetForm = () => setFormData({ countDate: new Date().toISOString().split("T")[0], warehouseId: "", countType: "full", assignedTo: "", notes: "" });

  const handleFormSubmit = () => {
    const validation = inventoryCountFormSchema.safeParse(formData);
    if (!validation.success) {
      toast({ title: validation.error.errors[0].message, variant: "destructive" });
      return;
    }
    if (editingCount) updateMutation.mutate({ id: editingCount.id, data: formData });
    else createMutation.mutate(formData);
  };

  const handleViewDetail = (count: InventoryCountData) => { setSelectedCount(count); setIsDetailView(true); setLineUpdates({}); };

  const handleSaveAllLines = async () => {
    for (const [lineId, data] of Object.entries(lineUpdates)) await updateLineMutation.mutateAsync({ lineId, data });
    setLineUpdates({});
  };

  const handleExport = () => {
    const rows = (countDetail?.lines || []).map((l: InventoryCountLineData) => [l.materialCode, l.materialName, l.bookQuantity, l.countedQuantity, l.variance].join(","));
    const csv = ["Material Code,Material Name,Book Qty,Counted Qty,Variance", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `inventory-count-${countDetail?.countNumber || "export"}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const filteredCounts = useMemo(() => (Array.isArray(counts) ? counts : []).filter((c) => (!statusFilter || c.status === statusFilter) && (!warehouseFilter || c.warehouseId === warehouseFilter)), [counts, statusFilter, warehouseFilter]);

  const varianceSummary = useMemo(() => (countDetail?.lines || []).reduce((acc, line) => {
    const v = line.valueVariance || 0;
    if (v > 0) acc.positive += v; else if (v < 0) acc.negative += v;
    acc.total += v; return acc;
  }, { positive: 0, negative: 0, total: 0 }), [countDetail?.lines]);

  if (isDetailView && selectedCount) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
        <CountDetailHeader 
          countDetail={countDetail} 
          onBack={() => { setIsDetailView(false); setSelectedCount(null); }} 
          onStatusChange={(status) => statusMutation.mutate({ id: String(countDetail?.id ?? ""), status })}
          onGenerateLines={() => generateLinesMutation.mutate(String(countDetail?.id ?? ""))}
          onSaveAllLines={handleSaveAllLines}
          onExport={handleExport}
          isGeneratingLines={generateLinesMutation.isPending}
          hasLineUpdates={Object.keys(lineUpdates).length > 0}
        />
        <DiscrepancyReport varianceSummary={varianceSummary} />
        <ItemCountForm countDetail={countDetail} isLoading={detailLoading} lineUpdates={lineUpdates} onLineChange={(id, f, v) => setLineUpdates(prev => ({ ...prev, [id]: { ...prev[id], countedQuantity: prev[id]?.countedQuantity ?? 0, reason: prev[id]?.reason ?? "", [f]: v } }))} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="ep-h1 text-foreground">{t.title}</h1><p className="text-muted-foreground">{t.subtitle}</p></div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setLanguage(language === "uz" ? "ru" : "uz")}>{language === "uz" ? "RU" : "UZ"}</Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />{t.actions.create}</Button>
        </div>
      </div>
      <InventoryStats stats={stats} isLoading={statsLoading} />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t.title}</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-9"><SelectValue placeholder={t.filters.allStatuses} /></SelectTrigger>
                <SelectContent><SelectItem value="all">{t.filters.allStatuses}</SelectItem><SelectItem value="planned">{t.statuses.planned}</SelectItem><SelectItem value="in_progress">{t.statuses.in_progress}</SelectItem><SelectItem value="completed">{t.statuses.completed}</SelectItem><SelectItem value="approved">{t.statuses.approved}</SelectItem></SelectContent>
              </Select>
              <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-9"><SelectValue placeholder={t.filters.allWarehouses} /></SelectTrigger>
                <SelectContent><SelectItem value="all">{t.filters.allWarehouses}</SelectItem>{(Array.isArray(warehouses) ? warehouses : []).map((w) => (<SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {countsLoading ? <div className="space-y-4">{([...Array(5)]).map((_, i) => (<Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />))}</div> : countsError ? <EPErrorState description={(countsError as Error)?.message} onRetry={() => refetch()} /> :<CountSessionTable counts={filteredCounts} onEdit={(c) => { setEditingCount(c); setFormData({ countDate: c.countDate, warehouseId: c.warehouseId || "", countType: c.countType, assignedTo: c.assignedTo ? String(c.assignedTo) : "", notes: c.notes || "" }); }} onView={handleViewDetail} />}
        </CardContent>
      </Card>
      <CreateUpdateCountDialog isOpen={isCreateDialogOpen || !!editingCount} onOpenChange={(open) => { if (!open) { setIsCreateDialogOpen(false); setEditingCount(null); resetForm(); } else setIsCreateDialogOpen(true); }} isEditing={!!editingCount} formData={formData} onFormChange={(data) => setFormData((prev) => ({ ...prev, ...data }))} onSubmit={handleFormSubmit} isPending={createMutation.isPending || updateMutation.isPending} warehouses={warehouses} users={users} />
    </div>
  );
}
