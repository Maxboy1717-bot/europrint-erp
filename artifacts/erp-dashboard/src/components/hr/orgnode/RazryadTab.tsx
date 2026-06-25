/**
 * @module RazryadTab
 * @description Karta-detal "Razryad" tab (egasi 2026-06-25: "razryad mana shu tabda bo'lsin").
 *   Kartaning razryadini TANLASH (PATCH razryad_level_id) + razryad ma'nosi (koeff/oylik-band/talab/
 *   imtihon/sertifikat/keyingi-razryadgacha) + razryad narvoni (1->6 o'sish yo'li). Intervyu modeli
 *   (EP-ORG-008..013): razryad -> talab -> o'sish -> oylik. Razryad qiymatlari egasi-data (fabrikatsiya yo'q).
 */

import type { ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EPLoader } from "@/components/ep";
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

  if (isLoading) return <EPLoader />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Award className="h-4 w-4" />{t("kartaRazryadi", "Karta razryadi")}</CardTitle>
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
    </div>
  );
}
