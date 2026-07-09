/**
 * @module CRMFunnelSettings
 * @description CRM menejer sozlamalari (Batch 5 Item 6) — ikki lug'at:
 *   (1) Yo'qotish sabablari (crm_loss_reasons) va (2) Voronka bosqichlari (crm_stages).
 *   Menejer UI orqali to'ldiradi (egasi seed qilmaydi). BE: /api/crm/settings/*.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ModulePage } from "@/components/ui/module-page";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { EPErrorState } from "@/components/ep";
import { tLabel } from "@/lib/i18n/tLabel";
import { Filter, Plus, Pencil } from "lucide-react";

interface LossReason { id: number; code: string; label_uz?: string | null; label_ru?: string | null; is_active: boolean; sort_order: number; }
interface Stage { id: number; name: string; name_ru?: string | null; category_id?: number | null; sort?: number | null; color?: string | null; semantics: string; probability?: number | null; }

const SEMANTICS = [
  { value: "process", label: tLabel("common.semJarayon", "Jarayon") },
  { value: "success", label: tLabel("common.semYutuq", "Yutuq (won)") },
  { value: "fail", label: tLabel("common.semYoqotish", "Yo'qotish (lost)") },
];
const LOSS_API = "/api/crm/settings/loss-reasons";
const STAGE_API = "/api/crm/settings/stages";

export default function CRMFunnelSettings() {
  const { toast } = useToast();
  const invalidate = (key: string) => queryClient.invalidateQueries({ queryKey: [key] });

  // ── Loss reasons ──
  const lossQ = useQuery<{ items?: LossReason[] }>({
    queryKey: [LOSS_API, "all"],
    queryFn: async () => apiRequest("GET", `${LOSS_API}?includeInactive=1`),
  });
  const lossItems: LossReason[] = Array.isArray(lossQ.data?.items) ? lossQ.data!.items : [];
  const [lossOpen, setLossOpen] = useState(false);
  const [lossEditId, setLossEditId] = useState<number | null>(null);
  const [lossForm, setLossForm] = useState({ code: "", labelUz: "", labelRu: "", sortOrder: "0" });

  const lossSave = useMutation({
    mutationFn: async () => {
      if (lossEditId === null) {
        return apiRequest("POST", LOSS_API, { code: lossForm.code.trim(), labelUz: lossForm.labelUz.trim() || undefined, labelRu: lossForm.labelRu.trim() || undefined, sortOrder: Number(lossForm.sortOrder) || 0 });
      }
      return apiRequest("PATCH", `${LOSS_API}/${lossEditId}`, { labelUz: lossForm.labelUz.trim(), labelRu: lossForm.labelRu.trim(), sortOrder: Number(lossForm.sortOrder) || 0 });
    },
    onSuccess: () => { invalidate(LOSS_API); setLossOpen(false); toast({ title: tLabel("common.saqlandi", "Saqlandi") }); },
    onError: (e: unknown) => toast({ title: "Xatolik", description: e instanceof Error ? e.message : tLabel("common.saqlanmadi", "Saqlanmadi"), variant: "destructive" }),
  });
  const lossToggle = useMutation({
    mutationFn: async (r: LossReason) => apiRequest("PATCH", `${LOSS_API}/${r.id}`, { isActive: !r.is_active }),
    onSuccess: () => { invalidate(LOSS_API); toast({ title: tLabel("common.holatYangilandi", "Holat yangilandi") }); },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  // ── Stages ──
  const stageQ = useQuery<{ items?: Stage[] }>({
    queryKey: [STAGE_API, "all"],
    queryFn: async () => apiRequest("GET", STAGE_API),
  });
  const stageItems: Stage[] = Array.isArray(stageQ.data?.items) ? stageQ.data!.items : [];
  const [stageOpen, setStageOpen] = useState(false);
  const [stageEditId, setStageEditId] = useState<number | null>(null);
  const [stageForm, setStageForm] = useState({ name: "", nameRu: "", sort: "0", color: "#3366ff", semantics: "process", probability: "0" });

  const stageSave = useMutation({
    mutationFn: async () => {
      const base = { name: stageForm.name.trim(), nameRu: stageForm.nameRu.trim() || undefined, sort: Number(stageForm.sort) || 0, color: stageForm.color, semantics: stageForm.semantics, probability: Number(stageForm.probability) || 0 };
      if (stageEditId === null) return apiRequest("POST", STAGE_API, base);
      return apiRequest("PATCH", `${STAGE_API}/${stageEditId}`, base);
    },
    onSuccess: () => { invalidate(STAGE_API); setStageOpen(false); toast({ title: tLabel("common.saqlandi", "Saqlandi") }); },
    onError: (e: unknown) => toast({ title: "Xatolik", description: e instanceof Error ? e.message : tLabel("common.saqlanmadi", "Saqlanmadi"), variant: "destructive" }),
  });

  if (lossQ.isError) return <EPErrorState onRetry={lossQ.refetch} error={lossQ.error} />;

  const openLossCreate = () => { setLossEditId(null); setLossForm({ code: "", labelUz: "", labelRu: "", sortOrder: "0" }); setLossOpen(true); };
  const openLossEdit = (r: LossReason) => { setLossEditId(r.id); setLossForm({ code: r.code, labelUz: r.label_uz ?? "", labelRu: r.label_ru ?? "", sortOrder: String(r.sort_order) }); setLossOpen(true); };
  const openStageCreate = () => { setStageEditId(null); setStageForm({ name: "", nameRu: "", sort: "0", color: "#3366ff", semantics: "process", probability: "0" }); setStageOpen(true); };
  const openStageEdit = (s: Stage) => { setStageEditId(s.id); setStageForm({ name: s.name, nameRu: s.name_ru ?? "", sort: String(s.sort ?? 0), color: s.color ?? "#3366ff", semantics: s.semantics, probability: String(s.probability ?? 0) }); setStageOpen(true); };

  return (
    <ModulePage module="sd" title="Voronka Sozlamalari" subtitle="Yo'qotish sabablari va voronka bosqichlari" icon={<Filter className="h-5 w-5" />}>
      <Tabs defaultValue="loss" className="space-y-4">
        <TabsList>
          <TabsTrigger value="loss" data-testid="tab-loss">{tLabel("common.yoqotishSabablari", "Yo'qotish sabablari")}</TabsTrigger>
          <TabsTrigger value="stages" data-testid="tab-stages">{tLabel("common.voronkaBosqichlari", "Voronka bosqichlari")}</TabsTrigger>
        </TabsList>

        {/* Loss reasons */}
        <TabsContent value="loss" className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" data-testid="button-add-loss" onClick={openLossCreate}><Plus className="h-4 w-4 mr-1" /> {tLabel("common.yangiSabab", "Yangi sabab")}</Button>
          </div>
          {lossQ.isLoading ? <Skeleton className="h-40 w-full rounded-lg" /> : lossItems.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">{tLabel("common.sababYoq", "Sabab yo'q. \"Yangi sabab\" bilan qo'shing.")}</CardContent></Card>
          ) : (
            <Card><CardContent className="p-0 overflow-x-auto"><Table>
              <TableHeader><TableRow>
                <TableHead>{tLabel("common.kod", "Kod")}</TableHead><TableHead>{tLabel("common.nomi", "Nomi")}</TableHead>
                <TableHead>{tLabel("common.tartib", "Tartib")}</TableHead><TableHead>{tLabel("common.holat", "Holat")}</TableHead>
                <TableHead className="text-right">{tLabel("common.amal", "Amal")}</TableHead>
              </TableRow></TableHeader>
              <TableBody>{lossItems.map(r => (
                <TableRow key={r.id} data-testid={`loss-row-${r.id}`} className={r.is_active ? "" : "opacity-60"}>
                  <TableCell className="font-mono text-xs">{r.code}</TableCell>
                  <TableCell className="font-medium">{r.label_uz ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{r.sort_order}</TableCell>
                  <TableCell><Badge variant={r.is_active ? "default" : "secondary"}>{r.is_active ? tLabel("common.faol", "Faol") : tLabel("common.nofaol", "Nofaol")}</Badge></TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button size="sm" variant="ghost" data-testid={`loss-edit-${r.id}`} onClick={() => openLossEdit(r)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" data-testid={`loss-toggle-${r.id}`} onClick={() => lossToggle.mutate(r)}>{r.is_active ? tLabel("common.ochirish", "O'chirish") : tLabel("common.faollashtirish", "Faollashtirish")}</Button>
                  </TableCell>
                </TableRow>
              ))}</TableBody>
            </Table></CardContent></Card>
          )}
        </TabsContent>

        {/* Stages */}
        <TabsContent value="stages" className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" data-testid="button-add-stage" onClick={openStageCreate}><Plus className="h-4 w-4 mr-1" /> {tLabel("common.yangiBosqich", "Yangi bosqich")}</Button>
          </div>
          {stageQ.isLoading ? <Skeleton className="h-40 w-full rounded-lg" /> : stageItems.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">{tLabel("common.bosqichYoq", "Bosqich yo'q. \"Yangi bosqich\" bilan qo'shing.")}</CardContent></Card>
          ) : (
            <Card><CardContent className="p-0 overflow-x-auto"><Table>
              <TableHeader><TableRow>
                <TableHead>{tLabel("common.tartib", "Tartib")}</TableHead><TableHead>{tLabel("common.nomi", "Nomi")}</TableHead>
                <TableHead>{tLabel("common.semantika", "Semantika")}</TableHead><TableHead>{tLabel("common.ehtimol", "Ehtimol %")}</TableHead>
                <TableHead className="text-right">{tLabel("common.amal", "Amal")}</TableHead>
              </TableRow></TableHeader>
              <TableBody>{stageItems.map(s => (
                <TableRow key={s.id} data-testid={`stage-row-${s.id}`}>
                  <TableCell className="text-muted-foreground">{s.sort ?? 0}</TableCell>
                  <TableCell className="font-medium">
                    <span className="inline-block h-2.5 w-2.5 rounded-full mr-2 align-middle" style={{ backgroundColor: s.color || "var(--ep-border)" }} />{s.name}
                  </TableCell>
                  <TableCell><Badge variant="outline">{SEMANTICS.find(x => x.value === s.semantics)?.label ?? s.semantics}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{s.probability ?? 0}%</TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="ghost" data-testid={`stage-edit-${s.id}`} onClick={() => openStageEdit(s)}><Pencil className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table></CardContent></Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Loss dialog */}
      <Dialog open={lossOpen} onOpenChange={setLossOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{lossEditId === null ? tLabel("common.yangiSabab", "Yangi sabab") : tLabel("common.sababTahrir", "Sababni tahrirlash")}</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div><Label>{tLabel("common.kod", "Kod")} *</Label><Input data-testid="loss-code" value={lossForm.code} disabled={lossEditId !== null} onChange={e => setLossForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="PRICE" /></div>
            <div><Label>{tLabel("common.nomiUz", "Nomi (UZ)")}</Label><Input data-testid="loss-label-uz" value={lossForm.labelUz} onChange={e => setLossForm(f => ({ ...f, labelUz: e.target.value }))} /></div>
            <div><Label>{tLabel("common.nomiRu", "Nomi (RU)")}</Label><Input value={lossForm.labelRu} onChange={e => setLossForm(f => ({ ...f, labelRu: e.target.value }))} /></div>
            <div><Label>{tLabel("common.tartib", "Tartib")}</Label><Input value={lossForm.sortOrder} onChange={e => setLossForm(f => ({ ...f, sortOrder: e.target.value.replace(/\D/g, "") }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLossOpen(false)}>{tLabel("common.bekor", "Bekor")}</Button>
            <Button data-testid="loss-save" disabled={lossForm.code.trim().length === 0 || lossSave.isPending} onClick={() => lossSave.mutate()}>{tLabel("common.saqlash", "Saqlash")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stage dialog */}
      <Dialog open={stageOpen} onOpenChange={setStageOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{stageEditId === null ? tLabel("common.yangiBosqich", "Yangi bosqich") : tLabel("common.bosqichTahrir", "Bosqichni tahrirlash")}</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div><Label>{tLabel("common.nomi", "Nomi")} *</Label><Input data-testid="stage-name" value={stageForm.name} onChange={e => setStageForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>{tLabel("common.nomiRu", "Nomi (RU)")}</Label><Input value={stageForm.nameRu} onChange={e => setStageForm(f => ({ ...f, nameRu: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{tLabel("common.semantika", "Semantika")}</Label>
                <Select value={stageForm.semantics} onValueChange={v => setStageForm(f => ({ ...f, semantics: v }))}>
                  <SelectTrigger data-testid="stage-semantics"><SelectValue /></SelectTrigger>
                  <SelectContent>{SEMANTICS.map(x => <SelectItem key={x.value} value={x.value}>{x.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>{tLabel("common.tartib", "Tartib")}</Label><Input value={stageForm.sort} onChange={e => setStageForm(f => ({ ...f, sort: e.target.value.replace(/\D/g, "") }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{tLabel("common.ehtimol", "Ehtimol %")}</Label><Input data-testid="stage-prob" value={stageForm.probability} onChange={e => setStageForm(f => ({ ...f, probability: e.target.value.replace(/\D/g, "").slice(0, 3) }))} /></div>
              <div><Label>{tLabel("common.rang", "Rang")}</Label><Input type="color" value={stageForm.color} onChange={e => setStageForm(f => ({ ...f, color: e.target.value }))} className="h-10 p-1" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStageOpen(false)}>{tLabel("common.bekor", "Bekor")}</Button>
            <Button data-testid="stage-save" disabled={stageForm.name.trim().length === 0 || stageSave.isPending} onClick={() => stageSave.mutate()}>{tLabel("common.saqlash", "Saqlash")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModulePage>
  );
}
