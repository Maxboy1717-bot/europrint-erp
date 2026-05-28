import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { EPComingSoon, EPErrorState } from "@/components/ep";
import { isNotImplementedError } from "@/hooks/useNotImplemented";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


interface EnpsSurvey {
  id: number | string;
  title: string;
  description?: string;
  /** Drizzle ORM returns camelCase; raw SQL may return snake_case */
  start_date?: string;
  startDate?: string;
  end_date?: string;
  endDate?: string;
  status: string;
  period?: string;
  /** Not in DB schema — may be absent */
  response_count?: number;
  target_count?: number;
  questions?: unknown;
}

interface EnpsResult {
  survey_id: number | string;
  nps_score: number;
  promoters_pct: number;
  passives_pct: number;
  detractors_pct: number;
  period: string;
}


function statusVariant(status: string): "success" | "warning" | "neutral" {
  if (status === "active") return "success";
  if (status === "draft") return "warning";
  return "neutral";
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    active: "Faol",
    draft: "Qoralama",
    completed: "Tugallangan",
    archived: "Arxivlangan",
  };
  return map[status] ?? status;
}

function npsColor(score: number): string {
  if (score > 50) return "text-green-600";
  if (score >= 0) return "text-yellow-600";
  return "text-red-600";
}

function npsLabel(score: number): string {
  if (score > 50) return "A'lo";
  if (score >= 0) return "Qoniqarli";
  return "Yomon";
}

function fmtDate(d: string | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function NpsScoreCard({ result }: { result: EnpsResult }) {
  return (
    <Card className="border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Davr: {result.period}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <span
            className={`text-5xl font-bold tabular-nums ${npsColor(result.nps_score)}`}
          >
            {result.nps_score > 0 ? `+${result.nps_score}` : result.nps_score}
          </span>
          <div>
            <Badge
              variant={
                result.nps_score > 50
                  ? "success"
                  : result.nps_score >= 0
                  ? "warning"
                  : "danger"
              }
            >
              {npsLabel(result.nps_score)}
            </Badge>
            <p className="mt-1 text-xs text-muted-foreground">
              NPS Ball (−100 dan +100 gacha)
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-green-600 font-medium">Promoters</span>
              <span>{result.promoters_pct.toFixed(1)}%</span>
            </div>
            <Progress
              value={result.promoters_pct}
              className="h-2 [&>div]:bg-green-500"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-yellow-600 font-medium">Passives</span>
              <span>{result.passives_pct.toFixed(1)}%</span>
            </div>
            <Progress
              value={result.passives_pct}
              className="h-2 [&>div]:bg-yellow-400"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-red-600 font-medium">Detractors</span>
              <span>{result.detractors_pct.toFixed(1)}%</span>
            </div>
            <Progress
              value={result.detractors_pct}
              className="h-2 [&>div]:bg-red-500"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


export default function HREnps() {
  const [activeTab, setActiveTab] = useState("surveys");

  const {
    data: surveysRaw,
    isLoading: loadingSurveys,
    isError: errSurveys,
    error,
    refetch,
  } = useQuery<EnpsSurvey[]>({ queryKey: ["/api/hr/enps/surveys"] });

  const {
    data: resultsRaw,
    isLoading: loadingResults,
    isError: errResults,
  } = useQuery<EnpsResult[]>({ queryKey: ["/api/hr/enps/surveys/results"] });

  const surveys = Array.isArray(surveysRaw) ? surveysRaw : [];
  const results = Array.isArray(resultsRaw) ? resultsRaw : [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">eNPS So'rov</h1>
          <p className="text-sm text-muted-foreground">
            Xodimlar sodiqligini o'lchash tizimi
          </p>
        </div>
      </div>

      {/* NPS explanation card */}
      <Card className="bg-muted/40">
        <CardContent className="pt-4 pb-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">NPS ball </span>
            ishchi tavsiyasi indeksini ko'rsatadi:&nbsp;
            <span className="text-green-600 font-medium">+50 dan yuqori</span> —
            a'lo;&nbsp;
            <span className="text-yellow-600 font-medium">0–50</span> — qoniqarli;&nbsp;
            <span className="text-red-600 font-medium">0 dan past</span> — tahlil
            talab qiladi.
          </p>
        </CardContent>
      </Card>

      {/* Tabs */}
      {isNotImplementedError(error) && errSurveys
        ? <EPComingSoon />
        : errSurveys
          ? <EPErrorState onRetry={refetch} />
          : (
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="surveys">So'rovlar</TabsTrigger>
          <TabsTrigger value="results">Natijalar</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Surveys ── */}
        <TabsContent value="surveys" className="mt-4">
          {errSurveys && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Ma'lumotlarni yuklashda xatolik yuz berdi.
              </CardContent>
            </Card>
          )}
          {!errSurveys && (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sarlavha</TableHead>
                    <TableHead>Tavsif</TableHead>
                    <TableHead>Boshlanish</TableHead>
                    <TableHead>Tugash</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead className="text-right">Javoblar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingSurveys && [1,2,3].map(i => <TableRow key={i}>{Array.from({length:6}).map((_,c)=><TableCell key={c}><Skeleton className="h-4 w-full"/></TableCell>)}</TableRow>)}
                  {!loadingSurveys && surveys.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-10 text-muted-foreground"
                      >
                        Hozircha so'rovlar yo'q.
                      </TableCell>
                    </TableRow>
                  )}
                  {!loadingSurveys &&
                    surveys.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.title}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                          {s.description ?? "—"}
                        </TableCell>
                        <TableCell>{fmtDate(s.startDate ?? s.start_date)}</TableCell>
                        <TableCell>{fmtDate(s.endDate ?? s.end_date)}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(s.status)}>
                            {statusLabel(s.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {s.response_count ?? "—"} / {s.target_count ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ── Tab 2: Results ── */}
        <TabsContent value="results" className="mt-4">
          {errResults && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Ma'lumotlarni yuklashda xatolik yuz berdi.
              </CardContent>
            </Card>
          )}
          {loadingResults && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-4 space-y-3">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {!loadingResults && !errResults && results.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Natijalar hali mavjud emas.
              </CardContent>
            </Card>
          )}
          {!loadingResults && !errResults && results.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((r) => (
                <NpsScoreCard key={r.survey_id} result={r} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
          )}
    </div>
  );
}
