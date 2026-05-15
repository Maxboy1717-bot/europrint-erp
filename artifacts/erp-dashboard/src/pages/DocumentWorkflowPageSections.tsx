/** @module DocumentWorkflowPageSections @description Section-level components for the DocumentWorkflow page: CreateDocumentForm, PendingApprovalsTab, and MyDocumentsTab. DocDetailTab lives in DocumentWorkflowPageDetail. */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import {
  PendingStep, WorkflowDoc, CreateDocForm,
  STATUS_COLORS, STATUS_LABEL_KEYS, DOC_TYPES_KEYS,
} from "./DocumentWorkflowPageTypes";
import { DeadlineBadge, docTypeLabel } from "./DocumentWorkflowPageHelpers";

type TFn = (key: string) => string;

// ---------------------------------------------------------------------------
// PendingApprovalsTab
// ---------------------------------------------------------------------------

interface PendingApprovalsTabProps {
  pending: PendingStep[] | undefined;
  rejectReasons: Record<number, string>;
  approveIsPending: boolean;
  rejectIsPending: boolean;
  t: TFn;
  onSelectDoc: (doc: Partial<WorkflowDoc>) => void;
  onApprove: (stepId: number) => void;
  onRejectStart: (stepId: number) => void;
  onRejectSubmit: (stepId: number, reason: string) => void;
  onRejectCancel: (stepId: number) => void;
  onRejectReasonChange: (stepId: number, value: string) => void;
}

