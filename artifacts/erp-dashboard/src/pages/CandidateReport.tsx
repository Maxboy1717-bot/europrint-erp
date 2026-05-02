import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, User, Phone, Mail, Briefcase, CheckCircle, XCircle, AlertTriangle, FileText } from "lucide-react";
import { SyndromeAnalysis } from "@/components/hr/SyndromeAnalysis";
import { IQScaleChart } from "@/components/hr/IQScaleChart";

interface CandidateDetail {
  id: number;
  fullName: string;
  phone: string;
  email?: string | null;
  source?: string | null;
  notes?: string | null;
  status?: string | null;
  createdAt?: string;
}

interface FunnelEntry {
  id: number;
  funnel_stage: string;
  vacancy_title?: string | null;
  vacancy_type?: string | null;
  recruiter_name?: string | null;
  candidate_source?: string | null;
  tool_test_score?: number | null;
  tool_test_results?: Record<string, number> | null;
  recommendation?: string | null;
  screening_score?: number | null;
  created_at?: string;
}

interface ToolTestRecord {
  id: number;
  testDate: string;
  totalScore: number;
  categoryResult: string;
  pointA: number; pointB: number; pointC: number; pointD: number; pointE: number;
  pointF: number; pointG: number; pointH: number; pointI: number; pointJ: number;
  iqScore?: number | null;
  positionMatchScore?: number | null;
  positionMatchNotes?: string | null;
  isValid: boolean;
}

interface ProductivityInterview {
  id: number;
  conductedAt: string;
  overallScore: number;
  hasConcreteResults?: boolean;
  canWorkIndependently?: boolean;
  productivityInterview?: Record<string, unknown>;
}

const STAGE_LABELS: Record<string, string> = {
  NEW: "Yangi ariza",
  QUESTIONNAIRE_SENT: "Anketa yuborildi",
  PHONE_SCREENING: "Telefon suhbati",
  TEST_SENT: "Test yuborildi",
  INTERVIEW_SCHEDULED: "Suhbat rejalashtirildi",
  INTERVIEWED: "Suhbat o'tkazildi",
  OFFER_SENT: "Taklif yuborildi",
  HIRED: "Qabul qilindi",
  REJECTED: "Rad etildi",
};

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  FLAGMAN: { label: "Flagman", color: "text-green-400" },
  PROCESSNIK: { label: "Processnik", color: "text-blue-400" },
  UNPRODUCTIVE: { label: "Samarasiz", color: "text-red-400" },
  UNKNOWN: { label: "Aniqlanmagan", color: "text-muted-foreground" },
};

const TOOL_TEST_TRAIT_LABELS: Record<string, string> = {
  A: "Diqqat",
  B: "Strategiya",
  C: "Nazorat",
  D: "Ishonch",
  E: "Energiya",
  F: "Qat'iyat",
  G: "Himoya",
  H: "Taktika",
  I: "Empatiya",
  J: "Muloqot",
};

function Section({ title, children, number }: { title: string; children: React.ReactNode; number: number }) {
  return (
    <section className="break-inside-avoid mb-8">
      <div className="flex items-center gap-3 mb-4 pb-2 border-b-2 border-primary/30">
        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0 print:bg-black print:text-white">
          {number}
        </div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1.5 border-b border-border/30">
      <span className="text-sm text-muted-foreground w-48 shrink-0">{label}:</span>
      <span className="text-sm font-medium text-foreground">{value || "—"}</span>
    </div>
  );
}

