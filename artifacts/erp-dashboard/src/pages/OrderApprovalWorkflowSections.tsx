/**
 * @module OrderApprovalWorkflowSections
 * @description Sub-components for OrderApprovalWorkflow: pipeline, stat cards,
 * stage fields, table panels, order detail dialog, approval/rejection dialogs.
 */

import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, Clock, ArrowRight, BarChart3, Package, History, Filter, Eye } from "lucide-react";
import { formatDate } from "@/lib/format";
import { ApprovalItem, ApprovalFormValues, RejectionFormValues, WorkflowData, DashboardData, STAGES } from "./OrderApprovalWorkflowTypes";
import { EPStatusPill, EPLoader } from "@/components/ep";
import { useTranslation } from "@/lib/i18n";

// ── Status Badge ──────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation("common");
  if (status === "pending") return <Badge variant="secondary" data-testid={`badge-status-${status}`}><Clock className="w-3 h-3 mr-1" />{t("pending")}</Badge>;
  if (status === "approved") return <Badge data-testid={`badge-status-${status}`}><CheckCircle2 className="w-3 h-3 mr-1" />{t("approved")}</Badge>;
  if (status === "rejected") return <Badge variant="destructive" data-testid={`badge-status-${status}`}><XCircle className="w-3 h-3 mr-1" />{t("rejected")}</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export function getStatusBadge(status: string) {
  return <StatusBadge status={status} />;
}

// ── Dashboard Stat Cards ──────────────────────────────────────────────────────

export function DashboardStatCards({ totals }: { totals: DashboardData["totals"] | undefined }) {
  const { t } = useTranslation("common");
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card><CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2"><CardTitle className="text-sm font-medium">{t("pending")}</CardTitle><Clock className="w-4 h-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold" data-testid="text-total-pending">{totals?.pending || 0}</div></CardContent></Card>
      <Card><CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2"><CardTitle className="text-sm font-medium">{t("approved")}</CardTitle><CheckCircle2 className="w-4 h-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold" data-testid="text-total-approved">{totals?.approved || 0}</div></CardContent></Card>
      <Card><CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2"><CardTitle className="text-sm font-medium">{t("rejected")}</CardTitle><XCircle className="w-4 h-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold" data-testid="text-total-rejected">{totals?.rejected || 0}</div></CardContent></Card>
      <Card><CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2"><CardTitle className="text-sm font-medium">{t("approvedToday")}</CardTitle><BarChart3 className="w-4 h-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold" data-testid="text-total-today">{totals?.approvedToday || 0}</div></CardContent></Card>
    </div>
  );
}

// ── Pipeline ──────────────────────────────────────────────────────────────────

export function WorkflowPipeline({ dashboardData, onStageClick }: { dashboardData: DashboardData; onStageClick: (id: string) => void }) {
  return (
    <div className="flex items-center justify-between overflow-x-auto py-4" data-testid="workflow-pipeline">
      {(Array.isArray(STAGES) ? STAGES : []).map((stage, index) => {
        const stats = dashboardData.stageStats?.find((s) => s.stage === stage.id);
        const Icon = stage.icon;
        return (
          <div key={stage.id} className="flex items-center">
            <div className="flex flex-col items-center min-w-[140px] cursor-pointer" onClick={() => onStageClick(stage.id)} data-testid={`pipeline-stage-${stage.id}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stage.bg} text-white`}><Icon className="w-6 h-6" /></div>
              <span className="text-sm font-medium mt-2">{stats?.label?.uz || stage.id}</span>
              <span className="text-xs text-muted-foreground">{stats?.label?.ru || ""}</span>
              <div className="flex items-center gap-2 mt-2">
                <EPStatusPill tone="neutral" className="text-xs">{stats?.pending || 0}</EPStatusPill>
                <Badge className="text-xs">{stats?.approved || 0}</Badge>
                <EPStatusPill tone="danger" className="text-xs">{stats?.rejected || 0}</EPStatusPill>
              </div>
            </div>
            {index < STAGES.length - 1 && <ArrowRight className="w-6 h-6 mx-2 flex-shrink-0 text-muted-foreground" />}
          </div>
        );
      })}
    </div>
  );
}

