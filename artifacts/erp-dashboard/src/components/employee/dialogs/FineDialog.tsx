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
  const updateField = (field: keyof FineForm, value: string | boolean) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Jarima qo'llash</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1">
          <Label htmlFor="fineDate">Sana</Label>
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
          <Label>Jarima turi</Label>
            <Select
              value={form.fineType}
              onValueChange={(val) => updateField("fineType", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="late">Kechikish uchun</SelectItem>
                <SelectItem value="discipline">Intizom buzilishi</SelectItem>
                <SelectItem value="damage">Moddiy zarar</SelectItem>
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
          <div className="flex items-center space-x-2">
            <Switch
              id="deducted"
              checked={form.deductedFromSalary}
              onCheckedChange={(checked) => updateField("deductedFromSalary", checked)}
            />
            <Label htmlFor="deducted">Maoshdan ushlab qolinsin</Label>
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
