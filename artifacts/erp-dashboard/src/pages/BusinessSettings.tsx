/**
 * @module BusinessSettings
 * @description Global biznes-sozlamalar ekrani — "global CRUD qoidasi" (OWNER-JAVOBLAR-2026-07-11).
 *   Threshold/norma/%/kun/daqiqa/summa qiymatlari kodga hardcode qilinmaydi; egasi shu ekrandan
 *   boshqaradi. Route: /admin/business-settings.
 *   GET /api/business-settings[?module=] · PATCH /api/business-settings/:key · POST · DELETE.
 */

import { useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Settings2, Save, Plus, Trash2 } from "lucide-react";

interface SettingRow {
  id: number;
  module: string;
  setting_key: string;
  label: string;
  value_type: string;
  value_num: string | null;
  value_text: string | null;
  unit: string | null;
  min_val: string | null;
  max_val: string | null;
  description: string | null;
  is_active: boolean;
  updated_at: string | null;
}

const NUMERIC_TYPES = ["number", "percent", "days", "minutes", "amount"];
const VALUE_TYPES = ["number", "percent", "days", "minutes", "amount", "text", "boolean"];
const DEFAULT_NEW = { module: "", settingKey: "", label: "", valueType: "number", value: "", unit: "" };

export default function BusinessSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newRow, setNewRow] = useState(DEFAULT_NEW);
  const [deleteKey, setDeleteKey] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery<SettingRow[]>({
    queryKey: ["/api/business-settings"],
    select: selectArray<SettingRow>,
  });
  const rows = Array.isArray(data) ? data : [];

  const modules = useMemo(() => Array.from(new Set(rows.map((r) => r.module))).sort(), [rows]);
  const visible = moduleFilter === "all" ? rows : rows.filter((r) => r.module === moduleFilter);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/business-settings"] });
  const onErr = (e: unknown) =>
    toast({ title: tLabel("common.xatolik", "Xatolik"), description: (e as Error).message, variant: "destructive" });

  const patchMutation = useMutation({
    mutationFn: ({ key, body }: { key: string; body: Record<string, unknown> }) =>
      apiRequest("PATCH", `/api/business-settings/${key}`, body),
    onSuccess: () => { invalidate(); toast({ title: tLabel("common.sozlamaSaqlandi", "Sozlama saqlandi") }); setEditKey(null); },
    onError: onErr,
  });
  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiRequest("POST", "/api/business-settings", body),
    onSuccess: () => { invalidate(); toast({ title: tLabel("common.yangiSozlamaQoshildi", "Yangi sozlama qo'shildi") }); setNewRow(DEFAULT_NEW); },
    onError: onErr,
  });
  const deleteMutation = useMutation({
    mutationFn: (key: string) => apiRequest("DELETE", `/api/business-settings/${key}`),
    onSuccess: () => { invalidate(); toast({ title: tLabel("common.ochirildi", "O'chirildi") }); setDeleteKey(null); },
    onError: onErr,
  });

  const startEdit = (r: SettingRow) => {
    setEditKey(r.setting_key);
    setEditValue(NUMERIC_TYPES.includes(r.value_type) ? (r.value_num ?? "") : (r.value_text ?? ""));
  };
  const saveEdit = (r: SettingRow) => {
    const body = NUMERIC_TYPES.includes(r.value_type) ? { valueNum: Number(editValue) } : { valueText: editValue };
    patchMutation.mutate({ key: r.setting_key, body });
  };
  const submitNew = () => {
    if (!newRow.module || !newRow.settingKey || !newRow.label) {
      toast({ title: tLabel("common.modulKalitNomMajburiy", "Modul, kalit va nom majburiy"), variant: "destructive" });
      return;
    }
    const isNum = NUMERIC_TYPES.includes(newRow.valueType);
    createMutation.mutate({
      module: newRow.module,
      settingKey: newRow.settingKey,
      label: newRow.label,
      valueType: newRow.valueType,
      unit: newRow.unit || undefined,
      valueNum: isNum && newRow.value !== "" ? Number(newRow.value) : undefined,
      valueText: !isNum && newRow.value !== "" ? newRow.value : undefined,
    });
  };

  return (
    <div className="space-y-6">
      <EPPageHeader
        title={tLabel("common.biznesSozlamalari", "Biznes sozlamalari")}
        subtitle={tLabel("common.bizsetSubtitle", "Threshold / norma / % / kun / summa qiymatlari — hardcode emas, shu yerdan boshqariladi")}
        icon={<Settings2 className="h-5 w-5" />}
      />

      <Card>
        <CardHeader><CardTitle className="text-base">{tLabel("common.yangiSozlama", "Yangi sozlama")}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
            <div>
              <Label>{tLabel("common.modul", "Modul")}</Label>
              <Input value={newRow.module} onChange={(e) => setNewRow({ ...newRow, module: e.target.value })} placeholder="mes" />
            </div>
            <div className="md:col-span-2">
              <Label>{tLabel("common.kalitSettingKey", "Kalit (setting_key)")}</Label>
              <Input value={newRow.settingKey} onChange={(e) => setNewRow({ ...newRow, settingKey: e.target.value })} placeholder="mes.oee_target_percent" />
            </div>
            <div className="md:col-span-2">
              <Label>{tLabel("common.nom", "Nom")}</Label>
              <Input value={newRow.label} onChange={(e) => setNewRow({ ...newRow, label: e.target.value })} placeholder="OEE" />
            </div>
            <div>
              <Label>{tLabel("common.tur", "Tur")}</Label>
              <Select value={newRow.valueType} onValueChange={(v) => setNewRow({ ...newRow, valueType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{VALUE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>{tLabel("common.qiymat", "Qiymat")}</Label>
              <Input value={newRow.value} onChange={(e) => setNewRow({ ...newRow, value: e.target.value })} />
            </div>
            <div>
              <Label>{tLabel("common.birlik", "Birlik")}</Label>
              <Input value={newRow.unit} onChange={(e) => setNewRow({ ...newRow, unit: e.target.value })} />
            </div>
            <div className="flex items-end">
              <Button onClick={submitNew} disabled={createMutation.isPending}>
                <Plus className="mr-2 h-4 w-4" /> {tLabel("common.qoshish", "Qo'shish")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Label className="text-sm">{tLabel("common.modul", "Modul")}:</Label>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tLabel("common.barchasi", "Barchasi")}</SelectItem>
            {modules.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading && <Skeleton className="h-64 w-full" />}
          {isError && <EPErrorState description={(error as Error)?.message} onRetry={() => refetch()} />}
          {!isLoading && !isError && visible.length === 0 && (
            <EPEmptyState icon={Settings2} title={tLabel("common.sozlamaYoq", "Sozlama yo'q")} description={tLabel("common.sozlamaYoqDesc", "Yuqoridan yangi sozlama qo'shing.")} />
          )}
          {!isLoading && !isError && visible.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border border-[var(--ep-border)] text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left uppercase text-xs text-muted-foreground">
                    <th className="p-2">{tLabel("common.modul", "Modul")}</th>
                    <th className="p-2">{tLabel("common.nom", "Nom")}</th>
                    <th className="p-2">{tLabel("common.kalit", "Kalit")}</th>
                    <th className="p-2">{tLabel("common.qiymat", "Qiymat")}</th>
                    <th className="p-2">{tLabel("common.birlik", "Birlik")}</th>
                    <th className="p-2 text-right">{tLabel("common.amal", "Amal")}</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => {
                    const editing = editKey === r.setting_key;
                    const shown = NUMERIC_TYPES.includes(r.value_type) ? r.value_num : r.value_text;
                    return (
                      <tr key={r.setting_key} className="border-t border-[var(--ep-border)]">
                        <td className="p-2"><Badge variant="outline">{r.module}</Badge></td>
                        <td className="p-2">{r.label}</td>
                        <td className="p-2 font-mono text-xs text-muted-foreground">{r.setting_key}</td>
                        <td className="p-2">
                          {editing ? (
                            <Input className="h-8 w-32" type={NUMERIC_TYPES.includes(r.value_type) ? "number" : "text"} value={editValue} onChange={(e) => setEditValue(e.target.value)} />
                          ) : (
                            <span className="font-medium">{shown ?? "—"}</span>
                          )}
                        </td>
                        <td className="p-2 text-muted-foreground">{r.unit ?? ""}</td>
                        <td className="p-2 text-right">
                          {editing ? (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" onClick={() => saveEdit(r)} disabled={patchMutation.isPending}>
                                <Save className="mr-1 h-3 w-3" /> {tLabel("common.saqlash", "Saqlash")}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditKey(null)}>{tLabel("common.bekor", "Bekor")}</Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => startEdit(r)}>{tLabel("common.tahrir", "Tahrir")}</Button>
                              <Button size="sm" variant="ghost" onClick={() => setDeleteKey(r.setting_key)}><Trash2 className="h-3 w-3" /></Button>
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
        open={deleteKey !== null}
        onOpenChange={(open) => { if (!open) setDeleteKey(null); }}
        title={tLabel("common.sozlamaniOchirish", "Sozlamani o'chirish")}
        description={tLabel("common.qaytarilmaydi", "Bu amalni qaytarib bo'lmaydi.")}
        confirmText={tLabel("common.ochirish", "O'chirish")}
        variant="destructive"
        onConfirm={() => { if (deleteKey) deleteMutation.mutate(deleteKey); }}
      />
    </div>
  );
}
