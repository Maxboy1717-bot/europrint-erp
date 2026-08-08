/**
 * @module PPReasonCodes
 * @description PP sabab-kodlari lug'ati (Batch 5 Item 5) — pp_reason_codes settings-CRUD.
 *   Ishlab-chiqarish kechikish/to'xtash sabablarining qayta ishlatiladigan vocabulary'si:
 *   ro'yxat (faol + nofaol), yaratish, tahrirlash, faollashtirish/o'chirish. BE: /api/pp/reason-codes.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ModulePage } from "@/components/ui/module-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { EPErrorState } from "@/components/ep";
import { tLabel } from "@/lib/i18n/tLabel";
import { Tag, Plus, Pencil } from "lucide-react";

interface ReasonCode {
  id: number;
  code: string;
  name: string;
  nameRu?: string | null;
  category: string;
  color?: string | null;
  isActive: boolean;
  sortOrder: number;
}

const CATEGORIES = [
  { value: "mashina", label: "Mashina/uskuna" },
  { value: "material", label: "Material" },
  { value: "operator", label: "Operator" },
  { value: "reja", label: "Reja/tashkiliy" },
  { value: "tashqi", label: "Tashqi" },
  { value: "boshqa", label: "Boshqa" },
];

const API = "/api/pp/reason-codes";
const emptyForm = { code: "", name: "", nameRu: "", category: "mashina", color: "#808080", sortOrder: "0" };

export default function PPReasonCodes() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const { data: raw, isLoading, isError, error, refetch } = useQuery<{ items?: ReasonCode[] }>({
    queryKey: [API, "all"],
    queryFn: async () => apiRequest("GET", `${API}?includeInactive=1`),
  });
  const items: ReasonCode[] = Array.isArray(raw?.items) ? raw!.items : [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [API] });

  const openCreate = () => { setEditId(null); setForm({ ...emptyForm }); setOpen(true); };
  const openEdit = (r: ReasonCode) => {
    setEditId(r.id);
    setForm({ code: r.code, name: r.name, nameRu: r.nameRu ?? "", category: r.category, color: r.color ?? "#808080", sortOrder: String(r.sortOrder) });
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editId === null) {
        return apiRequest("POST", API, {
          code: form.code.trim(), name: form.name.trim(), category: form.category,
          ...(form.nameRu.trim() ? { name_ru: form.nameRu.trim() } : {}),
          color: form.color, sort_order: Number(form.sortOrder) || 0,
        });
      }
      return apiRequest("PATCH", `${API}/${editId}`, {
        name: form.name.trim(), category: form.category,
        name_ru: form.nameRu.trim(), color: form.color, sort_order: Number(form.sortOrder) || 0,
      });
    },
    onSuccess: () => { invalidate(); setOpen(false); toast({ title: tLabel("common.saqlandi", "Saqlandi") }); },
    onError: (e: unknown) => toast({ title: "Xatolik", description: e instanceof Error ? e.message : tLabel("common.saqlanmadi", "Saqlanmadi"), variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async (r: ReasonCode) => apiRequest("PATCH", `${API}/${r.id}`, { is_active: !r.isActive }),
    onSuccess: () => { invalidate(); toast({ title: tLabel("common.holatYangilandi", "Holat yangilandi") }); },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  if (isError) return <EPErrorState onRetry={refetch} error={error} />;
  const canSave = form.code.trim().length > 0 && form.name.trim().length > 0;

  return (
    <ModulePage
      module="pp"
      title="Sabab Kodlari"
      subtitle="Ishlab-chiqarish kechikish/to'xtash sabablari lug'ati"
      icon={<Tag className="h-5 w-5" />}
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-reason" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> {tLabel("common.yangiKod", "Yangi kod")}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editId === null ? tLabel("common.yangiSababKodi", "Yangi sabab kodi") : tLabel("common.sababKodiTahrir", "Sabab kodini tahrirlash")}</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{tLabel("common.kod", "Kod")} *</Label>
                  <Input data-testid="input-code" value={form.code} disabled={editId !== null}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="MACH-STOP" />
                </div>
                <div>
                  <Label>{tLabel("common.tartib", "Tartib")}</Label>
                  <Input data-testid="input-sort" value={form.sortOrder}
                    onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value.replace(/\D/g, "") }))} placeholder="0" />
                </div>
              </div>
              <div>
                <Label>{tLabel("common.nomi", "Nomi")} *</Label>
                <Input data-testid="input-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={tLabel("common.phDastgohToxtashi", "Dastgoh to'xtashi")} />
              </div>
              <div>
                <Label>{tLabel("common.nomiRu", "Nomi (RU)")}</Label>
                <Input value={form.nameRu} onChange={e => setForm(f => ({ ...f, nameRu: e.target.value }))} placeholder={tLabel("common.phOstanovkaStanka", "Остановка станка")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{tLabel("common.toifa", "Toifa")}</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger data-testid="select-category"><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{tLabel("common.rang", "Rang")}</Label>
                  <Input type="color" data-testid="input-color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="h-10 p-1" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>{tLabel("common.bekor", "Bekor")}</Button>
              <Button data-testid="button-save-reason" disabled={!canSave || saveMutation.isPending} onClick={() => saveMutation.mutate()}>{tLabel("common.saqlash", "Saqlash")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : items.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{tLabel("common.sababKodiYoq", "Sabab kodlari yo'q. \"Yangi kod\" bilan qo'shing.")}</p>
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tLabel("common.kod", "Kod")}</TableHead>
                  <TableHead>{tLabel("common.nomi", "Nomi")}</TableHead>
                  <TableHead>{tLabel("common.toifa", "Toifa")}</TableHead>
                  <TableHead>{tLabel("common.tartib", "Tartib")}</TableHead>
                  <TableHead>{tLabel("common.holat", "Holat")}</TableHead>
                  <TableHead className="text-right">{tLabel("common.amal", "Amal")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(r => (
                  <TableRow key={r.id} data-testid={`row-reason-${r.id}`} className={r.isActive ? "" : "opacity-60"}>
                    <TableCell className="font-mono text-xs">
                      <span className="inline-block h-2.5 w-2.5 rounded-full mr-2 align-middle" style={{ backgroundColor: r.color || "var(--ep-border)" }} />{r.code}
                    </TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-muted-foreground">{CATEGORIES.find(c => c.value === r.category)?.label ?? r.category}</TableCell>
                    <TableCell className="text-muted-foreground">{r.sortOrder}</TableCell>
                    <TableCell>
                      <Badge variant={r.isActive ? "default" : "secondary"}>{r.isActive ? tLabel("common.faol", "Faol") : tLabel("common.nofaol", "Nofaol")}</Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button size="sm" variant="ghost" data-testid={`edit-${r.id}`} onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" data-testid={`toggle-${r.id}`} onClick={() => toggleMutation.mutate(r)}>
                        {r.isActive ? tLabel("common.ochirish", "O'chirish") : tLabel("common.faollashtirish", "Faollashtirish")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </ModulePage>
  );
}
