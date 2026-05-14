/**
 * @module WMSExtendedDialogs
 * @description Dialog/modal components for WMSExtended.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UseFormReturn } from "react-hook-form";
import type { UseMutationResult } from "@tanstack/react-query";
import type { TransferFormValues, InternalRequestFormValues } from "./WMSExtendedTypes";

import { useTranslation } from '@/lib/i18n';
// ─── Transfer Dialog ──────────────────────────────────────────────────────────

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<TransferFormValues>;
  mutation: UseMutationResult<unknown, unknown, Record<string, unknown>>;
}

export function TransferDialog({open, onOpenChange, form, mutation }: TransferDialogProps) {
  const { t } = useTranslation('common');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("kochirishHujjatiYaratish")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="space-y-1">
          <Label>{t("qayerdan")}</Label>
            <Input {...form.register("fromWarehouse")} placeholder={t("xomAshyoOmbori")} data-testid="input-from-wh" />
          </div>
          <div className="space-y-1">
          <Label>{t("qayerga")}</Label>
            <Input {...form.register("toWarehouse")} placeholder={t("sexOmbori")} />
          </div>
          <div className="space-y-1">
          <Label>{t("materialNomi")}</Label>
            <Input {...form.register("materialName")} />
          </div>
          <div className="space-y-1">
          <Label>{t("quantity")}</Label>
            <Input type="number" {...form.register("quantity", { valueAsNumber: true })} />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              {t("Bekor")}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {t("Yaratish")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Internal Request Dialog ──────────────────────────────────────────────────

interface InternalRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<InternalRequestFormValues>;
  mutation: UseMutationResult<unknown, unknown, Record<string, unknown>>;
}

export function InternalRequestDialog({ open, onOpenChange, form, mutation }: InternalRequestDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("materialSorovi1")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="space-y-1">
          <Label>{t("bolim1")}</Label>
            <Input {...form.register("department")} placeholder={t("bosmaSexi")} data-testid="input-department" />
          </div>
          <div className="space-y-1">
          <Label>{"Material"}</Label>
            <Input {...form.register("materialName")} />
          </div>
          <div className="space-y-1">
          <Label>{t("quantity")}</Label>
            <Input type="number" {...form.register("quantity", { valueAsNumber: true })} />
          </div>
          <div className="space-y-1">
          <Label>{t("sabab")}</Label>
            <Input {...form.register("reason")} />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              {t("Bekor")}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {t("submitBtn")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
