/**
 * @module SalaryDialog
 * @description React UI component.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/lib/i18n';

interface SalaryForm {
  effectiveDate: string;
  previousSalary: string;
  newSalary: string;
  changeType: string;
  notes: string;
}

interface SalaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: SalaryForm;
  onChange: (form: SalaryForm) => void;
  onSave: () => void;
  isPending: boolean;
}

export function SalaryDialog({
  open,
  onOpenChange,
  form,
  onChange,
  onSave,
  isPending
}: SalaryDialogProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  const updateField = (field: keyof SalaryForm, value: string) => {
    onChange({ ...form, [field]: value });
  };

  const handleSubmit = () => {
    if (!form.newSalary || Number(form.newSalary) <= 0) {
      toast({ title: "Xato", description: "Maosh 0 dan katta bo'lishi kerak", variant: "destructive" }); return;
    }
    if (!form.changeType) {
      toast({ title: "Xato", description: "O'zgarish turini tanlang", variant: "destructive" }); return;
    }
    if (!form.effectiveDate) {
      toast({ title: "Xato", description: "Sanani kiriting", variant: "destructive" }); return;
    }
    onSave();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("maoshniOzgartirish")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1">
          <Label htmlFor="effectiveDate">{t("kuchgaKirishSanasi")}</Label>
            <Input
              id="effectiveDate"
              type="date"
              value={form.effectiveDate}
              onChange={(e) => updateField("effectiveDate", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label htmlFor="prevSalary">{t("oldingiMaosh")}</Label>
              <Input
                id="prevSalary"
                type="number"
                value={form.previousSalary}
                onChange={(e) => updateField("previousSalary", e.target.value)}
              />
            </div>
            <div className="space-y-1">
          <Label htmlFor="newSalary">{t("yangiMaosh")}</Label>
              <Input
                id="newSalary"
                type="number"
                value={form.newSalary}
                onChange={(e) => updateField("newSalary", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
          <Label>{t("ozgarishTuri")}</Label>
            <Select
              value={form.changeType}
              onValueChange={(val) => updateField("changeType", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("tanlang")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annual_review">{t("yillikKoribChiqish")}</SelectItem>
                <SelectItem value="promotion">{t("lavozimKotarilishi")}</SelectItem>
                <SelectItem value="market_adjustment">{t("bozorMoslashuvi")}</SelectItem>
                <SelectItem value="performance">{t("natijadorlikUchun")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
          <Label htmlFor="notes">{t("notes")}</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button
            onClick={handleSubmit}
            disabled={!form.newSalary || Number(form.newSalary) <= 0 || !form.changeType || !form.effectiveDate || isPending}
          >
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
