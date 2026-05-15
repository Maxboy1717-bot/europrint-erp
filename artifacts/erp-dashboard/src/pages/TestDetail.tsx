/**
 * @module TestDetail
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, FileQuestion } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { AddQuestionDialog } from "@/components/AddQuestionDialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EPErrorState, EPPageHeader, EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
export default function TestDetail() {
  const { t } = useTranslation("common");
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [deleteTestDialog, setDeleteTestDialog] = useState(false);

  const { data: test, isLoading: testLoading, isError, refetch} = useQuery<{
    id: string;
    title: string;
    titleRu?: string;
    passPercentage: number;
    timeLimit: number | null;
    maxAttempts: number;
    courseId: string | null;
  }>({
    queryKey: ["/api/tests", id],
  });

  const { data: questions = [], isLoading: questionsLoading } = useQuery<Array<{
    id: string;
    testId: string;
    text: string;
    textRu?: string;
    type: string;
    difficulty: string;
    points: number;
    options?: string[];
    correctAnswer?: string;
    category?: string;
    question?: string;
  }>>({
    queryKey: ["/api/tests", id, "questions"],
  });

  const deleteTestMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/tests/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "O'chirildi",
        description: "Test muvaffaqiyatli o'chirildi",
      });
      navigate("/tests");
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Testni o'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      return await apiRequest("DELETE", `/api/questions/${questionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests", id, "questions"] });
      toast({ title: "Savol o'chirildi" });
    },
  });

  if (testLoading || questionsLoading) {
    return <div className="text-center py-12">{t("Yuklanmoqda...")}</div>;
  }

  if (!test) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">{t("testTopilmadi")}</p>
        <Button onClick={() => navigate("/tests")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("back")}
        </Button>
      </div>
    );
  }

  const getDifficultyBadge = (difficulty: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      easy: "secondary",
      medium: "default",
      hard: "destructive",
    };
    const labels: Record<string, string> = {
      easy: "Oson",
      medium: "O'rta",
      hard: "Qiyin",
    };
    return <Badge variant={variants[difficulty]}>{labels[difficulty]}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      mcq: "Ko'p tanlov",
      open: "Ochiq",
      practice: "Amaliy",
    };
    return <Badge variant="outline">{labels[type]}</Badge>;
  };

  if (isError) {
    return <EPErrorState onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/tests")} data-testid="button-back" className="hover:bg-muted text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <EPPageHeader
        breadcrumb={<>{t("dashboardLms")}<b className="text-foreground">{test.title}</b></>}
        title={test.title}
      />
            <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
              <Badge variant="outline" className="bg-muted/60 text-foreground border-none shadow-none">O'tish: {test.passPercentage}%</Badge>
              <span>•</span>
              <Badge variant="outline" className="bg-muted/60 text-foreground border-none shadow-none">{test.timeLimit ? `${test.timeLimit} daqiqa` : "Cheksiz vaqt"}</Badge>
              <span>•</span>
              <Badge variant="outline" className="bg-muted/60 text-foreground border-none shadow-none">{test.maxAttempts} urinish</Badge>
            </div>
          </div>
        </div>
        <Button
          variant="destructive"
          onClick={() => setDeleteTestDialog(true)}
          data-testid="button-delete-test"
          className="bg-red-100 text-red-800 hover:bg-red-200 border-none shadow-none rounded-lg px-4 py-2 font-semibold"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {t("testniOchirish")}
        </Button>
      </div>

      <Card className="bg-card border-border shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-foreground">{t("questions")}</CardTitle>
            <CardDescription className="text-muted-foreground">
              Jami {questions.length} ta savol
            </CardDescription>
          </div>
          <Button 
            onClick={() => setShowAddQuestion(true)} 
            data-testid="button-add-question"
            className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold shadow-none"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("savolQoshish")}
          </Button>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <div className="text-center py-12">
              <FileQuestion className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">{t("savollarMavjudEmas")}</h3>
              <p className="text-muted-foreground mb-4">
                {t("testgaBirinchiSavolniQoshing")}
              </p>
              <Button onClick={() => setShowAddQuestion(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t("savolQoshish")}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {(Array.isArray(questions) ? questions : []).map((question, index) => (
                <Card key={question.id} data-testid={`question-${question.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-sm">#{index + 1}</span>
                          {getTypeBadge(question.type)}
                          {getDifficultyBadge(question.difficulty)}
                          {question.category && (
                            <EPStatusPill tone="neutral" className="text-xs">
                              {question.category}
                            </EPStatusPill>
                          )}
                        </div>
                        <p className="text-base font-medium">{question.question}</p>
                      </div>
                      <DeleteConfirmDialog
                        title={t("savolniOchirishniTasdiqlaysizmi")}
                        description={t("savolButunlayOchiriladi")}
                        onConfirm={() => deleteQuestionMutation.mutate(question.id)}
                        isPending={deleteQuestionMutation.isPending}
                      />
                    </div>
                  </CardHeader>
                  {question.type === "mcq" && question.options && (
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {(question.options as string[]).map((option, optIndex) => (
                          <div
                            key={`k-${optIndex}`}
                            className={`flex items-start gap-2 p-2 rounded ${
                              question.correctAnswer === String(optIndex + 1)
                                ? "bg-green-500/10 border border-green-500/20"
                                : "bg-muted/30"
                            }`}
                          >
                            <span className="font-medium text-sm min-w-6">
                              {String.fromCharCode(65 + optIndex)}.
                            </span>
                            <span className="text-sm">{option}</span>
                            {question.correctAnswer === String(optIndex + 1) && (
                              <EPStatusPill tone="success" className="ml-auto text-xs">
                                {t("togri")}
                              </EPStatusPill>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddQuestionDialog
        open={showAddQuestion}
        onOpenChange={setShowAddQuestion}
        testId={id!}
      />

      <AlertDialog open={deleteTestDialog} onOpenChange={setDeleteTestDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("testniOchirish")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("haqiqatanHamBuTestniOchirmoqchimisiz")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTestMutation.mutate()}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
