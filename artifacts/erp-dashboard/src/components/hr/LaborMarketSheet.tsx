import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Save, BarChart2, Clock, TrendingUp,
} from "lucide-react";
import { MarketHeatBadge, HEAT_OPTIONS } from "./labor-market/MarketHeatBadge";
import { HiringForecast, type EmployerMarket, type CandidateMarket, type HistoricalStats } from "./labor-market/HiringForecast";
import { EmployerMarketSection } from "./labor-market/EmployerMarketSection";
import { CandidateMarketSection } from "./labor-market/CandidateMarketSection";
import { RecommendationsSection } from "./labor-market/RecommendationsSection";

interface LaborMarketData {
  id?: number;
  vacancy_id: number;
  employer_market: EmployerMarket;
  candidate_market: CandidateMarket;
  recommendations?: string | null;
  updated_at?: string;
}

interface Props {
  vacancyId: number;
  vacancyTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function generateRecommendations(em: EmployerMarket, cm: CandidateMarket): string {
  const recs: string[] = [];

  const candidateCount = Number(cm.candidate_count) || 0;
  const salExpMin = Number(cm.salary_expectation_min) || 0;
  const salExpMax = Number(cm.salary_expectation_max) || 0;
  const avgResponseDays = Number(cm.avg_response_days) || 0;

  const compAvgMin = em.competitors.length
    ? em.competitors?.reduce((s, c) => s + (Number(c.salary_min) || 0), 0) / em.competitors.length
    : 0;
  const compAvgMax = em.competitors.length
    ? em.competitors?.reduce((s, c) => s + (Number(c.salary_max) || 0), 0) / em.competitors.length
    : 0;

  if (em.market_heat === "hot") {
    recs.push("🔥 Bozor qizg'in: raqobat yuqori. Yollash jarayonini tezlashtiring va qaror qabul qilish muddatini qisqartiring.");
  } else if (em.market_heat === "cold") {
    recs.push("❄️ Bozor sovuq: nomzodlar ko'p, tanlov imkoniyatlari keng. Talablarni yanada aniqlashtirish mumkin.");
  }

  if (candidateCount < 10) {
    recs.push("👥 Mavjud nomzodlar soni kam (< 10). Yollash kanallarini kengaytiring: LinkedIn, hh.uz, Telegram, ijtimoiy tarmoqlar.");
  } else if (candidateCount > 100) {
    recs.push("👥 Nomzodlar ko'p (> 100). Birinchi bosqich saralashni avtomatlashtirishni ko'ring (anketa, AI screening).");
  }

  if (salExpMin > 0 && compAvgMin > 0 && salExpMin > compAvgMin * 1.2) {
    recs.push("💰 Nomzodlarning maosh kutilmasi raqobatchilardan 20%+ yuqori. Maosh paketini qayta ko'rib chiqishni tavsiya etamiz.");
  } else if (compAvgMax > 0 && salExpMax > 0 && salExpMax < compAvgMax * 0.8) {
    recs.push("💰 Maosh kutilmasi raqobatchilarnikidan past — bu ijobiy. Imtiyozlar (DMS, oylik bonus) bilan qo'shimcha qiziqish uyg'otish mumkin.");
  }

  if (avgResponseDays > 7) {
    recs.push(`⏱️ Nomzodlarning javob berish muddati uzoq (${avgResponseDays} kun). Birinchi aloqa tezkor bo'lishi kerak — 24 soat ichida muloqot boshlansin.`);
  }

  if (cm.avg_skill_level === "junior") {
    recs.push("🎓 Ko'pgina nomzodlar Junior darajada. Mentoring dasturi va o'qitishga tayyor bo'lish zarur.");
  } else if (cm.avg_skill_level === "senior") {
    recs.push("🏆 Senior nomzodlar bor — ularni qiziqtirish uchun murakkab loyihalar, karyera o'sishi va yuqori maosh taklif qiling.");
  }

  if (em.competitors.length === 0) {
    recs.push("📋 Raqobatchilar tahlili kiritilmagan. Kamida 3–5 raqobatchi kompaniya ma'lumotini qo'shing.");
  }

  if (recs.length === 0) {
    recs.push("✅ Bozor tahlili ma'lumotlari kiritildi. Strategiyani muntazam yangilab turing.");
  }

  return recs.join("\n");
}

const DEFAULT_EMPLOYER_MARKET: EmployerMarket = {
  competitors: [],
  market_heat: "medium",
};

const DEFAULT_CANDIDATE_MARKET: CandidateMarket = {
  candidate_count: "",
  salary_expectation_min: "",
  salary_expectation_max: "",
  avg_skill_level: "",
  avg_response_days: "",
};

export function LaborMarketSheet({ vacancyId, vacancyTitle, open, onOpenChange }: Props) {
  const { toast } = useToast();

  const [employerMarket, setEmployerMarket] = useState<EmployerMarket>(DEFAULT_EMPLOYER_MARKET);
  const [candidateMarket, setCandidateMarket] = useState<CandidateMarket>(DEFAULT_CANDIDATE_MARKET);
  const [recommendations, setRecommendations] = useState("");

  const { data, isLoading } = useQuery<{ data: LaborMarketData | null; historical?: HistoricalStats }>({
    queryKey: [`/api/hr/recruitment/vacancies/${vacancyId}/market-analysis`],
    enabled: open && vacancyId > 0,
  });

  useEffect(() => {
    if (data?.data) {
      const d = data.data;
      setEmployerMarket(d.employer_market ?? DEFAULT_EMPLOYER_MARKET);
      setCandidateMarket(d.candidate_market ?? DEFAULT_CANDIDATE_MARKET);
      setRecommendations(d.recommendations ?? "");
    } else if (data !== undefined) {
      setEmployerMarket(DEFAULT_EMPLOYER_MARKET);
      setCandidateMarket(DEFAULT_CANDIDATE_MARKET);
      setRecommendations("");
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/hr/recruitment/vacancies/${vacancyId}/market-analysis`, {
        employer_market: employerMarket,
        candidate_market: candidateMarket,
        recommendations,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/hr/recruitment/vacancies/${vacancyId}/market-analysis`],
      });
      toast({ title: "Bozor tahlili saqlandi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  function generateAndSetRecommendations() {
    const recs = generateRecommendations(employerMarket, candidateMarket);
    setRecommendations(recs);
  }

  const hasData = !!data?.data;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-2xl overflow-y-auto"
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <BarChart2 className="w-5 h-5 text-primary" />
            Bozor Tahlili — {vacancyTitle}
          </SheetTitle>
          {hasData && data?.data?.updated_at && (
            <p className="text-xs text-muted-foreground">
              Oxirgi yangilanish: {new Date(data.data.updated_at).toLocaleString("uz")}
            </p>
          )}
        </SheetHeader>

        {isLoading ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Yuklanmoqda...</div>
        ) : (
          <div className="space-y-6 pb-6">
            <EmployerMarketSection 
              employerMarket={employerMarket} 
              setEmployerMarket={setEmployerMarket} 
            />

            <CandidateMarketSection 
              candidateMarket={candidateMarket} 
              setCandidateMarket={setCandidateMarket} 
            />

            <section className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Yollash vaqti bashorati
              </h3>
              <HiringForecast
                em={employerMarket}
                cm={candidateMarket}
                historical={data?.historical ?? null}
              />
            </section>

            <RecommendationsSection 
              recommendations={recommendations} 
              setRecommendations={setRecommendations} 
              onGenerate={generateAndSetRecommendations} 
            />

            <Button
              className="w-full gap-2"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              data-testid="btn-save-market-analysis"
            >
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function MarketAnalysisBadge({
  heat,
}: {
  heat: "hot" | "medium" | "cold" | null | undefined;
}) {
  if (!heat) return null;
  const opt = HEAT_OPTIONS.find(h => h.value === heat) ?? HEAT_OPTIONS[1];
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${opt.color}`}>
      <TrendingUp className="w-2.5 h-2.5" />
      {opt.label}
    </span>
  );
}
