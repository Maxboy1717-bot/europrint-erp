/**
 * @module RoutingConfigurationCreateDialog
 * @description CreateRoutingDialog — form dialog for creating a new routing.
 * Extracted to keep RoutingConfigurationDialogs.tsx under 300 lines.
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
import { type RoutingFormState, type Product } from "./RoutingConfigurationTypes";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CreateRoutingLabels {
  title: string;
  description: string;
  routingNumber: string;
  product: string;
  version: string;
  status: string;
  effectiveFrom: string;
  draft: string;
  active: string;
  obsolete: string;
  cancel: string;
  save: string;
  saving: string;
  select: string;
}

interface CreateRoutingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: RoutingFormState;
  onFormChange: (form: RoutingFormState) => void;
  products: Product[];
  isPending: boolean;
  onSubmit: () => void;
  labels: CreateRoutingLabels;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreateRoutingDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  products,
  isPending,
  onSubmit,
  labels,
}: CreateRoutingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-create-routing" className="p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label>{labels.routingNumber} *</Label>
              <Input
                value={form.routingNumber}
                onChange={(e) => onFormChange({ ...form, routingNumber: e.target.value })}
                placeholder="RTG-001"
                data-testid="input-routing-number"
              />
            </div>
            <div className="space-y-1">
          <Label>{labels.product} *</Label>
              <Select
                value={form.productId}
                onValueChange={(val) => onFormChange({ ...form, productId: val })}
              >
                <SelectTrigger data-testid="select-product" className="h-9">
                  <SelectValue placeholder={labels.select} />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(products) ? products : []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
          <Label>{labels.version}</Label>
              <Input
                value={form.version}
                onChange={(e) => onFormChange({ ...form, version: e.target.value })}
                data-testid="input-version"
              />
            </div>
            <div className="space-y-1">
          <Label>{labels.status}</Label>
              <Select
                value={form.status}
                onValueChange={(val) => onFormChange({ ...form, status: val })}
              >
                <SelectTrigger data-testid="select-status" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{labels.draft}</SelectItem>
                  <SelectItem value="active">{labels.active}</SelectItem>
                  <SelectItem value="obsolete">{labels.obsolete}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
          <Label>{labels.effectiveFrom}</Label>
              <Input
                type="date"
                value={form.effectiveFrom}
                onChange={(e) => onFormChange({ ...form, effectiveFrom: e.target.value })}
                data-testid="input-effective-date"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel"
          >
            {labels.cancel}
          </Button>
          <Button onClick={onSubmit} disabled={isPending} data-testid="button-submit">
            {isPending ? labels.saving : labels.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
