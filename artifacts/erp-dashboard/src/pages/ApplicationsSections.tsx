/** @module ApplicationsSections @description Section/card components for the Applications page: create-form card and question builder. */

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ApplicationQuestion, Department, Position } from "./ApplicationsTypes";
import { useTranslation } from '@/lib/i18n';

// ─── Question builder row ─────────────────────────────────────────────────────

interface QuestionRowProps {
  question: ApplicationQuestion;
  index: number;
  onUpdate: (id: string, field: string, value: string | boolean | string[]) => void;
  onRemove: (id: string) => void;
}

export function QuestionRow({ question: q, index, onUpdate, onRemove }: QuestionRowProps) {
  const { t } = useTranslation("common");
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Savol {index + 1}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(q.id)}
            data-testid={`button-remove-question-${index}`}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            placeholder="Savol matni (O'zbek)"
            value={q.question}
            onChange={(e) => onUpdate(q.id, "question", e.target.value)}
            data-testid={`input-question-text-${index}`}
          />
          <Input
            placeholder="Savol matni (Rus)"
            value={q.questionRu}
            onChange={(e) => onUpdate(q.id, "questionRu", e.target.value)}
            data-testid={`input-question-text-ru-${index}`}
          />
        </div>

        <div className="flex gap-3">
          <Select
            value={q.type}
            onValueChange={(value) => onUpdate(q.id, "type", value)}
          >
            <SelectTrigger data-testid={`select-question-type-${index}`} className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">{t("matn")}</SelectItem>
              <SelectItem value="choice">{t("kopTanlovli")}</SelectItem>
            </SelectContent>
          </Select>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={q.required}
              onChange={(e) => onUpdate(q.id, "required", e.target.checked)}
              data-testid={`checkbox-question-required-${index}`}
            />
            <span className="text-sm">{t("majburiy")}</span>
          </label>
        </div>

        {q.type === "choice" && (
          <Textarea
            placeholder="Variantlar (har birini yangi qatordan yozing)"
            value={q.options?.join("\n") || ""}
            onChange={(e) =>
              onUpdate(q.id, "options", e.target.value.split("\n").filter(Boolean))
            }
            rows={3}
            data-testid={`textarea-question-options-${index}`}
          />
        )}
      </div>
    </Card>
  );
}

// ─── Create-form card ─────────────────────────────────────────────────────────

interface CreateFormCardProps {
  title: string;
  onTitleChange: (v: string) => void;
  titleRu: string;
  onTitleRuChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  descriptionRu: string;
  onDescriptionRuChange: (v: string) => void;
  departmentId: string;
  onDepartmentChange: (v: string) => void;
  positionId: string;
  onPositionChange: (v: string) => void;
  dueDays: number | "";
  onDueDaysChange: (v: number | "") => void;
  questions: ApplicationQuestion[];
  onAddQuestion: () => void;
  onUpdateQuestion: (id: string, field: string, value: string | boolean | string[]) => void;
  onRemoveQuestion: (id: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  departments: Department[];
  positions: Position[];
}

export function CreateFormCard({
  title,
  onTitleChange,
  titleRu,
  onTitleRuChange,
  description,
  onDescriptionChange,
  descriptionRu,
  onDescriptionRuChange,
  departmentId,
  onDepartmentChange,
  positionId,
  onPositionChange,
  dueDays,
  onDueDaysChange,
  questions,
  onAddQuestion,
  onUpdateQuestion,
  onRemoveQuestion,
  onSubmit,
  isSubmitting,
  departments,
  positions,
}: CreateFormCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("yangiArizaShablon")}</CardTitle>
        <CardDescription>{t("xodimlarToldiradiganArizaShabloniniYarating")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label htmlFor="title">Ariza nomi (O'zbek) *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder={t("masalanTatilArizasi")}
                data-testid="input-application-title"
              />
            </div>
            <div className="space-y-1">
          <Label htmlFor="titleRu">Ariza nomi (Rus)</Label>
              <Input
                id="titleRu"
                value={titleRu}
                onChange={(e) => onTitleRuChange(e.target.value)}
                placeholder="Например: Заявление на отпуск"
                data-testid="input-application-title-ru"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label htmlFor="description">Tavsif (O'zbek)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                placeholder={t("arizaHaqidaQisqachaMalumot")}
                rows={3}
                data-testid="textarea-application-description"
              />
            </div>
            <div className="space-y-1">
          <Label htmlFor="descriptionRu">Tavsif (Rus)</Label>
              <Textarea
                id="descriptionRu"
                value={descriptionRu}
                onChange={(e) => onDescriptionRuChange(e.target.value)}
                placeholder="Краткая информация о заявлении..."
                rows={3}
                data-testid="textarea-application-description-ru"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
          <Label htmlFor="department">Bo'lim (ixtiyoriy)</Label>
              <Select
                value={departmentId || "all"}
                onValueChange={(val) => onDepartmentChange(val === "all" ? "" : val)}
              >
                <SelectTrigger data-testid="select-department" className="h-9">
                  <SelectValue placeholder={t("bolimniTanlang")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("barchaBolimlar")}</SelectItem>
                  {(Array.isArray(departments) ? departments : []).map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
          <Label htmlFor="position">Lavozim (ixtiyoriy)</Label>
              <Select
                value={positionId || "all"}
                onValueChange={(val) => onPositionChange(val === "all" ? "" : val)}
              >
                <SelectTrigger data-testid="select-position" className="h-9">
                  <SelectValue placeholder={t("lavozimniTanlang")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("barchaLavozimlar")}</SelectItem>
                  {(Array.isArray(positions) ? positions : []).map((pos) => (
                    <SelectItem key={pos.id} value={pos.id}>
                      {pos.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
          <Label htmlFor="dueDays">Ko'rib chiqish muddati (ish kunlari, ixtiyoriy)</Label>
              <Input
                id="dueDays"
                type="number"
                min="0"
                step="1"
                placeholder={t("masalan3IshKuni")}
                value={dueDays}
                onChange={(e) =>
                  onDueDaysChange(e.target.value ? parseInt(e.target.value) : "")
                }
                data-testid="input-due-days"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>{t("savollar")}</Label>
              <Button
                type="button"
                onClick={onAddQuestion}
                size="sm"
                data-testid="button-add-question"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("savolQoshish")}
              </Button>
            </div>

            {(Array.isArray(questions) ? questions : []).map((q, index) => (
              <QuestionRow
                key={q.id}
                question={q}
                index={index}
                onUpdate={onUpdateQuestion}
                onRemove={onRemoveQuestion}
              />
            ))}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            data-testid="button-create-application"
          >
            {isSubmitting ? "Yaratilmoqda..." : "Yaratish"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
