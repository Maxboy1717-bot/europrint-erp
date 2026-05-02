import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Check, X, Clock, Download } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ErrorState } from "@/components/ui/error-state";

type QuestionnaireQuestion = {
  id: string;
  question: string;
  questionRu: string;
  order: number;
  isActive: boolean;
  createdAt: string;
};

type QuestionnaireResponse = {
  id: string;
  fullName: string;
  phone: string;
  telegramChatId: string;
  lang: string;
  responses: Array<{ questionId: string; question: string; answer: string }>;
  status: "pending" | "approved" | "rejected" | "hired" | "not_hired" | "interviewed" | "in_review";
  reviewedAt: string | null;
  createdAt: string;
};

export default function Questionnaire() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<QuestionnaireResponse | null>(null);
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    questionRu: "",
    order: 1,
    isActive: true,
  });

  // Fetch questions
  const { data: questions = [], isLoading: questionsLoading, isError, refetch} = useQuery<QuestionnaireQuestion[]>({
    queryKey: ["/api/questionnaire/questions"],
  });

  // Fetch responses
  const { data: responses = [], isLoading: responsesLoading } = useQuery<QuestionnaireResponse[]>({
    queryKey: ["/api/questionnaire/responses"],
  });

  // Create question mutation
  const createQuestionMutation = useMutation({
    mutationFn: async (data: typeof newQuestion) => {
      return await apiRequest("POST", "/api/questionnaire/questions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questionnaire/questions"] });
      setNewQuestion({ question: "", questionRu: "", order: 1, isActive: true });
      setIsDialogOpen(false);
      toast({
        title: "Savol qo'shildi",
        description: "Yangi savol muvaffaqiyatli qo'shildi",
      });
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Savolni qo'shishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/questionnaire/questions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questionnaire/questions"] });
      toast({
        title: "Savol o'chirildi",
        description: "Savol muvaffaqiyatli o'chirildi",
      });
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Savolni o'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  // Update response status mutation
  const updateResponseStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PUT", `/api/questionnaire/responses/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questionnaire/responses"] });
      setSelectedResponse(null);
      toast({
        title: "Holat yangilandi",
        description: "Ariza holati muvaffaqiyatli yangilandi",
      });
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Holatni yangilashda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  // Delete response mutation
  const deleteResponseMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/questionnaire/responses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questionnaire/responses"] });
      toast({ title: "Ariza o'chirildi" });
    },
    onError: () => {
      toast({ 
        title: "Xatolik", 
        description: "Arizani o'chirishda xatolik yuz berdi",
        variant: "destructive" 
      });
    },
  });

  const handleCreateQuestion = () => {
    if (!newQuestion.question.trim() || !newQuestion.questionRu.trim()) {
      toast({
        title: "Xatolik",
        description: "Iltimos, barcha maydonlarni to'ldiring",
        variant: "destructive",
      });
      return;
    }
    createQuestionMutation.mutate(newQuestion);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="flex items-center gap-1" data-testid="badge-pending"><Clock className="w-3 h-3" />Kutilmoqda</Badge>;
      case "approved":
        return <Badge variant="default" className="flex items-center gap-1 bg-green-600" data-testid="badge-approved"><Check className="w-3 h-3" />Tasdiqlangan</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="flex items-center gap-1" data-testid="badge-rejected"><X className="w-3 h-3" />Rad etilgan</Badge>;
      case "hired":
        return <Badge variant="default" className="flex items-center gap-1 bg-blue-600" data-testid="badge-hired"><Check className="w-3 h-3" />Ishga olindi</Badge>;
      case "not_hired":
        return <Badge variant="destructive" className="flex items-center gap-1" data-testid="badge-not-hired"><X className="w-3 h-3" />Ishga olinmadi</Badge>;
      case "interviewed":
        return <Badge variant="outline" className="flex items-center gap-1" data-testid="badge-interviewed"><Clock className="w-3 h-3" />Intervyu qilindi</Badge>;
      case "in_review":
        return <Badge variant="outline" className="flex items-center gap-1" data-testid="badge-in-review"><Clock className="w-3 h-3" />Ko'rib chiqilmoqda</Badge>;
      default:
        return null;
    }
  };

  const handleDownloadWord = async (responseId: string, fullName: string) => {
    try {
      const response = await fetch(`/api/questionnaire/responses/${responseId}/export`, { credentials: "include" });
      if (!response.ok) {
        throw new Error("Download failed");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `anketa-${fullName.replace(/\s+/g, '-')}-${Date.now()}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Yuklab olindi",
        description: "Word fayl muvaffaqiyatli yuklab olindi",
      });
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Faylni yuklab olishda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Anketa Boshqaruvi</h1>
        <p className="text-muted-foreground">Yangi xodimlar uchun anketa savollarini boshqaring</p>
      </div>

      <Tabs defaultValue="questions" className="space-y-4">
        <TabsList data-testid="tabs-list">
          <TabsTrigger value="questions" data-testid="tab-questions">Savollar</TabsTrigger>
          <TabsTrigger value="responses" data-testid="tab-responses">Arizalar ({responses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="questions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Anketa Savollari</CardTitle>
                <CardDescription>Telegram botda ko'rsatiladigan savollar</CardDescription>
              </div>
              <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-question">
                <Plus className="w-4 h-4 mr-2" />
                Savol qo'shish
              </Button>
            </CardHeader>
            <CardContent>
              {questionsLoading ? (
                <p className="text-center text-muted-foreground py-8">Yuklanmoqda...</p>
              ) : questions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Hozircha savollar yo'q</p>
              ) : (
                <div className="space-y-4">
                  {(Array.isArray(questions) ? questions : []).map((q) => (
                    <Card key={q.id} data-testid={`card-question-${q.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">#{q.order}</Badge>
                              <span className="font-semibold text-sm">O'zbek</span>
                            </div>
                            <p className="text-sm">{q.question}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="font-semibold text-sm">Rus</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{q.questionRu}</p>
                          </div>
                          <DeleteConfirmDialog
                            title="Savolni o'chirishni tasdiqlaysizmi?"
                            description="Savol butunlay o'chiriladi."
                            onConfirm={() => deleteQuestionMutation.mutate(q.id)}
                            isPending={deleteQuestionMutation.isPending}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responses">
          <Card>
            <CardHeader>
              <CardTitle>Xodim Arizalari</CardTitle>
              <CardDescription>Yangi xodimlardan kelgan arizalar</CardDescription>
            </CardHeader>
            <CardContent>
              {responsesLoading ? (
                <p className="text-center text-muted-foreground py-8">Yuklanmoqda...</p>
              ) : responses.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Hozircha arizalar yo'q</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>To'liq ism</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Til</TableHead>
                      <TableHead>Holat</TableHead>
                      <TableHead>Sana</TableHead>
                      <TableHead>Harakatlar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(responses) ? responses : []).map((response) => (
                      <TableRow key={response.id} data-testid={`row-response-${response.id}`}>
                        <TableCell className="font-medium" data-testid={`text-name-${response.id}`}>{response.fullName}</TableCell>
                        <TableCell>{response.phone}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{response.lang === "uz" ? "O'zbek" : "Русский"}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(response.status)}</TableCell>
                        <TableCell>{new Date(response.createdAt).toLocaleDateString("uz-UZ")}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedResponse(response)}
                              data-testid={`button-view-${response.id}`}
                            >
                              Ko'rish
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadWord(response.id, response.fullName)}
                              data-testid={`button-download-${response.id}`}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Yuklab olish
                            </Button>
                            <DeleteConfirmDialog
                              title="Javobni o'chirishni tasdiqlaysizmi?"
                              description="Javob butunlay o'chiriladi."
                              onConfirm={() => deleteResponseMutation.mutate(response.id)}
                              isPending={deleteResponseMutation.isPending}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Question Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent data-testid="dialog-add-question">
          <DialogHeader>
            <DialogTitle>Yangi savol qo'shish</DialogTitle>
            <DialogDescription>Telegram botda ko'rsatiladigan yangi savol qo'shing</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="order">Tartib raqami</Label>
              <Input
                id="order"
                type="number"
                value={newQuestion.order}
                onChange={(e) => setNewQuestion({ ...newQuestion, order: parseInt(e.target.value) || 1 })}
                data-testid="input-order"
              />
            </div>
            <div>
              <Label htmlFor="question">Savol (O'zbek)</Label>
              <Input
                id="question"
                value={newQuestion.question}
                onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                placeholder="Masalan: To'liq ismingiz"
                data-testid="input-question-uz"
              />
            </div>
            <div>
              <Label htmlFor="questionRu">Savol (Rus)</Label>
              <Input
                id="questionRu"
                value={newQuestion.questionRu}
                onChange={(e) => setNewQuestion({ ...newQuestion, questionRu: e.target.value })}
                placeholder="Например: Полное имя"
                data-testid="input-question-ru"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel">
              Bekor qilish
            </Button>
            <Button onClick={handleCreateQuestion} disabled={createQuestionMutation.isPending} data-testid="button-save-question">
              {createQuestionMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Response Dialog */}
      <Dialog open={!!selectedResponse} onOpenChange={() => setSelectedResponse(null)}>
        <DialogContent className="max-w-2xl" data-testid="dialog-view-response">
          <DialogHeader>
            <DialogTitle>Ariza tafsilotlari</DialogTitle>
            <DialogDescription>
              {selectedResponse?.fullName} - {selectedResponse?.phone}
            </DialogDescription>
          </DialogHeader>
          {selectedResponse && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Holat</Label>
                  <div className="mt-2">{getStatusBadge(selectedResponse.status)}</div>
                </div>
                <div>
                  <Label>Yuborilgan vaqt</Label>
                  <p className="text-sm mt-2">{new Date(selectedResponse.createdAt).toLocaleString("uz-UZ")}</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Javoblar</Label>
                {(Array.isArray(selectedResponse.responses) ? selectedResponse.responses : []).map((r, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-3">
                      <p className="text-sm font-semibold mb-1">{r.question}</p>
                      <p className="text-sm text-muted-foreground">{r.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="space-y-3">
                <Label>Holat o'zgartirish</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateResponseStatusMutation.mutate({ id: selectedResponse.id, status: "pending" })}
                    disabled={selectedResponse.status === "pending"}
                    data-testid="button-status-pending"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Kutilmoqda
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateResponseStatusMutation.mutate({ id: selectedResponse.id, status: "in_review" })}
                    disabled={selectedResponse.status === "in_review"}
                    data-testid="button-status-in-review"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Ko'rib chiqilmoqda
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateResponseStatusMutation.mutate({ id: selectedResponse.id, status: "interviewed" })}
                    disabled={selectedResponse.status === "interviewed"}
                    data-testid="button-status-interviewed"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Intervyu qilindi
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateResponseStatusMutation.mutate({ id: selectedResponse.id, status: "approved" })}
                    disabled={selectedResponse.status === "approved"}
                    data-testid="button-status-approved"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Tasdiqlangan
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => updateResponseStatusMutation.mutate({ id: selectedResponse.id, status: "hired" })}
                    disabled={selectedResponse.status === "hired"}
                    data-testid="button-status-hired"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Ishga olindi
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => updateResponseStatusMutation.mutate({ id: selectedResponse.id, status: "not_hired" })}
                    disabled={selectedResponse.status === "not_hired"}
                    data-testid="button-status-not-hired"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Ishga olinmadi
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => updateResponseStatusMutation.mutate({ id: selectedResponse.id, status: "rejected" })}
                    disabled={selectedResponse.status === "rejected"}
                    data-testid="button-status-rejected"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Rad etilgan
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
