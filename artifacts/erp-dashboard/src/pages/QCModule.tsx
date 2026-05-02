import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Shield, FileCheck, Activity, Beaker, Thermometer, Package, Eye,
  BookOpen, Brain, Plus, Pencil, Trash2, CheckCircle, AlertTriangle,
  XCircle, RefreshCw, FlaskConical, Loader2, MessageSquareWarning,
  TriangleAlert, TrendingDown, Star, BarChart3,
} from "lucide-react";
import { apiRequest, queryClient, getAuthHeaders } from "@/lib/queryClient";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useUndoDelete } from "@/components/undo-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "@/lib/i18n";
import { ErrorState } from "@/components/ui/error-state";
import { QCCertificateGenerator } from "./qc/QCCertificateGenerator";
import { QCStandardsTab } from "./qc/QCStandardsTab";
import { QCReclamationsTab } from "./qc/QCReclamationsTab";
import { QCBraksTab } from "./qc/QCBraksTab";
import { QCSupplierQualityTab } from "./qc/QCSupplierQualityTab";
import { QCAITrendTab } from "./qc/QCAITrendTab";
import { QCSPCTab } from "./qc/QCSPCTab";
import { QCAIAnalysisTab } from "./qc/QCAIAnalysisTab";
import { QCParameterDialog } from "./qc/QCParameterDialog";

interface QcParameter {
  id: string;
  code: string;
  name: string;
  nameRu?: string;
  category: string;
  unit?: string;
  minValue?: number;
  maxValue?: number;
  warningMinValue?: number;
  warningMaxValue?: number;
  isRequired: boolean;
  sortOrder: number;
}

interface QcMaterialTest {
  id: string;
  orderId: string;
  materialCardId?: string;
  batchNumber?: string;
  testCategory: string;
  testResults: Array<{
    parameterId: string;
    value: number;
    status: "passed" | "warning" | "failed";
    notes?: string;
  }>;
  overallStatus: string;
  passedCount: number;
  failedCount: number;
  warningCount: number;
  aiAnalysis?: Record<string, unknown> | null;
  aiConfidenceScore?: number;
  testDate: string;
}

interface PapkaOrder {
  id: string;
  papkaNo: string;
  mijozNomi: string;
  mahsulotNomi: string;
  status: string;
}

interface MaterialCard {
  id: string;
  name: string;
  code: string;
  materialType?: string;
}

const testSchema = z.object({
  orderId: z.string().min(1, "Buyurtma tanlang"),
  materialCardId: z.string().optional(),
  batchNumber: z.string().optional(),
  testCategory: z.string().min(1, "Kategoriya tanlang")
});

const CATEGORY_TABS = [
  { value: "physical", label: "Fizik xususiyatlar", labelRu: "Физические свойства", icon: Thermometer },
  { value: "mechanical", label: "Mexanik mustahkamlik", labelRu: "Механическая прочность", icon: Activity },
  { value: "printability", label: "Chop etish sifati", labelRu: "Качество печати", icon: FileCheck },
  { value: "chemical", label: "Kimyoviy ko'rsatkichlar", labelRu: "Химические показатели", icon: Beaker },
  { value: "environmental", label: "Muhit chidamliligi", labelRu: "Устойчивость к среде", icon: Thermometer },
  { value: "logistics", label: "Logistika testlari", labelRu: "Логистические тесты", icon: Package },
  { value: "visual", label: "Vizual sifat", labelRu: "Визуальное качество", icon: Eye },
  { value: "standards", label: "Normalar", labelRu: "Стандарты", icon: BookOpen },
  { value: "ai_analysis", label: "AI Tahlili", labelRu: "AI Анализ", icon: Brain },
  { value: "reclamations", label: "Reklamatsiyalar", labelRu: "Рекламации", icon: MessageSquareWarning },
  { value: "braks", label: "Brak", labelRu: "Брак", icon: TriangleAlert },
  { value: "supplier_quality", label: "Supplier Sifati", labelRu: "Качество поставщика", icon: Star },
  { value: "certificate", label: "Sertifikat", labelRu: "Сертификат", icon: FileCheck },
  { value: "ai_trend", label: "AI Trendi", labelRu: "AI Тренд", icon: TrendingDown },
  { value: "spc", label: "SPC Nazorat", labelRu: "SPC Контроль", icon: BarChart3 },
];

