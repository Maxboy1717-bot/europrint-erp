import { SdCommunicationsData } from "./sd-types";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Phone, Mail, Users, FileText, MessageSquare, Plus, Clock, Calendar } from "lucide-react";
import { fmtDate } from "./helpers";

export function CommunicationsTab({ customerId, communications }: { customerId: number; communications: SdCommunicationsData }) {
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const commSchema = z.object({
    type: z.enum(["call", "email", "meeting", "note", "chat"]),
    direction: z.enum(["in", "out"]).default("out"),
    subject: z.string().min(1, "Mavzu kerak"),
    description: z.string().optional(),
    outcome: z.string().optional(),
    nextAction: z.string().optional(),
  });
  const form = useForm<z.infer<typeof commSchema>>({
    resolver: zodResolver(commSchema),
    defaultValues: { type: "call" as const, direction: "out" as const, subject: "" },
  });

  const addMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", `/api/sd/customers/${customerId}/interactions`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/customers", customerId, "360"] });
      toast({ title: "Aloqa qo'shildi" });
      setOpen(false);
      form.reset();
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const typeIcon: Record<string, React.ComponentType<{ className?: string }>> = {
    call: Phone, email: Mail, meeting: Users, note: FileText, chat: MessageSquare,
  };
  const typeLabel: Record<string, string> = {
    call: "Qo'ng'iroq", email: "Email", meeting: "Uchrashuv", note: "Izoh", chat: "Chat",
  };

  const items = communications?.recent || [];
  const filtered = filter === "all" ? items : (Array.isArray(items) ? items : []).filter((i) => i.type === filter);
  const upcoming = communications?.upcomingTasks || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {(["all", "call", "email", "meeting", "note"]).map(t => (
            <Button key={t} variant={filter === t ? "default" : "outline"} size="sm"
              data-testid={`btn-filter-${t}`} onClick={() => setFilter(t)}>
              {t === "all" ? "Barchasi" : typeLabel[t]}
            </Button>
          ))}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="btn-add-interaction">
              <Plus className="h-4 w-4 mr-1" />Yangi aloqa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Yangi muloqot</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(d => addMutation.mutate(d))} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem><FormLabel>Tur</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger data-testid="select-interaction-type"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {Object.entries(typeLabel).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                        </SelectContent>
                      </Select></FormItem>
                  )} />
                  <FormField control={form.control} name="direction" render={({ field }) => (
                    <FormItem><FormLabel>Yo'nalish</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="out">Chiquvchi</SelectItem>
                          <SelectItem value="in">Kiruvchi</SelectItem>
                        </SelectContent>
                      </Select></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="subject" render={({ field }) => (
                  <FormItem><FormLabel>Mavzu *</FormLabel>
                    <FormControl><Input {...field} data-testid="input-subject" /></FormControl>
                    <FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Tafsilot</FormLabel>
                    <FormControl><Textarea {...field} rows={3} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="nextAction" render={({ field }) => (
                  <FormItem><FormLabel>Keyingi qadam</FormLabel>
                    <FormControl><Input {...field} /></FormControl></FormItem>
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

      {upcoming.length > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <Clock className="h-4 w-4" />Yaqinlashayotgan amallar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(Array.isArray(upcoming) ? upcoming : []).map((t) => (
              <div key={t.id} className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{t.next_action}</span>
                <span className="text-muted-foreground ml-auto">{fmtDate(t.next_action_date)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Muloqot tarixi yo'q</CardContent></Card>
        ) : (Array.isArray(filtered) ? filtered : []).map((item) => {
          const Icon = typeIcon[item.type] || MessageSquare;
          return (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-muted shrink-0"><Icon className="h-4 w-4 text-muted-foreground" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{item.subject}</span>
                      <Badge variant="outline" className="text-xs">{typeLabel[item.type] || item.type}</Badge>
                      {item.direction && (
                        <Badge variant="outline" className="text-xs">
                          {item.direction === "in" ? "Kiruvchi" : "Chiquvchi"}
                        </Badge>
                      )}
                    </div>
                    {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                    {item.outcome && (
                      <p className="text-xs mt-1"><span className="text-muted-foreground">Natija: </span>{item.outcome}</p>
                    )}
                    {item.next_action && (
                      <p className="text-xs mt-1 text-yellow-700 dark:text-yellow-400">
                        <Clock className="h-3 w-3 inline mr-1" />
                        Keyingi: {item.next_action} — {fmtDate(item.next_action_date)}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {fmtDate(item.interaction_date || item.interactionDate)}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
