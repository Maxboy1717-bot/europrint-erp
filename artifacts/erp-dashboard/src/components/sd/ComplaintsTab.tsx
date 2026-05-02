import { SdComplaintsData } from "./sd-types";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
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
import { AlertTriangle, CheckCircle, XCircle, Clock, Plus, Star } from "lucide-react";
import { KpiCard, ComplaintStatusBadge, fmtDate } from "./helpers";

export function ComplaintsTab({ customerId, complaints }: { customerId: number; complaints: SdComplaintsData }) {
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
      apiRequest("PUT", `/api/sd/customers/${customerId}/complaints/${cid}/resolve`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/customers", customerId, "360"] });
      toast({ title: "Shikoyat hal qilindi" });
    },
  });

  const typeLabel: Record<string, string> = {
    quality: "Sifat", deadline: "Muddat", delivery: "Yetkazish", price: "Narx", other: "Boshqa",
  };

  if (!complaints) return <div className="text-sm text-muted-foreground py-8 text-center">Ma'lumot yuklanmadi</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={AlertTriangle} label="Jami" value={String(complaints.totalCount || 0)} />
        <KpiCard icon={CheckCircle} label="Hal qilingan" value={String(complaints.resolvedCount || 0)} color="text-green-600" />
        <KpiCard icon={XCircle} label="Ochiq" value={String(complaints.openCount || 0)}
          color={complaints.openCount > 0 ? "text-destructive" : "text-green-600"} />
        <KpiCard icon={Clock} label="O'rtacha hal vaqti" value={`${complaints.averageResolutionDays || 0} kun`} />
      </div>

      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="btn-add-complaint">
              <Plus className="h-4 w-4 mr-1" />Shikoyat qo'shish
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Shikoyat qo'shish</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(d => addMutation.mutate(d))} className="space-y-3">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem><FormLabel>Shikoyat turi</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger data-testid="select-complaint-type"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(typeLabel).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select></FormItem>
                )} />
                <FormField control={form.control} name="responsibleDepartment" render={({ field }) => (
                  <FormItem><FormLabel>Mas'ul bo'lim</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="production">Ishlab chiqarish</SelectItem>
                        <SelectItem value="logistics">Logistika</SelectItem>
                        <SelectItem value="sales">Savdo</SelectItem>
                      </SelectContent>
                    </Select></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Tavsif *</FormLabel>
                    <FormControl><Textarea {...field} rows={4} data-testid="textarea-complaint" /></FormControl>
                    <FormMessage /></FormItem>
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

      <div className="space-y-3">
        {(complaints.recent || []).length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Shikoyatlar yo'q</CardContent></Card>
        ) : (complaints.recent || []).map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <code className="text-xs bg-muted px-2 py-0.5 rounded">{c.complaint_number || `#${c.id}`}</code>
                    <Badge variant="outline" className="text-xs">{typeLabel[c.type] || c.type}</Badge>
                    <ComplaintStatusBadge status={c.status} />
                  </div>
                  <p className="text-sm">{c.description}</p>
                  {c.resolution && (
                    <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                      <CheckCircle className="h-3 w-3 inline mr-1" />Yechim: {c.resolution}
                    </p>
                  )}
                  {c.satisfaction_score && (
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={`k-${i}`} className={`h-3 w-3 ${i < c.satisfaction_score ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs text-muted-foreground">{fmtDate(c.created_at)}</span>
                  {(c.status === "new" || c.status === "in_progress") && (
                    <Button size="sm" variant="outline"
                      onClick={() => resolveMutation.mutate({ cid: c.id, data: { resolution: "Hal qilindi" } })}>
                      <CheckCircle className="h-3 w-3 mr-1" />Hal qilindi
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
