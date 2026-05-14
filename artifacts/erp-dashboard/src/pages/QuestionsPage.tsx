/**
 * @module QuestionsPage
 * @description Route-level orchestration: state, queries, and mutations.
 * UI is delegated to QuestionsPageSections and QuestionsPageDialogs.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ModulePage } from "@/components/ui/module-page";
import { Button } from "@/components/ui/button";
import { HelpCircle, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DEFAULT_FORM,
  QUERY_KEY,
  type Question,
  type QuestionFormState,
} from "./QuestionsPageTypes";
import {
  QuestionEmptyState,
  QuestionFilterBar,
  QuestionList,
  QuestionListSkeleton,
} from "./QuestionsPageSections";
import { CreateQuestionDialog, DeleteQuestionAlert } from "./QuestionsPageDialogs";
import { EPErrorState } from "@/components/ep";

export default function QuestionsPage() {
  const { toast } = useToast();

  // ── State ───────────────────────────────────────────────────────────────────
  const [testId, setTestId]         = useState("");
  const [searched, setSearched]     = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId]     = useState<string | number | null>(null);
  const [form, setForm]             = useState<QuestionFormState>(DEFAULT_FORM);

  // ── Query ───────────────────────────────────────────────────────────────────
  const { data: rawData, isLoading, isError, refetch } = useQuery<
    Question[] | { data?: Question[] }
  >({
    queryKey: [...QUERY_KEY, searched],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searched) params.set("testId", searched);
      const res = await apiRequest("GET", `/api/questions?${params}`);
      return res.json();
    },
  });

  const questions: Question[] = Array.isArray(rawData)
    ? rawData
    : (rawData as { data?: Question[] })?.data ?? [];

  // ── Mutations ───────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (dto: QuestionFormState) => {
      const res = await apiRequest("POST", "/api/questions", {
        ...dto,
        points: dto.points ? parseInt(dto.points) : 1,
        testId: dto.test_id || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({ title: "Savol yaratildi" });
      setShowCreate(false);
      setForm(DEFAULT_FORM);
    },
    onError: () =>
      toast({ title: "Xatolik", description: "Yaratishda muammo", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const res = await apiRequest("DELETE", `/api/questions/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({ title: "Savol o'chirildi" });
      setDeleteId(null);
    },
    onError: () =>
      toast({ title: "Xatolik", description: "O'chirishda muammo", variant: "destructive" }),
  });

  // ── Render ──────────────────────────────────────────────────────────────────
  if (isError) return <EPErrorState onRetry={refetch} />;

  return (
    <ModulePage
      module="hr"
      title="Test Savollari"
      icon={<HelpCircle className="h-5 w-5" />}
      actions={
        <Button onClick={() => setShowCreate(true)} data-testid="button-create-question">
          <Plus className="h-4 w-4 mr-2" />
          Savol qo'shish
        </Button>
      }
    >
      <div className="space-y-4">
        <QuestionFilterBar
          testId={testId}
          searched={searched}
          onTestIdChange={setTestId}
          onSearch={() => setSearched(testId)}
          onClear={() => { setSearched(""); setTestId(""); }}
        />

        {isLoading ? (
          <QuestionListSkeleton />
        ) : questions.length === 0 ? (
          <QuestionEmptyState />
        ) : (
          <QuestionList questions={questions} onDelete={id => setDeleteId(id)} />
        )}
      </div>

      <CreateQuestionDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        form={form}
        onFormChange={setForm}
        onSubmit={() => { if (form.question_text.trim()) createMutation.mutate(form); }}
        isSubmitPending={createMutation.isPending}
      />

      <DeleteQuestionAlert
        deleteId={deleteId}
        onOpenChange={open => !open && setDeleteId(null)}
        onConfirm={() => { if (deleteId !== null) deleteMutation.mutate(deleteId); }}
      />
    </ModulePage>
  );
}
