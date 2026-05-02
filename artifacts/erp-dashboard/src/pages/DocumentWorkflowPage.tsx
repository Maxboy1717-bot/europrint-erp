import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/lib/i18n";

const DOC_TYPES_KEYS = [
  { value: "LEAVE_REQUEST", key: "docTypeLeave" },
  { value: "ADVANCE_REQUEST", key: "docTypeAdvance" },
  { value: "EXPENSE_CLAIM", key: "docTypeExpense" },
  { value: "TRAINING_REQUEST", key: "docTypeTraining" },
  { value: "INCIDENT_REPORT", key: "docTypeIncident" },
  { value: "DISCIPLINE_NOTICE", key: "docTypeDiscipline" },
  { value: "EMPLOYMENT_CONTRACT", key: "docTypeEmployment" },
  { value: "AMENDMENT_CONTRACT", key: "docTypeAmendment" },
  { value: "DISMISSAL_ORDER", key: "docTypeDismissal" },
  { value: "TRANSFER_ORDER", key: "docTypeTransferOrder" },
  { value: "PIP_PLAN", key: "docTypePIP" },
  { value: "OTHER", key: "docTypeOther" },
];

const ROUTE_TYPES = ["VERTICAL", "HORIZONTAL", "SPECIFIC"];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-600", pending: "bg-yellow-700", approved: "bg-green-700",
  rejected: "bg-red-700", cancelled: "bg-slate-700"
};
const STATUS_LABEL_KEYS: Record<string, string> = {
  draft: "statusDraft", pending: "statusPending", approved: "statusApproved",
  rejected: "statusRejected", cancelled: "statusCancelled"
};


interface PendingStep { id: number; document_id: number; doc_number: string; title: string; creator_name: string; deadline_at: string; doc_status: string; doc_type: string }
interface WorkflowDoc { id: number; title: string; doc_number: string; created_at: string; doc_type: string; status: string; total_steps: number; approved_steps: number; is_immutable: boolean; creator_name: string; rejection_reason: string }
interface DocStep { id: number; status: string; assignee_name: string; assignee_role: string; deadline_at: string; escalated_at: string; reminder_1_sent: boolean; reminder_2_sent: boolean; notes: string; action_by_name: string; action_at: string }
interface DocVersion { id: number; version: number; changed_by_name: string; created_at: string; change_reason: string }
interface DocDetail { steps: DocStep[]; versions: DocVersion[]; document?: WorkflowDoc; [key: string]: unknown }
interface RouteConfig { id: number; step_order: number; document_type: string; route_type: string; deadline_hours: number; levels_up: number; target_department: string; target_role_code: string; reminder_hours: number[]; is_active: boolean }

function DeadlineBadge({ deadlineAt }: { deadlineAt: string }) {
  if (!deadlineAt) return null;
  const ms = new Date(deadlineAt).getTime() - Date.now();
  const mins = Math.round(ms / 60000);
  const hours = Math.round(ms / 3600000);
  if (ms < 0) return <Badge className="bg-red-800 text-white text-xs">⏰ Muddat o'tgan</Badge>;
  if (hours < 2) return <Badge className="bg-orange-700 text-white text-xs">⚡ {mins} daq qoldi</Badge>;
  if (hours < 24) return <Badge className="bg-yellow-700 text-white text-xs">⏳ {hours} soat qoldi</Badge>;
  return null;
}

