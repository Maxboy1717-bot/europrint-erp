import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PassportForm {
  passportNumber: string;
  passportSeries: string;
  issuedBy: string;
  issuedDate: string;
  expiryDate: string;
  birthPlace: string;
  citizenship: string;
}

interface PassportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: PassportForm;
  onChange: (form: PassportForm) => void;
  onSave: () => void;
  isPending: boolean;
}

export function PassportDialog({
  open,
  onOpenChange,
  form,
  onChange,
  onSave,
  isPending
}: PassportDialogProps) {
  const updateField = (field: keyof PassportForm, value: string) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pasport ma'lumotlarini kiritish</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="series">Seriya</Label>
              <Input
                id="series"
                value={form.passportSeries}
                onChange={(e) => updateField("passportSeries", e.target.value)}
                placeholder="AA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="number">Raqam</Label>
              <Input
                id="number"
                value={form.passportNumber}
                onChange={(e) => updateField("passportNumber", e.target.value)}
                placeholder="1234567"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="issuedBy">Kim tomonidan berilgan</Label>
            <Input
              id="issuedBy"
              value={form.issuedBy}
              onChange={(e) => updateField("issuedBy", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issuedDate">Berilgan sana</Label>
              <Input
                id="issuedDate"
                type="date"
                value={form.issuedDate}
                onChange={(e) => updateField("issuedDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Amal qilish muddati</Label>
              <Input
                id="expiryDate"
                type="date"
                value={form.expiryDate}
                onChange={(e) => updateField("expiryDate", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthPlace">Tug'ilgan joyi</Label>
            <Input
              id="birthPlace"
              value={form.birthPlace}
              onChange={(e) => updateField("birthPlace", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="citizenship">Fuqaroligi</Label>
            <Input
              id="citizenship"
              value={form.citizenship}
              onChange={(e) => updateField("citizenship", e.target.value)}
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
