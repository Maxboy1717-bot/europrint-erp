/**
 * @module QuestionnaireTemplatesHooks
 * @description Custom React hooks that encapsulate all TanStack Query mutations
 * and derived event-handler callbacks for the QuestionnaireTemplates page.
 * Keeping mutation logic here lets the orchestrator stay under 300 lines while
 * remaining the single source of truth for page-level state.
 */

import { useMutation } from "@tanstack/react-query";
import { UseFormReturn } from "react-hook-form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type {
  TemplateFormData,
  QuestionFormData,
  TemplateWithPosition,
} from "./QuestionnaireTemplatesTypes";
import { TEMPLATE_PRESETS } from "./QuestionnaireTemplatesTypes";
import type { QuestionnaireQuestion } from "@shared/schema";

import { tLabel } from '@/lib/i18n/tLabel';
// ---------------------------------------------------------------------------
// Constants (re-exported so orchestrator doesn't need its own copy)
// ---------------------------------------------------------------------------

export const TEMPLATES_QUERY_KEY = "/api/questionnaire-templates";
export const POSITIONS_QUERY_KEY = "/api/positions";
const QUESTIONS_API = "/api/questionnaire-questions";

// ---------------------------------------------------------------------------
// useTemplateMutations
// ---------------------------------------------------------------------------

interface UseTemplateMutationsOptions {
  setIsTemplateDialogOpen: (open: boolean) => void;
  setEditingTemplate: (t: TemplateWithPosition | null) => void;
  setIsPresetsDialogOpen: (open: boolean) => void;
  templateForm: UseFormReturn<TemplateFormData>;
  editingTemplate: TemplateWithPosition | null;
}

export function useTemplateMutations({
  setIsTemplateDialogOpen,
  setEditingTemplate,
  setIsPresetsDialogOpen,
  templateForm,
  editingTemplate,
}: UseTemplateMutationsOptions) {
  const { toast } = useToast();

  const createTemplate = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", TEMPLATES_QUERY_KEY, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY] });
      setIsTemplateDialogOpen(false);
      setEditingTemplate(null);
      toast({ title: "Shablon yaratildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const updateTemplate = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiRequest("PATCH", `${TEMPLATES_QUERY_KEY}/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY] });
      setIsTemplateDialogOpen(false);
      setEditingTemplate(null);
      toast({ title: "Shablon yangilandi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const deleteTemplate = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `${TEMPLATES_QUERY_KEY}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY] });
      toast({ title: tLabel('common.QuestionnaireTemplatesHooks.shablonOchirildi', "Shablon o'chirildi") });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const handleSubmitTemplate = (data: TemplateFormData) => {
    const submitData = {
      ...data,
      positionId: data.positionId === "none" ? null : data.positionId,
      isActive: true,
    };
    if (editingTemplate?.id) {
      updateTemplate.mutate({ id: editingTemplate.id, data: submitData });
    } else {
      createTemplate.mutate(submitData);
    }
  };

  const openTemplateDialog = (
    template: TemplateWithPosition | undefined,
    setIsOpen: (open: boolean) => void,
  ) => {
    if (template) {
      templateForm.reset({
        name: template.name || "",
        nameRu: template.nameRu || "",
        description: template.description || "",
        descriptionRu: template.descriptionRu || "",
        positionId: template.positionId || "none",
      });
      setEditingTemplate(template);
    } else {
      templateForm.reset({
        name: "",
        nameRu: "",
        description: "",
        descriptionRu: "",
        positionId: "none",
      });
      setEditingTemplate(null);
    }
    setIsOpen(true);
  };

  const handleUsePreset = async (presetKey: string) => {
    const preset = TEMPLATE_PRESETS[presetKey];
    const templateData = {
      name: preset.name,
      nameRu: preset.nameRu,
      description: preset.description,
      descriptionRu: preset.descriptionRu,
      positionId: null,
      isActive: true,
    };
    try {
      const response = (await apiRequest(
        "POST",
        TEMPLATES_QUERY_KEY,
        templateData,
      )) as { id: string };
      const templateId = response.id;
      for (const q of preset.questions) {
        await apiRequest("POST", QUESTIONS_API, {
          ...q,
          templateId,
          isActive: true,
        });
      }
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY] });
      setIsPresetsDialogOpen(false);
      toast({ title: tLabel('common.QuestionnaireTemplatesHooks.shablonYaratildiVaSavollarQoshildi', "Shablon yaratildi va savollar qo'shildi!") });
    } catch {
      toast({ title: "Xatolik", variant: "destructive" });
    }
  };

  return {
    deleteTemplate,
    handleSubmitTemplate,
    openTemplateDialog,
    handleUsePreset,
  };
}

// ---------------------------------------------------------------------------
// useQuestionMutations
// ---------------------------------------------------------------------------

interface UseQuestionMutationsOptions {
  selectedTemplate: string | null;
  questionsLength: number;
  setQuestionDialogOpen: (open: boolean) => void;
  setEditingQuestion: (q: QuestionnaireQuestion | null) => void;
  questionForm: UseFormReturn<QuestionFormData>;
  editingQuestion: QuestionnaireQuestion | null;
}

export function useQuestionMutations({
  selectedTemplate,
  questionsLength,
  setQuestionDialogOpen,
  setEditingQuestion,
  questionForm,
  editingQuestion,
}: UseQuestionMutationsOptions) {
  const { toast } = useToast();
  const questionsQueryKey = [TEMPLATES_QUERY_KEY, selectedTemplate, "questions"];

  const createQuestion = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", QUESTIONS_API, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionsQueryKey });
      setQuestionDialogOpen(false);
      setEditingQuestion(null);
      toast({ title: tLabel('common.QuestionnaireTemplatesHooks.savolQoshildi', "Savol qo'shildi") });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const updateQuestion = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiRequest("PATCH", `${QUESTIONS_API}/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionsQueryKey });
      setQuestionDialogOpen(false);
      setEditingQuestion(null);
      toast({ title: "Savol yangilandi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const deleteQuestion = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `${QUESTIONS_API}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionsQueryKey });
      toast({ title: tLabel('common.QuestionnaireTemplatesHooks.savolOchirildi', "Savol o'chirildi") });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const handleSubmitQuestion = (data: QuestionFormData) => {
    const submitData = { ...data, templateId: selectedTemplate, isActive: true };
    if (editingQuestion?.id) {
      updateQuestion.mutate({ id: editingQuestion.id, data: submitData });
    } else {
      createQuestion.mutate(submitData);
    }
  };

  const openQuestionDialog = (
    question: QuestionnaireQuestion | undefined,
    setIsOpen: (open: boolean) => void,
  ) => {
    if (question) {
      questionForm.reset({
        question: question.question || "",
        questionRu: question.questionRu || "",
        questionType: question.questionType || "text",
        order: question.order || questionsLength + 1,
        isRequired: question.isRequired ?? true,
      });
      setEditingQuestion(question);
    } else {
      questionForm.reset({
        question: "",
        questionRu: "",
        questionType: "text",
        order: questionsLength + 1,
        isRequired: true,
      });
      setEditingQuestion(null);
    }
    setIsOpen(true);
  };

  return {
    deleteQuestion,
    handleSubmitQuestion,
    openQuestionDialog,
  };
}
