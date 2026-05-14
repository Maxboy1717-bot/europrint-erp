/**
 * @module HRSuccessionPlanningDialogs
 * @description Dialog components for HRSuccessionPlanning page.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import type { NewPlanForm } from "./HRSuccessionPlanningTypes";

interface NewPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: NewPlanForm;
  onFormChange: (updater: (f: NewPlanForm) => NewPlanForm) => void;
  isPending: boolean;
  onSubmit: () => void;
}

export function NewPlanDialog({
  open, onOpenChange, form, onFormChange, isPending, onSubmit,
}: NewPlanDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-add-plan">
          <Plus className="h-4 w-4 mr-1" /> Yangi Reja
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Yangi Vorislik Rejasi</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Xodim ID</Label>
            <Input
              data-testid="input-plan-user-id"
              value={form.userId}
              onChange={e => onFormChange(f => ({ ...f, userId: e.target.value }))}
              placeholder="Xodim ID si"
            />
          </div>
          <div>
            <Label>Maqsad Sana</Label>
            <Input
              data-testid="input-plan-target-date"
              type="date"
              value={form.targetDate}
              onChange={e => onFormChange(f => ({ ...f, targetDate: e.target.value }))}
            />
          </div>
          <div>
            <Label>Izoh</Label>
            <Textarea
              data-testid="input-plan-notes"
              value={form.notes}
              onChange={e => onFormChange(f => ({ ...f, notes: e.target.value }))}
              placeholder="Reja haqida izoh..."
            />
          </div>
          <Button
            data-testid="button-submit-plan"
            className="w-full"
            disabled={!form.userId || isPending}
            onClick={onSubmit}
          >
            Saqlash
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
