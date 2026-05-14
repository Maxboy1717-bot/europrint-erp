/**
 * @module IoTExtendedDialogs
 * @description Dialog components for IoTExtended (add sensor form).
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { UseFormReturn } from "react-hook-form";
import type { SensorFormValues } from "./IoTExtendedTypes";

export function AddSensorDialog({
  open,
  onOpenChange,
  form,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<SensorFormValues>;
  onSubmit: (data: SensorFormValues) => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Yangi Sensor Qo'shish</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
          <Label>Sensor ID</Label>
              <Input {...form.register("sensorId")} placeholder="SENS-001" data-testid="input-sensor-id" />
            </div>
            <div className="space-y-1">
          <Label>Mashina ID</Label>
              <Input {...form.register("machineId")} placeholder="MACH-001" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
          <Label>Tur</Label>
              <Input {...form.register("sensorType")} placeholder="temperature" />
            </div>
            <div className="space-y-1">
          <Label>Birlik</Label>
              <Input {...form.register("unit")} placeholder="°C" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
          <Label>Min qiymat</Label>
              <Input type="number" {...form.register("minValue", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1">
          <Label>Max qiymat</Label>
              <Input type="number" {...form.register("maxValue", { valueAsNumber: true })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Bekor</Button>
            <Button type="submit" disabled={isPending}>Saqlash</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
