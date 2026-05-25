/** @module Applications @description Route-level page component for Applications. Owns state, queries, mutations, and top-level layout. */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  applicationSchema,
  type Application,
  type ApplicationQuestion,
  type ApplicationResponse,
  type Department,
  type Position,
  type UserStub,
  type UpdateResponsePayload,
} from "./ApplicationsTypes";
import { CreateFormCard } from "./ApplicationsSections";
import { AuthErrorScreen, LoadingScreen, ErrorScreen } from "./ApplicationsStatus";
import { TemplatesTable, ResponsesTable } from "./ApplicationsTable";
import { ReviewDialog } from "./ApplicationsDialogs";
import { useTranslation } from '@/lib/i18n';

import { tLabel } from "@/lib/i18n/tLabel";
export default function Applications() {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  // Auth
  const { data: currentUser, isLoading: authLoading, error: authError } = useQuery<{
    id: string;
    fullName?: string;
    email?: string;
  } | null>({ queryKey: ["/api/auth/me"] });

  const userId = currentUser?.id;

  // Form state
  const [title, setTitle] = useState("");
  const [titleRu, setTitleRu] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionRu, setDescriptionRu] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [dueDays, setDueDays] = useState<number | "">("");
  const [questions, setQuestions] = useState<ApplicationQuestion[]>([]);

  // Review dialog state
  const [selectedResponse, setSelectedResponse] = useState<ApplicationResponse | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewResponse, setReviewResponse] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>("");

  // Queries
  const {
    data: applications = [],
    isLoading,
    isError: isApplicationsError,
    refetch: refetchApplications,
    error: applicationsError,
  } = useQuery<Application[]>({ queryKey: ["/api/applications"], enabled: !!userId });

  const { data: responses = [], isLoading: responsesLoading } = useQuery<ApplicationResponse[]>({
    queryKey: ["/api/application-responses"],
    enabled: !!userId,
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
    enabled: !!userId,
  });

  const { data: positions = [] } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
    enabled: !!userId,
  });

  const { data: users = [] } = useQuery<UserStub[]>({
    queryKey: ["/api/users"],
    enabled: !!userId,
  });

  // Mutations
  const createApplicationMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (!userId) throw new Error(tLabel('common.autentifikatsiyaTalabQilinadi', "Autentifikatsiya talab qilinadi"));
      return apiRequest("POST", "/api/applications", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({ title: tLabel('common.arizaShablonYaratildi', "Ariza shablon yaratildi"), description: "Xodimlar endi arizani to'ldirishlari mumkin" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message || "Ariza yaratishda xatolik", variant: "destructive" });
    },
  });

  const deleteApplicationMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error(tLabel('common.autentifikatsiyaTalabQilinadi', "Autentifikatsiya talab qilinadi"));
      return apiRequest("DELETE", `/api/applications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({ title: "Ariza o'chirildi" });
    },
    onError: () => {
      toast({ title: "Xatolik", variant: "destructive" });
    },
  });

  const updateResponseMutation = useMutation({
    mutationFn: async ({ id, status, notes, response, assignedTo: at }: UpdateResponsePayload) => {
      if (!userId) throw new Error(tLabel('common.autentifikatsiyaTalabQilinadi', "Autentifikatsiya talab qilinadi"));
      return apiRequest("PATCH", `/api/application-responses/${id}`, { status, notes, response, assignedTo: at, reviewedBy: userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/application-responses"] });
      toast({ title: tLabel('common.arizaYangilandi', "Ariza yangilandi") });
      setReviewDialogOpen(false);
      setSelectedResponse(null);
      setReviewNotes("");
      setReviewResponse("");
    },
    onError: () => {
      toast({ title: "Xatolik", variant: "destructive" });
    },
  });

  // Helpers
  const addQuestion = () => {
    const newQ: ApplicationQuestion = { id: crypto.randomUUID(), question: "", questionRu: "", type: "text", required: true };
    setQuestions((prev) => [...(Array.isArray(prev) ? prev : []), newQ]);
  };

  const updateQuestion = (id: string, field: string, value: string | boolean | string[]) => {
    setQuestions((prev) => (Array.isArray(prev) ? prev : []).map((q) => (q.id === id ? { ...q, [field]: value } : q)));
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => (Array.isArray(prev) ? prev : []).filter((q) => q.id !== id));
  };

  const resetForm = () => {
    setTitle(""); setTitleRu(""); setDescription(""); setDescriptionRu("");
    setDepartmentId(""); setPositionId(""); setDueDays(""); setQuestions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) { toast({ title: "Xatolik", description: tLabel('common.autentifikatsiyaTalabQilinadi', "Autentifikatsiya talab qilinadi"), variant: "destructive" }); return; }
    const result = applicationSchema.safeParse({ title, questions });
    if (!result.success) {
      const msg = result.error.errors.map((err) => err.message).join(", ");
      toast({ title: "Xatolik", description: msg, variant: "destructive" });
      return;
    }
    createApplicationMutation.mutate({
      title, titleRu, description, descriptionRu,
      departmentId: departmentId || undefined,
      positionId: positionId || undefined,
      dueDays: dueDays !== "" ? Number(dueDays) : undefined,
      questions, isActive: true,
    });
  };

  const handleApprove = () => {
    if (!selectedResponse) return;
    updateResponseMutation.mutate({ id: selectedResponse.id, status: "approved", notes: reviewNotes, response: reviewResponse });
  };

  const handleReject = () => {
    if (!selectedResponse) return;
    updateResponseMutation.mutate({ id: selectedResponse.id, status: "rejected", notes: reviewNotes, response: reviewResponse });
  };

  // Early returns
  if (authError) return <AuthErrorScreen />;
  if (authLoading || isLoading) return <LoadingScreen />;
  if (applicationsError) return <ErrorScreen />;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div>
        <h1 className="ep-h1">{t("arizalar")}</h1>
        <p className="text-muted-foreground">{t("xodimlarUchunArizaShablonlariniYaratish")}</p>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-1 sm:grid-cols-2">
          <TabsTrigger value="templates" data-testid="tab-templates">{t("arizaShablonlari")}</TabsTrigger>
          <TabsTrigger value="responses" data-testid="tab-responses">{t("yuborilganArizalar1")}</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <CreateFormCard
            title={title} onTitleChange={setTitle}
            titleRu={titleRu} onTitleRuChange={setTitleRu}
            description={description} onDescriptionChange={setDescription}
            descriptionRu={descriptionRu} onDescriptionRuChange={setDescriptionRu}
            departmentId={departmentId} onDepartmentChange={setDepartmentId}
            positionId={positionId} onPositionChange={setPositionId}
            dueDays={dueDays} onDueDaysChange={setDueDays}
            questions={questions}
            onAddQuestion={addQuestion}
            onUpdateQuestion={updateQuestion}
            onRemoveQuestion={removeQuestion}
            onSubmit={handleSubmit}
            isSubmitting={createApplicationMutation.isPending}
            departments={departments}
            positions={positions}
          />

          <Card>
            <CardHeader><CardTitle>{t("mavjudArizalar")}</CardTitle></CardHeader>
            <CardContent>
              <TemplatesTable
                applications={applications}
                isLoading={isLoading}
                isError={isApplicationsError}
                onRetry={refetchApplications}
                onDelete={(id) => deleteApplicationMutation.mutate(id)}
                isDeletePending={deleteApplicationMutation.isPending}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("yuborilganArizalar1")}</CardTitle>
              <CardDescription>{t("xodimlarTomonidanYuborilganArizalarniKoring")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsesTable
                responses={responses}
                applications={applications}
                isLoading={responsesLoading}
                onReview={(response) => {
                  setSelectedResponse(response);
                  setAssignedTo(response.assignedTo || "");
                  setReviewDialogOpen(true);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        selectedResponse={selectedResponse}
        applications={applications}
        users={users}
        reviewNotes={reviewNotes}
        onReviewNotesChange={setReviewNotes}
        reviewResponse={reviewResponse}
        onReviewResponseChange={setReviewResponse}
        assignedTo={assignedTo}
        onAssignedToChange={setAssignedTo}
        onAssign={(responseId, userId) =>
          updateResponseMutation.mutate({ id: responseId, assignedTo: userId })
        }
        onApprove={handleApprove}
        onReject={handleReject}
        isPending={updateResponseMutation.isPending}
      />
    </div>
  );
}
