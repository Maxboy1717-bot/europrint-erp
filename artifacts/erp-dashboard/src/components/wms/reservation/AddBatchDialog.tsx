/**
 * @module AddBatchDialog
 * @description React UI component.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TFunc } from "./types";
interface AddBatchDialogProps {
  t: TFunc;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  batchForm: {
    batchNumber: string;
    materialName: string;
    materialType: string;
    quantity: string;
    availableQuantity: string;
    unit: string;
    expiryDate: string;
    receivedDate: string;
    location: string;
    costPerUnit: string;
    qualityGrade: string;
  };
  setBatchForm: (form: { batchNumber: string; materialName: string; materialType: string; quantity: string; availableQuantity: string; unit: string; expiryDate: string; receivedDate: string; location: string; costPerUnit: string; qualityGrade: string }) => void;
  handleAddBatch: () => void;
  isPending: boolean;
}

export function AddBatchDialog({t,
  isOpen,
  onOpenChange,
  batchForm,
  setBatchForm,
  handleAddBatch,
  isPending,
}: AddBatchDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("Reservation.addBatchTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label>{t("Reservation.batchNumber")} *</Label>
              <Input
                value={batchForm.batchNumber}
                onChange={(e) => setBatchForm({ ...batchForm, batchNumber: e.target.value })}
                placeholder="BATCH-001"
                data-testid="input-new-batch-number"
              />
            </div>
            <div className="space-y-1">
          <Label>{t("materialType")}</Label>
              <Input
                value={batchForm.materialType}
                onChange={(e) => setBatchForm({ ...batchForm, materialType: e.target.value })}
                placeholder={t("Reservation.materialTypeExamplePlaceholder")}
                data-testid="input-new-batch-type"
              />
            </div>
          </div>

          <div className="space-y-1">
          <Label>{t("materialName")} *</Label>
            <Input
              value={batchForm.materialName}
              onChange={(e) => setBatchForm({ ...batchForm, materialName: e.target.value })}
              data-testid="input-new-batch-name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
          <Label>{t("quantity")} *</Label>
              <Input
                type="number"
                value={batchForm.quantity}
                onChange={(e) => setBatchForm({ ...batchForm, quantity: e.target.value, availableQuantity: e.target.value })}
                data-testid="input-new-batch-qty"
              />
            </div>
            <div className="space-y-1">
          <Label>{t("Reservation.aiPanelUnit")}</Label>
              <Select value={batchForm.unit} onValueChange={(v) => setBatchForm({ ...batchForm, unit: v })}>
                <SelectTrigger data-testid="select-new-batch-unit" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="m">m</SelectItem>
                  <SelectItem value="m2">m2</SelectItem>
                  <SelectItem value="dona">dona</SelectItem>
                  <SelectItem value="rulon">rulon</SelectItem>
                  <SelectItem value="list">{"list"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
          <Label>{t("Reservation.batchesGrade")}</Label>
              <Select value={batchForm.qualityGrade} onValueChange={(v) => setBatchForm({ ...batchForm, qualityGrade: v })}>
                <SelectTrigger data-testid="select-new-batch-grade" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label>{t("Reservation.batchesExpiry")}</Label>
              <Input
                type="date"
                value={batchForm.expiryDate}
                onChange={(e) => setBatchForm({ ...batchForm, expiryDate: e.target.value })}
                data-testid="input-new-batch-expiry"
              />
            </div>
            <div className="space-y-1">
          <Label>{t("Reservation.batchesReceived")}</Label>
              <Input
                type="date"
                value={batchForm.receivedDate}
                onChange={(e) => setBatchForm({ ...batchForm, receivedDate: e.target.value })}
                data-testid="input-new-batch-received"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label>{t("Reservation.batchesLocation")}</Label>
              <Input
                value={batchForm.location}
                onChange={(e) => setBatchForm({ ...batchForm, location: e.target.value })}
                placeholder="A-1-01"
                data-testid="input-new-batch-location"
              />
            </div>
            <div className="space-y-1">
          <Label>{t("Reservation.batchesCost")}</Label>
              <Input
                type="number"
                value={batchForm.costPerUnit}
                onChange={(e) => setBatchForm({ ...batchForm, costPerUnit: e.target.value })}
                data-testid="input-new-batch-cost"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleAddBatch} disabled={isPending} data-testid="button-save-batch">
            {t("Reservation.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
