/** @module MROExtended @description Route-level orchestrator for MRO — Xo'jalik Boshqaruvi. Owns state, queries, mutations, and tab routing. UI is delegated to tab/dialog sub-modules. */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, selectArray } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building, AlertTriangle } from "lucide-react";
import { ModuleSectionHeader } from "@/components/ModuleSectionHeader";

import {
  URL_TAB_MAP, tabMeta,
  EquipSchema, RequestSchema, ItemSchema,
  type MROEquipment, type MRORequest, type MROItem, type MROStats, type UtilityReading,
  type EquipFormValues, type RequestFormValues, type ItemFormValues,
} from "./MROExtendedTypes";

import { AddEquipDialog, AddRequestDialog, AddItemDialog } from "./MROExtendedDialogs";
import {
  PreventiveTab, SparePartsTab, UtilitiesTab,
} from "./MROExtendedTabsA";
import {
  ExpensesTab, KitchenTab, UniformsTab, OfficeTab, CleaningTab, SanitationTab, BuildingTab,
} from "./MROExtendedTabsB";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function MROExtended() {
  const { t } = useTranslation("common");
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState(URL_TAB_MAP[location] || "preventive");

  useEffect(() => {
    const tab = URL_TAB_MAP[location];
    if (tab) setActiveTab(tab);
  }, [location]);

  const meta = tabMeta[activeTab] || tabMeta["preventive"];
  const { toast } = useToast();

  const [showEquipDialog,   setShowEquipDialog]   = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showItemDialog,    setShowItemDialog]    = useState(false);

  const equipForm   = useForm<EquipFormValues>({   resolver: zodResolver(EquipSchema),   defaultValues: { name: "", type: "machine", location: "", status: "active", purchaseDate: "", warrantyExpiry: "" } });
  const requestForm = useForm<RequestFormValues>({ resolver: zodResolver(RequestSchema), defaultValues: { equipmentId: "", type: "preventive", description: "", priority: "medium", assignedTo: "" } });
  const itemForm    = useForm<ItemFormValues>({    resolver: zodResolver(ItemSchema),    defaultValues: { itemCode: "", name: "", category: "spare_part", unit: "dona", quantity: 0, minQty: 5, location: "" } });

  // --- Queries ---
  const { data: equipment = [], isLoading: equipLoading, refetch: refetchEquip } = useQuery<MROEquipment[]>({
    queryKey: ["/api/integration/equipment"],
    select: selectArray<MROEquipment>,
  });

  const { data: requests = [], isLoading: reqLoading, refetch: refetchReqs } = useQuery<MRORequest[]>({
    queryKey: ["/api/integration/requests"],
    select: selectArray<MRORequest>,
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery<MROItem[]>({
    queryKey: ["/api/integration/items"],
    select: selectArray<MROItem>,
  });

  const { data: stats } = useQuery<MROStats>({
    queryKey: ["/api/integration/stats"],
  });

  const { data: cleaningSchedule = [] } = useQuery<Record<string, unknown>[]>({
    queryKey: ["/api/integration/mro/cleaning-schedules"],
  });

  const { data: utilityReadings = [], isLoading: utilityReadingsLoading } = useQuery<UtilityReading[]>({
    queryKey: ["/api/integration/mro/utility-readings"],
  });

  const { data: ppeItems = [] } = useQuery<MROItem[]>({
    queryKey: ["/api/integration/mro/items", { category: "ppe" }],
    queryFn: () => apiRequest('GET', "/api/integration/mro/items?category=ppe").then((r) => r.json()),
  });

  // --- Mutations ---
  const createEquipment = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/integration/equipment", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/integration/equipment"] }); setShowEquipDialog(false);   toast({ title: "Jihoz qo'shildi" }); },
    onError:   () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const createRequest = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/integration/requests", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/integration/requests"] }); setShowRequestDialog(false); toast({ title: "So'rov yaratildi" }); },
    onError:   () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const createItem = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/integration/items", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/integration/items"] }); setShowItemDialog(false); toast({ title: "Material qo'shildi" }); },
    onError:   () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  // --- Derived ---
  const pendingReqs   = (Array.isArray(requests) ? requests : []).filter((r) => r.status === "pending" || r.status === "open");
  const lowStockItems = (Array.isArray(items)    ? items    : []).filter((i) => Number(i.quantity) <= Number(i.minQty || 5));

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="border-b border-border/50 px-6 py-3 flex items-center gap-3">
        <Building className="h-5 w-5 text-primary" />
        <h1 className="font-semibold text-base">{t("mroXojalikBoshqaruvi")}</h1>
        {pendingReqs.length > 0 && (
          <EPStatusPill tone="neutral" className="ml-2">{pendingReqs.length} so'rov kutmoqda</EPStatusPill>
        )}
        {lowStockItems.length > 0 && (
          <Badge variant="destructive" className="ml-1">
            <AlertTriangle className="h-3 w-3 mr-1" />{lowStockItems.length} kam zaxira
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border/50 px-4 overflow-x-auto" />

        <div className="flex-1 overflow-auto p-6">
          <ModuleSectionHeader
            moduleName="MRO"
            moduleColor="text-[var(--ep-yellow)]"
            sectionTitle={meta?.title || ""}
            icon={meta?.icon || (() => null)}
          />

          <PreventiveTab
            requests={requests} equipment={equipment} stats={stats}
            reqLoading={reqLoading} pendingReqs={pendingReqs}
            onAddRequest={() => setShowRequestDialog(true)}
            onAddEquip={() => setShowEquipDialog(true)}
            onRefresh={() => { refetchEquip(); refetchReqs(); }}
          />

          <SparePartsTab
            items={items} itemsLoading={itemsLoading}
            lowStockItems={lowStockItems}
            onAddItem={() => setShowItemDialog(true)}
          />

          <UtilitiesTab stats={stats} utilityReadings={utilityReadings} utilityReadingsLoading={utilityReadingsLoading} />

          <ExpensesTab budgets={stats?.budgets} />

          <KitchenTab />

          <UniformsTab ppeItems={ppeItems} />

          <OfficeTab equipment={equipment} />

          <CleaningTab cleaningSchedule={cleaningSchedule} />

          <SanitationTab />

          <BuildingTab equipment={equipment} />
        </div>
      </Tabs>

      <AddEquipDialog
        open={showEquipDialog} onOpenChange={setShowEquipDialog}
        form={equipForm} onSubmit={(d) => createEquipment.mutate(d)}
        isPending={createEquipment.isPending}
      />
      <AddRequestDialog
        open={showRequestDialog} onOpenChange={setShowRequestDialog}
        form={requestForm} onSubmit={(d) => createRequest.mutate(d)}
        isPending={createRequest.isPending}
      />
      <AddItemDialog
        open={showItemDialog} onOpenChange={setShowItemDialog}
        form={itemForm} onSubmit={(d) => createItem.mutate(d)}
        isPending={createItem.isPending}
      />
    </div>
  );
}
