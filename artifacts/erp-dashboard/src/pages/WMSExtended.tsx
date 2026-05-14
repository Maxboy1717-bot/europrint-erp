/**
 * @module WMSExtended
 * @description React page component. Route-level UI.
 * Orchestrates tabs, queries, mutations, and dialog state.
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Package, GitBranch, Layers, BarChart3, RefreshCw } from "lucide-react";
import { PillTabs } from "@/components/ui/pill-tabs";
import {
  URL_TAB_MAP, WMS_TABS,
  TransferSchema, InternalRequestSchema,
  type StockItem, type WarehouseTransfer, type LotRecord,
  type InternalReq, type OccupancyData, type RentalRecord,
  type TransferFormValues, type InternalRequestFormValues,
} from "./WMSExtendedTypes";
import { BalanceSection, TransferSection, LotSection, RequestsSection, KpiSection, RentalSection } from "./WMSExtendedSections";
import { TransferDialog, InternalRequestDialog } from "./WMSExtendedDialogs";
import { EPPageHeader } from "@/components/ep";

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

  const transferForm = useForm<TransferFormValues>({
    resolver: zodResolver(TransferSchema),
    defaultValues: { fromWarehouse: "", toWarehouse: "", materialName: "", quantity: 0 },
  });
  const requestForm = useForm<InternalRequestFormValues>({
    resolver: zodResolver(InternalRequestSchema),
    defaultValues: { department: "", materialName: "", quantity: 0, reason: "" },
  });

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
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">Ombor Kengaytirilgan</b></>}
        title="Ombor Kengaytirilgan"
      />
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

      {/* Unified KPI Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {stockLoading ? (
          ([0, 1, 2, 3]).map(i => (
            <div key={`k-${i}`} className="bg-card rounded-lg p-5">
              <Skeleton className="h-3 w-24 mb-2 rounded-lg" />
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
          ))
        ) : (
          ([
            { label: "Jami Materiallar", value: stock.length, icon: Package },
            { label: "Faol Pozitsiyalar", value: activeCount, icon: BarChart3 },
            { label: "Kam Qolgan", value: lowStockCount, icon: Layers },
            { label: "Top Materiallar", value: topMaterials.length, icon: GitBranch },
          ]).map((item, i) => (
            <div key={`k-${i}`} className="bg-card rounded-lg p-5" data-testid={`kpi-wms-${i}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
              <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{item.value}</p>
            </div>
          ))
        )}
      </div>

      <PillTabs
        tabs={(Array.isArray(WMS_TABS) ? WMS_TABS : []).map((t) => ({ key: t.key, label: t.label }))}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "balance" && <BalanceSection stock={stock} stockLoading={stockLoading} />}

      {activeTab === "transfer" && (
        <>
          <TransferSection transfers={transfers} onCreateClick={() => setShowTransferDialog(true)} />
          <TransferDialog
            open={showTransferDialog}
            onOpenChange={setShowTransferDialog}
            form={transferForm}
            mutation={createTransfer}
          />
        </>
      )}

      {activeTab === "lot" && (
        <LotSection
          lots={lots}
          lotsLoading={lotsLoading}
          lotSearch={lotSearch}
          onSearchChange={setLotSearch}
        />
      )}

      {activeTab === "requests" && (
        <>
          <RequestsSection internalReqs={internalReqs} onCreateClick={() => setShowRequestDialog(true)} />
          <InternalRequestDialog
            open={showRequestDialog}
            onOpenChange={setShowRequestDialog}
            form={requestForm}
            mutation={createRequest}
          />
        </>
      )}

      {activeTab === "kpi" && (
        <KpiSection
          wmsKpis={wmsKpis}
          occupancy={occupancy}
          onRefresh={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/warehouse/dashboard/kpis"] });
            queryClient.invalidateQueries({ queryKey: ["/api/warehouse/dashboard/warehouse-occupancy"] });
          }}
        />
      )}

      {activeTab === "rental" && (
        <RentalSection rentalData={rentalData} rentalLoading={rentalLoading} />
      )}
    </div>
  );
}
