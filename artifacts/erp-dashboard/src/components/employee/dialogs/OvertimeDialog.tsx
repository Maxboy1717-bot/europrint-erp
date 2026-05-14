/**
 * @module OvertimeDialog
 * @description React UI component.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from '@/lib/i18n';

interface OvertimeForm {
  workDate: string;
  hours: string;
  hourlyRate: string;
  multiplier: string;
  reason: string;
}

interface OvertimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: OvertimeForm;
  onChange: (form: OvertimeForm) => void;
  onSave: () => void;
  isPending: boolean;
}

export function OvertimeDialog({
  open,
  onOpenChange,
  form,
  onChange,
  onSave,
  isPending
}: OvertimeDialogProps) {
  const { t } = useTranslation("common");
  const updateField = (field: keyof OvertimeForm, value: string) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("ishVaqtidanTashqariMehnatniQayd")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1">
          <Label htmlFor="workDate">{t("date")}</Label>
            <Input
              id="workDate"
              type="date"
              value={form.workDate}
              onChange={(e) => updateField("workDate", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label htmlFor="hours">{t("soatlarSoni")}</Label>
              <Input
                id="hours"
                type="number"
                value={form.hours}
                onChange={(e) => updateField("hours", e.target.value)}
              />
            </div>
            <div className="space-y-1">
          <Label htmlFor="multiplier">{t("koeffitsient")}</Label>
              <Select
                value={form.multiplier}
                onValueChange={(val) => updateField("multiplier", val)}
              >
                <SelectTrigger id="multiplier" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1.5">1.5x</SelectItem>
                  <SelectItem value="2.0">2.0x</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
          <Label htmlFor="hourlyRate">Soatbay stavka (UZS)</Label>
            <Input
              id="hourlyRate"
              type="number"
              value={form.hourlyRate}
              onChange={(e) => updateField("hourlyRate", e.target.value)}
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
