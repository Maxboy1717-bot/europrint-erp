/**
 * @module MaterialsAccountingDialogs
 * @description Dialog components for MaterialsAccounting page.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle } from "lucide-react";
import type { MovFormState } from "./MaterialsAccountingTypes";

import { useTranslation } from '@/lib/i18n';
interface RecordMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: MovFormState;
  onFormChange: (updater: (prev: MovFormState) => MovFormState) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function RecordMovementDialog({open,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
  isPending,
}: RecordMovementDialogProps) {
  const { t } = useTranslation('common');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-card/10 border-white/30 text-white hover:bg-card/20 gap-2"
          data-testid="button-record-movement"
        >
          <PlusCircle className="h-4 w-4" />
          {t("harakatniQaydEtish")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("materialHarakatiniQaydEtish")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="mov-materialId">{t('materialId1')}</Label>
            <Input
              id="mov-materialId"
              placeholder={t('materialId')}
              value={form.materialId}
              onChange={(e) => onFormChange((f) => ({ ...f, materialId: e.target.value }))}
              data-testid="input-material-id"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="mov-type">{t("harakatTuri1")}</Label>
            <Select value={form.type} onValueChange={(v) => onFormChange((f) => ({ ...f, type: v }))}>
              <SelectTrigger id="mov-type" data-testid="select-movement-type" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="incoming">{t("kirim")}</SelectItem>
                <SelectItem value="outgoing">{t("chiqim")}</SelectItem>
                <SelectItem value="transfer">{t("otkazma")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="mov-quantity">{t("quantity")}</Label>
            <Input
              id="mov-quantity"
              type="number"
              min={0}
              placeholder="100"
              value={form.quantity}
              onChange={(e) => onFormChange((f) => ({ ...f, quantity: e.target.value }))}
              data-testid="input-quantity"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="mov-notes">{t("Izoh")}</Label>
            <Input
              id="mov-notes"
              placeholder={t("izoh1")}
              value={form.notes}
              onChange={(e) => onFormChange((f) => ({ ...f, notes: e.target.value }))}
              data-testid="input-notes"
            />
          </div>
          <Button
            className="w-full"
            onClick={onSubmit}
            disabled={isPending || !form.materialId || !form.quantity}
            data-testid="button-submit-movement"
          >
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
