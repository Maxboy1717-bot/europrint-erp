/** @module MESExtendedDialogs @description Dialog and form components for the MES Extended page. */

import { type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { type MESMachine, type MaintFormValues } from "./MESExtendedTypes";

// ─── Props ───────────────────────────────────────────────────────────────────

interface MaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<MaintFormValues>;
  machines: MESMachine[];
  isPending: boolean;
  onSubmit: (data: MaintFormValues) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Dialog for creating a new maintenance request.
 * Controlled externally via `open` / `onOpenChange`.
 */
export function MaintenanceDialog({
  open,
  onOpenChange,
  form,
  machines,
  isPending,
  onSubmit,
}: MaintenanceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Texnik Xizmat So'rovi</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Machine selector */}
          <div className="space-y-1">
          <Label>Stanoq</Label>
            <Select onValueChange={v => form.setValue("machineId", v)}>
              <SelectTrigger data-testid="select-machine" className="h-9">
                <SelectValue placeholder="Stanoq tanlang" />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(machines) ? machines : []).map((m: MESMachine) => (
                  <SelectItem key={String(m.id)} value={String(m.id)}>
                    {m.name || String(m.id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Issue description */}
          <div className="space-y-1">
          <Label>Muammo tavsifi</Label>
            <Input
              {...form.register("issue")}
              data-testid="input-maintenance-issue"
            />
          </div>

          {/* Priority selector */}
          <div className="space-y-1">
          <Label>Ustuvorlik</Label>
            <Select defaultValue="medium" onValueChange={v => form.setValue("priority", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Past</SelectItem>
                <SelectItem value="medium">O'rta</SelectItem>
                <SelectItem value="high">Kritik</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Bekor
            </Button>
            <Button type="submit" disabled={isPending}>
              Yuborish
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
