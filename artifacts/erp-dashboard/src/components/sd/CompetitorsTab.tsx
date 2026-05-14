/**
 * @module CompetitorsTab
 * @description React UI component.
 */

import { SdCompetitorsData } from "./sd-types";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Target, BarChart2, Trophy, Plus, Trash2, Swords } from "lucide-react";
import { KpiCard } from "./helpers";

export function CompetitorsTab({ customerId, competitors }: { customerId: number; competitors: SdCompetitorsData }) {
  const [open, setOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const compSchema = z.object({
    competitorName: z.string().min(1, "Nom kerak"),
    productType: z.string().optional(),
    estimatedSharePercent: z.coerce.number().min(0).max(100).optional(),
    winBackPotential: z.enum(["high", "medium", "low"]).default("medium"),
    notes: z.string().optional(),
  });
  const form = useForm<z.infer<typeof compSchema>>({
    resolver: zodResolver(compSchema),
    defaultValues: { winBackPotential: "medium" as const },
  });

  const addMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", `/api/sd/customers/${customerId}/competitors`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/customers", customerId, "360"] });
      toast({ title: "Raqobatchi qo'shildi" });
      setOpen(false);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (coid: number) => apiRequest("DELETE", `/api/sd/customers/${customerId}/competitors/${coid}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/sd/customers", customerId, "360"] }),
  });

  const potConf: Record<string, { label: string; cls: string }> = {
    high: { label: "Yuqori", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200" },
    medium: { label: "O'rta", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200" },
    low: { label: "Past", cls: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200" },
  };

  if (!competitors) return <div className="text-sm text-muted-foreground py-8 text-center">Ma'lumot yuklanmadi</div>;

  const items = competitors.list || (Array.isArray(competitors) ? competitors : []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <KpiCard icon={Swords} label="Raqobatchilar" value={String(items.length)}
          gradient="" />
        <KpiCard icon={BarChart2} label="Raqobat ulushi" value={`${Math.round(competitors.totalCompetitorShare || 0)}%`}
          gradient="" />
        <KpiCard icon={Trophy} label="Bizning ulush" value={`${Math.round(competitors.ourShare || 100)}%`} color="text-[var(--ep-green)]"
          gradient="" />
      </div>

      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary text-white border-0"
              data-testid="btn-add-competitor">
              <Plus className="h-4 w-4 mr-1" />Raqobatchi qo'shish
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="text-[18px] font-semibold">Raqobatchi qo'shish</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(d => addMutation.mutate(d))} className="space-y-3">
                <FormField control={form.control} name="competitorName" render={({ field }) => (
                  <FormItem><FormLabel>Kompaniya nomi *</FormLabel>
                    <FormControl><Input {...field} data-testid="input-competitor-name" /></FormControl>
                    <FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField control={form.control} name="productType" render={({ field }) => (
                    <FormItem><FormLabel>Mahsulot turi</FormLabel>
                      <FormControl><Input {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="estimatedSharePercent" render={({ field }) => (
                    <FormItem><FormLabel>Ulush (%)</FormLabel>
                      <FormControl><Input {...field} type="number" min={0} max={100} /></FormControl></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="winBackPotential" render={({ field }) => (
                  <FormItem><FormLabel>Qaytarish imkoni</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="high">Yuqori</SelectItem>
                        <SelectItem value="medium">O'rta</SelectItem>
                        <SelectItem value="low">Past</SelectItem>
                      </SelectContent>
                    </Select></FormItem>
                )} />
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Izoh</FormLabel>
                    <FormControl><Textarea {...field} rows={2} /></FormControl></FormItem>
                )} />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" type="button" onClick={() => setOpen(false)}>Bekor</Button>
                  <Button type="submit" disabled={addMutation.isPending}>Saqlash</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="rounded-xl border bg-card py-10 text-center text-muted-foreground text-sm">
            <Swords className="h-8 w-8 mx-auto mb-2 opacity-40" />
            Raqobatchi ma'lumoti yo'q
          </div>
        ) : items.map((c) => {
          const potKey = c.win_back_potential || c.winBackPotential;
          const pot = potConf[potKey];
          return (
            <div key={c.id} className="rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm">{c.competitor_name || c.competitorName}</span>
                    {c.product_type && <Badge variant="outline" className="text-[10px]">{c.product_type}</Badge>}
                    {c.product && <Badge variant="outline" className="text-[10px]">{c.product}</Badge>}
                    {pot && <Badge className={`text-[10px] ${pot.cls}`}>{pot.label}</Badge>}
                  </div>
                  {c.estimated_share_percent && (
                    <p className="text-xs text-muted-foreground">Taxminiy ulush: {c.estimated_share_percent}%</p>
                  )}
                  {c.notes && <p className="text-xs text-muted-foreground mt-1">{c.notes}</p>}
                </div>
                <Button variant="ghost" size="icon" className="shrink-0"
                  onClick={() => setConfirmDeleteId(c.id)}
                  data-testid={`btn-delete-competitor-${c.id}`}>
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
        title="Raqobatchi ma'lumotini o'chirish"
        description="Ushbu raqobatchi yozuvini o'chirishni tasdiqlaysizmi?"
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => { if (confirmDeleteId !== null) deleteMutation.mutate(confirmDeleteId); }}
      />
    </div>
  );
}
