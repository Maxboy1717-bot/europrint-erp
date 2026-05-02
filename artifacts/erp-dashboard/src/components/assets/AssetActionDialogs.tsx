import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { AlertTriangle } from "lucide-react";
import type { AssetInventoryItem } from "@/components/assets/types";

export interface DisposalForm {
  assetId: number; disposalMethod: string; disposalDate: string;
  disposalValue: number; reason: string; notes: string;
}

export interface TransferForm {
  assetId: number; fromLocation: string; toLocation: string; transferDate: string;
  toDepartmentId: number; reason: string; notes: string;
}

export interface InsuranceForm {
  assetId: number; policyNumber: string; insurerName: string; coverageType: string;
  startDate: string; endDate: string; premiumAmount: number; coverageAmount: number;
  contactInfo: string; notes: string;
}

interface AssetActionDialogsProps {
  assets: AssetInventoryItem[];
  selectedAsset: AssetInventoryItem | null;

  isDisposalOpen: boolean; setIsDisposalOpen: (v: boolean) => void;
  disposalForm: DisposalForm; setDisposalForm: React.Dispatch<React.SetStateAction<DisposalForm>>;
  createDisposalMutation: { mutate: (d: DisposalForm) => void; isPending: boolean };

  isTransferOpen: boolean; setIsTransferOpen: (v: boolean) => void;
  transferForm: TransferForm; setTransferForm: React.Dispatch<React.SetStateAction<TransferForm>>;
  createTransferMutation: { mutate: (d: TransferForm) => void; isPending: boolean };

  isInsuranceOpen: boolean; setIsInsuranceOpen: (v: boolean) => void;
  insuranceForm: InsuranceForm; setInsuranceForm: React.Dispatch<React.SetStateAction<InsuranceForm>>;
  createInsuranceMutation: { mutate: (d: InsuranceForm) => void; isPending: boolean };
}