export function PendingApprovalsTab({ pending, rejectReasons, approveIsPending, rejectIsPending, t, onSelectDoc, onApprove, onRejectStart, onRejectSubmit, onRejectCancel, onRejectReasonChange, }: PendingApprovalsTabProps) {
  return (
    <TabsContent value="pending" className="mt-4">
      <div className="space-y-3">
        {(Array.isArray(pending) ? pending : []).map((step) => (
          <Card
            key={step.id}
            className="bg-card border-border hover:border-border cursor-pointer"
            onClick={() => onSelectDoc({ id: step.document_id, doc_number: step.doc_number } as WorkflowDoc)}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground truncate">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.doc_number} · {step.creator_name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                    <span>{t("deadline")}: {step.deadline_at ? new Date(step.deadline_at).toLocaleString() : "—"}</span>
                    <DeadlineBadge deadlineAt={step.deadline_at} />
                  </div>
                </div>
                <Badge className={`${STATUS_COLORS[step.doc_status] ?? "bg-muted"} text-white`}>
                  {docTypeLabel(step.doc_type, t)}
                </Badge>
                <div className="flex gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                  <Button size="sm" onClick={() => onApprove(step.id)}
                    disabled={approveIsPending}
                    className="bg-[var(--ep-green)] hover:bg-[var(--ep-green)]/90 text-white text-xs">
                    {t("btnApprove")}
                  </Button>
                  <Button size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      if (rejectReasons[step.id] === undefined) {
                        onRejectStart(step.id);
                      } else {
                        onRejectSubmit(step.id, rejectReasons[step.id]);
                      }
                    }}
                    disabled={rejectIsPending}
                    className="bg-[var(--ep-red)] hover:bg-[var(--ep-red)]/90 text-white text-xs">
                    {t("btnReject")}
                  </Button>
                </div>
              </div>

              {rejectReasons[step.id] !== undefined && (
                <div className="flex gap-2 items-center" onClick={e => e.stopPropagation()}>
                  <Input
                    value={rejectReasons[step.id]}
                    onChange={e => onRejectReasonChange(step.id, e.target.value)}
                    placeholder="Rad etish sababi (majburiy) *"
                    className="bg-input border-red-600 text-xs h-8 flex-1"
                    autoFocus
                  />
                  <Button size="sm"
                    onClick={() => onRejectSubmit(step.id, rejectReasons[step.id])}
                    disabled={!rejectReasons[step.id]?.trim() || rejectIsPending}
                    className="bg-[var(--ep-red)] hover:bg-[var(--ep-red)]/90 text-white text-xs h-8 px-3">
                    {t("radEt")}
                  </Button>
                  <Button size="sm" variant="ghost"
                    onClick={() => onRejectCancel(step.id)}
                    className="text-muted-foreground text-xs h-8 px-2">
                    {t("Bekor")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {(!pending || pending.length === 0) && (
          <div className="text-center py-12 text-[13px] text-muted-foreground">
            <div className="text-4xl mb-3">✅</div>
            <p>{t("noPendingDocs")}</p>
          </div>
        )}
      </div>
    </TabsContent>
  );
}

// ---------------------------------------------------------------------------
// MyDocumentsTab
// ---------------------------------------------------------------------------

interface MyDocumentsTabProps {
  myDocs: WorkflowDoc[] | undefined;
  t: TFn;
  onSelectDoc: (doc: WorkflowDoc) => void;
  onCreateClick: () => void;
}

export function MyDocumentsTab({ myDocs, t, onSelectDoc, onCreateClick }: MyDocumentsTabProps) {
  return (
    <TabsContent value="my" className="mt-4">
      <div className="space-y-3">
        {(Array.isArray(myDocs) ? myDocs : []).map((doc) => (
          <Card
            key={doc.id}
            className="bg-card border-border hover:border-border cursor-pointer"
            onClick={() => onSelectDoc(doc)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground truncate">{doc.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {doc.doc_number} · {new Date(doc.created_at).toLocaleDateString()} · {docTypeLabel(doc.doc_type, t)}
                  </div>
                </div>
                <Badge className={`${STATUS_COLORS[doc.status] ?? "bg-muted"} text-white text-xs`}>
                  {t(STATUS_LABEL_KEYS[doc.status] ?? doc.status)}
                </Badge>
                {doc.total_steps > 0 && (
                  <div className="text-xs text-muted-foreground shrink-0">
                    {doc.approved_steps || 0}/{doc.total_steps} {t("stepsUnit")}
                  </div>
                )}
                {doc.is_immutable && (
                  <Badge className="bg-purple-800 text-white text-xs shrink-0">{t("ozgarmas")}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {(!myDocs || myDocs.length === 0) && (
          <div className="text-center py-12 text-[13px] text-muted-foreground">
            <div className="text-4xl mb-3">📄</div>
            <p>{t("noDocuments")}</p>
            <Button onClick={onCreateClick} className="mt-4 bg-primary hover:bg-primary/90 text-white text-sm">
              ➕ {t("createFirstDoc")}
            </Button>
          </div>
        )}
      </div>
    </TabsContent>
  );
}

// ---------------------------------------------------------------------------
// CreateDocumentForm
// ---------------------------------------------------------------------------

interface CreateDocumentFormProps {
  form: CreateDocForm;
  empId: number;
  createIsPending: boolean;
  t: TFn;
  tCommon: TFn;
  onFormChange: (patch: Partial<CreateDocForm>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function CreateDocumentForm({
  form, createIsPending, t, tCommon, onFormChange, onSubmit, onCancel,
}: CreateDocumentFormProps) {
  return (
    <Card className="bg-card border-primary max-w-2xl">
      <CardHeader>
        <CardTitle className="text-foreground">{t("createDocument")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-muted-foreground">{t("documentType")} *</Label>
          <Select value={form.doc_type} onValueChange={v => onFormChange({ doc_type: v })}>
            <SelectTrigger className="bg-input border-border mt-1 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DOC_TYPES_KEYS.map(dt => (
                <SelectItem key={dt.value} value={dt.value}>{t(dt.key)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-muted-foreground">{t("documentTitle")} *</Label>
          <Input value={form.title} onChange={e => onFormChange({ title: e.target.value })}
            placeholder={t("documentTitle") + "..."} className="bg-input border-border mt-1" />
        </div>
        <div>
          <Label className="text-muted-foreground">{t("documentContent")}</Label>
          <Textarea value={form.content} onChange={e => onFormChange({ content: e.target.value })}
            placeholder={t("docContentPlaceholder")} className="bg-input border-border mt-1 min-h-24" />
        </div>
        <div className="flex gap-2">
          <Button onClick={onSubmit} disabled={!form.title || createIsPending}
            className="bg-primary hover:bg-primary/90 text-white">
            {createIsPending ? t("creatingDoc") : t("btnSubmit")}
          </Button>
          <Button onClick={onCancel} variant="outline" className="border-border text-muted-foreground">
            {tCommon("cancel")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
