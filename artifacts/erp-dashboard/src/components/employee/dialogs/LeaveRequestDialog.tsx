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
          <DialogTitle className="text-[18px] font-semibold">Mehnat ta'tili so'rovi</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1">
          <Label>Ta'til turi</Label>
            <Select
              value={form.leaveType}
              onValueChange={(val) => updateField("leaveType", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annual">Yillik mehnat ta'tili</SelectItem>
                <SelectItem value="unpaid">Oylik saqlanmagan holda</SelectItem>
                <SelectItem value="study">O'quv ta'tili</SelectItem>
                <SelectItem value="maternity">Dekret ta'tili</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label htmlFor="startDate">Boshlanish sanasi</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
              />
            </div>
            <div className="space-y-1">
          <Label htmlFor="endDate">Tugash sanasi</Label>
              <Input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
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
