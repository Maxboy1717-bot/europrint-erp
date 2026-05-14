import { Controller, UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ModulePage } from "@/components/ui/module-page";
import { Mic, X, CheckCircle, MessageSquare, Star, Volume2, Video, BookOpen, Trash2 } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { AIInterview, InterviewQuestion2, InterviewFormData, getStatusBadge, getProviderBadge, formatDuration } from "./AIInterviewPageTypes";

import { useTranslation } from '@/lib/i18n';
import { EPStatusPill } from "@/components/ep";
// ── InterviewDetailView ───────────────────────────────────────────────────────

interface InterviewDetailViewProps { interview: AIInterview; onClose: () => void; }

export function InterviewDetailView({interview, onClose }: InterviewDetailViewProps) {
  const { t } = useTranslation('common');
  return (
    <ModulePage module="ai" title={t("aiIntervyu")} subtitle={t("suniyIntellektYordamidaAvtomatikIntervyu")} icon={<Mic className="h-5 w-5" />}
      actions={<Button variant="outline" data-testid="button-close-detail" onClick={onClose}><X className="h-4 w-4 mr-2" />{t("close2")}</Button>}
    >
      <Card data-testid="card-interview-detail">
        <CardHeader>
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <CardTitle className="text-[14px] font-semibold">Intervyu: {interview.sessionId?.slice(0, 12)}...</CardTitle>
            {getStatusBadge(interview.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><p className="text-sm text-muted-foreground">{t("nomzodId")}</p><p className="font-medium" data-testid="text-detail-candidate">{interview.candidateId}</p></div>
            {interview.candidateName && <div className="space-y-2"><p className="text-sm text-muted-foreground">{t("nomzodIsmi")}</p><p className="font-medium">{interview.candidateName}</p></div>}
            {interview.jobTitle && <div className="space-y-2"><p className="text-sm text-muted-foreground">{t("lavozim1")}</p><p className="font-medium">{interview.jobTitle}</p></div>}
            <div className="space-y-2"><p className="text-sm text-muted-foreground">{t("language")}</p><p className="font-medium">{interview.language === "uz" ? "O'zbek" : "Rus"}</p></div>
            {interview.provider && <div className="space-y-2"><p className="text-sm text-muted-foreground">{t("provider")}</p><div>{getProviderBadge(interview.provider)}</div></div>}
            {interview.scheduledAt && <div className="space-y-2"><p className="text-sm text-muted-foreground">{t("rejalashtirilgan")}</p><p className="font-medium">{formatDateTime(interview.scheduledAt)}</p></div>}
            {interview.startedAt && <div className="space-y-2"><p className="text-sm text-muted-foreground">{t("boshlangan")}</p><p className="font-medium">{formatDateTime(interview.startedAt)}</p></div>}
            {interview.completedAt && <div className="space-y-2"><p className="text-sm text-muted-foreground">{t("completed")}</p><p className="font-medium">{formatDateTime(interview.completedAt)}</p></div>}
            {interview.duration && <div className="space-y-2"><p className="text-sm text-muted-foreground">{t("davomiyligi")}</p><p className="font-medium">{formatDuration(interview.duration)}</p></div>}
          </div>
          {(interview.audioUrl || interview.videoUrl) && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2"><Volume2 className="h-4 w-4" />{t('media')}</h3>
              <div className="flex gap-3 flex-wrap">
                {interview.audioUrl && <a href={interview.audioUrl} target="_blank" rel="noopener noreferrer"><Button variant="outline" data-testid="button-audio-link"><Volume2 className="h-4 w-4 mr-2" />{t('audio')}</Button></a>}
                {interview.videoUrl && <a href={interview.videoUrl} target="_blank" rel="noopener noreferrer"><Button variant="outline" data-testid="button-video-link"><Video className="h-4 w-4 mr-2" />{t('video')}</Button></a>}
              </div>
            </div>
          )}
          {interview.transcript && interview.transcript.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2"><MessageSquare className="h-4 w-4" />{t("transkript")}</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(Array.isArray(interview.transcript) ? interview.transcript : []).map((msg, idx) => (
                  <div key={idx} data-testid={`transcript-message-${idx}`} className={`p-3 rounded-lg ${msg.speaker === "ai" ? "bg-muted/50 ml-0 mr-8" : "bg-primary/5 ml-8 mr-0"}`}>
                    <p className="text-xs font-medium text-muted-foreground mb-1">{msg.speaker === "ai" ? "AI" : "Nomzod"}{msg.timestamp && ` - ${msg.timestamp}`}</p>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {interview.evaluation && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2"><Star className="h-4 w-4" />{t("baholash")}</h3>
              <Card>
                <CardContent className="p-4 space-y-4">
                  {interview.evaluation.overallScore !== undefined && (
                    <div className="flex items-center gap-3"><span className="text-sm text-muted-foreground">{t("umumiyBall1")}</span><Badge data-testid="badge-overall-score">{interview.evaluation.overallScore}/100</Badge></div>
                  )}
                  {interview.evaluation.strengths && interview.evaluation.strengths.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 text-[var(--ep-green)] dark:text-green-400">{t("kuchliTomonlar2")}</p>
                      <ul className="list-disc pl-5 space-y-1">{(Array.isArray(interview.evaluation.strengths) ? interview.evaluation.strengths : []).map((s, i) => <li key={`k-${i}`} className="text-sm" data-testid={`text-strength-${i}`}>{s}</li>)}</ul>
                    </div>
                  )}
                  {interview.evaluation.weaknesses && interview.evaluation.weaknesses.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 text-[var(--ep-red)] dark:text-red-400">{t("zaifTomonlar1")}</p>
                      <ul className="list-disc pl-5 space-y-1">{(Array.isArray(interview.evaluation.weaknesses) ? interview.evaluation.weaknesses : []).map((w, i) => <li key={`k-${i}`} className="text-sm" data-testid={`text-weakness-${i}`}>{w}</li>)}</ul>
                    </div>
                  )}
                  {interview.evaluation.recommendation && (
                    <div><p className="text-sm font-medium mb-1">{t("tavsiya1")}</p><p className="text-sm text-muted-foreground" data-testid="text-recommendation">{interview.evaluation.recommendation}</p></div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          {interview.questions && interview.questions.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2"><CheckCircle className="h-4 w-4" />Savollar ({interview.questions.length})</h3>
              <div className="space-y-3">
                {(Array.isArray(interview.questions) ? interview.questions : []).map((q, idx) => (
                  <Card key={idx} data-testid={`card-question-${idx}`}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{idx + 1}. {q.question}</p>
                        {q.score !== undefined && q.maxScore !== undefined && <Badge variant="outline" data-testid={`badge-question-score-${idx}`}>{q.score}/{q.maxScore}</Badge>}
                      </div>
                      {q.answer && <p className="text-sm text-muted-foreground">{q.answer}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </ModulePage>
  );
}

// ── AddQuestionForm ───────────────────────────────────────────────────────────

interface QFormState { question: string; question_ru: string; question_en: string; category: string; difficulty: string; max_score: string; job_title: string; }
interface AddQuestionFormProps { qForm: QFormState; setQForm: (f: QFormState) => void; onSubmit: (e: React.FormEvent) => void; isPending: boolean; onCancel: () => void; }

export function AddQuestionForm({ qForm, setQForm, onSubmit, isPending, onCancel }: AddQuestionFormProps) {
  return (
    <Card data-testid="card-add-question">
      <CardHeader><CardTitle className="text-base">{t("yangiSavolQoshish")}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
          <Label>Savol (O'zbek)</Label>
            <Textarea value={qForm.question} onChange={(e) => setQForm({ ...qForm, question: e.target.value })} placeholder="Savol matnini kiriting (O'zbek tilida)" required data-testid="input-question-uz" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
          <Label>Savol (Rus) — ixtiyoriy</Label>
              <Textarea value={qForm.question_ru} onChange={(e) => setQForm({ ...qForm, question_ru: e.target.value })} placeholder="Вопрос на русском языке" data-testid="input-question-ru" />
            </div>
            <div className="space-y-1">
          <Label>Savol (Ingliz) — ixtiyoriy</Label>
              <Textarea value={qForm.question_en} onChange={(e) => setQForm({ ...qForm, question_en: e.target.value })} placeholder={"Inglizcha savol"} data-testid="input-question-en" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
          <Label>Lavozim (ixtiyoriy)</Label>
              <Input value={qForm.job_title} onChange={(e) => setQForm({ ...qForm, job_title: e.target.value })} placeholder={t("hammagaMos")} />
            </div>
            <div className="space-y-1">
          <Label>{t("category")}</Label>
              <Select value={qForm.category} onValueChange={(v) => setQForm({ ...qForm, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">{t("umumiy")}</SelectItem>
                  <SelectItem value="technical">{t("texnik")}</SelectItem>
                  <SelectItem value="motivation">{t("motivatsiya")}</SelectItem>
                  <SelectItem value="teamwork">{t("Jamoa")}</SelectItem>
                  <SelectItem value="problem_solving">{t("muammoHal")}</SelectItem>
                  <SelectItem value="personal">{t("shaxsiy")}</SelectItem>
                  <SelectItem value="salary">{t("maosh")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
          <Label>{t("qiyinlik")}</Label>
              <Select value={qForm.difficulty} onValueChange={(v) => setQForm({ ...qForm, difficulty: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">{t("oson")}</SelectItem>
                  <SelectItem value="medium">{t("average")}</SelectItem>
                  <SelectItem value="hard">{t("qiyin")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
          <Label>{t("maksBall")}</Label>
              <Input type="number" min="1" max="10" value={qForm.max_score} onChange={(e) => setQForm({ ...qForm, max_score: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending} data-testid="button-save-question">{isPending ? "Saqlanmoqda..." : "Saqlash"}</Button>
            <Button type="button" variant="outline" onClick={onCancel}>{t("Bekor")}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ── QuestionBankList ──────────────────────────────────────────────────────────

interface QuestionBankListProps { questions: InterviewQuestion2[]; onDeleteClick: (id: number) => void; }

export function QuestionBankList({ questions, onDeleteClick }: QuestionBankListProps) {
  if (questions.length === 0) {
    return (
      <div className="text-center py-12 text-[13px] text-muted-foreground">
        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p>{t("savolBankiBosh")}</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {questions.map((q) => (
        <Card key={q.id} data-testid={`card-question-bank-${q.id}`}>
          <CardContent className="p-4 flex items-start justify-between gap-3">
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">{q.question || q.question_uz}</p>
              {q.question_ru && <p className="text-xs text-muted-foreground">{q.question_ru}</p>}
              <div className="flex gap-2 flex-wrap mt-1">
                {q.category && <Badge variant="outline" className="text-xs">{q.category}</Badge>}
                {q.difficulty && <Badge variant="outline" className="text-xs">{q.difficulty}</Badge>}
                {q.job_title && <EPStatusPill tone="neutral" className="text-xs">{q.job_title}</EPStatusPill>}
                <Badge variant="outline" className="text-xs">{q.max_score || 10} ball</Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive shrink-0" data-testid={`button-delete-question-${q.id}`} onClick={() => onDeleteClick(q.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── CreateInterviewForm ───────────────────────────────────────────────────────

interface CreateInterviewFormProps { form: UseFormReturn<InterviewFormData>; onSubmit: (values: InterviewFormData) => void; isPending: boolean; onCancel: () => void; }

export function CreateInterviewForm({ form, onSubmit, isPending, onCancel }: CreateInterviewFormProps) {
  return (
    <Card className="mb-6" data-testid="card-create-form">
      <CardHeader><CardTitle className="text-[14px] font-semibold">{t("yangiIntervyuYaratish")}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label htmlFor="candidateId">{t("nomzodId")}</Label>
              <Input id="candidateId" {...form.register("candidateId")} placeholder={t("nomzodIdKiriting")} data-testid="input-candidate-id" />
              {form.formState.errors.candidateId && <p className="text-sm text-destructive">{form.formState.errors.candidateId.message}</p>}
            </div>
            <div className="space-y-1">
          <Label htmlFor="jobTitle">{t("lavozim1")}</Label>
              <Input id="jobTitle" {...form.register("jobTitle")} placeholder={t("lavozimNominiKiriting")} data-testid="input-job-title" />
              {form.formState.errors.jobTitle && <p className="text-sm text-destructive">{form.formState.errors.jobTitle.message}</p>}
            </div>
            <div className="space-y-1">
          <Label htmlFor="language">{t("language")}</Label>
              <Controller control={form.control} name="language" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger data-testid="select-language" className="h-9"><SelectValue placeholder={t("tilniTanlang")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uz">{t("ozbekTili")}</SelectItem>
                    <SelectItem value="ru">{t("rusTili")}</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-1">
          <Label htmlFor="scheduledAt">{t("sanaVaVaqt")}</Label>
              <Input id="scheduledAt" type="datetime-local" {...form.register("scheduledAt")} data-testid="input-scheduled-at" />
              {form.formState.errors.scheduledAt && <p className="text-sm text-destructive">{form.formState.errors.scheduledAt.message}</p>}
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button type="submit" disabled={isPending} data-testid="button-submit-interview">{isPending ? "Yaratilmoqda..." : "Yaratish"}</Button>
            <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-create">{t("cancel")}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
