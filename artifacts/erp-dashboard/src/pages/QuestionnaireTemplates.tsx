import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, FileText, Star } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { QuestionnaireTemplate, QuestionnaireQuestion } from "@shared/schema";
import { ErrorState } from "@/components/ui/error-state";

interface Position {
  id: string;
  name: string;
}

interface TemplateWithPosition extends QuestionnaireTemplate {
  positionName?: string;
}

const templateSchema = z.object({
  name: z.string().min(1, "Nomi majburiy"),
  nameRu: z.string().min(1, "Nomi (RU) majburiy"),
  description: z.string().optional(),
  descriptionRu: z.string().optional(),
  positionId: z.string().optional(),
});

const questionSchema = z.object({
  question: z.string().min(1, "Savol majburiy"),
  questionRu: z.string().min(1, "Savol (RU) majburiy"),
  questionType: z.string().min(1, "Tur majburiy"),
  order: z.number().min(1, "Tartib raqami majburiy"),
  isRequired: z.boolean().default(true),
});

type TemplateFormData = z.infer<typeof templateSchema>;
type QuestionFormData = z.infer<typeof questionSchema>;

// Tayyor shablonlar
const TEMPLATE_PRESETS = {
  "reception": {
    name: "Qabulxona xodimi anketasi",
    nameRu: "Анкета сотрудника reception",
    description: "Mehmonlarni qabul qilish, telefon qo'ng'iroqlari, vaziyatlarni hal qilish",
    descriptionRu: "Прием гостей, телефонные звонки, решение ситуаций",
    questions: [
      { question: "Ismingiz va familiyangiz?", questionRu: "Ваше имя и фамилия?", order: 1, questionType: "text", isRequired: true },
      { question: "Telefon raqamingiz?", questionRu: "Ваш номер телефона?", order: 2, questionType: "text", isRequired: true },
      { question: "Tajribangiz necha yil?", questionRu: "Сколько лет опыта?", order: 3, questionType: "text", isRequired: true },
      { question: "Ingliz tilini bilas izmi?", questionRu: "Знаете ли вы английский?", order: 4, questionType: "yes_no", isRequired: true },
      { question: "Kompyuter dasturlarida qanday tajribangiz bor?", questionRu: "Какой у вас опыт работы с компьютерными программами?", order: 5, questionType: "text", isRequired: false },
    ]
  },
  "marketing": {
    name: "Marketing xodimi anketasi",
    nameRu: "Анкета сотрудника маркетинга",
    description: "SMM, content yaratish, kampaniya boshqarish",
    descriptionRu: "SMM, создание контента, управление кампаниями",
    questions: [
      { question: "Ismingiz va familiyangiz?", questionRu: "Ваше имя и фамилия?", order: 1, questionType: "text", isRequired: true },
      { question: "Telefon raqamingiz?", questionRu: "Ваш номер телефона?", order: 2, questionType: "text", isRequired: true },
      { question: "Marketing sohasida tajribangiz?", questionRu: "Опыт в маркетинге?", order: 3, questionType: "text", isRequired: true },
      { question: "Qaysi ijtimoiy tarmoqlarda ishlagan sizmi?", questionRu: "С какими соц. сетями работали?", order: 4, questionType: "text", isRequired: true },
      { question: "Grafik dizayn dasturlarini bilas izmi?", questionRu: "Знаете ли графические программы?", order: 5, questionType: "yes_no", isRequired: false },
    ]
  },
  "developer": {
    name: "Dasturchi anketasi",
    nameRu: "Анкета программиста",
    description: "Texnik ko'nikmalar, tajriba, loyihalar",
    descriptionRu: "Технические навыки, опыт, проекты",
    questions: [
      { question: "Ismingiz va familiyangiz?", questionRu: "Ваше имя и фамилия?", order: 1, questionType: "text", isRequired: true },
      { question: "Telefon raqamingiz?", questionRu: "Ваш номер телефона?", order: 2, questionType: "text", isRequired: true },
      { question: "Qaysi dasturlash tillarini bilasiz?", questionRu: "Какие языки программирования знаете?", order: 3, questionType: "text", isRequired: true },
      { question: "Ishlagan loyihalaringiz (GitHub)?", questionRu: "Ваши проекты (GitHub)?", order: 4, questionType: "text", isRequired: false },
      { question: "Jamoada ishlash tajribangiz?", questionRu: "Опыт работы в команде?", order: 5, questionType: "text", isRequired: true },
    ]
  },
  "sales": {
    name: "Sotuvchi anketasi",
    nameRu: "Анкета продавца",
    description: "Mijozlar bilan ishlash, mahsulot bilimi, sotish tajribasi",
    descriptionRu: "Работа с клиентами, знание продукта, опыт продаж",
    questions: [
      { question: "Ismingiz va familiyangiz?", questionRu: "Ваше имя и фамилия?", order: 1, questionType: "text", isRequired: true },
      { question: "Telefon raqamingiz?", questionRu: "Ваш номер телефона?", order: 2, questionType: "text", isRequired: true },
      { question: "Sotish tajribangiz?", questionRu: "Опыт продаж?", order: 3, questionType: "text", isRequired: true },
      { question: "Kunlik/oylik maqsadlarga erishgans izmi?", questionRu: "Достигали ли ежедневных/месячных целей?", order: 4, questionType: "yes_no", isRequired: true },
      { question: "CRM dasturlari bilan ishlagans izmi?", questionRu: "Работали ли с CRM системами?", order: 5, questionType: "yes_no", isRequired: false },
    ]
  }
};