const PARAMETER_TABS = CATEGORY_TABS.filter(t =>
  !["standards", "ai_analysis", "reclamations", "braks", "supplier_quality", "certificate", "ai_trend", "spc"].includes(t.value)
);

export default function QCModule() {
  const { toast } = useToast();
  const { t } = useTranslation('production');
  const { t: tCommon } = useTranslation('common');
  const [location] = useLocation();

  const getInitialTab = () => {
    if (location.includes("/qc/standards")) return "standards";
    if (location.includes("/qc/parameters")) return "physical";
    if (location.includes("/qc/tests")) return "physical";
    if (location.includes("/qc/ai-analysis")) return "ai_analysis";
    if (location.includes("/qc/reports")) return "standards";
    if (location.includes("/qc/settings")) return "standards";
    return "physical";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location]);

  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testValues, setTestValues] = useState<Record<string, number>>({});
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [selectedParameterId, setSelectedParameterId] = useState<string | null>(null);
  const [parameterDialogOpen, setParameterDialogOpen] = useState(false);
  const [editingParameter, setEditingParameter] = useState<QcParameter | null>(null);
  const [confirmDeleteParamId, setConfirmDeleteParamId] = useState<number | null>(null);
  const [parameterCategory, setParameterCategory] = useState<string>("physical");

  const { data: parametersData, isLoading: parametersLoading, isError, refetch } = useQuery<{
    grouped: Record<string, QcParameter[]>;
    categoryLabels: Record<string, { uz: string; ru: string }>;
  }>({
    queryKey: ["/api/qc/parameters/grouped"]
  });

  const { data: ordersData } = useQuery<PapkaOrder[]>({
    queryKey: ["/api/papka-orders"],
    queryFn: async () => {
      const res = await fetch("/api/papka-orders?limit=50", { credentials: "include", headers: getAuthHeaders() });
      if (!res.ok) return [];
      const d = await res.json();
      return Array.isArray(d) ? d : (d.items ?? d.data ?? d.orders ?? []);
    }
  });

  const { data: materialsData } = useQuery<MaterialCard[]>({
    queryKey: ["/api/materials/cards"],
    queryFn: async () => {
      const res = await fetch("/api/materials/cards", { credentials: "include", headers: getAuthHeaders() });
      if (!res.ok) return [];
      return res.json();
    }
  });

  const { data: testsData, isLoading: testsLoading } = useQuery<QcMaterialTest[]>({
    queryKey: ["/api/qc/tests/recent"],
    queryFn: async () => {
      const res = await fetch("/api/qc/tests/recent?limit=20", { credentials: "include", headers: getAuthHeaders() });
      if (!res.ok) return [];
      return res.json();
    }
  });

  const { data: controlChartsData } = useQuery<unknown[]>({
    queryKey: ["/api/qc/control-charts", selectedParameterId],
    queryFn: () => apiRequest("GET", `/api/qc/control-charts/${selectedParameterId}`).then(r => r.json()),
    enabled: !!selectedParameterId,
    staleTime: 5 * 60_000,
  });

  const testForm = useForm<z.infer<typeof testSchema>>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      orderId: "", materialCardId: "", batchNumber: "",
      testCategory: activeTab !== "standards" && activeTab !== "ai_analysis" ? activeTab : "physical"
    }
  });

  const createTestMutation = useMutation({
    mutationFn: async (data: z.infer<typeof testSchema> & { testResults: Array<{ parameterId: string; value: number; status: "passed" | "warning" | "failed" }> }) =>
      apiRequest<QcMaterialTest>("POST", "/api/qc/tests", data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/qc/tests"] });
      setTestDialogOpen(false);
      setTestValues({});
      testForm.reset();
      setSelectedTestId(data.id);
      toast({ title: tCommon('success'), description: tCommon('createdSuccessfully') });
    },
    onError: (error: Error) =>
      toast({ title: tCommon('error'), description: error.message, variant: "destructive" }),
  });

  const aiAnalyzeMutation = useMutation({
    mutationFn: async (testId: string) =>
      apiRequest<{ test: QcMaterialTest; analysis: Record<string, unknown> | null; confidenceScore: number }>("POST", `/api/qc/tests/${testId}/ai-analyze`, {}),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/qc/tests"] });
      toast({ title: tCommon('success'), description: `${data.analysis?.riskLevel || tCommon('unknown')}` });
    },
    onError: (error: Error) =>
      toast({ title: tCommon('error'), description: error.message, variant: "destructive" }),
  });

  const seedParametersMutation = useMutation({
    mutationFn: async () => apiRequest<{ success: boolean }>("POST", "/api/qc/seed-parameters", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qc/parameters/grouped"] });
      toast({ title: tCommon('success'), description: tCommon('savedSuccessfully') });
    },
    onError: (error: Error) =>
      toast({ title: tCommon('error'), description: error.message, variant: "destructive" }),
  });

  const deleteParameterMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/qc/parameters/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qc/parameters/grouped"] });
      toast({ title: tCommon('success'), description: tCommon('deletedSuccessfully') });
    },
    onError: (error: Error) =>
      toast({ title: tCommon('error'), description: error.message, variant: "destructive" }),
  });

  const openParameterDialog = (category: string, parameter?: QcParameter) => {
    setParameterCategory(category);
    setEditingParameter(parameter || null);
    setParameterDialogOpen(true);
  };

  const handleTestSubmit = (formData: z.infer<typeof testSchema>) => {
    const categoryParams = parameters[formData.testCategory] || [];
    const testResults = (Array.isArray(categoryParams) ? categoryParams : []).map(param => {
      const value = testValues[param.id] || 0;
      let status: "passed" | "warning" | "failed" = "passed";
      if (param.minValue !== undefined && value < param.minValue) status = "failed";
      else if (param.maxValue !== undefined && value > param.maxValue) status = "failed";
      else if (param.warningMinValue !== undefined && value < param.warningMinValue) status = "warning";
      else if (param.warningMaxValue !== undefined && value > param.warningMaxValue) status = "warning";
      return { parameterId: param.id, value, status };
    });
    createTestMutation.mutate({ ...formData, testResults });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passed":
        return <span className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold flex items-center w-fit"><CheckCircle className="w-3 h-3 mr-1" />{tCommon('approved')}</span>;
      case "conditional":
        return <span className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold flex items-center w-fit"><AlertTriangle className="w-3 h-3 mr-1" />{tCommon('warning')}</span>;
      case "failed":
        return <span className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold flex items-center w-fit"><XCircle className="w-3 h-3 mr-1" />{tCommon('rejected')}</span>;
      case "rework":
        return <span className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold flex items-center w-fit"><RefreshCw className="w-3 h-3 mr-1" />REWORK</span>;
      case "scrap":
        return <span className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold flex items-center w-fit"><Trash2 className="w-3 h-3 mr-1" />SCRAP</span>;
      default:
        return <span className="bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold w-fit">{tCommon('pending')}</span>;
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case "low": return <span className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold w-fit">{tCommon('low')}</span>;
      case "medium": return <span className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold w-fit">{tCommon('medium')}</span>;
      case "high": return <span className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold w-fit">{tCommon('high')}</span>;
      default: return <span className="bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold w-fit">{riskLevel}</span>;
    }
  };

  const getInputColor = (param: QcParameter, value: number | undefined) => {
    if (value === undefined || value === 0) return "";
    if (param.minValue !== undefined && value < param.minValue) return "border-red-500 bg-red-50 dark:bg-red-950/20";
    if (param.maxValue !== undefined && value > param.maxValue) return "border-red-500 bg-red-50 dark:bg-red-950/20";
    if (param.warningMinValue !== undefined && value < param.warningMinValue) return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20";
    if (param.warningMaxValue !== undefined && value > param.warningMaxValue) return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20";
    return "border-green-500 bg-green-50 dark:bg-green-950/20";
  };

  const parameters = parametersData?.grouped || {};
  const categoryLabels = parametersData?.categoryLabels || {};
  const orders = (ordersData || []) as PapkaOrder[];
  const materials = (materialsData || []) as MaterialCard[];
  const tests = (testsData || []) as QcMaterialTest[];

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="flex-1 overflow-auto bg-surface p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            Sifat <span className="font-bold text-primary">Nazorati</span>
          </h1>
          <p className="text-on-surface-variant">{t('qualityRate')}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => seedParametersMutation.mutate()}
            disabled={seedParametersMutation.isPending}
            data-testid="button-seed-parameters"
          >
            {seedParametersMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {tCommon('upload')}
          </Button>
          <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-new-test">
                <FlaskConical className="w-4 h-4 mr-2" />
                {tCommon('create')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('qualityControl')}</DialogTitle>
                <DialogDescription>{t('materials')}</DialogDescription>
              </DialogHeader>
              <Form {...testForm}>
                <form onSubmit={testForm.handleSubmit(handleTestSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={testForm.control} name="orderId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('orderNumber')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-order"><SelectValue placeholder={tCommon('select')} /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(Array.isArray(orders) ? orders : []).map(order => (
                              <SelectItem key={order.id} value={order.id}>
                                {order.papkaNo} - {order.mijozNomi}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={testForm.control} name="materialCardId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('materials')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-material"><SelectValue placeholder={tCommon('select')} /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(Array.isArray(materials) ? materials : []).map(mat => (
                              <SelectItem key={mat.id} value={mat.id}>{mat.code} - {mat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={testForm.control} name="batchNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('batchNumber')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="LOT-2024-001" data-testid="input-batch-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={testForm.control} name="testCategory" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tCommon('category')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category"><SelectValue placeholder={tCommon('select')} /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(Array.isArray(PARAMETER_TABS) ? PARAMETER_TABS : []).map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-medium">{t('specification')}</h4>
                    {(parameters[testForm.watch("testCategory")] || []).map(param => (
                      <div key={param.id} className="flex items-center gap-4 p-3 rounded-lg border">
                        <div className="flex-1">
                          <div className="font-medium">{param.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {param.nameRu}
                            {param.unit && <span className="ml-2">({param.unit})</span>}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Norma: {param.minValue ?? "-"} - {param.maxValue ?? "-"}
                            {param.isRequired && <Badge variant="secondary" className="ml-2 text-xs">{tCommon('required')}</Badge>}
                          </div>
                        </div>
                        <div className="w-32">
                          <Input
                            type="number"
                            step="0.01"
                            value={testValues[param.id] || ""}
                            onChange={(e) => setTestValues(prev => ({ ...prev, [param.id]: parseFloat(e.target.value) || 0 }))}
                            className={getInputColor(param, testValues[param.id])}
                            data-testid={`input-param-${param.code}`}
                          />
                        </div>
                      </div>
                    ))}
                    {(parameters[testForm.watch("testCategory")] || []).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">{tCommon('noData')}</div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createTestMutation.isPending} data-testid="button-submit-test">
                      {createTestMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      {tCommon('save')}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <ScrollArea className="w-full whitespace-nowrap">
          <TabsList className="inline-flex h-auto p-1 gap-1">
            {(Array.isArray(CATEGORY_TABS) ? CATEGORY_TABS : []).map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2 px-3 py-2"
                data-testid={`tab-${tab.value}`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>

        {(Array.isArray(PARAMETER_TABS) ? PARAMETER_TABS : []).map(tab => (
          <TabsContent key={tab.value} value={tab.value} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="bg-surface-container-lowest rounded-lg border-none shadow-none">
                  <div className="p-6 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 font-semibold text-lg text-on-surface">
                        <tab.icon className="w-5 h-5 text-primary" />
                        {tab.label}
                      </div>
                      <p className="text-sm text-on-surface-variant">{tab.labelRu}</p>
                    </div>
                    <Button
                      className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold"
                      onClick={() => openParameterDialog(tab.value)}
                      data-testid={`button-add-parameter-${tab.value}`}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {tCommon('add')}
                    </Button>
                  </div>
                  <div className="px-6 pb-6">
                    {parametersLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : (parameters[tab.value] || []).length === 0 ? (
                      <div className="text-center py-8 text-on-surface-variant">{tCommon('noData')}</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-surface-container hover:bg-surface-container border-none">
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{tCommon('code')}</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{tCommon('name')}</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{tCommon('unit')}</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{tCommon('minimum')}</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{tCommon('maximum')}</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{tCommon('required')}</TableHead>
                            <TableHead className="w-24 text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{tCommon('actions')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(parameters[tab.value] || []).map(param => (
                            <TableRow key={param.id} className="hover:bg-surface-container-low transition-colors border-none" data-testid={`row-param-${param.id}`}>
                              <TableCell className="py-3 px-6 font-mono text-xs">{param.code}</TableCell>
                              <TableCell className="py-3 px-6">
                                <div className="font-medium text-on-surface">{param.name}</div>
                                {param.nameRu && <div className="text-xs text-on-surface-variant">{param.nameRu}</div>}
                              </TableCell>
                              <TableCell className="py-3 px-6 text-on-surface-variant">{param.unit || "-"}</TableCell>
                              <TableCell className="py-3 px-6 text-on-surface">{param.minValue ?? "-"}</TableCell>
                              <TableCell className="py-3 px-6 text-on-surface">{param.maxValue ?? "-"}</TableCell>
                              <TableCell className="py-3 px-6">
                                {param.isRequired ? (
                                  <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">{tCommon('yes')}</Badge>
                                ) : (
                                  <Badge className="bg-surface-container text-on-surface rounded-full px-2.5 py-0.5 text-xs font-semibold">{tCommon('no')}</Badge>
                                )}
                              </TableCell>
                              <TableCell className="py-3 px-6">
                                <div className="flex gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button size="icon" variant="ghost" aria-label={tCommon('edit')}
                                        onClick={() => openParameterDialog(tab.value, param)}
                                        className="h-8 w-8 text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
                                        data-testid={`button-edit-param-${param.id}`}>
                                        <Pencil className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{tCommon('edit')}</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button size="icon" variant="ghost" aria-label="Nazorat grafigi"
                                        onClick={() => setSelectedParameterId(prev => prev === param.id ? null : param.id)}
                                        className={`h-8 w-8 hover:bg-surface-container-high ${selectedParameterId === param.id ? "text-primary" : "text-on-surface-variant"}`}
                                        data-testid={`button-control-chart-${param.id}`}>
                                        <BarChart3 className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Nazorat grafigi</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button size="icon" variant="ghost" aria-label={tCommon('delete')}
                                        onClick={() => setConfirmDeleteParamId(param.id)}
                                        className="h-8 w-8 text-on-surface-variant hover:text-red-600 hover:bg-red-50"
                                        data-testid={`button-delete-param-${param.id}`}>
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{tCommon('delete')}</TooltipContent>
                                  </Tooltip>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </Card>
              </div>

              <div className="space-y-4">
                {selectedParameterId && (
                  <Card className="bg-surface-container-lowest rounded-lg border-none shadow-none">
                    <div className="p-4 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-on-surface">Nazorat grafigi</span>
                      <span className="ml-auto text-xs text-on-surface-variant">
                        {Array.isArray(controlChartsData) ? `${controlChartsData.length} nuqta` : "Yuklanmoqda..."}
                      </span>
                    </div>
                  </Card>
                )}
                <Card className="bg-surface-container-lowest rounded-lg border-none shadow-none">
                  <div className="p-6 pb-2">
                    <div className="font-semibold text-lg text-on-surface">{t('qualityControl')}</div>
                  </div>
                  <div className="px-6 pb-6">
                    {testsLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      </div>
                    ) : (Array.isArray(tests) ? tests : []).filter(t => t.testCategory === tab.value).length === 0 ? (
                      <div className="text-center py-4 text-on-surface-variant text-sm">{tCommon('noData')}</div>
                    ) : (
                      <div className="space-y-3">
                        {(Array.isArray(tests) ? tests : []).filter(t => t.testCategory === tab.value).slice(0, 5).map(test => (
                          <div
                            key={test.id}
                            className="p-3 rounded-lg border border-outline-variant hover:bg-surface-container-low transition-colors cursor-pointer"
                            onClick={() => setSelectedTestId(test.id)}
                            data-testid={`test-card-${test.id}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm text-on-surface">{test.batchNumber || "N/A"}</span>
                              {getStatusBadge(test.overallStatus)}
                            </div>
                            <div className="flex gap-2 text-xs">
                              <span className="text-green-600 font-semibold">✓ {test.passedCount}</span>
                              <span className="text-amber-600 font-semibold">⚠ {test.warningCount}</span>
                              <span className="text-red-600 font-semibold">✗ {test.failedCount}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>

                {selectedTestId && (
                  <Card className="bg-surface-container-lowest rounded-lg border-none shadow-none">
                    <div className="p-6 pb-2 flex items-center justify-between">
                      <span className="font-semibold text-lg text-on-surface">{t('qualityControl')}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-surface-container text-on-surface hover:bg-surface-container-high"
                        onClick={() => aiAnalyzeMutation.mutate(selectedTestId)}
                        disabled={aiAnalyzeMutation.isPending}
                        data-testid="button-ai-analyze"
                      >
                        {aiAnalyzeMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                          <Brain className="w-4 h-4 text-primary" />
                        )}
                      </Button>
                    </div>
                    <div className="px-6 pb-6">
                      {(tests ?? []).find(t => t.id === selectedTestId)?.aiAnalysis ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-on-surface">
                            <span className="text-sm">{tCommon('priority')}:</span>
                            {getRiskBadge(String(((Array.isArray(tests) ? tests : []).find(t => t.id === selectedTestId)?.aiAnalysis as Record<string, unknown>)?.riskLevel || ""))}
                          </div>
                          <div>
                            <span className="text-sm font-medium text-on-surface">{tCommon('notes')}:</span>
                            <ul className="text-sm text-on-surface-variant mt-1 list-disc list-inside">
                              {(((tests ?? []).find(t => t.id === selectedTestId)?.aiAnalysis as Record<string, string[]> | null)?.recommendations || []).map((rec: string, i: number) => (
                                <li key={`k-${i}`}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-on-surface-variant text-sm">{tCommon('noData')}</div>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        ))}

        <TabsContent value="standards" className="space-y-4">
          <QCStandardsTab />
        </TabsContent>

        <TabsContent value="ai_analysis" className="space-y-4">
          <QCAIAnalysisTab />
        </TabsContent>

        <TabsContent value="reclamations" className="space-y-4">
          <QCReclamationsTab />
        </TabsContent>

        <TabsContent value="braks" className="space-y-4">
          <QCBraksTab />
        </TabsContent>

        <TabsContent value="supplier_quality" className="space-y-4">
          <QCSupplierQualityTab />
        </TabsContent>

        <TabsContent value="certificate" className="space-y-4">
          <QCCertificateGenerator />
        </TabsContent>

        <TabsContent value="ai_trend" className="space-y-4">
          <QCAITrendTab />
        </TabsContent>

        <TabsContent value="spc" className="space-y-4">
          <QCSPCTab />
        </TabsContent>
      </Tabs>

      <QCParameterDialog
        open={parameterDialogOpen}
        onClose={() => {
          setParameterDialogOpen(false);
          setEditingParameter(null);
        }}
        category={parameterCategory}
        editingParameter={editingParameter}
      />

      <ConfirmDialog
        open={confirmDeleteParamId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteParamId(null); }}
        title="Parametrni o'chirish"
        description="Ushbu sifat parametrini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => { if (confirmDeleteParamId !== null) deleteParameterMutation.mutate(confirmDeleteParamId); }}
      />
    </div>
  );
}
