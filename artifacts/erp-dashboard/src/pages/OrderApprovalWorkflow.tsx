/**
 * @module OrderApprovalWorkflow
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, BarChart3, History } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useTranslation } from '@/lib/i18n';
import {
  ApprovalItem, DashboardData, WorkflowData,
  approvalSchema, rejectionSchema, ApprovalFormValues, RejectionFormValues,
} from "./OrderApprovalWorkflowTypes";
import {
  WorkflowPipeline, DashboardStatCards, PendingApprovalsPanel, HistoryPanel,
  OrderDetailDialog, ApprovalDialog, RejectionDialog,
} from "./OrderApprovalWorkflowSections";
import { EPStatusPill, EPLoader } from "@/components/ep";

export default function OrderApprovalWorkflow() {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [filterStage, setFilterStage] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalItem, setApprovalItem] = useState<ApprovalItem | null>(null);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionItem, setRejectionItem] = useState<ApprovalItem | null>(null);

  const approvalForm = useForm<ApprovalFormValues>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      comments: "", designFileUrl: "", designVersion: "1.0",
      bomApproved: false, routingApproved: false, techCardApproved: false,
      qcTestId: "", materialApproved: false,
      advancePercentage: 50, advanceAmount: 0,
      creditLimitOk: false, debtStatusOk: false,
    },
  });

  const rejectionForm = useForm<RejectionFormValues>({
    resolver: zodResolver(rejectionSchema),
    defaultValues: { rejectionReason: "", comments: "" },
  });

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<DashboardData>({
    queryKey: ["/api/approval-workflow/dashboard"],
  });

  const { data: pendingApprovals = [], isLoading: pendingLoading } = useQuery<ApprovalItem[]>({
    queryKey: ["/api/approval-workflow/pending", filterStage],
    queryFn: async () => {
      const url = filterStage === "all" ? "/api/approval-workflow/pending" : `/api/approval-workflow/pending?stage=${filterStage}`;
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
      const res = await apiRequest('GET', `/api/approval-workflow/history?${params}`);
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
    mutationFn: async ({ approvalId, data }: { approvalId: string; data: z.infer<typeof approvalSchema> }) =>
      apiRequest<{ message: string }>("POST", `/api/approval-workflow/approve/${approvalId}`, data),
    onSuccess: (data) => {
      toast({ title: "Muvaffaqiyatli / Успешно", description: String(data.message) });
      setApprovalDialogOpen(false);
      approvalForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/approval-workflow"] });
    },
    onError: (error: Error) => toast({ title: "Xatolik / Ошибка", description: error.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ approvalId, data }: { approvalId: string; data: z.infer<typeof rejectionSchema> }) =>
      apiRequest<{ message: string }>("POST", `/api/approval-workflow/reject/${approvalId}`, data),
    onSuccess: (data) => {
      toast({ title: "Muvaffaqiyatli / Успешно", description: String(data.message) });
      setRejectionDialogOpen(false);
      rejectionForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/approval-workflow"] });
    },
    onError: (error: Error) => toast({ title: "Xatolik / Ошибка", description: error.message, variant: "destructive" }),
  });

  const submitMutation = useMutation({
    mutationFn: async (orderId: string) =>
      apiRequest<{ message: string }>("POST", "/api/approval-workflow/submit", { orderId }),
    onSuccess: (data) => {
      toast({ title: "Muvaffaqiyatli / Успешно", description: String(data.message) });
      queryClient.invalidateQueries({ queryKey: ["/api/approval-workflow"] });
    },
    onError: (error: Error) => toast({ title: "Xatolik / Ошибка", description: error.message, variant: "destructive" }),
  });

  const handleApprove = (item: ApprovalItem) => { setApprovalItem(item); approvalForm.reset(); setApprovalDialogOpen(true); };
  const handleReject = (item: ApprovalItem) => { setRejectionItem(item); rejectionForm.reset(); setRejectionDialogOpen(true); };
  const onApprovalSubmit = (data: ApprovalFormValues) => { if (approvalItem) approveMutation.mutate({ approvalId: approvalItem.id, data }); };
  const onRejectionSubmit = (data: RejectionFormValues) => { if (rejectionItem) rejectMutation.mutate({ approvalId: rejectionItem.id, data }); };

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
          <TabsTrigger value="dashboard" data-testid="tab-dashboard"><BarChart3 className="w-4 h-4 mr-1" />{t('dashboard6')}</TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            <Clock className="w-4 h-4 mr-1" />Kutilmoqda / Ожидание
            {dashboardData && dashboardData.totals.pending > 0 && <EPStatusPill tone="neutral" className="ml-2">{dashboardData.totals.pending}</EPStatusPill>}
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history"><History className="w-4 h-4 mr-1" />Tarix / История</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          {dashboardLoading ? (
            <div className="flex items-center justify-center py-12">
              <EPLoader tone="muted" className="w-6 h-6" />
              <span className="ml-2 text-muted-foreground">Yuklanmoqda... / Загрузка...</span>
            </div>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle data-testid="text-pipeline-title">Tasdiqlash bosqichlari / Этапы утверждения</CardTitle>
                  <CardDescription>Dizayn → Texnolog → Sifat nazorati → Moliya / Дизайн → Технолог → Контроль качества → Финансы</CardDescription>
                </CardHeader>
                <CardContent>
                  {dashboardData && <WorkflowPipeline dashboardData={dashboardData} onStageClick={(id) => { setFilterStage(id); setActiveTab("pending"); }} />}
                </CardContent>
              </Card>
              <DashboardStatCards totals={dashboardData?.totals} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <PendingApprovalsPanel
            filterStage={filterStage}
            setFilterStage={setFilterStage}
            pendingLoading={pendingLoading}
            pendingApprovals={pendingApprovals}
            onApprove={handleApprove}
            onReject={handleReject}
            onView={setSelectedOrderId}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <HistoryPanel
            filterStage={filterStage}
            setFilterStage={setFilterStage}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            historyLoading={historyLoading}
            historyData={historyData}
          />
        </TabsContent>
      </Tabs>

      <ApprovalDialog
        open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}
        approvalItem={approvalItem} form={approvalForm}
        isPending={approveMutation.isPending} onSubmit={onApprovalSubmit}
      />
      <RejectionDialog
        open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}
        rejectionItem={rejectionItem} form={rejectionForm}
        isPending={rejectMutation.isPending} onSubmit={onRejectionSubmit}
      />
      <OrderDetailDialog
        selectedOrderId={selectedOrderId} workflowData={workflowData}
        workflowLoading={workflowLoading} onClose={() => setSelectedOrderId(null)}
      />
    </div>
  );
}
