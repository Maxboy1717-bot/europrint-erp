/**
 * @module HRZnoDialogs
 * @description Create and approve/reject dialogs for HRZnoPage.
 * Split from HRZnoPage.tsx (Rule 16).
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export interface ZnoCreateForm {
  purpose: string;
  amount: string;
  submitter_name: string;
  payment_date: string;
}

export interface ZnoActionDialog {
  id: string | number;
  type: "approve" | "reject";
}

interface CreateZnoDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: ZnoCreateForm;
  setForm: (fn: (prev: ZnoCreateForm) => ZnoCreateForm) => void;
  onCreate: () => void;
  isPending: boolean;
  t: (k: string) => string;
}

export function CreateZnoDialog({ open, onOpenChange, form, setForm, onCreate, isPending, t }: CreateZnoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiZnoArizasi")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>{t("maqsad")}</Label>
            <Textarea
              value={form.purpose}
              onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
              placeholder={t("naqdPulMaqsadi")}
              rows={3}
              data-testid="input-zno-purpose"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("miqdorSoM")}</Label>
            <Input
              type="number"
              min="0"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="1000000"
              data-testid="input-zno-amount"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("arizaBeruvchi")}</Label>
            <Input
              value={form.submitter_name}
              onChange={(e) => setForm((f) => ({ ...f, submitter_name: e.target.value }))}
              placeholder={t("ismFamilya")}
              data-testid="input-zno-submitter"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("tolovSanasi")}</Label>
            <Input
              type="date"
              value={form.payment_date}
              onChange={(e) => setForm((f) => ({ ...f, payment_date: e.target.value }))}
              data-testid="input-zno-payment-date"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("Bekor")}</Button>
          <Button
            onClick={onCreate}
            disabled={!form.purpose.trim() || !form.amount || isPending}
            data-testid="button-confirm-create-zno"
          >
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ActionZnoDialogProps {
  actionDialog: ZnoActionDialog | null;
  comment: string;
  setComment: (v: string) => void;
  onClose: () => void;
  onAction: () => void;
  isPending: boolean;
  t: (k: string) => string;
}

export function ActionZnoDialog({ actionDialog, comment, setComment, onClose, onAction, isPending, t }: ActionZnoDialogProps) {
  return (
    <Dialog
      open={!!actionDialog}
      onOpenChange={(open) => { if (!open) onClose(); }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">
            {actionDialog?.type === "approve" ? "ZNO ni tasdiqlash" : "ZNO ni rad etish"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>{t("izohIxtiyoriy")}</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("izoh1")}
              rows={3}
              data-testid="input-action-comment"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("Bekor")}</Button>
          <Button
            variant={actionDialog?.type === "approve" ? "default" : "destructive"}
            onClick={onAction}
            disabled={isPending}
            data-testid="button-confirm-action"
          >
            {isPending ? "Yuklanmoqda..." : actionDialog?.type === "approve" ? "Tasdiqlash" : "Rad etish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