export function AssetActionDialogs({
  assets, selectedAsset,
  isDisposalOpen, setIsDisposalOpen, disposalForm, setDisposalForm, createDisposalMutation,
  isTransferOpen, setIsTransferOpen, transferForm, setTransferForm, createTransferMutation,
  isInsuranceOpen, setIsInsuranceOpen, insuranceForm, setInsuranceForm, createInsuranceMutation,
}: AssetActionDialogsProps) {
  const { t } = useTranslation('mro');

  return (
    <>
      <Dialog open={isDisposalOpen} onOpenChange={setIsDisposalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialogTitleDispose")}</DialogTitle>
            <DialogDescription>{selectedAsset ? `"${selectedAsset.assetName}" ${t("disposeConfirmText")}` : t("dialogTitleDispose")}</DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-md mb-2">
              <div className="flex items-center gap-2 text-amber-500 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">{t("attention")}</span>
              </div>
              <p className="text-sm text-muted-foreground">{t("currentBalanceLabel")} <strong>{formatCurrency(selectedAsset.currentValue)}</strong></p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>{t("colDisposalMethod")}</Label>
              <Select value={disposalForm.disposalMethod} onValueChange={(v) => setDisposalForm(f => ({ ...f, disposalMethod: v }))}>
                <SelectTrigger data-testid="select-disposal-method"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="write_off">{t("disposalWriteOff")}</SelectItem>
                  <SelectItem value="sale">{t("disposalSale")}</SelectItem>
                  <SelectItem value="donation">{t("disposalDonation")}</SelectItem>
                  <SelectItem value="scrap">{t("disposalScrap")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("colDisposalDate")}</Label>
              <Input type="date" value={disposalForm.disposalDate} onChange={(e) => setDisposalForm(f => ({ ...f, disposalDate: e.target.value }))} data-testid="input-disposal-date" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>{t("colDisposalValueUZS")}</Label>
              <Input type="number" min={0} value={disposalForm.disposalValue} onChange={(e) => setDisposalForm(f => ({ ...f, disposalValue: parseFloat(e.target.value) || 0 }))} data-testid="input-disposal-value" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>{t("colReason")}</Label>
              <Textarea value={disposalForm.reason} onChange={(e) => setDisposalForm(f => ({ ...f, reason: e.target.value }))} placeholder={t("disposalReasonPlaceholder")} rows={2} data-testid="input-disposal-reason" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDisposalOpen(false)}>{t("btnCancel")}</Button>
            <Button variant="destructive" onClick={() => createDisposalMutation.mutate(disposalForm)} disabled={createDisposalMutation.isPending || !disposalForm.disposalDate} data-testid="button-confirm-disposal">
              {createDisposalMutation.isPending ? t("disposing") : t("tabDisposal")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("dialogTitleTransfer")}</DialogTitle>
            <DialogDescription>{selectedAsset ? `"${selectedAsset.assetName}" ${t("transferAssetDialog")}` : t("transferAssetAlt")}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>{t("labelAsset")}</Label>
              <Select value={transferForm.assetId ? String(transferForm.assetId) : ""} onValueChange={(v) => setTransferForm(f => ({ ...f, assetId: parseInt(v, 10) }))}>
                <SelectTrigger data-testid="select-transfer-asset"><SelectValue placeholder={t("selectAsset")} /></SelectTrigger>
                <SelectContent>
                  {(Array.isArray(assets) ? assets : []).filter(a => a.status === "active").map(a => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.assetCode} — {a.assetName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("labelTransferDate")}</Label>
              <Input type="date" value={transferForm.transferDate} onChange={(e) => setTransferForm(f => ({ ...f, transferDate: e.target.value }))} data-testid="input-transfer-date" />
            </div>
            <div className="space-y-1">
              <Label>{t("labelFromLocation")}</Label>
              <Input value={transferForm.fromLocation} onChange={(e) => setTransferForm(f => ({ ...f, fromLocation: e.target.value }))} placeholder={t("fromLocationPlaceholder")} data-testid="input-transfer-from" />
            </div>
            <div className="space-y-1">
              <Label>{t("labelToLocation")}</Label>
              <Input value={transferForm.toLocation} onChange={(e) => setTransferForm(f => ({ ...f, toLocation: e.target.value }))} placeholder={t("toLocationPlaceholder")} data-testid="input-transfer-to" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>{t("colReason")}</Label>
              <Textarea value={transferForm.reason} onChange={(e) => setTransferForm(f => ({ ...f, reason: e.target.value }))} placeholder={t("transferReasonPlaceholder")} rows={2} data-testid="input-transfer-reason" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>{t("colNotes")}</Label>
              <Textarea value={transferForm.notes} onChange={(e) => setTransferForm(f => ({ ...f, notes: e.target.value }))} placeholder={t("transferNotesPlaceholder")} rows={2} data-testid="input-transfer-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransferOpen(false)}>{t("btnCancel")}</Button>
            <Button onClick={() => createTransferMutation.mutate(transferForm)} disabled={createTransferMutation.isPending || !transferForm.assetId || !transferForm.toLocation || !transferForm.transferDate} data-testid="button-confirm-transfer">
              {createTransferMutation.isPending ? t("saving") : t("saveTransfer")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isInsuranceOpen} onOpenChange={setIsInsuranceOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("dialogTitleInsurance")}</DialogTitle>
            <DialogDescription>{selectedAsset ? `"${selectedAsset.assetName}" ${t("insuranceForAsset")}` : t("insuranceAlt")}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>{t("labelAsset")}</Label>
              <Select value={insuranceForm.assetId ? String(insuranceForm.assetId) : ""} onValueChange={(v) => setInsuranceForm(f => ({ ...f, assetId: parseInt(v, 10) }))}>
                <SelectTrigger data-testid="select-insurance-asset"><SelectValue placeholder={t("selectAsset")} /></SelectTrigger>
                <SelectContent>
                  {(Array.isArray(assets) ? assets : []).map(a => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.assetCode} — {a.assetName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("labelPolicyNumber")}</Label>
              <Input value={insuranceForm.policyNumber} onChange={(e) => setInsuranceForm(f => ({ ...f, policyNumber: e.target.value }))} placeholder="POL-2024-001" data-testid="input-policy-number" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>{t("labelInsurerName")}</Label>
              <Input value={insuranceForm.insurerName} onChange={(e) => setInsuranceForm(f => ({ ...f, insurerName: e.target.value }))} placeholder={t("insurerNamePlaceholder")} data-testid="input-insurer-name" />
            </div>
            <div className="space-y-1">
              <Label>{t("colCoverageType")}</Label>
              <Select value={insuranceForm.coverageType} onValueChange={(v) => setInsuranceForm(f => ({ ...f, coverageType: v }))}>
                <SelectTrigger data-testid="select-coverage-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="comprehensive">{t("coverageFull")}</SelectItem>
                  <SelectItem value="third_party">{t("coverageThirdParty")}</SelectItem>
                  <SelectItem value="fire">{t("coverageFire")}</SelectItem>
                  <SelectItem value="theft">{t("coverageTheft")}</SelectItem>
                  <SelectItem value="natural_disaster">{t("coverageNatural")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("labelPremiumAmount")}</Label>
              <Input type="number" min={0} value={insuranceForm.premiumAmount} onChange={(e) => setInsuranceForm(f => ({ ...f, premiumAmount: parseFloat(e.target.value) || 0 }))} data-testid="input-premium-amount" />
            </div>
            <div className="space-y-1">
              <Label>{t("labelStartDate")}</Label>
              <Input type="date" value={insuranceForm.startDate} onChange={(e) => setInsuranceForm(f => ({ ...f, startDate: e.target.value }))} data-testid="input-insurance-start" />
            </div>
            <div className="space-y-1">
              <Label>{t("labelEndDate")}</Label>
              <Input type="date" value={insuranceForm.endDate} onChange={(e) => setInsuranceForm(f => ({ ...f, endDate: e.target.value }))} data-testid="input-insurance-end" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>{t("labelCoverageAmount")}</Label>
              <Input type="number" min={0} value={insuranceForm.coverageAmount} onChange={(e) => setInsuranceForm(f => ({ ...f, coverageAmount: parseFloat(e.target.value) || 0 }))} data-testid="input-coverage-amount" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>{t("colContactInfo")}</Label>
              <Input value={insuranceForm.contactInfo} onChange={(e) => setInsuranceForm(f => ({ ...f, contactInfo: e.target.value }))} placeholder={t("contactInfoPlaceholder")} data-testid="input-contact-info" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInsuranceOpen(false)}>{t("btnCancel")}</Button>
            <Button onClick={() => createInsuranceMutation.mutate(insuranceForm)} disabled={createInsuranceMutation.isPending || !insuranceForm.assetId || !insuranceForm.policyNumber || !insuranceForm.insurerName} data-testid="button-confirm-insurance">
              {createInsuranceMutation.isPending ? t("saving") : t("saveInsurance")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
