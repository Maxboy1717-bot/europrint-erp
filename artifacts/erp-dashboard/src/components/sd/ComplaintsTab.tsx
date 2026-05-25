/**
 * @module ComplaintsTab
 * @description React UI component.
 */

import { SdComplaintsData } from "./sd-types";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, CheckCircle, XCircle, Clock, Plus, Star, ShieldAlert } from "lucide-react";
import { KpiCard, ComplaintStatusBadge, fmtDate } from "./helpers";
import { useTranslation } from '@/lib/i18n';

export function ComplaintsTab({ customerId, complaints }: { customerId: number; complaints: SdComplaintsData }) {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const complaintSchema = z.object({
    type: z.enum(["quality", "deadline", "delivery", "price", "other"]),
    description: z.string().min(1, "Tavsif kerak"),
    responsibleDepartment: z.string().optional(),
  });
  const form = useForm<z.infer<typeof complaintSchema>>({
    resolver: zodResolver(complaintSchema),
    defaultValues: { type: "quality" as const, description: "" },
  });

  const addMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", `/api/sd/customers/${customerId}/complaints`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/customers", customerId, "360"] });
      toast({ title: "Shikoyat qo'shildi" });
      setOpen(false);
      form.reset();
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ cid, data }: { cid: number; data: Record<string, unknown> }) =>
      apiRequest("POST", `/api/sd/customers/${customerId}/complaints/${cid}/resolve`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/customers", customerId, "360"] });
      toast({ title: "Shikoyat hal qilindi" });
    },
  });

  const typeLabel: Record<string, string> = {
    quality: "Sifat", deadline: "Muddat", delivery: "Yetkazish", price: "Narx", other: "Boshqa",
    complaint: "Shikoyat",
  };

  if (!complaints) return <div className="text-sm text-muted-foreground py-8 text-center">{t("malumotYuklanmadi")}</div>;

  const rawItems = complaints?.recent || (Array.isArray(complaints) ? complaints : []);
  const items = Array.isArray(rawItems) ? rawItems : [];
  const totalCount = complaints.totalCount ?? items.length;
  const resolvedCount = complaints.resolvedCount ?? items.filter((c: Record<string, unknown>) => c.status === "resolved").length;
  const openCount = complaints.openCount ?? items.filter((c: Record<string, unknown>) => c.status !== "resolved" && c.status !== "closed").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={ShieldAlert} label={t("total")} value={String(totalCount)}
          gradient="" />
        <KpiCard icon={CheckCircle} label={t("halQilingan")} value={String(resolvedCount)} color="text-[var(--ep-green)]"
          gradient="" />
        <KpiCard icon={XCircle} label={t("ochiq")} value={String(openCount)}
          color={openCount > 0 ? "text-[var(--ep-red)]" : "text-[var(--ep-green)]"}
          gradient="" />
        <KpiCard icon={Clock} label={t("ortachaHalVaqti")} value={`${complaints.averageResolutionDays || 0} kun`}
          gradient="" />
      </div>

      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary text-white border-0"
              data-testid="btn-add-complaint">
              <Plus className="h-4 w-4 mr-1" />{t("shikoyatQoshish")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="text-[18px] font-semibold">{t("shikoyatQoshish")}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(d => addMutation.mutate(d))} className="space-y-3">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem><FormLabel>{t("shikoyatTuri")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger data-testid="select-complaint-type" className="h-9"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(typeLabel).filter(([k]) => k !== "complaint").map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select></FormItem>
                )} />
                <FormField control={form.control} name="responsibleDepartment" render={({ field }) => (
                  <FormItem><FormLabel>{t("masulBolim")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder={t("tanlang")} /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="production">{t("ishlabChiqarish2")}</SelectItem>
                        <SelectItem value="logistics">{t("logistika")}</SelectItem>
                        <SelectItem value="sales">{t("savdo")}</SelectItem>
                      </SelectContent>
                    </Select></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>{t("tavsif")}</FormLabel>
                    <FormControl><Textarea {...field} rows={4} data-testid="textarea-complaint" /></FormControl>
                    <FormMessage /></FormItem>
                )} />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" type="button" onClick={() => setOpen(false)}>{t("Bekor")}</Button>
                  <Button type="submit" disabled={addMutation.isPending}>{t("Saqlash")}</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="rounded-xl border bg-card py-10 text-center text-muted-foreground text-sm">
            <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-40" />
            {t("shikoyatlarYoq")}
          </div>
        ) : items.map((c) => (
          <div key={c.id} className="rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <code className="text-[10px] bg-muted px-2 py-0.5 rounded-md font-mono">{c.complaint_number || `#${c.id}`}</code>
                  <Badge variant="outline" className="text-[10px]">{typeLabel[c.type] || c.type}</Badge>
                  <ComplaintStatusBadge status={c.status} />
                </div>
                <p className="text-sm">{String(c.description || c.notes || '')}</p>
                {c.resolution && (
                  <p className="text-xs text-[var(--ep-green)] dark:text-emerald-400 mt-1.5 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />Yechim: {c.resolution}
                  </p>
                )}
                {c.satisfaction_score && (
                  <div className="flex items-center gap-0.5 mt-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={`s-${i}`} className={`h-3.5 w-3.5 ${i < c.satisfaction_score ? "text-[var(--ep-yellow)] fill-amber-500" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-[11px] text-muted-foreground">{fmtDate(c.created_at || c.createdAt)}</span>
                {(c.status === "new" || c.status === "in_progress" || c.status === "open") && (
                  <Button size="sm" variant="outline" className="text-xs"
                    onClick={() => resolveMutation.mutate({ cid: c.id, data: { resolution: "Hal qilindi" } })}>
                    <CheckCircle className="h-3 w-3 mr-1" />{t("halQilindi")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
