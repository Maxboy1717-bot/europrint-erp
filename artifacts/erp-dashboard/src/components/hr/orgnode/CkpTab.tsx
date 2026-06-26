/**
 * @module CkpTab
 * @description Karta-detal "ЦКП" tab (A70 — To'lqin-4 ЦКП UI). Kartaning kunlik ЦКП
 *   FAKT-qiymatini KIRITISH + tarix + kaskad-agregat (karta + farzandlar o'rtacha bajarish%).
 *   Intervyu modeli (EP-ORG-014..018): ЦКП norma + kunlik fakt → bajarish% → oylik-gate (Egasi 6-qaror:
 *   deadline o'tib hisobot yo'q → o'sha kun oyligi 0).
 *
 *   Backend (org-structure/ckp.controller):
 *     - POST /api/org-structure/ckp/fact        { cardId, factDate, actualValue?, source?, notes? }
 *     - GET  /api/org-structure/ckp/fact?cardId=&from=&to=   → { items, total }
 *     - GET  /api/org-structure/ckp/aggregate/:cardId?date=  → { fact_count, avg_achievement }
 *
 *   ⭐ FABRIKATSIYA YO'Q (Q-40): bajarish% — backend formula-turidan (boolean=100/0;
 *     quantity_pct=fakt/norma). ЦКП norma (tskp_target) NULL bo'lsa bajarish 0 — soxta qiymat
 *     YOZILMAYDI. Norma/deadline — EGASI-DATA (org_departments.tskp_target/ckp_report_deadline_hours).
 *     Norma yo'q bo'lsa empty-state + izoh; faqat REAL kiritilgan faktlar ko'rsatiladi.
 *
 *   ⭐ ADDITIV (Q-46): mavjud OrgNodeDetail tab tizimiga qo'shimcha; hech narsa buzilmaydi/o'chmaydi.
 *   ⭐ RBAC: fakt yozish manager/hr_manager/director/supervisor/super_admin/admin; ko'rish barchaga
 *     (ckp.controller @Roles bilan bir xil — viewer ham ko'radi, lekin yozish tugmasi rolga bog'liq).
 */

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Target, CalendarDays, TrendingUp, Layers, Save, Gauge, AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EPLoader, EPEmptyState, EPStatusPill } from "@/components/ep";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { NodeDetail } from "./types";
import { useTranslation } from "@/lib/i18n";

/** ckp_fact_values qatori (transport shakli — ckp-fact.repository bilan bir xil). */
interface CkpFactRow {
  id: number;
  card_id: number;
  employee_id?: number | null;
  product_id?: number | null;
  fact_date: string;
  target_value?: number | string | null;
  actual_value?: number | string | null;
  achievement_pct?: number | string | null;
  source?: string | null;
  formula_type?: string | null;
  status?: string | null;
  submitted_at?: string | null;
  notes?: string | null;
}

/** Kaskad-agregat javobi (aggregateByDate). */
interface CkpAggregate {
  fact_count?: number | null;
  avg_achievement?: number | string | null;
}

/** Bugungi sana — YYYY-MM-DD (lokal, fakt-kiritish standart sanasi). */
function todayIso(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function toNum(v: number | string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    // fact_date kelishi mumkin "YYYY-MM-DD" (date-only) — to'g'ridan ko'rsatamiz.
    return String(iso).slice(0, 10);
  }
  return d.toLocaleDateString("uz-UZ");
}

/** Bajarish% (0-100+) → EPStatusPill ohang + yorliq. */
function achievementTone(pct: number): { tone: "success" | "warning" | "danger" | "info"; label: string } {
  if (pct >= 100) return { tone: "success", label: "To'liq bajarildi" };
  if (pct >= 80) return { tone: "info", label: "Yaxshi" };
  if (pct >= 50) return { tone: "warning", label: "O'rtacha" };
  return { tone: "danger", label: "Past" };
}

const SOURCE_LABEL: Record<string, string> = {
  MANUAL: "Qo'lda",
  AI_CHAT: "AI suhbat",
  MES_AUTO: "MES (avto)",
  IOT: "IoT sensor",
};

