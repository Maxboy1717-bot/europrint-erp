/**
 * @module ENPSPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { EPStatusPill } from "@/components/ep";

const STATUS_COLORS: Record<string, string> = { draft: "bg-muted text-muted-foreground", active: "bg-green-700", closed: "bg-muted text-muted-foreground" };
const STATUS_LABELS: Record<string, string> = { draft: "Qoralama", active: "Faol", closed: "Yopildi" };

function eNPSLabel(score: number) {
  if (score >= 50) return { label: "Zo'r", color: "text-green-400" };
  if (score >= 20) return { label: "Yaxshi", color: "text-blue-400" };
  if (score >= 0) return { label: "O'rtacha", color: "text-yellow-400" };
  return { label: "E'tibor talab etiladi", color: "text-red-400" };
}

export default function ENPSPage() {
  const { user } = useAuth();
  const currentUserId = user?.employeeId ?? user?.id ?? 0;
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<{ id?: number; title?: string; status?: string; period?: string; response_count?: number } | null>(null);
  const [createForm, setCreateForm] = useState({ title: "", period: `Q${Math.ceil((new Date().getMonth() + 1) / 3)}-${new Date().getFullYear()}`, created_by: currentUserId });
  const [responseForm, setResponseForm] = useState({ nps_score: 7, satisfaction_score: 3, feedback: "", department_id: "" });

  interface ENPSSurvey { id: number; title: string; status: string; period: string; response_count: number }
  interface DeptResult { department_name: string; enps_score: number; needs_attention: boolean }
  interface FeedbackComment { feedback: string; submitted_at: string }
  interface OverallENPS { total_responses: number; promoters: number; passives: number; detractors: number; enps_score: number; avg_satisfaction?: number }
  interface ENPSResults { by_department: DeptResult[]; feedback_comments: FeedbackComment[]; overall?: OverallENPS; [key: string]: unknown }

  const { data: surveys } = useQuery<ENPSSurvey[]>({
    queryKey: ["/api/hr-v2/enps"],
    queryFn: () => apiRequest("GET", "/api/hr-v2/enps"),
  });

  const { data: results } = useQuery<ENPSResults>({
    queryKey: ["/api/hr-v2/enps/results", selectedSurvey?.id],
    queryFn: () => apiRequest("GET", `/api/hr-v2/enps/${selectedSurvey?.id}/results`),
    enabled: !!selectedSurvey?.id,
  });

  const create = useMutation({
    mutationFn: (d: Record<string, unknown>) => apiRequest("POST", "/api/hr-v2/enps", d),
    onSuccess: () => { toast({ title: "✅ So'rov yaratildi" }); setShowCreate(false); qc.invalidateQueries({ queryKey: ["/api/hr-v2/enps"] }); },
  });

  const launch = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/hr-v2/enps/${id}/launch`, {}),
    onSuccess: () => { toast({ title: "🚀 So'rov ishga tushirildi" }); qc.invalidateQueries({ queryKey: ["/api/hr-v2/enps"] }); },
  });

  const close = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/hr-v2/enps/${id}/close`, {}),
    onSuccess: () => { toast({ title: "✅ So'rov yopildi" }); qc.invalidateQueries({ queryKey: ["/api/hr-v2/enps"] }); },
  });

  const respond = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => apiRequest("POST", `/api/hr-v2/enps/respond`, { ...data, survey_id: id }),
    onSuccess: () => {
      toast({ title: "✅ Javobingiz qabul qilindi (+20 ball)", description: "Anonimlik ta'minlandi" });
      qc.invalidateQueries({ queryKey: ["/api/hr-v2/enps/results", selectedSurvey?.id] });
    },
  });

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">📊 eNPS — Xodimlar So'rovi</h1>
          <p className="text-muted-foreground text-sm mt-1">Choraklik anonim xodim qoniqish so'rovi</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="bg-primary hover:bg-primary/90 text-white">
          ➕ Yangi so'rov
        </Button>
      </div>

      {showCreate && (
        <Card className="bg-card border-primary max-w-lg">
          <CardHeader><CardTitle className="text-foreground">Yangi eNPS So'rov</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Sarlavha</Label>
              <Input value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Masalan: Q1 2026 Xodimlar so'rovi" className="bg-input border-border mt-1" />
            </div>
            <div>
              <Label className="text-muted-foreground">Davr</Label>
              <Input value={createForm.period} onChange={e => setCreateForm(f => ({ ...f, period: e.target.value }))}
                placeholder="Q1-2026" className="bg-input border-border mt-1" />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => create.mutate(createForm)} disabled={!createForm.title || create.isPending}
                className="bg-primary hover:bg-primary/90 text-white">
                {create.isPending ? "Yaratilmoqda..." : "✅ Yaratish"}
              </Button>
              <Button onClick={() => setShowCreate(false)} variant="outline" className="border-border text-muted-foreground">Bekor qilish</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Survey List */}
        <div className="space-y-3">
          <h3 className="text-muted-foreground text-sm font-medium">So'rovlar ({surveys?.length || 0})</h3>
          {surveys?.map((s) => (
            <Card key={s.id} onClick={() => setSelectedSurvey(s)}
              className={`cursor-pointer transition-all ${selectedSurvey?.id === s.id ? 'border-primary bg-muted' : 'bg-card border-border hover:border-border'}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-semibold text-foreground text-sm">{s.title}</div>
                  <Badge className={`${STATUS_COLORS[s.status]} text-xs`}>{STATUS_LABELS[s.status]}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">{s.period}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.response_count || 0} javob</div>
                <div className="flex gap-1 mt-3">
                  {s.status === 'draft' && (
                    <Button size="sm" onClick={e => { e.stopPropagation(); launch.mutate(s.id); }}
                      className="bg-[var(--ep-green)] hover:bg-[var(--ep-green)]/90 text-white text-xs h-7">
                      🚀 Ishga tushirish
                    </Button>
                  )}
                  {s.status === 'active' && (
                    <Button size="sm" onClick={e => { e.stopPropagation(); close.mutate(s.id); }}
                      className="bg-muted hover:bg-muted text-foreground text-xs h-7">
                      ✅ Yopish
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {(!surveys || surveys.length === 0) && (
            <div className="text-center py-8 text-muted-foreground text-sm">Hali so'rov yo'q</div>
          )}
        </div>

        {/* Results */}
        {selectedSurvey && (
          <div className="lg:col-span-2 space-y-4">
            {results ? (
              <>
                <Card className="bg-card border-border">
                  <CardHeader><CardTitle className="text-foreground">📊 {selectedSurvey.title} — Natijalar</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      {([
                        { label: "Jami javob", value: results.overall?.total_responses || 0, color: "text-foreground" },
                        { label: "Promotorlar (9-10)", value: results.overall?.promoters || 0, color: "text-green-400" },
                        { label: "Passivlar (7-8)", value: results.overall?.passives || 0, color: "text-yellow-400" },
                        { label: "Detraktorlar (0-6)", value: results.overall?.detractors || 0, color: "text-red-400" },
                      ]).map(s => (
                        <div key={s.label} className="text-center">
                          <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                          <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    {results.overall != null && results.overall.enps_score !== null && (
                      <div className="text-center p-6 bg-muted rounded-xl">
                        <div className="text-xs text-muted-foreground mb-1">eNPS BALLI</div>
                        <div className={`text-6xl font-bold ${eNPSLabel(results.overall.enps_score).color}`}>
                          {results.overall.enps_score > 0 ? "+" : ""}{results.overall.enps_score}
                        </div>
                        <div className={`text-sm mt-2 ${eNPSLabel(results.overall.enps_score).color}`}>
                          {eNPSLabel(results.overall.enps_score).label}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">O'rtacha qoniqish: {results.overall.avg_satisfaction}/5</div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Department results */}
                {results.by_department?.length > 0 && (
                  <Card className="bg-card border-border">
                    <CardHeader><CardTitle className="text-foreground text-base">Bo'limlar bo'yicha</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {(Array.isArray(results.by_department) ? results.by_department : []).map((d) => (
                          <div key={d.department_name} className="flex items-center gap-4">
                            <div className="w-36 text-muted-foreground text-sm truncate">{d.department_name || "Noma'lum"}</div>
                            <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${d.enps_score >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min(100, Math.abs(d.enps_score || 0))}%` }} />
                            </div>
                            <div className={`w-12 text-right font-bold text-sm ${d.enps_score >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {d.enps_score > 0 ? "+" : ""}{d.enps_score}
                            </div>
                            {d.needs_attention && <EPStatusPill tone="danger">⚠️ E'tibor</EPStatusPill>}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Feedback comments */}
                {results.feedback_comments?.length > 0 && (
                  <Card className="bg-card border-border">
                    <CardHeader><CardTitle className="text-foreground text-base">💬 Fikrlar (anonim)</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {(Array.isArray(results.feedback_comments) ? results.feedback_comments : []).map((c, i) => (
                          <div key={`k-${i}`} className="p-3 bg-muted rounded-lg">
                            <p className="text-muted-foreground text-sm italic">"{c.feedback}"</p>
                            <div className="text-xs text-muted-foreground mt-1">{new Date(c.submitted_at).toLocaleDateString()}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-[13px] text-muted-foreground">Yuklanmoqda...</div>
            )}

            {/* Respond form */}
            {selectedSurvey.status === 'active' && (
              <Card className="bg-card border-border">
                <CardHeader><CardTitle className="text-foreground text-base">📝 Javob berish (Anonim)</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">EuroPrint'da ishlashni tavsiya qilasizmi? (0-10)</Label>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {Array.from({ length: 11 }, (_, i) => (
                        <button key={`k-${i}`} onClick={() => setResponseForm(f => ({ ...f, nps_score: i }))}
                          className={`w-9 h-9 rounded text-sm font-bold transition-all ${responseForm.nps_score === i
                            ? (i >= 9 ? 'bg-[var(--ep-green)] text-white' : i >= 7 ? 'bg-[var(--ep-yellow)] text-white' : 'bg-[var(--ep-red)] text-white')
                            : 'bg-muted text-muted-foreground hover:bg-muted'}`}>
                          {i}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Aslo tavsiya etmayman</span>
                      <span>Albatta tavsiya qilaman</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Qoniqish darajasi (1-5)</Label>
                    <div className="flex gap-2 mt-2">
                      {([1, 2, 3, 4, 5]).map(n => (
                        <button key={n} onClick={() => setResponseForm(f => ({ ...f, satisfaction_score: n }))}
                          className={`w-10 h-10 rounded text-lg transition-all ${responseForm.satisfaction_score === n ? 'bg-primary' : 'bg-muted hover:bg-muted'}`}>
                          {["😞", "😕", "😐", "😊", "😄"][n - 1]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Nima yaxshilanishi kerak? (ixtiyoriy)</Label>
                    <Textarea value={responseForm.feedback} onChange={e => setResponseForm(f => ({ ...f, feedback: e.target.value }))}
                      placeholder="Fikringizni baham ko'ring..." className="bg-input border-border mt-1" />
                  </div>
                  <Button onClick={() => respond.mutate({ id: selectedSurvey?.id ?? 0, data: responseForm })}
                    disabled={respond.isPending}
                    className="bg-primary hover:bg-primary/90 text-white w-full">
                    {respond.isPending ? "Yuborilmoqda..." : "📤 Anonim javob yuborish (+20 ball)"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
