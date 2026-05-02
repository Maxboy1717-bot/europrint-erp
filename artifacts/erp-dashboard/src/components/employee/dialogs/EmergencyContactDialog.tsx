import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface EmergencyContactForm {
  contactName: string;
  relationship: string;
  phoneNumber: string;
  alternativePhone: string;
  address: string;
  isPrimary: boolean;
}

interface EmergencyContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: EmergencyContactForm;
  onChange: (form: EmergencyContactForm) => void;
  onSave: () => void;
  isPending: boolean;
}

export function EmergencyContactDialog({
  open,
  onOpenChange,
  form,
  onChange,
  onSave,
  isPending
}: EmergencyContactDialogProps) {
  const updateField = (field: keyof EmergencyContactForm, value: string | boolean) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Favqulodda aloqa qo'shish</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="contactName">Ism-sharif</Label>
            <Input
              id="contactName"
              value={form.contactName}
              onChange={(e) => updateField("contactName", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="relationship">Qarindoshlik darajasi</Label>
            <Input
              id="relationship"
              value={form.relationship}
              onChange={(e) => updateField("relationship", e.target.value)}
              placeholder="Masalan: Otasi, Onasi, Turmush o'rtog'i"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Telefon raqami</Label>
            <Input
              id="phoneNumber"
              value={form.phoneNumber}
              onChange={(e) => updateField("phoneNumber", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="alternativePhone">Muqobil telefon</Label>
            <Input
              id="alternativePhone"
              value={form.alternativePhone}
              onChange={(e) => updateField("alternativePhone", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Manzil</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="isPrimary"
              checked={form.isPrimary}
              onCheckedChange={(checked) => updateField("isPrimary", checked)}
            />
            <Label htmlFor="isPrimary">Asosiy aloqa</Label>
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
