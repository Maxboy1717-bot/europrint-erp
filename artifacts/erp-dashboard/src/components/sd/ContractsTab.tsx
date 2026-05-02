import { SdContractsData } from "./sd-types";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const today = new Date();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KpiCard icon={FileText} label="Jami hujjatlar" value={String(contracts.totalCount || 0)} />
        <KpiCard icon={FileText} label="Shartnomalar" value={String((contracts.contracts || []).length)} />
        <KpiCard icon={AlertTriangle} label="Muddati yaqin" value={String((contracts.expiringSoon || []).length)}
          color={(contracts.expiringSoon || []).length > 0 ? "text-orange-600" : "text-green-600"} />
      </div>

      {(contracts.expiringSoon || []).length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-orange-700 dark:text-orange-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />Muddati yaqinlashayotgan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(contracts.expiringSoon || []).map((d) => {
              const daysLeft = Math.ceil((new Date(d.expiresAt).getTime() - today.getTime()) / 86400000);
              return (
                <div key={d.id} className="flex items-center justify-between text-sm">
                  <span>{d.name}</span>
                  <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    {daysLeft} kun qoldi
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="btn-add-document">
              <Plus className="h-4 w-4 mr-1" />Hujjat qo'shish
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Hujjat qo'shish</DialogTitle></DialogHeader>
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
        {(contracts.allDocuments || []).length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Hujjatlar yo'q</CardContent></Card>
        ) : (contracts.allDocuments || []).map((d) => {
          const isExpired = d.expiresAt && new Date(d.expiresAt) < today;
          const isSoon = d.expiresAt && !isExpired && new Date(d.expiresAt) < new Date(today.getTime() + 30 * 86400000);
          return (
            <Card key={d.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{d.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{typeLabel[d.type] || d.type}</Badge>
                        {d.expiresAt && (
                          <span className={`text-xs ${isExpired ? "text-destructive" : isSoon ? "text-orange-600" : "text-muted-foreground"}`}>
                            Muddat: {fmtDate(d.expiresAt)}{isExpired ? " (o'tdi)" : isSoon ? " (yaqin)" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild data-testid={`btn-view-doc-${d.id}`}>
                      <a href={d.fileUrl} target="_blank" rel="noreferrer"><Eye className="h-4 w-4" /></a>
                    </Button>
                    <Button variant="ghost" size="icon"
                      onClick={() => deleteMutation.mutate(d.id)}
                      data-testid={`btn-delete-doc-${d.id}`}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
