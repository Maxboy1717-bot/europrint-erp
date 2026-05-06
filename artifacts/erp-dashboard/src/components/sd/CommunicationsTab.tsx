import { SdCommunicationsData } from "./sd-types";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  const typeColor: Record<string, string> = {
    call: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    email: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    meeting: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    note: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    chat: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  };

  const items = communications?.recent || (Array.isArray(communications) ? communications : []);
  const filtered = filter === "all" ? items : (Array.isArray(items) ? items : []).filter((i) => i.type === filter);
  const upcoming = communications?.upcomingTasks || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {["all", "call", "email", "meeting", "note"].map(t => (
            <button key={t}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all
                ${filter === t
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card hover:bg-muted border-border text-muted-foreground hover:text-foreground"}`}
              onClick={() => setFilter(t)}
              data-testid={`btn-filter-${t}`}>
              {t === "all" ? "Barchasi" : typeLabel[t]}
            </button>
          ))}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0"
              data-testid="btn-add-interaction">
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

      {/* Upcoming tasks */}
      {upcoming.length > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 overflow-hidden">
          <div className="px-4 py-3 border-b border-amber-200 dark:border-amber-800">
            <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <Clock className="h-4 w-4" />Yaqinlashayotgan amallar
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {upcoming.map((t) => (
              <div key={t.id} className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="flex-1">{t.next_action}</span>
                <span className="text-xs text-muted-foreground shrink-0">{fmtDate(t.next_action_date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-xl border bg-card py-10 text-center text-muted-foreground text-sm">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
            Muloqot tarixi yo'q
          </div>
        ) : filtered.map((item) => {
          const Icon = typeIcon[item.type] || MessageSquare;
          const color = typeColor[item.type] || typeColor.note;
          return (
            <div key={item.id} className="rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{item.subject || item.notes || "Muloqot"}</span>
                    <Badge variant="outline" className="text-[10px]">{typeLabel[item.type] || item.type}</Badge>
                    {item.direction && (
                      <Badge variant="outline" className="text-[10px]">
                        {item.direction === "in" ? "Kiruvchi" : "Chiquvchi"}
                      </Badge>
                    )}
                  </div>
                  {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                  {item.notes && item.notes !== item.subject && <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>}
                  {item.employeeName && item.employeeName.trim() && (
                    <p className="text-[11px] text-muted-foreground mt-1">Xodim: {item.employeeName}</p>
                  )}
                  {item.outcome && (
                    <p className="text-xs mt-1"><span className="text-muted-foreground">Natija: </span>{item.outcome}</p>
                  )}
                  {item.next_action && (
                    <p className="text-xs mt-1.5 text-amber-700 dark:text-amber-400">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Keyingi: {item.next_action} — {fmtDate(item.next_action_date)}
                    </p>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {fmtDate(item.interaction_date || item.interactionDate || item.createdAt || item.created_at)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
