/**
 * @module MRODashboard
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Shirt, Trash2 } from "lucide-react";
import type {
  MroItem, MroRequest, MroEquipment, MroStats, MroBudget,
  MroCleaningSchedule, MroUtilityReading, MroFacility,
} from "./MRODashboardTypes";
import { mroItemFormSchema, mroRequestFormSchema } from "./MRODashboardTypes";
import { CreateItemDialog, CreateRequestDialog } from "./MRODashboardDialogs";
import { ItemsTab, RequestsTab, EquipmentTab } from "./MRODashboardSections";
import { UtilitiesTab, BuildingTab, CleaningTab, UniformsTab } from "./MRODashboardSections2";
import { EPErrorState, EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function MRODashboard() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

  const itemForm = useForm<z.infer<typeof mroItemFormSchema>>({
    resolver: zodResolver(mroItemFormSchema),
    defaultValues: { itemCode: "", name: "", nameRu: "", category: "cleaning", unit: "dona", minStock: "5", currentStock: "0", unitCost: "0" },
  });
  const requestForm = useForm<z.infer<typeof mroRequestFormSchema>>({
    resolver: zodResolver(mroRequestFormSchema),
    defaultValues: { itemId: "", requestedQuantity: "", purpose: "", department: "" },
  });

  const { data: items, isError, error: itemsError, refetch: refetchItems } = useQuery<MroItem[]>({ queryKey: ["/api/integration/mro/items"], enabled: !!isAuthenticated });
  const { data: requests } = useQuery<MroRequest[]>({ queryKey: ["/api/integration/mro/requests"], enabled: !!isAuthenticated });
  const { data: equipment } = useQuery<MroEquipment[]>({ queryKey: ["/api/integration/mro/equipment"], enabled: !!isAuthenticated });
  const { data: stats } = useQuery<MroStats>({ queryKey: ["/api/integration/mro/stats"], enabled: !!isAuthenticated });
  const { data: cleaningSchedule = [] } = useQuery<MroCleaningSchedule[]>({ queryKey: ["/api/integration/mro/cleaning-schedules"], enabled: !!isAuthenticated });
  const { data: utilityData = [], isLoading: utilityLoading } = useQuery<MroUtilityReading[]>({ queryKey: ["/api/integration/mro/utility-readings"], enabled: !!isAuthenticated });
  const { data: buildingRooms = [], isLoading: facilitiesLoading } = useQuery<MroFacility[]>({ queryKey: ["/api/integration/mro/facilities"], enabled: !!isAuthenticated });
  const { data: ppeItems = [] } = useQuery<MroItem[]>({
    queryKey: ["/api/integration/mro/items", { category: "ppe" }],
    queryFn: () => apiRequest('GET', "/api/integration/mro/items?category=ppe").then(r => r.json()),
    enabled: !!isAuthenticated,
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: z.infer<typeof mroItemFormSchema>) => {
      return apiRequest("POST", "/api/integration/mro/items", { ...data, minStock: parseFloat(data.minStock), currentStock: parseFloat(data.currentStock), unitCost: parseFloat(data.unitCost) });
    },
    onSuccess: () => {
      toast({ title: "MRO buyum yaratildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/integration/mro"] });
      setItemDialogOpen(false);
      itemForm.reset();
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: z.infer<typeof mroRequestFormSchema>) => {
      return apiRequest("POST", "/api/integration/mro/requests", { ...data, requestedQuantity: parseFloat(data.requestedQuantity) });
    },
    onSuccess: () => {
      toast({ title: "MRO so'rov yaratildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/integration/mro"] });
      setRequestDialogOpen(false);
      requestForm.reset();
    },
  });

  const approveRequestMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) =>
      apiRequest("PUT", `/api/integration/requests/${id}/approve`, { action }),
    onSuccess: () => {
      toast({ title: "So'rov holati yangilandi" });
      queryClient.invalidateQueries({ queryKey: ["/api/integration/mro"] });
    },
  });

  const lowStockItems       = stats?.items?.lowStockItems || 0;
  const pendingRequests     = (stats?.requests || []).find((s) => s.status === "pending")?.count || 0;
  const scheduledMaintenance= (stats?.equipment || []).find((s) => s.status === "scheduled")?.count || 0;

  if (itemsError) {
    return <div className="space-y-6"><EPErrorState onRetry={refetchItems} /></div>;
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5" data-testid="page-mro-dashboard">
      <div>
        <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("xojalikBoshqaruvi")}</b></>}
        title={t("xojalikBoshqaruvi")}
        subtitle={t("xojalikMateriallariTamirlashVaTexnik")}
      />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg p-5"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("jamiBuyumlar")}</p><p className="text-4xl font-bold tracking-tight text-foreground mt-1">{stats?.items?.totalItems || 0}</p></div>
        <div className="bg-card rounded-lg p-5"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("kamZaxira")}</p><p className="text-4xl font-bold tracking-tight text-[var(--ep-red)] mt-1">{lowStockItems}</p></div>
        <div className="bg-card rounded-lg p-5"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("kutilayotganSorovlar")}</p><p className="text-4xl font-bold tracking-tight text-[var(--ep-yellow)] mt-1">{pendingRequests}</p></div>
        <div className="bg-card rounded-lg p-5"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("rejalashtirilganTa")}</p><p className="text-4xl font-bold tracking-tight text-primary mt-1">{scheduledMaintenance}</p></div>
      </div>

      <Tabs defaultValue="items" className="w-full">
        <TabsList className="bg-muted/40 p-1 rounded-lg flex-wrap h-auto">
          <TabsTrigger value="items"     data-testid="tab-items"     className="data-[state=active]:bg-card">{t("buyumlar")}</TabsTrigger>
          <TabsTrigger value="requests"  data-testid="tab-requests"  className="data-[state=active]:bg-card">{t("sorovlar")}</TabsTrigger>
          <TabsTrigger value="equipment" data-testid="tab-equipment" className="data-[state=active]:bg-card">{t("uskunalar")}</TabsTrigger>
          <TabsTrigger value="utilities" data-testid="tab-utilities" className="data-[state=active]:bg-card">{t("kommunal")}</TabsTrigger>
          <TabsTrigger value="building"  data-testid="tab-building"  className="data-[state=active]:bg-card">Bino/Xonalar</TabsTrigger>
          <TabsTrigger value="cleaning"  data-testid="tab-cleaning"  className="data-[state=active]:bg-card">{t("tozalash")}</TabsTrigger>
          <TabsTrigger value="uniforms"  data-testid="tab-uniforms"  className="data-[state=active]:bg-card">{t("forma")}</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-6">
          <div className="bg-card rounded-xl p-6">
            <div className="flex justify-end mb-4">
              <CreateItemDialog open={itemDialogOpen} onOpenChange={setItemDialogOpen} form={itemForm} onSubmit={(d) => createItemMutation.mutate(d)} isPending={createItemMutation.isPending} />
            </div>
            <ItemsTab items={items} />
          </div>
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <div className="bg-card rounded-xl p-6">
            <div className="flex justify-end mb-4">
              <CreateRequestDialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen} form={requestForm} onSubmit={(d) => createRequestMutation.mutate(d)} isPending={createRequestMutation.isPending} items={items || []} />
            </div>
            <RequestsTab requests={requests} onApprove={(id, action) => approveRequestMutation.mutate({ id, action })} isPending={approveRequestMutation.isPending} />
          </div>
        </TabsContent>

        <TabsContent value="equipment" className="mt-6">
          <div className="bg-card rounded-xl p-6">
            <EquipmentTab equipment={equipment} />
          </div>
        </TabsContent>

        <TabsContent value="utilities" className="mt-6">
          <div className="bg-card rounded-xl p-6">
            <UtilitiesTab utilityData={utilityData} utilityLoading={utilityLoading} />
          </div>
        </TabsContent>

        <TabsContent value="building" className="mt-6">
          <div className="bg-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">{t("binoVaXonalarInventari")}</h2>
            </div>
            <BuildingTab buildingRooms={buildingRooms} facilitiesLoading={facilitiesLoading} />
          </div>
        </TabsContent>

        <TabsContent value="cleaning" className="mt-6">
          <div className="bg-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Trash2 className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">{t("tozalashJadvali")}</h2>
            </div>
            <CleaningTab cleaningSchedule={cleaningSchedule} />
          </div>
        </TabsContent>

        <TabsContent value="uniforms" className="mt-6">
          <div className="bg-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Shirt className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">{t("formaVaPpeInventari")}</h2>
            </div>
            <UniformsTab ppeItems={ppeItems} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
