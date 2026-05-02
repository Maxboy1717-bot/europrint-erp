import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Warehouse } from "./types";

interface CreateCountDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  form: {
    countDate: string;
    warehouseId: string;
    countType: string;
    notes: string;
  };
  setForm: (form: { countDate: string; warehouseId: string; countType: string; notes: string }) => void;
  warehouses: Warehouse[];
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export function CreateCountDialog({
  isOpen,
  onOpenChange,
  form,
  setForm,
  warehouses,
  onSubmit,
  isPending
}: CreateCountDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Yangi Inventarizatsiya</DialogTitle>
          <DialogDescription>
            Material va mahsulotlar sanovini boshlash uchun ma'lumotlarni kiriting
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="countDate">Sana *</Label>
            <Input 
              id="countDate" 
              type="date" 
              value={form.countDate}
              onChange={(e) => setForm({ ...form, countDate: e.target.value })}
              data-testid="input-count-date"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="warehouse">Omborxona *</Label>
            <Select 
              value={form.warehouseId} 
              onValueChange={(value) => setForm({ ...form, warehouseId: value })}
            >
              <SelectTrigger id="warehouse" data-testid="select-warehouse">
                <SelectValue placeholder="Omborni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(warehouses) ? warehouses : []).map(wh => (
                  <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="countType">Hisoblash turi *</Label>
            <Select 
              value={form.countType} 
              onValueChange={(value) => setForm({ ...form, countType: value })}
            >
              <SelectTrigger id="countType" data-testid="select-count-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">To'liq</SelectItem>
                <SelectItem value="cycle">Davriy</SelectItem>
                <SelectItem value="spot">Spot</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Izoh</Label>
            <Textarea 
              id="notes" 
              placeholder="Qo'shimcha ma'lumotlar..." 
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              data-testid="input-count-notes"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button 
            onClick={onSubmit}
            disabled={isPending || !form.warehouseId || !form.countDate}
            data-testid="button-submit-count"
          >
            {isPending ? "Yaratilmoqda..." : "Yaratish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