export default function DocumentWorkflowPage() {
  const { user } = useAuth();
  const { t } = useTranslation('hr');
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();
  const qc = useQueryClient();
  const empId = user?.employeeId || 1;
  const userRole = user?.role || "employee";
  const isAdmin = ["admin", "super_admin", "hr_manager", "director"].includes(userRole);

  const [showCreate, setShowCreate] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<WorkflowDoc | null>(null);
  const [form, setForm] = useState({
    doc_type: "LEAVE_REQUEST", title: "", content: "", created_by: empId
  });
  const [approveNotes, setApproveNotes] = useState("");
  const [rejectReasons, setRejectReasons] = useState<Record<number, string>>({});

  // Admin: new route config form
  const [routeForm, setRouteForm] = useState({
    document_type: "LEAVE_REQUEST", step_order: 1, route_type: "VERTICAL",
    levels_up: 1, target_department: "", target_role_code: "", deadline_hours: 24,
    reminder_hours_1: 4, reminder_hours_2: 2
  });

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
    queryFn: () => apiRequest("GET", `/api/hr-v2/documents/${selectedDoc!.id}`),
    enabled: !!selectedDoc?.id,
  });

  const { data: routeConfigs } = useQuery<RouteConfig[]>({
    queryKey: ["/api/hr-v2/documents/admin/workflow-routes"],
    queryFn: () => apiRequest("GET", "/api/hr-v2/documents/admin/workflow-routes"),
    enabled: isAdmin,
  });

  const create = useMutation({
    mutationFn: (d: Record<string, unknown>) => apiRequest("POST", "/api/hr-v2/documents", d),
    onSuccess: (data) => {
      toast({ title: t('documentCreated'), description: `${t("docNumber")}: ${data.doc_number}` });
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
      toast({ title: t('documentApproved') });
      setApproveNotes("");
      qc.invalidateQueries({ queryKey: ["/api/hr/documents/pending"] });
      qc.invalidateQueries({ queryKey: ["/api/hr-v2/documents", selectedDoc?.id] });
    },
  });

  const reject = useMutation({
    mutationFn: ({ stepId, reason }: { stepId: number; reason: string }) => {
      if (!reason || !String(reason).trim()) {
        return Promise.reject(new Error("Rad etish sababi majburiy"));
      }
      return apiRequest("PATCH", `/api/hr-v2/documents/steps/${stepId}/reject`, { notes: reason });
    },
    onSuccess: (_data, { stepId }) => {
      toast({ title: t('documentRejected'), variant: "destructive" });
      setRejectReasons(prev => { const n = { ...prev }; delete n[stepId]; return n; });
      qc.invalidateQueries({ queryKey: ["/api/hr/documents/pending"] });
      qc.invalidateQueries({ queryKey: ["/api/hr-v2/documents", selectedDoc?.id] });
    },
    onError: (err: Error) => {
      toast({ title: "Xatolik", description: err?.message || "Rad etilmadi", variant: "destructive" });
    },
  });

  const createRoute = useMutation({
    mutationFn: (d: Record<string, unknown>) => apiRequest("POST", "/api/hr-v2/documents/admin/workflow-routes", d),
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
  });

  const toggleRoute = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/hr-v2/documents/admin/workflow-routes/${id}/toggle`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/hr-v2/documents/admin/workflow-routes"] });
    },
  });

  const pendingCount = pending?.length || 0;
  const approvedCount = myDocs?.filter((d) => d.status === "approved").length || 0;
  const totalCount = myDocs?.length || 0;

  return (
    <div className="p-6 space-y-6 bg-[#0f0f23] min-h-screen text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">📄 {t('documentWorkflow')}</h1>
          <p className="text-slate-400 text-sm mt-1">{t('documentWorkflowDesc')}</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="bg-[#ff5d2e] hover:bg-[#e04d1e] text-white">
          {t('newDocument')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400">{pending?.length || 0}</div>
            <div className="text-xs text-slate-400 mt-1">{t('pendingApprovalCount')}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{myDocs?.filter((d) => d.status === "approved").length || 0}</div>
            <div className="text-xs text-slate-400 mt-1">{t('approvedCount')}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-white">{myDocs?.length || 0}</div>
            <div className="text-xs text-slate-400 mt-1">{t('totalDocuments')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card className="bg-slate-800/50 border-[#ff5d2e] max-w-2xl">
          <CardHeader><CardTitle className="text-white">{t('createDocument')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-slate-300">{t('documentType')} *</Label>
              <Select value={form.doc_type} onValueChange={v => setForm(f => ({ ...f, doc_type: v }))}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {(Array.isArray(DOC_TYPES_KEYS) ? DOC_TYPES_KEYS : []).map(dt => <SelectItem key={dt.value} value={dt.value} className="text-white">{t(dt.key)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">{t('documentTitle')} *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder={t('documentTitle') + "..."} className="bg-slate-700 border-slate-600 text-white mt-1" />
            </div>
            <div>
              <Label className="text-slate-300">{t('documentContent')}</Label>
              <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder={t("docContentPlaceholder")} className="bg-slate-700 border-slate-600 text-white mt-1 min-h-24" />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => create.mutate({ ...form, created_by: empId, content: { text: form.content } })}
                disabled={!form.title || create.isPending}
                className="bg-[#ff5d2e] hover:bg-[#e04d1e] text-white"
              >
                {create.isPending ? t("creatingDoc") : t("btnSubmit")}
              </Button>
              <Button onClick={() => setShowCreate(false)} variant="outline" className="border-slate-600 text-slate-300">
                {tCommon("cancel")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="pending">
        <TabsList className="bg-slate-800 flex-wrap gap-1">
          <TabsTrigger value="pending" className="data-[state=active]:bg-[#ff5d2e] data-[state=active]:text-white">
            {t("pendingApprovalsTab")} ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="my" className="data-[state=active]:bg-[#ff5d2e] data-[state=active]:text-white">
            {t("myDocumentsTab")}
          </TabsTrigger>
          {selectedDoc && (
            <TabsTrigger value="detail" className="data-[state=active]:bg-[#ff5d2e] data-[state=active]:text-white">
              🔍 {selectedDoc.doc_number}
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="admin" className="data-[state=active]:bg-purple-700 data-[state=active]:text-white">
              ⚙️ Marshrutlash
            </TabsTrigger>
          )}
        </TabsList>

        {/* PENDING APPROVALS */}
        <TabsContent value="pending" className="mt-4">
          <div className="space-y-3">
            {pending?.map((step) => (
              <Card
                key={step.id}
                className="bg-slate-800/50 border-slate-700 hover:border-slate-600 cursor-pointer"
                onClick={() => setSelectedDoc({ id: step.document_id, doc_number: step.doc_number } as WorkflowDoc)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white truncate">{step.title}</div>
                      <div className="text-xs text-slate-400">{step.doc_number} · {step.creator_name}</div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{t("deadline")}: {step.deadline_at ? new Date(step.deadline_at).toLocaleString() : "—"}</span>
                        <DeadlineBadge deadlineAt={step.deadline_at} />
                      </div>
                    </div>
                    <Badge className={`${STATUS_COLORS[step.doc_status] || 'bg-slate-600'} text-white`}>
                      {(() => { const dt = DOC_TYPES_KEYS.find(d => d.value === step.doc_type); return dt ? t(dt.key) : step.doc_type; })()}
                    </Badge>
                    <div className="flex gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                      <Button size="sm" onClick={() => approve.mutate({ stepId: step.id })}
                        disabled={approve.isPending}
                        className="bg-green-700 hover:bg-green-600 text-white text-xs">
                        {t("btnApprove")}
                      </Button>
                      <Button size="sm"
                        onClick={e => { e.stopPropagation(); if (!rejectReasons[step.id]) { setRejectReasons(prev => ({ ...prev, [step.id]: "" })); } else { reject.mutate({ stepId: step.id, reason: rejectReasons[step.id] }); } }}
                        disabled={reject.isPending}
                        className="bg-red-700 hover:bg-red-600 text-white text-xs">
                        {t("btnReject")}
                      </Button>
                    </div>
                  </div>
                  {rejectReasons[step.id] !== undefined && (
                    <div className="flex gap-2 items-center" onClick={e => e.stopPropagation()}>
                      <Input
                        value={rejectReasons[step.id]}
                        onChange={e => setRejectReasons(prev => ({ ...prev, [step.id]: e.target.value }))}
                        placeholder="Rad etish sababi (majburiy) *"
                        className="bg-slate-700 border-red-600 text-white text-xs h-8 flex-1"
                        autoFocus
                      />
                      <Button size="sm"
                        onClick={() => reject.mutate({ stepId: step.id, reason: rejectReasons[step.id] })}
                        disabled={!rejectReasons[step.id]?.trim() || reject.isPending}
                        className="bg-red-700 hover:bg-red-600 text-white text-xs h-8 px-3">
                        ❌ Rad et
                      </Button>
                      <Button size="sm" variant="ghost"
                        onClick={() => setRejectReasons(prev => { const n = { ...prev }; delete n[step.id]; return n; })}
                        className="text-slate-400 text-xs h-8 px-2">
                        Bekor
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {(!pending || pending.length === 0) && (
              <div className="text-center py-12 text-slate-400">
                <div className="text-4xl mb-3">✅</div>
                <p>{t("noPendingDocs")}</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* MY DOCUMENTS */}
        <TabsContent value="my" className="mt-4">
          <div className="space-y-3">
            {myDocs?.map((doc) => (
              <Card
                key={doc.id}
                className="bg-slate-800/50 border-slate-700 hover:border-slate-600 cursor-pointer"
                onClick={() => setSelectedDoc(doc)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white truncate">{doc.title}</div>
                      <div className="text-xs text-slate-400">
                        {doc.doc_number} · {new Date(doc.created_at).toLocaleDateString()} · {(() => { const dt = DOC_TYPES_KEYS.find(d => d.value === doc.doc_type); return dt ? t(dt.key) : doc.doc_type; })()}
                      </div>
                    </div>
                    <Badge className={`${STATUS_COLORS[doc.status] || 'bg-slate-600'} text-white text-xs`}>
                      {t(STATUS_LABEL_KEYS[doc.status] || doc.status)}
                    </Badge>
                    {doc.total_steps > 0 && (
                      <div className="text-xs text-slate-400 shrink-0">
                        {doc.approved_steps || 0}/{doc.total_steps} {t("stepsUnit")}
                      </div>
                    )}
                    {doc.is_immutable && (
                      <Badge className="bg-purple-800 text-white text-xs shrink-0">🔒 O'zgarmas</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!myDocs || myDocs.length === 0) && (
              <div className="text-center py-12 text-slate-400">
                <div className="text-4xl mb-3">📄</div>
                <p>{t("noDocuments")}</p>
                <Button onClick={() => setShowCreate(true)} className="mt-4 bg-[#ff5d2e] hover:bg-[#e04d1e] text-white text-sm">
                  ➕ {t("createFirstDoc")}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* DOC DETAIL */}
        {selectedDoc && docDetail && (
          <TabsContent value="detail" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between flex-wrap gap-2">
                    <span>{docDetail.document?.doc_number}</span>
                    <div className="flex gap-2 items-center">
                      <Badge className={`${STATUS_COLORS[docDetail.document?.status ?? ''] || 'bg-slate-600'} text-white`}>
                        {docDetail.document?.status ? t(STATUS_LABEL_KEYS[docDetail.document.status] || docDetail.document.status) : "—"}
                      </Badge>
                      {docDetail.document?.is_immutable && (
                        <Badge className="bg-purple-700 text-white">🔒 O'zgarmas</Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-slate-400 text-xs">{t("docTitleLabel")}</div>
                    <div className="text-white font-semibold">{docDetail.document?.title}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs">{t("documentType")}</div>
                    <div className="text-slate-200">
                      {(() => { const dt = DOC_TYPES_KEYS.find(d => d.value === docDetail.document?.doc_type); return dt ? t(dt.key) : (docDetail.document?.doc_type ?? "—"); })()}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs">{t("createdBy")}</div>
                    <div className="text-slate-200">{docDetail.document?.creator_name}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs">{t("createdAt")}</div>
                    <div className="text-slate-200">
                      {docDetail.document?.created_at ? new Date(docDetail.document.created_at).toLocaleString() : "—"}
                    </div>
                  </div>
                  {docDetail.document?.rejection_reason && (
                    <div>
                      <div className="text-red-400 text-xs">{t("rejectionReason")}</div>
                      <div className="text-red-300 text-sm">{docDetail.document.rejection_reason}</div>
                    </div>
                  )}
                  {docDetail.document?.is_immutable && (
                    <Badge className="bg-purple-700 text-white">{t("immutableDoc")}</Badge>
                  )}
                </CardContent>
              </Card>

              {/* Approval steps */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-base">{t("approvalSteps")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {docDetail.steps?.map((step, idx) => (
                      <div key={step.id} className="flex gap-3 items-start">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                          ${step.status === 'approved' ? 'bg-green-700 text-white' :
                            step.status === 'rejected' ? 'bg-red-700 text-white' :
                            step.status === 'pending' ? 'bg-yellow-700 text-white' : 'bg-slate-700 text-slate-400'}`}>
                          {step.status === 'approved' ? '✓' : step.status === 'rejected' ? '✗' : idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="text-white text-sm font-medium flex items-center gap-2 flex-wrap">
                            {step.assignee_name || step.assignee_role || t("reviewer")}
                            {step.status === 'unassigned' && <Badge className="bg-orange-700 text-white text-xs">⚠ Tayinlanmagan</Badge>}
                            {step.escalated_at && <Badge className="bg-red-900 text-white text-xs">🚨 Eskalatsiya qilindi</Badge>}
                            {step.reminder_1_sent && !step.reminder_2_sent && <Badge className="bg-yellow-800 text-white text-xs">📨 1-eslatma</Badge>}
                            {step.reminder_2_sent && !step.escalated_at && <Badge className="bg-orange-800 text-white text-xs">📨📨 2-eslatma</Badge>}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-2">
                            <span>Muddati: {step.deadline_at ? new Date(step.deadline_at).toLocaleString() : "—"}</span>
                            <DeadlineBadge deadlineAt={step.deadline_at} />
                          </div>
                          {step.notes && (
                            <div className="text-xs text-slate-300 mt-0.5 bg-slate-700/50 rounded p-1">"{step.notes}"</div>
                          )}
                          {step.action_by_name && step.action_at && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              {step.action_by_name} · {new Date(step.action_at).toLocaleString()}
                            </div>
                          )}
                          {step.status === 'pending' && (
                            <div className="space-y-2 mt-2" onClick={e => e.stopPropagation()}>
                              <div className="flex gap-2">
                                <Input
                                  value={approveNotes}
                                  onChange={e => setApproveNotes(e.target.value)}
                                  placeholder={t("commentOptional")}
                                  className="bg-slate-700 border-slate-600 text-white text-xs h-7 flex-1"
                                />
                                <Button size="sm" onClick={() => approve.mutate({ stepId: step.id })}
                                  disabled={approve.isPending}
                                  className="bg-green-700 hover:bg-green-600 text-white text-xs h-7 px-2">✅ {t("btnApprove")}</Button>
                              </div>
                              <div className="flex gap-2">
                                <Input
                                  value={rejectReasons[step.id] ?? ""}
                                  onChange={e => setRejectReasons(prev => ({ ...prev, [step.id]: e.target.value }))}
                                  placeholder="Rad etish sababi (majburiy) *"
                                  className="bg-slate-700 border-red-700 text-white text-xs h-7 flex-1"
                                />
                                <Button size="sm"
                                  onClick={() => reject.mutate({ stepId: step.id, reason: rejectReasons[step.id] ?? "" })}
                                  disabled={!rejectReasons[step.id]?.trim() || reject.isPending}
                                  className="bg-red-700 hover:bg-red-600 text-white text-xs h-7 px-2">❌ {t("btnReject")}</Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {(!docDetail.steps || docDetail.steps.length === 0) && (
                      <div className="text-slate-400 text-sm text-center py-4">
                        Tasdiqlash bosqichi yo'q — avtomatik tasdiqlangan
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Version history */}
              {docDetail.versions && docDetail.versions.length > 0 && (
                <Card className="bg-slate-800/50 border-slate-700 md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-white text-base">📜 Versiya tarixi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(Array.isArray(docDetail.versions) ? docDetail.versions : []).map((v) => (
                        <div key={v.id} className="flex items-center gap-3 text-sm border-b border-slate-700 pb-2">
                          <Badge className="bg-slate-600 text-white shrink-0">v{v.version}</Badge>
                          <span className="text-slate-300">{v.changed_by_name || "Noma'lum"}</span>
                          <span className="text-slate-500 text-xs">{new Date(v.created_at).toLocaleString()}</span>
                          {v.change_reason && <span className="text-slate-400 text-xs">— {v.change_reason}</span>}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        )}

        {/* ADMIN: Marshrutlash konfiguratsiyasi */}
        {isAdmin && (
          <TabsContent value="admin" className="mt-4">
            <div className="space-y-6">
              {/* Add route form */}
              <Card className="bg-slate-800/50 border-purple-800">
                <CardHeader>
                  <CardTitle className="text-white text-base">➕ {tCommon('add')} {t('approvalStep')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-slate-300 text-xs">{t('documentType')}</Label>
                      <Select value={routeForm.document_type} onValueChange={v => setRouteForm(f => ({ ...f, document_type: v }))}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1 text-xs h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 max-h-60 overflow-y-auto">
                          {(Array.isArray(DOC_TYPES_KEYS) ? DOC_TYPES_KEYS : []).map(dt => (
                            <SelectItem key={dt.value} value={dt.value} className="text-white text-xs">{t(dt.key)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300 text-xs">Qadam tartibi</Label>
                      <Input
                        type="number" min={1}
                        value={routeForm.step_order}
                        onChange={e => setRouteForm(f => ({ ...f, step_order: parseInt(e.target.value) || 1 }))}
                        className="bg-slate-700 border-slate-600 text-white mt-1 h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300 text-xs">Marshrutlash turi</Label>
                      <Select value={routeForm.route_type} onValueChange={v => setRouteForm(f => ({ ...f, route_type: v }))}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1 text-xs h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {(Array.isArray(ROUTE_TYPES) ? ROUTE_TYPES : []).map(r => (
                            <SelectItem key={r} value={r} className="text-white text-xs">{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300 text-xs">Daraja (yuqoriga)</Label>
                      <Input
                        type="number" min={1} max={5}
                        value={routeForm.levels_up}
                        onChange={e => setRouteForm(f => ({ ...f, levels_up: parseInt(e.target.value) || 1 }))}
                        className="bg-slate-700 border-slate-600 text-white mt-1 h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300 text-xs">{t('department')}</Label>
                      <Input
                        value={routeForm.target_department}
                        onChange={e => setRouteForm(f => ({ ...f, target_department: e.target.value }))}
                        placeholder={tCommon('optional')}
                        className="bg-slate-700 border-slate-600 text-white mt-1 h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300 text-xs">{t('position')} (positions.name)</Label>
                      <Input
                        value={routeForm.target_role_code}
                        onChange={e => setRouteForm(f => ({ ...f, target_role_code: e.target.value }))}
                        placeholder="Masalan: HR Menejer, Direktor, Bosh buxgalter"
                        className="bg-slate-700 border-slate-600 text-white mt-1 h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300 text-xs">Muddat (soat)</Label>
                      <Input
                        type="number" min={1}
                        value={routeForm.deadline_hours}
                        onChange={e => setRouteForm(f => ({ ...f, deadline_hours: parseInt(e.target.value) || 24 }))}
                        className="bg-slate-700 border-slate-600 text-white mt-1 h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300 text-xs">1-eslatma (soat qolgunicha)</Label>
                      <Input
                        type="number" min={1}
                        value={routeForm.reminder_hours_1}
                        onChange={e => setRouteForm(f => ({ ...f, reminder_hours_1: parseInt(e.target.value) || 4 }))}
                        className="bg-slate-700 border-slate-600 text-white mt-1 h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300 text-xs">2-eslatma (soat qolgunicha)</Label>
                      <Input
                        type="number" min={1}
                        value={routeForm.reminder_hours_2}
                        onChange={e => setRouteForm(f => ({ ...f, reminder_hours_2: parseInt(e.target.value) || 2 }))}
                        className="bg-slate-700 border-slate-600 text-white mt-1 h-8 text-xs"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => createRoute.mutate(routeForm)}
                    disabled={createRoute.isPending}
                    className="mt-4 bg-purple-700 hover:bg-purple-600 text-white text-sm"
                  >
                    {createRoute.isPending ? tCommon('saving') + "..." : "💾 " + tCommon('save')}
                  </Button>
                </CardContent>
              </Card>

              {/* Existing routes table */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-base">📋 {t('approvalHistory')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {routeConfigs && routeConfigs.length > 0 ? (
                    <div className="space-y-2">
                      {(Array.isArray(routeConfigs) ? routeConfigs : []).map((r) => (
                        <div key={r.id} className="flex items-center gap-3 bg-slate-700/50 rounded p-3 flex-wrap">
                          <Badge className="bg-slate-600 text-white text-xs shrink-0">#{r.step_order}</Badge>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm font-medium">
                              {(() => { const dt = DOC_TYPES_KEYS.find(d => d.value === r.document_type); return dt ? t(dt.key) : r.document_type; })()}
                            </div>
                            <div className="text-xs text-slate-400">
                              {r.route_type} · {r.deadline_hours} soat muddat · {r.levels_up} daraja
                              {r.target_department && ` · ${t('department')}: ${r.target_department}`}
                              {r.target_role_code && ` · ${t('position')}: ${r.target_role_code}`}
                              {r.reminder_hours && Array.isArray(r.reminder_hours) && ` · Eslatma: ${r.reminder_hours[0]}h / ${r.reminder_hours[1]}h`}
                            </div>
                          </div>
                          <Badge className={r.is_active ? "bg-green-800 text-white text-xs" : "bg-slate-600 text-white text-xs"}>
                            {r.is_active ? t('active') : t('inactive')}
                          </Badge>
                          <div className="flex gap-1 shrink-0">
                            <Button size="sm" onClick={() => toggleRoute.mutate(r.id)}
                              className="bg-slate-600 hover:bg-slate-500 text-white text-xs h-7 px-2">
                              {r.is_active ? "⏸" : "▶"}
                            </Button>
                            <Button size="sm" onClick={() => deleteRoute.mutate(r.id)}
                              className="bg-red-800 hover:bg-red-700 text-white text-xs h-7 px-2">🗑</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      Hali marshrutlash qoidasi yo'q. Yuqoridagi forma orqali qo'shing.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Doc types info */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-base">📁 {t('documentType')} ({DOC_TYPES_KEYS.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {(Array.isArray(DOC_TYPES_KEYS) ? DOC_TYPES_KEYS : []).map(dt => (
                      <div key={dt.value} className="flex items-center gap-2 bg-slate-700/50 rounded p-2">
                        <div>
                          <div className="text-white text-xs font-medium">{t(dt.key)}</div>
                          <div className="text-slate-500 text-xs font-mono">{dt.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
