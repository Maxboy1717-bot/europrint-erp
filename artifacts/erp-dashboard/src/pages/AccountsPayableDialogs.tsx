/**
 * @module AccountsPayableDialogs
 * @description Dialog components for AccountsPayable.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import type { ApFormState } from "./AccountsPayableTypes";

import { useTranslation } from '@/lib/i18n';
interface AddApEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ApFormState;
  onFormChange: (updater: (prev: ApFormState) => ApFormState) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function AddApEntryDialog({open,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
  isPending,
}: AddApEntryDialogProps) {
  const { t } = useTranslation('common');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-ap-entry">
          <Plus className="h-4 w-4 mr-2" />
          Yozuv qo'shish
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Yangi yozuv qo'shish</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="ap-vendorId">Yetkazuvchi ID</Label>
            <Input
              id="ap-vendorId"
              value={form.vendorId}
              onChange={(e) => onFormChange((f) => ({ ...f, vendorId: e.target.value }))}
              placeholder={t('vendor001')}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ap-amount">Summa</Label>
            <Input
              id="ap-amount"
              type="number"
              value={form.amount}
              onChange={(e) => onFormChange((f) => ({ ...f, amount: e.target.value }))}
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ap-dueDate">Muddat</Label>
            <Input
              id="ap-dueDate"
              type="date"
              value={form.dueDate}
              onChange={(e) => onFormChange((f) => ({ ...f, dueDate: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ap-description">Tavsif</Label>
            <Input
              id="ap-description"
              value={form.description}
              onChange={(e) => onFormChange((f) => ({ ...f, description: e.target.value }))}
              placeholder="Tavsif..."
            />
          </div>
          <Button
            className="w-full"
            onClick={onSubmit}
            disabled={isPending || !form.vendorId || !form.amount}
          >
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
