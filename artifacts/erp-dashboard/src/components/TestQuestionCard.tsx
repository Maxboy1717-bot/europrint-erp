/**
 * @module TestQuestionCard
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { useTranslation } from '@/lib/i18n';

export interface TestQuestion {
  id: string;
  question: string;
  type: "mcq" | "open" | "practice";
  difficulty: "easy" | "medium" | "hard";
  category: string;
  options?: string[];
}

interface TestQuestionCardProps {
  question: TestQuestion;
  onEdit?: () => void;
  onDelete?: () => void;
}

const typeLabels = {
  mcq: "Ko'p tanlov",
  open: "Ochiq savol",
  practice: "Amaliy",
};

const difficultyColors = {
  easy: "secondary",
  medium: "default",
  hard: "destructive",
} as const;

const difficultyLabels = {
  easy: "Oson",
  medium: "O'rta",
  hard: "Qiyin",
};

export function TestQuestionCard({ question, onEdit, onDelete }: TestQuestionCardProps) {
  const { t } = useTranslation("common");
  return (
    <Card data-testid={`card-question-${question.id}`}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{question.question}</CardTitle>
          <div className="flex gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onEdit}
              data-testid={`button-edit-question-${question.id}`}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={onDelete}
              data-testid={`button-delete-question-${question.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {typeLabels[question.type]}
          </Badge>
          <Badge variant={difficultyColors[question.difficulty]} className="text-xs">
            {difficultyLabels[question.difficulty]}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {question.category}
          </Badge>
        </div>
      </CardHeader>
      {question.options && question.options.length > 0 && (
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t("javobVariantlari")}</p>
            <ul className="space-y-1 text-sm">
              {(Array.isArray(question.options) ? question.options : []).map((option, index) => (
                <li key={`k-${index}`} className="flex items-start gap-2">
                  <span className="text-muted-foreground">{String.fromCharCode(65 + index)}.</span>
                  <span>{option}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
