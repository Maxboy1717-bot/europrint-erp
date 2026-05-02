import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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
  const updateField = (field: keyof SalaryForm, value: string) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Maoshni o'zgartirish</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="effectiveDate">Kuchga kirish sanasi</Label>
            <Input
              id="effectiveDate"
              type="date"
              value={form.effectiveDate}
              onChange={(e) => updateField("effectiveDate", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prevSalary">Oldingi maosh</Label>
              <Input
                id="prevSalary"
                type="number"
                value={form.previousSalary}
                onChange={(e) => updateField("previousSalary", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newSalary">Yangi maosh</Label>
              <Input
                id="newSalary"
                type="number"
                value={form.newSalary}
                onChange={(e) => updateField("newSalary", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>O'zgarish turi</Label>
            <Select
              value={form.changeType}
              onValueChange={(val) => updateField("changeType", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annual_review">Yillik ko'rib chiqish</SelectItem>
                <SelectItem value="promotion">Lavozim ko'tarilishi</SelectItem>
                <SelectItem value="market_adjustment">Bozor moslashuvi</SelectItem>
                <SelectItem value="performance">Natijadorlik uchun</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Izohlar</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
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
