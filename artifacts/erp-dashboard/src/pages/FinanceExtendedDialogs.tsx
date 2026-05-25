/**
 * @module FinanceExtendedDialogs
 * @description Dialog components for FinanceExtended page.
 */

import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { z } from "zod";
import { CostCenterSchema } from "./FinanceExtendedTypes";
import { useTranslation } from '@/lib/i18n';

type CostCenterFormValues = z.infer<typeof CostCenterSchema>;

interface CostCenterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<CostCenterFormValues>;
  onSubmit: (data: CostCenterFormValues) => void;
  isPending: boolean;
}

export function CostCenterDialog({ open, onOpenChange, form, onSubmit, isPending }: CostCenterDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("xarajatMarkaziQoshish")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
          <Label>{t("code")}</Label>
              <Input {...form.register("code")} placeholder="CC-001" data-testid="input-cc-code" />
            </div>
            <div className="space-y-1">
          <Label>{t("name")}</Label>
              <Input {...form.register("name")} placeholder={t("bosmaSexi")} />
            </div>
          </div>
          <div className="space-y-1">
          <Label>{t("byudjetSoM")}</Label>
            <Input type="number" {...form.register("budget")} placeholder="50000000" />
          </div>
          <div className="space-y-1">
          <Label>{t("progress.description")}</Label>
            <Input {...form.register("description")} />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>{t("Bekor")}</Button>
            <Button type="submit" disabled={isPending}>{t("Saqlash")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
