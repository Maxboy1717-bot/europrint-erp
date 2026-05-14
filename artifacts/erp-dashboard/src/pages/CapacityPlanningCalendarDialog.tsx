/**
 * @module CapacityPlanningCalendarDialog
 * @description Modal dialog for creating a shift calendar entry. Receives
 * open-state, work-centers list, mutation pending flag, submit handler and
 * translation helpers as props — no internal side-effects.
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
import type { WorkCenter, CalendarFormValues } from "./CapacityPlanningTypes";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<CalendarFormValues>;
  workCenters: WorkCenter[];
  isPending: boolean;
  onSubmit: (data: CalendarFormValues) => void;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CalendarDialog({ open, onOpenChange, form, workCenters, isPending, onSubmit, t, tCommon, }: CalendarDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-create-calendar" className="p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("createShiftCalendar")}</DialogTitle>
          <DialogDescription>{t("defineWorkSchedule")}</DialogDescription>
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
                      <SelectTrigger data-testid="select-calendar-work-center" className="h-9">
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

            <FormField
              control={form.control}
              name="shiftName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("shiftName")} <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("k1stShift2ndShift")}
                      data-testid="input-shift-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("startTime")} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} data-testid="input-start-time" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("endTime")} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} data-testid="input-end-time" />
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
                data-testid="button-cancel-calendar"
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit-calendar">
                {isPending ? t("saving") : tCommon("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
