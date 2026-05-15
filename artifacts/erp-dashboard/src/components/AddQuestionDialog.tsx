/**
 * @module AddQuestionDialog
 * @description React UI component.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, X } from "lucide-react";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface AddQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testId: string;
}

export function AddQuestionDialog({ open, onOpenChange, testId }: AddQuestionDialogProps) {
  const { t } = useTranslation("common");
  const { t: tLms } = useTranslation("lms");
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    question: "",
    questionRu: "",
    type: "mcq" as "mcq" | "open" | "practice",
    difficulty: "medium" as "easy" | "medium" | "hard",
    category: "",
    correctAnswer: "",
  });
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [optionsRu, setOptionsRu] = useState<string[]>(["", "", "", ""]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/questions", {
        ...data,
        testId,
        order: 0,
        options: data.type === "mcq" ? (Array.isArray(options) ? options : []).filter(o => o.trim()) : null,
        optionsRu: data.type === "mcq" ? (Array.isArray(optionsRu) ? optionsRu : []).filter(o => o.trim()) : null,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests", testId, "questions"] });
      toast({
        title: t("muvaffaqiyatli"),
        description: tLms("questionAddedSuccessfully"),
      });
      onOpenChange(false);
      setFormData({
        question: "",
        questionRu: "",
        type: "mcq",
        difficulty: "medium",
        category: "",
        correctAnswer: "",
      });
      setOptions(["", "", "", ""]);
      setOptionsRu(["", "", "", ""]);
    },
    onError: () => {
      toast({
        title: t("xato"),
        description: tLms("questionAddError"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const addOption = () => {
    setOptions([...options, ""]);
    setOptionsRu([...optionsRu, ""]);
  };

  const removeOption = (index: number) => {
    setOptions((Array.isArray(options) ? options : []).filter((_, i) => i !== index));
    setOptionsRu((Array.isArray(optionsRu) ? optionsRu : []).filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const updateOptionRu = (index: number, value: string) => {
    const newOptions = [...optionsRu];
    newOptions[index] = value;
    setOptionsRu(newOptions);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiSavolQoshish")}</DialogTitle>
          <DialogDescription>
            {t("testUchunYangiSavolYarating")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
          <Label htmlFor="questionType">{t("savolTuri")}</Label>
              <Select value={formData.type} onValueChange={(value: string) => setFormData({ ...formData, type: value as "mcq" | "open" | "practice" })}>
                <SelectTrigger data-testid="select-question-type" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq">{t("kopTanlov")}</SelectItem>
                  <SelectItem value="open">{t("ochiqSavol")}</SelectItem>
                  <SelectItem value="practice">{t("amaliy")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
          <Label htmlFor="difficulty">{t("qiyinlikDarajasi")}</Label>
              <Select value={formData.difficulty} onValueChange={(value: string) => setFormData({ ...formData, difficulty: value as "easy" | "medium" | "hard" })}>
                <SelectTrigger data-testid="select-difficulty" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">{t("oson")}</SelectItem>
                  <SelectItem value="medium">{t("medium")}</SelectItem>
                  <SelectItem value="hard">{t("qiyin")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
          <Label htmlFor="category">{t("category")}</Label>
              <Input
                id="category"
                placeholder={t("xavfsizlik")}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                data-testid="input-category"
              />
            </div>
          </div>

          <div className="space-y-1">
          <Label htmlFor="question">{tLms("questionTextUz")} *</Label>
            <Textarea
              id="question"
              placeholder={t("savolingizniKiriting")}
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              rows={3}
              required
              data-testid="input-question"
            />
          </div>

          <div className="space-y-1">
          <Label htmlFor="questionRu">{tLms("questionTextRu")} *</Label>
            <Textarea
              id="questionRu"
              placeholder={tLms("questionRuPlaceholder")}
              value={formData.questionRu}
              onChange={(e) => setFormData({ ...formData, questionRu: e.target.value })}
              rows={3}
              required
              data-testid="input-question-ru"
            />
          </div>

          {formData.type === "mcq" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{tLms("answerOptionsUz")}</Label>
                <Button type="button" size="sm" variant="outline" onClick={addOption}>
                  <Plus className="w-3 h-3 mr-1" />
                  {t("variantQoshish")}
                </Button>
              </div>
              {(Array.isArray(options) ? options : []).map((option, index) => (
                <div key={`k-${index}`} className="flex items-center gap-2">
                  <span className="text-sm font-medium w-6">{index + 1}.</span>
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`${index + 1}-variant`}
                    data-testid={`input-option-${index}`}
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeOption(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}

              <div className="pt-2">
                <Label>{tLms("answerOptionsRu")}</Label>
              </div>
              {(Array.isArray(optionsRu) ? optionsRu : []).map((option, index) => (
                <div key={`k-${index}`} className="flex items-center gap-2">
                  <span className="text-sm font-medium w-6">{index + 1}.</span>
                  <Input
                    value={option}
                    onChange={(e) => updateOptionRu(index, e.target.value)}
                    placeholder={`${tLms("optionRu")} ${index + 1}`}
                    data-testid={`input-option-ru-${index}`}
                  />
                </div>
              ))}

              <div className="space-y-2 pt-2">
                <Label htmlFor="correctAnswer">{tLms("correctAnswerNumber")} *</Label>
                <Input
                  id="correctAnswer"
                  type="number"
                  min="1"
                  max={options.length}
                  placeholder="1"
                  value={formData.correctAnswer}
                  onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                  required
                  data-testid="input-correct-answer"
                />
                <p className="text-xs text-muted-foreground">
                  {t("togriJavobVariantiningRaqaminiKiriting")}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-question">
              {createMutation.isPending && <EPLoader className="w-4 h-4 mr-2" />}
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
