import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, selectArray } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, DollarSign, Trash2 } from "lucide-react";
import type { MarketingBudgetItem } from "@shared/schema";
import { ErrorState } from "@/components/ui/error-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const categoryLabels: Record<string, string> = { advertising: "Reklama", content: "Kontent", events: "Tadbirlar", pr: "PR", social: "Ijtimoiy tarmoq", tools: "Vositalar", other: "Boshqa" };
const monthNames = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];

export default function MarketingBudget() {
  const { toast } = useToast();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ category: "advertising", name: "", year: String(now.getFullYear()), month: "", plannedAmount: "", actualAmount: "", notes: "" });

  const { data: items = [], isLoading, isError, refetch} = useQuery<MarketingBudgetItem[]>({
    queryKey: ["/api/marketing/budget", { year }],
    select: selectArray<MarketingBudgetItem>,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/marketing/budget", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/marketing/budget"] }); setOpen(false); resetForm(); toast({ title: "Byudjet yozuvi yaratildi" }); },
    onError: (e: unknown) => toast({ title: "Xatolik", description: (e as Error).message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/marketing/budget/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/marketing/budget"] }); toast({ title: "Byudjet yozuvi o'chirildi" }); },
  });

  const resetForm = () => setForm({ category: "advertising", name: "", year: String(now.getFullYear()), month: "", plannedAmount: "", actualAmount: "", notes: "" });

  const handleSubmit = () => {
    const payload = { ...form, year: Number(form.year), month: form.month ? Number(form.month) : undefined, plannedAmount: form.plannedAmount || undefined, actualAmount: form.actualAmount || undefined, notes: form.notes || undefined };
    createMutation.mutate(payload);
  };

  const totalPlanned = items?.reduce((s, i) => s + Number(i.plannedAmount || 0), 0) || 0;
  const totalActual = items?.reduce((s, i) => s + Number(i.actualAmount || 0), 0) || 0;

  const groupedByCategory = items?.reduce((acc, item) => {
    const cat = item.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, MarketingBudgetItem[]>) || {};

  if (isLoading) return <div className="p-4"><Skeleton className="h-96" /></div>;

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="flex-1 overflow-auto bg-surface p-6" data-testid="marketing-budget">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <h1 className="text-4xl font-light tracking-tight text-on-surface">
          Marketing <span className="font-bold text-primary">Byudjeti</span>
        </h1>
        <div className="flex items-center gap-3">
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-32 bg-surface-container-lowest border-none" data-testid="select-budget-year"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-surface-container-lowest border-outline-variant">{([2024, 2025, 2026, 2027]).map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold" data-testid="button-create-budget">
                <Plus className="h-4 w-4 mr-2" />
                Yangi Yozuv
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-surface-container-lowest border-none ">
              <DialogHeader><DialogTitle className="text-on-surface font-bold">Yangi Byudjet Yozuvi</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5"><Label className="text-on-surface-variant">Nomi *</Label><Input className="bg-surface border-outline-variant" data-testid="input-budget-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label className="text-on-surface-variant">Kategoriya</Label><Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger className="bg-surface border-outline-variant"><SelectValue /></SelectTrigger><SelectContent className="bg-surface-container-lowest border-outline-variant">{Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1.5"><Label className="text-on-surface-variant">Yil</Label><Input className="bg-surface border-outline-variant" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label className="text-on-surface-variant">Oy</Label><Select value={form.month} onValueChange={(v) => setForm({ ...form, month: v })}><SelectTrigger className="bg-surface border-outline-variant"><SelectValue placeholder="Tanlang" /></SelectTrigger><SelectContent className="bg-surface-container-lowest border-outline-variant">{(Array.isArray(monthNames) ? monthNames : []).map((m, i) => <SelectItem key={`k-${i}`} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1.5"><Label className="text-on-surface-variant">Rejalashtirilgan</Label><Input className="bg-surface border-outline-variant" value={form.plannedAmount} onChange={(e) => setForm({ ...form, plannedAmount: e.target.value })} placeholder="0" /></div>
                </div>
                <div className="space-y-1.5"><Label className="text-on-surface-variant">Haqiqiy sarflar</Label><Input className="bg-surface border-outline-variant" value={form.actualAmount} onChange={(e) => setForm({ ...form, actualAmount: e.target.value })} placeholder="0" /></div>
                <div className="space-y-1.5"><Label className="text-on-surface-variant">Izoh</Label><Textarea className="bg-surface border-outline-variant" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                <Button onClick={handleSubmit} disabled={!form.name || !form.category || createMutation.isPending} className="w-full bg-gradient-to-br from-primary to-primary-dim text-white font-bold h-11" data-testid="button-submit-budget">Yaratish</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Rejalashtirilgan</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface">{totalPlanned.toLocaleString()} so'm</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Sarflangan</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface">{totalActual.toLocaleString()} so'm</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Qoldiq</p>
          <p className={`text-4xl font-bold tracking-tight ${(totalPlanned - totalActual) < 0 ? "text-red-500" : "text-green-600"}`}>
            {(totalPlanned - totalActual).toLocaleString()} so'm
          </p>
        </div>
      </div>

      {Object.keys(groupedByCategory).length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-6 text-center text-on-surface-variant">Hozircha {year} yilgi byudjet yozuvlari yo'q</div>
      ) : (
        <div className="grid gap-6">
          {Object.entries(groupedByCategory).map(([cat, catItems]: [string, MarketingBudgetItem[]]) => (
            <div key={cat} className="bg-surface-container-lowest rounded-xl p-6 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{categoryLabels[cat] || cat}</h3>
              </div>
              <div>
                <div className="divide-y divide-outline-variant">
                  {(Array.isArray(catItems) ? catItems : []).map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 py-3 hover:bg-surface-container-low transition-colors" data-testid={`budget-item-${item.id}`}>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-on-surface">{item.name}</span>
                        {item.month && <Badge variant="secondary" className="bg-surface-container text-on-surface-variant text-[10px] rounded-full px-2 py-0.5 font-bold no-default-hover-elevate ml-3">{monthNames[(item.month || 1) - 1]}</Badge>}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-bold text-on-surface">{Number(item.actualAmount || 0).toLocaleString()} so'm</p>
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Reja: {Number(item.plannedAmount || 0).toLocaleString()}</p>
                        </div>
                        <Button size="icon" variant="ghost" className="h-9 w-9 text-on-surface-variant hover:text-red-500 hover:bg-red-50 no-default-hover-elevate" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => { if (!v) setDeleteId(null); }}
        title="Byudjet yozuvini o'chirish"
        description="Ushbu byudjet yozuvini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        variant="destructive"
        onConfirm={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}
      />
    </div>
  );
}
