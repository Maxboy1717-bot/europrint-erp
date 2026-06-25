/**
 * @module RazryadTab
 * @description Karta-detal "Razryad" tab (egasi 2026-06-25: "razryad mana shu tabda bo'lsin").
 *   Kartaning razryadini TANLASH (PATCH razryad_level_id) + razryad ma'nosi (koeff/oylik-band/talab/
 *   imtihon/sertifikat/keyingi-razryadgacha) + razryad narvoni (1->6 o'sish yo'li). Intervyu modeli
 *   (EP-ORG-008..013): razryad -> talab -> o'sish -> oylik. Razryad qiymatlari egasi-data (fabrikatsiya yo'q).
 */

import { type ReactNode, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Award, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { EPLoader } from "@/components/ep";
import { RazryadLevelsPanel } from "@/components/hr/org/RazryadLevelsPanel";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { NodeDetail } from "./types";
import { useTranslation } from "@/lib/i18n";

interface RazryadLevel {
  id: number;
  level: number;
  name: string;
  coefficient?: number | string | null;
  salary_min?: number | string | null;
  salary_max?: number | string | null;
  min_requirement?: string | null;
  min_months?: number | null;
  exam_type?: string | null;
  certificate?: string | null;
}

function fmtSom(v: number | string | null | undefined): string | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : `${n.toLocaleString("uz-UZ")} so'm`;
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export function RazryadTab({ node }: { node: NodeDetail }) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cfgOpen, setCfgOpen] = useState(false);

  const { data, isLoading } = useQuery<{ items: RazryadLevel[] }>({
    queryKey: ["/api/org-structure/razryad-levels"],
    staleTime: 300_000,
  });
  const levels = Array.isArray(data?.items) ? [...data.items].sort((a, b) => a.level - b.level) : [];
  const current = node.razryadLevelId != null ? levels.find((r) => r.id === node.razryadLevelId) : undefined;

  const setRazryad = useMutation({
    mutationFn: (rid: number | null) =>
      apiRequest("PATCH", `/api/org-structure/nodes/${node.id}`, { razryadLevelId: rid }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/org-structure/nodes/${node.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/org-structure/hierarchy"] });
      toast({ title: t("razryadSaqlandi", "Razryad saqlandi") });
    },
    onError: () => toast({ title: t("Xatolik"), variant: "destructive" }),
  });

  // VISION (EP-ORG-010..013): razryad o'sish so'rovi (imtihon -> HR+rahbar 2-imzo -> o'zgaradi) + tarix.
  const [reqTarget, setReqTarget] = useState<string>("");
  const [reqScore, setReqScore] = useState<string>("");
  const { data: histData } = useQuery<{ items: Record<string, unknown>[] }>({
    queryKey: [`/api/org-structure/cards/${node.id}/razryad-history`],
    staleTime: 30_000,
  });
  const history = Array.isArray(histData?.items) ? histData!.items : [];

  const createRequest = useMutation({
    mutationFn: () => apiRequest<{ message?: string }>("POST", `/api/org-structure/cards/${node.id}/razryad-requests`, {
      targetRazryadId: Number(reqTarget),
      requestType: "increase",
      examScore: reqScore.trim() === "" ? undefined : Number(reqScore),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/org-structure/cards/${node.id}/razryad-history`] });
      setReqTarget(""); setReqScore("");
      toast({ title: t("osishSorovYuborildi", "O'sish so'rovi yuborildi (HR + rahbar tasdig'i kutilmoqda)") });
    },
    onError: (e: unknown) => toast({ title: e instanceof Error ? e.message : t("Xatolik"), variant: "destructive" }),
  });

  if (isLoading) return <EPLoader />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-sm flex items-center gap-2"><Award className="h-4 w-4" />{t("kartaRazryadi", "Karta razryadi")}</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setCfgOpen(true)} data-testid="button-razryad-config">
            <Settings2 className="h-3.5 w-3.5 mr-1.5" />{t("darajalarniSozlash", "Darajalarni sozlash")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Select
              value={node.razryadLevelId == null ? "__none__" : String(node.razryadLevelId)}
              onValueChange={(v) => setRazryad.mutate(v === "__none__" ? null : Number(v))}
            >
              <SelectTrigger className="w-64" data-testid="select-card-razryad">
                <SelectValue placeholder={t("razryadTanlang", "Razryad tanlang")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— {t("tayinlanmagan", "Tayinlanmagan")}</SelectItem>
                {levels.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.name}{r.coefficient != null ? ` · ×${r.coefficient}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {current && <Badge className="text-[13px] px-2 py-0.5">{current.name}</Badge>}
            {setRazryad.isPending && <span className="text-xs text-muted-foreground">{t("saqlanmoqda", "Saqlanmoqda...")}</span>}
          </div>

          {current ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm border-t border-border/60 pt-3">
              {current.coefficient != null && <Row label={t("oylikKoeffitsiyent", "Oylik koeffitsiyent")} value={`×${current.coefficient}`} />}
              {(fmtSom(current.salary_min) || fmtSom(current.salary_max)) && (
                <Row label={t("oylikBandi", "Oylik bandi")} value={`${fmtSom(current.salary_min) ?? "—"} – ${fmtSom(current.salary_max) ?? "—"}`} />
              )}
              {current.min_requirement && <Row label={t("minimalTalab", "Minimal talab")} value={current.min_requirement} />}
              {current.exam_type && <Row label={t("imtihonTuri", "Imtihon turi")} value={current.exam_type} />}
              {current.certificate && <Row label={t("sertifikat", "Sertifikat")} value={current.certificate} />}
              {current.min_months != null && <Row label={t("keyingiRazryadgacha", "Keyingi razryadgacha")} value={`${current.min_months} ${t("oy", "oy")}`} />}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground border-t border-border/60 pt-3">
              {t("kartaRazryadYoq", "Bu kartaga razryad tayinlanmagan. Yuqoridan tanlang.")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("razryadNarvoni", "Razryad narvoni (o'sish yo'li)")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {levels.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("razryadlarSozlanmagan", "Razryad darajalari sozlanmagan.")}</p>
          ) : (
            levels.map((r) => {
              const isCur = r.id === node.razryadLevelId;
              return (
                <div
                  key={r.id}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${isCur ? "border-amber-400 bg-amber-300/10" : "border-border"}`}
                >
                  <span className="font-medium flex items-center gap-2">
                    {isCur && <Award className="h-3.5 w-3.5 text-amber-500" />}{r.name}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {r.coefficient != null ? `×${r.coefficient}` : ""}{fmtSom(r.salary_min) ? ` · ${fmtSom(r.salary_min)}+` : ""}
                  </span>
                </div>
              );
            })
          )}
          <p className="text-[11px] text-muted-foreground pt-1">
            {t("razryadOsishIzoh", "O'sish: imtihon → HR + rahbar tasdig'i → razryad o'zgaradi (≥3 oy oraliq). Tasdiq-zanjir keyingi bosqichda.")}
          </p>
        </CardContent>
      </Card>

      {/* Razryad o'sish so'rovi (EP-ORG-010..013) + tarix */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Award className="h-4 w-4" />{t("razryadOsishSorovi", "Razryad o'sish so'rovi")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end gap-2 flex-wrap">
            <div>
              <Label className="text-xs">{t("targetRazryad", "Yangi razryad")}</Label>
              <Select value={reqTarget} onValueChange={setReqTarget}>
                <SelectTrigger className="w-44" data-testid="select-razryad-target"><SelectValue placeholder={t("razryadTanlang", "Razryad tanlang")} /></SelectTrigger>
                <SelectContent>
                  {levels.filter((r) => current == null || r.level > current.level).map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t("imtihonBali", "Imtihon bali (%)")}</Label>
              <Input type="number" min="0" max="100" className="w-28" value={reqScore} onChange={(e) => setReqScore(e.target.value)} placeholder="80" />
            </div>
            <Button size="sm" disabled={!reqTarget || createRequest.isPending}
              onClick={() => createRequest.mutate()} data-testid="button-razryad-request">
              {createRequest.isPending ? t("yuborilmoqda", "Yuborilmoqda...") : t("sorovYuborish", "So'rov yuborish")}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {t("osishIzoh", "Imtihon → HR imzosi → bevosita rahbar imzosi → razryad o'zgaradi (≥3 oy oraliq). Egasi imtihon-chegara/oy sozlamasa rad etiladi.")}
          </p>
          {history.length > 0 && (
            <div className="border-t border-border/60 pt-2 space-y-1">
              <p className="text-[12px] font-semibold text-muted-foreground uppercase">{t("razryadTarixi", "Razryad tarixi")}</p>
              {history.slice(0, 8).map((h, i) => (
                <div key={i} className="flex items-center justify-between text-xs rounded border border-border px-2 py-1">
                  <span>{String(h.old_name ?? "—")} → <b>{String(h.new_name ?? "")}</b> · {String(h.change_type ?? "")}</span>
                  <span className="text-muted-foreground">{h.certificate_number ? String(h.certificate_number) : ""}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Razryad darajalari — umumiy sozlama (master-data; egasi/HR konfiguratsiya qiladi, Q9) */}
      <Dialog open={cfgOpen} onOpenChange={setCfgOpen}>
        <DialogContent className="max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold flex items-center gap-2">
              <Settings2 className="h-4 w-4" />{t("razryadDarajalariSozlama", "Razryad darajalari — umumiy sozlama")}
            </DialogTitle>
          </DialogHeader>
          <RazryadLevelsPanel />
        </DialogContent>
      </Dialog>
    </div>
  );
}
