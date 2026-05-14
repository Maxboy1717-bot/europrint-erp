/**
 * @module CapacityPlanningDialogs
 * @description Modal dialog for creating a capacity entry. Receives open-state,
 * work-centers list, mutation pending flag, submit handler, and translation
 * helpers as props — no internal side-effects.
 * The shift-calendar dialog lives in CapacityPlanningCalendarDialog.tsx.
 */

import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { WorkCenter, CapacityFormValues } from "./CapacityPlanningTypes";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CapacityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<CapacityFormValues>;
  workCenters: WorkCenter[];
  isPending: boolean;
  onSubmit: (data: CapacityFormValues) => void;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

// ---------------------------------------------------------------------------
// CapacityDialog
// ---------------------------------------------------------------------------

export function CapacityDialog({ open, onOpenChange, form, workCenters, isPending, onSubmit, t, tCommon, }: CapacityDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-create-capacity" className="p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("addCapacity")}</DialogTitle>
          <DialogDescription>{t("defineCapacity")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="workCenterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("workCenter")} <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-work-center" className="h-9">
                        <SelectValue placeholder={tCommon("select")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Array.isArray(workCenters) ? workCenters : []).map((wc) => (
                        <SelectItem key={wc.id} value={wc.id}>
                          {wc.name} ({wc.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {tCommon("date")} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="availableHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("availableHours")} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        data-testid="input-available-hours"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="efficiency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("efficiency")} (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        data-testid="input-efficiency"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="utilizationTarget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("utilizationTarget")} (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        data-testid="input-utilization-target"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit">
                {isPending ? t("saving") : tCommon("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
