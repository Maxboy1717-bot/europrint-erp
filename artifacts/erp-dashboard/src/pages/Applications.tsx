import { useState } from "react";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FileText, Plus, Trash2, Eye, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { PageState } from "@/components/ui/page-state";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ApplicationQuestion {
  id: string;
  question: string;
  questionRu: string;
  type: "text" | "choice";
  required: boolean;
  options?: string[];
}

interface Application {
  id: string;
  title: string;
  titleRu: string | null;
  description: string | null;
  descriptionRu: string | null;
  questions: ApplicationQuestion[];
  isActive: boolean;
  createdAt: string;
}

interface ApplicationResponse {
  id: string;
  applicationId: string;
  userId: string;
  answers: { questionId: string; answer: string }[];
  status: "pending" | "approved" | "rejected";
  assignedTo: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  notes: string | null;
  response: string | null;
  submittedAt: string;
}

const applicationSchema = z.object({
  title: z.string().min(1, "Ariza nomini kiriting"),
  questions: z.array(z.unknown()).min(1, "Kamida bitta savol qo'shish majburiy"),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

export default function Applications() {
  const { toast } = useToast();

  // Get current user from session
  const { data: currentUser, isLoading: authLoading, error: authError } = useQuery<{ id: string; fullName?: string; email?: string } | null>({
    queryKey: ["/api/auth/me"],
  });

  const userId = currentUser?.id;

  // Form states
  const [title, setTitle] = useState("");
  const [titleRu, setTitleRu] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionRu, setDescriptionRu] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [dueDays, setDueDays] = useState<number | "">("");
  const [questions, setQuestions] = useState<ApplicationQuestion[]>([]);
  
  // Response review dialog
  const [selectedResponse, setSelectedResponse] = useState<ApplicationResponse | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewResponse, setReviewResponse] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>("");

  const { data: applications = [], isLoading, isError: isApplicationsError, refetch: refetchApplications, error: applicationsError } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
    enabled: !!userId,
  });

  const { data: responses = [], isLoading: responsesLoading } = useQuery<ApplicationResponse[]>({
    queryKey: ["/api/application-responses"],
    enabled: !!userId,
  });

  const { data: departments = [] } = useQuery<{ id: string; name: string; nameRu: string }[]>({
    queryKey: ["/api/departments"],
    enabled: !!userId,
  });

  const { data: positions = [] } = useQuery<{ id: string; name: string; nameRu: string }[]>({
    queryKey: ["/api/positions"],
    enabled: !!userId,
  });

  const { data: users = [] } = useQuery<{ id: string; fullName: string; employeeId: string }[]>({
    queryKey: ["/api/users"],
    enabled: !!userId,
  });

  const createApplicationMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (!userId) {
        throw new Error("Autentifikatsiya talab qilinadi");
      }
      const res = await apiRequest("POST", "/api/applications", data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({
        title: "Ariza shablon yaratildi",
        description: "Xodimlar endi arizani to'ldirishlari mumkin",
      });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Xatolik",
        description: error.message || "Ariza yaratishda xatolik",
        variant: "destructive",
      });
    },
  });

  const deleteApplicationMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) {
        throw new Error("Autentifikatsiya talab qilinadi");
      }
      const res = await apiRequest("DELETE", `/api/applications/${id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({
        title: "Ariza o'chirildi",
      });
    },
  });

  const updateResponseMutation = useMutation({
    mutationFn: async ({ id, status, notes, response, assignedTo }: { id: string; status?: string; notes?: string; response?: string; assignedTo?: string | null }) => {
      if (!userId) {
        throw new Error("Autentifikatsiya talab qilinadi");
      }
      const res = await apiRequest("PATCH", `/api/application-responses/${id}`, {
        status,
        notes,
        response,
        assignedTo,
        reviewedBy: userId,
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/application-responses"] });
      toast({
        title: "Ariza yangilandi",
      });
      setReviewDialogOpen(false);
      setSelectedResponse(null);
      setReviewNotes("");
      setReviewResponse("");
    },
  });

  const addQuestion = () => {
    const newQuestion: ApplicationQuestion = {
      id: crypto.randomUUID(),
      question: "",
      questionRu: "",
      type: "text",
      required: true,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, field: string, value: string | boolean | string[]) => {
    setQuestions((Array.isArray(questions) ? questions : []).map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const removeQuestion = (id: string) => {
    setQuestions((Array.isArray(questions) ? questions : []).filter(q => q.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast({
        title: "Xatolik",
        description: "Autentifikatsiya talab qilinadi",
        variant: "destructive",
      });
      return;
    }

    // Validate form data using Zod schema
    const validationResult = applicationSchema.safeParse({ title, questions });

    if (!validationResult.success) {
      const errors = validationResult.error.errors;
      const errorMessage = (Array.isArray(errors) ? errors : []).map(err => err.message).join(", ");
      toast({
        title: "Xatolik",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    createApplicationMutation.mutate({
      title,
      titleRu,
      description,
      descriptionRu,
      departmentId: departmentId || undefined,
      positionId: positionId || undefined,
      dueDays: dueDays !== "" ? Number(dueDays) : undefined,
      questions,
      isActive: true,
    });
  };

  const resetForm = () => {
    setTitle("");
    setTitleRu("");
    setDescription("");
    setDescriptionRu("");
    setDepartmentId("");
    setPositionId("");
    setDueDays("");
    setQuestions([]);
  };

  const handleApprove = () => {
    if (!selectedResponse) return;
    updateResponseMutation.mutate({
      id: selectedResponse.id,
      status: "approved",
      notes: reviewNotes,
      response: reviewResponse,
    });
  };

  const handleReject = () => {
    if (!selectedResponse) return;
    updateResponseMutation.mutate({
      id: selectedResponse.id,
      status: "rejected",
      notes: reviewNotes,
      response: reviewResponse,
    });
  };

  // Show auth error if session invalid
  if (authError) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Autentifikatsiya xatosi</CardTitle>
            <CardDescription>Tizimga kirishda muammo yuz berdi</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Sessiya yaroqsiz yoki muddati tugagan. Iltimos, qayta kiring.
            </p>
            <Button onClick={() => window.location.href = '/'} className="w-full" data-testid="button-reload">
              Sahifani yangilash
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-spinner">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (applicationsError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2" data-testid="error-state">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">Ma'lumotlarni yuklashda xatolik yuz berdi</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Arizalar</h1>
        <p className="text-muted-foreground">
          Xodimlar uchun ariza shablonlarini yaratish va yuborilgan arizalarni ko'rish
        </p>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="templates" data-testid="tab-templates">
            Ariza shablonlari
          </TabsTrigger>
          <TabsTrigger value="responses" data-testid="tab-responses">
            Yuborilgan arizalar
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Yangi ariza shablon</CardTitle>
              <CardDescription>
                Xodimlar to'ldiradigan ariza shablonini yarating
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Ariza nomi (O'zbek) *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Masalan: Ta'til arizasi"
                      data-testid="input-application-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="titleRu">Ariza nomi (Rus)</Label>
                    <Input
                      id="titleRu"
                      value={titleRu}
                      onChange={(e) => setTitleRu(e.target.value)}
                      placeholder="Например: Заявление на отпуск"
                      data-testid="input-application-title-ru"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Tavsif (O'zbek)</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ariza haqida qisqacha ma'lumot..."
                      rows={3}
                      data-testid="textarea-application-description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descriptionRu">Tavsif (Rus)</Label>
                    <Textarea
                      id="descriptionRu"
                      value={descriptionRu}
                      onChange={(e) => setDescriptionRu(e.target.value)}
                      placeholder="Краткая информация о заявлении..."
                      rows={3}
                      data-testid="textarea-application-description-ru"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Bo'lim (ixtiyoriy)</Label>
                    <Select value={departmentId || "all"} onValueChange={(val) => setDepartmentId(val === "all" ? "" : val)}>
                      <SelectTrigger data-testid="select-department">
                        <SelectValue placeholder="Bo'limni tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Barcha bo'limlar</SelectItem>
                        {(Array.isArray(departments) ? departments : []).map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Lavozim (ixtiyoriy)</Label>
                    <Select value={positionId || "all"} onValueChange={(val) => setPositionId(val === "all" ? "" : val)}>
                      <SelectTrigger data-testid="select-position">
                        <SelectValue placeholder="Lavozimni tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Barcha lavozimlar</SelectItem>
                        {(Array.isArray(positions) ? positions : []).map((pos) => (
                          <SelectItem key={pos.id} value={pos.id}>
                            {pos.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDays">Ko'rib chiqish muddati (ish kunlari, ixtiyoriy)</Label>
                    <Input
                      id="dueDays"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Masalan: 3 ish kuni"
                      value={dueDays}
                      onChange={(e) => setDueDays(e.target.value ? parseInt(e.target.value) : "")}
                      data-testid="input-due-days"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Savollar *</Label>
                    <Button
                      type="button"
                      onClick={addQuestion}
                      size="sm"
                      data-testid="button-add-question"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Savol qo'shish
                    </Button>
                  </div>

                  {(Array.isArray(questions) ? questions : []).map((q, index) => (
                    <Card key={q.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Savol {index + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(q.id)}
                            data-testid={`button-remove-question-${index}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            placeholder="Savol matni (O'zbek)"
                            value={q.question}
                            onChange={(e) => updateQuestion(q.id, "question", e.target.value)}
                            data-testid={`input-question-text-${index}`}
                          />
                          <Input
                            placeholder="Savol matni (Rus)"
                            value={q.questionRu}
                            onChange={(e) => updateQuestion(q.id, "questionRu", e.target.value)}
                            data-testid={`input-question-text-ru-${index}`}
                          />
                        </div>

                        <div className="flex gap-3">
                          <Select
                            value={q.type}
                            onValueChange={(value) => updateQuestion(q.id, "type", value)}
                          >
                            <SelectTrigger data-testid={`select-question-type-${index}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Matn</SelectItem>
                              <SelectItem value="choice">Ko'p tanlovli</SelectItem>
                            </SelectContent>
                          </Select>

                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={q.required}
                              onChange={(e) => updateQuestion(q.id, "required", e.target.checked)}
                              data-testid={`checkbox-question-required-${index}`}
                            />
                            <span className="text-sm">Majburiy</span>
                          </label>
                        </div>

                        {q.type === "choice" && (
                          <Textarea
                            placeholder="Variantlar (har birini yangi qatordan yozing)"
                            value={q.options?.join("\n") || ""}
                            onChange={(e) => updateQuestion(q.id, "options", e.target.value.split("\n").filter(Boolean))}
                            rows={3}
                            data-testid={`textarea-question-options-${index}`}
                          />
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                <Button
                  type="submit"
                  disabled={createApplicationMutation.isPending}
                  data-testid="button-create-application"
                >
                  {createApplicationMutation.isPending ? "Yaratilmoqda..." : "Yaratish"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Existing Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Mavjud arizalar</CardTitle>
            </CardHeader>
            <CardContent>
              <PageState
                isLoading={isLoading}
                isError={isApplicationsError}
                isEmpty={applications.length === 0}
                onRetry={refetchApplications}
                skeleton="table"
                skeletonRows={4}
                skeletonColumns={4}
                errorTitle="Arizalar yuklanmadi"
                errorMessage="Server bilan bog'lanishda xatolik."
                emptyIcon={FileText}
                emptyTitle="Hozircha ariza yo'q"
                emptyDescription="Yangi ariza shabloni yarating."
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ariza nomi</TableHead>
                      <TableHead>Savollar soni</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Yaratilgan sana</TableHead>
                      <TableHead className="text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(applications) ? applications : []).map((app) => (
                      <TableRow key={app.id} data-testid={`row-application-${app.id}`}>
                        <TableCell className="font-medium">{app.title}</TableCell>
                        <TableCell>{app.questions.length}</TableCell>
                        <TableCell>
                          <Badge variant={app.isActive ? "default" : "secondary"}>
                            {app.isActive ? "Aktiv" : "No'ktiv"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(app.createdAt).toLocaleDateString("uz-UZ")}
                        </TableCell>
                        <TableCell className="text-right">
                          <DeleteConfirmDialog
                            title="Arizani o'chirishni tasdiqlaysizmi?"
                            description="Ariza va unga bog'liq barcha ma'lumotlar o'chiriladi."
                            onConfirm={() => deleteApplicationMutation.mutate(app.id)}
                            isPending={deleteApplicationMutation.isPending}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </PageState>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Responses Tab */}
        <TabsContent value="responses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Yuborilgan arizalar</CardTitle>
              <CardDescription>
                Xodimlar tomonidan yuborilgan arizalarni ko'ring va tasdiqlang
              </CardDescription>
            </CardHeader>
            <CardContent>
              {responsesLoading ? (
                <p className="text-muted-foreground">Yuklanmoqda...</p>
              ) : responses.length === 0 ? (
                <p className="text-muted-foreground">Hozircha ariza yo'q</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Xodim ID</TableHead>
                      <TableHead>Ariza</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Yuborilgan sana</TableHead>
                      <TableHead className="text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(responses) ? responses : []).map((response) => {
                      const application = (Array.isArray(applications) ? applications : []).find(a => a.id === response.applicationId);
                      return (
                        <TableRow key={response.id} data-testid={`row-response-${response.id}`}>
                          <TableCell>{response.userId.substring(0, 8)}</TableCell>
                          <TableCell>{application?.title || "N/A"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                response.status === "approved" ? "default" :
                                response.status === "rejected" ? "destructive" :
                                "secondary"
                              }
                            >
                              {response.status === "pending" ? "Kutilmoqda" :
                               response.status === "approved" ? "Tasdiqlandi" :
                               "Rad etildi"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(response.submittedAt).toLocaleDateString("uz-UZ")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedResponse(response);
                                setAssignedTo(response.assignedTo || "");
                                setReviewDialogOpen(true);
                              }}
                              data-testid={`button-review-${response.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Arizani ko'rish</DialogTitle>
            <DialogDescription>
              Xodim tomonidan yuborilgan ariza tafsilotlari
            </DialogDescription>
          </DialogHeader>
          
          {selectedResponse && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Javoblar:</h3>
                {(Array.isArray(selectedResponse.answers) ? selectedResponse.answers : []).map((ans, idx) => {
                  const application = (Array.isArray(applications) ? applications : []).find(a => a.id === selectedResponse.applicationId);
                  const question = application?.questions?.find(q => q.id === ans.questionId);
                  return (
                    <div key={idx} className="mb-3 p-3 bg-muted rounded">
                      <p className="text-sm text-muted-foreground mb-1">
                        {question?.question || "Savol topilmadi"}
                      </p>
                      <p className="font-medium">{ans.answer}</p>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewNotes">Izohlar (ixtiyoriy, faqat HR ko'radi)</Label>
                <Textarea
                  id="reviewNotes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="HR uchun eslatmalar..."
                  rows={3}
                  data-testid="textarea-review-notes"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewResponse">Xodimga javob (ixtiyoriy)</Label>
                <Textarea
                  id="reviewResponse"
                  value={reviewResponse}
                  onChange={(e) => setReviewResponse(e.target.value)}
                  placeholder="Xodimga ko'rinadigan javob yoki izoh..."
                  rows={3}
                  data-testid="textarea-review-response"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTo">Mas'ul xodim (ixtiyoriy)</Label>
                <Select value={assignedTo} onValueChange={(value) => {
                  setAssignedTo(value);
                  if (selectedResponse) {
                    updateResponseMutation.mutate({
                      id: selectedResponse.id,
                      assignedTo: value === "none" ? null : value,
                    });
                  }
                }}>
                  <SelectTrigger data-testid="select-assigned-to">
                    <SelectValue placeholder="Xodimni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tanlangan xodim yo'q</SelectItem>
                    {(Array.isArray(users) ? users : []).map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.fullName} ({user.employeeId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={updateResponseMutation.isPending}
                  data-testid="button-reject-application"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rad etish
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={updateResponseMutation.isPending}
                  data-testid="button-approve-application"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Tasdiqlash
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
