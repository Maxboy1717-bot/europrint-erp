import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { Mic, Plus, Search, Clock, Calendar, User, ChevronRight, Play, CheckCircle, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDateTime } from "@/lib/format";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AIInterview, InterviewsResponse, InterviewQuestion2, InterviewFormData, interviewSchema, getStatusBadge, getProviderBadge, formatDuration, InterviewCardSkeleton } from "./AIInterviewPageTypes";
import { InterviewDetailView, AddQuestionForm, QuestionBankList, CreateInterviewForm } from "./AIInterviewPageSections";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function AIInterviewPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<AIInterview | null>(null);
  const [confirmDeleteQId, setConfirmDeleteQId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"interviews" | "questions">("interviews");
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [qForm, setQForm] = useState({
    question: "",
    question_ru: "",
    question_en: "",
    category: "general",
    difficulty: "medium",
    max_score: "10",
    job_title: "",
  });

  const interviewForm = useForm<InterviewFormData>({
    resolver: zodResolver(interviewSchema),
    defaultValues: { candidateId: "", jobTitle: "", language: "uz", scheduledAt: "" },
  });

  const { data, isLoading, isError, error, refetch } = useQuery<InterviewsResponse>({
    queryKey: ["/api/ai-hr/interviews?page=1&limit=20"],
  });

  const { data: questionsData } = useQuery<InterviewQuestion2[]>({
    queryKey: ["/api/hr-v2/ai-interview/questions"],
    enabled: activeTab === "questions",
  });

  const addQuestionMutation = useMutation({
    mutationFn: (q: typeof qForm) => apiRequest("POST", "/api/hr-v2/ai-interview/questions", {
      question: q.question,
      question_uz: q.question,
      question_ru: q.question_ru || undefined,
      question_en: q.question_en || undefined,
      category: q.category,
      difficulty: q.difficulty,
      max_score: parseInt(q.max_score) || 10,
      job_title: q.job_title || undefined,
    }),
    onSuccess: () => {
      toast({ title: "Savol qo'shildi" });
      setShowAddQuestion(false);
      setQForm({ question: "", question_ru: "", question_en: "", category: "general", difficulty: "medium", max_score: "10", job_title: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/hr-v2/ai-interview/questions"] });
    },
    onError: (e: Error) => toast({ title: "Xatolik", description: e.message, variant: "destructive" }),
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/hr-v2/ai-interview/questions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr-v2/ai-interview/questions"] });
    },
  });

  const interviews = data?.interviews || [];

  const createMutation = useMutation({
    mutationFn: (newInterview: InterviewFormData) =>
      apiRequest("POST", "/api/ai-hr/interviews", newInterview),
    onSuccess: () => {
      toast({ title: "Muvaffaqiyat", description: "Yangi intervyu muvaffaqiyatli yaratildi" });
      setShowCreateForm(false);
      interviewForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/ai-hr/interviews"] });
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message || "Intervyu yaratishda xatolik yuz berdi", variant: "destructive" });
    },
  });

  const filteredInterviews = (Array.isArray(interviews) ? interviews : []).filter((interview) => {
    if (statusFilter !== "all" && interview.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        interview.sessionId?.toLowerCase().includes(query) ||
        interview.candidateId?.toLowerCase().includes(query) ||
        interview.candidateName?.toLowerCase().includes(query) ||
        interview.jobTitle?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const onSubmit = (values: InterviewFormData) => {
    createMutation.mutate(values);
  };

  if (isError) {
    return <EPErrorState onRetry={refetch}  error={error} />;
  }

  if (selectedInterview) {
    return (
      <InterviewDetailView
        interview={selectedInterview}
        onClose={() => setSelectedInterview(null)}
      />
    );
  }

  if (isLoading) {
    return (
      <ModulePage
        module="ai"
        title={t("aiIntervyu")}
        subtitle={t("suniyIntellektYordamidaAvtomatikIntervyu")}
        icon={<Mic className="h-5 w-5" />}
        actions={<Skeleton className="h-9 w-36 rounded-lg" />}
      >
        <Skeleton className="h-9 w-full max-w-sm mb-4 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {([1, 2, 3, 4, 5, 6]).map((i) => (
            <InterviewCardSkeleton key={`k-${i}`} />
          ))}
        </div>
      </ModulePage>
    );
  }

  return (
    <ModulePage
      module="ai"
      title={t("aiIntervyu")}
      subtitle={t("suniyIntellektYordamidaAvtomatikIntervyu")}
      icon={<Mic className="h-5 w-5" />}
      actions={
        <div className="flex gap-2">
          {activeTab === "questions" ? (
            <Button data-testid="button-add-question" onClick={() => setShowAddQuestion(!showAddQuestion)}>
              <Plus className="h-4 w-4 mr-2" /> {t("savolQoshish")}
            </Button>
          ) : (
            <Button data-testid="button-new-interview" onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus className="h-4 w-4 mr-2" /> {t("yangiIntervyu")}
            </Button>
          )}
        </div>
      }
    >
      <div className="flex gap-2 mb-4 border-b border-border pb-2">
        <Button
          variant={activeTab === "interviews" ? "default" : "ghost"}
          size="sm"
          data-testid="tab-interviews"
          onClick={() => setActiveTab("interviews")}
        >
          <Mic className="h-4 w-4 mr-2" /> {t("intervyular")}
        </Button>
        <Button
          variant={activeTab === "questions" ? "default" : "ghost"}
          size="sm"
          data-testid="tab-questions"
          onClick={() => setActiveTab("questions")}
        >
          <BookOpen className="h-4 w-4 mr-2" /> {t("savolBanki")}
        </Button>
      </div>

      {activeTab === "questions" && (
        <div className="space-y-4">
          {showAddQuestion && (
            <AddQuestionForm
              qForm={qForm}
              setQForm={setQForm}
              onSubmit={(e) => { e.preventDefault(); addQuestionMutation.mutate(qForm); }}
              isPending={addQuestionMutation.isPending}
              onCancel={() => setShowAddQuestion(false)}
            />
          )}
          <QuestionBankList
            questions={questionsData || []}
            onDeleteClick={(id) => setConfirmDeleteQId(id)}
          />
        </div>
      )}

      {activeTab === "interviews" && (
        <div>
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              {(["all", "scheduled", "in_progress", "completed"]).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  data-testid={`button-filter-${status}`}
                  onClick={() => setStatusFilter(status)}
                  className="toggle-elevate"
                >
                  {status === "all" && "Barchasi"}
                  {status === "scheduled" && "Rejalashtirilgan"}
                  {status === "in_progress" && "Jarayonda"}
                  {status === "completed" && "Tugallangan"}
                </Button>
              ))}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("Qidirish...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
            </div>
          </div>

          {showCreateForm && (
            <CreateInterviewForm
              form={interviewForm}
              onSubmit={onSubmit}
              isPending={createMutation.isPending}
              onCancel={() => setShowCreateForm(false)}
            />
          )}

          {filteredInterviews.length === 0 ? (
            <div className="text-center py-12">
              <Mic className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all"
                  ? "Mos intervyular topilmadi"
                  : "Hozircha intervyular mavjud emas"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(Array.isArray(filteredInterviews) ? filteredInterviews : []).map((interview) => (
                <Card key={interview.id} data-testid={`card-interview-${interview.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm font-mono truncate max-w-[180px]" data-testid={`text-session-${interview.id}`}>
                        {interview.sessionId?.slice(0, 12)}...
                      </CardTitle>
                      {getStatusBadge(interview.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span data-testid={`text-candidate-${interview.id}`}>
                        {interview.candidateName || interview.candidateId}
                      </span>
                    </div>
                    {interview.jobTitle && (
                      <p className="text-sm font-medium" data-testid={`text-job-${interview.id}`}>
                        {interview.jobTitle}
                      </p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {getProviderBadge(interview.provider)}
                      {interview.language && (
                        <Badge variant="outline" data-testid={`badge-lang-${interview.id}`}>
                          {interview.language === "uz" ? "UZ" : "RU"}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {interview.scheduledAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Reja: {formatDateTime(interview.scheduledAt)}</span>
                        </div>
                      )}
                      {interview.startedAt && (
                        <div className="flex items-center gap-1">
                          <Play className="h-3 w-3" />
                          <span>Boshlangan: {formatDateTime(interview.startedAt)}</span>
                        </div>
                      )}
                      {interview.completedAt && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>Tugallangan: {formatDateTime(interview.completedAt)}</span>
                        </div>
                      )}
                      {interview.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration(interview.duration)}</span>
                        </div>
                      )}
                    </div>
                    {interview.status === "completed" && (
                      <Button
                        variant="outline"
                        className="w-full"
                        data-testid={`button-view-interview-${interview.id}`}
                        onClick={() => setSelectedInterview(interview)}
                      >
                        {t("view")}
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteQId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteQId(null); }}
        title={t("savolniOchirish")}
        description={t("ushbuSavolniOchirishniTasdiqlaysizmiBu")}
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => { if (confirmDeleteQId !== null) deleteQuestionMutation.mutate(confirmDeleteQId); }}
      />
    </ModulePage>
  );
}
