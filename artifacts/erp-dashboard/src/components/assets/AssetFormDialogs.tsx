/**
 * @module AssetFormDialogs
 * @description React UI component.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import type { AssetInventoryItem, MaintenanceRecord } from "@/components/assets/types";
import { depreciationMethodLabels, assetTypeLabels } from "@/components/assets/helpers";

export interface AssetForm {
  assetCode: string; assetName: string; assetNameRu: string; assetType: string;
  location: string; purchaseDate: string; purchaseValue: number; currentValue: number;
  usefulLife: number; salvageValue: number; depreciationMethod: string; condition: string;
  serialNumber: string; notes: string;
}

export interface MaintenanceForm {
  assetId: number; maintenanceType: string; scheduledDate: string;
  technicianName: string; cost: number; description: string; notes: string;
}

export interface CompleteMaintenanceForm {
  completedDate: string; nextMaintenanceDate: string; notes: string;
}

interface AssetFormDialogsProps {
  selectedAsset: AssetInventoryItem | null;
  selectedMaintenance: MaintenanceRecord | null;

  isCreateAssetOpen: boolean; setIsCreateAssetOpen: (v: boolean) => void;
  assetForm: AssetForm; setAssetForm: React.Dispatch<React.SetStateAction<AssetForm>>;
  createAssetMutation: { mutate: (d: AssetForm) => void; isPending: boolean };

  isDepreciateOpen: boolean; setIsDepreciateOpen: (v: boolean) => void;
  depreciateMutation: { mutate: (id: number) => void; isPending: boolean };

  isMaintenanceOpen: boolean; setIsMaintenanceOpen: (v: boolean) => void;
  maintenanceForm: MaintenanceForm; setMaintenanceForm: React.Dispatch<React.SetStateAction<MaintenanceForm>>;
  createMaintenanceMutation: { mutate: (d: MaintenanceForm) => void; isPending: boolean };

  isCompleteMaintenanceOpen: boolean; setIsCompleteMaintenanceOpen: (v: boolean) => void;
  completeMaintenanceForm: CompleteMaintenanceForm;
  setCompleteMaintenanceForm: React.Dispatch<React.SetStateAction<CompleteMaintenanceForm>>;
  completeMaintenanceMutation: { mutate: (args: { id: number; data: CompleteMaintenanceForm }) => void; isPending: boolean };
}

export function AssetFormDialogs({
  selectedAsset, selectedMaintenance,
  isCreateAssetOpen, setIsCreateAssetOpen, assetForm, setAssetForm, createAssetMutation,
  isDepreciateOpen, setIsDepreciateOpen, depreciateMutation,
  isMaintenanceOpen, setIsMaintenanceOpen, maintenanceForm, setMaintenanceForm, createMaintenanceMutation,
  isCompleteMaintenanceOpen, setIsCompleteMaintenanceOpen, completeMaintenanceForm, setCompleteMaintenanceForm, completeMaintenanceMutation,
}: AssetFormDialogsProps) {
  const { t } = useTranslation('mro');
  const { t: tCommon } = useTranslation('common');

  return (
    <>
      <Dialog open={isCreateAssetOpen} onOpenChange={setIsCreateAssetOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("newAssetTitle")}</DialogTitle>
            <DialogDescription>{t("assetInfoHint")}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>{t("labelAssetCode")}</Label>
              <Input value={assetForm.assetCode} onChange={(e) => setAssetForm(f => ({ ...f, assetCode: e.target.value }))} placeholder="AV-001" data-testid="input-asset-code" />
            </div>
            <div className="space-y-1">
              <Label>{t("labelAssetName")}</Label>
              <Input value={assetForm.assetName} onChange={(e) => setAssetForm(f => ({ ...f, assetName: e.target.value }))} placeholder={t("assetNamePlaceholder")} data-testid="input-asset-name" />
            </div>
            <div className="space-y-1">
              <Label>{t("labelType")}</Label>
              <Select value={assetForm.assetType} onValueChange={(v) => setAssetForm(f => ({ ...f, assetType: v }))}>
                <SelectTrigger data-testid="select-asset-type" className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(assetTypeLabels).map(([val, key]) => (
                    <SelectItem key={val} value={val}>{t(key)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("colPurchaseDate")}</Label>
              <Input type="date" value={assetForm.purchaseDate} onChange={(e) => setAssetForm(f => ({ ...f, purchaseDate: e.target.value }))} data-testid="input-purchase-date" />
            </div>
            <div className="space-y-1">
              <Label>{t("labelPurchaseValueUZS")}</Label>
              <Input type="number" min={0} value={assetForm.purchaseValue} onChange={(e) => setAssetForm(f => ({ ...f, purchaseValue: parseFloat(e.target.value) || 0 }))} data-testid="input-purchase-value" />
            </div>
            <div className="space-y-1">
              <Label>{t("labelCurrentValueUZS")}</Label>
              <Input type="number" min={0} value={assetForm.currentValue} onChange={(e) => setAssetForm(f => ({ ...f, currentValue: parseFloat(e.target.value) || 0 }))} data-testid="input-current-value" />
            </div>
            <div className="space-y-1">
              <Label>{t("colDepMethod")}</Label>
              <Select value={assetForm.depreciationMethod} onValueChange={(v) => setAssetForm(f => ({ ...f, depreciationMethod: v }))}>
                <SelectTrigger data-testid="select-depreciation-method" className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="straight_line">{t("depMethodStraightLine")}</SelectItem>
                  <SelectItem value="declining_balance">{t("depMethodDeclining")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("labelUsefulLife")}</Label>
              <Input type="number" min={1} value={assetForm.usefulLife} onChange={(e) => setAssetForm(f => ({ ...f, usefulLife: parseInt(e.target.value) || 5 }))} data-testid="input-useful-life" />
            </div>
            <div className="space-y-1">
              <Label>{t("labelSalvageValue")}</Label>
              <Input type="number" min={0} value={assetForm.salvageValue} onChange={(e) => setAssetForm(f => ({ ...f, salvageValue: parseFloat(e.target.value) || 0 }))} data-testid="input-salvage-value" />
            </div>
            <div className="space-y-1">
              <Label>{t("conditionLabel")}</Label>
              <Select value={assetForm.condition} onValueChange={(v) => setAssetForm(f => ({ ...f, condition: v }))}>
                <SelectTrigger data-testid="select-condition" className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">{t("conditionExcellent")}</SelectItem>
                  <SelectItem value="good">{t("conditionGood")}</SelectItem>
                  <SelectItem value="fair">{t("conditionFair")}</SelectItem>
                  <SelectItem value="poor">{t("conditionPoor")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("location")}</Label>
              <Input value={assetForm.location} onChange={(e) => setAssetForm(f => ({ ...f, location: e.target.value }))} placeholder={t("locationPlaceholder")} data-testid="input-location" />
            </div>
            <div className="space-y-1">
              <Label>{t("colSerialNumber")}</Label>
              <Input value={assetForm.serialNumber} onChange={(e) => setAssetForm(f => ({ ...f, serialNumber: e.target.value }))} placeholder="S/N-12345" data-testid="input-serial-number" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>{t("colNotes")}</Label>
              <Textarea value={assetForm.notes} onChange={(e) => setAssetForm(f => ({ ...f, notes: e.target.value }))} placeholder={t("additionalInfoPlaceholder")} rows={2} data-testid="input-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateAssetOpen(false)}>{t("btnCancel")}</Button>
            <Button onClick={() => createAssetMutation.mutate(assetForm)} disabled={createAssetMutation.isPending || !assetForm.assetCode || !assetForm.assetName} data-testid="button-submit-asset">
              {createAssetMutation.isPending ? t("saving") : tCommon("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDepreciateOpen} onOpenChange={setIsDepreciateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("calcDepreciationDialog")}</DialogTitle>
            <DialogDescription>{t("btnCalculate")}: "{selectedAsset?.assetName}" — {t("depreciateSingleMonthDesc")}</DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t("cardPurchaseValue")}:</span><span className="font-medium">{formatCurrency(selectedAsset.purchaseValue)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("colCurrentValue2")}:</span><span className="font-medium">{formatCurrency(selectedAsset.currentValue)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("labelAccumDep")}</span><span className="font-medium text-[var(--ep-red)]">-{formatCurrency(selectedAsset.accumulatedDepreciation)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("colMethod")}:</span><span className="font-medium">{t(depreciationMethodLabels[selectedAsset.depreciationMethod] || "depMethodStraightLine")}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("labelUsefulLife")}:</span><span className="font-medium">{selectedAsset.usefulLife} {t("yearUnit")}</span></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDepreciateOpen(false)}>{t("btnCancel")}</Button>
            <Button onClick={() => selectedAsset && depreciateMutation.mutate(selectedAsset.id)} disabled={depreciateMutation.isPending} data-testid="button-confirm-depreciate">
              {depreciateMutation.isPending ? t("calculating") : t("calcDepreciationBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isMaintenanceOpen} onOpenChange={setIsMaintenanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("addMaintenanceRecord")}</DialogTitle>
            <DialogDescription>{selectedAsset ? `"${selectedAsset.assetName}" ${t("maintenanceForAsset")}` : t("addMaintenanceRecord")}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>{t("labelType")}</Label>
              <Select value={maintenanceForm.maintenanceType} onValueChange={(v) => setMaintenanceForm(f => ({ ...f, maintenanceType: v }))}>
                <SelectTrigger data-testid="select-maintenance-type" className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventive">{t("maintTypePreventive")}</SelectItem>
                  <SelectItem value="corrective">{t("maintTypeCorrective")}</SelectItem>
                  <SelectItem value="predictive">{t("maintTypePredictive")}</SelectItem>
                  <SelectItem value="emergency">{t("maintTypeEmergency")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("colScheduledDate")}</Label>
              <Input type="date" value={maintenanceForm.scheduledDate} onChange={(e) => setMaintenanceForm(f => ({ ...f, scheduledDate: e.target.value }))} data-testid="input-scheduled-date" />
            </div>
            <div className="space-y-1">
              <Label>{t("colTechnician2")}</Label>
              <Input value={maintenanceForm.technicianName} onChange={(e) => setMaintenanceForm(f => ({ ...f, technicianName: e.target.value }))} placeholder="F.I.O." data-testid="input-technician" />
            </div>
            <div className="space-y-1">
              <Label>{t("colCostUZS")}</Label>
              <Input type="number" min={0} value={maintenanceForm.cost} onChange={(e) => setMaintenanceForm(f => ({ ...f, cost: parseFloat(e.target.value) || 0 }))} data-testid="input-maintenance-cost" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>{t("colDescription")}</Label>
              <Textarea value={maintenanceForm.description} onChange={(e) => setMaintenanceForm(f => ({ ...f, description: e.target.value }))} placeholder={t("maintDescPlaceholder")} rows={2} data-testid="input-maintenance-description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMaintenanceOpen(false)}>{t("btnCancel")}</Button>
            <Button onClick={() => createMaintenanceMutation.mutate(maintenanceForm)} disabled={createMaintenanceMutation.isPending} data-testid="button-submit-maintenance">
              {createMaintenanceMutation.isPending ? t("saving") : tCommon("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCompleteMaintenanceOpen} onOpenChange={setIsCompleteMaintenanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("dialogTitleCompleteMaint")}</DialogTitle>
            <DialogDescription>{t("completeMaintConfirm")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>{t("colCompletedDate2")}</Label>
              <Input type="date" value={completeMaintenanceForm.completedDate} onChange={(e) => setCompleteMaintenanceForm(f => ({ ...f, completedDate: e.target.value }))} data-testid="input-completed-date" />
            </div>
            <div className="space-y-1">
              <Label>{t("colNextMaintDate")}</Label>
              <Input type="date" value={completeMaintenanceForm.nextMaintenanceDate} onChange={(e) => setCompleteMaintenanceForm(f => ({ ...f, nextMaintenanceDate: e.target.value }))} data-testid="input-next-maintenance-date" />
            </div>
            <div className="space-y-1">
              <Label>{t("notes")}</Label>
              <Textarea value={completeMaintenanceForm.notes} onChange={(e) => setCompleteMaintenanceForm(f => ({ ...f, notes: e.target.value }))} placeholder={t("completeMaintNotesPlaceholder")} rows={2} data-testid="input-complete-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompleteMaintenanceOpen(false)}>{t("btnCancel")}</Button>
            <Button onClick={() => selectedMaintenance && completeMaintenanceMutation.mutate({ id: selectedMaintenance.id, data: completeMaintenanceForm })} disabled={completeMaintenanceMutation.isPending} data-testid="button-confirm-complete">
              {completeMaintenanceMutation.isPending ? t("saving") : t("finish")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
