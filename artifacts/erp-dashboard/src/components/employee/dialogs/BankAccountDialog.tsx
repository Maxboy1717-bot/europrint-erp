/**
 * @module BankAccountDialog
 * @description React UI component.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from '@/lib/i18n';

interface BankAccountForm {
  bankName: string;
  accountNumber: string;
  cardNumber: string;
  cardHolderName: string;
  mfo: string;
  inn: string;
  isPrimary: boolean;
}

interface BankAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: BankAccountForm;
  onChange: (form: BankAccountForm) => void;
  onSave: () => void;
  isPending: boolean;
}

export function BankAccountDialog({
  open,
  onOpenChange,
  form,
  onChange,
  onSave,
  isPending
}: BankAccountDialogProps) {
  const { t } = useTranslation("common");
  const updateField = (field: keyof BankAccountForm, value: string | boolean) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("bankHisobRaqaminiQoshish")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1">
          <Label htmlFor="bankName">{t("bankNomi")}</Label>
            <Input
              id="bankName"
              value={form.bankName}
              onChange={(e) => updateField("bankName", e.target.value)}
            />
          </div>
          <div className="space-y-1">
          <Label htmlFor="accountNumber">{t("hisobRaqami20Raqam")}</Label>
            <Input
              id="accountNumber"
              value={form.accountNumber}
              onChange={(e) => updateField("accountNumber", e.target.value)}
            />
          </div>
          <div className="space-y-1">
          <Label htmlFor="cardNumber">{t("kartaRaqami")}</Label>
            <Input
              id="cardNumber"
              value={form.cardNumber}
              onChange={(e) => updateField("cardNumber", e.target.value)}
            />
          </div>
          <div className="space-y-1">
          <Label htmlFor="cardHolderName">{t("kartaEgasiIsmi")}</Label>
            <Input
              id="cardHolderName"
              value={form.cardHolderName}
              onChange={(e) => updateField("cardHolderName", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label htmlFor="mfo">MFO</Label>
              <Input
                id="mfo"
                value={form.mfo}
                onChange={(e) => updateField("mfo", e.target.value)}
              />
            </div>
            <div className="space-y-1">
          <Label htmlFor="inn">{t("stirInn")}</Label>
              <Input
                id="inn"
                value={form.inn}
                onChange={(e) => updateField("inn", e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="isPrimary"
              checked={form.isPrimary}
              onCheckedChange={(checked) => updateField("isPrimary", checked)}
            />
            <Label htmlFor="isPrimary">{t("asosiyHisobRaqami")}</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button onClick={onSave} disabled={isPending}>
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
