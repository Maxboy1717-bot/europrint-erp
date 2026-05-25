import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Target } from "lucide-react";
import { useWasteTranslations, wasteRecordFormSchema, wasteTargetFormSchema, WASTE_TYPES, MATERIAL_TYPES, WasteTarget } from "./WasteTrackingTypes";
import { EPStatusPill } from "@/components/ep";

import { tLabel } from '@/lib/i18n/tLabel';
export function AddWasteRecordDialog() {
  const tr = useWasteTranslations();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof wasteRecordFormSchema>>({
    resolver: zodResolver(wasteRecordFormSchema),
    defaultValues: {
      wasteType: "defect",
      quantity: 0,
      unit: "kg",
      costPerUnit: 0,
      date: new Date().toISOString().split("T")[0],
      isRecyclable: false,
      recycledQuantity: 0,
      materialType: "",
      cause: "",
      correctionAction: "",
      notes: "",
      machineId: "",
      operatorId: "",
      productionOrderId: "",
      orderId: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof wasteRecordFormSchema>) =>
      apiRequest("POST", "/api/waste/records", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/waste/records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/waste/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/waste/trends"] });
      toast({ title: tLabel('common.WasteTrackingDialogs.tsx.muvaffaqiyatliSaqlandi', "Muvaffaqiyatli saqlandi") });
      setOpen(false);
      form.reset();
    },
    onError: (err: Error) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    },
  });

  const qty = form.watch("quantity");
  const cpu = form.watch("costPerUnit");
  const calculatedCost = (qty || 0) * (cpu || 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-waste-record"><Plus className="h-4 w-4 mr-1" />{tr("addRecord")}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{tr("addRecord")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="wasteType" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tr("wasteType")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger data-testid="select-waste-type" className="h-9"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(Array.isArray(WASTE_TYPES) ? WASTE_TYPES : []).map(wt => <SelectItem key={wt} value={wt}>{tr(wt)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="materialType" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tr("materialType")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl><SelectTrigger data-testid="select-material-type" className="h-9"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(Array.isArray(MATERIAL_TYPES) ? MATERIAL_TYPES : []).map(mt => <SelectItem key={mt} value={mt}>{mt}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tr("quantity")}</FormLabel>
                  <FormControl><Input type="number" step="0.1" data-testid="input-quantity" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="costPerUnit" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tr("costPerUnit")}</FormLabel>
                  <FormControl><Input type="number" step="0.01" data-testid="input-cost-per-unit" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormItem>
                <FormLabel>{tr("totalCostLabel")}</FormLabel>
                <Input value={calculatedCost.toLocaleString()} disabled data-testid="text-calculated-cost" />
              </FormItem>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tr("date")}</FormLabel>
                  <FormControl><Input type="date" data-testid="input-date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="shiftNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tr("shift")}</FormLabel>
                  <Select onValueChange={v => field.onChange(parseInt(v))} value={field.value?.toString() || ""}>
                    <FormControl><SelectTrigger data-testid="select-shift" className="h-9"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="1">1-{tr("shift").toLowerCase()}</SelectItem>
                      <SelectItem value="2">2-{tr("shift").toLowerCase()}</SelectItem>
                      <SelectItem value="3">3-{tr("shift").toLowerCase()}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="machineId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tr("machineId")}</FormLabel>
                  <FormControl><Input data-testid="input-machine-id" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="productionOrderId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tr("productionOrderId")}</FormLabel>
                  <FormControl><Input data-testid="input-production-order" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="operatorId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tr("operatorId")}</FormLabel>
                  <FormControl><Input data-testid="input-operator-id" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="cause" render={({ field }) => (
              <FormItem>
                <FormLabel>{tr("cause")}</FormLabel>
                <FormControl><Textarea data-testid="input-cause" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="correctionAction" render={({ field }) => (
              <FormItem>
                <FormLabel>{tr("correctionAction")}</FormLabel>
                <FormControl><Textarea data-testid="input-correction-action" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex items-center gap-4 flex-wrap">
              <FormField control={form.control} name="isRecyclable" render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormLabel className="mt-0">{tr("isRecyclable")}</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-recyclable" /></FormControl>
                </FormItem>
              )} />
              {form.watch("isRecyclable") && (
                <FormField control={form.control} name="recycledQuantity" render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormLabel className="mt-0">{tr("recycledQuantity")}</FormLabel>
                    <FormControl><Input type="number" step="0.1" className="w-24" data-testid="input-recycled-qty" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                  </FormItem>
                )} />
              )}
            </div>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>{tr("notes")}</FormLabel>
                <FormControl><Textarea data-testid="input-notes" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex justify-end gap-2 flex-wrap">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel">{tr("cancel")}</Button>
              <Button type="submit" disabled={mutation.isPending} data-testid="button-save-record">{tr("save")}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function TargetsTab() {
  const tr = useWasteTranslations();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const { data: targets, isLoading } = useQuery<WasteTarget[]>({
    queryKey: ["/api/waste/targets"],
  });

  const form = useForm<z.infer<typeof wasteTargetFormSchema>>({
    resolver: zodResolver(wasteTargetFormSchema),
    defaultValues: {
      targetType: "monthly",
      maxWastePercentage: 5,
      maxWasteCost: 0,
      period: new Date().toISOString().substring(0, 7),
      isActive: true,
      machineId: "",
      materialType: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof wasteTargetFormSchema>) =>
      apiRequest("POST", "/api/waste/targets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/waste/targets"] });
      toast({ title: tLabel('common.WasteTrackingDialogs.tsx.muvaffaqiyatliSaqlandi', "Muvaffaqiyatli saqlandi") });
      setOpen(false);
      form.reset();
    },
    onError: (err: Error) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-target"><Target className="h-4 w-4 mr-1" />{tr("addTarget")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="text-[18px] font-semibold">{tr("addTarget")}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
                <FormField control={form.control} name="targetType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr("targetType")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger data-testid="select-target-type" className="h-9"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="daily">{tr("daily")}</SelectItem>
                        <SelectItem value="weekly">{tr("weekly")}</SelectItem>
                        <SelectItem value="monthly">{tr("monthly")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="maxWastePercentage" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr("maxWastePercent")}</FormLabel>
                    <FormControl><Input type="number" step="0.1" data-testid="input-max-waste-pct" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="maxWasteCost" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr("maxWasteCostLabel")}</FormLabel>
                    <FormControl><Input type="number" data-testid="input-max-waste-cost" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="period" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr("period")}</FormLabel>
                    <FormControl><Input data-testid="input-target-period" placeholder="2026-02" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="machineId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr("machineId")}</FormLabel>
                    <FormControl><Input data-testid="input-target-machine" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex justify-end gap-2 flex-wrap">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel-target">{tr("cancel")}</Button>
                  <Button type="submit" disabled={mutation.isPending} data-testid="button-save-target">{tr("save")}</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Skeleton className="h-32 w-full rounded-lg" />
      ) : (!targets || targets.length === 0) ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">{tr("noData")}</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Array.isArray(targets) ? targets : []).map((target: WasteTarget) => (
            <Card key={target.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <EPStatusPill tone="neutral">{tr(target.targetType)}</EPStatusPill>
                  <span className="text-xs text-muted-foreground">{target.period}</span>
                </div>
                <p className="text-lg font-bold" data-testid={`text-target-pct-${target.id}`}>{target.maxWastePercentage}%</p>
                <p className="text-xs text-muted-foreground">{tr("maxWastePercent")}</p>
                {target.maxWasteCost && (
                  <p className="text-sm mt-1">{Number(target.maxWasteCost).toLocaleString()} UZS</p>
                )}
                {target.machineId && (
                  <p className="text-xs text-muted-foreground mt-1">{tr("machineId")}: {target.machineId}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
