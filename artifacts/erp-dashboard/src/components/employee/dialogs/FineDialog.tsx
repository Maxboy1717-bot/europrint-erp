/**
 * @module FineDialog
 * @description React UI component.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from '@/lib/i18n';

interface FineForm {
  fineDate: string;
  amount: string;
  fineType: string;
  description: string;
  deductedFromSalary: boolean;
}

interface FineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: FineForm;
  onChange: (form: FineForm) => void;
  onSave: () => void;
  isPending: boolean;
}

export function FineDialog({
  open,
  onOpenChange,
  form,
  onChange,
  onSave,
  isPending
}: FineDialogProps) {
  const { t } = useTranslation("common");
  const updateField = (field: keyof FineForm, value: string | boolean) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("jarimaQollash")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1">
          <Label htmlFor="fineDate">{t("date")}</Label>
            <Input
              id="fineDate"
              type="date"
              value={form.fineDate}
              onChange={(e) => updateField("fineDate", e.target.value)}
            />
          </div>
          <div className="space-y-1">
          <Label htmlFor="amount">Summa (UZS)</Label>
            <Input
              id="amount"
              type="number"
              value={form.amount}
              onChange={(e) => updateField("amount", e.target.value)}
            />
          </div>
          <div className="space-y-1">
          <Label>{t("jarimaTuri")}</Label>
            <Select
              value={form.fineType}
              onValueChange={(val) => updateField("fineType", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("tanlang")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="late">{t("kechikishUchun")}</SelectItem>
                <SelectItem value="discipline">{t("intizomBuzilishi")}</SelectItem>
                <SelectItem value="damage">{t("moddiyZarar")}</SelectItem>
                <SelectItem value="other">{t("boshqa")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
          <Label htmlFor="description">{t("progress.description")}</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="deducted"
              checked={form.deductedFromSalary}
              onCheckedChange={(checked) => updateField("deductedFromSalary", checked)}
            />
            <Label htmlFor="deducted">{t("maoshdanUshlabQolinsin")}</Label>
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
