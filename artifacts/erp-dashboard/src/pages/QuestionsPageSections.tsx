/**
 * @module QuestionsPageSections
 * @description Question list, filter bar, and loading/empty states for QuestionsPage.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { HelpCircle, Trash2 } from "lucide-react";
import { DIFFICULTY_MAP, TYPE_LABELS, type Question } from "./QuestionsPageTypes";

// ─── Filter bar ──────────────────────────────────────────────────────────────

interface FilterBarProps {
  testId: string;
  searched: string;
  onTestIdChange: (v: string) => void;
  onSearch: () => void;
  onClear: () => void;
}

export function QuestionFilterBar({
  testId,
  searched,
  onTestIdChange,
  onSearch,
  onClear,
}: FilterBarProps) {
  return (
    <div className="flex gap-2 max-w-sm">
      <Input
        placeholder="Test ID bo'yicha filter..."
        value={testId}
        onChange={e => onTestIdChange(e.target.value)}
        onKeyDown={e => e.key === "Enter" && onSearch()}
        data-testid="input-test-id"
      />
      <Button onClick={onSearch} variant="outline" size="sm">
        Filter
      </Button>
      {searched && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          ✕
        </Button>
      )}
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

export function QuestionListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <Card key={`k-${i}`}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-56 rounded-lg" />
              <Skeleton className="h-3 w-32 rounded-lg" />
            </div>
            <Skeleton className="h-6 w-24 rounded-lg" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

export function QuestionEmptyState() {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Savollar topilmadi</p>
      </CardContent>
    </Card>
  );
}

// ─── Question list ────────────────────────────────────────────────────────────

interface QuestionListProps {
  questions: Question[];
  onDelete: (id: string | number) => void;
}

export function QuestionList({ questions, onDelete }: QuestionListProps) {
  return (
    <div className="space-y-3">
      {questions.map((q, idx) => {
        const qText = q.question_text ?? q.questionText ?? q.text ?? "—";
        const qType = q.question_type ?? q.questionType ?? "multiple_choice";
        const diff = q.difficulty ?? "medium";
        const dc = DIFFICULTY_MAP[diff] ?? DIFFICULTY_MAP.medium;

        return (
          <Card
            key={q.id ?? idx}
            className="hover:shadow-md transition-shadow"
            data-testid={`card-question-${q.id ?? idx}`}
          >
            <CardContent className="p-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{qText}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                  <span>{TYPE_LABELS[qType] ?? qType}</span>
                  <span className={dc.cls}>{dc.label}</span>
                  {q.points !== undefined && <span>{q.points} ball</span>}
                  {(q.test_id ?? q.testId) && (
                    <span>Test: #{q.test_id ?? q.testId}</span>
                  )}
                </div>
                {Array.isArray(q.options) && q.options.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {q.options.length} variant
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive shrink-0"
                onClick={() => onDelete(q.id)}
                data-testid={`button-delete-question-${q.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
