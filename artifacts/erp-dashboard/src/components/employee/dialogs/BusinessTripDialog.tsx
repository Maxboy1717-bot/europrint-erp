import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BusinessTripForm {
  destination: string;
  purpose: string;
  startDate: string;
  endDate: string;
  dailyAllowance: string;
  transportCost: string;
  accommodationCost: string;
}

interface BusinessTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: BusinessTripForm;
  onChange: (form: BusinessTripForm) => void;
  onSave: () => void;
  isPending: boolean;
}

export function BusinessTripDialog({
  open,
  onOpenChange,
  form,
  onChange,
  onSave,
  isPending
}: BusinessTripDialogProps) {
  const updateField = (field: keyof BusinessTripForm, value: string) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Xizmat safari (K командировка)</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="destination">Manzil</Label>
            <Input
              id="destination"
              value={form.destination}
              onChange={(e) => updateField("destination", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="purpose">Maqsad</Label>
            <Textarea
              id="purpose"
              value={form.purpose}
              onChange={(e) => updateField("purpose", e.target.value)}
            />
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
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label htmlFor="daily">Sutkalik</Label>
              <Input
                id="daily"
                type="number"
                value={form.dailyAllowance}
                onChange={(e) => updateField("dailyAllowance", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transport">Transport</Label>
              <Input
                id="transport"
                type="number"
                value={form.transportCost}
                onChange={(e) => updateField("transportCost", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hotel">Turar joy</Label>
              <Input
                id="hotel"
                type="number"
                value={form.accommodationCost}
                onChange={(e) => updateField("accommodationCost", e.target.value)}
              />
            </div>
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
