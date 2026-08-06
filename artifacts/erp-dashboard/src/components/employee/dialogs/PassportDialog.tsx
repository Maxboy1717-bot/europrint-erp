/**
 * @module PassportDialog
 * @description React UI component.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from '@/lib/i18n';

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
  const { t } = useTranslation("common");
  const updateField = (field: keyof PassportForm, value: string) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("pasportMalumotlariniKiritish")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label htmlFor="series">{t("seriya")}</Label>
              <Input
                id="series"
                value={form.passportSeries}
                onChange={(e) => updateField("passportSeries", e.target.value)}
                placeholder="AA"
              />
            </div>
            <div className="space-y-1">
          <Label htmlFor="number">{t("raqam")}</Label>
              <Input
                id="number"
                value={form.passportNumber}
                onChange={(e) => updateField("passportNumber", e.target.value)}
                placeholder="1234567"
              />
            </div>
          </div>
          {/* audit 2026-08-06 T29: issuedBy/birthPlace/citizenship inputs removed — employees has no backing columns (Q-35-gated), so they were silently dropped on save (Q-43 fake-save). Re-add only after the owner approves the schema addition. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label htmlFor="issuedDate">{t("berilganSana")}</Label>
              <Input
                id="issuedDate"
                type="date"
                value={form.issuedDate}
                onChange={(e) => updateField("issuedDate", e.target.value)}
              />
            </div>
            <div className="space-y-1">
          <Label htmlFor="expiryDate">{t("amalQilishMuddati")}</Label>
              <Input
                id="expiryDate"
                type="date"
                value={form.expiryDate}
                onChange={(e) => updateField("expiryDate", e.target.value)}
              />
            </div>
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
