/** @module MESExtendedTabsSos @description SOS tab: history list + send SOS dialog for MES Extended page. */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertOctagon } from "lucide-react";
import { SosSchema, type SosFormValues, type SosEvent } from "./MESExtendedTypes";

interface SosTabProps {
  sosHistory: SosEvent[];
  isLoading: boolean;
  workCenters: Array<{ id: string; name: string }>;
  onSubmit: (data: SosFormValues) => void;
  isPending: boolean;
}

export function SosTab({ sosHistory, isLoading, workCenters, onSubmit, isPending }: SosTabProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<SosFormValues>({
    resolver: zodResolver(SosSchema),
    defaultValues: { reason: "" },
  });

  const handleSubmit = (values: SosFormValues) => {
    onSubmit(values);
    form.reset();
    setOpen(false);
  };

  return (
    <TabsContent value="sos" className="mt-0 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <AlertOctagon className="h-5 w-5 text-destructive" />
          SOS Signallar
        </h2>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setOpen(true)}
          data-testid="button-send-sos"
        >
          <AlertOctagon className="h-4 w-4 mr-1.5" />
          SOS Yuborish
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            So'nggi SOS signallar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : sosHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <AlertOctagon className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm">Hozircha SOS signal yo'q</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sosHistory.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start justify-between rounded-lg border border-border/50 px-4 py-3 hover:bg-muted/30 transition-colors"
                  data-testid={`row-sos-${event.id}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="destructive" className="text-xs shrink-0">SOS</Badge>
                      {event.work_center_name && (
                        <Badge variant="outline" className="text-xs">{event.work_center_name}</Badge>
                      )}
                    </div>
                    <p className="text-sm mt-1 text-foreground">{event.reason}</p>
                    {event.employee_name?.trim() && (
                      <p className="text-xs text-muted-foreground mt-0.5">{event.employee_name}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground ml-3 shrink-0">
                    {new Date(event.created_at).toLocaleString("uz-UZ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold flex items-center gap-2 text-destructive">
              <AlertOctagon className="h-5 w-5" />
              SOS Signal Yuborish
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sabab <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Vaziyatni qisqacha tushuntiring..."
                        className="min-h-[80px]"
                        data-testid="input-sos-reason"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="work_center_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ish markazi (ixtiyoriy)</FormLabel>
                    <Select
                      onValueChange={v => field.onChange(v ? Number(v) : undefined)}
                      value={field.value ? String(field.value) : ""}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-sos-work-center" className="h-9">
                          <SelectValue placeholder="Tanlang..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.isArray(workCenters) && workCenters.map(wc => (
                          <SelectItem key={wc.id} value={wc.id}>{wc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setOpen(false); form.reset(); }}
                  data-testid="button-cancel-sos"
                >
                  Bekor
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isPending}
                  data-testid="button-confirm-sos"
                >
                  {isPending ? "Yuborilmoqda..." : "SOS Yuborish"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </TabsContent>
  );
}
