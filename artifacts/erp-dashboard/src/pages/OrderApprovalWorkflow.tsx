import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  FileCheck,
  Shield,
  DollarSign,
  Loader2,
  Package,
  Eye,
  Wrench,
  Send,
  Filter,
  History,
  BarChart3
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDate } from "@/lib/format";

interface PapkaOrder {
  id: string;
  papkaNo: string;
  mijozNomi: string;
  mahsulotNomi: string;
  tiraj: number;
  status: string;
  tayyorBolishSanasi?: string;
  createdAt: string;
  totalPrice?: number;
}

interface ApprovalItem {
  id: string;
  orderId: string;
  stage: string;
  status: string;
  approvedBy?: string;
  approvedAt?: string;
  comments?: string;
  rejectionReason?: string;
  stageLabel: { uz: string; ru: string };
  order: PapkaOrder;
  approverName?: string;
}

interface StageStats {
  stage: string;
  label: { uz: string; ru: string };
  pending: number;
  approved: number;
  rejected: number;
  approvedToday: number;
}

interface DashboardData {
  stageStats: StageStats[];
  totals: { pending: number; approved: number; rejected: number; approvedToday: number };
}

interface WorkflowData {
  order: PapkaOrder;
  workflow: Array<{
    stage: string;
    label: { uz: string; ru: string };
    approval: { id: string; status: string; approvedAt?: string; comments?: string; rejectionReason?: string } | null;
    approver: { fullName: string } | null;
  }>;
  currentStage: string;
}

const STAGES = [
  { id: "design", icon: FileCheck, color: "text-blue-500", bg: "bg-blue-500" },
  { id: "technical", icon: Wrench, color: "text-orange-500", bg: "bg-orange-500" },
  { id: "qc", icon: Shield, color: "text-purple-500", bg: "bg-purple-500" },
  { id: "finance", icon: DollarSign, color: "text-green-500", bg: "bg-green-500" },
];

const approvalSchema = z.object({
  comments: z.string().optional(),
  designFileUrl: z.string().optional(),
  designVersion: z.string().optional(),
  bomApproved: z.boolean().optional(),
  routingApproved: z.boolean().optional(),
  techCardApproved: z.boolean().optional(),
  qcTestId: z.string().optional(),
  materialApproved: z.boolean().optional(),
  advancePercentage: z.number().min(0).max(100).optional(),
  advanceAmount: z.number().min(0).optional(),
  creditLimitOk: z.boolean().optional(),
  debtStatusOk: z.boolean().optional(),
});

const rejectionSchema = z.object({
  rejectionReason: z.string().min(1, "Rad etish sababi majburiy / Причина отказа обязательна"),
  comments: z.string().optional(),
});

