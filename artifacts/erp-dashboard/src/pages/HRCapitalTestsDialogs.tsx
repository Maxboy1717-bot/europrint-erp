/**
 * HRCapitalTestsDialogs — Self-contained dialogs for HRCapitalTests:
 * CreateSessionDialog, QuestionDialog, ResultDetailDialog.
 */
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
;
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Tooltip as RechartTooltip,
} from "recharts";
import { INDICATORS, SYNDROME_DESCRIPTIONS, IQ_LEVELS, type HrcSession, type HrcQuestion } from "./HRCapitalTestsTypes";
import { ScoreBar, getIQLevelInfo, getTestTypeLabel } from "./HRCapitalTestsHelpers";

import { useTranslation } from '@/lib/i18n';
import { EPLoader } from "@/components/ep";
// ─── CreateSessionDialog ──────────────────────────────────────────────────────

interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSessionDialog({open, onOpenChange }: CreateSessionDialogProps) {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [sessionForm, setSessionForm] = useState({
    test_type: "tool_test", candidate_id: "", employee_id: "", funnel_id: "", vacancy_id: "",
  });

  const createSessionMutation = useMutation({
    mutationFn: (form: typeof sessionForm) =>
      apiRequest("POST", "/api/hr/hrc-tests/sessions", {
        test_type:    form.test_type,
        candidate_id: form.candidate_id ? Number(form.candidate_id) : undefined,
        employee_id:  form.employee_id  ? Number(form.employee_id)  : undefined,
        funnel_id:    form.funnel_id    ? Number(form.funnel_id)    : undefined,
        vacancy_id:   form.vacancy_id   ? Number(form.vacancy_id)   : undefined,
      }),
    onSuccess: (data: { testLink?: string } | null) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/hrc-tests/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/hrc-tests/stats"] });
      onOpenChange(false);
      setSessionForm({ test_type: "tool_test", candidate_id: "", employee_id: "", funnel_id: "", vacancy_id: "" });
      toast({ title: "Test sessiyasi yaratildi! Link nusxalanmoqda..." });
      if (data?.testLink) {
        const fullLink = `${window.location.origin}${data.testLink}`;
        navigator.clipboard?.writeText(fullLink).catch(() => {});
      }
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader><DialogTitle className="text-[18px] font-semibold">{t("testSessiyasiYaratish")}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs mb-1 block">{t("testTuri")}</Label>
            <Select value={sessionForm.test_type} onValueChange={v => setSessionForm(p => ({ ...p, test_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tool_test">TOOL TEST (Shaxsiyat profili)</SelectItem>
                <SelectItem value="iq">{t("iqTest")}</SelectItem>
                <SelectItem value="leadership">{t("liderlikTesti")}</SelectItem>
                <SelectItem value="replication">{t("takrorlashTesti")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Nomzod ID (ixtiyoriy)</Label>
            <Input placeholder={t("nomzodIdRaqami")} value={sessionForm.candidate_id}
              onChange={e => setSessionForm(p => ({ ...p, candidate_id: e.target.value }))} type="number" />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Xodim ID (ixtiyoriy)</Label>
            <Input placeholder={t("xodimIdRaqami")} value={sessionForm.employee_id}
              onChange={e => setSessionForm(p => ({ ...p, employee_id: e.target.value }))} type="number" />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Kanban Funnel ID (ixtiyoriy)</Label>
            <Input placeholder={t('funnelId')} value={sessionForm.funnel_id}
              onChange={e => setSessionForm(p => ({ ...p, funnel_id: e.target.value }))} type="number" />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Vakansiya ID (ixtiyoriy)</Label>
            <Input placeholder={t("vakansiyaId")} value={sessionForm.vacancy_id}
              onChange={e => setSessionForm(p => ({ ...p, vacancy_id: e.target.value }))} type="number" />
          </div>
          <p className="text-xs text-muted-foreground">{t("testLinki24SoatAmal")}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("Bekor")}</Button>
          <Button onClick={() => createSessionMutation.mutate(sessionForm)} disabled={createSessionMutation.isPending}>
            {createSessionMutation.isPending && <EPLoader className="w-4 h-4 mr-2" />}
            Yaratish va link olish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── QuestionDialog ───────────────────────────────────────────────────────────

interface QuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingQuestion: HrcQuestion | null;
  onClose: () => void;
}

export function QuestionDialog({ open, onOpenChange, editingQuestion, onClose }: QuestionDialogProps) {
  const { toast } = useToast();
  const [questionForm, setQuestionForm] = useState({
    indicator: "A", text_uz: "", text_ru: "", weight: "1",
  });

  const createQuestionMutation = useMutation({
    mutationFn: (form: typeof questionForm) => {
      if (editingQuestion) {
        return apiRequest("PATCH", `/api/hr/hrc-tests/tool-test/questions/${editingQuestion.id}`, {
          text_uz: form.text_uz, text_ru: form.text_ru, weight: Number(form.weight),
        });
      }
      return apiRequest("POST", "/api/hr/hrc-tests/tool-test/questions", {
        indicator: form.indicator, text_uz: form.text_uz,
        text_ru: form.text_ru || undefined, weight: Number(form.weight),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/hrc-tests/tool-test/questions"] });
      onClose();
      setQuestionForm({ indicator: "A", text_uz: "", text_ru: "", weight: "1" });
      toast({ title: editingQuestion ? "Savol yangilandi" : "Savol qo'shildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  // Sync form when editingQuestion changes
  const handleOpen = (open: boolean) => {
    if (!open) { onClose(); return; }
    if (editingQuestion) {
      setQuestionForm({
        indicator: editingQuestion.indicator,
        text_uz:   editingQuestion.text_uz,
        text_ru:   editingQuestion.text_ru ?? "",
        weight:    String(editingQuestion.weight),
      });
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{editingQuestion ? "Savolni tahrirlash" : "Yangi savol qo'shish"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {!editingQuestion && (
            <div>
              <Label className="text-xs mb-1 block">{t("korsatkich")}</Label>
              <Select value={questionForm.indicator} onValueChange={v => setQuestionForm(p => ({ ...p, indicator: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INDICATORS.map(ind => (
                    <SelectItem key={ind.key} value={ind.key}>{ind.key} — {ind.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label className="text-xs mb-1 block">Savol matni (O'zbek) *</Label>
            <Textarea placeholder={t("savolMatni")} value={questionForm.text_uz} rows={3}
              onChange={e => setQuestionForm(p => ({ ...p, text_uz: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Savol matni (Rus) (ixtiyoriy)</Label>
            <Textarea placeholder="Вопрос на русском..." value={questionForm.text_ru} rows={2}
              onChange={e => setQuestionForm(p => ({ ...p, text_ru: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Vazn (ko'rsatkich ta'siri)</Label>
            <Select value={questionForm.weight} onValueChange={v => setQuestionForm(p => ({ ...p, weight: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2">+2 (Kuchli ijobiy)</SelectItem>
                <SelectItem value="1">+1 (Ijobiy)</SelectItem>
                <SelectItem value="-1">-1 (Salbiy)</SelectItem>
                <SelectItem value="-2">-2 (Kuchli salbiy)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("Bekor")}</Button>
          <Button onClick={() => createQuestionMutation.mutate(questionForm)}
            disabled={createQuestionMutation.isPending || !questionForm.text_uz}>
            {createQuestionMutation.isPending && <EPLoader className="w-4 h-4 mr-2" />}
            {editingQuestion ? "Yangilash" : "Qo'shish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── ResultDetailDialog ───────────────────────────────────────────────────────

interface ResultDetailDialogProps {
  session: HrcSession | null;
  onClose: () => void;
}

export function ResultDetailDialog({ session, onClose }: ResultDetailDialogProps) {
  const { t } = useTranslation("common");
  if (!session) return null;

  return (
    <Dialog open={!!session} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold"> {getTestTypeLabel(session.test_type)} natijalari — {session.candidate_name || session.employee_name}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-2">
          <div className="space-y-4">
            {/* Score header */}
            <div className="flex items-center gap-4">
              {session.score != null && (
                <div className={`text-4xl font-bold ${session.test_type === "tool_test" && session.score < 0 ? "text-[var(--ep-red)]" : "text-primary"}`}>
                  {session.test_type === "tool_test"
                    ? `${session.score > 0 ? "+" : ""}${session.score}`
                    : `${session.score}%`}
                </div>
              )}
              {session.syndrome && (
                <Badge className={`text-sm border ${SYNDROME_DESCRIPTIONS[session.syndrome]?.color ?? "bg-gray-100 text-gray-700"}`}>
                  {session.syndrome}
                </Badge>
              )}
              {session.iq_level && (
                <Badge className="text-sm bg-blue-100 text-[var(--ep-blue)] border-0">{session.iq_level}</Badge>
              )}
            </div>

            {/* TOOL TEST indicators */}
            {session.test_type === "tool_test" && session.indicators && (
              <>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={INDICATORS.map(ind => ({
                      name: ind.key, label: ind.label,
                      value: session.indicators?.[ind.key] ?? 0,
                    }))}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis angle={90} domain={[-100, 100]} tick={{ fontSize: 10 }} />
                      <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                      <RechartTooltip formatter={(v: number) => [`${v}%`, "Ball"]} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  {INDICATORS.map(ind => {
                    const val = session.indicators?.[ind.key] ?? 0;
                    return (
                      <div key={ind.key} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                              style={{ backgroundColor: ind.color }}>
                              {ind.key}
                            </span>
                            {ind.label}
                          </span>
                          <span className={`font-bold ${val >= 0 ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}`}>
                            {val > 0 ? "+" : ""}{val}
                          </span>
                        </div>
                        <ScoreBar value={val} color={val >= 0 ? "bg-green-500" : "bg-red-500"} />
                      </div>
                    );
                  })}
                </div>

                {session.syndrome && (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-4">
                      <div className="font-semibold text-orange-800 mb-1">
                        Aniqlangan sindrom: {session.syndrome}
                      </div>
                      <div className="text-sm text-[var(--ep-primary)]">
                        {SYNDROME_DESCRIPTIONS[session.syndrome]?.description ?? ""}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* IQ test */}
            {session.test_type === "iq" && (
              <div className="space-y-3">
                <div className="text-center">
                  <div className={`text-6xl font-bold ${getIQLevelInfo(session.score ?? 0)?.color}`}>
                    {session.score ?? 0}%
                  </div>
                  <div className={`text-xl font-semibold mt-2 ${getIQLevelInfo(session.score ?? 0)?.color}`}>
                    {session.iq_level}
                  </div>
                </div>
                <div className="mt-4 space-y-1">
                  {IQ_LEVELS.map(l => (
                    <div key={l.label} className={`flex items-center gap-2 text-sm p-2 rounded ${session.iq_level === l.label ? "bg-primary/10 font-bold" : ""}`}>
                      <div className={`w-2 h-2 rounded-full ${session.iq_level === l.label ? "bg-primary" : "bg-muted"}`} />
                      <span className={l.color}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Leadership test */}
            {session.test_type === "leadership" && (
              <div className="text-center space-y-2">
                <div className="text-6xl font-bold text-[var(--ep-primary)]">{session.score ?? 0}%</div>
                <p className="text-muted-foreground">
                  {(session.score ?? 0) >= 80 ? "Yaxshi liderlik qobiliyati"
                    : (session.score ?? 0) >= 60 ? "O'rta daraja" : "Rivojlanish kerak"}
                </p>
              </div>
            )}

            {/* Replication test */}
            {session.test_type === "replication" && (
              <div className="text-center space-y-2">
                <div className="text-6xl font-bold text-[var(--ep-green)]">{session.score ?? 0}%</div>
                <p className="text-muted-foreground">
                  {(session.score ?? 0) >= 90 ? "Juda aniq bajarildi"
                    : (session.score ?? 0) >= 70 ? "Qoniqarli" : "Aniqlik past"}
                </p>
                <p className="text-xs text-muted-foreground">{t("maqsad90100")}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
