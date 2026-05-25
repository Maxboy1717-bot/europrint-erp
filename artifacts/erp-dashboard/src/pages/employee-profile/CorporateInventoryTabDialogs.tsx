/**
 * @module CorporateInventoryTabDialogs
 * @description Add-inventory dialog for CorporateInventoryTab.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import type { InventoryFormState } from "./CorporateInventoryTabTypes";
import { DEVICE_TYPES, CONDITIONS } from "./CorporateInventoryTabTypes";
import { useTranslation } from '@/lib/i18n';

interface AddInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: InventoryFormState;
  onChange: (updated: InventoryFormState) => void;
  onSave: () => void;
  isPending: boolean;
}

export function AddInventoryDialog({
  open, onOpenChange, form, onChange, onSave, isPending,
}: AddInventoryDialogProps) {
  const { t } = useTranslation("common");
  const set = (patch: Partial<InventoryFormState>) => onChange({ ...form, ...patch });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiInventarQoshish")}</DialogTitle>
          <DialogDescription>{t("xodimgaBeriladiganQurilmaYokiJihoz")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>{t("qurilmaNomi")}</Label>
              <Input
                value={form.deviceName}
                onChange={e => set({ deviceName: e.target.value })}
                placeholder={t("macbookPro14Inch")}
                data-testid="input-device-name"
              />
            </div>
            <div className="space-y-1">
          <Label>{t("type")}</Label>
              <Select value={form.deviceType} onValueChange={v => set({ deviceType: v })}>
                <SelectTrigger data-testid="select-device-type" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(DEVICE_TYPES) ? DEVICE_TYPES : []).map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
          <Label>{t("holati")}</Label>
              <Select value={form.condition} onValueChange={v => set({ condition: v })}>
                <SelectTrigger data-testid="select-condition" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(CONDITIONS) ? CONDITIONS : []).map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
          <Label>{t("brend")}</Label>
              <Input
                value={form.brand}
                onChange={e => set({ brand: e.target.value })}
                placeholder={t("appleSamsung")}
              />
            </div>
            <div className="space-y-1">
          <Label>{t("serialRaqam")}</Label>
              <Input
                value={form.serialNumber}
                onChange={e => set({ serialNumber: e.target.value })}
                placeholder="SN-001..."
                data-testid="input-serial-number"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>{t("berilganSana")}</Label>
              <Input
                type="date"
                value={form.issuedDate}
                onChange={e => set({ issuedDate: e.target.value })}
                data-testid="input-issued-date"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>{t("Izoh")}</Label>
              <Input
                value={form.notes}
                onChange={e => set({ notes: e.target.value })}
                placeholder={t("qoshimchaMalumot")}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button
            onClick={onSave}
            disabled={isPending || !form.deviceName || !form.issuedDate}
            data-testid="button-save-inventory"
          >
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
