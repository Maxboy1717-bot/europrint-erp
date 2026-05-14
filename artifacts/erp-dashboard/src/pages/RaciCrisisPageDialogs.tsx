/**
 * @module RaciCrisisPageDialogs
 * @description Dialog components for RaciCrisisPage.
 */

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TaskFormState } from "./RaciCrisisPageTypes";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// CreateTaskDialog
// ---------------------------------------------------------------------------

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: TaskFormState;
  onFormChange: (updater: (prev: TaskFormState) => TaskFormState) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  onConfirm,
  isPending,
}: CreateTaskDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiRaciVazifa")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>{t("vazifaNomi1")}</Label>
            <Input
              value={form.title}
              onChange={e => onFormChange(f => ({ ...f, title: e.target.value }))}
              placeholder={t("vazifaNomi")}
              data-testid="input-task-title"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("javobgarId")}</Label>
              <Input
                value={form.responsible_id}
                onChange={e => onFormChange(f => ({ ...f, responsible_id: e.target.value }))}
                placeholder={t("xodimId")}
                data-testid="input-task-responsible"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("masulId")}</Label>
              <Input
                value={form.accountable_id}
                onChange={e => onFormChange(f => ({ ...f, accountable_id: e.target.value }))}
                placeholder={t("xodimId")}
                data-testid="input-task-accountable"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("muddat")}</Label>
            <Input
              type="date"
              value={form.deadline}
              onChange={e => onFormChange(f => ({ ...f, deadline: e.target.value }))}
              data-testid="input-task-deadline"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("progress.description")}</Label>
            <Textarea
              value={form.description}
              onChange={e => onFormChange(f => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder={t("vazifaTavsifi1")}
              data-testid="input-task-description"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("Bekor")}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!form.title.trim() || isPending}
            data-testid="button-confirm-create-task"
          >
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