export default function QuestionnaireTemplates() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateWithPosition | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [confirmDeleteTemplateId, setConfirmDeleteTemplateId] = useState<number | null>(null);
  const [confirmDeleteQuestionId, setConfirmDeleteQuestionId] = useState<number | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionnaireQuestion | null>(null);

  // Fetch data
  const { data: templates = [], isLoading: templatesLoading, isError, refetch} = useQuery<TemplateWithPosition[]>({ queryKey: ["/api/questionnaire-templates"] });
  const { data: positions = [] } = useQuery<Position[]>({ queryKey: ["/api/positions"] });
  const { data: questions = [] } = useQuery<QuestionnaireQuestion[]>({ 
    queryKey: ["/api/questionnaire-templates", selectedTemplate, "questions"],
    enabled: !!selectedTemplate,
  });

  // Template mutations
  const createTemplate = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/questionnaire-templates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questionnaire-templates"] });
      setIsDialogOpen(false);
      setEditingTemplate(null);
      toast({ title: "Shablon yaratildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const updateTemplate = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => apiRequest("PATCH", `/api/questionnaire-templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questionnaire-templates"] });
      setIsDialogOpen(false);
      setEditingTemplate(null);
      toast({ title: "Shablon yangilandi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const deleteTemplate = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/questionnaire-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questionnaire-templates"] });
      toast({ title: "Shablon o'chirildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  // Question mutations
  const createQuestion = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/questionnaire-questions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questionnaire-templates", selectedTemplate, "questions"] });
      setQuestionDialogOpen(false);
      setEditingQuestion(null);
      toast({ title: "Savol qo'shildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const updateQuestion = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => apiRequest("PATCH", `/api/questionnaire-questions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questionnaire-templates", selectedTemplate, "questions"] });
      setQuestionDialogOpen(false);
      setEditingQuestion(null);
      toast({ title: "Savol yangilandi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const deleteQuestion = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/questionnaire-questions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questionnaire-templates", selectedTemplate, "questions"] });
      toast({ title: "Savol o'chirildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const templateForm = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      nameRu: "",
      description: "",
      descriptionRu: "",
      positionId: "none",
    },
  });

  const questionForm = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question: "",
      questionRu: "",
      questionType: "text",
      order: 1,
      isRequired: true,
    },
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

  const handleSubmitQuestion = (data: QuestionFormData) => {
    const submitData = {
      ...data,
      templateId: selectedTemplate,
      isActive: true,
    };

    if (editingQuestion?.id) {
      updateQuestion.mutate({ id: editingQuestion.id, data: submitData });
    } else {
      createQuestion.mutate(submitData);
    }
  };

  const openTemplateDialog = (template?: TemplateWithPosition) => {
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
    setIsDialogOpen(true);
  };

  const openQuestionDialog = (question?: QuestionnaireQuestion) => {
    if (question) {
      questionForm.reset({
        question: question.question || "",
        questionRu: question.questionRu || "",
        questionType: question.questionType || "text",
        order: question.order || questions.length + 1,
        isRequired: question.isRequired ?? true,
      });
      setEditingQuestion(question);
    } else {
      questionForm.reset({
        question: "",
        questionRu: "",
        questionType: "text",
        order: questions.length + 1,
        isRequired: true,
      });
      setEditingQuestion(null);
    }
    setQuestionDialogOpen(true);
  };

  const handleUsePreset = async (presetKey: string) => {
    const preset = TEMPLATE_PRESETS[presetKey as keyof typeof TEMPLATE_PRESETS];
    
    // Create template
    const templateData = {
      name: preset.name,
      nameRu: preset.nameRu,
      description: preset.description,
      descriptionRu: preset.descriptionRu,
      positionId: null,
      isActive: true,
    };

    try {
      const response = await apiRequest("POST", "/api/questionnaire-templates", templateData) as { id: string };
      const templateId = response.id;

      // Create questions
      for (const q of preset.questions) {
        await apiRequest("POST", "/api/questionnaire-questions", {
          ...q,
          templateId,
          isActive: true,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/questionnaire-templates"] });
      setShowPresets(false);
      toast({ title: "Shablon yaratildi va savollar qo'shildi!" });
    } catch (error) {
      toast({ title: "Xatolik", variant: "destructive" });
    }
  };

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Anketa shablonlari</CardTitle>
              <CardDescription>Lavozimlar uchun anketa shablonlarini yarating</CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={showPresets} onOpenChange={setShowPresets}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-presets">
                    <Star className="w-4 h-4 mr-2" />
                    Tayyor shablonlar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tayyor shablonlarni tanlang</DialogTitle>
                    <DialogDescription>
                      Quyidagi shablonlardan birini tanlang - savollar avtomatik qo'shiladi
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="h-auto flex-col items-start p-4"
                      onClick={() => handleUsePreset("reception")}
                      data-testid="preset-reception"
                    >
                      <div className="font-semibold">Qabulxona</div>
                      <div className="text-xs text-muted-foreground">5 ta savol</div>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto flex-col items-start p-4"
                      onClick={() => handleUsePreset("marketing")}
                      data-testid="preset-marketing"
                    >
                      <div className="font-semibold">Marketing</div>
                      <div className="text-xs text-muted-foreground">5 ta savol</div>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto flex-col items-start p-4"
                      onClick={() => handleUsePreset("developer")}
                      data-testid="preset-developer"
                    >
                      <div className="font-semibold">Dasturchi</div>
                      <div className="text-xs text-muted-foreground">5 ta savol</div>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto flex-col items-start p-4"
                      onClick={() => handleUsePreset("sales")}
                      data-testid="preset-sales"
                    >
                      <div className="font-semibold">Sotuvchi</div>
                      <div className="text-xs text-muted-foreground">5 ta savol</div>
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => openTemplateDialog()} data-testid="button-add-template">
                    <Plus className="w-4 h-4 mr-2" />
                    Yangi shablon
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingTemplate ? "Shablonni tahrirlash" : "Yangi shablon"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={templateForm.handleSubmit(handleSubmitTemplate)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Nomi (UZ) <span className="text-destructive">*</span></Label>
                        <Input id="name" {...templateForm.register("name")} data-testid="input-name" />
                        {templateForm.formState.errors.name && (
                          <p className="text-sm text-destructive mt-1">{templateForm.formState.errors.name.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="nameRu">Nomi (RU) <span className="text-destructive">*</span></Label>
                        <Input id="nameRu" {...templateForm.register("nameRu")} data-testid="input-name-ru" />
                        {templateForm.formState.errors.nameRu && (
                          <p className="text-sm text-destructive mt-1">{templateForm.formState.errors.nameRu.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="description">Tavsif (UZ)</Label>
                        <Textarea id="description" {...templateForm.register("description")} rows={3} data-testid="input-description" />
                      </div>
                      <div>
                        <Label htmlFor="descriptionRu">Tavsif (RU)</Label>
                        <Textarea id="descriptionRu" {...templateForm.register("descriptionRu")} rows={3} data-testid="input-description-ru" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="positionId">Lavozim (agar ma'lum lavozim uchun bo'lsa)</Label>
                      <Select value={templateForm.watch("positionId")} onValueChange={(value) => templateForm.setValue("positionId", value)}>
                        <SelectTrigger data-testid="select-position">
                          <SelectValue placeholder="Lavozim tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Barcha lavozimlar uchun</SelectItem>
                          {(Array.isArray(positions) ? positions : []).map((p: Position) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button type="submit" data-testid="button-submit-template">
                        {editingTemplate ? "Yangilash" : "Yaratish"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {templatesLoading ? (
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={`k-${i}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                      <div className="flex gap-1">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
          <div className="grid grid-cols-3 gap-4">
            {(Array.isArray(templates) ? templates : []).map((template: TemplateWithPosition) => (
              <Card key={template.id} className="cursor-pointer hover-elevate" onClick={() => setSelectedTemplate(template.id)} data-testid={`template-card-${template.id}`}>
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
                          openTemplateDialog(template);
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
                          setConfirmDeleteTemplateId(template.id);
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
          )}
        </CardContent>
      </Card>

      {selectedTemplate && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Savollar</CardTitle>
                <CardDescription>{(templates ?? []).find((tmpl: TemplateWithPosition) => tmpl.id === selectedTemplate)?.name}</CardDescription>
              </div>
              <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => openQuestionDialog()} data-testid="button-add-question">
                    <Plus className="w-4 h-4 mr-2" />
                    Savol qo'shish
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingQuestion ? "Savolni tahrirlash" : "Yangi savol"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={questionForm.handleSubmit(handleSubmitQuestion)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="question">Savol (UZ) <span className="text-destructive">*</span></Label>
                        <Input id="question" {...questionForm.register("question")} data-testid="input-question" />
                        {questionForm.formState.errors.question && (
                          <p className="text-sm text-destructive mt-1">{questionForm.formState.errors.question.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="questionRu">Savol (RU) <span className="text-destructive">*</span></Label>
                        <Input id="questionRu" {...questionForm.register("questionRu")} data-testid="input-question-ru" />
                        {questionForm.formState.errors.questionRu && (
                          <p className="text-sm text-destructive mt-1">{questionForm.formState.errors.questionRu.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="questionType">Savol turi <span className="text-destructive">*</span></Label>
                        <Select value={questionForm.watch("questionType")} onValueChange={(value) => questionForm.setValue("questionType", value)}>
                          <SelectTrigger data-testid="select-question-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Matn</SelectItem>
                            <SelectItem value="yes_no">Ha/Yo'q</SelectItem>
                            <SelectItem value="multiple_choice">Ko'p variantli</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="order">Tartib raqami <span className="text-destructive">*</span></Label>
                        <Input type="number" id="order" {...questionForm.register("order", { valueAsNumber: true })} data-testid="input-order" />
                        {questionForm.formState.errors.order && (
                          <p className="text-sm text-destructive mt-1">{questionForm.formState.errors.order.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="isRequired" {...questionForm.register("isRequired")} className="rounded" data-testid="checkbox-required" />
                      <Label htmlFor="isRequired">Majburiy savol</Label>
                    </div>
                    <DialogFooter>
                      <Button type="submit" data-testid="button-submit-question">
                        {editingQuestion ? "Yangilash" : "Qo'shish"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {questions.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  Savollar yo'q. Yuqoridagi tugmani bosib qo'shing.
                </div>
              )}
              {(Array.isArray(questions) ? questions : []).map((q: QuestionnaireQuestion, index: number) => (
                <div key={q.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`question-${q.id}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-medium">{q.question}</span>
                      {q.isRequired && <Badge variant="secondary">Majburiy</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{q.questionRu}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openQuestionDialog(q)}
                      data-testid={`button-edit-question-${q.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setConfirmDeleteQuestionId(q.id)}
                      data-testid={`button-delete-question-${q.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <ConfirmDialog
        open={confirmDeleteTemplateId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteTemplateId(null); }}
        title="Shablonni o'chirish"
        description="Ushbu so'rovnoma shablonini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => { if (confirmDeleteTemplateId !== null) deleteTemplate.mutate(confirmDeleteTemplateId); }}
      />
      <ConfirmDialog
        open={confirmDeleteQuestionId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteQuestionId(null); }}
        title="Savolni o'chirish"
        description="Ushbu so'rovnoma savolini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => { if (confirmDeleteQuestionId !== null) deleteQuestion.mutate(confirmDeleteQuestionId); }}
      />
    </div>
  );
}
