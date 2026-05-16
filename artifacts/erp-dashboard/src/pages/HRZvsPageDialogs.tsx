/**
 * @module HRZvsPageDialogs
 * @description Dialog components for HRZvsPage (create + approve/reject).
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { ZvsFormState, ActionDialogState } from "./HRZvsPageTypes";
import { PRIORITY_MAP } from "./HRZvsPageTypes";
import { useTranslation } from '@/lib/i18n';

// ── CreateZvsDialog ───────────────────────────────────────────────────────────

interface CreateZvsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ZvsFormState;
  onFormChange: (patch: Partial<ZvsFormState>) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function CreateZvsDialog({
  open, onOpenChange, form, onFormChange, onSubmit, isPending,
}: CreateZvsDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiZvsArizasi")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>{t("maqsad")}</Label>
            <Textarea
              value={form.purpose}
              onChange={(e) => onFormChange({ purpose: e.target.value })}
              placeholder={t("xarajatMaqsadi")}
              rows={3}
              data-testid="input-zvs-purpose"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("miqdorSoM")}</Label>
            <Input
              type="number"
              min="0"
              value={form.amount}
              onChange={(e) => onFormChange({ amount: e.target.value })}
              placeholder="1000000"
              data-testid="input-zvs-amount"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("arizaBeruvchi")}</Label>
              <Input
                value={form.submitter_name}
                onChange={(e) => onFormChange({ submitter_name: e.target.value })}
                placeholder={t("ismFamilya")}
                data-testid="input-zvs-submitter"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("priority")}</Label>
              <Select value={form.priority} onValueChange={(v) => onFormChange({ priority: v })}>
                <SelectTrigger data-testid="select-zvs-priority" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_MAP).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("haftaSanasi")}</Label>
            <Input
              type="date"
              value={form.week_date}
              onChange={(e) => onFormChange({ week_date: e.target.value })}
              data-testid="input-zvs-week-date"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("Bekor")}</Button>
          <Button
            onClick={onSubmit}
            disabled={!form.purpose.trim() || !form.amount || isPending}
            data-testid="button-confirm-create-zvs"
          >
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── ActionZvsDialog ───────────────────────────────────────────────────────────

interface ActionZvsDialogProps {
  actionDialog: ActionDialogState | null;
  comment: string;
  onCommentChange: (v: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function ActionZvsDialog({
  actionDialog, comment, onCommentChange, onClose, onConfirm, isPending,
}: ActionZvsDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog
      open={!!actionDialog}
      onOpenChange={(open) => { if (!open) onClose(); }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold"> {actionDialog?.type === "approve" ? "ZVS ni tasdiqlash" : "ZVS ni rad etish"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>{t("izohIxtiyoriy")}</Label>
            <Textarea
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
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