export function CkpTab({ node }: { node: NodeDetail }) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();

  // RBAC — fakt YOZISH huquqi (ckp.controller @Roles bilan izchil; viewer faqat ko'radi).
  const canRecord = hasRole("manager", "hr_manager", "director", "supervisor", "super_admin", "admin");

  // ── Karta ЦКП-meta (norma/deadline) — node-detaldan keladi (org_departments.tskp_target). ──
  // FABRIKATSIYA YO'Q: norma NULL bo'lsa "belgilanmagan" + empty izoh.
  const ckpTarget = toNum(node.tskpTarget);
  const ckpUnit = node.tskpMeasurementUnit ?? null;
  const hasNorma = ckpTarget != null && ckpTarget > 0;

  // ── Fakt tarixi (listByCard) ──
  const factKey = ["/api/org-structure/ckp/fact", { cardId: node.id }] as const;
  const { data: factData, isLoading } = useQuery<{ items?: CkpFactRow[] } | CkpFactRow[]>({
    queryKey: factKey,
    staleTime: 30_000,
  });
  const facts: CkpFactRow[] = useMemo(() => {
    const raw = Array.isArray(factData) ? factData : Array.isArray(factData?.items) ? factData!.items : [];
    return Array.isArray(raw) ? raw : [];
  }, [factData]);

  // ── Kaskad-agregat (bugun) — karta + farzandlar o'rtacha bajarish%. ──
  const today = todayIso();
  const { data: aggData } = useQuery<CkpAggregate>({
    queryKey: ["/api/org-structure/ckp/aggregate", node.id, { date: today }],
    staleTime: 30_000,
  });
  const aggCount = toNum(aggData?.fact_count) ?? 0;
  const aggAvg = toNum(aggData?.avg_achievement);

  // ── Fakt-kiritish formasi (kunlik) ──
  const [factDate, setFactDate] = useState<string>(today);
  const [actual, setActual] = useState<string>("");
  const [source, setSource] = useState<string>("MANUAL");
  const [notes, setNotes] = useState<string>("");

  const recordFact = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/org-structure/ckp/fact", {
        cardId: node.id,
        factDate,
        actualValue: actual.trim() === "" ? undefined : Number(actual),
        source,
        notes: notes.trim() === "" ? undefined : notes.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-structure/ckp/fact"] });
      queryClient.invalidateQueries({ queryKey: ["/api/org-structure/ckp/aggregate"] });
      setActual("");
      setNotes("");
      toast({ title: t("ckpFaktSaqlandi", "ЦКП fakt saqlandi") });
    },
    onError: (e: unknown) =>
      toast({ title: e instanceof Error ? e.message : t("Xatolik", "Xatolik"), variant: "destructive" }),
  });

  if (isLoading) return <EPLoader />;

  const latest = facts.length > 0 ? facts[0] : null;
  const latestPct = latest ? toNum(latest.achievement_pct) : null;

  return (
    <div className="space-y-4">
      {/* ── ЦКП norma + bugungi holat ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-[var(--ep-blue)]" />
            {t("ckpNorma", "ЦКП norma va bugungi holat")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {/* Norma (maqsad) — EGASI-DATA */}
            <div className={`rounded-md border px-3 py-2 flex flex-col gap-0.5 ${hasNorma ? "border-border bg-muted/30" : "border-dashed border-border"}`}>
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{t("ckpMaqsad", "ЦКП maqsad")}</span>
              {hasNorma ? (
                <span className="text-sm font-semibold">{ckpTarget}{ckpUnit ? ` ${ckpUnit}` : ""}</span>
              ) : (
                <span className="text-sm font-medium text-muted-foreground italic">{t("belgilanmagan", "belgilanmagan")}</span>
              )}
            </div>
            {/* So'nggi bajarish% */}
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2 flex flex-col gap-0.5">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{t("songgiBajarish", "So'nggi bajarish%")}</span>
              {latestPct != null ? (
                <span className="text-sm font-semibold inline-flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5" />{latestPct}%
                </span>
              ) : (
                <span className="text-sm font-medium text-muted-foreground italic">—</span>
              )}
            </div>
            {/* Bugungi kaskad-agregat (karta + farzandlar) */}
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2 flex flex-col gap-0.5">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1">
                <Layers className="h-3 w-3" />{t("bugungiAgregat", "Bugungi agregat")}
              </span>
              {aggAvg != null ? (
                <span className="text-sm font-semibold">{aggAvg}% <span className="text-[11px] text-muted-foreground font-normal">({aggCount})</span></span>
              ) : (
                <span className="text-sm font-medium text-muted-foreground italic">{t("faktYoq", "fakt yo'q")}</span>
              )}
            </div>
          </div>

          {latestPct != null && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t("songgiKunBajarish", "So'nggi kun bajarish")}</span>
                <EPStatusPill tone={achievementTone(latestPct).tone} className="text-[11px]">
                  {achievementTone(latestPct).label}
                </EPStatusPill>
              </div>
              <Progress value={Math.min(latestPct, 100)} className="h-2" />
            </div>
          )}

          {!hasNorma && (
            <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
              {t(
                "ckpNormaYoqIzoh",
                "ЦКП norma (maqsad) belgilanmagan — bajarish% 0 bo'ladi. Norma egasi-data (Karta tahrirlash → ЦКП maqsad). Norma kiritilmaguncha oylik-gate yopiq."
              )}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Kunlik fakt kiritish (rol bilan darvozalangan) ── */}
      {canRecord && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />{t("ckpKunlikFakt", "Kunlik ЦКП fakt kiritish")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">{t("sana", "Sana")}</Label>
                <Input
                  type="date"
                  value={factDate}
                  max={today}
                  onChange={(e) => setFactDate(e.target.value)}
                  data-testid="input-ckp-date"
                />
              </div>
              <div>
                <Label className="text-xs">
                  {t("haqiqiyQiymat", "Haqiqiy qiymat")}{ckpUnit ? ` (${ckpUnit})` : ""}
                </Label>
                <Input
                  type="number"
                  step="any"
                  value={actual}
                  onChange={(e) => setActual(e.target.value)}
                  placeholder={hasNorma ? String(ckpTarget) : "0"}
                  data-testid="input-ckp-actual"
                />
              </div>
              <div>
                <Label className="text-xs">{t("manba", "Manba")}</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  data-testid="select-ckp-source"
                >
                  {Object.entries(SOURCE_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  className="w-full"
                  disabled={recordFact.isPending || !factDate}
                  onClick={() => recordFact.mutate()}
                  data-testid="button-ckp-save"
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {recordFact.isPending ? t("saqlanmoqda", "Saqlanmoqda...") : t("saqlash", "Saqlash")}
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs">{t("izoh", "Izoh (ixtiyoriy)")}</Label>
              <Textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("ckpIzohPlaceholder", "Kun bo'yicha izoh...")}
                data-testid="textarea-ckp-notes"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {t(
                "ckpFaktIzoh",
                "Bajarish% backend tomonidan formula-turiga qarab hisoblanadi (norma/fakt). Bir kun bitta fakt (idempotent — qayta kiritish yangilaydi). Deadline o'tib hisobot berilmasa o'sha kun oyligi 0 (qattiq gate)."
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Fakt tarixi ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />{t("ckpFaktTarixi", "ЦКП fakt tarixi")}
            {facts.length > 0 && <Badge variant="outline" className="text-[11px]">{facts.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {facts.length === 0 ? (
            <EPEmptyState
              icon={Target}
              variant="inline"
              title={t("ckpFaktYoq", "ЦКП fakt yo'q")}
              description={t(
                "ckpFaktYoqIzoh",
                "Bu karta uchun hali kunlik ЦКП fakt kiritilmagan. Yuqoridagi forma orqali bugungi faktni kiriting (norma kiritilgan bo'lsa bajarish% avtomatik hisoblanadi)."
              )}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">{t("sana", "Sana")}</th>
                    <th className="py-2 pr-3 font-medium text-right">{t("maqsad", "Maqsad")}</th>
                    <th className="py-2 pr-3 font-medium text-right">{t("haqiqiy", "Haqiqiy")}</th>
                    <th className="py-2 pr-3 font-medium text-right">{t("bajarish", "Bajarish%")}</th>
                    <th className="py-2 pr-3 font-medium">{t("manba", "Manba")}</th>
                    <th className="py-2 font-medium">{t("izoh", "Izoh")}</th>
                  </tr>
                </thead>
                <tbody>
                  {facts.map((f) => {
                    const pct = toNum(f.achievement_pct);
                    return (
                      <tr key={f.id} className="border-b border-border/50" data-testid={`ckp-fact-row-${f.id}`}>
                        <td className="py-2 pr-3 whitespace-nowrap">{fmtDate(f.fact_date)}</td>
                        <td className="py-2 pr-3 text-right text-muted-foreground">{toNum(f.target_value) ?? "—"}</td>
                        <td className="py-2 pr-3 text-right font-medium">{toNum(f.actual_value) ?? "—"}</td>
                        <td className="py-2 pr-3 text-right">
                          {pct != null ? (
                            <span className={pct >= 100 ? "text-[var(--ep-green)] font-semibold" : pct >= 50 ? "" : "text-[var(--ep-red)]"}>
                              {pct}%
                            </span>
                          ) : "—"}
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground text-xs">
                          {SOURCE_LABEL[String(f.source ?? "MANUAL")] ?? String(f.source ?? "—")}
                        </td>
                        <td className="py-2 text-muted-foreground text-xs max-w-[220px] truncate" title={f.notes ?? undefined}>
                          {f.notes ?? "—"}
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

      <p className="text-[11px] text-muted-foreground">
        {t(
          "ckpTabIzoh",
          "ЦКП — Конечно Ценный Продукт (karta yakuniy qiymatli mahsuloti). Kunlik fakt → bajarish% → oylik formulasiga (baza × razryad × ЦКП% × stake) kiradi. Norma/deadline egasi-data; manba: ckp_fact_values."
        )}
      </p>
    </div>
  );
}
