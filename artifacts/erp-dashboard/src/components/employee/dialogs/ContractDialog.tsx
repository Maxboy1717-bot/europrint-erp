/**
 * @module ContractDialog
 * @description React UI component.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from '@/lib/i18n';

interface ContractForm {
  contractNumber: string;
  contractType: string;
  startDate: string;
  endDate: string;
  salary: string;
  workSchedule: string;
}

interface ContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ContractForm;
  onChange: (form: ContractForm) => void;
  onSave: () => void;
  isPending: boolean;
}

export function ContractDialog({
  open,
  onOpenChange,
  form,
  onChange,
  onSave,
  isPending
}: ContractDialogProps) {
  const { t } = useTranslation("common");
  const updateField = (field: keyof ContractForm, value: string) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("mehnatShartnomasiniQoshish")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1">
          <Label htmlFor="contractNumber">{t("shartnomaRaqami")}</Label>
            <Input
              id="contractNumber"
              value={form.contractNumber}
              onChange={(e) => updateField("contractNumber", e.target.value)}
            />
          </div>
          <div className="space-y-1">
          <Label>{t("shartnomaTuri")}</Label>
            <Select
              value={form.contractType}
              onValueChange={(val) => updateField("contractType", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("tanlang")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="indefinite">{t("nomalumMuddatli")}</SelectItem>
                <SelectItem value="temporary">{t("muddatli")}</SelectItem>
                <SelectItem value="probation">{t("sinovMuddati")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
          <Label htmlFor="salary">{t("maoshUzs")}</Label>
            <Input
              id="salary"
              type="number"
              value={form.salary}
              onChange={(e) => updateField("salary", e.target.value)}
            />
          </div>
          <div className="space-y-1">
          <Label htmlFor="workSchedule">{t("ishGrafigi")}</Label>
            <Input
              id="workSchedule"
              value={form.workSchedule}
              onChange={(e) => updateField("workSchedule", e.target.value)}
              placeholder={t("masalan52090018")}
            />
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
