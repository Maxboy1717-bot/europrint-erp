/**
 * @module SickLeaveDialog
 * @description React UI component.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from '@/lib/i18n';

interface SickLeaveForm {
  startDate: string;
  endDate: string;
  diagnosis: string;
  hospitalName: string;
  doctorName: string;
  documentNumber: string;
  isPaid: boolean;
  paymentPercent: string;
}

interface SickLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: SickLeaveForm;
  onChange: (form: SickLeaveForm) => void;
  onSave: () => void;
  isPending: boolean;
}

export function SickLeaveDialog({
  open,
  onOpenChange,
  form,
  onChange,
  onSave,
  isPending
}: SickLeaveDialogProps) {
  const { t } = useTranslation("common");
  const updateField = (field: keyof SickLeaveForm, value: string | boolean) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("kasalikVaraqasiniQaydEtish")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label htmlFor="startDate">{t("startDate")}</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
              />
            </div>
            <div className="space-y-1">
          <Label htmlFor="endDate">{t("endDate")}</Label>
              <Input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
          <Label htmlFor="diagnosis">{t("tashxis")}</Label>
            <Input
              id="diagnosis"
              value={form.diagnosis}
              onChange={(e) => updateField("diagnosis", e.target.value)}
            />
          </div>
          <div className="space-y-1">
          <Label htmlFor="hospital">{t("shifoxonaNomi")}</Label>
            <Input
              id="hospital"
              value={form.hospitalName}
              onChange={(e) => updateField("hospitalName", e.target.value)}
            />
          </div>
          <div className="space-y-1">
          <Label htmlFor="doctor">{t("shifokorIsmi")}</Label>
            <Input
              id="doctor"
              value={form.doctorName}
              onChange={(e) => updateField("doctorName", e.target.value)}
            />
          </div>
          <div className="space-y-1">
          <Label htmlFor="docNum">{t("hujjatRaqami")}</Label>
            <Input
              id="docNum"
              value={form.documentNumber}
              onChange={(e) => updateField("documentNumber", e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="isPaid"
                checked={form.isPaid}
                onCheckedChange={(checked) => updateField("isPaid", checked)}
              />
              <Label htmlFor="isPaid">{t("tolanadigan")}</Label>
            </div>
            {form.isPaid && (
              <div className="flex items-center gap-2">
                <Label htmlFor="percent">{t("tolov")}</Label>
                <Input
                  id="percent"
                  type="number"
                  className="w-20"
                  value={form.paymentPercent}
                  onChange={(e) => updateField("paymentPercent", e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button onClick={onSave} disabled={isPending}>
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
