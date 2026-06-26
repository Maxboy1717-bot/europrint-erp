/**
 * @module FitTab
 * @description Karta-detal "AI moslik" (card-fit) tab — A40 (To'lqin-2 karta-yadro kengaytirish).
 *   Kartaga biriktirilgan xodim ↔ karta AI fit-score'ini KO'RSATADI (read view) — manba kanonik
 *   `ai_fit_scores` jadvali (P36 AI-fit vertikal slice). Backend: GET /api/ai/fit/scores?cardId=...
 *   (eng so'nggi baholar ro'yxati) + POST /api/ai/fit/evaluate (yangi baholash).
 *
 *   ⭐ STRUKTURA-ONLY + FABRIKATSIYA YO'Q (Q-40):
 *     - Baho YO'Q bo'lsa → "hisoblanmagan" empty-state (soxta fit-score YOZILMAYDI).
 *     - AI-baholash AI-kalit (OpenAI/Gemini) + xodim-profil DATA talab qiladi = EGASI-DATA.
 *       AI-kalit sozlanmagan / kartaga rahbar biriktirilmagan bo'lsa → baholash o'chiq + izoh.
 *     - "Baholash" tugmasi FAQAT real kontekst yuboradi: employeeId = kartaning rahbari (real),
 *       cardId = node.id (real), cardRequirements = node'ning REAL karta-maydonlari (razryad/oylik/
 *       ЦКП/RBAC/ish-vaqti). Soxta xodim-profil tuqilmaydi (employeeProfile bo'sh = AI o'zi baholaydi).
 *
 *   RBAC: AI-fit endpointlari super_admin/director/hr_manager bilan cheklangan (ai-fit.controller).
 *   Shu sabab tab ham shu rollar uchun ma'lumot ko'rsatadi; boshqalar uchun "ko'rish huquqi yo'q".
 *
 *   ADDITIV: mavjud OrgNodeDetail tab tizimiga qo'shimcha; hech narsa o'chirilmaydi/buzilmaydi (Q-46).
 */

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, TrendingUp, AlertTriangle, Award, Wallet, ShieldAlert, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EPLoader, EPStatusPill, EPEmptyState } from "@/components/ep";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { NodeDetail } from "./types";
import { useTranslation } from "@/lib/i18n";

/** AI-fit baho qatori (transport shakli — i-ai-fit.repo FitScoreRow bilan bir xil). */
interface FitScoreRow {
  id: number;
  employeeId: number;
  cardId: number;
  fitScore: number;
  fitReport: Record<string, unknown> | null;
  bonusRecommendation: number | null;
  successionCandidate: boolean;
  aiProvider: string | null;
  evaluatedAt: string;
  createdAt: string;
}

/** Fit-score (0-100) → EPStatusPill rang ohangi + yorliq. */
function fitTone(score: number): { tone: "success" | "warning" | "danger" | "info"; label: string } {
  if (score >= 85) return { tone: "success", label: "A'lo moslik" };
  if (score >= 70) return { tone: "info", label: "Yaxshi moslik" };
  if (score >= 50) return { tone: "warning", label: "O'rtacha moslik" };
  return { tone: "danger", label: "Past moslik" };
}

function fmtSom(v: number | null | undefined): string | null {
  if (v == null) return null;
  return `${Number(v).toLocaleString("uz-UZ")} so'm`;
}

/** fit_report JSONB ichidan string-massiv (strengths/gaps) ni mudofaa bilan ajratish. */
function asStringList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("uz-UZ");
}

