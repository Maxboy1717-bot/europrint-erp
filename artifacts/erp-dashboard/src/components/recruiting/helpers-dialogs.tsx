/**
 * @module recruiting/helpers-dialogs
 * @description AIInterviewDialog and related dialog components. Split out of
 *   `helpers.tsx` so each file stays under 300 lines.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Bot, Star, MessageSquare, Copy, ExternalLink } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import type { PipelineEntry, AIInterviewSession } from "@/components/recruiting/types";

import { ScoreBar } from "./helpers-atoms";

export function AIInterviewDialog({
  entry,
  sessions,
}: {
  entry: PipelineEntry;
  sessions: AIInterviewSession[];
}) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [recruiterNotes, setRecruiterNotes] = useState("");
  const [recommendation, setRecommendation] = useState("");

  const entrySession = (Array.isArray(sessions) ? sessions : []).find(
    (s) =>
      s.pipeline_entry_id === entry.id ||
      (s.candidate_name && s.candidate_name === entry.candidate_name)
  );

  const createSessionMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ interview_link?: string }>("POST", "/api/hr-v2/ai-interview/sessions", {
        candidate_name: entry.candidate_name,
        candidate_language: "uz",
        pipeline_entry_id: entry.id,
        candidate_id: entry.candidate_id,
        vacancy_id: entry.vacancy_id,
      }),
    onSuccess: (data: { interview_link?: string }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/ai-interview/sessions"] });
      const link = data?.interview_link || "";
      if (link) {
        navigator.clipboard.writeText(link).catch((e) => {
          // eslint-disable-next-line no-console
          console.warn("Clipboard write failed:", e);
        });
        toast({ title: "Havola yaratildi", description: "Havola clipboard ga nusxalandi" });
      } else {
        toast({ title: "Sessiya yaratildi" });
      }
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const reviewMutation = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", `/api/hr/ai-interview/session/${entrySession?.id}/review`, {
        recruiter_notes: recruiterNotes,
        recommendation,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/ai-interview/sessions"] });
      toast({ title: "Izoh saqlandi" });
      setOpen(false);
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const statusColor: Record<string, string> = {
    pending: "bg-blue-500/15 text-blue-400 border-blue-500/40",
    started: "bg-amber-500/15 text-amber-400 border-amber-500/40",
    completed: "bg-green-500/15 text-green-400 border-green-500/40",
    expired: "bg-red-500/15 text-red-400 border-red-500/40",
  };
  const statusLabel: Record<string, string> = {
    pending: "Kutilmoqda",
    started: "Jarayonda",
    completed: "Yakunlandi",
    expired: "Muddati tugagan",
  };

  const baseUrl = window.location.origin;
  const interviewLink = entrySession ? `${baseUrl}/ai-interview/${entrySession.token}` : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1 border-indigo-500/30 text-indigo-400"
          data-testid={`button-ai-interview-${entry.id}`}
        >
          <Bot className="w-3 h-3" />
          {t("aiIntervyu")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-400" />
            AI Intervyu — {entry.candidate_name}
          </DialogTitle>
        </DialogHeader>
        {!entrySession ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              {t("nomzodUchunAiIntervyuSessiyasi")}
            </p>
            <Button
              onClick={() => createSessionMutation.mutate()}
              disabled={createSessionMutation.isPending}
              className="w-full gap-2"
              data-testid={`button-create-ai-session-${entry.id}`}
            >
              <Bot className="w-4 h-4" />
              {createSessionMutation.isPending ? "Yaratilmoqda..." : "AI Intervyu Havolasini Yaratish"}
            </Button>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            <div className="flex items-center justify-between gap-2">
              <Badge
                className={`${statusColor[entrySession.status] || "bg-muted text-muted-foreground"} border text-xs`}
              >
                {statusLabel[entrySession.status] || entrySession.status}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Muddati: {new Date(entrySession.expires_at).toLocaleString("uz")}
              </span>
            </div>
            {interviewLink && (
              <div className="bg-muted/40 rounded-lg p-3 space-y-2">
                <p className="text-xs text-muted-foreground">{t("intervyuHavolasi")}</p>
                <div className="flex gap-2">
                  <Input readOnly value={interviewLink} className="text-xs h-9 flex-1" />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2"
                    onClick={() => {
                      navigator.clipboard.writeText(interviewLink).catch((e) => {
                        // eslint-disable-next-line no-console
                        console.warn("Clipboard write failed:", e);
                      });
                      toast({ title: "Nusxalandi!" });
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2"
                    onClick={() => window.open(interviewLink, "_blank")}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
            {entrySession.status === "completed" && (
              <>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400" />
                    {t("aiBaholashNatijalari")}
                  </h4>
                  {entrySession.overall_score !== null && (
                    <div className="text-center py-2 bg-primary/10 rounded-lg">
                      <div className="text-3xl font-bold text-primary">
                        {Math.round(entrySession.overall_score!)}%
                      </div>
                      <div className="text-xs text-muted-foreground">{t("umumiyBall")}</div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <ScoreBar label={t("muloqot")} score={entrySession.communication_score} />
                    <ScoreBar label={t("ishonch")} score={entrySession.confidence_score} />
                    <ScoreBar label={t("muammoYechish")} score={entrySession.problem_solving_score} />
                    <ScoreBar label={t("tanaTili")} score={entrySession.body_language_score} />
                    <ScoreBar label={t("hissiyHolat")} score={entrySession.emotional_state_score} />
                    <ScoreBar
                      label={t("professionalizm")}
                      score={entrySession.professional_appearance_score}
                    />
                  </div>
                </div>
                {entrySession.ai_summary && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t("aiXulosasi")}</p>
                    <p className="text-sm bg-muted/30 rounded-lg p-3">{entrySession.ai_summary}</p>
                  </div>
                )}
                {entrySession.transcript && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" /> {t("transkriptsiyaKorish")}
                    </summary>
                    <pre className="mt-2 bg-muted/30 rounded-lg p-3 whitespace-pre-wrap text-[11px] max-h-40 overflow-y-auto">
                      {entrySession.transcript}
                    </pre>
                  </details>
                )}
                <div className="border-t pt-4 space-y-3">
                  <h4 className="text-sm font-semibold">{t("rekruterIzohi")}</h4>
                  {entrySession.recruiter_notes && (
                    <p className="text-xs bg-amber-500/10 rounded-lg p-2 text-amber-300">
                      {entrySession.recruiter_notes}
                    </p>
                  )}
                  <Textarea
                    placeholder={t("rekruterIzohiYozing")}
                    value={recruiterNotes || entrySession.recruiter_notes || ""}
                    onChange={(e) => setRecruiterNotes(e.target.value)}
                    className="text-sm min-h-[80px]"
                    data-testid={`textarea-recruiter-notes-${entry.id}`}
                  />
                  <Select
                    value={recommendation || entrySession.recommendation || ""}
                    onValueChange={setRecommendation}
                  >
                    <SelectTrigger
                      className="text-sm h-9"
                      data-testid={`select-recommendation-${entry.id}`}
                    >
                      <SelectValue placeholder={t("tavsiyaTanlang")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hire">{t("qabulQilishTavsiyaEtiladi")}</SelectItem>
                      <SelectItem value="maybe">{t("koribChiqishMumkin")}</SelectItem>
                      <SelectItem value="reject">{t("radEtishTavsiyaEtiladi")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        )}
        <DialogFooter>
          {entrySession?.status === "completed" && (
            <Button
              onClick={() => reviewMutation.mutate()}
              disabled={reviewMutation.isPending}
              data-testid={`button-save-review-${entry.id}`}
            >
              {reviewMutation.isPending ? "Saqlanmoqda..." : "Izohni Saqlash"}
            </Button>
          )}
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("close2")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
