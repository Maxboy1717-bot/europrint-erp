/** @module DocumentWorkflowPage @description Route-level page component for the Document Workflow feature. Owns state, TanStack Query queries/mutations, and the top-level tab shell. Section rendering is delegated to DocumentWorkflowPageSections and DocumentWorkflowPageDialogs. */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/lib/i18n";

import {
  WorkflowDoc, DocDetail, RouteConfig, RouteForm,
  CreateDocForm, DEFAULT_ROUTE_FORM,
} from "./DocumentWorkflowPageTypes";
import type { PendingStep } from "./DocumentWorkflowPageTypes";
import { PendingApprovalsTab, MyDocumentsTab, CreateDocumentForm } from "./DocumentWorkflowPageSections";
import { DocDetailTab } from "./DocumentWorkflowPageDetail";
import { AdminRoutingTab } from "./DocumentWorkflowPageDialogs";

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function DocumentWorkflowPage() {
  const { user } = useAuth();
  const { t } = useTranslation("hr");
  const { toast } = useToast();
  const qc = useQueryClient();

  const empId    = user?.employeeId || 1;
  const userRole = user?.role || "employee";
  const isAdmin  = ["admin", "super_admin", "hr_manager", "director"].includes(userRole);

  // UI state
  const [showCreate, setShowCreate]     = useState(false);
  const [selectedDoc, setSelectedDoc]   = useState<WorkflowDoc | null>(null);
  const [approveNotes, setApproveNotes] = useState("");
  const [rejectReasons, setRejectReasons] = useState<Record<number, string>>({});

  // Create-document form
  const [form, setForm] = useState<CreateDocForm>({
    doc_type: "LEAVE_REQUEST", title: "", content: "", created_by: empId,
  });

  // Admin route form
  const [routeForm, setRouteForm] = useState<RouteForm>(DEFAULT_ROUTE_FORM);

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  const { data: myDocs } = useQuery<WorkflowDoc[]>({
    queryKey: ["/api/hr-v2/documents/employee", empId],
    queryFn: () => apiRequest("GET", `/api/hr-v2/documents/employee/${empId}`),
  });

  const { data: pending } = useQuery<PendingStep[]>({
    queryKey: ["/api/hr-v2/documents/pending", empId],
    queryFn: () => apiRequest("GET", `/api/hr-v2/documents?status=pending&employeeId=${empId}`),
  });

  const { data: docDetail } = useQuery<DocDetail>({
    queryKey: ["/api/hr-v2/documents", selectedDoc?.id],
    queryFn: () => apiRequest("GET", `/api/hr-v2/documents/${selectedDoc?.id}`),
    enabled: !!selectedDoc?.id,
  });

  const { data: routeConfigs } = useQuery<RouteConfig[]>({
    queryKey: ["/api/hr-v2/documents/admin/workflow-routes"],
    queryFn: () => apiRequest("GET", "/api/hr-v2/documents/admin/workflow-routes"),
    enabled: isAdmin,
  });

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  const create = useMutation({
    mutationFn: (d: Record<string, unknown>) => apiRequest("POST", "/api/hr-v2/documents", d),
    onSuccess: (data) => {
      toast({ title: t("documentCreated"), description: `${t("docNumber")}: ${data.doc_number}` });
      setShowCreate(false);
      setForm({ doc_type: "LEAVE_REQUEST", title: "", content: "", created_by: empId });
      qc.invalidateQueries({ queryKey: ["/api/hr-v2/documents/employee"] });
    },
    onError: (err: Error) => {
      toast({ title: "Xatolik", description: err?.message || "Hujjat yaratilmadi", variant: "destructive" });
    },
  });

  const approve = useMutation({
    mutationFn: ({ stepId }: { stepId: number }) =>
      apiRequest("PATCH", `/api/hr-v2/documents/steps/${stepId}/approve`, { notes: approveNotes }),
    onSuccess: () => {
      toast({ title: t("documentApproved") });
      setApproveNotes("");
      qc.invalidateQueries({ queryKey: ["/api/hr/documents/pending"] });
      qc.invalidateQueries({ queryKey: ["/api/hr-v2/documents", selectedDoc?.id] });
    },
    onError: (err: Error) => {
      toast({ title: "Xatolik", description: err?.message || "Tasdiqlanmadi", variant: "destructive" });
    },
  });

  const reject = useMutation({
    mutationFn: ({ stepId, reason }: { stepId: number; reason: string }) => {
      if (!reason || !String(reason).trim()) return Promise.reject(new Error("Rad etish sababi majburiy"));
      return apiRequest("PATCH", `/api/hr-v2/documents/steps/${stepId}/reject`, { notes: reason });
    },
    onSuccess: (_data, { stepId }) => {
      toast({ title: t("documentRejected"), variant: "destructive" });
      setRejectReasons(prev => { const n = { ...prev }; delete n[stepId]; return n; });
      qc.invalidateQueries({ queryKey: ["/api/hr/documents/pending"] });
      qc.invalidateQueries({ queryKey: ["/api/hr-v2/documents", selectedDoc?.id] });
    },
    onError: (err: Error) => {
      toast({ title: "Xatolik", description: err?.message || "Rad etilmadi", variant: "destructive" });
    },
  });

  const createRoute = useMutation({
    mutationFn: (d: Record<string, unknown>) =>
      apiRequest("POST", "/api/hr-v2/documents/admin/workflow-routes", d),
    onSuccess: () => {
      toast({ title: "✅ Marshrutlash qo'shildi" });
      qc.invalidateQueries({ queryKey: ["/api/hr-v2/documents/admin/workflow-routes"] });
    },
    onError: (err: Error) => {
      toast({ title: "Xatolik", description: err?.message || "Qo'shilmadi", variant: "destructive" });
    },
  });

  const deleteRoute = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/hr-v2/documents/admin/workflow-routes/${id}`),
    onSuccess: () => {
      toast({ title: "🗑 O'chirildi" });
      qc.invalidateQueries({ queryKey: ["/api/hr-v2/documents/admin/workflow-routes"] });
    },
    onError: (err: Error) => {
      toast({ title: "Xatolik", description: err?.message || "O'chirilmadi", variant: "destructive" });
    },
  });

  const toggleRoute = useMutation({
    mutationFn: (id: number) =>
      apiRequest("PATCH", `/api/hr-v2/documents/admin/workflow-routes/${id}/toggle`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/hr-v2/documents/admin/workflow-routes"] });
    },
  });

  // -------------------------------------------------------------------------
  // Shared reject-reason handlers
  // -------------------------------------------------------------------------

  const handleRejectStart  = (stepId: number) =>
    setRejectReasons(prev => ({ ...prev, [stepId]: "" }));

  const handleRejectSubmit = (stepId: number, reason: string) =>
    reject.mutate({ stepId, reason });

  const handleRejectCancel = (stepId: number) =>
    setRejectReasons(prev => { const n = { ...prev }; delete n[stepId]; return n; });

  const handleRejectReasonChange = (stepId: number, value: string) =>
    setRejectReasons(prev => ({ ...prev, [stepId]: value }));

  const pendingCount = pending?.length || 0;

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">📄 {t("documentWorkflow")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("documentWorkflowDesc")}</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="bg-primary hover:bg-primary/90 text-white">
          {t("newDocument")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400">{pendingCount}</div>
            <div className="text-xs text-muted-foreground mt-1">{t("pendingApprovalCount")}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{(Array.isArray(myDocs) ? myDocs : []).filter(d => d.status === "approved").length}</div>
            <div className="text-xs text-muted-foreground mt-1">{t("approvedCount")}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-foreground">{Array.isArray(myDocs) ? myDocs.length : 0}</div>
            <div className="text-xs text-muted-foreground mt-1">{t("totalDocuments")}</div>
          </CardContent>
        </Card>
      </div>

      {/* Inline create form */}
      {showCreate && (
        <CreateDocumentForm
          form={form}
          empId={empId}
          createIsPending={create.isPending}
          t={t}
          tCommon={tCommon}
          onFormChange={patch => setForm(f => ({ ...f, ...patch }))}
          onSubmit={() => create.mutate({ ...form, created_by: empId, content: { text: form.content } })}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList className="bg-muted flex-wrap gap-1">
          <TabsTrigger value="pending" className="data-[state=active]:bg-card data-[state=active]:text-foreground">
            {t("pendingApprovalsTab")} ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="my" className="data-[state=active]:bg-card data-[state=active]:text-foreground">
            {t("myDocumentsTab")}
          </TabsTrigger>
          {selectedDoc && (
            <TabsTrigger value="detail" className="data-[state=active]:bg-card data-[state=active]:text-foreground">
              🔍 {selectedDoc.doc_number}
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="admin" className="data-[state=active]:bg-purple-700 data-[state=active]:text-white">
              {t("marshrutlash")}
            </TabsTrigger>
          )}
        </TabsList>

        <PendingApprovalsTab
          pending={pending}
          rejectReasons={rejectReasons}
          approveIsPending={approve.isPending}
          rejectIsPending={reject.isPending}
          t={t}
          onSelectDoc={doc => setSelectedDoc(doc as WorkflowDoc)}
          onApprove={stepId => approve.mutate({ stepId })}
          onRejectStart={handleRejectStart}
          onRejectSubmit={handleRejectSubmit}
          onRejectCancel={handleRejectCancel}
          onRejectReasonChange={handleRejectReasonChange}
        />

        <MyDocumentsTab
          myDocs={myDocs}
          t={t}
          onSelectDoc={setSelectedDoc}
          onCreateClick={() => setShowCreate(true)}
        />

        {selectedDoc && docDetail && (
          <DocDetailTab
            selectedDoc={selectedDoc}
            docDetail={docDetail}
            approveNotes={approveNotes}
            rejectReasons={rejectReasons}
            approveIsPending={approve.isPending}
            rejectIsPending={reject.isPending}
            t={t}
            onApproveNotesChange={setApproveNotes}
            onApprove={stepId => approve.mutate({ stepId })}
            onRejectSubmit={handleRejectSubmit}
            onRejectReasonChange={handleRejectReasonChange}
          />
        )}

        {isAdmin && (
          <AdminRoutingTab
            routeForm={routeForm}
            routeConfigs={routeConfigs}
            createIsPending={createRoute.isPending}
            t={t}
            tCommon={tCommon}
            onRouteFormChange={patch => setRouteForm(f => ({ ...f, ...patch }))}
            onCreateRoute={() => createRoute.mutate(routeForm as unknown as Record<string, unknown>)}
            onToggleRoute={id => toggleRoute.mutate(id)}
            onDeleteRoute={id => deleteRoute.mutate(id)}
          />
        )}
      </Tabs>
    </div>
  );
}
