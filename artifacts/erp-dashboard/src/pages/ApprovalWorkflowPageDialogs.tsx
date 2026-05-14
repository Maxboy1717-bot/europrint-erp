/**
 * @module ApprovalWorkflowPageDialogs
 * @description Create and approve/reject dialogs for ApprovalWorkflowPage.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { WorkflowForm } from "./ApprovalWorkflowPageTypes";

import { useTranslation } from '@/lib/i18n';
/* ------------------------------------------------------------------ */
/* Create dialog                                                        */
/* ------------------------------------------------------------------ */

interface CreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: WorkflowForm;
  onFormChange: (updater: (f: WorkflowForm) => WorkflowForm) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function CreateWorkflowDialog({open,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
  isPending,
}: CreateDialogProps) {
  const { t } = useTranslation('common');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiTasdiqlashSorovi")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("hujjatTuri1")}</Label>
              <Input
                value={form.documentType}
                onChange={e => onFormChange(f => ({ ...f, documentType: e.target.value }))}
                placeholder={t('invoiceContract')}
                data-testid="input-workflow-doc-type"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("hujjatId")}</Label>
              <Input
                value={form.documentId}
                onChange={e => onFormChange(f => ({ ...f, documentId: e.target.value }))}
                placeholder="INV-001"
                data-testid="input-workflow-doc-id"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("quantity")}</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={e => onFormChange(f => ({ ...f, amount: e.target.value }))}
                placeholder="1000000"
                data-testid="input-workflow-amount"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("yuboruvchi")}</Label>
              <Input
                value={form.requestedBy}
                onChange={e => onFormChange(f => ({ ...f, requestedBy: e.target.value }))}
                placeholder={t("ismFamilya")}
                data-testid="input-workflow-requester"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("Izoh")}</Label>
            <Textarea
              value={form.notes}
              onChange={e => onFormChange(f => ({ ...f, notes: e.target.value }))}
              placeholder={t("qoshimchaIzoh")}
              rows={2}
              data-testid="input-workflow-notes"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("Bekor")}</Button>
          <Button
            onClick={onSubmit}
            disabled={
              !form.documentType.trim() ||
              !form.documentId.trim() ||
              !form.requestedBy.trim() ||
              isPending
            }
            data-testid="button-confirm-create-workflow"
          >
            {isPending ? "Yuklanmoqda..." : "Yuborish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Approve / Reject dialog                                              */
/* ------------------------------------------------------------------ */

interface ActionDialogProps {
  actionDialog: { id: string; type: "approve" | "reject" } | null;
  reason: string;
  onReasonChange: (v: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function ActionWorkflowDialog({
  actionDialog,
  reason,
  onReasonChange,
  onClose,
  onConfirm,
  isPending,
}: ActionDialogProps) {
  return (
    <Dialog
      open={!!actionDialog}
      onOpenChange={open => { if (!open) onClose(); }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold"> {actionDialog?.type === "approve" ? "Tasdiqlash" : "Rad etish"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>
              {actionDialog?.type === "approve" ? "Izoh (ixtiyoriy)" : "Sabab *"}
            </Label>
            <Textarea
              value={reason}
              onChange={e => onReasonChange(e.target.value)}
              placeholder={
                actionDialog?.type === "approve"
                  ? "Izoh..."
                  : "Rad etish sababini kiriting..."
              }
              rows={3}
              data-testid="input-action-reason"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("Bekor")}</Button>
          <Button
            variant={actionDialog?.type === "approve" ? "default" : "destructive"}
            onClick={onConfirm}
            disabled={isPending}
            data-testid="button-confirm-action"
          >
            {isPending
              ? "Yuklanmoqda..."
              : actionDialog?.type === "approve"
                ? "Tasdiqlash"
                : "Rad etish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
