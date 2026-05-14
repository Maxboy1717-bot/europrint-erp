/** @module DocumentWorkflowPageDetail @description DocDetailTab component — renders the document metadata card, approval steps, and version history for a selected document. */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { WorkflowDoc, DocDetail, STATUS_COLORS, STATUS_LABEL_KEYS } from "./DocumentWorkflowPageTypes";
import { DeadlineBadge, docTypeLabel } from "./DocumentWorkflowPageHelpers";
import { useTranslation } from '@/lib/i18n';

type TFn = (key: string) => string;

export interface DocDetailTabProps {
  selectedDoc: WorkflowDoc;
  docDetail: DocDetail;
  approveNotes: string;
  rejectReasons: Record<number, string>;
  approveIsPending: boolean;
  rejectIsPending: boolean;
  t: TFn;
  onApproveNotesChange: (v: string) => void;
  onApprove: (stepId: number) => void;
  onRejectSubmit: (stepId: number, reason: string) => void;
  onRejectReasonChange: (stepId: number, value: string) => void;
}

export function DocDetailTab({
  docDetail, approveNotes, rejectReasons,
  approveIsPending, rejectIsPending, t,
  onApproveNotesChange, onApprove, onRejectSubmit, onRejectReasonChange,
}: DocDetailTabProps) {
  const { t } = useTranslation("common");
  const doc = docDetail.document;

  return (
    <TabsContent value="detail" className="mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Document meta */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center justify-between flex-wrap gap-2">
              <span>{doc?.doc_number}</span>
              <div className="flex gap-2 items-center">
                <Badge className={`${STATUS_COLORS[doc?.status ?? ""] ?? "bg-muted"} text-white`}>
                  {doc?.status ? t(STATUS_LABEL_KEYS[doc.status] ?? doc.status) : "—"}
                </Badge>
                {doc?.is_immutable && <Badge className="bg-[var(--ep-purple)] text-white">{t("ozgarmas")}</Badge>}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-muted-foreground text-xs">{t("docTitleLabel")}</div>
              <div className="text-foreground font-semibold">{doc?.title}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">{t("documentType")}</div>
              <div className="text-foreground">{doc?.doc_type ? docTypeLabel(doc.doc_type, t) : "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">{t("createdBy")}</div>
              <div className="text-foreground">{doc?.creator_name}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">{t("createdAt")}</div>
              <div className="text-foreground">
                {doc?.created_at ? new Date(doc.created_at).toLocaleString() : "—"}
              </div>
            </div>
            {doc?.rejection_reason && (
              <div>
                <div className="text-red-400 text-xs">{t("rejectionReason")}</div>
                <div className="text-red-300 text-sm">{doc.rejection_reason}</div>
              </div>
            )}
            {doc?.is_immutable && <Badge className="bg-[var(--ep-purple)] text-white">{t("immutableDoc")}</Badge>}
          </CardContent>
        </Card>

        {/* Approval steps */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-base">{t("approvalSteps")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(Array.isArray(docDetail.steps) ? docDetail.steps : []).map((step, idx) => (
                <div key={step.id} className="flex gap-3 items-start">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                    ${step.status === "approved" ? "bg-[var(--ep-green)] text-white" :
                      step.status === "rejected" ? "bg-[var(--ep-red)] text-white" :
                      step.status === "pending"  ? "bg-[var(--ep-yellow)] text-white" : "bg-muted text-muted-foreground"}`}>
                    {step.status === "approved" ? "✓" : step.status === "rejected" ? "✗" : idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-foreground text-sm font-medium flex items-center gap-2 flex-wrap">
                      {step.assignee_name || step.assignee_role || t("reviewer")}
                      {step.status === "unassigned" && <Badge className="bg-[var(--ep-primary)] text-white text-xs">{t("tayinlanmagan1")}</Badge>}
                      {step.escalated_at && <Badge className="bg-red-900 text-white text-xs">{t("eskalatsiyaQilindi")}</Badge>}
                      {step.reminder_1_sent && !step.reminder_2_sent && <Badge className="bg-yellow-800 text-white text-xs">📨 1-eslatma</Badge>}
                      {step.reminder_2_sent && !step.escalated_at && <Badge className="bg-orange-800 text-white text-xs">📨📨 2-eslatma</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>Muddati: {step.deadline_at ? new Date(step.deadline_at).toLocaleString() : "—"}</span>
                      <DeadlineBadge deadlineAt={step.deadline_at} />
                    </div>
                    {step.notes && (
                      <div className="text-xs text-muted-foreground mt-0.5 bg-muted rounded p-1">"{step.notes}"</div>
                    )}
                    {step.action_by_name && step.action_at && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {step.action_by_name} · {new Date(step.action_at).toLocaleString()}
                      </div>
                    )}
                    {step.status === "pending" && (
                      <div className="space-y-2 mt-2" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <Input value={approveNotes} onChange={e => onApproveNotesChange(e.target.value)}
                            placeholder={t("commentOptional")}
                            className="bg-input border-border text-xs h-7 flex-1" />
                          <Button size="sm" onClick={() => onApprove(step.id)} disabled={approveIsPending}
                            className="bg-[var(--ep-green)] hover:bg-[var(--ep-green)]/90 text-white text-xs h-7 px-2">
                            ✅ {t("btnApprove")}
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={rejectReasons[step.id] ?? ""}
                            onChange={e => onRejectReasonChange(step.id, e.target.value)}
                            placeholder="Rad etish sababi (majburiy) *"
                            className="bg-input border-red-700 text-xs h-7 flex-1"
                          />
                          <Button size="sm"
                            onClick={() => onRejectSubmit(step.id, rejectReasons[step.id] ?? "")}
                            disabled={!rejectReasons[step.id]?.trim() || rejectIsPending}
                            className="bg-[var(--ep-red)] hover:bg-[var(--ep-red)]/90 text-white text-xs h-7 px-2">
                            ❌ {t("btnReject")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {(!docDetail.steps || docDetail.steps.length === 0) && (
                <div className="text-muted-foreground text-sm text-center py-4">
                  {t("tasdiqlashBosqichiYoqAvtomatikTasdiqlangan")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Version history */}
        {Array.isArray(docDetail.versions) && docDetail.versions.length > 0 && (
          <Card className="bg-card border-border md:col-span-2">
            <CardHeader>
              <CardTitle className="text-foreground text-base">{t("versiyaTarixi")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {docDetail.versions.map((v) => (
                  <div key={v.id} className="flex items-center gap-3 text-sm border-b border-border pb-2">
                    <Badge className="bg-muted text-muted-foreground shrink-0">v{v.version}</Badge>
                    <span className="text-foreground">{v.changed_by_name || "Noma'lum"}</span>
                    <span className="text-muted-foreground text-xs">{new Date(v.created_at).toLocaleString()}</span>
                    {v.change_reason && <span className="text-muted-foreground text-xs">— {v.change_reason}</span>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </TabsContent>
  );
}
