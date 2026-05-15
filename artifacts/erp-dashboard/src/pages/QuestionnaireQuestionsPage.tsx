/**
 * @module QuestionnaireQuestionsPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { ListChecks, Plus, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EPErrorState } from "@/components/ep";

import { useTranslation } from '@/lib/i18n';
interface QuestionnaireQuestion {
  id: string | number;
  template_id?: string | number;
  templateId?: string | number;
  question_text?: string;
  questionText?: string;
  text?: string;
  question_type?: string;
  questionType?: string;
  is_required?: boolean;
  isRequired?: boolean;
  order?: number;
  options?: unknown[];
}

const Q_TYPE_LABELS: Record<string, string> = {
  text:           "Matn",
  rating:         "Reyting",
  multiple_choice:"Ko'p tanlov",
  single_choice:  "Bitta tanlov",
  yes_no:         "Ha/Yo'q",
};

const QUERY_KEY = ["/api/questionnaire-questions"];

export default function QuestionnaireQuestionsPage() {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [templateId, setTemplateId] = useState("");
  const [searched, setSearched]     = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId]     = useState<string | number | null>(null);
  const [form, setForm] = useState({
    template_id: "",
    question_text: "",
    question_type: "text",
    is_required: true,
  });

  const { data: rawData, isLoading, isError, error, refetch } = useQuery<
    QuestionnaireQuestion[] | { data?: QuestionnaireQuestion[] }
  >({
    queryKey: [...QUERY_KEY, searched],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searched) params.set("templateId", searched);
      return await apiRequest("GET", `/api/questionnaire-questions?${params}`);
    },
  });

  const questions: QuestionnaireQuestion[] = Array.isArray(rawData)
    ? rawData
    : (rawData as { data?: QuestionnaireQuestion[] })?.data ?? [];

  const createMutation = useMutation({
    mutationFn: async (dto: typeof form) => {
      return await apiRequest("POST", "/api/questionnaire-questions", dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({ title: "Savol qo'shildi" });
      setShowCreate(false);
      setForm({ template_id: "", question_text: "", question_type: "text", is_required: true });
    },
    onError: () => toast({ title: "Xatolik", description: "Yaratishda muammo", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      return await apiRequest("DELETE", `/api/questionnaire-questions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({ title: "Savol o'chirildi" });
      setDeleteId(null);
    },
    onError: () => toast({ title: "Xatolik", description: "O'chirishda muammo", variant: "destructive" }),
  });

  if (isError) return <EPErrorState onRetry={refetch}  error={error} />;

  return (
    <ModulePage
      module="hr"
      title={t("sorovnomaSavollari")}
      icon={<ListChecks className="h-5 w-5" />}
      actions={
        <Button onClick={() => setShowCreate(true)} data-testid="button-create-q-question">
          <Plus className="h-4 w-4 mr-2" />
          {t("savolQoshish")}
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-2 max-w-sm">
          <Input
            placeholder={t("shablonIdBoyichaFilter")}
            value={templateId}
            onChange={e => setTemplateId(e.target.value)}
            onKeyDown={e => e.key === "Enter" && setSearched(templateId)}
            data-testid="input-template-id"
          />
          <Button onClick={() => setSearched(templateId)} variant="outline" size="sm">{t('filter3')}</Button>
          {searched && (
            <Button variant="ghost" size="sm" onClick={() => { setSearched(""); setTemplateId(""); }}>
              ✕
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={`k-${i}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-56 rounded-lg" />
                    <Skeleton className="h-3 w-32 rounded-lg" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : questions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ListChecks className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t("savollarTopilmadi")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {questions.map((q, idx) => {
              const qText   = q.question_text ?? q.questionText ?? q.text ?? "—";
              const qType   = q.question_type ?? q.questionType ?? "text";
              const reqd    = q.is_required ?? q.isRequired ?? false;
              return (
                <Card key={q.id ?? idx} className="hover:shadow-md transition-shadow" data-testid={`card-qq-${q.id ?? idx}`}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <p className="font-medium text-sm flex-1">{qText}</p>
                        {reqd && <span className="text-destructive text-xs shrink-0">*majburiy</span>}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                        <span>{Q_TYPE_LABELS[qType] ?? qType}</span>
                        {(q.template_id ?? q.templateId) && (
                          <span>Shablon: #{q.template_id ?? q.templateId}</span>
                        )}
                        {q.order !== undefined && <span>Tartib: {q.order}</span>}
                        {Array.isArray(q.options) && q.options.length > 0 && (
                          <span>{q.options.length} variant</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive shrink-0"
                      onClick={() => setDeleteId(q.id)}
                      data-testid={`button-delete-qq-${q.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("yangiSavolQoshish")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>{t("savolMatni1")}</Label>
              <Textarea
                value={form.question_text}
                onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
                placeholder={t("savolMatni")}
                rows={2}
                data-testid="input-qq-text"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("savolTuri1")}</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={form.question_type}
                  onChange={e => setForm(f => ({ ...f, question_type: e.target.value }))}
                  data-testid="select-qq-type"
                >
                  {Object.entries(Q_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("shablonId")}</Label>
                <Input
                  value={form.template_id}
                  onChange={e => setForm(f => ({ ...f, template_id: e.target.value }))}
                  placeholder={t("shablonId")}
                  data-testid="input-qq-template"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_required}
                onChange={e => setForm(f => ({ ...f, is_required: e.target.checked }))}
                data-testid="checkbox-qq-required"
              />
              {t("majburiySavol")}
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{t("Bekor")}</Button>
            <Button
              onClick={() => { if (form.question_text.trim()) createMutation.mutate(form); }}
              disabled={!form.question_text.trim() || createMutation.isPending}
              data-testid="button-confirm-create-qq"
            >
              {createMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("savolniOchirish")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("buSavolniOchirishniTasdiqlaysizmi")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Bekor")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => { if (deleteId !== null) deleteMutation.mutate(deleteId); }}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModulePage>
  );
}
