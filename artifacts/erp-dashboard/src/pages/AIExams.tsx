/**
 * @module AIExams
 * @description React page component. Route-level UI.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle2, Clock, XCircle, Plus, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AssignAIExamDialog } from "@/components/AssignAIExamDialog";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EPErrorState, EPPageHeader, EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface AIExamAttempt {
  id: string;
  userId: string;
  employeeId: string;
  fullName: string;
  positionName: string;
  positionNameRu: string;
  score: number | null;
  status: string;
  startedAt: string;
  completedAt: string | null;
  analyzedAt: string | null;
}

interface AIExamDetail {
  attempt: {
    id: string;
    userId: string;
    positionId: string;
    questions: Array<{ id: string; question: string; category: string }>;
    answers: Record<number, string> | null;
    gptAnalysis: string | null;
    score: number | null;
    evaluation: Record<string, { comment: string; score: number; maxScore: number }> | null;
    status: string;
    startedAt: string;
    completedAt: string | null;
    analyzedAt: string | null;
  };
  user: {
    id: string;
    employeeId: string;
    fullName: string;
    lang: string;
  };
  position: {
    id: string;
    name: string;
    nameRu: string | null;
  };
}

export default function AIExams() {
  const { t } = useTranslation("common");
  const [selectedAttempt, setSelectedAttempt] = useState<string | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: attempts, isLoading, isError, error, refetch} = useQuery<AIExamAttempt[]>({
    queryKey: ["/api/ai-exam/attempts"],
  });

  const deleteAttemptMutation = useMutation({
    mutationFn: async (attemptId: string) => {
      const response = await apiRequest("DELETE", `/api/ai-exam/attempt/${attemptId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-exam/attempts"] });
      toast({ title: "AI imtixon o'chirildi" });
    },
    onError: () => {
      toast({ 
        title: "Xatolik", 
        description: "AI imtixonni o'chirishda xatolik yuz berdi",
        variant: "destructive" 
      });
    },
  });

  const { data: attemptDetail } = useQuery<AIExamDetail>({
    queryKey: ["/api/ai-exam/attempt", selectedAttempt],
    enabled: !!selectedAttempt,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "analyzed":
        return <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" /> {t("tahlilQilingan")}</Badge>;
      case "completed":
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> {t("completed")}</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> {t("inProgress")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-muted-foreground";
    if (score >= 90) return "text-[var(--ep-green)] dark:text-green-400";
    if (score >= 75) return "text-[var(--ep-blue)] dark:text-blue-400";
    if (score >= 50) return "text-[var(--ep-yellow)] dark:text-yellow-400";
    return "text-[var(--ep-red)] dark:text-red-400";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <EPLoader size={32} />
      </div>
    );
  }


  if (isError) {
    return <EPErrorState onRetry={refetch}  error={error} />;
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("aiImtixonlar")}</b></>}
        title={t("aiImtixonlar")}
        subtitle={t("barchaAiImtixonNatijalariVa")}
      />
        </div>
        <Button 
          onClick={() => setShowAssignDialog(true)} 
          data-testid="button-assign-ai-exam"
          className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold shadow-none"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("aiImtixonTayinlash")}
        </Button>
      </div>

      <div className="grid gap-4">
        {!attempts || attempts.length === 0 ? (
          <Card className="bg-card border-border shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <XCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p>{t("hozirchaAiImtixonTopshirilmagan")}</p>
            </CardContent>
          </Card>
        ) : (
          (Array.isArray(attempts) ? attempts : []).map((attempt) => (
            <Card key={attempt.id} className="bg-card border-border shadow-none hover:bg-muted/40 transition-colors" data-testid={`card-attempt-${attempt.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-[14px] font-semibold text-foreground">{attempt.fullName}</CardTitle>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>Tabel: {attempt.employeeId}</div>
                      <div>Lavozim: {attempt.positionName}</div>
                      <div>Boshlangan: {new Date(attempt.startedAt).toLocaleString("uz-UZ")}</div>
                      {attempt.completedAt && (
                        <div>Tugallangan: {new Date(attempt.completedAt).toLocaleString("uz-UZ")}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(attempt.status)}
                    {attempt.score !== null && (
                      <div className={`text-4xl font-bold tracking-tight ${getScoreColor(attempt.score)}`}>
                        {attempt.score}%
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAttempt(attempt.id)}
                    disabled={attempt.status === "in_progress"}
                    data-testid={`button-view-${attempt.id}`}
                    className="bg-muted/60 text-foreground hover:bg-muted border-none rounded-lg px-4 py-2 font-medium"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {t("batafsilKorish")}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmDeleteId(attempt.id)}
                    disabled={deleteAttemptMutation.isPending}
                    data-testid={`button-delete-${attempt.id}`}
                    className="bg-red-100 text-red-800 hover:bg-red-200 border-none shadow-none rounded-lg px-4 py-2 font-semibold"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("delete")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!selectedAttempt} onOpenChange={() => setSelectedAttempt(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-6">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("aiImtixonNatijalari")}</DialogTitle>
            <DialogDescription>
              {attemptDetail && (
                <div className="space-y-1 text-sm">
                  <div>{attemptDetail.user.fullName} - {attemptDetail.user.employeeId}</div>
                  <div>{attemptDetail.position.name}</div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {attemptDetail ? (
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Score and Status */}
                <div className="flex gap-4">
                  {attemptDetail.attempt.score !== null && (
                    <Card className="flex-1">
                      <CardHeader className="pb-3">
                        <CardDescription>{t("umumiyBall")}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-3xl font-bold ${getScoreColor(attemptDetail.attempt.score)}`}>
                          {attemptDetail.attempt.score}%
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  <Card className="flex-1">
                    <CardHeader className="pb-3">
                      <CardDescription>{t("status28")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {getStatusBadge(attemptDetail.attempt.status)}
                    </CardContent>
                  </Card>
                </div>

                {/* Categories Evaluation */}
                {attemptDetail.attempt.evaluation && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{t("kategoriyalarBoyichaBaholash")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(attemptDetail.attempt.evaluation as Record<string, { comment: string; score: number; maxScore: number }>).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                            <div className="flex-1">
                              <div className="font-medium capitalize">{key.replace(/_/g, ' ')}</div>
                              <div className="text-sm text-muted-foreground">{value.comment}</div>
                            </div>
                            <div className="text-lg font-semibold">
                              {value.score}/{value.maxScore}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* GPT Analysis */}
                {attemptDetail.attempt.gptAnalysis && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{t("batafsilTahlilGpt")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {attemptDetail.attempt.gptAnalysis}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Questions and Answers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t("savollarVaJavoblar")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(Array.isArray(attemptDetail.attempt.questions) ? attemptDetail.attempt.questions : []).map((q, index) => (
                        <div key={q.id} className="p-4 border border-border rounded-lg space-y-2">
                          <div className="flex items-start gap-2">
                            <Badge variant="outline" className="shrink-0">
                              {q.category === 'personality' ? '👤' : q.category === 'international' ? '🌍' : '💼'}
                            </Badge>
                            <div className="flex-1">
                              <div className="font-medium">Savol {index + 1}: {q.question}</div>
                              {attemptDetail.attempt.answers && attemptDetail.attempt.answers[index] && (
                                <div className="mt-2 p-3 bg-muted/50 rounded text-sm">
                                  <span className="font-medium">{t("javob1")}</span>
                                  {attemptDetail.attempt.answers[index]}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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

      <AssignAIExamDialog open={showAssignDialog} onOpenChange={setShowAssignDialog} />

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
        title={t("aiImtixonniOchirish")}
        description={t("ushbuAiImtixonUrinishiniOchirishni")}
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => { if (confirmDeleteId) deleteAttemptMutation.mutate(confirmDeleteId); }}
      />
    </div>
  );
}
