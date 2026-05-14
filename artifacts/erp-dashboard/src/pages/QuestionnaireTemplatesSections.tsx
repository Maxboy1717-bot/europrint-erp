/**
 * @module QuestionnaireTemplatesSections
 * @description Section and list components for the QuestionnaireTemplates page.
 * Contains `TemplatesGrid` (skeleton loader + template cards) and
 * `QuestionsSection` (per-template questions list). Both components are
 * presentational and receive all data and callbacks from the orchestrator.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2 } from "lucide-react";
import type { TemplateWithPosition } from "./QuestionnaireTemplatesTypes";
import type { QuestionnaireQuestion } from "@shared/schema";
import { EPStatusPill } from "@/components/ep";

// ---------------------------------------------------------------------------
// TemplatesGrid
// ---------------------------------------------------------------------------

interface TemplatesGridProps {
  templates: TemplateWithPosition[];
  isLoading: boolean;
  onSelect: (id: string) => void;
  onEdit: (template: TemplateWithPosition) => void;
  onDelete: (id: number) => void;
}

export function TemplatesGrid({
  templates,
  isLoading,
  onSelect,
  onEdit,
  onDelete,
}: TemplatesGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={`skeleton-${i}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32 rounded-lg" />
                  <Skeleton className="h-4 w-48 rounded-lg" />
                  <Skeleton className="h-5 w-20 rounded-lg" />
                </div>
                <div className="flex gap-1">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {(Array.isArray(templates) ? templates : []).map((template: TemplateWithPosition) => (
        <Card
          key={template.id}
          className="cursor-pointer hover-elevate"
          onClick={() => onSelect(template.id)}
          data-testid={`template-card-${template.id}`}
        >
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-base">{template.name}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">{template.description}</CardDescription>
                {template.positionName && (
                  <Badge variant="outline" className="mt-2">{template.positionName}</Badge>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(template);
                  }}
                  data-testid={`button-edit-${template.id}`}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(template.id);
                  }}
                  data-testid={`button-delete-${template.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// QuestionsSection
// ---------------------------------------------------------------------------

interface QuestionsSectionProps {
  questions: QuestionnaireQuestion[];
  onEditQuestion: (question: QuestionnaireQuestion) => void;
  onDeleteQuestion: (id: number) => void;
}

export function QuestionsSection({
  questions,
  onEditQuestion,
  onDeleteQuestion,
}: QuestionsSectionProps) {
  return (
    <CardContent>
      <div className="space-y-2">
        {questions.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            Savollar yo'q. Yuqoridagi tugmani bosib qo'shing.
          </div>
        )}
        {(Array.isArray(questions) ? questions : []).map((q: QuestionnaireQuestion, index: number) => (
          <div
            key={q.id}
            className="flex items-center justify-between p-4 border rounded-lg"
            data-testid={`question-${q.id}`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{index + 1}</Badge>
                <span className="font-medium">{q.question}</span>
                {q.isRequired && <EPStatusPill tone="neutral">Majburiy</EPStatusPill>}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{q.questionRu}</p>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEditQuestion(q)}
                data-testid={`button-edit-question-${q.id}`}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDeleteQuestion(q.id)}
                data-testid={`button-delete-question-${q.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  );
}
