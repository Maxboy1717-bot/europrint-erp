/**
 * @module ContractsTab
 * @description React UI component.
 */

import { SdContractsData } from "./sd-types";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText, AlertTriangle, Plus, Eye, Trash2 } from "lucide-react";
import { KpiCard, fmtDate } from "./helpers";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ContractsTab({ customerId, contracts }: { customerId: number; contracts: SdContractsData }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const contractSchema = z.object({
    name: z.string().min(1, "Nom kerak"),
    type: z.string().min(1),
    fileUrl: z.string().min(1, "URL kerak"),
    expiresAt: z.string().optional(),
  });
  const form = useForm<z.infer<typeof contractSchema>>({
    resolver: zodResolver(contractSchema),
    defaultValues: { type: "contract" },
  });

  const addMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", `/api/sd/customers/${customerId}/documents`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/customers", customerId, "360"] });
      toast({ title: "Hujjat qo'shildi" });
      setOpen(false);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (did: number) => apiRequest("DELETE", `/api/sd/customers/${customerId}/documents/${did}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/sd/customers", customerId, "360"] }),
  });

  const typeLabel: Record<string, string> = {
    contract: "Shartnoma", certificate: "Sertifikat", nda: "NDA",
    invoice: "Invoice", act: "Akt", other: "Boshqa",
  };

  if (!contracts) return <div className="text-sm text-muted-foreground py-8 text-center">Ma'lumot yuklanmadi</div>;

  const allDocs = contracts.allDocuments || contracts.contracts || (Array.isArray(contracts) ? contracts : []);
  const contractDocs = (contracts.contracts || []);
  const expiringSoon = contracts.expiringSoon || [];
  const today = new Date();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <KpiCard icon={FileText} label="Jami hujjatlar" value={String(contracts.totalCount || allDocs.length)}
          gradient="" />
        <KpiCard icon={FileText} label="Shartnomalar" value={String(contractDocs.length)}
          gradient="" />
        <KpiCard icon={AlertTriangle} label="Muddati yaqin" value={String(expiringSoon.length)}
          color={expiringSoon.length > 0 ? "text-[var(--ep-primary)]" : "text-[var(--ep-green)]"}
          gradient="" />
      </div>

      {/* Expiring soon alert */}
      {expiringSoon.length > 0 && (
        <div className="rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 overflow-hidden">
          <div className="px-4 py-3 border-b border-orange-200 dark:border-orange-800">
            <h3 className="text-sm font-semibold text-[var(--ep-primary)] dark:text-orange-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />Muddati yaqinlashayotgan
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {expiringSoon.map((d) => {
              const daysLeft = Math.ceil((new Date(d.expiresAt).getTime() - today.getTime()) / 86400000);
              return (
                <div key={d.id} className="flex items-center justify-between text-sm">
                  <span>{d.name}</span>
                  <Badge className="text-[10px] bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200">
                    {daysLeft} kun qoldi
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary text-white border-0"
              data-testid="btn-add-document">
              <Plus className="h-4 w-4 mr-1" />Hujjat qo'shish
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="text-[18px] font-semibold">Hujjat qo'shish</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(d => addMutation.mutate(d))} className="space-y-3">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Nomi *</FormLabel>
                    <FormControl><Input {...field} data-testid="input-doc-name" /></FormControl>
                    <FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem><FormLabel>Turi</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(typeLabel).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select></FormItem>
                )} />
                <FormField control={form.control} name="fileUrl" render={({ field }) => (
                  <FormItem><FormLabel>Fayl URL *</FormLabel>
                    <FormControl><Input {...field} data-testid="input-doc-url" /></FormControl>
                    <FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="expiresAt" render={({ field }) => (
                  <FormItem><FormLabel>Muddati</FormLabel>
                    <FormControl><Input {...field} type="date" /></FormControl></FormItem>
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
        {allDocs.length === 0 ? (
          <div className="rounded-xl border bg-card py-10 text-center text-muted-foreground text-sm">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
            Hujjatlar yo'q
          </div>
        ) : allDocs.map((d) => {
          const expiresAt = d.expiresAt || d.endDate;
          const isExpired = expiresAt && new Date(expiresAt) < today;
          const isSoon = expiresAt && !isExpired && new Date(expiresAt) < new Date(today.getTime() + 30 * 86400000);
          return (
            <div key={d.id} className="rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-muted/80 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{d.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">{typeLabel[d.type] || d.type}</Badge>
                      {expiresAt && (
                        <span className={`text-[11px] ${isExpired ? "text-destructive font-medium" : isSoon ? "text-[var(--ep-primary)]" : "text-muted-foreground"}`}>
                          Muddat: {fmtDate(expiresAt)}{isExpired ? " (o'tdi)" : isSoon ? " (yaqin)" : ""}
                        </span>
                      )}
                      {d.notes && <span className="text-[11px] text-muted-foreground truncate">{d.notes}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {(d.fileUrl || d.url) && (
                    <Button variant="ghost" size="icon" asChild data-testid={`btn-view-doc-${d.id}`}>
                      <a href={d.fileUrl || d.url} target="_blank" rel="noreferrer"><Eye className="h-4 w-4" /></a>
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`btn-delete-doc-${d.id}`}>
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hujjatni o'chirishni tasdiqlang</AlertDialogTitle>
                        <AlertDialogDescription>Hujjat butunlay o'chiriladi.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(d.id)}>O'chirish</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
