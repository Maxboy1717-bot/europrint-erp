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

// ─── Incident Dialog ──────────────────────────────────────────────────────────
interface IncidentDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: UseFormReturn<IncidentData>;
  mutation: UseMutationResult<unknown, unknown, Record<string, unknown>>;
}
export function IncidentDialog({ open, onOpenChange, form, mutation }: IncidentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle className="text-[18px] font-semibold">Xavfsizlik Hodisasi Qayd Etish</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-3 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Xodim ID</Label>
              <Input {...form.register("userId")} type="number" />
            </div>
            <div>
              <Label>Joylashuv</Label>
              <Input {...form.register("location")} />
            </div>
          </div>
          <div>
            <Label>Hodisa turi</Label>
            <Controller control={form.control} name="incidentType" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="injury">Shikast</SelectItem>
                  <SelectItem value="near_miss">Deyarli hodisa</SelectItem>
                  <SelectItem value="property_damage">Mulk zarari</SelectItem>
                  <SelectItem value="fire">Yong'in</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </div>
          <div>
            <Label>Tavsif</Label>
            <Input {...form.register("description")} />
            {form.formState.errors.description && (
              <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>
          <div>
            <Label>Sana</Label>
            <Input type="date" {...form.register("incidentDate")} />
            {form.formState.errors.incidentDate && (
              <p className="text-xs text-destructive">{form.formState.errors.incidentDate.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Bekor</Button>
            <Button type="submit" disabled={mutation.isPending}>Saqlash</Button>
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle className="text-[18px] font-semibold">PPE Yozuvi Qo'shish</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-3 py-2">
          <div>
            <Label>Xodim ID</Label>
            <Input {...form.register("userId")} type="number" />
          </div>
          <div>
            <Label>PPE Turi</Label>
            <Controller control={form.control} name="ppeType" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="helmet">Kaska</SelectItem>
                  <SelectItem value="gloves">Qo'lqop</SelectItem>
                  <SelectItem value="vest">Jilet</SelectItem>
                  <SelectItem value="boots">Botinka</SelectItem>
                  <SelectItem value="glasses">Ko'zoynak</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label>Berilgan sana</Label><Input type="date" {...form.register("issuedDate")} /></div>
            <div><Label>Muddati</Label><Input type="date" {...form.register("expiryDate")} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Bekor</Button>
            <Button type="submit" disabled={mutation.isPending}>Saqlash</Button>
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle className="text-[18px] font-semibold">Xavfsizlik Trening Qo'shish</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-3 py-2">
          <div><Label>Xodim ID</Label><Input {...form.register("userId")} type="number" /></div>
          <div>
            <Label>Trening nomi</Label>
            <Input {...form.register("trainingName")} />
            {form.formState.errors.trainingName && (
              <p className="text-xs text-destructive">{form.formState.errors.trainingName.message}</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label>Sana</Label><Input type="date" {...form.register("scheduledDate")} /></div>
            <div><Label>Muddati</Label><Input type="date" {...form.register("expiryDate")} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Bekor</Button>
            <Button type="submit" disabled={mutation.isPending}>Saqlash</Button>
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle className="text-[18px] font-semibold">Xavfli Zona Qo'shish</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-3 py-2">
          <div>
            <Label>Zona nomi</Label>
            <Input {...form.register("zoneName")} />
            {form.formState.errors.zoneName && (
              <p className="text-xs text-destructive">{form.formState.errors.zoneName.message}</p>
            )}
          </div>
          <div>
            <Label>Joylashuv</Label>
            <Input {...form.register("location")} />
            {form.formState.errors.location && (
              <p className="text-xs text-destructive">{form.formState.errors.location.message}</p>
            )}
          </div>
          <div>
            <Label>Xavf turi</Label>
            <Input {...form.register("hazardType")} />
            {form.formState.errors.hazardType && (
              <p className="text-xs text-destructive">{form.formState.errors.hazardType.message}</p>
            )}
          </div>
          <div>
            <Label>Xavf darajasi</Label>
            <Controller control={form.control} name="riskLevel" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Past</SelectItem>
                  <SelectItem value="medium">O'rta</SelectItem>
                  <SelectItem value="high">Yuqori</SelectItem>
                  <SelectItem value="critical">Kritik</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Bekor</Button>
            <Button type="submit" disabled={mutation.isPending}>Saqlash</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
