/**
 * @module HRConflict
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MessageSquareWarning, Plus } from "lucide-react";
import { EPStatusPill } from "@/components/ep";

const ConflictSchema = z.object({
  party1:      z.string().min(1, "1-tomon majburiy"),
  party2:      z.string().min(1, "2-tomon majburiy"),
  description: z.string().min(3, "Tavsif majburiy"),
  severity:    z.enum(["low", "medium", "high"]),
});
type ConflictData = z.infer<typeof ConflictSchema>;

interface ConflictReport {
  id: string;
  party1: string;
  party2: string;
  description: string;
  severity: string;
  status: string;
  createdAt: string;
}

const SEVERITY_LABELS: Record<string, string> = { low: "Past", medium: "O'rta", high: "Yuqori" };
const STATUS_LABELS: Record<string, string> = { open: "Ochiq", investigating: "Ko'rilmoqda", resolved: "Hal etilgan" };

export default function HRConflict() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const form = useForm<ConflictData>({
    resolver: zodResolver(ConflictSchema),
    defaultValues: { party1: "", party2: "", description: "", severity: "low" },
  });

  const { data: reports = [], isLoading } = useQuery<ConflictReport[]>({
    queryKey: ["/api/hr/conflict-reports"],
  });

  const createReport = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/hr/conflict-reports", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/conflict-reports"] });
      setShowDialog(false);
      form.reset();
      toast({ title: "Hodisa qayd etildi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const open = (reports as ConflictReport[]).filter((r) => r.status === "open").length;
  const high = (reports as ConflictReport[]).filter((r) => r.severity === "high").length;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="border-b border-border/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquareWarning className="h-5 w-5 text-[var(--ep-blue)]" />
          <h1 className="font-semibold text-base">HR — Konflikt Boshqaruvi</h1>
          {open > 0 && <EPStatusPill tone="danger">{open} ochiq</EPStatusPill>}
        </div>
        <Button size="sm" onClick={() => setShowDialog(true)} data-testid="button-add-conflict">
          <Plus className="h-3.5 w-3.5 mr-1.5" />Hodisa Qayd Etish
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {([
            { label: "Jami hodisalar", value: (reports as ConflictReport[]).length, color: "text-[var(--ep-blue)]" },
            { label: "Ochiq hodisalar", value: open, color: "text-[var(--ep-primary)]" },
            { label: "Yuqori og'irlik", value: high, color: "text-[var(--ep-red)]" },
          ]).map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="ep-table-scroll"><Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead>Tomonlar</TableHead>
                  <TableHead>Tavsif</TableHead>
                  <TableHead>Og'irlik</TableHead>
                  <TableHead>Sana</TableHead>
                  <TableHead>Holati</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-6 text-[13px] text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
                ) : (reports as ConflictReport[]).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-[13px] text-muted-foreground">
                      Kelishmovchiliklar qayd etilmagan
                    </TableCell>
                  </TableRow>
                ) : (reports as ConflictReport[]).map((r) => (
                  <TableRow key={r.id} data-testid={`row-conflict-${r.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{r.party1} / {r.party2}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{r.description}</TableCell>
                    <TableCell>
                      <Badge variant={r.severity === "high" ? "destructive" : r.severity === "medium" ? "secondary" : "outline"}>
                        {SEVERITY_LABELS[r.severity] || r.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("uz-UZ")}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "resolved" ? "default" : "outline"}>
                        {STATUS_LABELS[r.status] || r.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-[18px] font-semibold">Konflikt Hodisasini Qayd Etish</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit((d) => createReport.mutate(d))} className="space-y-4 py-2">
            <div className="space-y-1">
          <Label>1-tomon</Label>
              <Input {...form.register("party1")} placeholder="Xodim ismi" data-testid="input-party1" />
              {form.formState.errors.party1 && <p className="text-xs text-destructive">{form.formState.errors.party1.message}</p>}
            </div>
            <div className="space-y-1">
          <Label>2-tomon</Label>
              <Input {...form.register("party2")} placeholder="Xodim ismi yoki bo'lim" />
              {form.formState.errors.party2 && <p className="text-xs text-destructive">{form.formState.errors.party2.message}</p>}
            </div>
            <div className="space-y-1">
          <Label>Holat tavsifi</Label>
              <Input {...form.register("description")} />
              {form.formState.errors.description && <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>}
            </div>
            <div className="space-y-1">
          <Label>Og'irlik darajasi</Label>
              <Controller control={form.control} name="severity" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Past</SelectItem>
                    <SelectItem value="medium">O'rta</SelectItem>
                    <SelectItem value="high">Yuqori</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setShowDialog(false)}>Bekor</Button>
              <Button type="submit" disabled={createReport.isPending}>
                {createReport.isPending ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
