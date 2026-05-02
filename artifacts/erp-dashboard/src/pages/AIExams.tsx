import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, CheckCircle2, Clock, XCircle, Plus, Trash2 } from "lucide-react";
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
import { ErrorState } from "@/components/ui/error-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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
  const [selectedAttempt, setSelectedAttempt] = useState<string | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: attempts, isLoading, isError, refetch} = useQuery<AIExamAttempt[]>({
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
        return <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Tahlil qilingan</Badge>;
      case "completed":
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Tugallangan</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Jarayonda</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-muted-foreground";
    if (score >= 90) return "text-green-600 dark:text-green-400";
    if (score >= 75) return "text-blue-600 dark:text-blue-400";
    if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }


  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface" data-testid="heading-ai-exams">
            AI <span className="font-bold text-primary">Imtixonlar</span>
          </h1>
          <p className="text-on-surface-variant mt-2">Barcha AI imtixon natijalari va tahlillar</p>
        </div>
        <Button 
          onClick={() => setShowAssignDialog(true)} 
          data-testid="button-assign-ai-exam"
          className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold shadow-none"
        >
          <Plus className="w-4 h-4 mr-2" />
          AI Imtixon Tayinlash
        </Button>
      </div>

      <div className="grid gap-4">
        {!attempts || attempts.length === 0 ? (
          <Card className="bg-surface-container-lowest border-outline-variant shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
              <XCircle className="h-12 w-12 text-on-surface-variant/30 mb-4" />
              <p>Hozircha AI imtixon topshirilmagan</p>
            </CardContent>
          </Card>
        ) : (
          (Array.isArray(attempts) ? attempts : []).map((attempt) => (
            <Card key={attempt.id} className="bg-surface-container-lowest border-outline-variant shadow-none hover:bg-surface-container-low transition-colors" data-testid={`card-attempt-${attempt.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg text-on-surface">{attempt.fullName}</CardTitle>
                    <div className="space-y-1 text-sm text-on-surface-variant">
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
                    className="bg-surface-container text-on-surface hover:bg-surface-container-high border-none rounded-lg px-4 py-2 font-medium"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Batafsil ko'rish
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
                    O'chirish
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!selectedAttempt} onOpenChange={() => setSelectedAttempt(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>AI Imtixon Natijalari</DialogTitle>
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
                        <CardDescription>Umumiy ball</CardDescription>
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
                      <CardDescription>Holat</CardDescription>
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
                      <CardTitle className="text-base">Kategoriyalar bo'yicha baholash</CardTitle>
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
                      <CardTitle className="text-base">Batafsil tahlil (GPT)</CardTitle>
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
                    <CardTitle className="text-base">Savollar va Javoblar</CardTitle>
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
                                  <span className="font-medium">Javob: </span>
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
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AssignAIExamDialog open={showAssignDialog} onOpenChange={setShowAssignDialog} />

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
        title="AI imtixonni o'chirish"
        description="Ushbu AI imtixon urinishini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => { if (confirmDeleteId) deleteAttemptMutation.mutate(confirmDeleteId); }}
      />
    </div>
  );
}
