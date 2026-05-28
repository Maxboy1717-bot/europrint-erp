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
import { useQuery, type UseMutationResult } from "@tanstack/react-query";
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
          {/* P1.23.2: severity field was missing — required by BE */}
          <div>
            <Label>{t("xavfDarajasi")}</Label>
            <Controller control={form.control} name="severity" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">{t("yengil")}</SelectItem>
                  <SelectItem value="major">{t("oʻrtacha")}</SelectItem>
                  <SelectItem value="critical">{t("kritik")}</SelectItem>
                </SelectContent>
              </Select>
            )} />
            {form.formState.errors.severity && (
              <p className="text-xs text-destructive">{form.formState.errors.severity.message}</p>
            )}
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
  // P1.23.3: load LMS courses for autocomplete
  const { data: coursesRaw } = useQuery<unknown>({ queryKey: ["/api/courses"], enabled: open });
  const courses = (() => {
    const d = coursesRaw as Record<string, unknown> | null;
    if (!d) return [];
    if (Array.isArray(d)) return d as { id: number; title: string }[];
    if (Array.isArray(d['items'])) return d['items'] as { id: number; title: string }[];
    if (Array.isArray(d['data']))  return d['data']  as { id: number; title: string }[];
    return [];
  })();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle className="text-[18px] font-semibold">{t("xavfsizlikTreningQoshish")}</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-3 py-2">
          <div><Label>{t("xodimId")}</Label><Input {...form.register("userId")} type="number" /></div>
          <div>
            <Label>{t("treningNomi")}</Label>
            {courses.length > 0 ? (
              <Controller control={form.control} name="trainingId" render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder={t("treningNominiTanlang")} /></SelectTrigger>
                  <SelectContent>
                    {courses.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
            ) : (
              <Input {...form.register("trainingName")} placeholder={t("treningNomi")} />
            )}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>{t("zonaNomi")}</Label>
              <Input {...form.register("zoneName")} />
              {form.formState.errors.zoneName && (
                <p className="text-xs text-destructive">{form.formState.errors.zoneName.message}</p>
              )}
            </div>
            {/* P1.23.4: zoneCode field was missing */}
            <div>
              <Label>{t("zonaKodi")}</Label>
              <Input {...form.register("zoneCode")} placeholder="Z-001" />
            </div>
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
          {/* P1.23.4: maxOccupancy + requiredPpe fields were missing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>{t("maksimalSig'im")}</Label>
              <Input {...form.register("maxOccupancy")} type="number" min={1} placeholder="50" />
            </div>
            <div>
              <Label>{t("talab qilinadigan himoya")}</Label>
              <Input {...form.register("requiredPpe")} placeholder="Helmet, Vest, Gloves" />
            </div>
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
