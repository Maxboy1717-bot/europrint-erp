/**
 * @module BinsTab
 * @description React page component. Route-level UI.
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { WarehouseData, ZoneData, BinData, BinFormData, Lang, Translations, binSchema } from "./warehouse-types";
import { Bin360Data } from "./BinsTabTypes";
import { BinsToolbar, BinsTable, BinsEmptyState } from "./BinsTabSections";
import { BinFormDialog, BinDeleteDialog } from "./BinsTabDialogs";
import { Bin360Dialog } from "./BinsTabView360";

interface BinsTabProps {
  lang: Lang;
  t: Translations;
}

export function BinsTab({ lang, t }: BinsTabProps) {
  const { toast } = useToast();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBin, setEditingBin] = useState<BinData | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewing360BinId, setViewing360BinId] = useState<string | null>(null);

  const { data: warehouses = [] } = useQuery<WarehouseData[]>({
    queryKey: ["/api/warehouse/warehouses"],
  });

  const { data: zones = [] } = useQuery<ZoneData[]>({
    queryKey: ["/api/warehouse/warehouses", selectedWarehouseId, "zones"],
    queryFn: async () => {
      if (!selectedWarehouseId) return [];
      const res = await apiRequest('GET', `/api/warehouse/warehouses/${selectedWarehouseId}/zones`);
      if (!res.ok) throw new Error("Failed to fetch zones");
      return res.json();
    },
    enabled: !!selectedWarehouseId,
  });

  const { data: bins = [], isLoading } = useQuery<BinData[]>({
    queryKey: ["/api/warehouse/warehouses", selectedWarehouseId, "bins"],
    queryFn: async () => {
      if (!selectedWarehouseId) return [];
      const res = await apiRequest('GET', `/api/warehouse/warehouses/${selectedWarehouseId}/bins`);
      if (!res.ok) throw new Error("Failed to fetch bins");
      return res.json();
    },
    enabled: !!selectedWarehouseId,
  });

  const { data: bin360Data, isLoading: is360Loading } = useQuery<Bin360Data>({
    queryKey: ["/api/warehouse/bins", viewing360BinId, "360"],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/warehouse/bins/${viewing360BinId}/360`);
      if (!res.ok) throw new Error("Failed to fetch bin 360");
      return res.json();
    },
    enabled: !!viewing360BinId,
  });

  const form = useForm<BinFormData>({
    resolver: zodResolver(binSchema),
    defaultValues: { warehouseId: "", zoneId: "", binCode: "", row: "", shelf: "", level: "", binType: "standard", maxWeight: 0, maxVolume: 0, isActive: true },
  });

  const createMutation = useMutation({
    mutationFn: (data: BinFormData) => apiRequest("POST", "/api/warehouse/bins", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/warehouses", selectedWarehouseId, "bins"] });
      toast({ title: lang === "uz" ? "Bin yaratildi" : "Ячейка создана" });
      setIsDialogOpen(false);
      form.reset({ warehouseId: selectedWarehouseId, zoneId: "", binCode: "", row: "", shelf: "", level: "", binType: "standard", maxWeight: 0, maxVolume: 0, isActive: true });
    },
    onError: () => toast({ title: lang === "uz" ? "Xatolik yuz berdi" : "Произошла ошибка", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BinFormData> }) =>
      apiRequest("PATCH", `/api/warehouse/bins/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/warehouses", selectedWarehouseId, "bins"] });
      toast({ title: lang === "uz" ? "Bin yangilandi" : "Ячейка обновлена" });
      setIsDialogOpen(false);
      setEditingBin(null);
    },
    onError: () => toast({ title: lang === "uz" ? "Xatolik yuz berdi" : "Произошла ошибка", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/warehouse/bins/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/warehouses", selectedWarehouseId, "bins"] });
      toast({ title: lang === "uz" ? "Bin o'chirildi" : "Ячейка удалена" });
    },
  });

  const handleEdit = (bin: BinData) => {
    setEditingBin(bin);
    form.reset({ warehouseId: bin.warehouseId, zoneId: bin.zoneId, binCode: bin.binCode, row: bin.row || "", shelf: bin.shelf || "", level: bin.level || "", binType: bin.binType, maxWeight: bin.maxWeight || 0, maxVolume: bin.maxVolume || 0, isActive: bin.isActive });
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: BinFormData) => {
    if (editingBin) {
      updateMutation.mutate({ id: editingBin.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredBins = useMemo(() => {
    if (!selectedZoneId) return bins;
    return (Array.isArray(bins) ? bins : []).filter(bin => bin.zoneId === selectedZoneId);
  }, [bins, selectedZoneId]);

  return (
    <>
      <BinsToolbar
        lang={lang}
        t={t}
        selectedWarehouseId={selectedWarehouseId}
        selectedZoneId={selectedZoneId}
        warehouses={Array.isArray(warehouses) ? warehouses : []}
        zones={Array.isArray(zones) ? zones : []}
        onWarehouseChange={setSelectedWarehouseId}
        onZoneChange={setSelectedZoneId}
        onAddClick={() => {
          form.reset({ warehouseId: selectedWarehouseId, zoneId: "", binCode: "", row: "", shelf: "", level: "", binType: "standard", maxWeight: 0, maxVolume: 0, isActive: true });
          setEditingBin(null);
          setIsDialogOpen(true);
        }}
      />

      {!selectedWarehouseId ? (
        <BinsEmptyState lang={lang} />
      ) : (
        <BinsTable
          lang={lang}
          t={t}
          bins={filteredBins}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={setDeleteId}
          onView360={setViewing360BinId}
        />
      )}

      <BinFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingBin={editingBin}
        form={form}
        onSubmit={handleSubmit}
        warehouses={Array.isArray(warehouses) ? warehouses : []}
        zones={Array.isArray(zones) ? zones : []}
        t={t}
      />

      <BinDeleteDialog
        deleteId={deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={id => { deleteMutation.mutate(id); setDeleteId(null); }}
        lang={lang}
        t={t}
      />

      <Bin360Dialog
        viewing360BinId={viewing360BinId}
        bin360Data={bin360Data}
        is360Loading={is360Loading}
        onOpenChange={() => setViewing360BinId(null)}
        lang={lang}
      />
    </>
  );
}
