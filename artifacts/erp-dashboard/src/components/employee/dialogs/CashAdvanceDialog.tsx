import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  const updateField = (field: keyof CashAdvanceForm, value: string) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Avans so'rovi</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="requestDate">Sana</Label>
            <Input
              id="requestDate"
              type="date"
              value={form.requestDate}
              onChange={(e) => updateField("requestDate", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Summa (UZS)</Label>
            <Input
              id="amount"
              type="number"
              value={form.amount}
              onChange={(e) => updateField("amount", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Sabab</Label>
            <Textarea
              id="reason"
              value={form.reason}
              onChange={(e) => updateField("reason", e.target.value)}
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
