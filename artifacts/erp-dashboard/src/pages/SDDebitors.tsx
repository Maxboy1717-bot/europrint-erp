/**
 * @module SDDebitors
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { sdApi } from "@/lib/api/sd";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { fmt } from "@/lib/sd-helpers";
import { AlertCircle, RefreshCw, Send, FileText, Search, Download } from "lucide-react";
import { EPPageHeader } from "@/components/ep";

interface Debitor {
  id?: string;
  customerId?: string | number;
  customerName?: string;
  company?: string;
  total?: number;
  overdueDays?: number;
  segment?: string;
  "0-30"?: number;
  "31-60"?: number;
  "61-90"?: number;
  "90+"?: number;
  [key: string]: unknown;
}

export default function SDDebitors() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [reminderOpen, setReminderOpen] = useState<Debitor | null>(null);
  const [reminderNote, setReminderNote] = useState("");

  const { data: debitors = [], isLoading, refetch } = useQuery<Debitor[]>({
    queryKey: ["/api/sd/debitors"],
  });

  const sendReminderMutation = useMutation({
    mutationFn: (d: Debitor) =>
      sdApi.addCustomerInteraction(Number(d.customerId ?? d.id ?? 0), {
        type: "payment_reminder",
        note: reminderNote || `To'lov eslatmasi — Jami: ${fmt(d.total ?? 0)} so'm`,
        debtAmount: d.total,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sd/debitors"] });
      setReminderOpen(null);
      setReminderNote("");
      toast({ title: "Eslatma yuborildi", description: "Mijozga to'lov eslatmasi yuborildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (d: Debitor) =>
      sdApi.createInvoice({
        customerId: d.customerId ?? d.id,
        amount: d.total,
        type: "debt_invoice",
        note: "Qarzdorlik fakturasi",
      }),
    onSuccess: () => {
      toast({ title: "Faktura yaratildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const filtered = (Array.isArray(debitors) ? debitors : []).filter(d => {
    if (!search) return true;
    const name = (d.customerName || d.company || "").toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const totalDebts = (Array.isArray(debitors) ? debitors : []).reduce((sum, d) => sum + (d.total || 0), 0);
  const criticalCount = (Array.isArray(debitors) ? debitors : []).filter(d => (d["90+"] ?? 0) > 0).length;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <AlertCircle className="w-6 h-6 text-primary" />
          </div>
          <div>
            <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">Debitorlar Nazorati</b></>}
        title="Debitorlar Nazorati"
        subtitle="Muddati o'tgan to'lovlar va qarzdorlik tahlili (Aging Report)"
      />
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-card rounded-lg p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Jami qarzdorlik</p>
            <p className="text-3xl font-bold tracking-tight text-foreground mt-1">{fmt(totalDebts)} so'm</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ep-red)]">Kritik (90+ kun)</p>
            <p className="text-3xl font-bold tracking-tight text-[var(--ep-red)] mt-1">{criticalCount} ta</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Mijoz qidirish..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Yangilash
        </Button>
        <Button variant="outline" size="sm" onClick={() => {
          const rows = (Array.isArray(filtered) ? filtered : []).map(d =>
            `${d.customerName || d.company || ""},${d.total || 0},${d["90+"] || 0}`
          ).join("\n");
          const blob = new Blob([`Mijoz,Jami,90+ kun\n${rows}`], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url; a.download = "debitorlar.csv"; a.click();
          URL.revokeObjectURL(url);
        }}>
          <Download className="h-4 w-4 mr-2" />
          CSV yuklab olish
        </Button>
      </div>

      <div className="bg-card rounded-xl p-6">
        <div className="rounded-md border overflow-hidden">
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4">Mijoz</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4 text-right">Jami</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4 text-right">0-30 kun</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4 text-right">31-60 kun</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4 text-right">61-90 kun</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-[var(--ep-red)] py-3 px-4 text-right">90+ kun</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4 text-center">Holat</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4 text-center">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground bg-transparent">
                    Yuklanmoqda...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground bg-transparent">
                    Debitorlar topilmadi
                  </TableCell>
                </TableRow>
              ) : (
                (Array.isArray(filtered) ? filtered : []).map((d, i) => (
                  <TableRow key={d.customerId ?? i} className="hover:bg-muted/40 transition-colors border-none">
                    <TableCell className="py-3 px-4 font-medium border-none">
                      <div className="text-foreground">{d.customerName || d.company || `Mijoz #${String(d.customerId ?? i).slice(0, 8)}`}</div>
                      {d.segment && d.segment !== "new" && (
                        <div className="text-xs text-muted-foreground capitalize mt-0.5">{d.segment}</div>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right font-bold text-foreground border-none">{fmt(d.total ?? 0)}</TableCell>
                    <TableCell className="py-3 px-4 text-right text-muted-foreground border-none">{fmt(d["0-30"] ?? 0)}</TableCell>
                    <TableCell className="py-3 px-4 text-right text-muted-foreground border-none">{fmt(d["31-60"] ?? 0)}</TableCell>
                    <TableCell className="py-3 px-4 text-right text-muted-foreground border-none">{fmt(d["61-90"] ?? 0)}</TableCell>
                    <TableCell className="py-3 px-4 text-right text-[var(--ep-red)] font-bold border-none">{fmt(d["90+"] ?? 0)}</TableCell>
                    <TableCell className="py-3 px-4 text-center border-none">
                      <Badge className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold border-none",
                        (d["90+"] ?? 0) > 0 ? "bg-red-100 text-red-800" :
                        (d["31-60"] ?? 0) > 0 ? "bg-amber-100 text-amber-800" :
                        "bg-green-100 text-green-800"
                      )}>
                        {(d["90+"] ?? 0) > 0 ? "Kritik" : (d["31-60"] ?? 0) > 0 ? "Xatarli" : "Normal"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center border-none">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2"
                          onClick={() => { setReminderOpen(d); setReminderNote(""); }}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Eslatma
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs px-2"
                          onClick={() => createInvoiceMutation.mutate(d)}
                          disabled={createInvoiceMutation.isPending}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Faktura
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table></div>
        </div>
      </div>

      {/* Reminder dialog */}
      <Dialog open={!!reminderOpen} onOpenChange={(o) => { if (!o) setReminderOpen(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">To'lov eslatmasi yuborish</DialogTitle>
          </DialogHeader>
          {reminderOpen && (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-4 pb-3">
                  <p className="font-medium">{reminderOpen.customerName || reminderOpen.company}</p>
                  <p className="text-sm text-muted-foreground">Jami qarzdorlik: <span className="font-semibold text-[var(--ep-red)]">{fmt(reminderOpen.total ?? 0)} so'm</span></p>
                  {(reminderOpen["90+"] ?? 0) > 0 && (
                    <p className="text-xs text-[var(--ep-red)] mt-1">⚠ 90+ kunlik qarzdorlik: {fmt(reminderOpen["90+"] ?? 0)} so'm</p>
                  )}
                </CardContent>
              </Card>
              <div className="space-y-1">
          <Label>Izoh (ixtiyoriy)</Label>
                <Input
                  value={reminderNote}
                  onChange={e => setReminderNote(e.target.value)}
                  placeholder="Qo'shimcha eslatma matni..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReminderOpen(null)}>Bekor qilish</Button>
            <Button
              onClick={() => reminderOpen && sendReminderMutation.mutate(reminderOpen)}
              disabled={sendReminderMutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              Eslatma yuborish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
