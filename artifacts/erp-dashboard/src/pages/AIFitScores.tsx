/**
 * @module AIFitScores
 * @description React page component (P36 — AI-fit per-card scorer). Lists persisted
 *   AI-fit scores, lets the user run an AI evaluation (employee ↔ card) and view the
 *   latest fit report for an employee.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { BrainCircuit, Eye, Plus, Sparkles, Star, XCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EPErrorState, EPPageHeader, EPLoader } from "@/components/ep";

interface FitScore {
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

const SCORES_KEY = "/api/ai/fit/scores";

function scoreColor(score: number): string {
  if (score >= 85) return "text-[var(--ep-green)] dark:text-green-400";
  if (score >= 70) return "text-[var(--ep-blue)] dark:text-blue-400";
  if (score >= 50) return "text-[var(--ep-yellow)] dark:text-yellow-400";
  return "text-[var(--ep-red)] dark:text-red-400";
}

export default function AIFitScores() {
  const { toast } = useToast();
  const [showEvaluate, setShowEvaluate] = useState(false);
  const [reportEmployeeId, setReportEmployeeId] = useState<number | null>(null);

  const [employeeId, setEmployeeId] = useState("");
  const [cardId, setCardId] = useState("");
  const [employeeProfile, setEmployeeProfile] = useState('{"performance":80}');
  const [cardRequirements, setCardRequirements] = useState('{"title":"Operator"}');

  const { data: scores, isLoading, isError, error, refetch } = useQuery<FitScore[]>({
    queryKey: [SCORES_KEY],
  });

  const { data: report } = useQuery<FitScore>({
    queryKey: ["/api/ai/fit/report", reportEmployeeId],
    enabled: reportEmployeeId !== null,
  });

  const evaluateMutation = useMutation({
    mutationFn: async () => {
      let profile: unknown = {};
      let requirements: unknown = {};
      try { profile = JSON.parse(employeeProfile || "{}"); } catch { throw new Error("Xodim profili JSON noto'g'ri"); }
      try { requirements = JSON.parse(cardRequirements || "{}"); } catch { throw new Error("Karta talablari JSON noto'g'ri"); }
      return apiRequest("POST", "/api/ai/fit/evaluate", {
        employeeId: Number(employeeId),
        cardId: Number(cardId),
        employeeProfile: profile,
        cardRequirements: requirements,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SCORES_KEY] });
      toast({ title: "AI-fit baholandi", description: "Yangi baho saqlandi" });
      setShowEvaluate(false);
      setEmployeeId("");
      setCardId("");
    },
    onError: (e: unknown) => {
      toast({
        title: "Xatolik",
        description: e instanceof Error ? e.message : "AI-fit baholashda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const rows = Array.isArray(scores) ? scores : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <EPLoader size={32} />
      </div>
    );
  }

  if (isError) {
    return <EPErrorState onRetry={refetch} error={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <EPPageHeader
          breadcrumb={<>Direktor / <b className="text-foreground">AI Moslik Baholash</b></>}
          title="AI Moslik Baholash"
          subtitle="Xodim ↔ karta mosligini AI orqali baholash va hisobotlar"
          icon={<BrainCircuit className="h-5 w-5" />}
        />
        <Button
          onClick={() => setShowEvaluate(true)}
          data-testid="button-evaluate-fit"
          className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold shadow-none"
        >
          <Plus className="w-4 h-4 mr-2" />
          AI Baholash
        </Button>
      </div>

      <div className="grid gap-4">
        {rows.length === 0 ? (
          <Card className="bg-card border-border shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <XCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p>Hozircha AI-fit baholar yo'q</p>
            </CardContent>
          </Card>
        ) : (
          rows.map((s) => (
            <Card key={s.id} className="bg-card border-border shadow-none hover:bg-muted/40 transition-colors" data-testid={`card-fit-${s.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-[14px] font-semibold text-foreground flex items-center gap-2">
                      Xodim #{s.employeeId} → Karta #{s.cardId}
                      {s.successionCandidate && (
                        <Badge variant="default" className="gap-1">
                          <Star className="h-3 w-3" /> Voris nomzodi
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {s.aiProvider && <div>Provayder: {s.aiProvider}</div>}
                      {s.bonusRecommendation !== null && <div>Tavsiya bonus: {s.bonusRecommendation}</div>}
                      <div>Baholangan: {new Date(s.evaluatedAt).toLocaleString("uz-UZ")}</div>
                    </div>
                  </div>
                  <div className={`text-4xl font-bold tracking-tight ${scoreColor(s.fitScore)}`}>
                    {s.fitScore}%
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReportEmployeeId(s.employeeId)}
                    data-testid={`button-report-${s.employeeId}`}
                    className="bg-muted/60 text-foreground hover:bg-muted border-none rounded-lg px-4 py-2 font-medium"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Hisobotni ko'rish
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Evaluate dialog */}
      <Dialog open={showEvaluate} onOpenChange={setShowEvaluate}>
        <DialogContent className="max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5" /> AI Moslik Baholash
            </DialogTitle>
            <DialogDescription>Xodim va karta ma'lumotlarini kiriting</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fit-employee">Xodim ID</Label>
                <Input
                  id="fit-employee"
                  type="number"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  data-testid="input-employee-id"
                  placeholder="1"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fit-card">Karta ID</Label>
                <Input
                  id="fit-card"
                  type="number"
                  value={cardId}
                  onChange={(e) => setCardId(e.target.value)}
                  data-testid="input-card-id"
                  placeholder="1"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fit-profile">Xodim profili (JSON)</Label>
              <Textarea
                id="fit-profile"
                value={employeeProfile}
                onChange={(e) => setEmployeeProfile(e.target.value)}
                data-testid="input-employee-profile"
                rows={3}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fit-requirements">Karta talablari (JSON)</Label>
              <Textarea
                id="fit-requirements"
                value={cardRequirements}
                onChange={(e) => setCardRequirements(e.target.value)}
                data-testid="input-card-requirements"
                rows={3}
                className="font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEvaluate(false)}
              className="rounded-lg px-4 py-2"
            >
              Bekor qilish
            </Button>
            <Button
              onClick={() => evaluateMutation.mutate()}
              disabled={evaluateMutation.isPending || !employeeId || !cardId}
              data-testid="button-submit-evaluate"
              className="bg-primary text-white rounded-lg px-5 py-2 font-semibold"
            >
              {evaluateMutation.isPending ? "Baholanmoqda..." : "Baholash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report dialog */}
      <Dialog open={reportEmployeeId !== null} onOpenChange={(open) => { if (!open) setReportEmployeeId(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] p-6">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">AI-fit hisoboti</DialogTitle>
            <DialogDescription>
              {report ? `Xodim #${report.employeeId} → Karta #${report.cardId}` : "Yuklanmoqda..."}
            </DialogDescription>
          </DialogHeader>
          {report ? (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Card className="flex-1">
                    <CardHeader className="pb-3">
                      <CardDescription>Moslik bali</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-3xl font-bold ${scoreColor(report.fitScore)}`}>{report.fitScore}%</div>
                    </CardContent>
                  </Card>
                  <Card className="flex-1">
                    <CardHeader className="pb-3">
                      <CardDescription>Voris nomzodi</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Badge variant={report.successionCandidate ? "default" : "outline"}>
                        {report.successionCandidate ? "Ha" : "Yo'q"}
                      </Badge>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Hisobot (fit_report)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed bg-muted/50 rounded-md p-3">
                      {report.fitReport ? JSON.stringify(report.fitReport, null, 2) : "—"}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center py-12">
              <EPLoader size={32} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
