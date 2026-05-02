import { cn } from "@/lib/utils";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ErrorState } from "@/components/ui/error-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPlanningOperationSchema, insertProductionPlanHeaderSchema, insertProductionFactSchema } from "@shared/schema";
import type { InsertProductionPlanHeader, InsertProductionFact, InsertPlanningOperation } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";
import {
  Plus, Filter, Calendar as CalendarIcon, Edit,
  Download, FileText, BarChart3, Package, Layers, Loader2, Pencil,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";
import type {
  PlanningOperation, PapkaOrder, PapkaOrdersResponse, Equipment,
  WorkCenter, ProductionPlanRow, ProductionFactRow, ScheduleEntry,
  MRPRun, MRPResult, PurchaseRequisition, Product,
} from "./planning/planning-types";
import {
  OperationFormDialog,
  PlanFormDialog,
  FactFormDialog,
  MRPRunDialog,
  MRPResultsDialog,
} from "./planning/PlanningDialogs";
import { PlanningTabPanels } from "./planning/PlanningTabPanels";

export default function PlanningBoard() {
  const { toast } = useToast();
  const [lang, setLang] = useState<"uz" | "ru">("uz");
  const [activeTab, setActiveTab] = useState("operations");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOperation, setEditingOperation] = useState<PlanningOperation | null>(null);

  const [openPlanDialog, setOpenPlanDialog] = useState(false);
  const [openFactDialog, setOpenFactDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ProductionPlanRow | null>(null);

  const [showRunDialog, setShowRunDialog] = useState(false);
  const [selectedRun, setSelectedRun] = useState<MRPRun | null>(null);
  const [showResults, setShowResults] = useState(false);

  const [filters, setFilters] = useState({
    papkaNo: "",
    status: "all",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
  });

  const [runForm, setRunForm] = useState({
    runName: "",
    planningHorizon: 30,
    includeSafetyStock: true,
    description: "",
  });

  const t = {
    title: lang === "uz" ? "Ishlab chiqarishni rejalashtirish" : "Планирование производства",
    subtitle: lang === "uz" ? "Barcha PP funksiyalari bitta joyda" : "Все функции PP в одном месте",
    operationsTab: lang === "uz" ? "Operatsiyalar" : "Операции",
    scheduleTab: lang === "uz" ? "Jadval" : "График",
    plansTab: lang === "uz" ? "Rejalar" : "Планы",
    factsTab: lang === "uz" ? "Hisobotlar" : "Отчёты",
    planVsFactTab: lang === "uz" ? "Plan vs Fact" : "План vs Факт",
    mrpTab: lang === "uz" ? "MRP" : "MRP",
    addOperation: lang === "uz" ? "Operatsiya qo'shish" : "Добавить операцию",
    filters: lang === "uz" ? "Filtrlar" : "Фильтры",
    papkaNo: lang === "uz" ? "Papka №" : "Папка №",
    status: lang === "uz" ? "Holat" : "Статус",
    dateRange: lang === "uz" ? "Sana oralig'i" : "Диапазон дат",
    all: lang === "uz" ? "Barchasi" : "Все",
    planned: lang === "uz" ? "Rejalashtirilgan" : "Запланировано",
    inProgress: lang === "uz" ? "Jarayonda" : "В процессе",
    completed: lang === "uz" ? "Yakunlangan" : "Завершено",
    cancelled: lang === "uz" ? "Bekor qilingan" : "Отменено",
    operationNo: lang === "uz" ? "Operatsiya kodi" : "Код операции",
    workCenter: lang === "uz" ? "Dastgoh" : "Станок",
    plannedQty: lang === "uz" ? "Reja miqdori" : "План кол-во",
    plannedStart: lang === "uz" ? "Boshlanish" : "Начало",
    plannedEnd: lang === "uz" ? "Tugash" : "Конец",
    actions: lang === "uz" ? "Amallar" : "Действия",
    edit: lang === "uz" ? "Tahrirlash" : "Редактировать",
    save: lang === "uz" ? "Saqlash" : "Сохранить",
    cancel: lang === "uz" ? "Bekor qilish" : "Отмена",
    createTitle: lang === "uz" ? "Yangi operatsiya" : "Новая операция",
    editTitle: lang === "uz" ? "Operatsiyani tahrirlash" : "Редактировать операцию",
    createPlan: lang === "uz" ? "Reja yaratish" : "Создать план",
    addFact: lang === "uz" ? "Hisobot kiritish" : "Добавить отчёт",
    newMRPRun: lang === "uz" ? "Yangi MRP Run" : "Новый MRP Run",
    exportExcel: lang === "uz" ? "Excel export" : "Экспорт Excel",
    loading: lang === "uz" ? "Yuklanmoqda..." : "Загрузка...",
    noData: lang === "uz" ? "Ma'lumot topilmadi" : "Данные не найдены",
    totalRuns: lang === "uz" ? "Jami Run'lar" : "Всего Run",
    purchaseReqs: lang === "uz" ? "Xarid talablari" : "Заявки на закупку",
    materialReqs: lang === "uz" ? "Material talablari" : "Потребности материалов",
    calculate: lang === "uz" ? "Hisoblash" : "Рассчитать",
    results: lang === "uz" ? "Natijalar" : "Результаты",
  };

  const { data: operationsData, isLoading: isLoadingOps, isError: isOpsError, refetch: refetchOps } = useQuery({
    queryKey: ["/api/planning/operations", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.papkaNo) params.append("papkaNo", filters.papkaNo);
      if (filters.status !== "all") params.append("status", filters.status);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      const res = await fetch(`/api/planning/operations?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch operations");
      return res.json();
    }
  });

  const { data: scheduleData, isLoading: isLoadingSchedule } = useQuery({
    queryKey: ["/api/planning/schedule", filters.startDate, filters.endDate],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate: filters.startDate, endDate: filters.endDate });
      const res = await fetch(`/api/planning/schedule?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch schedule");
      return res.json();
    },
    enabled: activeTab === "schedule"
  });

  const { data: papkaOrdersResponse } = useQuery<PapkaOrdersResponse>({ queryKey: ["/api/papka-orders"] });
  const papkaOrdersList = papkaOrdersResponse?.items || [];
  const { data: equipmentList = [] } = useQuery<Equipment[]>({ queryKey: ["/api/equipment"] });
  const { data: workCenters = [] } = useQuery<WorkCenter[]>({ queryKey: ["/api/erp/work-centers"] });
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/erp/products"] });
  const { data: productionPlans = [], isLoading: loadingPlans } = useQuery<ProductionPlanRow[]>({ queryKey: ["/api/erp/production-plans"] });
  const { data: productionFacts = [], isLoading: loadingFacts } = useQuery<ProductionFactRow[]>({ queryKey: ["/api/erp/production-facts"] });
  const { data: mrpRuns = [], isLoading: runsLoading } = useQuery<MRPRun[]>({ queryKey: ['/api/erp/mrp-runs'] });
  const { data: mrpResults = [] } = useQuery<Array<{ result: MRPResult; material: Product }>>({
    queryKey: ['/api/erp/mrp-results'],
    enabled: showResults && selectedRun !== null,
  });
  const { data: purchaseRequisitions = [] } = useQuery<PurchaseRequisition[]>({ queryKey: ['/api/erp/purchase-requisitions'] });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/planning/operations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planning/operations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/planning/schedule"] });
      setIsDialogOpen(false);
      toast({ title: lang === "uz" ? "Operatsiya yaratildi" : "Операция создана" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiRequest("PATCH", `/api/planning/operations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planning/operations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/planning/schedule"] });
      setIsDialogOpen(false);
      toast({ title: lang === "uz" ? "Operatsiya yangilandi" : "Операция обновлена" });
    }
  });

  const savePlan = useMutation({
    mutationFn: async (data: InsertProductionPlanHeader) => {
      if (editingPlan) return apiRequest("PATCH", `/api/erp/production-plans/${editingPlan.id}`, data);
      return apiRequest("POST", "/api/erp/production-plans", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/production-plans"] });
      setOpenPlanDialog(false);
      planForm.reset();
      setEditingPlan(null);
      toast({ title: editingPlan ? (lang === "uz" ? "Reja yangilandi" : "План обновлён") : (lang === "uz" ? "Reja yaratildi" : "План создан") });
    },
    onError: (error: Error) => { toast({ variant: "destructive", title: lang === "uz" ? "Xatolik" : "Ошибка", description: error.message }); }
  });

  const saveFact = useMutation({
    mutationFn: async (data: InsertProductionFact) => apiRequest("POST", "/api/erp/production-facts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/production-facts"] });
      setOpenFactDialog(false);
      factForm.reset();
      toast({ title: lang === "uz" ? "Hisobot saqlandi" : "Отчёт сохранён" });
    },
    onError: (error: Error) => { toast({ variant: "destructive", title: lang === "uz" ? "Xatolik" : "Ошибка", description: error.message }); }
  });

  const createRunMutation = useMutation({
    mutationFn: async (data: typeof runForm) => apiRequest('POST', '/api/erp/mrp-runs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/erp/mrp-runs'] });
      setShowRunDialog(false);
      setRunForm({ runName: "", planningHorizon: 30, includeSafetyStock: true, description: "" });
      toast({ title: lang === "uz" ? "MRP run yaratildi" : "MRP Run создан" });
    },
    onError: () => { toast({ variant: "destructive", title: lang === "uz" ? "Xato" : "Ошибка" }); },
  });

  const calculateMRPMutation = useMutation({
    mutationFn: async (runId: string) => apiRequest('POST', `/api/erp/mrp-runs/${runId}/calculate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/erp/mrp-runs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/erp/mrp-results'] });
      queryClient.invalidateQueries({ queryKey: ['/api/erp/purchase-requisitions'] });
      toast({ title: lang === "uz" ? "MRP hisoblandi" : "MRP рассчитан" });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/erp/mrp-runs'] });
      toast({ variant: "destructive", title: lang === "uz" ? "Xato" : "Ошибка" });
    },
  });

  const form = useForm<InsertPlanningOperation>({
    resolver: zodResolver(insertPlanningOperationSchema),
    defaultValues: {
      papkaOrderId: "", operationCode: "", operationName: "", sequence: 1,
      equipmentId: "", plannedDate: format(new Date(), "yyyy-MM-dd"),
      plannedStartTime: "08:00", plannedEndTime: "17:00", plannedQuantity: 0, status: "planned",
    }
  });

  const planForm = useForm<InsertProductionPlanHeader>({
    resolver: zodResolver(insertProductionPlanHeaderSchema),
    defaultValues: {
      planNumber: "", planDate: new Date().toISOString().split('T')[0],
      planType: "daily", workCenterId: "", shift: "", status: "draft", notes: ""
    }
  });

  const factForm = useForm<InsertProductionFact>({
    resolver: zodResolver(insertProductionFactSchema),
    defaultValues: {
      workCenterId: "", productId: "", factDate: new Date().toISOString().split('T')[0],
      shift: "", factQuantity: 0, goodQuantity: 0, scrapQuantity: 0, startTime: "", endTime: "", notes: ""
    }
  });

  const onSubmit = (data: Record<string, unknown>) => {
    if (editingOperation) { updateMutation.mutate({ id: editingOperation.id, data }); }
    else { createMutation.mutate(data); }
  };

  const handleEdit = (op: PlanningOperation) => {
    setEditingOperation(op);
    form.reset({
      papkaOrderId: op.papkaOrderId, operationCode: op.operationCode, operationName: op.operationName,
      sequence: op.sequence, equipmentId: op.equipmentId || "", plannedDate: op.plannedDate,
      plannedStartTime: op.plannedStartTime, plannedEndTime: op.plannedEndTime,
      plannedQuantity: op.plannedQuantity, status: op.status,
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingOperation(null);
    form.reset({
      papkaOrderId: "", operationCode: "", operationName: "", sequence: 1,
      equipmentId: "", plannedDate: format(new Date(), "yyyy-MM-dd"),
      plannedStartTime: "08:00", plannedEndTime: "17:00", plannedQuantity: 0, status: "planned",
    });
    setIsDialogOpen(true);
  };

  const handleAddPlan = () => {
    setEditingPlan(null);
    planForm.reset({ planNumber: "", planDate: new Date().toISOString().split('T')[0], planType: "daily", status: "draft" });
    setOpenPlanDialog(true);
  };

  const handleEditPlan = (plan: ProductionPlanRow) => {
    setEditingPlan(plan);
    planForm.reset({ planNumber: plan.planNumber, planDate: plan.planDate, planType: plan.planType, workCenterId: plan.workCenterId, shift: plan.shift || "", status: plan.status, notes: plan.notes || "" });
    setOpenPlanDialog(true);
  };

  const handleAddFact = () => {
    factForm.reset({ factDate: new Date().toISOString().split('T')[0], factQuantity: 0, goodQuantity: 0, scrapQuantity: 0 });
    setOpenFactDialog(true);
  };

  const handleCreateRun = () => {
    if (!runForm.runName) {
      toast({ variant: "destructive", title: lang === "uz" ? "Xato" : "Ошибка", description: lang === "uz" ? "Run nomini kiriting" : "Введите название" });
      return;
    }
    createRunMutation.mutate(runForm);
  };

  const getRunResults = (runId: string) => (Array.isArray(mrpResults) ? mrpResults : []).filter((item) => item.result.mrpRunId === runId);

  if (isOpsError) {
    return (<div className="container mx-auto p-4"><ErrorState onRetry={refetchOps} /></div>);
  }

  return (
    <div className="p-6 space-y-6 bg-surface">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CalendarIcon className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-light tracking-tight text-on-surface">
              {t.title.split(' ')[0]} <span className="font-bold text-primary">{t.title.split(' ')[1] || ''}</span>
            </h1>
            <p className="text-on-surface-variant">{t.subtitle}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" className="bg-surface-container text-on-surface rounded-lg px-4 py-2 text-sm font-medium hover:bg-surface-container-high border-none" onClick={() => setLang(lang === "uz" ? "ru" : "uz")} data-testid="button-lang-toggle">
            {lang === "uz" ? "RU" : "UZ"}
          </Button>
          <Button variant="outline" className="bg-surface-container text-on-surface rounded-lg px-4 py-2 text-sm font-medium hover:bg-surface-container-high border-none" onClick={() => {
            const ops = operationsData?.operations || operationsData || [];
            const rows = (Array.isArray(ops) ? ops : []).map((o: { operationCode?: string; operationName?: string; plannedDate?: string; plannedStartTime?: string; plannedEndTime?: string; plannedQuantity?: number; status?: string }) => [o.operationCode, o.operationName, o.plannedDate, o.plannedStartTime, o.plannedEndTime, o.plannedQuantity, o.status].join(","));
            const csv = ["Code,Name,Date,Start,End,Quantity,Status", ...rows].join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "planning-operations.csv"; a.click();
            URL.revokeObjectURL(url);
          }} data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />{t.exportExcel}
          </Button>
          <Button className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold" onClick={handleCreate} data-testid="button-add-operation">
            <Plus className="h-4 w-4 mr-2" />{t.addOperation}
          </Button>
        </div>
      </div>

      <Card className="bg-surface-container-lowest rounded-lg border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-on-surface">
            <Filter className="h-4 w-4 text-primary" />{t.filters}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t.papkaNo}</label>
              <Input placeholder={t.papkaNo} value={filters.papkaNo} onChange={(e) => setFilters({...filters, papkaNo: e.target.value})} className="bg-surface-container border-none" data-testid="input-filter-papka" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t.status}</label>
              <Select value={filters.status} onValueChange={(val) => setFilters({...filters, status: val})}>
                <SelectTrigger className="bg-surface-container border-none" data-testid="select-filter-status"><SelectValue placeholder={t.status} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.all}</SelectItem>
                  <SelectItem value="planned">{t.planned}</SelectItem>
                  <SelectItem value="in_progress">{t.inProgress}</SelectItem>
                  <SelectItem value="completed">{t.completed}</SelectItem>
                  <SelectItem value="cancelled">{t.cancelled}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t.dateRange} (Start)</label>
              <Input type="date" value={filters.startDate} onChange={(e) => setFilters({...filters, startDate: e.target.value})} className="bg-surface-container border-none" data-testid="input-filter-start-date" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t.dateRange} (End)</label>
              <Input type="date" value={filters.endDate} onChange={(e) => setFilters({...filters, endDate: e.target.value})} className="bg-surface-container border-none" data-testid="input-filter-end-date" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <ScrollArea className="w-full">
          <TabsList className="bg-surface-container-low p-1 rounded-xl inline-flex">
            <TabsTrigger value="operations" className="rounded-lg px-6 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all" data-testid="tab-operations">
              <Layers className="h-4 w-4 mr-1 hidden sm:block" />{t.operationsTab}
            </TabsTrigger>
            <TabsTrigger value="schedule" className="rounded-lg px-6 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all" data-testid="tab-schedule">
              <CalendarIcon className="h-4 w-4 mr-1 hidden sm:block" />{t.scheduleTab}
            </TabsTrigger>
            <TabsTrigger value="plans" className="rounded-lg px-6 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all" data-testid="tab-plans">
              <CalendarIcon className="h-4 w-4 mr-1 hidden sm:block" />{t.plansTab}
            </TabsTrigger>
            <TabsTrigger value="facts" className="rounded-lg px-6 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all" data-testid="tab-facts">
              <FileText className="h-4 w-4 mr-1 hidden sm:block" />{t.factsTab}
            </TabsTrigger>
            <TabsTrigger value="plan-vs-fact" className="rounded-lg px-6 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all" data-testid="tab-plan-vs-fact">
              <BarChart3 className="h-4 w-4 mr-1 hidden sm:block" />{t.planVsFactTab}
            </TabsTrigger>
            <TabsTrigger value="mrp" className="rounded-lg px-6 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all" data-testid="tab-mrp">
              <Package className="h-4 w-4 mr-1 hidden sm:block" />{t.mrpTab}
            </TabsTrigger>
          </TabsList>
        </ScrollArea>

        <TabsContent value="operations" className="space-y-4 mt-0">
          <Card className="bg-surface-container-lowest rounded-lg border-none shadow-none">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface-container hover:bg-surface-container border-none">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t.papkaNo}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t.operationNo}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t.workCenter}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t.plannedQty}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t.plannedStart}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t.plannedEnd}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t.status}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right">{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingOps ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-12 text-on-surface-variant"><Loader2 className="w-6 h-6 animate-spin mx-auto mr-2 inline" />{t.loading}</TableCell></TableRow>
                  ) : operationsData?.items?.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-12 text-on-surface-variant">{t.noData}</TableCell></TableRow>
                  ) : (
                    operationsData?.items?.map((op: PlanningOperation) => (
                      <TableRow key={op.id} className="hover:bg-surface-container-low transition-colors border-none" data-testid={`row-operation-${op.id}`}>
                        <TableCell className="py-3 px-6 font-medium">
                          <Link href={`/papka-orders/${op.papkaOrderId}`}>
                            <a className="text-primary hover:underline" data-testid={`link-papka-${op.id}`}>
                              {(papkaOrdersList ?? []).find((p: PapkaOrder) => p.id === op.papkaOrderId)?.papkaNo || op.papkaOrderId}
                            </a>
                          </Link>
                        </TableCell>
                        <TableCell className="py-3 px-6 text-on-surface">{op.operationCode}</TableCell>
                        <TableCell className="py-3 px-6 text-on-surface">{(equipmentList ?? []).find((e: Equipment) => e.id === op.equipmentId)?.name || "-"}</TableCell>
                        <TableCell className="py-3 px-6 text-on-surface">{op.plannedQuantity} {op.plannedUnit}</TableCell>
                        <TableCell className="py-3 px-6 text-on-surface">{op.plannedDate} {op.plannedStartTime}</TableCell>
                        <TableCell className="py-3 px-6 text-on-surface-variant">{op.plannedEndTime}</TableCell>
                        <TableCell className="py-3 px-6">
                          <Badge className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            op.status === "completed" ? "bg-green-100 text-green-800" :
                            op.status === "in_progress" ? "bg-amber-100 text-amber-800" :
                            op.status === "cancelled" ? "bg-red-100 text-red-800" :
                            "bg-primary-container text-on-primary-container"
                          )}>
                            {t[op.status as keyof typeof t] || op.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-6 text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(op)} className="h-8 w-8 text-on-surface-variant hover:text-primary hover:bg-surface-container-high" data-testid={`button-edit-${op.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <PlanningTabPanels
          lang={lang}
          t={t}
          filters={filters}
          isLoadingSchedule={isLoadingSchedule}
          scheduleData={scheduleData}
          equipmentList={equipmentList}
          productionPlans={productionPlans}
          loadingPlans={loadingPlans}
          productionFacts={productionFacts}
          loadingFacts={loadingFacts}
          mrpRuns={mrpRuns}
          runsLoading={runsLoading}
          mrpResults={mrpResults}
          purchaseRequisitions={purchaseRequisitions}
          products={products}
          onAddPlan={handleAddPlan}
          onEditPlan={handleEditPlan}
          onAddFact={handleAddFact}
          onShowRunDialog={() => setShowRunDialog(true)}
          onCalculate={(runId) => calculateMRPMutation.mutate(runId)}
          isCalculating={calculateMRPMutation.isPending}
          onViewResults={(run) => { setSelectedRun(run); setShowResults(true); }}
        />
      </Tabs>

      <OperationFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingOperation={!!editingOperation}
        form={form}
        onSubmit={onSubmit}
        isSaving={createMutation.isPending || updateMutation.isPending}
        papkaOrdersList={papkaOrdersList}
        equipmentList={equipmentList}
        lang={lang}
        t={t}
      />

      <PlanFormDialog
        open={openPlanDialog}
        onOpenChange={setOpenPlanDialog}
        editingPlan={!!editingPlan}
        planForm={planForm}
        onSubmit={(data) => savePlan.mutate(data)}
        isSaving={savePlan.isPending}
        workCenters={workCenters}
        lang={lang}
        t={t}
      />

      <FactFormDialog
        open={openFactDialog}
        onOpenChange={setOpenFactDialog}
        factForm={factForm}
        onSubmit={(data) => saveFact.mutate(data)}
        isSaving={saveFact.isPending}
        workCenters={workCenters}
        products={products}
        lang={lang}
        t={t}
      />

      <MRPRunDialog
        open={showRunDialog}
        onOpenChange={setShowRunDialog}
        runForm={runForm}
        onFormChange={(form) => setRunForm(prev => ({ ...prev, ...form }))}
        onCreateRun={handleCreateRun}
        isCreating={createRunMutation.isPending}
        lang={lang}
        t={t}
      />

      <MRPResultsDialog
        open={showResults}
        onOpenChange={setShowResults}
        selectedRun={selectedRun}
        results={selectedRun ? getRunResults(selectedRun.id).map(r => ({ result: r.result, material: r.material || undefined })) : []}
        t={t}
      />
    </div>
  );
}
