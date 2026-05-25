/**
 * @module AccountsReceivableDialogs
 * @description Dialog components for AccountsReceivable.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import type { ArFormState } from "./AccountsReceivableTypes";

import { useTranslation } from '@/lib/i18n';
interface AddArEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ArFormState;
  onFormChange: (updater: (prev: ArFormState) => ArFormState) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function AddArEntryDialog({open,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
  isPending,
}: AddArEntryDialogProps) {
  const { t } = useTranslation('common');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-ar-entry">
          <Plus className="h-4 w-4 mr-2" />
          {t("yozuvQoshish")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiYozuvQoshish")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="ar-customerId">{t("mijozId")}</Label>
            <Input
              id="ar-customerId"
              value={form.customerId}
              onChange={(e) => onFormChange((f) => ({ ...f, customerId: e.target.value }))}
              placeholder={t('customer001')}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ar-amount">{t("summa")}</Label>
            <Input
              id="ar-amount"
              type="number"
              value={form.amount}
              onChange={(e) => onFormChange((f) => ({ ...f, amount: e.target.value }))}
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ar-dueDate">{t("muddat")}</Label>
            <Input
              id="ar-dueDate"
              type="date"
              value={form.dueDate}
              onChange={(e) => onFormChange((f) => ({ ...f, dueDate: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ar-description">{t("progress.description")}</Label>
            <Input
              id="ar-description"
              value={form.description}
              onChange={(e) => onFormChange((f) => ({ ...f, description: e.target.value }))}
              placeholder={t("tavsif1")}
            />
          </div>
          <Button
            className="w-full"
            onClick={onSubmit}
            disabled={isPending || !form.customerId || !form.amount}
          >
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