// ── Stage-specific approval fields ───────────────────────────────────────────

export function StageFields({ stage, form }: { stage: string; form: UseFormReturn<ApprovalFormValues> }) {
  const { t } = useTranslation("common");
  if (stage === "design") return (
    <>
      <FormField control={form.control} name="designFileUrl" render={({ field }) => (<FormItem><FormLabel>{t("designFileUrl")}</FormLabel><FormControl><Input placeholder="https://..." {...field} data-testid="input-design-url" /></FormControl><FormMessage /></FormItem>)} />
      <FormField control={form.control} name="designVersion" render={({ field }) => (<FormItem><FormLabel>{t("version")}</FormLabel><FormControl><Input placeholder="1.0" {...field} data-testid="input-design-version" /></FormControl><FormMessage /></FormItem>)} />
    </>
  );
  if (stage === "technical") return (
    <>
      <FormField control={form.control} name="bomApproved" render={({ field }) => (<FormItem className="flex items-center gap-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-bom" /></FormControl><FormLabel>{t("bomApproved")}</FormLabel></FormItem>)} />
      <FormField control={form.control} name="routingApproved" render={({ field }) => (<FormItem className="flex items-center gap-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-routing" /></FormControl><FormLabel>{t("routingApproved")}</FormLabel></FormItem>)} />
      <FormField control={form.control} name="techCardApproved" render={({ field }) => (<FormItem className="flex items-center gap-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-techcard" /></FormControl><FormLabel>{t("techCardApproved")}</FormLabel></FormItem>)} />
    </>
  );
  if (stage === "qc") return (
    <>
      <FormField control={form.control} name="qcTestId" render={({ field }) => (<FormItem><FormLabel>{t("qcTestIdOptional")}</FormLabel><FormControl><Input placeholder={t("testId")} {...field} data-testid="input-qc-test-id" /></FormControl><FormMessage /></FormItem>)} />
      <FormField control={form.control} name="materialApproved" render={({ field }) => (<FormItem className="flex items-center gap-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-material" /></FormControl><FormLabel>{t("materialQualityApproved")}</FormLabel></FormItem>)} />
    </>
  );
  if (stage === "finance") return (
    <>
      <FormField control={form.control} name="advancePercentage" render={({ field }) => (<FormItem><FormLabel>{t("advancePaymentPercent")}</FormLabel><FormControl><Input type="number" min={0} max={100} {...field} onChange={(e) => field.onChange(Number(e.target.value))} data-testid="input-advance-pct" /></FormControl><FormMessage /></FormItem>)} />
      <FormField control={form.control} name="advanceAmount" render={({ field }) => (<FormItem><FormLabel>{t("advancePaymentAmount")}</FormLabel><FormControl><Input type="number" min={0} {...field} onChange={(e) => field.onChange(Number(e.target.value))} data-testid="input-advance-amount" /></FormControl><FormMessage /></FormItem>)} />
      <FormField control={form.control} name="creditLimitOk" render={({ field }) => (<FormItem className="flex items-center gap-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-credit" /></FormControl><FormLabel>{t("creditLimitOk")}</FormLabel></FormItem>)} />
      <FormField control={form.control} name="debtStatusOk" render={({ field }) => (<FormItem className="flex items-center gap-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-debt" /></FormControl><FormLabel>{t("debtStatusOk")}</FormLabel></FormItem>)} />
    </>
  );
  return null;
}

// ── Pending Approvals Panel ───────────────────────────────────────────────────

