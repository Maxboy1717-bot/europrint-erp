/**
 * @module CommunicationsAddDialog
 * @description "Add interaction" trigger button + dialog form for CommunicationsTab.
 * Split from CommunicationsTab.tsx (Rule 16).
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { useTranslation } from '@/lib/i18n';

const TYPE_LABEL: Record<string, string> = {
  call: "Qo'ng'iroq", email: "Email", meeting: "Uchrashuv", note: "Izoh", chat: "Chat",
};

const commSchema = z.object({
  type:        z.enum(["call", "email", "meeting", "note", "chat"]),
  direction:   z.enum(["in", "out"]).default("out"),
  subject:     z.string().min(1, "Mavzu kerak"),
  description: z.string().optional(),
  outcome:     z.string().optional(),
  nextAction:  z.string().optional(),
});
type CommFormValues = z.infer<typeof commSchema>;

interface Props {
  customerId: number;
}

export function CommunicationsAddDialog({ customerId }: Props) {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const form = useForm<CommFormValues>({
    resolver: zodResolver(commSchema),
    defaultValues: { type: "call", direction: "out", subject: "" },
  });

  const addMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", `/api/sd/customers/${customerId}/interactions`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/customers", customerId, "360"] });
      toast({ title: "Aloqa qo'shildi" });
      setOpen(false);
      form.reset();
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-primary text-white border-0" data-testid="btn-add-interaction">
          <Plus className="h-4 w-4 mr-1" />{t("yangiAloqa")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiMuloqot")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(d => addMutation.mutate(d))} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem><FormLabel>{t("tur")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-interaction-type" className="h-9"><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(TYPE_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="direction" render={({ field }) => (
                <FormItem><FormLabel>{t("yonalish")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="out">{t("chiquvchi")}</SelectItem>
                      <SelectItem value="in">{t("kiruvchi")}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="subject" render={({ field }) => (
              <FormItem><FormLabel>{t("mavzu1")}</FormLabel>
                <FormControl><Input {...field} data-testid="input-subject" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>{t("tafsilot")}</FormLabel>
                <FormControl><Textarea {...field} rows={3} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="nextAction" render={({ field }) => (
              <FormItem><FormLabel>{t("keyingiQadam")}</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>{t("Bekor")}</Button>
              <Button type="submit" disabled={addMutation.isPending}>{t("Saqlash")}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
