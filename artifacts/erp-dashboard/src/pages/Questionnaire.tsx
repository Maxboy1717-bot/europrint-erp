/**
 * @module Questionnaire
 * @description React page component. Route-level UI — state, hooks, and orchestration only.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  QuestionnaireQuestion,
  QuestionnaireResponse,
  NewQuestion,
  DEFAULT_NEW_QUESTION,
} from "./QuestionnaireTypes";
import { QuestionsSection, ResponsesSection } from "./QuestionnaireSections";
import { AddQuestionDialog, ViewResponseDialog } from "./QuestionnaireDialogs";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function Questionnaire() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<QuestionnaireResponse | null>(null);
  const [newQuestion, setNewQuestion] = useState<NewQuestion>(DEFAULT_NEW_QUESTION);

  // ------------------------------------------------------------------
  // Queries
  // ------------------------------------------------------------------

  const {
    data: questions = [],
    isLoading: questionsLoading,
    isError,
    refetch,
  } = useQuery<QuestionnaireQuestion[]>({
    queryKey: ["/api/questionnaire/questions"],
  });

  const { data: responses = [], isLoading: responsesLoading } = useQuery<QuestionnaireResponse[]>({
    queryKey: ["/api/questionnaire/responses"],
  });

  // ------------------------------------------------------------------
  // Mutations
  // ------------------------------------------------------------------

  const createQuestionMutation = useMutation({
    mutationFn: async (data: NewQuestion) =>
      apiRequest("POST", "/api/questionnaire/questions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questionnaire/questions"] });
      setNewQuestion(DEFAULT_NEW_QUESTION);
      setIsDialogOpen(false);
      toast({ title: "Savol qo'shildi", description: "Yangi savol muvaffaqiyatli qo'shildi" });
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Savolni qo'shishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) =>
      apiRequest("DELETE", `/api/questionnaire/questions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questionnaire/questions"] });
      toast({ title: "Savol o'chirildi", description: "Savol muvaffaqiyatli o'chirildi" });
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Savolni o'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const updateResponseStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      apiRequest("PUT", `/api/questionnaire/responses/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questionnaire/responses"] });
      setSelectedResponse(null);
      toast({ title: "Holat yangilandi", description: "Ariza holati muvaffaqiyatli yangilandi" });
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Holatni yangilashda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const deleteResponseMutation = useMutation({
    mutationFn: async (id: string) =>
      apiRequest("DELETE", `/api/questionnaire/responses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questionnaire/responses"] });
      toast({ title: "Ariza o'chirildi" });
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Arizani o'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  // ------------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------------

  const handleCreateQuestion = () => {
    if (!newQuestion.question.trim() || !newQuestion.questionRu.trim()) {
      toast({
        title: "Xatolik",
        description: "Iltimos, barcha maydonlarni to'ldiring",
        variant: "destructive",
      });
      return;
    }
    createQuestionMutation.mutate(newQuestion);
  };

  const handleDownloadWord = async (responseId: string, fullName: string) => {
    try {
      const res = await apiRequest('GET', `/api/questionnaire/responses/${responseId}/export`);
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `anketa-${fullName.replace(/\s+/g, "-")}-${Date.now()}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: "Yuklab olindi", description: "Word fayl muvaffaqiyatli yuklab olindi" });
    } catch {
      toast({
        title: "Xatolik",
        description: "Faylni yuklab olishda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  if (isError) {
    return <EPErrorState onRetry={refetch} />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="ep-h1">{t("anketaBoshqaruvi")}</h1>
        <p className="text-muted-foreground">{t("yangiXodimlarUchunAnketaSavollarini")}</p>
      </div>

      <Tabs defaultValue="questions" className="space-y-4">
        <TabsList data-testid="tabs-list">
          <TabsTrigger value="questions" data-testid="tab-questions">{t("questions")}</TabsTrigger>
          <TabsTrigger value="responses" data-testid="tab-responses">
            Arizalar ({responses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions">
          <QuestionsSection
            questions={questions}
            isLoading={questionsLoading}
            onAddClick={() => setIsDialogOpen(true)}
            onDelete={(id) => deleteQuestionMutation.mutate(id)}
            isDeleting={deleteQuestionMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="responses">
          <ResponsesSection
            responses={responses}
            isLoading={responsesLoading}
            onView={setSelectedResponse}
            onDownload={handleDownloadWord}
            onDelete={(id) => deleteResponseMutation.mutate(id)}
            isDeleting={deleteResponseMutation.isPending}
          />
        </TabsContent>
      </Tabs>

      <AddQuestionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        newQuestion={newQuestion}
        onNewQuestionChange={setNewQuestion}
        onSave={handleCreateQuestion}
        isSaving={createQuestionMutation.isPending}
      />

      <ViewResponseDialog
        response={selectedResponse}
        onClose={() => setSelectedResponse(null)}
        onUpdateStatus={(id, status) => updateResponseStatusMutation.mutate({ id, status })}
        isUpdating={updateResponseStatusMutation.isPending}
      />
    </div>
  );
}
