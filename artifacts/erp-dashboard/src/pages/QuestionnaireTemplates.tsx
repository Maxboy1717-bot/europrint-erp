/**
 * @module QuestionnaireTemplates
 * @description Route-level orchestrator for the Questionnaire Templates page.
 * Owns all React state and TanStack Query fetch hooks. Delegates mutation logic
 * to the custom hooks in QuestionnaireTemplatesHooks, and rendering to:
 *   - QuestionnaireTemplatesTypes    — types, schemas, presets
 *   - QuestionnaireTemplatesDialogs  — PresetsDialog, TemplateDialog, QuestionDialog
 *   - QuestionnaireTemplatesSections — TemplatesGrid, QuestionsSection
 *   - QuestionnaireTemplatesHooks    — useTemplateMutations, useQuestionMutations
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { QuestionnaireQuestion } from "@shared/schema";

import {
  templateSchema,
  questionSchema,
  type TemplateFormData,
  type QuestionFormData,
  type TemplateWithPosition,
  type Position,
} from "./QuestionnaireTemplatesTypes";
import { PresetsDialog, TemplateDialog, QuestionDialog } from "./QuestionnaireTemplatesDialogs";
import { TemplatesGrid, QuestionsSection } from "./QuestionnaireTemplatesSections";
import {
  TEMPLATES_QUERY_KEY,
  POSITIONS_QUERY_KEY,
  useTemplateMutations,
  useQuestionMutations,
} from "./QuestionnaireTemplatesHooks";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function QuestionnaireTemplates() {
  const { t } = useTranslation("common");
  // --- Dialog visibility ---
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isPresetsDialogOpen, setIsPresetsDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);

  // --- Editing state ---
  const [editingTemplate, setEditingTemplate] = useState<TemplateWithPosition | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<QuestionnaireQuestion | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // --- Delete confirmation state ---
  const [confirmDeleteTemplateId, setConfirmDeleteTemplateId] = useState<number | null>(null);
  const [confirmDeleteQuestionId, setConfirmDeleteQuestionId] = useState<number | null>(null);

  // ---------------------------------------------------------------------------
  // Forms
  // ---------------------------------------------------------------------------

  const templateForm = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: { name: "", nameRu: "", description: "", descriptionRu: "", positionId: "none" },
  });

  const questionForm = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: { question: "", questionRu: "", questionType: "text", order: 1, isRequired: true },
  });

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  const {
    data: templates = [],
    isLoading: templatesLoading,
    isError, error,
    refetch,
  } = useQuery<TemplateWithPosition[]>({ queryKey: [TEMPLATES_QUERY_KEY] });

  const { data: positions = [] } = useQuery<Position[]>({ queryKey: [POSITIONS_QUERY_KEY] });

  const { data: questions = [] } = useQuery<QuestionnaireQuestion[]>({
    queryKey: [TEMPLATES_QUERY_KEY, selectedTemplate, "questions"],
    enabled: !!selectedTemplate,
  });

  // ---------------------------------------------------------------------------
  // Mutation hooks
  // ---------------------------------------------------------------------------

  const { deleteTemplate, handleSubmitTemplate, openTemplateDialog, handleUsePreset } =
    useTemplateMutations({
      setIsTemplateDialogOpen,
      setEditingTemplate,
      setIsPresetsDialogOpen,
      templateForm,
      editingTemplate,
    });

  const { deleteQuestion, handleSubmitQuestion, openQuestionDialog } = useQuestionMutations({
    selectedTemplate,
    questionsLength: questions.length,
    setQuestionDialogOpen,
    setEditingQuestion,
    questionForm,
    editingQuestion,
  });

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (isError) {
    return <EPErrorState onRetry={refetch}  error={error} />;
  }

  const safeTemplates = Array.isArray(templates) ? templates : [];
  const selectedTemplateName = safeTemplates.find(
    (t: TemplateWithPosition) => t.id === selectedTemplate,
  )?.name;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Templates card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{t("anketaShablonlari")}</CardTitle>
              <CardDescription>{t("lavozimlarUchunAnketaShablonlariniYarating")}</CardDescription>
            </div>
            <div className="flex gap-2">
              <PresetsDialog
                open={isPresetsDialogOpen}
                onOpenChange={setIsPresetsDialogOpen}
                onUsePreset={handleUsePreset}
              />
              <TemplateDialog
                open={isTemplateDialogOpen}
                onOpenChange={setIsTemplateDialogOpen}
                editingTemplate={editingTemplate}
                form={templateForm}
                positions={Array.isArray(positions) ? positions : []}
                onOpenNew={() => openTemplateDialog(undefined, setIsTemplateDialogOpen)}
                onSubmit={handleSubmitTemplate}
              />
            </div>
          </div>
        </CardHeader>
        <TemplatesGrid
          templates={safeTemplates}
          isLoading={templatesLoading}
          onSelect={setSelectedTemplate}
          onEdit={(t) => openTemplateDialog(t, setIsTemplateDialogOpen)}
          onDelete={setConfirmDeleteTemplateId}
        />
      </Card>

      {/* Questions card — only shown when a template is selected */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{t("questions")}</CardTitle>
                <CardDescription>{selectedTemplateName}</CardDescription>
              </div>
              <QuestionDialog
                open={questionDialogOpen}
                onOpenChange={setQuestionDialogOpen}
                editingQuestion={editingQuestion}
                form={questionForm}
                onOpenNew={() => openQuestionDialog(undefined, setQuestionDialogOpen)}
                onSubmit={handleSubmitQuestion}
              />
            </div>
          </CardHeader>
          <QuestionsSection
            questions={Array.isArray(questions) ? questions : []}
            onEditQuestion={(q) => openQuestionDialog(q, setQuestionDialogOpen)}
            onDeleteQuestion={setConfirmDeleteQuestionId}
          />
        </Card>
      )}

      {/* Delete confirmations */}
      <ConfirmDialog
        open={confirmDeleteTemplateId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteTemplateId(null); }}
        title={t("shablonniOchirish")}
        description={t("ushbuSorovnomaShabloniniOchirishniTasdiqlaysizmi")}
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => {
          if (confirmDeleteTemplateId !== null) {
            deleteTemplate.mutate(String(confirmDeleteTemplateId));
            setConfirmDeleteTemplateId(null);
          }
        }}
      />
      <ConfirmDialog
        open={confirmDeleteQuestionId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteQuestionId(null); }}
        title={t("savolniOchirish")}
        description={t("ushbuSorovnomaSavoliniOchirishniTasdiqlaysizmi")}
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => {
          if (confirmDeleteQuestionId !== null) {
            deleteQuestion.mutate(String(confirmDeleteQuestionId));
            setConfirmDeleteQuestionId(null);
          }
        }}
      />
    </div>
  );
}
