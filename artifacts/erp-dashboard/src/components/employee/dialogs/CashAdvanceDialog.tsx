/**
 * @module CashAdvanceDialog
 * @description React UI component.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from '@/lib/i18n';

interface CashAdvanceForm {
  requestDate: string;
  amount: string;
  reason: string;
  status: string;
}

interface CashAdvanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: CashAdvanceForm;
  onChange: (form: CashAdvanceForm) => void;
  onSave: () => void;
  isPending: boolean;
}

export function CashAdvanceDialog({
  open,
  onOpenChange,
  form,
  onChange,
  onSave,
  isPending
}: CashAdvanceDialogProps) {
  const { t } = useTranslation("common");
  const updateField = (field: keyof CashAdvanceForm, value: string) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("avansSorovi")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1">
          <Label htmlFor="requestDate">{t("date")}</Label>
            <Input
              id="requestDate"
              type="date"
              value={form.requestDate}
              onChange={(e) => updateField("requestDate", e.target.value)}
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
          <Label htmlFor="reason">{t("sabab")}</Label>
            <Textarea
              id="reason"
              value={form.reason}
              onChange={(e) => updateField("reason", e.target.value)}
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
