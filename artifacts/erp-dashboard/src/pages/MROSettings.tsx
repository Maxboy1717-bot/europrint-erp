/**
 * @module MROSettings
 * @description MRO sozlama-hub sahifasi — SD/Marketing/QC/WMS config-sahifa
 *   patternini takrorlaydi. Route: /mro/settings.
 *   Umumiy key-value sozlamalar: GET/POST /api/mro/settings + PATCH /api/mro/settings/:id.
 *   APPROVED: egasi vizyon-qurish 2026-07-01, FAZA "Sozlama har bo'limda".
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EPPageHeader, EPErrorState } from "@/components/ep";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings2, Pencil, Save, Plus } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface MroSettingRow {
  id: string;
  key: string;
  value: string | null;
  category: string | null;
  description: string | null;
  updatedAt: string | null;
}

const DEFAULT_NEW = { key: "", value: "", category: "general" };

export default function MROSettings() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newSetting, setNewSetting] = useState(DEFAULT_NEW);

  const { data, isLoading, isError, error, refetch } = useQuery<MroSettingRow[]>({
    queryKey: ["/api/mro/settings"],
    select: selectArray<MroSettingRow>,
  });

  const settings = Array.isArray(data) ? data : [];

  const saveMutation = useMutation({
    mutationFn: (entries: Record<string, string>) => apiRequest("POST", "/api/mro/settings", entries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mro/settings"] });
      toast({ title: t("sozlamaSaqlandi") });
      setNewSetting(DEFAULT_NEW);
    },
    onError: (e: unknown) => toast({ title: t("xatolik"), description: (e as Error).message, variant: "destructive" }),
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: string }) =>
      apiRequest("PATCH", `/api/mro/settings/${id}`, { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mro/settings"] });
      setEditId(null);
      toast({ title: t("sozlamaSaqlandi") });
    },
    onError: (e: unknown) => toast({ title: t("xatolik"), description: (e as Error).message, variant: "destructive" }),
  });

  const grouped = settings.reduce((acc, s) => {
    const cat = s.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {} as Record<string, MroSettingRow[]>);

  const handleAddSetting = () => {
    if (!newSetting.key.trim()) return;
    saveMutation.mutate({ [newSetting.key.trim()]: newSetting.value });
  };

  if (isLoading) return <div className="p-6"><Skeleton className="h-96 rounded-lg" /></div>;
  if (isError) return <EPErrorState onRetry={refetch} error={error} />;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5" data-testid="mro-settings">
      <EPPageHeader
        breadcrumb={<>{t("mroBoshqaruv")} · <b className="text-foreground">{t("mroSozlamalari")}</b></>}
        title={t("mroSozlamalari")}
      />

      {/* Yangi sozlama qo'shish */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            {t("yangiSozlama")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t("kalit")}</Label>
            <Input
              className="h-9 w-48"
              value={newSetting.key}
              onChange={(e) => setNewSetting((p) => ({ ...p, key: e.target.value }))}
              placeholder="pm_reminder_days_before"
              data-testid="input-mro-setting-key"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t("qiymat")}</Label>
            <Input
              className="h-9 w-40"
              value={newSetting.value}
              onChange={(e) => setNewSetting((p) => ({ ...p, value: e.target.value }))}
              data-testid="input-mro-setting-value"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t("category")}</Label>
            <Input
              className="h-9 w-36"
              value={newSetting.category}
              onChange={(e) => setNewSetting((p) => ({ ...p, category: e.target.value }))}
              placeholder="general"
            />
          </div>
          <Button
            size="sm"
            className="h-9 gap-1.5"
            disabled={!newSetting.key.trim() || saveMutation.isPending}
            onClick={handleAddSetting}
            data-testid="button-add-mro-setting"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("qoshish")}
          </Button>
        </CardContent>
      </Card>

      {/* Guruhlangan sozlamalar ro'yxati */}
      {Object.keys(grouped).length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">{t("hozirchaSozlamalarYoq")}</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {Object.entries(grouped).map(([cat, catSettings]) => (
            <Card key={cat} className="overflow-hidden">
              <CardHeader className="bg-muted/60 py-3 px-6">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{cat}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-outline-variant">
                  {catSettings.map((s) => (
                    <div key={s.id} className="flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors" data-testid={`mro-setting-${s.id}`}>
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-sm font-bold text-primary">{s.key}</p>
                        {s.description && <p className="text-xs text-muted-foreground mt-1">{s.description}</p>}
                      </div>
                      {editId === s.id ? (
                        <div className="flex items-center gap-2">
                          <Input className="w-48 h-9" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9"
                            disabled={patchMutation.isPending}
                            onClick={() => patchMutation.mutate({ id: s.id, value: editValue })}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold">{s.value || "—"}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 text-muted-foreground"
                            onClick={() => { setEditId(s.id); setEditValue(s.value || ""); }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
