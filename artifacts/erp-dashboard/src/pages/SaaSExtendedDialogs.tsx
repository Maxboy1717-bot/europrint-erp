/**
 * @module SaaSExtendedDialogs
 * @description Dialog components for SaaSExtended page.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { PLAN_LABELS } from "./SaaSExtendedTypes";

import { useTranslation } from '@/lib/i18n';
interface AddTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<{
    name: string;
    domain: string;
    plan: string;
    contactEmail: string;
    contactPhone: string;
    usersLimit: number;
  }>;
  onSubmit: (data: Record<string, unknown>) => void;
  isPending: boolean;
}

export function AddTenantDialog({open, onOpenChange, form, onSubmit, isPending }: AddTenantDialogProps) {
  const { t } = useTranslation('common');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle className="text-[18px] font-semibold">Yangi Tenant Yaratish</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit((d) => onSubmit(d))}>
          <div className="space-y-1">
          <Label>Kompaniya nomi *</Label>
            <Input {...form.register("name", { required: true })} placeholder="Zavod LLC" data-testid="input-tenant-name" />
          </div>
          <div className="space-y-1">
          <Label>Domen *</Label>
            <Input {...form.register("domain", { required: true })} placeholder="zavod.uz" data-testid="input-tenant-domain" />
          </div>
          <div className="space-y-1">
          <Label>Tarif *</Label>
            <Select defaultValue="basic" onValueChange={v => form.setValue("plan", v)}>
              <SelectTrigger data-testid="select-tenant-plan" className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PLAN_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
          <Label>{t('email1')}</Label>
              <Input {...form.register("contactEmail")} type="email" placeholder="admin@zavod.uz" />
            </div>
            <div className="space-y-1">
          <Label>Telefon</Label>
              <Input {...form.register("contactPhone")} placeholder="+998 90..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Bekor</Button>
            <Button type="submit" disabled={isPending} data-testid="button-create-tenant">
              {isPending ? "Yaratilmoqda..." : "Yaratish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
