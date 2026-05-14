/**
 * @module HRAssetManagementDialogs
 * @description Write-path dialog components for the HR Asset Management page:
 * Add-asset and Assign-to-employee dialogs.
 * Return/Report/Detail dialogs live in HRAssetManagementActionsDialogs.tsx.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useTranslation } from '@/lib/i18n';
import {
  Asset, Employee, AssetForm, AssignForm,
  CATEGORY_LABELS, CONDITION_LABELS,
} from "./HRAssetManagementTypes";

// ---------------------------------------------------------------------------
// Add-asset dialog
// ---------------------------------------------------------------------------

interface AddDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: AssetForm;
  onFormChange: (f: AssetForm) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function AddAssetDialog({ open, onOpenChange, form, onFormChange, onSubmit, isPending }: AddDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiJihozQoshish")}</DialogTitle>
          <DialogDescription>{t("kompaniyaJihoziMalumotlariniKiriting")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>{t("nomi")}</Label>
              <Input
                value={form.name}
                onChange={e => onFormChange({ ...form, name: e.target.value })}
                placeholder={t("macbookPro14")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("tur")}</Label>
              <Select value={form.category} onValueChange={v => onFormChange({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("serialRaqam")}</Label>
              <Input
                value={form.serial_number}
                onChange={e => onFormChange({ ...form, serial_number: e.target.value })}
                placeholder="SN-12345"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("xaridSanasi")}</Label>
              <Input
                type="date"
                value={form.purchase_date}
                onChange={e => onFormChange({ ...form, purchase_date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Qiymati (UZS)</Label>
              <Input
                type="number"
                value={form.value}
                onChange={e => onFormChange({ ...form, value: e.target.value })}
                placeholder="5000000"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>{t("Izoh")}</Label>
              <Textarea
                value={form.notes}
                onChange={e => onFormChange({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button onClick={onSubmit} disabled={isPending || !form.name}>
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Assign-to-employee dialog
// ---------------------------------------------------------------------------

interface AssignDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  asset: Asset | null;
  form: AssignForm;
  onFormChange: (f: AssignForm) => void;
  employees: Employee[];
  onSubmit: () => void;
  isPending: boolean;
}

export function AssignDialog({ open, onOpenChange, asset, form, onFormChange, employees, onSubmit, isPending }: AssignDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("xodimgaBerish")}</DialogTitle>
          <DialogDescription>{asset?.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("xodim")}</Label>
            <Select value={form.employee_id} onValueChange={v => onFormChange({ ...form, employee_id: v })}>
              <SelectTrigger><SelectValue placeholder={t("xodimniTanlang")} /></SelectTrigger>
              <SelectContent>
                {(Array.isArray(employees) ? employees : []).map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.full_name} ({e.employee_id})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("berishSanasi")}</Label>
            <Input
              type="date"
              value={form.assigned_date}
              onChange={e => onFormChange({ ...form, assigned_date: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("status28")}</Label>
            <Select value={form.condition_on_assign} onValueChange={v => onFormChange({ ...form, condition_on_assign: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CONDITION_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("Izoh")}</Label>
            <Textarea
              value={form.notes}
              onChange={e => onFormChange({ ...form, notes: e.target.value })}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button onClick={onSubmit} disabled={isPending || !form.employee_id}>
            {isPending ? "..." : "Berish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
