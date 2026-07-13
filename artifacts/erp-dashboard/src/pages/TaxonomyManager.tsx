/**
 * @module TaxonomyManager
 * @description §2 Taksonomiya boshqaruvi — nomli ro'yxatlar (mahsulot turi, chegirma, bezash,
 *   qadoqlash, aloqa/hujjat turi...). OWNER-JAVOBLAR-2026-07-11 §2. Route: /admin/taxonomy.
 *   GET /api/taxonomy/categories · GET /api/taxonomy/:category · POST · PATCH/:id · DELETE/:id.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { tLabel } from "@/lib/i18n/tLabel";
import { EPPageHeader, EPErrorState, EPEmptyState } from "@/components/ep";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tags, Save, Plus, Trash2 } from "lucide-react";

interface Entry {
  id: number; category: string; code: string; name_uz: string; name_ru: string | null;
  sort_order: number; is_active: boolean; description: string | null;
  attrs: Record<string, unknown> | null;
}

/** operation_type uchun norm-vaqt konvensiyasi: attrs.duration_minutes (number|null). */
const getDurationMinutes = (attrs: Record<string, unknown> | null | undefined): string => {
  const v = attrs?.duration_minutes;
  return typeof v === "number" ? String(v) : "";
};

const KNOWN: [string, string][] = [
  ["product_type", "Mahsulot turi"],
  ["discount_type", "Chegirma turi"],
  ["decoration_type", "Bezash turi"],
  ["packaging_type", "Qadoqlash turi"],
  ["contact_type", "Aloqa turi"],
  ["document_type", "Hujjat turi"],
  ["code_prefix", "Kod prefiksi"],
  ["direction_type", "Yo'nalish turi"],
  ["supplier_type", "Yetkazuvchi turi"],
  ["rejection_reason", "Rad etish sababi"],
  ["paper_class", "Qog'oz sinfi"],
  ["operation_type", "Operatsiya turi"],
  ["expense_category", "Xarajat kategoriyasi"],
  ["kanban_stage", "Kanban bosqichi"],
  ["notification_category", "Xabar kategoriyasi"],
  ["org_policy_series", "Orgsiyosat seriyasi"],
  ["manager_note_category", "Menejer izoh kategoriyasi"],
];
const DEFAULT_NEW = { code: "", nameUz: "", nameRu: "", sortOrder: "", durationMinutes: "" };

