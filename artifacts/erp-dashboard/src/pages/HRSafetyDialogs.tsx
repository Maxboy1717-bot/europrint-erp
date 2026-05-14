/**
 * HRSafetyDialogs.tsx
 * Dialog/modal components for HRSafety: Incident, PPE, Training, Zone.
 */
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Controller, type UseFormReturn } from "react-hook-form";
import type { UseMutationResult } from "@tanstack/react-query";
import type { IncidentData, PpeData, TrainingData, ZoneData } from "./HRSafetyTypes";
import { useTranslation } from '@/lib/i18n';

// ─── Incident Dialog ──────────────────────────────────────────────────────────
interface IncidentDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: UseFormReturn<IncidentData>;
  mutation: UseMutationResult<unknown, unknown, Record<string, unknown>>;
}
export function IncidentDialog({ open, onOpenChange, form, mutation }: IncidentDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle className="text-[18px] font-semibold">{t("xavfsizlikHodisasiQaydEtish")}</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-3 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>{t("xodimId")}</Label>
              <Input {...form.register("userId")} type="number" />
            </div>
            <div>
              <Label>{t("location")}</Label>
              <Input {...form.register("location")} />
            </div>
          </div>
          <div>
            <Label>{t("hodisaTuri")}</Label>
            <Controller control={form.control} name="incidentType" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="injury">{t("shikast")}</SelectItem>
                  <SelectItem value="near_miss">{t("deyarliHodisa")}</SelectItem>
                  <SelectItem value="property_damage">{t("mulkZarari")}</SelectItem>
                  <SelectItem value="fire">{t("yongin")}</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </div>
          <div>
            <Label>{t("progress.description")}</Label>
            <Input {...form.register("description")} />
            {form.formState.errors.description && (
              <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>
          <div>
            <Label>{t("date")}</Label>
            <Input type="date" {...form.register("incidentDate")} />
            {form.formState.errors.incidentDate && (
              <p className="text-xs text-destructive">{form.formState.errors.incidentDate.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>{t("Bekor")}</Button>
            <Button type="submit" disabled={mutation.isPending}>{t("Saqlash")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── PPE Dialog ───────────────────────────────────────────────────────────────
interface PpeDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: UseFormReturn<PpeData>;
  mutation: UseMutationResult<unknown, unknown, Record<string, unknown>>;
}
export function PpeDialog({ open, onOpenChange, form, mutation }: PpeDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle className="text-[18px] font-semibold">{t("ppeYozuviQoshish")}</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-3 py-2">
          <div>
            <Label>{t("xodimId")}</Label>
            <Input {...form.register("userId")} type="number" />
          </div>
          <div>
            <Label>{t("ppeTuri")}</Label>
            <Controller control={form.control} name="ppeType" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="helmet">{t("kaska")}</SelectItem>
                  <SelectItem value="gloves">{t("qolqop")}</SelectItem>
                  <SelectItem value="vest">{t("jilet")}</SelectItem>
                  <SelectItem value="boots">{t("botinka")}</SelectItem>
                  <SelectItem value="glasses">{t("kozoynak")}</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label>{t("berilganSana")}</Label><Input type="date" {...form.register("issuedDate")} /></div>
            <div><Label>{t("muddati")}</Label><Input type="date" {...form.register("expiryDate")} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>{t("Bekor")}</Button>
            <Button type="submit" disabled={mutation.isPending}>{t("Saqlash")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Training Dialog ──────────────────────────────────────────────────────────
interface TrainingDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: UseFormReturn<TrainingData>;
  mutation: UseMutationResult<unknown, unknown, Record<string, unknown>>;
}
export function TrainingDialog({ open, onOpenChange, form, mutation }: TrainingDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle className="text-[18px] font-semibold">{t("xavfsizlikTreningQoshish")}</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-3 py-2">
          <div><Label>{t("xodimId")}</Label><Input {...form.register("userId")} type="number" /></div>
          <div>
            <Label>{t("treningNomi")}</Label>
            <Input {...form.register("trainingName")} />
            {form.formState.errors.trainingName && (
              <p className="text-xs text-destructive">{form.formState.errors.trainingName.message}</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label>{t("date")}</Label><Input type="date" {...form.register("scheduledDate")} /></div>
            <div><Label>{t("muddati")}</Label><Input type="date" {...form.register("expiryDate")} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>{t("Bekor")}</Button>
            <Button type="submit" disabled={mutation.isPending}>{t("Saqlash")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Zone Dialog ──────────────────────────────────────────────────────────────
interface ZoneDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: UseFormReturn<ZoneData>;
  mutation: UseMutationResult<unknown, unknown, Record<string, unknown>>;
}
export function ZoneDialog({ open, onOpenChange, form, mutation }: ZoneDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle className="text-[18px] font-semibold">{t("xavfliZonaQoshish")}</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-3 py-2">
          <div>
            <Label>{t("zonaNomi")}</Label>
            <Input {...form.register("zoneName")} />
            {form.formState.errors.zoneName && (
              <p className="text-xs text-destructive">{form.formState.errors.zoneName.message}</p>
            )}
          </div>
          <div>
            <Label>{t("location")}</Label>
            <Input {...form.register("location")} />
            {form.formState.errors.location && (
              <p className="text-xs text-destructive">{form.formState.errors.location.message}</p>
            )}
          </div>
          <div>
            <Label>{t("xavfTuri")}</Label>
            <Input {...form.register("hazardType")} />
            {form.formState.errors.hazardType && (
              <p className="text-xs text-destructive">{form.formState.errors.hazardType.message}</p>
            )}
          </div>
          <div>
            <Label>{t("xavfDarajasi")}</Label>
            <Controller control={form.control} name="riskLevel" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t("low")}</SelectItem>
                  <SelectItem value="medium">{t("medium")}</SelectItem>
                  <SelectItem value="high">{t("high")}</SelectItem>
                  <SelectItem value="critical">{t("kritik")}</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>{t("Bekor")}</Button>
            <Button type="submit" disabled={mutation.isPending}>{t("Saqlash")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