export function FitTab({ node }: { node: NodeDetail }) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();

  // RBAC — ai-fit.controller bilan bir xil: super_admin/director/hr_manager.
  const canView = hasRole("super_admin", "director", "hr_manager");

  // Kartaga biriktirilgan xodim (rahbar) — baholash uchun real employeeId manbasi.
  // YO'Q bo'lsa AI-baholash o'chiq (soxta xodim tuqilmaydi — Q-40).
  const headUserId = node.headUserId ?? null;

  const scoresKey = ["/api/ai/fit/scores", { cardId: node.id }] as const;
  const { data, isLoading, isError } = useQuery<{ data?: FitScoreRow[] } | FitScoreRow[]>({
    queryKey: scoresKey,
    enabled: canView,
    staleTime: 60_000,
  });

  // Javob ham {data:[...]} ham [...] bo'lishi mumkin — ikkalasini ham mudofaa bilan ochamiz.
  const scores: FitScoreRow[] = useMemo(() => {
    const raw = Array.isArray(data) ? data : Array.isArray(data?.data) ? data!.data : [];
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  const latest = scores.length > 0 ? scores[0] : null;

  const evaluate = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/ai/fit/evaluate", {
        employeeId: headUserId,
        cardId: node.id,
        // cardRequirements = node'ning REAL karta-maydonlari (fabrikatsiya emas).
        cardRequirements: {
          name: node.name,
          nodeType: node.nodeType,
          razryadLevelId: node.razryadLevelId ?? null,
          minSalary: node.minSalary ?? null,
          maxSalary: node.maxSalary ?? null,
          rbacTier: node.rbacTier ?? null,
          tskpTarget: node.tskpTarget ?? null,
          workSchedule: node.workSchedule ?? null,
          tskp: node.tskp ?? null,
        },
        // employeeProfile bo'sh — xodim-profil DATA materializatsiya qilinmagan (egasi-data);
        // soxta profil yozilmaydi. Backend bo'sh profil bilan ham baholaydi yoki fallback saqlaydi.
        employeeProfile: {},
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/fit/scores"] });
      toast({ title: t("aiFitBaholandi", "AI moslik baholandi") });
    },
    onError: (e: unknown) =>
      toast({
        title: e instanceof Error ? e.message : t("aiFitXato", "AI baholash bajarilmadi (AI-kalit sozlanmagan bo'lishi mumkin)"),
        variant: "destructive",
      }),
  });

  // Ruxsat yo'q — ma'lumot ko'rsatilmaydi (sezgir AI-hisobot).
  if (!canView) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <ShieldAlert className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">{t("korishHuquqiYoq", "Ko'rish huquqi yo'q")}</p>
            <p className="text-sm text-muted-foreground">
              {t("aiFitRbacIzoh", "AI moslik hisoboti faqat HR / direktor / super-admin uchun.")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) return <EPLoader />;

  const report = latest?.fitReport ?? null;
  const strengths = report ? asStringList(report["strengths"]) : [];
  const gaps = report ? asStringList(report["gaps"]) : [];
  const summary =
    report && typeof report["summary"] === "string" ? (report["summary"] as string) : null;
  const rawText =
    report && typeof report["raw"] === "string" ? (report["raw"] as string) : null;

  return (
    <div className="space-y-4">
      {/* Sarlavha + baholash tugmasi */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            {t("aiMoslik", "AI moslik (xodim ↔ karta)")}
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            data-testid="button-ai-fit-evaluate"
            disabled={evaluate.isPending || headUserId == null}
            onClick={() => evaluate.mutate()}
            title={headUserId == null ? t("aiFitNoHead", "Kartaga rahbar biriktirilmagan") : undefined}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${evaluate.isPending ? "animate-spin" : ""}`} />
            {evaluate.isPending ? t("baholanmoqda", "Baholanmoqda...") : t("aiQaytaBaholash", "AI baholash")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {latest ? (
            <>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-muted/30 px-5 py-3 min-w-[110px]">
                  <span className="text-3xl font-bold" data-testid="ai-fit-score">
                    {Math.round(latest.fitScore)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">/ 100</span>
                </div>
                <div className="space-y-1.5">
                  <EPStatusPill tone={fitTone(latest.fitScore).tone} data-testid="ai-fit-tone">
                    {fitTone(latest.fitScore).label}
                  </EPStatusPill>
                  {latest.successionCandidate && (
                    <Badge className="ml-2 bg-amber-300/15 text-amber-600 border-amber-400/40 flex items-center gap-1 w-fit">
                      <Award className="h-3 w-3" />
                      {t("vorisNomzodi", "Voris nomzodi")}
                    </Badge>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    {t("baholangan", "Baholangan")}: {fmtDate(latest.evaluatedAt)}
                    {latest.aiProvider ? ` · ${latest.aiProvider}` : ""}
                  </p>
                </div>
              </div>

              {latest.bonusRecommendation != null && (
                <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                  <span className="text-muted-foreground inline-flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5" />
                    {t("aiBonusTavsiyasi", "AI bonus tavsiyasi")}
                  </span>
                  <span className="font-semibold text-[var(--ep-green)]">
                    {fmtSom(latest.bonusRecommendation)}
                  </span>
                </div>
              )}
            </>
          ) : (
            <EPEmptyState
              icon={Sparkles}
              title={t("aiFitHisoblanmagan", "Hisoblanmagan")}
              description={t(
                "aiFitHisoblanmaganIzoh",
                "Bu karta uchun AI moslik bahosi hali hisoblanmagan. Baholash AI-kalit (OpenAI/Gemini) va xodim-profil ma'lumotini talab qiladi — bularni hisob egasi beradi."
              )}
            />
          )}
        </CardContent>
      </Card>

      {/* AI hisoboti — kuchli tomonlar / bo'shliqlar / xulosa (faqat baho bo'lganda) */}
      {latest && (strengths.length > 0 || gaps.length > 0 || summary || rawText) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("aiFitHisoboti", "AI hisoboti")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {summary && <p className="text-muted-foreground">{summary}</p>}

            {strengths.length > 0 && (
              <div className="space-y-1">
                <p className="text-[12px] font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  {t("kuchliTomonlar", "Kuchli tomonlar")}
                </p>
                <ul className="space-y-1">
                  {strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">+</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {gaps.length > 0 && (
              <div className="space-y-1">
                <p className="text-[12px] font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  {t("boshliqlar", "Bo'shliqlar")}
                </p>
                <ul className="space-y-1">
                  {gaps.map((g, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">!</span>
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!summary && !strengths.length && !gaps.length && rawText && (
              <p className="text-muted-foreground whitespace-pre-wrap">{rawText}</p>
            )}
          </CardContent>
        </Card>
      )}

      {isError && (
        <p className="text-sm text-[var(--ep-red)]">
          {t("aiFitYuklashXato", "AI moslik ma'lumotini yuklab bo'lmadi.")}
        </p>
      )}

      <p className="text-[11px] text-muted-foreground">
        {t(
          "aiFitIzoh",
          "AI moslik — kartaga biriktirilgan xodimning karta talablariga mosligi (0-100). Manba: ai_fit_scores. Baholash AI-kalit + xodim-profil DATA bilan ishlaydi (egasi-data); ular yo'q bo'lsa baho hisoblanmaydi."
        )}
      </p>
    </div>
  );
}
