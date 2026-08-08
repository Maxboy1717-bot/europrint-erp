/**
 * @module CkpCascadeDashboard
 * @description Karta ЦКП KASKAD-dashboard (T10-12 — vizyon "Sen 72% | Bo'lim 81% |
 *   Otdeleniye 65%"). Kartaning kunlik bajarish%'ini O'Z DARAJASI bo'yicha emas, balki
 *   butun VERTIKAL-zanjiri (karta → bo'lim → otdeleniye → ... → tepa) bo'yicha kaskad
 *   ko'rsatadi: har daraja uchun subtree o'rtacha bajarish% + fakt-soni.
 *
 *   ⭐ DATA-MANBA (FABRIKATSIYA YO'Q — Q-40): har qiymat REAL endpointdan keladi.
 *     1) Vertikal-zanjir (ajdod kartalar, tartiblangan: o'zi=depth1 → tepa):
 *          GET /api/org-structure/nodes/:cardId/approval-chain
 *          → [{ node_id, node_name, level, depth }, ...]  (org-queries.repo getApprovalChain, RECURSIVE CTE)
 *     2) Har zanjir-karta uchun ЦКП kaskad-agregat (o'sha kun):
 *          GET /api/org-structure/ckp/aggregate/:cardId?date=YYYY-MM-DD
 *          → { fact_count, avg_achievement }  (ckp-fact.repository aggregateByDate, RECURSIVE subtree AVG)
 *     Soxta qiymat YOZILMAYDI: fakt yo'q daraja → "fakt yo'q" (0% emas). avg_achievement
 *     NULL bo'lsa ko'rsatilmaydi — backend HAVING/AVG NULL bilan keladi.
 *
 *   ⭐ ADDITIV (Q-46): mavjud CkpTab ichida, yuqorida render qilinadi. Hech narsa
 *     buzilmaydi/o'chmaydi — bu faqat YANGI vizualizatsiya (P2 "Cascading aggregation UI
 *     MISSING" — vizyon-audit). Yozish/forma yo'q (read-only dashboard).
 *
 *   ⭐ DIZAYN (Qoida 21/41): faqat EP token (--ep-*) + mavjud ui/EPCard; xom rang yo'q.
 *     Daraja-yorliq: o'zi="Sen", keyingisi="Bo'lim", undan keyin="Otdeleniye", qolgani
 *     karta-nomi (vizyon 3-daraja kaskad; chuqurroq zanjir ham to'liq ko'rsatiladi).
 */

import { useMemo } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Layers, ChevronRight, AlertTriangle } from "lucide-react";
import { EPEmptyState } from "@/components/ep";
import { getQueryFn } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";

/** approval-chain qatori (org-queries.repo.getApprovalChain transport shakli). */
interface ChainRow {
  node_id: number;
  node_name: string;
  level?: number | string | null;
  depth: number | string;
}

/** Kaskad-agregat javobi (ckp-fact.repository.aggregateByDate). */
interface CkpAggregate {
  fact_count?: number | string | null;
  avg_achievement?: number | string | null;
}

/** Bitta kaskad-daraja (zanjir-karta + uning subtree agregati). */
interface CascadeLevel {
  cardId: number;
  name: string;
  depth: number;
  /** Vizyon-yorlig'i: "Sen" | "Bo'lim" | "Otdeleniye" | karta-nomi. */
  roleLabel: string;
  isLoading: boolean;
  factCount: number;
  avgPct: number | null;
}

