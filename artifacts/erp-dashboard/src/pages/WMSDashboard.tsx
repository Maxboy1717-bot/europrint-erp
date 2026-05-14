/**
 * @module WMSDashboard
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient } from "@/lib/queryClient";
import { wmsApi } from "@/lib/api/wms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Bell, RefreshCw, ArrowRightLeft, Plus } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import {
  WarehouseSchema,
  RequestSchema,
  type WMSKPIs,
  type MovementSummary,
  type AlertData,
  type TopMaterial,
  type WarehouseFormData,
  type RequestFormData,
} from "./WMSDashboardTypes";
import { KPISection, MovementCard } from "./WMSDashboardSections";
import { AlertsCard, TopMaterialsCard } from "./WMSDashboardAlerts";
import { CreateWarehouseDialog, CreateRequestDialog } from "./WMSDashboardDialogs";
import { EPPageHeader, EPErrorState } from "@/components/ep";

export default function WMSDashboard() {
  const { toast } = useToast();
  const [createWarehouseOpen, setCreateWarehouseOpen] = useState(false);
  const [createRequestOpen, setCreateRequestOpen] = useState(false);

  const warehouseForm = useForm<WarehouseFormData>({
    resolver: zodResolver(WarehouseSchema),
    defaultValues: { name: "", code: "", type: "main" },
  });
  const requestForm = useForm<RequestFormData>({
    resolver: zodResolver(RequestSchema),
    defaultValues: { materialId: 0, quantity: 0, reason: "" },
  });

  const { data: kpis, isLoading: kpisLoading, isError, refetch } = useQuery<WMSKPIs>({
    queryKey: ["/api/warehouse/dashboard/kpis"],
  });
  const { data: todayMovement, isLoading: movementLoading } = useQuery<MovementSummary>({
    queryKey: ["/api/warehouse/dashboard/movement-summary"],
  });
  const { data: weekMovement } = useQuery<MovementSummary>({
    queryKey: ["/api/warehouse/dashboard/movement-summary", "week"],
    queryFn: () => apiRequest("GET", "/api/warehouse/dashboard/movement-summary?period=week").then(r => r.json()),
  });
  const { data: alerts, isLoading: alertsLoading } = useQuery<AlertData>({
    queryKey: ["/api/warehouse/dashboard/alerts"],
  });
  const { data: topMaterials, isLoading: topLoading } = useQuery<TopMaterial[]>({
    queryKey: ["/api/warehouse/dashboard/top-materials"],
    queryFn: () => apiRequest("GET", "/api/warehouse/dashboard/top-materials?by=value&limit=8").then(r => r.json()),
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
    mutationFn: (data: WarehouseFormData) => wmsApi.createWarehouseCompat(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/dashboard/kpis"] });
      setCreateWarehouseOpen(false);
      warehouseForm.reset();
      toast({ title: "Ombor yaratildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const createRequestMutation = useMutation({
    mutationFn: (data: RequestFormData) => wmsApi.createInternalRequest({
      materialId: data.materialId,
      quantity: data.quantity,
      reason: data.reason,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wms/internal-requests"] });
      setCreateRequestOpen(false);
      requestForm.reset();
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

  if (isError) return <EPErrorState onRetry={refetch} />;
  const totalAlerts = (alerts?.lowStockCount || 0) + (alerts?.pendingQC || 0) + (alerts?.overdueTasks || 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">Ombor Boshqaruvi</b></>}
        title="Ombor Boshqaruvi"
        subtitle="WMS — Joriy holat va operatsiyalar"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => checkAlertsMutation.mutate()} disabled={checkAlertsMutation.isPending}>
              <Bell className="h-4 w-4 mr-2" />Alertlarni tekshirish
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />Yangilash
            </Button>
            <Button size="sm" onClick={() => setCreateRequestOpen(true)}>
              <ArrowRightLeft className="h-4 w-4 mr-2" />Ichki so'rov
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setCreateWarehouseOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Yangi ombor
            </Button>
            <Link href="/wms">
              <Badge variant="outline" className="cursor-pointer">Ombor moduliga o'tish</Badge>
            </Link>
          </div>
        }
      />

      <KPISection kpis={kpis} isLoading={kpisLoading} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MovementCard
          todayMovement={todayMovement}
          weekMovement={weekMovement}
          isLoading={movementLoading}
          onReserveStock={(data) => reserveStockMutation.mutate(data)}
          isReserving={reserveStockMutation.isPending}
        />
        <AlertsCard
          alerts={alerts}
          isLoading={alertsLoading}
          totalAlerts={totalAlerts}
          onCheckAlerts={() => checkAlertsMutation.mutate()}
          isChecking={checkAlertsMutation.isPending}
          onReserveStock={(data) => reserveStockMutation.mutate(data)}
        />
      </div>

      <TopMaterialsCard topMaterials={topMaterials} isLoading={topLoading} />

      <CreateWarehouseDialog
        open={createWarehouseOpen}
        onOpenChange={setCreateWarehouseOpen}
        form={warehouseForm}
        onSubmit={(d) => createWarehouseMutation.mutate(d)}
        isPending={createWarehouseMutation.isPending}
      />

      <CreateRequestDialog
        open={createRequestOpen}
        onOpenChange={setCreateRequestOpen}
        form={requestForm}
        onSubmit={(d) => createRequestMutation.mutate(d)}
        isPending={createRequestMutation.isPending}
      />
    </div>
  );
}