export function PendingApprovalsPanel({
  filterStage, setFilterStage, pendingLoading, pendingApprovals,
  onApprove, onReject, onView,
}: {
  filterStage: string; setFilterStage: (v: string) => void;
  pendingLoading: boolean; pendingApprovals: ApprovalItem[];
  onApprove: (item: ApprovalItem) => void; onReject: (item: ApprovalItem) => void; onView: (orderId: string) => void;
}) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader><CardTitle>{t("pendingApprovals")}</CardTitle><CardDescription>{t("tasdiqlashYokiRadEtishKerak")}</CardDescription></CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterStage} onValueChange={setFilterStage}>
              <SelectTrigger className="w-full sm:w-[200px] h-9" data-testid="select-filter-stage"><SelectValue placeholder={t("selectStage")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStages")}</SelectItem>
                <SelectItem value="design">{t("stageDesign")}</SelectItem>
                <SelectItem value="technical">{t("stageTechnical")}</SelectItem>
                <SelectItem value="qc">{t("stageQc")}</SelectItem>
                <SelectItem value="finance">{t("stageFinance")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {pendingLoading ? (
            <div className="flex items-center justify-center py-12"><EPLoader tone="muted" className="w-6 h-6" /></div>
          ) : pendingApprovals.length === 0 ? (
            <div className="text-center py-12 text-[13px] text-muted-foreground" data-testid="empty-state-pending">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>{t("noPendingApprovals")}</p>
            </div>
          ) : (
            <div className="ep-table-scroll"><Table data-testid="table-pending-approvals">
              <TableHeader><TableRow><TableHead>{t("papka2")}</TableHead><TableHead>{t("client")}</TableHead><TableHead>{t("product")}</TableHead><TableHead>{t("runVolume")}</TableHead><TableHead>{t("stage")}</TableHead><TableHead>{t("date")}</TableHead><TableHead className="text-right">{t("actions")}</TableHead></TableRow></TableHeader>
              <TableBody>
                {(Array.isArray(pendingApprovals) ? pendingApprovals : []).map((item) => (
                  <TableRow key={item.id} data-testid={`row-approval-${item.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{item.order.papkaNo}</TableCell>
                    <TableCell>{item.order.mijozNomi}</TableCell>
                    <TableCell>{item.order.mahsulotNomi}</TableCell>
                    <TableCell>{item.order.tiraj?.toLocaleString()}</TableCell>
                    <TableCell><EPStatusPill tone="neutral" data-testid={`badge-stage-${item.stage}`}>{item.stageLabel?.uz || item.stage}</EPStatusPill></TableCell>
                    <TableCell>{formatDate(item.order.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" onClick={() => onApprove(item)} data-testid={`button-approve-${item.id}`}><CheckCircle2 className="w-4 h-4 mr-1" />{t("verify")}</Button>
                        <Button size="sm" variant="outline" onClick={() => onReject(item)} data-testid={`button-reject-${item.id}`}><XCircle className="w-4 h-4 mr-1" />{t("reject")}</Button>
                        <Button size="icon" variant="ghost" onClick={() => onView(item.orderId)} data-testid={`button-view-${item.id}`}><Eye className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── History Panel ─────────────────────────────────────────────────────────────

export function HistoryPanel({
  filterStage, setFilterStage, filterStatus, setFilterStatus,
  historyLoading, historyData,
}: {
  filterStage: string; setFilterStage: (v: string) => void;
  filterStatus: string; setFilterStatus: (v: string) => void;
  historyLoading: boolean; historyData: ApprovalItem[];
}) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader><CardTitle>{t("approvalHistoryTitle")}</CardTitle><CardDescription>{t("barchaTasdiqlashVaRadEtishlar")}</CardDescription></CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterStage} onValueChange={setFilterStage}>
              <SelectTrigger className="w-full sm:w-[200px] h-9" data-testid="select-history-stage"><SelectValue placeholder={t("stage")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                <SelectItem value="design">{t("stageDesign")}</SelectItem>
                <SelectItem value="technical">{t("stageTechnical")}</SelectItem>
                <SelectItem value="qc">{t("stageQc")}</SelectItem>
                <SelectItem value="finance">{t("stageFinance")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[200px] h-9" data-testid="select-history-status"><SelectValue placeholder={t("status")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                <SelectItem value="pending">{t("pending")}</SelectItem>
                <SelectItem value="approved">{t("approved")}</SelectItem>
                <SelectItem value="rejected">{t("rejected")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {historyLoading ? (
            <div className="flex items-center justify-center py-12"><EPLoader tone="muted" className="w-6 h-6" /></div>
          ) : historyData.length === 0 ? (
            <div className="text-center py-12 text-[13px] text-muted-foreground" data-testid="empty-state-history">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>{t("noHistory")}</p>
            </div>
          ) : (
            <div className="ep-table-scroll"><Table data-testid="table-approval-history">
              <TableHeader><TableRow><TableHead>{t("papka2")}</TableHead><TableHead>{t("client")}</TableHead><TableHead>{t("stage")}</TableHead><TableHead>{t("status")}</TableHead><TableHead>{t("approver")}</TableHead><TableHead>{t("date")}</TableHead><TableHead>{t("comment")}</TableHead></TableRow></TableHeader>
              <TableBody>
                {(Array.isArray(historyData) ? historyData : []).map((item) => (
                  <TableRow key={item.id} data-testid={`row-history-${item.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{item.order?.papkaNo}</TableCell>
                    <TableCell>{item.order?.mijozNomi}</TableCell>
                    <TableCell><EPStatusPill tone="neutral">{item.stageLabel?.uz || item.stage}</EPStatusPill></TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{item.approverName || "-"}</TableCell>
                    <TableCell>{item.approvedAt ? formatDate(item.approvedAt) : "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{item.comments || item.rejectionReason || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Order Detail Dialog ───────────────────────────────────────────────────────

export function OrderDetailDialog({ selectedOrderId, workflowData, workflowLoading, onClose }: {
  selectedOrderId: string | null; workflowData: WorkflowData | undefined;
  workflowLoading: boolean; onClose: () => void;
}) {
  const { t } = useTranslation("common");
  if (!selectedOrderId) return null;
  return (
    <Dialog open={!!selectedOrderId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl p-6">
        <DialogHeader><DialogTitle className="text-[18px] font-semibold">{t("orderDetailsTitle")}</DialogTitle></DialogHeader>
        {workflowLoading ? (<div className="flex items-center justify-center py-8"><EPLoader className="w-6 h-6" /></div>
        ) : workflowData ? (
          <div className="space-y-6" data-testid="order-details-panel">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">{t("papka")}</span><span className="ml-2 font-medium" data-testid="text-detail-papka">{workflowData.order.papkaNo}</span></div>
              <div><span className="text-muted-foreground">{t("clientLabel")}</span><span className="ml-2 font-medium">{workflowData.order.mijozNomi}</span></div>
              <div><span className="text-muted-foreground">{t("productLabel")}</span><span className="ml-2 font-medium">{workflowData.order.mahsulotNomi}</span></div>
              <div><span className="text-muted-foreground">{t("runVolumeLabel")}</span><span className="ml-2 font-medium">{workflowData.order.tiraj?.toLocaleString()}</span></div>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-4">{t("approvalProcess")}</h4>
              <div className="space-y-3">
                {(Array.isArray(workflowData.workflow) ? workflowData.workflow : []).map((item) => (
                  <div key={item.stage} className={`flex items-start gap-4 p-3 rounded-md ${!item.approval ? "opacity-50 bg-muted/30" : item.approval.status === "approved" ? "bg-green-500/5" : item.approval.status === "rejected" ? "bg-red-500/5" : "bg-muted/30"}`} data-testid={`detail-stage-${item.stage}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${item.approval?.status === "approved" ? "bg-[var(--ep-green)] text-white" : item.approval?.status === "rejected" ? "bg-[var(--ep-red)] text-white" : "bg-muted text-muted-foreground"}`}>
                      {item.approval?.status === "approved" ? <CheckCircle2 className="w-4 h-4" /> : item.approval?.status === "rejected" ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{item.label.uz}</span>
                        <span className="text-muted-foreground text-sm">/ {item.label.ru}</span>
                        {item.approval && getStatusBadge(item.approval.status)}
                      </div>
                      {item.approver && <p className="text-sm text-muted-foreground mt-1">{item.approver.fullName}</p>}
                      {item.approval?.approvedAt && <p className="text-xs text-muted-foreground">{formatDate(item.approval.approvedAt)}</p>}
                      {item.approval?.comments && <p className="text-sm mt-1 italic text-muted-foreground">"{item.approval.comments}"</p>}
                      {item.approval?.rejectionReason && <p className="text-sm mt-1 text-destructive">{t("reasonLabel")} {item.approval.rejectionReason}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (<p className="text-muted-foreground text-center py-8">{t("noDataFound")}</p>)}
      </DialogContent>
    </Dialog>
  );
}

// ── Approval Dialog ───────────────────────────────────────────────────────────

export function ApprovalDialog({ open, onOpenChange, approvalItem, form, isPending, onSubmit }: {
  open: boolean; onOpenChange: (open: boolean) => void; approvalItem: ApprovalItem | null;
  form: UseFormReturn<ApprovalFormValues>; isPending: boolean; onSubmit: (data: ApprovalFormValues) => void;
}) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("approval")} - {approvalItem?.stageLabel?.uz || approvalItem?.stage}</DialogTitle>
          <DialogDescription>{approvalItem?.order?.papkaNo} - {approvalItem?.order?.mijozNomi}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {approvalItem && <StageFields stage={approvalItem.stage} form={form} />}
            <FormField control={form.control} name="comments" render={({ field }) => (<FormItem><FormLabel>{t("comments")}</FormLabel><FormControl><Textarea placeholder={t("additionalCommentsPlaceholder")} {...field} data-testid="input-approval-comments" /></FormControl><FormMessage /></FormItem>)} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-approval">{t("cancel")}</Button>
              <Button type="submit" disabled={isPending} data-testid="button-confirm-approval">
                {isPending && <EPLoader className="w-4 h-4 mr-1" />}<CheckCircle2 className="w-4 h-4 mr-1" />{t("approve")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── Rejection Dialog ──────────────────────────────────────────────────────────

export function RejectionDialog({ open, onOpenChange, rejectionItem, form, isPending, onSubmit }: {
  open: boolean; onOpenChange: (open: boolean) => void; rejectionItem: ApprovalItem | null;
  form: UseFormReturn<RejectionFormValues>; isPending: boolean; onSubmit: (data: RejectionFormValues) => void;
}) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("rejection")} - {rejectionItem?.stageLabel?.uz || rejectionItem?.stage}</DialogTitle>
          <DialogDescription>{rejectionItem?.order?.papkaNo} - {rejectionItem?.order?.mijozNomi}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="rejectionReason" render={({ field }) => (<FormItem><FormLabel>{t("rejectionReasonRequired")}</FormLabel><FormControl><Textarea placeholder={t("enterReasonPlaceholder")} {...field} data-testid="input-rejection-reason" /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="comments" render={({ field }) => (<FormItem><FormLabel>{t("additionalComment")}</FormLabel><FormControl><Textarea placeholder={t("commentsPlaceholder")} {...field} data-testid="input-rejection-comments" /></FormControl><FormMessage /></FormItem>)} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-rejection">{t("cancel")}</Button>
              <Button type="submit" variant="destructive" disabled={isPending} data-testid="button-confirm-rejection">
                {isPending && <EPLoader className="w-4 h-4 mr-1" />}<XCircle className="w-4 h-4 mr-1" />{t("reject")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
