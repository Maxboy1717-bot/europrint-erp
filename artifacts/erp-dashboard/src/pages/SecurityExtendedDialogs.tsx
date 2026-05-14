/**
 * @module SecurityExtendedDialogs
 * @description Dialog/Modal components for SecurityExtended.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type UseFormReturn } from "react-hook-form";
import { type VisitorFormValues } from "./SecurityExtendedTypes";

// ─── Props ────────────────────────────────────────────────────────────────

interface VisitorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<VisitorFormValues>;
  onSubmit: (data: VisitorFormValues) => void;
  isPending: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────

export function VisitorDialog({
  open,
  onOpenChange,
  form,
  onSubmit,
  isPending,
}: VisitorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border p-6">
        <DialogHeader>
          <DialogTitle className="text-foreground">Mehmon Ro'yxatdan O'tkazish</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
          <Label className="text-foreground">Ism Familiya</Label>
              <Input
                {...form.register("name")}
                placeholder="To'liq ism"
                data-testid="input-visitor-name"
                className="bg-muted/40 border-border"
              />
            </div>
            <div className="space-y-1">
          <Label className="text-foreground">Tashkilot</Label>
              <Input
                {...form.register("company")}
                placeholder="Kompaniya nomi"
                className="bg-muted/40 border-border"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
          <Label className="text-foreground">Mezbon (xodim)</Label>
              <Input
                {...form.register("host")}
                placeholder="Kim bilan uchrashuv"
                className="bg-muted/40 border-border"
              />
            </div>
            <div className="space-y-1">
          <Label className="text-foreground">Telefon</Label>
              <Input
                {...form.register("phone")}
                placeholder="+998..."
                className="bg-muted/40 border-border"
              />
            </div>
          </div>
          <div className="space-y-1">
          <Label className="text-foreground">Tashrif maqsadi</Label>
            <Input
              {...form.register("purpose")}
              placeholder="Uchrashuv, yetkazib berish..."
              className="bg-muted/40 border-border"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
              className="bg-muted/60 text-foreground hover:bg-muted border-none rounded-lg font-medium"
            >
              Bekor
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-primary text-white rounded-lg px-5 py-2 text-sm font-semibold shadow-none"
            >
              Ro'yxatdan O'tkazish
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
