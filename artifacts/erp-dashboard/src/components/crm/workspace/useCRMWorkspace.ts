import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { startOfDay, endOfDay, isToday } from "date-fns";
import {
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { apiRequest, queryClient, safeArray } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  type EntityType,
  type ViewMode,
  type QuickFilter,
  type AdvancedFilters,
  type Lead,
  type Deal,
  type Contact,
  type Company,
  type Proposal,
  type Invoice,
  type Robot,
  DEFAULT_ADVANCED_FILTERS,
  INCOMING_SOURCES,
  LEAD_STAGES,
  DEAL_STAGES,
  PROPOSAL_STAGES,
  INVOICE_STAGES,
  PROPOSAL_STATUS_MAP,
  INVOICE_STATUS_MAP,
  useCurrentUser,
  useDebounce,
  getActiveFilterCount,
} from "@/pages/crm/crm-types";
import { CrmActivity, CrmEntityLike, FilterableEntity } from "./types";

export function useCRMWorkspace() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);

  const [activeEntity, setActiveEntity] = useState<EntityType>(() => {
    const e = params.get("entity");
    if (e && ["leads", "deals", "contacts", "companies", "proposals", "invoices", "robots"].includes(e)) return e as EntityType;
    return "leads";
  });
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const v = params.get("view");
    if (v && ["kanban", "list", "tasks", "calendar", "robots"].includes(v)) return v as ViewMode;
    return "kanban";
  });
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const id = params.get("id");
    return id ? parseInt(id) : null;
  });
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [activeItemId, setActiveItemId] = useState<number | null>(null);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(DEFAULT_ADVANCED_FILTERS);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [nameSortAsc, setNameSortAsc] = useState(true);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [activityForm, setActivityForm] = useState({ type: "call" as string, subject: "", note: "", dueDate: "", entityType: "lead", entityId: "" });
  const [activityFilter, setActivityFilter] = useState<"today" | "all">("today");

  const currentUserId = useCurrentUser();
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const activeFilterCount = getActiveFilterCount(advancedFilters);
  const { toast } = useToast();

  useEffect(() => {
    const newParams = new URLSearchParams();
    newParams.set("entity", activeEntity);
    newParams.set("view", viewMode);
    if (selectedId) newParams.set("id", selectedId.toString());
    setLocation(`/crm-workspace?${newParams.toString()}`, { replace: true });
  }, [activeEntity, viewMode, selectedId, setLocation]);

  const { data: leads = [], isLoading: leadsLoading, isError: leadsError, refetch: refetchLeads } = useQuery<Lead[]>({
    queryKey: ["/api/crm/leads"],
    enabled: activeEntity === "leads",
  });

  const { data: deals = [], isLoading: dealsLoading } = useQuery<Deal[]>({
    queryKey: ["/api/crm/deals"],
    enabled: activeEntity === "deals",
  });

  const { data: contacts = [], isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: ["/api/crm/contacts"],
    enabled: activeEntity === "contacts",
  });

  const { data: companies = [], isLoading: companiesLoading } = useQuery<Company[]>({
    queryKey: ["/api/crm/companies"],
    enabled: activeEntity === "companies",
  });

  const { data: proposals = [], isLoading: proposalsLoading } = useQuery<Proposal[]>({
    queryKey: ["/api/crm-bitrix/proposals"],
    enabled: activeEntity === "proposals",
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/crm-bitrix/invoices"],
    enabled: activeEntity === "invoices",
  });

  const { data: robots = [], isLoading: robotsLoading } = useQuery<Robot[]>({
    queryKey: ["/api/crm-bitrix/robots"],
    enabled: activeEntity === "robots",
  });

  const { data: todayActivities = [], isLoading: activitiesLoading } = useQuery<CrmActivity[]>({
    queryKey: ["/api/crm/followup-activities/today"],
    enabled: viewMode === "tasks",
  });

  const { data: allActivities = [] } = useQuery<CrmActivity[]>({
    queryKey: ["/api/crm/followup-activities"],
    enabled: viewMode === "tasks" && activityFilter === "all",
  });

  const createActivityMutation = useMutation({
    mutationFn: (body: typeof activityForm) => apiRequest("POST", "/api/crm/followup-activities", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/followup-activities"] });
      setShowActivityDialog(false);
      setActivityForm({ type: "call", subject: "", note: "", dueDate: "", entityType: "lead", entityId: "" });
      toast({ title: "Faoliyat qo'shildi" });
    },
  });

  const doneActivityMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/crm/followup-activities/${id}`, { isDone: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/crm/followup-activities"] }),
  });

  const deleteActivityMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/crm/followup-activities/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/crm/followup-activities"] }),
  });

  const moveItemMutation = useMutation({
    mutationFn: async ({ itemId, stageId }: { itemId: number; stageId: string }) => {
      let endpoint = "/api/crm/leads";
      let field = "statusId";
      if (activeEntity === "deals") { endpoint = "/api/crm/deals"; field = "stageId"; }
      else if (activeEntity === "proposals") { endpoint = "/api/crm-bitrix/proposals"; field = "status"; }
      else if (activeEntity === "invoices") { endpoint = "/api/crm-bitrix/invoices"; field = "stageId"; }
      return apiRequest("PATCH", `${endpoint}/${itemId}/stage`, { [field]: stageId });
    },
    onSuccess: (data: { autoOrder?: { documentNumber: string } } | null) => {
      queryClient.invalidateQueries({ queryKey: [`/api/crm/${activeEntity}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/sd/orders"] });
      if (data?.autoOrder) {
        toast({ title: "Lid yutildi — SD buyurtma yaratildi", description: `Buyurtma raqami: ${data.autoOrder.documentNumber}.`, duration: 6000 });
      } else {
        toast({ title: "Ko'chirildi" });
      }
    },
  });

  const deleteItemsMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const endpoint = `/api/crm/${activeEntity}`;
      return Promise.all((ids ?? []).map(id => apiRequest("DELETE", `${endpoint}/${id}`))).catch((err: unknown) => {
        console.error('CRM element o\'chirish xatosi:', err);
        return Promise.reject(err);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/crm/${activeEntity}`] });
      setSelectedItems(new Set());
      toast({ title: "O'chirildi" });
    },
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const handleDragStart = (event: DragStartEvent) => setActiveItemId(event.active.id as number);
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItemId(null);
    if (!over) return;
    const itemId = active.id as number;
    const newStageId = (over.data.current?.sortable?.containerId ?? over.data.current?.stageId ?? over.id) as string;
    if (!newStageId || typeof newStageId !== "string") return;
    const items = activeEntity === "leads" ? leads : deals;
    const item = (items ?? []).find(i => i.id === itemId);
    const currentStageId = activeEntity === "leads" ? (item as Lead)?.statusId : (item as Deal)?.stageId;
    if (!item || currentStageId === newStageId) return;
    moveItemMutation.mutate({ itemId, stageId: newStageId });
  };

  const getFilteredItems = useCallback((): FilterableEntity[] => {
    let items: FilterableEntity[] = [];
    const toArr = <T>(v: unknown) => safeArray<T>(v) as unknown as FilterableEntity[];
    if (activeEntity === "leads") items = toArr<Lead>(leads);
    else if (activeEntity === "deals") items = toArr<Deal>(deals);
    else if (activeEntity === "contacts") items = toArr<Contact>(contacts);
    else if (activeEntity === "companies") items = toArr<Company>(companies);
    else if (activeEntity === "proposals") items = toArr<Proposal>(proposals);
    else if (activeEntity === "invoices") items = toArr<Invoice>(invoices);
    else if (activeEntity === "robots") items = toArr<Robot>(robots);

    if (quickFilter !== "all") {
      items = (items ?? []).filter(item => {
        const rec = item as CrmEntityLike;
        const dateCreate = rec.dateCreate || rec.createdAt;
        if (quickFilter === "today" && dateCreate) return isToday(new Date(dateCreate));
        if (quickFilter === "my" && currentUserId) return rec.assignedById === currentUserId;
        if (quickFilter === "incoming") return rec.sourceId && INCOMING_SOURCES.includes(rec.sourceId.toUpperCase());
        return true;
      });
    }

    if (advancedFilters.dateFrom) {
      const from = startOfDay(new Date(advancedFilters.dateFrom));
      items = (items ?? []).filter(item => new Date((item as CrmEntityLike).dateCreate || (item as CrmEntityLike).createdAt || "") >= from);
    }
    if (advancedFilters.dateTo) {
      const to = endOfDay(new Date(advancedFilters.dateTo));
      items = (items ?? []).filter(item => new Date((item as CrmEntityLike).dateCreate || (item as CrmEntityLike).createdAt || "") <= to);
    }
    if (advancedFilters.stageId) {
      items = (items ?? []).filter(item => ((item as CrmEntityLike).statusId || (item as CrmEntityLike).stageId || (item as CrmEntityLike).status) === advancedFilters.stageId);
    }
    if (advancedFilters.assignedById) items = (items ?? []).filter(item => (item as CrmEntityLike).assignedById === advancedFilters.assignedById);
    if (advancedFilters.sourceId) items = (items ?? []).filter(item => ((item as CrmEntityLike).sourceId || (item as CrmEntityLike).source) === advancedFilters.sourceId);
    if (advancedFilters.amountFrom !== null) items = (items ?? []).filter(item => ((item as CrmEntityLike).opportunity || (item as CrmEntityLike).totalAmount || 0) >= (advancedFilters.amountFrom || 0));
    if (advancedFilters.amountTo !== null) items = (items ?? []).filter(item => ((item as CrmEntityLike).opportunity || (item as CrmEntityLike).totalAmount || 0) <= (advancedFilters.amountTo || Infinity));

    if (debouncedSearchQuery) {
      const q = debouncedSearchQuery.toLowerCase();
      items = (items ?? []).filter(item => {
        const rec = item as CrmEntityLike;
        const title = rec.title || rec.name || ([rec.lastName, rec.name]).filter(Boolean).join(" ");
        return title?.toLowerCase().includes(q) || rec.phones?.[0]?.value?.includes(q) || rec.number?.includes(q);
      });
    }
    return items;
  }, [activeEntity, leads, deals, contacts, companies, proposals, invoices, robots, quickFilter, currentUserId, advancedFilters, debouncedSearchQuery]);

  const filteredItems = useMemo(() => {
    return [...getFilteredItems()].sort((a, b) => {
      const nameA = ((a as CrmEntityLike).title || (a as CrmEntityLike).name || "").toLowerCase();
      const nameB = ((b as CrmEntityLike).title || (b as CrmEntityLike).name || "").toLowerCase();
      return nameSortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
  }, [getFilteredItems, nameSortAsc]);

  const stages = activeEntity === "leads" ? LEAD_STAGES : activeEntity === "deals" ? DEAL_STAGES : activeEntity === "proposals" ? PROPOSAL_STAGES : activeEntity === "invoices" ? INVOICE_STAGES : LEAD_STAGES;

  const itemsByStage = useMemo(() => {
    if (!["leads", "deals", "proposals", "invoices"].includes(activeEntity)) return {};
    return (Array.isArray(stages) ? stages : []).reduce((acc, stage) => {
      acc[stage.stageId] = (Array.isArray(filteredItems) ? filteredItems : []).filter((item: FilterableEntity) => {
        const i = item as unknown as Record<string, unknown>;
        if (activeEntity === "proposals") return (PROPOSAL_STATUS_MAP[i.status as string] || i.status) === stage.stageId;
        if (activeEntity === "invoices") return (INVOICE_STATUS_MAP[i.status as string] || i.stageId || i.status) === stage.stageId;
        return (i.statusId || i.stageId) === stage.stageId;
      });
      return acc;
    }, {} as Record<string, FilterableEntity[]>);
  }, [filteredItems, stages, activeEntity]);

  const stageValues = useMemo(() => {
    if (!["deals", "proposals", "invoices"].includes(activeEntity)) return {};
    return (Array.isArray(stages) ? stages : []).reduce((acc, stage) => {
      const items = itemsByStage[stage.stageId] || [];
      acc[stage.stageId] = (items ?? []).reduce((sum, d: FilterableEntity) => sum + ((d as unknown as Record<string, unknown>).opportunity as number || (d as unknown as Record<string, unknown>).totalAmount as number || 0), 0);
      return acc;
    }, {} as Record<string, number>);
  }, [itemsByStage, activeEntity, stages]);

  const isLoading = leadsLoading || dealsLoading || contactsLoading || companiesLoading || proposalsLoading || invoicesLoading || robotsLoading;
  const supportsKanban = ["leads", "deals", "proposals", "invoices"].includes(activeEntity);

  return {
    activeEntity, setActiveEntity, viewMode, setViewMode,
    selectedId, setSelectedId, quickFilter, setQuickFilter,
    searchQuery, setSearchQuery, showQuickCreate, setShowQuickCreate,
    selectedItems, setSelectedItems, activeItemId,
    advancedFilters, setAdvancedFilters, showAdvancedFilters, setShowAdvancedFilters,
    nameSortAsc, setNameSortAsc, showActivityDialog, setShowActivityDialog,
    activityForm, setActivityForm, activityFilter, setActivityFilter,
    activeFilterCount, leadsError, refetchLeads,
    todayActivities, allActivities, activitiesLoading,
    createActivityMutation, doneActivityMutation, deleteActivityMutation,
    moveItemMutation, deleteItemsMutation, sensors, handleDragStart, handleDragEnd,
    filteredItems, stages, itemsByStage, stageValues,
    isLoading, supportsKanban, robots, robotsLoading,
  };
}
