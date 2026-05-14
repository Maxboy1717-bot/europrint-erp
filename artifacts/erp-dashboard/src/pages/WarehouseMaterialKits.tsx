/**
 * @module WarehouseMaterialKits
 * @description React page component. Route-level UI.
 */

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Package, Calculator, RefreshCw, Languages } from "lucide-react";
import type { PapkaOrder, MaterialKit, MaterialKitItem } from "./WarehouseMaterialKitsTypes";
import { SummaryCards, KitsTable } from "./WarehouseMaterialKitsSections";
import { CreateKitDialog, KitDetailsDialog } from "./WarehouseMaterialKitsDialogs";
import { EPErrorState } from "@/components/ep";

export default function WarehouseMaterialKits() {
  const [lang, setLang] = useState<"uz" | "ru">("uz");
  const [selectedTab, setSelectedTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKit, setSelectedKit] = useState<MaterialKit | null>(null);
  const [kitItems, setKitItems] = useState<MaterialKitItem[]>([]);
  const [showKitDialog, setShowKitDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const { toast } = useToast();

  const t = useCallback((uz: string, ru: string) => lang === "uz" ? uz : ru, [lang]);

  const { data: ordersData = [], isLoading: ordersLoading, refetch: refetchOrders, isError } = useQuery({
    queryKey: ["/api/iot-enhanced/orders-for-kits"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    refetchInterval: 60000,
  });
  const orders = ordersData as PapkaOrder[];

  const { data: kitsData = [], isLoading: kitsLoading, refetch: refetchKits } = useQuery({
    queryKey: ["/api/iot-enhanced/material-kits"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    refetchInterval: 30000,
  });
  const kits = kitsData as MaterialKit[];

  const calculateBom = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await apiRequest("POST", `/api/iot-enhanced/orders/${orderId}/calculate-bom`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("Material to'plami yaratildi!", "Комплект материалов создан!") });
      refetchKits();
      setShowCreateDialog(false);
    },
    onError: () => {
      toast({ title: t("Xatolik yuz berdi", "Произошла ошибка"), variant: "destructive" });
    },
  });

  const prepareKit = useMutation({
    mutationFn: async (kitId: number) => {
      const res = await apiRequest("PATCH", `/api/iot/material-kits/${kitId}/prepare`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("To'plam tayyorlanmoqda", "Комплект готовится") });
      refetchKits();
    },
  });

  const markReady = useMutation({
    mutationFn: async (kitId: number) => {
      const res = await apiRequest("PATCH", `/api/iot/material-kits/${kitId}/ready`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("To'plam tayyor!", "Комплект готов!") });
      refetchKits();
    },
  });

  const fetchKitItems = async (kitId: number) => {
    try {
      const res = await apiRequest("GET", `/api/iot-enhanced/material-kits/${kitId}/items`);
      if (res.ok) {
        const data = await res.json();
        setKitItems(data);
      }
    } catch {
      setKitItems([]);
    }
  };

  const openKitDetails = async (kit: MaterialKit) => {
    setSelectedKit(kit);
    await fetchKitItems(kit.id);
    setShowKitDialog(true);
  };

  const filteredKits = (Array.isArray(kits) ? kits : []).filter(kit => {
    const matchesStatus = selectedTab === "all" || kit.status === selectedTab;
    const matchesSearch = !searchQuery ||
      kit.kitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kit.order?.papkaNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kit.order?.naimenovanie?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingOrders = (Array.isArray(orders) ? orders : []).filter(o =>
    !(Array.isArray(kits) ? kits : []).some(k => k.orderId === o.id) &&
    (o.status === "yangi" || o.status === "tasdiqlangan")
  );

  if (isError) {
    return <EPErrorState onRetry={refetchOrders} />;
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5" data-testid="warehouse-material-kits">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-7 w-7 text-primary" />
            {t("Ombor Material To'plamlari", "Складские комплекты материалов")}
          </h1>
          <p className="text-muted-foreground">
            {t("Ishlab chiqarish uchun material to'plamlarini tayyorlash", "Подготовка комплектов материалов для производства")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => { refetchKits(); refetchOrders(); }} data-testid="button-refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setLang(l => l === "uz" ? "ru" : "uz")} data-testid="button-lang">
            <Languages className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} data-testid="button-new-kit">
            <Calculator className="h-4 w-4 mr-2" />
            {t("Yangi to'plam", "Новый комплект")}
          </Button>
        </div>
      </div>

      <SummaryCards kits={kits} t={t} />

      <KitsTable
        kits={kits}
        filteredKits={filteredKits}
        kitsLoading={kitsLoading}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        lang={lang}
        onPrepare={(id) => prepareKit.mutate(id)}
        onMarkReady={(id) => markReady.mutate(id)}
        onOpenDetails={openKitDetails}
        preparePending={prepareKit.isPending}
        markReadyPending={markReady.isPending}
        t={t}
      />

      <CreateKitDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        pendingOrders={pendingOrders}
        selectedOrderId={selectedOrderId}
        onSelectOrder={setSelectedOrderId}
        onCalculate={() => selectedOrderId && calculateBom.mutate(selectedOrderId)}
        isPending={calculateBom.isPending}
        t={t}
      />

      <KitDetailsDialog
        open={showKitDialog}
        onOpenChange={setShowKitDialog}
        selectedKit={selectedKit}
        kitItems={kitItems}
        t={t}
      />
    </div>
  );
}