function toNum(v: number | string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Bugungi sana — YYYY-MM-DD (lokal). CkpTab.todayIso bilan bir xil standart. */
function todayIso(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Bajarish% → EP-token rang (yashil ≥100, ko'k ≥80, amber ≥50, qizil past). */
function pctColor(pct: number): string {
  if (pct >= 100) return "var(--ep-green)";
  if (pct >= 80) return "var(--ep-blue)";
  if (pct >= 50) return "var(--ep-yellow)";
  return "var(--ep-red)";
}

/**
 * Vizyon kaskad-yorliqlari: depth=1 (o'zi) = "Sen", depth=2 = "Bo'lim",
 * depth=3 = "Otdeleniye", chuqurroq = karta-nomi. Vizyon namunasi 3-darajali
 * ("Sen 72% | Bo'lim 81% | Otdeleniye 65%"); zanjir uzunroq bo'lsa to'liq ketadi.
 */
function roleLabelFor(depth: number, name: string, t: (k: string, d?: string) => string): string {
  if (depth <= 1) return t("ckpKaskadSen", "Sen");
  if (depth === 2) return t("ckpKaskadBolim", "Bo'lim");
  if (depth === 3) return t("ckpKaskadOtdeleniye", "Otdeleniye");
  return name;
}

/**
 * Karta ЦКП kaskad-dashboard. `cardId` — joriy karta (org_departments.id).
 * Read-only: vertikal-zanjir bo'yicha har daraja subtree o'rtacha bajarish%.
 */
export function CkpCascadeDashboard({ cardId }: { cardId: number }) {
  const { t } = useTranslation("common");
  const date = todayIso();

  // ── 1) Vertikal-zanjir (ajdod kartalar) ── getApprovalChain RECURSIVE CTE. ──
  const { data: chainData, isLoading: chainLoading } = useQuery<ChainRow[] | { data?: ChainRow[] }>({
    queryKey: ["/api/org-structure/nodes", cardId, "approval-chain"],
    staleTime: 60_000,
  });

  const chain: ChainRow[] = useMemo(() => {
    const raw = Array.isArray(chainData)
      ? chainData
      : Array.isArray((chainData as { data?: ChainRow[] })?.data)
        ? (chainData as { data?: ChainRow[] }).data!
        : [];
    if (!Array.isArray(raw)) return [];
    // depth bo'yicha tartiblash (o'zi=1 → tepa) — backend ORDER BY beradi, qo'shimcha kafolat.
    return [...raw].sort((a, b) => (toNum(a.depth) ?? 0) - (toNum(b.depth) ?? 0));
  }, [chainData]);

  // ── 2) Har zanjir-karta uchun ЦКП kaskad-agregat (o'sha kun) ── parallel. ──
  // useQueries — zanjir uzunligi dinamik; har biri o'z subtree o'rtacha bajarish%'ini oladi.
  const aggQueries = useQueries({
    queries: chain.map((c) => ({
      queryKey: ["/api/org-structure/ckp/aggregate", c.node_id, { date }],
      queryFn: getQueryFn<CkpAggregate>({ on401: "returnNull" }),
      staleTime: 30_000,
      enabled: chain.length > 0,
    })),
  });

  const levels: CascadeLevel[] = useMemo(() => {
    return chain.map((c, i) => {
      const q = aggQueries[i];
      const agg = (q?.data ?? null) as CkpAggregate | null;
      const depth = toNum(c.depth) ?? i + 1;
      return {
        cardId: c.node_id,
        name: c.node_name,
        depth,
        roleLabel: roleLabelFor(depth, c.node_name, t),
        isLoading: q?.isLoading ?? false,
        factCount: toNum(agg?.fact_count) ?? 0,
        avgPct: toNum(agg?.avg_achievement),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain, aggQueries.map((q) => q.dataUpdatedAt).join(","), t]);

  const isLoading = chainLoading;

  return (
    <Card data-testid="ckp-cascade-dashboard">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Layers className="h-4 w-4 text-[var(--ep-blue)]" />
          {t("ckpKaskadSarlavha", "ЦКП kaskad — vertikal zanjir (bugun)")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex-1 h-20 rounded-md border border-border bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : levels.length === 0 ? (
          <EPEmptyState
            icon={Layers}
            variant="inline"
            title={t("ckpKaskadYoq", "Kaskad zanjiri yo'q")}
            description={t(
              "ckpKaskadYoqIzoh",
              "Bu karta uchun vertikal zanjir (ajdod kartalar) topilmadi. Karta tepa-strukturaga ulansa kaskad ko'rinadi."
            )}
          />
        ) : (
          <>
            {/* ── Kaskad-qatori: "Sen 72% › Bo'lim 81% › Otdeleniye 65%" ── */}
            <div className="flex items-stretch gap-1.5 overflow-x-auto pb-1">
              {levels.map((lvl, i) => (
                <div key={lvl.cardId} className="flex items-stretch gap-1.5 shrink-0">
                  <div
                    className="rounded-md border border-border bg-muted/30 px-3 py-2 min-w-[120px] flex flex-col gap-1"
                    data-testid={`ckp-cascade-level-${lvl.depth}`}
                  >
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground truncate" title={lvl.name}>
                      {lvl.roleLabel}
                    </span>
                    {lvl.isLoading ? (
                      <span className="text-sm font-medium text-muted-foreground italic">…</span>
                    ) : lvl.avgPct != null ? (
                      <>
                        <span
                          className="text-lg font-bold leading-none"
                          style={{ color: pctColor(lvl.avgPct) }}
                          data-testid={`ckp-cascade-pct-${lvl.depth}`}
                        >
                          {lvl.avgPct}%
                        </span>
                        <Progress
                          value={Math.min(lvl.avgPct, 100)}
                          className="h-1.5"
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {t("ckpKaskadFakt", "fakt")}: {lvl.factCount}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground italic">
                        {t("faktYoq", "fakt yo'q")}
                      </span>
                    )}
                    {lvl.depth > 3 && (
                      <span className="text-[10px] text-muted-foreground truncate" title={lvl.name}>
                        {lvl.name}
                      </span>
                    )}
                  </div>
                  {i < levels.length - 1 && (
                    <div className="flex items-center text-muted-foreground">
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {levels.every((l) => l.avgPct == null && !l.isLoading) && (
              <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                {t(
                  "ckpKaskadHammaFaktYoq",
                  "Bugun hech bir darajada ЦКП fakt yo'q — kunlik fakt kiritilgach kaskad bajarish% to'ladi (soxta 0% ko'rsatilmaydi)."
                )}
              </p>
            )}

            <p className="text-[11px] text-muted-foreground">
              {t(
                "ckpKaskadIzoh",
                "Har daraja — o'sha karta va uning barcha farzandlari o'rtacha bugungi bajarish% (subtree AVG). 'Sen' = shu karta; 'Bo'lim'/'Otdeleniye' = yuqori darajalar. Manba: ckp_fact_values + org_departments zanjiri (FABRIKATSIYA YO'Q)."
              )}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
