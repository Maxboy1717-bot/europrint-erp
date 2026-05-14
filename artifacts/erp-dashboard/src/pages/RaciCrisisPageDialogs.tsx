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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Yangi RACI vazifa</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Vazifa nomi *</Label>
            <Input
              value={form.title}
              onChange={e => onFormChange(f => ({ ...f, title: e.target.value }))}
              placeholder="Vazifa nomi"
              data-testid="input-task-title"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Javobgar ID</Label>
              <Input
                value={form.responsible_id}
                onChange={e => onFormChange(f => ({ ...f, responsible_id: e.target.value }))}
                placeholder="Xodim ID"
                data-testid="input-task-responsible"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mas'ul ID</Label>
              <Input
                value={form.accountable_id}
                onChange={e => onFormChange(f => ({ ...f, accountable_id: e.target.value }))}
                placeholder="Xodim ID"
                data-testid="input-task-accountable"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Muddat</Label>
            <Input
              type="date"
              value={form.deadline}
              onChange={e => onFormChange(f => ({ ...f, deadline: e.target.value }))}
              data-testid="input-task-deadline"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tavsif</Label>
            <Textarea
              value={form.description}
              onChange={e => onFormChange(f => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="Vazifa tavsifi..."
              data-testid="input-task-description"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor
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
