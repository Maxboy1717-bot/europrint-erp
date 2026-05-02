import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const updateField = (field: keyof ContractForm, value: string) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mehnat shartnomasini qo'shish</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="contractNumber">Shartnoma raqami</Label>
            <Input
              id="contractNumber"
              value={form.contractNumber}
              onChange={(e) => updateField("contractNumber", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Shartnoma turi</Label>
            <Select
              value={form.contractType}
              onValueChange={(val) => updateField("contractType", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="indefinite">Noma'lum muddatli</SelectItem>
                <SelectItem value="temporary">Muddatli</SelectItem>
                <SelectItem value="probation">Sinov muddati</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Boshlanish sanasi</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Tugash sanasi</Label>
              <Input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="salary">Maosh (UZS)</Label>
            <Input
              id="salary"
              type="number"
              value={form.salary}
              onChange={(e) => updateField("salary", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workSchedule">Ish grafigi</Label>
            <Input
              id="workSchedule"
              value={form.workSchedule}
              onChange={(e) => updateField("workSchedule", e.target.value)}
              placeholder="Masalan: 5/2, 09:00-18:00"
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
