/**
 * @module PasswordDialog
 * @description React UI component.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordForm {
  password: string;
  confirmPassword: string;
}

interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: PasswordForm;
  onChange: (form: PasswordForm) => void;
  onSave: () => void;
  isPending: boolean;
}

export function PasswordDialog({
  open,
  onOpenChange,
  form,
  onChange,
  onSave,
  isPending
}: PasswordDialogProps) {
  const updateField = (field: keyof PasswordForm, value: string) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Parol o'rnatish</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
          <Label htmlFor="new-password">Yangi parol</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="Kamida 6 ta belgi"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              data-testid="input-new-password"
            />
          </div>
          <div className="space-y-1">
          <Label htmlFor="confirm-password">Parolni tasdiqlang</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Parolni qayta kiriting"
              value={form.confirmPassword}
              onChange={(e) => updateField("confirmPassword", e.target.value)}
              data-testid="input-confirm-password"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Bekor qilish</Button>
          <Button
            onClick={onSave}
            disabled={isPending}
            data-testid="button-save-password"
          >
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