export default function TaxonomyManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<string>("product_type");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [newRow, setNewRow] = useState(DEFAULT_NEW);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery<Entry[]>({
    queryKey: [`/api/taxonomy/${category}`],
    select: selectArray<Entry>,
  });
  const entries = Array.isArray(data) ? data : [];
  const key = [`/api/taxonomy/${category}`];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });
  const onErr = (e: unknown) =>
    toast({ title: tLabel("common.xatolik", "Xatolik"), description: (e as Error).message, variant: "destructive" });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiRequest("POST", "/api/taxonomy", body),
    onSuccess: () => { invalidate(); toast({ title: tLabel("common.qoshildi", "Qo'shildi") }); setNewRow(DEFAULT_NEW); },
    onError: onErr,
  });
  const patchMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      apiRequest("PATCH", `/api/taxonomy/${id}`, body),
    onSuccess: () => { invalidate(); toast({ title: tLabel("common.saqlandi", "Saqlandi") }); setEditId(null); },
    onError: onErr,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/taxonomy/${id}`),
    onSuccess: () => { invalidate(); toast({ title: tLabel("common.ochirildi", "O'chirildi") }); setDeleteId(null); },
    onError: onErr,
  });

  const submitNew = () => {
    if (!newRow.code || !newRow.nameUz) {
      toast({ title: tLabel("common.kodNomMajburiy", "Kod va nom majburiy"), variant: "destructive" });
      return;
    }
    createMutation.mutate({
      category, code: newRow.code, nameUz: newRow.nameUz,
      nameRu: newRow.nameRu || undefined,
      sortOrder: newRow.sortOrder !== "" ? Number(newRow.sortOrder) : undefined,
      attrs: category === "operation_type" && newRow.durationMinutes !== ""
        ? { duration_minutes: Number(newRow.durationMinutes) }
        : undefined,
    });
  };

  return (
    <div className="space-y-6">
      <EPPageHeader
        title={tLabel("common.taksonomiya", "Taksonomiya (nomli ro'yxatlar)")}
        subtitle={tLabel("common.taksonomiyaSub", "Mahsulot turi, chegirma, bezash, qadoqlash va boshqa lug'atlar")}
        icon={<Tags className="h-5 w-5" />}
      />

      <div className="flex items-center gap-3">
        <Label className="text-sm">{tLabel("common.kategoriya", "Kategoriya")}:</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            {KNOWN.map(([c, lbl]) => <SelectItem key={c} value={c}>{lbl}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{tLabel("common.yangiYozuv", "Yangi yozuv")}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <div>
              <Label>{tLabel("common.kod", "Kod")}</Label>
              <Input value={newRow.code} onChange={(e) => setNewRow({ ...newRow, code: e.target.value })} placeholder="korobka" />
            </div>
            <div className="md:col-span-2">
              <Label>{tLabel("common.nomUz", "Nom (uz)")}</Label>
              <Input value={newRow.nameUz} onChange={(e) => setNewRow({ ...newRow, nameUz: e.target.value })} />
            </div>
            <div>
              <Label>{tLabel("common.nomRu", "Nom (ru)")}</Label>
              <Input value={newRow.nameRu} onChange={(e) => setNewRow({ ...newRow, nameRu: e.target.value })} />
            </div>
            <div className="flex items-end gap-2">
              <div className="w-20">
                <Label>{tLabel("common.tartib", "Tartib")}</Label>
                <Input type="number" value={newRow.sortOrder} onChange={(e) => setNewRow({ ...newRow, sortOrder: e.target.value })} />
              </div>
              <Button onClick={submitNew} disabled={createMutation.isPending}>
                <Plus className="mr-1 h-4 w-4" /> {tLabel("common.qoshish", "Qo'shish")}
              </Button>
            </div>
          </div>
          {category === "operation_type" && (
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-5">
              <div>
                <Label>{tLabel("common.normVaqtDaqiqa", "Norm vaqt (daqiqa)")}</Label>
                <Input
                  type="number" min="0" className="h-9"
                  value={newRow.durationMinutes}
                  onChange={(e) => setNewRow({ ...newRow, durationMinutes: e.target.value })}
                  placeholder={tLabel("common.keyinToldiriladi", "keyinroq to'ldiriladi")}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {isLoading && <Skeleton className="h-64 w-full" />}
          {isError && <EPErrorState description={(error as Error)?.message} onRetry={() => refetch()} />}
          {!isLoading && !isError && entries.length === 0 && (
            <EPEmptyState icon={Tags} title={tLabel("common.yozuvYoq", "Yozuv yo'q")} description={tLabel("common.yozuvYoqDesc", "Yuqoridan yangi yozuv qo'shing.")} />
          )}
          {!isLoading && !isError && entries.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border border-[var(--ep-border)] text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left uppercase text-xs text-muted-foreground">
                    <th className="p-2">{tLabel("common.tartib", "Tartib")}</th>
                    <th className="p-2">{tLabel("common.kod", "Kod")}</th>
                    <th className="p-2">{tLabel("common.nomUz", "Nom (uz)")}</th>
                    <th className="p-2">{tLabel("common.nomRu", "Nom (ru)")}</th>
                    {category === "operation_type" && (
                      <th className="p-2">{tLabel("common.normVaqtDaqiqa", "Norm vaqt (daqiqa)")}</th>
                    )}
                    <th className="p-2 text-right">{tLabel("common.amal", "Amal")}</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((r) => {
                    const editing = editId === r.id;
                    return (
                      <tr key={r.id} className="border-t border-[var(--ep-border)]">
                        <td className="p-2 text-muted-foreground">{r.sort_order}</td>
                        <td className="p-2 font-mono text-xs text-muted-foreground">{r.code}</td>
                        <td className="p-2">
                          {editing ? (
                            <Input className="h-8" value={editName} onChange={(e) => setEditName(e.target.value)} />
                          ) : (
                            <span className="font-medium">{r.name_uz}</span>
                          )}
                        </td>
                        <td className="p-2 text-muted-foreground">{r.name_ru ?? "—"}</td>
                        {category === "operation_type" && (
                          <td className="p-2 text-muted-foreground">
                            {editing ? (
                              <Input
                                type="number" min="0" className="h-8 w-24"
                                value={editDuration}
                                onChange={(e) => setEditDuration(e.target.value)}
                              />
                            ) : (
                              getDurationMinutes(r.attrs) || "—"
                            )}
                          </td>
                        )}
                        <td className="p-2 text-right">
                          {editing ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => patchMutation.mutate({
                                  id: r.id,
                                  body: {
                                    nameUz: editName,
                                    ...(category === "operation_type"
                                      ? { attrs: { ...(r.attrs ?? {}), duration_minutes: editDuration !== "" ? Number(editDuration) : null } }
                                      : {}),
                                  },
                                })}
                                disabled={patchMutation.isPending}
                              >
                                <Save className="mr-1 h-3 w-3" /> {tLabel("common.saqlash", "Saqlash")}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>{tLabel("common.bekor", "Bekor")}</Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => { setEditId(r.id); setEditName(r.name_uz); setEditDuration(getDurationMinutes(r.attrs)); }}>{tLabel("common.tahrir", "Tahrir")}</Button>
                              <Button size="sm" variant="ghost" onClick={() => setDeleteId(r.id)}><Trash2 className="h-3 w-3" /></Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        title={tLabel("common.yozuvniOchirish", "Yozuvni o'chirish")}
        description={tLabel("common.qaytarilmaydi", "Bu amalni qaytarib bo'lmaydi.")}
        confirmText={tLabel("common.ochirish", "O'chirish")}
        variant="destructive"
        onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); }}
      />
    </div>
  );
}
