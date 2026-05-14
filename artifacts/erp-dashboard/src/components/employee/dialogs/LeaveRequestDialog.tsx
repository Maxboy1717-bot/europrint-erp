/**
 * @module LeaveRequestDialog
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

interface LeaveRequestForm {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}

interface LeaveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: LeaveRequestForm;
  onChange: (form: LeaveRequestForm) => void;
  onSave: () => void;
  isPending: boolean;
}

export function LeaveRequestDialog({
  open,
  onOpenChange,
  form,
  onChange,
  onSave,
  isPending
}: LeaveRequestDialogProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  const updateField = (field: keyof LeaveRequestForm, value: string) => {
    onChange({ ...form, [field]: value });
  };

  const handleSubmit = () => {
    if (!form.startDate || !form.endDate) {
      toast({ title: "Xato", description: "Sana kiritilishi shart", variant: "destructive" }); return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast({ title: "Xato", description: "Tugash sanasi boshlanish sanasidan oldin bo'lishi mumkin emas", variant: "destructive" }); return;
    }
    onSave();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("mehnatTatiliSorovi")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1">
          <Label>{t("tatilTuri")}</Label>
            <Select
              value={form.leaveType}
              onValueChange={(val) => updateField("leaveType", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("tanlang")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annual">{t("yillikMehnatTatili")}</SelectItem>
                <SelectItem value="unpaid">{t("oylikSaqlanmaganHolda")}</SelectItem>
                <SelectItem value="study">{t("oquvTatili")}</SelectItem>
                <SelectItem value="maternity">{t("dekretTatili")}</SelectItem>
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
          <Button
            onClick={handleSubmit}
            disabled={!form.startDate || !form.endDate || isPending}
          >
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
