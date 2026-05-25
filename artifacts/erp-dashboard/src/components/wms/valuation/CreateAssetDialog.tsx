/**
 * @module CreateAssetDialog
 * @description React UI component.
 */

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AssetInventoryForm } from "./types";
import { useTranslation } from '@/lib/i18n';

interface CreateAssetDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  form: AssetInventoryForm;
  setForm: (form: AssetInventoryForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export function CreateAssetDialog({
  isOpen,
  onOpenChange,
  form,
  setForm,
  onSubmit,
  isPending
}: CreateAssetDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiAktivQoshish")}</DialogTitle>
          <DialogDescription>
            {t("asosiyVositalarRoyxatigaYangiAktiv")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{t("aktivKodi")}</Label>
              <Input
                value={form.assetCode}
                onChange={(e) => setForm({ ...form, assetCode: e.target.value })}
                placeholder="INV-001"
                data-testid="input-asset-code"
              />
            </div>
            <div>
              <Label>{t("aktivTuri")}</Label>
              <Select 
                value={form.assetType} 
                onValueChange={(value) => setForm({ ...form, assetType: value })}
              >
                <SelectTrigger data-testid="select-asset-type" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equipment">{t("uskunalar")}</SelectItem>
                  <SelectItem value="vehicle">{t("transport")}</SelectItem>
                  <SelectItem value="building">{t("binolar")}</SelectItem>
                  <SelectItem value="furniture">{t("mebel")}</SelectItem>
                  <SelectItem value="it_equipment">{t("itUskunalar")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>{t("aktivNomi")}</Label>
            <Input
              value={form.assetName}
              onChange={(e) => setForm({ ...form, assetName: e.target.value })}
              placeholder={t("uskunaningNomi")}
              data-testid="input-asset-name"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{t("xaridSanasi")}</Label>
              <Input
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                data-testid="input-asset-purchase-date"
              />
            </div>
            <div>
              <Label>{t("seriyaRaqami")}</Label>
              <Input
                value={form.serialNumber}
                onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                placeholder="SN123456"
                data-testid="input-asset-serial"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{t("xaridQiymatiUzs")}</Label>
              <Input
                type="number"
                value={form.purchaseValue}
                onChange={(e) => setForm({ ...form, purchaseValue: Number(e.target.value) })}
                data-testid="input-asset-purchase-value"
              />
            </div>
            <div>
              <Label>{t("joriyQiymatUzs")}</Label>
              <Input
                type="number"
                value={form.currentValue}
                onChange={(e) => setForm({ ...form, currentValue: Number(e.target.value) })}
                data-testid="input-asset-current-value"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{t("foydaliXizmatMuddatiYil")}</Label>
              <Input
                type="number"
                value={form.usefulLife}
                onChange={(e) => setForm({ ...form, usefulLife: Number(e.target.value) })}
                data-testid="input-asset-useful-life"
              />
            </div>
            <div>
              <Label>{t("qoldiqQiymatUzs")}</Label>
              <Input
                type="number"
                value={form.salvageValue}
                onChange={(e) => setForm({ ...form, salvageValue: Number(e.target.value) })}
                data-testid="input-asset-salvage-value"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{t("holati")}</Label>
              <Select 
                value={form.condition} 
                onValueChange={(value) => setForm({ ...form, condition: value })}
              >
                <SelectTrigger data-testid="select-asset-condition" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">{t("alo")}</SelectItem>
                  <SelectItem value="good">{t("Yaxshi")}</SelectItem>
                  <SelectItem value="fair">{t("qoniqarli")}</SelectItem>
                  <SelectItem value="poor">{t("yomon")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("location")}</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder={t("k1QavatABlok")}
                data-testid="input-asset-location"
              />
            </div>
          </div>
          <div>
            <Label>{t("Izoh")}</Label>
            <Textarea
              placeholder={t("qoshimchaMalumotlar1")}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              data-testid="input-asset-notes"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button 
            onClick={onSubmit}
            disabled={isPending || !form.assetCode || !form.assetName}
            data-testid="button-submit-asset"
          >
            {isPending ? "Yaratilmoqda..." : "Yaratish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