export default function CandidateReport() {
  const params = useParams<{ id: string }>();
  const candidateId = Number(params.id);

  const { data: candidateData, isLoading: loadingCandidate } = useQuery<CandidateDetail>({
    queryKey: [`/api/candidates/${candidateId}`],
    queryFn: () => apiRequest("GET", `/api/candidates/${candidateId}`),
    enabled: !!candidateId,
  });

  const { data: pipelineData } = useQuery<{ data: FunnelEntry[] }>({
    queryKey: ["/api/hr/recruitment/pipeline"],
    staleTime: 60_000,
  });

  const { data: toolTestData } = useQuery<ToolTestRecord[]>({
    queryKey: [`/api/hr/recruitment/tool-test/candidate/${candidateId}`],
    queryFn: () => apiRequest("GET", `/api/hr/recruitment/tool-test/candidate/${candidateId}`),
    enabled: !!candidateId,
  });

  const { data: interviewData } = useQuery<ProductivityInterview[]>({
    queryKey: [`/api/hr/recruitment/productivity-interview/candidate/${candidateId}`],
    queryFn: () => apiRequest("GET", `/api/hr/recruitment/productivity-interview/candidate/${candidateId}`),
    enabled: !!candidateId,
  });

  const candidate = candidateData;
  const pipelineEntry = (Array.isArray(pipelineData?.data) ? pipelineData?.data : []).find((e) => e.id === candidateId || true);
  const funnelEntries = (Array.isArray(pipelineData?.data) ? pipelineData?.data : []).filter((e) => {
    return true;
  });

  const latestToolTest = Array.isArray(toolTestData) ? toolTestData[0] : null;
  const latestInterview = Array.isArray(interviewData) ? interviewData[0] : null;

  const toolTestResults = latestToolTest
    ? {
        A: latestToolTest.pointA,
        B: latestToolTest.pointB,
        C: latestToolTest.pointC,
        D: latestToolTest.pointD,
        E: latestToolTest.pointE,
        F: latestToolTest.pointF,
        G: latestToolTest.pointG,
        H: latestToolTest.pointH,
        I: latestToolTest.pointI,
        J: latestToolTest.pointJ,
      }
    : null;

  const recommendation = latestToolTest?.categoryResult ?? "UNKNOWN";
  const recInfo = CATEGORY_LABELS[recommendation] ?? CATEGORY_LABELS.UNKNOWN;

  const printDate = new Date().toLocaleDateString("uz-UZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (loadingCandidate) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Nomzod topilmadi (ID: {candidateId})
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black p-8 max-w-4xl mx-auto print:p-6 print:max-w-none">
      {/* Print button — hidden when printing */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">Kandidat bo'yicha yakuniy hisobot</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
          >
            ← Orqaga
          </Button>
          <Button
            className="gap-2"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4" />
            PDF / Chop etish
          </Button>
        </div>
      </div>

      {/* Report Header */}
      <div className="border-2 border-gray-800 rounded-lg p-6 mb-8 print:border-black">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">YAKUNIY HISOBOT — MATERIAL №55</p>
            <h1 className="text-3xl font-bold text-gray-900">{candidate.fullName}</h1>
            <div className="flex flex-wrap gap-3 mt-2">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                {candidate.phone}
              </div>
              {candidate.email && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  {candidate.email}
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Hisobot sanasi</p>
            <p className="font-semibold text-gray-800">{printDate}</p>
            <div className="mt-2">
              <span className={`text-sm font-bold px-3 py-1 rounded-full border-2 ${
                recommendation === "FLAGMAN"
                  ? "border-green-500 text-green-700 bg-green-50"
                  : recommendation === "PROCESSNIK"
                  ? "border-blue-500 text-blue-700 bg-blue-50"
                  : recommendation === "UNPRODUCTIVE"
                  ? "border-red-500 text-red-700 bg-red-50"
                  : "border-gray-400 text-gray-600 bg-gray-50"
              }`}>
                {recInfo.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Asosiy natijalar */}
      <Section number={1} title="Asosiy Natijalar va Faktlar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <InfoRow label="Manba (kanal)" value={candidate.source} />
            <InfoRow label="Holat" value={candidate.status} />
            <InfoRow label="Izoh" value={candidate.notes} />
          </div>
          <div className="bg-gray-50 rounded-lg p-4 print:bg-white print:border print:border-gray-300">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Umumiy Baholash</p>
            <div className={`text-2xl font-bold ${recInfo.color}`}>{recInfo.label}</div>
            {latestToolTest && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">TOOL TEST umumiy ball:</p>
                <p className="text-lg font-bold">{latestToolTest.totalScore > 0 ? "+" : ""}{latestToolTest.totalScore}</p>
              </div>
            )}
            {latestInterview && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">Produktivlik intervyusi:</p>
                <p className="text-lg font-bold">{latestInterview.overallScore}/10</p>
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* Section 2: Test natijalari va talqin */}
      <Section number={2} title="Test Natijalari va Talqin">
        {!latestToolTest ? (
          <p className="text-sm text-gray-500 italic">TOOL TEST o'tkazilmagan</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Test sanasi</p>
                <p className="text-sm font-medium">
                  {new Date(latestToolTest.testDate).toLocaleDateString("uz-UZ")}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Umumiy ball</p>
                <p className={`text-lg font-bold ${latestToolTest.totalScore >= 30 ? "text-green-600" : latestToolTest.totalScore >= -30 ? "text-amber-600" : "text-red-600"}`}>
                  {latestToolTest.totalScore > 0 ? "+" : ""}{latestToolTest.totalScore}
                </p>
              </div>
            </div>

            {/* TOOL TEST A-J bar chart */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">A-J Ko'rsatkichlar</p>
              <div className="grid grid-cols-2 gap-2">
                {(["A","B","C","D","E","F","G","H","I","J"]).map((key) => {
                  const score = (latestToolTest[`point${key}` as keyof ToolTestRecord] as number) ?? 0;
                  const pct = Math.max(4, (score + 100) / 2);
                  const colorBar = score >= 30 ? "bg-green-500" : score >= -30 ? "bg-amber-500" : "bg-red-500";
                  const colorTxt = score >= 30 ? "text-green-700" : score >= -30 ? "text-amber-700" : "text-red-700";
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-20 shrink-0">
                        {key}: {TOOL_TEST_TRAIT_LABELS[key]}
                      </span>
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${colorBar}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold w-10 text-right ${colorTxt}`}>
                        {score > 0 ? "+" : ""}{score}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* IQ if available */}
            {latestToolTest.iqScore != null && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">IQ Natijasi</p>
                <IQScaleChart iq={latestToolTest.iqScore} />
              </div>
            )}

            {/* Position match */}
            {latestToolTest.positionMatchScore != null && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Lavozimga moslik ({latestToolTest.positionMatchNotes})</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${latestToolTest.positionMatchScore >= 70 ? "bg-green-500" : "bg-red-500"}`}
                      style={{ width: `${latestToolTest.positionMatchScore}%` }}
                    />
                  </div>
                  <span className="font-bold text-sm">{latestToolTest.positionMatchScore}%</span>
                </div>
              </div>
            )}

            {/* Syndromes */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Sindromlar Tahlili</p>
              <SyndromeAnalysis toolTestResults={toolTestResults} />
            </div>
          </div>
        )}
      </Section>

      {/* Section 3: Tavsiyalar tekshiruvi */}
      <Section number={3} title="Tavsiyalar Tekshiruvi Natijalari">
        {!latestInterview ? (
          <p className="text-sm text-gray-500 italic">Produktivlik intervyusi o'tkazilmagan</p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Intervyu sanasi</p>
                <p className="text-sm font-medium">
                  {new Date(latestInterview.conductedAt).toLocaleDateString("uz-UZ")}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Umumiy ball</p>
                <p className={`text-lg font-bold ${latestInterview.overallScore >= 7 ? "text-green-600" : latestInterview.overallScore >= 5 ? "text-amber-600" : "text-red-600"}`}>
                  {latestInterview.overallScore}/10
                </p>
              </div>
            </div>
            {latestInterview.hasConcreteResults !== undefined && (
              <div className="flex items-center gap-2">
                {latestInterview.hasConcreteResults
                  ? <CheckCircle className="w-4 h-4 text-green-500" />
                  : <XCircle className="w-4 h-4 text-red-500" />
                }
                <span className="text-sm">Aniq natijalarga ega</span>
              </div>
            )}
            {latestInterview.canWorkIndependently !== undefined && (
              <div className="flex items-center gap-2">
                {latestInterview.canWorkIndependently
                  ? <CheckCircle className="w-4 h-4 text-green-500" />
                  : <XCircle className="w-4 h-4 text-red-500" />
                }
                <span className="text-sm">Mustaqil ishlash qobiliyati</span>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Section 4: Xulosa */}
      <Section number={4} title="Xulosa — Qabul / Rad Etish">
        <div className={`rounded-lg border-2 p-6 ${
          recommendation === "FLAGMAN"
            ? "border-green-500 bg-green-50"
            : recommendation === "PROCESSNIK"
            ? "border-blue-500 bg-blue-50"
            : recommendation === "UNPRODUCTIVE"
            ? "border-red-500 bg-red-50"
            : "border-gray-300 bg-gray-50"
        } print:border-gray-800 print:bg-white`}>
          <div className="flex items-center gap-3 mb-3">
            {recommendation === "FLAGMAN" ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : recommendation === "UNPRODUCTIVE" ? (
              <XCircle className="w-8 h-8 text-red-600" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            )}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Yakuniy qaror</p>
              <p className={`text-2xl font-bold ${
                recommendation === "FLAGMAN" ? "text-green-700"
                : recommendation === "PROCESSNIK" ? "text-blue-700"
                : recommendation === "UNPRODUCTIVE" ? "text-red-700"
                : "text-gray-700"
              }`}>
                {recommendation === "FLAGMAN" ? "QABUL TAVSIYA ETILADI"
                  : recommendation === "PROCESSNIK" ? "QABUL (OPERATSION LAVOZIM)"
                  : recommendation === "UNPRODUCTIVE" ? "RAD ETISH TAVSIYA ETILADI"
                  : "QABUL HOLATI ANIQLANMAGAN"}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-700">
            {recommendation === "FLAGMAN"
              ? "Nomzod Flagman kategoriyasiga mos. Yuqori samaradorlik, mustaqil ishlash qobiliyati va aniq natijalar ko'rsatgan. Ishga qabul qilish tavsiya etiladi."
              : recommendation === "PROCESSNIK"
              ? "Nomzod Processnik kategoriyasiga mos. Operatsion va ijrochi lavozimlarga mos, ko'rsatma asosida yaxshi ishlaydi."
              : recommendation === "UNPRODUCTIVE"
              ? "Nomzod hozircha kompaniya talablariga javob bermaydi. Rad etish tavsiya etiladi."
              : "Nomzodning to'liq baholash ma'lumotlari mavjud emas. Qo'shimcha baholash talab etiladi."}
          </p>
        </div>
      </Section>

      {/* Section 5: Xavf va imkoniyatlar */}
      <Section number={5} title="Xavf va Imkoniyatlar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-amber-200 rounded-lg p-4 bg-amber-50 print:bg-white print:border-amber-400">
            <p className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Xavf omillari
            </p>
            {toolTestResults ? (
              <ul className="text-sm text-gray-700 space-y-1">
                {(Object.entries(toolTestResults) as [string, number][])
                  .filter(([, v]) => Math.abs(v) >= 80)
                  .map(([k, v]) => (
                    <li key={k}>• {TOOL_TEST_TRAIT_LABELS[k]} ({k}) kompulsiv daraja: {v > 0 ? "+" : ""}{v}</li>
                  ))}
                {latestToolTest && latestToolTest.totalScore < -30 && (
                  <li>• Umumiy ball past: {latestToolTest.totalScore}</li>
                )}
                {(Object.entries(toolTestResults) as [string, number][]).filter(([, v]) => Math.abs(v) >= 80).length === 0 &&
                 (!latestToolTest || latestToolTest.totalScore >= -30) && (
                  <li className="text-gray-500 italic">Kompulsiv ko'rsatkichlar aniqlanmadi</li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">Ma'lumot yo'q</p>
            )}
          </div>
          <div className="border border-green-200 rounded-lg p-4 bg-green-50 print:bg-white print:border-green-400">
            <p className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Imkoniyatlar
            </p>
            {toolTestResults ? (
              <ul className="text-sm text-gray-700 space-y-1">
                {(Object.entries(toolTestResults) as [string, number][])
                  .filter(([, v]) => v >= 30 && v < 80)
                  .map(([k, v]) => (
                    <li key={k}>• {TOOL_TEST_TRAIT_LABELS[k]} ({k}) kuchli: +{v}</li>
                  ))}
                {latestToolTest && latestToolTest.totalScore >= 30 && (
                  <li>• Umumiy ball yuqori: +{latestToolTest.totalScore}</li>
                )}
                {(Object.entries(toolTestResults) as [string, number][]).filter(([, v]) => v >= 30 && v < 80).length === 0 &&
                 (!latestToolTest || latestToolTest.totalScore < 30) && (
                  <li className="text-gray-500 italic">Belgilangan kuchli tomonlar yo'q</li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">Ma'lumot yo'q</p>
            )}
          </div>
        </div>
      </Section>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-300 flex justify-between text-xs text-gray-400 print:mt-4">
        <span>EuroPrint ERP — HR Capital Tizimi</span>
        <span>Nomzod ID: {candidateId} | {printDate}</span>
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          @page { margin: 1.5cm; }
        }
      `}</style>
    </div>
  );
}
