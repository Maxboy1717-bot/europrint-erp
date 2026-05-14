/**
 * @module RoutingConfigurationDialogs
 * @description Barrel re-exporting all Routing Configuration dialogs for
 * convenient single-import usage, plus the AddOperationDialog implementation.
 * - CreateRoutingDialog  → RoutingConfigurationCreateDialog.tsx
 * - ManageOperationsDialog → RoutingConfigurationManageDialog.tsx
 * - AddOperationDialog   → this file
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type OperationFormState, type WorkCenter } from "./RoutingConfigurationTypes";

// Barrel re-exports so callers use a single import path
export { CreateRoutingDialog } from "./RoutingConfigurationCreateDialog";
export type { CreateRoutingLabels } from "./RoutingConfigurationCreateDialog";
export { ManageOperationsDialog } from "./RoutingConfigurationManageDialog";
export type { ManageOperationsLabels } from "./RoutingConfigurationManageDialog";

// ---------------------------------------------------------------------------
// AddOperationDialog
// ---------------------------------------------------------------------------

export interface AddOperationLabels {
  title: string;
  description: string;
  operationNumber: string;
  operationName: string;
  workCenter: string;
  sequence: string;
  setupTime: string;
  machineTime: string;
  laborTime: string;
  descriptionLabel: string;
  additionalInfo: string;
  cancel: string;
  save: string;
  saving: string;
  select: string;
}

interface AddOperationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: OperationFormState;
  onFormChange: (form: OperationFormState) => void;
  workCenters: WorkCenter[];
  isPending: boolean;
  onSubmit: () => void;
  labels: AddOperationLabels;
}

export function AddOperationDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  workCenters,
  isPending,
  onSubmit,
  labels,
}: AddOperationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-add-operation" className="p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label>{labels.operationNumber} *</Label>
              <Input
                value={form.operationNumber}
                onChange={(e) => onFormChange({ ...form, operationNumber: e.target.value })}
                placeholder="OP-010"
                data-testid="input-operation-number"
              />
            </div>
            <div className="space-y-1">
          <Label>{labels.operationName} *</Label>
              <Input
                value={form.operationName}
                onChange={(e) => onFormChange({ ...form, operationName: e.target.value })}
                placeholder="Kesish"
                data-testid="input-operation-name"
              />
            </div>
          </div>

          <div className="space-y-1">
          <Label>{labels.workCenter} *</Label>
            <Select
              value={form.workCenterId}
              onValueChange={(val) => onFormChange({ ...form, workCenterId: val })}
            >
              <SelectTrigger data-testid="select-work-center" className="h-9">
                <SelectValue placeholder={labels.select} />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(workCenters) ? workCenters : []).map((wc) => (
                  <SelectItem key={wc.id} value={wc.id}>
                    {wc.name} ({wc.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
          <Label>{labels.sequence}</Label>
              <Input
                type="number"
                value={form.sequence}
                onChange={(e) =>
                  onFormChange({ ...form, sequence: parseInt(e.target.value) })
                }
                data-testid="input-sequence"
              />
            </div>
            <div className="space-y-1">
          <Label>{labels.setupTime}</Label>
              <Input
                type="number"
                step="0.1"
                value={form.setupTime}
                onChange={(e) =>
                  onFormChange({ ...form, setupTime: parseFloat(e.target.value) })
                }
                data-testid="input-setup-time"
              />
            </div>
            <div className="space-y-1">
          <Label>{labels.machineTime}</Label>
              <Input
                type="number"
                step="0.1"
                value={form.machineTime}
                onChange={(e) =>
                  onFormChange({ ...form, machineTime: parseFloat(e.target.value) })
                }
                data-testid="input-machine-time"
              />
            </div>
            <div className="space-y-1">
          <Label>{labels.laborTime}</Label>
              <Input
                type="number"
                step="0.1"
                value={form.laborTime}
                onChange={(e) =>
                  onFormChange({ ...form, laborTime: parseFloat(e.target.value) })
                }
                data-testid="input-labor-time"
              />
            </div>
          </div>

          <div className="space-y-1">
          <Label>{labels.descriptionLabel}</Label>
            <Input
              value={form.description}
              onChange={(e) => onFormChange({ ...form, description: e.target.value })}
              placeholder={labels.additionalInfo}
              data-testid="input-description"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-operation"
          >
            {labels.cancel}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isPending}
            data-testid="button-submit-operation"
          >
            {isPending ? labels.saving : labels.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
