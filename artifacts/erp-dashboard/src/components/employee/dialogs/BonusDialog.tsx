/**
 * @module BonusDialog
 * @description React UI component.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface BonusForm {
  paymentDate: string;
  amount: string;
  bonusType: string;
  description: string;
}

interface BonusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: BonusForm;
  onChange: (form: BonusForm) => void;
  onSave: () => void;
  isPending: boolean;
}

export function BonusDialog({
  open,
  onOpenChange,
  form,
  onChange,
  onSave,
  isPending
}: BonusDialogProps) {
  const updateField = (field: keyof BonusForm, value: string) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Mukofot (Bonus) tayinlash</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1">
          <Label htmlFor="paymentDate">To'lov sanasi</Label>
            <Input
              id="paymentDate"
              type="date"
              value={form.paymentDate}
              onChange={(e) => updateField("paymentDate", e.target.value)}
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
          <Label>Mukofot turi</Label>
            <Select
              value={form.bonusType}
              onValueChange={(val) => updateField("bonusType", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="performance">Natijadorlik uchun</SelectItem>
                <SelectItem value="holiday">Bayram munosabati bilan</SelectItem>
                <SelectItem value="project">Loyiha muvaffaqiyati</SelectItem>
                <SelectItem value="referral">Tavsiya uchun</SelectItem>
                <SelectItem value="other">Boshqa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
          <Label htmlFor="description">Tavsif</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Bekor qilish</Button>
          <Button onClick={onSave} disabled={isPending}>
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