export default function OrderApprovalWorkflow() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [filterStage, setFilterStage] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalItem, setApprovalItem] = useState<ApprovalItem | null>(null);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionItem, setRejectionItem] = useState<ApprovalItem | null>(null);

  const approvalForm = useForm({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      comments: "",
      designFileUrl: "",
      designVersion: "1.0",
      bomApproved: false,
      routingApproved: false,
      techCardApproved: false,
      qcTestId: "",
      materialApproved: false,
      advancePercentage: 50,
      advanceAmount: 0,
      creditLimitOk: false,
      debtStatusOk: false,
    },
  });

  const rejectionForm = useForm({
    resolver: zodResolver(rejectionSchema),
    defaultValues: { rejectionReason: "", comments: "" },
  });

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<DashboardData>({
    queryKey: ["/api/approval-workflow/dashboard"],
  });

  const pendingQueryKey = filterStage === "all"
    ? ["/api/approval-workflow/pending"]
    : ["/api/approval-workflow/pending", `?stage=${filterStage}`];

  const { data: pendingApprovals = [], isLoading: pendingLoading } = useQuery<ApprovalItem[]>({
    queryKey: ["/api/approval-workflow/pending", filterStage],
    queryFn: async () => {
      const url = filterStage === "all"
        ? "/api/approval-workflow/pending"
        : `/api/approval-workflow/pending?stage=${filterStage}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: historyData = [], isLoading: historyLoading } = useQuery<ApprovalItem[]>({
    queryKey: ["/api/approval-workflow/history", filterStage, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStage !== "all") params.set("stage", filterStage);
      if (filterStatus !== "all") params.set("status", filterStatus);
      const res = await fetch(`/api/approval-workflow/history?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: activeTab === "history",
  });

  const { data: workflowData, isLoading: workflowLoading } = useQuery<WorkflowData>({
    queryKey: ["/api/approval-workflow/order", selectedOrderId],
    enabled: !!selectedOrderId,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ approvalId, data }: { approvalId: string; data: z.infer<typeof approvalSchema> }) => {
      return apiRequest<{ message: string }>("POST", `/api/approval-workflow/approve/${approvalId}`, data);
    },
    onSuccess: (data) => {
      toast({ title: "Muvaffaqiyatli / Успешно", description: String(data.message) });
      setApprovalDialogOpen(false);
      approvalForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/approval-workflow"] });
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik / Ошибка", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ approvalId, data }: { approvalId: string; data: z.infer<typeof rejectionSchema> }) => {
      return apiRequest<{ message: string }>("POST", `/api/approval-workflow/reject/${approvalId}`, data);
    },
    onSuccess: (data) => {
      toast({ title: "Muvaffaqiyatli / Успешно", description: String(data.message) });
      setRejectionDialogOpen(false);
      rejectionForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/approval-workflow"] });
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik / Ошибка", description: error.message, variant: "destructive" });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return apiRequest<{ message: string }>("POST", "/api/approval-workflow/submit", { orderId });
    },
    onSuccess: (data) => {
      toast({ title: "Muvaffaqiyatli / Успешно", description: String(data.message) });
      queryClient.invalidateQueries({ queryKey: ["/api/approval-workflow"] });
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik / Ошибка", description: error.message, variant: "destructive" });
    },
  });


  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" data-testid={`badge-status-${status}`}><Clock className="w-3 h-3 mr-1" />Kutilmoqda / Ожидание</Badge>;
      case "approved":
        return <Badge data-testid={`badge-status-${status}`}><CheckCircle2 className="w-3 h-3 mr-1" />Tasdiqlangan / Одобрено</Badge>;
      case "rejected":
        return <Badge variant="destructive" data-testid={`badge-status-${status}`}><XCircle className="w-3 h-3 mr-1" />Rad etilgan / Отклонено</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleApprove = (item: ApprovalItem) => {
    setApprovalItem(item);
    approvalForm.reset();
    setApprovalDialogOpen(true);
  };

  const handleReject = (item: ApprovalItem) => {
    setRejectionItem(item);
    rejectionForm.reset();
    setRejectionDialogOpen(true);
  };

  const onApprovalSubmit = (data: z.infer<typeof approvalSchema>) => {
    if (!approvalItem) return;
    approveMutation.mutate({ approvalId: approvalItem.id, data });
  };

  const onRejectionSubmit = (data: z.infer<typeof rejectionSchema>) => {
    if (!rejectionItem) return;
    rejectMutation.mutate({ approvalId: rejectionItem.id, data });
  };

  const renderPipeline = () => {
    if (!dashboardData) return null;
    return (
      <div className="flex items-center justify-between overflow-x-auto py-4" data-testid="workflow-pipeline">
        {(Array.isArray(STAGES) ? STAGES : []).map((stage, index) => {
          const stats = dashboardData.stageStats?.find((s) => s.stage === stage.id);
          const Icon = stage.icon;
          return (
            <div key={stage.id} className="flex items-center">
              <div
                className="flex flex-col items-center min-w-[140px] cursor-pointer"
                onClick={() => { setFilterStage(stage.id); setActiveTab("pending"); }}
                data-testid={`pipeline-stage-${stage.id}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stage.bg} text-white`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium mt-2">{stats?.label?.uz || stage.id}</span>
                <span className="text-xs text-muted-foreground">{stats?.label?.ru || ""}</span>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">{stats?.pending || 0}</Badge>
                  <Badge className="text-xs">{stats?.approved || 0}</Badge>
                  <Badge variant="destructive" className="text-xs">{stats?.rejected || 0}</Badge>
                </div>
              </div>
              {index < STAGES.length - 1 && (
                <ArrowRight className="w-6 h-6 mx-2 flex-shrink-0 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderStageFields = (stage: string) => {
    switch (stage) {
      case "design":
        return (
          <>
            <FormField control={approvalForm.control} name="designFileUrl" render={({ field }) => (
              <FormItem>
                <FormLabel>Dizayn fayli URL / Ссылка на файл дизайна</FormLabel>
                <FormControl><Input placeholder="https://..." {...field} data-testid="input-design-url" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={approvalForm.control} name="designVersion" render={({ field }) => (
              <FormItem>
                <FormLabel>Versiya / Версия</FormLabel>
                <FormControl><Input placeholder="1.0" {...field} data-testid="input-design-version" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </>
        );
      case "technical":
        return (
          <>
            <FormField control={approvalForm.control} name="bomApproved" render={({ field }) => (
              <FormItem className="flex items-center gap-3 space-y-0">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-bom" /></FormControl>
                <FormLabel>BOM tasdiqlandi / BOM утверждён</FormLabel>
              </FormItem>
            )} />
            <FormField control={approvalForm.control} name="routingApproved" render={({ field }) => (
              <FormItem className="flex items-center gap-3 space-y-0">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-routing" /></FormControl>
                <FormLabel>Marshrutlash tasdiqlandi / Маршрутизация утверждена</FormLabel>
              </FormItem>
            )} />
            <FormField control={approvalForm.control} name="techCardApproved" render={({ field }) => (
              <FormItem className="flex items-center gap-3 space-y-0">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-techcard" /></FormControl>
                <FormLabel>Texnologik karta tasdiqlandi / Тех. карта утверждена</FormLabel>
              </FormItem>
            )} />
          </>
        );
      case "qc":
        return (
          <>
            <FormField control={approvalForm.control} name="qcTestId" render={({ field }) => (
              <FormItem>
                <FormLabel>QC Test ID (ixtiyoriy / необязательно)</FormLabel>
                <FormControl><Input placeholder="Test ID..." {...field} data-testid="input-qc-test-id" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={approvalForm.control} name="materialApproved" render={({ field }) => (
              <FormItem className="flex items-center gap-3 space-y-0">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-material" /></FormControl>
                <FormLabel>Material sifati tasdiqlandi / Качество материала утверждено</FormLabel>
              </FormItem>
            )} />
          </>
        );
      case "finance":
        return (
          <>
            <FormField control={approvalForm.control} name="advancePercentage" render={({ field }) => (
              <FormItem>
                <FormLabel>Oldindan to'lov % / Предоплата %</FormLabel>
                <FormControl><Input type="number" min={0} max={100} {...field} onChange={(e) => field.onChange(Number(e.target.value))} data-testid="input-advance-pct" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={approvalForm.control} name="advanceAmount" render={({ field }) => (
              <FormItem>
                <FormLabel>Oldindan to'lov summasi / Сумма предоплаты</FormLabel>
                <FormControl><Input type="number" min={0} {...field} onChange={(e) => field.onChange(Number(e.target.value))} data-testid="input-advance-amount" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={approvalForm.control} name="creditLimitOk" render={({ field }) => (
              <FormItem className="flex items-center gap-3 space-y-0">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-credit" /></FormControl>
                <FormLabel>Kredit limiti OK / Кредитный лимит OK</FormLabel>
              </FormItem>
            )} />
            <FormField control={approvalForm.control} name="debtStatusOk" render={({ field }) => (
              <FormItem className="flex items-center gap-3 space-y-0">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-debt" /></FormControl>
                <FormLabel>Qarz holati OK / Статус задолженности OK</FormLabel>
              </FormItem>
            )} />
          </>
        );
      default:
        return null;
    }
  };

  const renderDashboard = () => {
    if (dashboardLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Yuklanmoqda... / Загрузка...</span>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-pipeline-title">Tasdiqlash bosqichlari / Этапы утверждения</CardTitle>
            <CardDescription>Dizayn → Texnolog → Sifat nazorati → Moliya / Дизайн → Технолог → Контроль качества → Финансы</CardDescription>
          </CardHeader>
          <CardContent>
            {renderPipeline()}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kutilmoqda / Ожидание</CardTitle>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-pending">{dashboardData?.totals?.pending || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasdiqlangan / Одобрено</CardTitle>
              <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-approved">{dashboardData?.totals?.approved || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rad etilgan / Отклонено</CardTitle>
              <XCircle className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-rejected">{dashboardData?.totals?.rejected || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bugun tasdiqlangan / Одобрено сегодня</CardTitle>
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-today">{dashboardData?.totals?.approvedToday || 0}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderPendingTable = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterStage} onValueChange={setFilterStage}>
            <SelectTrigger className="w-[200px]" data-testid="select-filter-stage">
              <SelectValue placeholder="Bosqich tanlang / Выберите этап" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha bosqichlar / Все этапы</SelectItem>
              <SelectItem value="design">Dizayn / Дизайн</SelectItem>
              <SelectItem value="technical">Texnolog / Технолог</SelectItem>
              <SelectItem value="qc">Sifat nazorati / КК</SelectItem>
              <SelectItem value="finance">Moliya / Финансы</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {pendingLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : pendingApprovals.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground" data-testid="empty-state-pending">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Kutilayotgan tasdiqlar yo'q / Нет ожидающих утверждений</p>
          </div>
        ) : (
          <Table data-testid="table-pending-approvals">
            <TableHeader>
              <TableRow>
                <TableHead>Papka №</TableHead>
                <TableHead>Mijoz / Клиент</TableHead>
                <TableHead>Mahsulot / Продукт</TableHead>
                <TableHead>Tiraj / Тираж</TableHead>
                <TableHead>Bosqich / Этап</TableHead>
                <TableHead>Sana / Дата</TableHead>
                <TableHead className="text-right">Harakatlar / Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(pendingApprovals) ? pendingApprovals : []).map((item) => (
                <TableRow key={item.id} data-testid={`row-approval-${item.id}`}>
                  <TableCell className="font-medium">{item.order.papkaNo}</TableCell>
                  <TableCell>{item.order.mijozNomi}</TableCell>
                  <TableCell>{item.order.mahsulotNomi}</TableCell>
                  <TableCell>{item.order.tiraj?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" data-testid={`badge-stage-${item.stage}`}>
                      {item.stageLabel?.uz || item.stage}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(item.order.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(item)}
                        data-testid={`button-approve-${item.id}`}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Tasdiqlash
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(item)}
                        data-testid={`button-reject-${item.id}`}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Rad etish
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setSelectedOrderId(item.orderId)}
                        data-testid={`button-view-${item.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    );
  };

  const renderHistory = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterStage} onValueChange={setFilterStage}>
            <SelectTrigger className="w-[200px]" data-testid="select-history-stage">
              <SelectValue placeholder="Bosqich / Этап" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi / Все</SelectItem>
              <SelectItem value="design">Dizayn / Дизайн</SelectItem>
              <SelectItem value="technical">Texnolog / Технолог</SelectItem>
              <SelectItem value="qc">Sifat nazorati / КК</SelectItem>
              <SelectItem value="finance">Moliya / Финансы</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[200px]" data-testid="select-history-status">
              <SelectValue placeholder="Holat / Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi / Все</SelectItem>
              <SelectItem value="pending">Kutilmoqda / Ожидание</SelectItem>
              <SelectItem value="approved">Tasdiqlangan / Одобрено</SelectItem>
              <SelectItem value="rejected">Rad etilgan / Отклонено</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {historyLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : historyData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground" data-testid="empty-state-history">
            <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Tarix mavjud emas / Нет истории</p>
          </div>
        ) : (
          <Table data-testid="table-approval-history">
            <TableHeader>
              <TableRow>
                <TableHead>Papka №</TableHead>
                <TableHead>Mijoz / Клиент</TableHead>
                <TableHead>Bosqich / Этап</TableHead>
                <TableHead>Holat / Статус</TableHead>
                <TableHead>Tasdiqlagan / Утвердил</TableHead>
                <TableHead>Sana / Дата</TableHead>
                <TableHead>Izoh / Комментарий</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(historyData) ? historyData : []).map((item) => (
                <TableRow key={item.id} data-testid={`row-history-${item.id}`}>
                  <TableCell className="font-medium">{item.order?.papkaNo}</TableCell>
                  <TableCell>{item.order?.mijozNomi}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.stageLabel?.uz || item.stage}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>{item.approverName || "-"}</TableCell>
                  <TableCell>{item.approvedAt ? formatDate(item.approvedAt) : "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{item.comments || item.rejectionReason || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    );
  };

  const renderOrderDetail = () => {
    if (!selectedOrderId) return null;

    return (
      <Dialog open={!!selectedOrderId} onOpenChange={(open) => { if (!open) setSelectedOrderId(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Buyurtma tafsilotlari / Детали заказа</DialogTitle>
          </DialogHeader>
          {workflowLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : workflowData ? (
            <div className="space-y-6" data-testid="order-details-panel">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Papka №:</span>
                  <span className="ml-2 font-medium" data-testid="text-detail-papka">{workflowData.order.papkaNo}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Mijoz / Клиент:</span>
                  <span className="ml-2 font-medium">{workflowData.order.mijozNomi}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Mahsulot / Продукт:</span>
                  <span className="ml-2 font-medium">{workflowData.order.mahsulotNomi}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tiraj / Тираж:</span>
                  <span className="ml-2 font-medium">{workflowData.order.tiraj?.toLocaleString()}</span>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-4">Tasdiqlash jarayoni / Процесс утверждения</h4>
                <div className="space-y-3">
                  {(Array.isArray(workflowData.workflow) ? workflowData.workflow : []).map((item) => (
                    <div
                      key={item.stage}
                      className={`flex items-start gap-4 p-3 rounded-md ${!item.approval ? "opacity-50 bg-muted/30" : item.approval.status === "approved" ? "bg-green-500/5" : item.approval.status === "rejected" ? "bg-red-500/5" : "bg-muted/30"}`}
                      data-testid={`detail-stage-${item.stage}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${item.approval?.status === "approved" ? "bg-green-500 text-white" : item.approval?.status === "rejected" ? "bg-red-500 text-white" : "bg-muted text-muted-foreground"}`}>
                        {item.approval?.status === "approved" ? <CheckCircle2 className="w-4 h-4" /> : item.approval?.status === "rejected" ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{item.label.uz}</span>
                          <span className="text-muted-foreground text-sm">/ {item.label.ru}</span>
                          {item.approval && getStatusBadge(item.approval.status)}
                        </div>
                        {item.approver && (
                          <p className="text-sm text-muted-foreground mt-1">{item.approver.fullName}</p>
                        )}
                        {item.approval?.approvedAt && (
                          <p className="text-xs text-muted-foreground">{formatDate(item.approval.approvedAt)}</p>
                        )}
                        {item.approval?.comments && (
                          <p className="text-sm mt-1 italic text-muted-foreground">"{item.approval.comments}"</p>
                        )}
                        {item.approval?.rejectionReason && (
                          <p className="text-sm mt-1 text-destructive">Sabab / Причина: {item.approval.rejectionReason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Ma'lumot topilmadi / Данные не найдены</p>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Buyurtma tasdiqlash jarayoni</h1>
          <p className="text-muted-foreground">Процесс утверждения заказов</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">
            <BarChart3 className="w-4 h-4 mr-1" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            <Clock className="w-4 h-4 mr-1" />
            Kutilmoqda / Ожидание
            {dashboardData && dashboardData.totals.pending > 0 && (
              <Badge variant="secondary" className="ml-2">{dashboardData.totals.pending}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            <History className="w-4 h-4 mr-1" />
            Tarix / История
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          {renderDashboard()}
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Kutilayotgan tasdiqlar / Ожидающие утверждения</CardTitle>
              <CardDescription>Tasdiqlash yoki rad etish kerak bo'lgan buyurtmalar / Заказы, требующие утверждения или отклонения</CardDescription>
            </CardHeader>
            <CardContent>
              {renderPendingTable()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tasdiqlash tarixi / История утверждений</CardTitle>
              <CardDescription>Barcha tasdiqlash va rad etishlar tarixi / Полная история утверждений и отклонений</CardDescription>
            </CardHeader>
            <CardContent>
              {renderHistory()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Tasdiqlash / Утверждение - {approvalItem?.stageLabel?.uz || approvalItem?.stage}
            </DialogTitle>
            <DialogDescription>
              {approvalItem?.order?.papkaNo} - {approvalItem?.order?.mijozNomi}
            </DialogDescription>
          </DialogHeader>
          <Form {...approvalForm}>
            <form onSubmit={approvalForm.handleSubmit(onApprovalSubmit)} className="space-y-4">
              {approvalItem && renderStageFields(approvalItem.stage)}
              <FormField control={approvalForm.control} name="comments" render={({ field }) => (
                <FormItem>
                  <FormLabel>Izohlar / Комментарии</FormLabel>
                  <FormControl><Textarea placeholder="Qo'shimcha izohlar... / Дополнительные комментарии..." {...field} data-testid="input-approval-comments" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setApprovalDialogOpen(false)} data-testid="button-cancel-approval">
                  Bekor qilish / Отмена
                </Button>
                <Button type="submit" disabled={approveMutation.isPending} data-testid="button-confirm-approval">
                  {approveMutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Tasdiqlash / Утвердить
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Rad etish / Отклонение - {rejectionItem?.stageLabel?.uz || rejectionItem?.stage}</DialogTitle>
            <DialogDescription>
              {rejectionItem?.order?.papkaNo} - {rejectionItem?.order?.mijozNomi}
            </DialogDescription>
          </DialogHeader>
          <Form {...rejectionForm}>
            <form onSubmit={rejectionForm.handleSubmit(onRejectionSubmit)} className="space-y-4">
              <FormField control={rejectionForm.control} name="rejectionReason" render={({ field }) => (
                <FormItem>
                  <FormLabel>Rad etish sababi / Причина отклонения *</FormLabel>
                  <FormControl><Textarea placeholder="Sababni kiriting... / Укажите причину..." {...field} data-testid="input-rejection-reason" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={rejectionForm.control} name="comments" render={({ field }) => (
                <FormItem>
                  <FormLabel>Qo'shimcha izoh / Дополнительный комментарий</FormLabel>
                  <FormControl><Textarea placeholder="Izohlar... / Комментарии..." {...field} data-testid="input-rejection-comments" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setRejectionDialogOpen(false)} data-testid="button-cancel-rejection">
                  Bekor qilish / Отмена
                </Button>
                <Button type="submit" variant="destructive" disabled={rejectMutation.isPending} data-testid="button-confirm-rejection">
                  {rejectMutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  <XCircle className="w-4 h-4 mr-1" />
                  Rad etish / Отклонить
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {renderOrderDetail()}
    </div>
  );
}
