/**
 * @module MMExtendedDialogs
 * @description Dialog/modal components for the Materials Management Extended page.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UseFormReturn } from "react-hook-form";
import type { VendorFormValues } from "./MMExtendedTypes";

import { useTranslation } from '@/lib/i18n';
// ─── VendorDialog ─────────────────────────────────────────────────────────────

interface VendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<VendorFormValues>;
  onSubmit: (data: VendorFormValues) => void;
  isPending: boolean;
}

export function VendorDialog({open,
  onOpenChange,
  form,
  onSubmit,
  isPending,
}: VendorDialogProps) {
  const { t } = useTranslation('common');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-none rounded-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-foreground">Yangi Yetkazuvchi</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
          <Label className="text-muted-foreground">Nomi</Label>
              <Input
                {...form.register("name")}
                placeholder="Kompaniya nomi"
                data-testid="input-vendor-name"
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-1">
          <Label className="text-muted-foreground">Kod</Label>
              <Input
                {...form.register("vendorCode")}
                placeholder="V-001"
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
          <Label className="text-muted-foreground">Aloqa shaxsi</Label>
              <Input
                {...form.register("contactPerson")}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-1">
          <Label className="text-muted-foreground">Telefon</Label>
              <Input
                {...form.register("phone")}
                placeholder="+998..."
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
          <Label className="text-muted-foreground">{t('email1')}</Label>
              <Input
                type="email"
                {...form.register("email")}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-1">
          <Label className="text-muted-foreground">To'lov muddati (kun)</Label>
              <Input
                type="number"
                {...form.register("paymentTerms")}
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
              className="bg-muted/60 text-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted border-none"
            >
              Bekor
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold border-none"
            >
              Saqlash
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
