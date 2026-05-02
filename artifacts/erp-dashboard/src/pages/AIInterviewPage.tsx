import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mic,
  Plus,
  Search,
  Clock,
  Calendar,
  User,
  ChevronRight,
  X,
  Play,
  CheckCircle,
  MessageSquare,
  Star,
  Volume2,
  Video,
  BookOpen,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDateTime } from "@/lib/format";
import { ErrorState } from "@/components/ui/error-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface InterviewTranscriptMessage {
  speaker: string;
  text: string;
  timestamp?: string;
}

interface InterviewEvaluation {
  overallScore?: number;
  strengths?: string[];
  weaknesses?: string[];
  recommendation?: string;
}

interface InterviewQuestion {
  question: string;
  answer?: string;
  score?: number;
  maxScore?: number;
}

interface AIInterview {
  id: string;
  sessionId: string;
  candidateId: string;
  candidateName?: string;
  jobTitle?: string;
  status: "scheduled" | "in_progress" | "completed";
  provider?: string;
  language?: string;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  transcript?: InterviewTranscriptMessage[];
  evaluation?: InterviewEvaluation;
  questions?: InterviewQuestion[];
  audioUrl?: string;
  videoUrl?: string;
}

interface InterviewsResponse {
  interviews: AIInterview[];
  total: number;
  page: number;
  limit: number;
}

const interviewSchema = z.object({
  candidateId: z.string().min(1, "Nomzod ID majburiy"),
  jobTitle: z.string().min(1, "Lavozim majburiy"),
  language: z.string().default("uz"),
  scheduledAt: z.string().min(1, "Sana va vaqt majburiy"),
});

type InterviewFormData = z.infer<typeof interviewSchema>;

const getStatusBadge = (status: string) => {
  switch (status) {
    case "scheduled":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Rejalashtirilgan</Badge>;
    case "in_progress":
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">Jarayonda</Badge>;
    case "completed":
      return <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">Tugallangan</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getProviderBadge = (provider?: string) => {
  if (!provider) return null;
  switch (provider) {
    case "gemini":
      return <Badge variant="secondary">Gemini</Badge>;
    case "openai":
      return <Badge variant="secondary">OpenAI</Badge>;
    default:
      return <Badge variant="secondary">{provider}</Badge>;
  }
};

const InterviewCardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-9 w-full mt-2" />
      </div>
    </CardContent>
  </Card>
);

interface InterviewQuestion2 {
  id: number;
  job_title?: string;
  question: string;
  question_uz?: string;
  question_ru?: string;
  question_en?: string;
  category?: string;
  difficulty?: string;
  max_score?: number;
}

export default function AIInterviewPage() {
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

  const { data, isLoading, isError, refetch} = useQuery<InterviewsResponse>({
    queryKey: ["/api/ai-hr/interviews?page=1&limit=20"],
  });

  const { data: questionsData, refetch: refetchQuestions } = useQuery<InterviewQuestion2[]>({
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
      toast({
        title: "Muvaffaqiyat",
        description: "Yangi intervyu muvaffaqiyatli yaratildi",
      });
      setShowCreateForm(false);
      interviewForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/ai-hr/interviews"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Xatolik",
        description: error.message || "Intervyu yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
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


  const formatDuration = (seconds?: number) => {
    if (!seconds) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} daqiqa ${secs} soniya`;
  };

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  if (selectedInterview) {
    return (
      <ModulePage
        module="ai"
        title="AI Intervyu"
        subtitle="Sun'iy intellekt yordamida avtomatik intervyu o'tkazish"
        icon={<Mic className="h-5 w-5" />}
        actions={
          <Button
            variant="outline"
            data-testid="button-close-detail"
            onClick={() => setSelectedInterview(null)}
          >
            <X className="h-4 w-4 mr-2" />
            Yopish
          </Button>
        }
      >
        <Card data-testid="card-interview-detail">
          <CardHeader>
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <CardTitle className="text-lg">
                Intervyu: {selectedInterview.sessionId?.slice(0, 12)}...
              </CardTitle>
              {getStatusBadge(selectedInterview.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Nomzod ID</p>
                <p className="font-medium" data-testid="text-detail-candidate">{selectedInterview.candidateId}</p>
              </div>
              {selectedInterview.candidateName && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Nomzod ismi</p>
                  <p className="font-medium">{selectedInterview.candidateName}</p>
                </div>
              )}
              {selectedInterview.jobTitle && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Lavozim</p>
                  <p className="font-medium">{selectedInterview.jobTitle}</p>
                </div>
              )}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Til</p>
                <p className="font-medium">{selectedInterview.language === "uz" ? "O'zbek" : "Rus"}</p>
              </div>
              {selectedInterview.provider && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Provider</p>
                  <div>{getProviderBadge(selectedInterview.provider)}</div>
                </div>
              )}
              {selectedInterview.scheduledAt && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Rejalashtirilgan</p>
                  <p className="font-medium">{formatDateTime(selectedInterview.scheduledAt)}</p>
                </div>
              )}
              {selectedInterview.startedAt && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Boshlangan</p>
                  <p className="font-medium">{formatDateTime(selectedInterview.startedAt)}</p>
                </div>
              )}
              {selectedInterview.completedAt && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Tugallangan</p>
                  <p className="font-medium">{formatDateTime(selectedInterview.completedAt)}</p>
                </div>
              )}
              {selectedInterview.duration && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Davomiyligi</p>
                  <p className="font-medium">{formatDuration(selectedInterview.duration)}</p>
                </div>
              )}
            </div>

            {(selectedInterview.audioUrl || selectedInterview.videoUrl) && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Media
                </h3>
                <div className="flex gap-3 flex-wrap">
                  {selectedInterview.audioUrl && (
                    <a href={selectedInterview.audioUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" data-testid="button-audio-link">
                        <Volume2 className="h-4 w-4 mr-2" />
                        Audio
                      </Button>
                    </a>
                  )}
                  {selectedInterview.videoUrl && (
                    <a href={selectedInterview.videoUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" data-testid="button-video-link">
                        <Video className="h-4 w-4 mr-2" />
                        Video
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            )}

            {selectedInterview.transcript && selectedInterview.transcript.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Transkript
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {(Array.isArray(selectedInterview.transcript) ? selectedInterview.transcript : []).map((msg, idx) => (
                    <div
                      key={idx}
                      data-testid={`transcript-message-${idx}`}
                      className={`p-3 rounded-lg ${
                        msg.speaker === "ai"
                          ? "bg-muted/50 ml-0 mr-8"
                          : "bg-primary/5 ml-8 mr-0"
                      }`}
                    >
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        {msg.speaker === "ai" ? "AI" : "Nomzod"}
                        {msg.timestamp && ` - ${msg.timestamp}`}
                      </p>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedInterview.evaluation && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Baholash
                </h3>
                <Card>
                  <CardContent className="p-4 space-y-4">
                    {selectedInterview.evaluation.overallScore !== undefined && (
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">Umumiy ball:</span>
                        <Badge data-testid="badge-overall-score">
                          {selectedInterview.evaluation.overallScore}/100
                        </Badge>
                      </div>
                    )}
                    {selectedInterview.evaluation.strengths && selectedInterview.evaluation.strengths.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 text-green-600 dark:text-green-400">Kuchli tomonlar:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          {(Array.isArray(selectedInterview.evaluation.strengths) ? selectedInterview.evaluation.strengths : []).map((s, i) => (
                            <li key={`k-${i}`} className="text-sm" data-testid={`text-strength-${i}`}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedInterview.evaluation.weaknesses && selectedInterview.evaluation.weaknesses.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 text-red-600 dark:text-red-400">Zaif tomonlar:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          {(Array.isArray(selectedInterview.evaluation.weaknesses) ? selectedInterview.evaluation.weaknesses : []).map((w, i) => (
                            <li key={`k-${i}`} className="text-sm" data-testid={`text-weakness-${i}`}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedInterview.evaluation.recommendation && (
                      <div>
                        <p className="text-sm font-medium mb-1">Tavsiya:</p>
                        <p className="text-sm text-muted-foreground" data-testid="text-recommendation">
                          {selectedInterview.evaluation.recommendation}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {selectedInterview.questions && selectedInterview.questions.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Savollar ({selectedInterview.questions.length})
                </h3>
                <div className="space-y-3">
                  {(Array.isArray(selectedInterview.questions) ? selectedInterview.questions : []).map((q, idx) => (
                    <Card key={idx} data-testid={`card-question-${idx}`}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">{idx + 1}. {q.question}</p>
                          {q.score !== undefined && q.maxScore !== undefined && (
                            <Badge variant="outline" data-testid={`badge-question-score-${idx}`}>
                              {q.score}/{q.maxScore}
                            </Badge>
                          )}
                        </div>
                        {q.answer && (
                          <p className="text-sm text-muted-foreground">{q.answer}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </ModulePage>
    );
  }

  if (isLoading) {
    return (
      <ModulePage
        module="ai"
        title="AI Intervyu"
        subtitle="Sun'iy intellekt yordamida avtomatik intervyu o'tkazish"
        icon={<Mic className="h-5 w-5" />}
        actions={<Skeleton className="h-9 w-36" />}
      >
        <Skeleton className="h-9 w-full max-w-sm mb-4" />
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
      title="AI Intervyu"
      subtitle="Sun'iy intellekt yordamida avtomatik intervyu o'tkazish"
      icon={<Mic className="h-5 w-5" />}
      actions={
        <div className="flex gap-2">
          {activeTab === "questions" ? (
            <Button data-testid="button-add-question" onClick={() => setShowAddQuestion(!showAddQuestion)}>
              <Plus className="h-4 w-4 mr-2" /> Savol qo'shish
            </Button>
          ) : (
            <Button data-testid="button-new-interview" onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus className="h-4 w-4 mr-2" /> Yangi Intervyu
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
          <Mic className="h-4 w-4 mr-2" /> Intervyular
        </Button>
        <Button
          variant={activeTab === "questions" ? "default" : "ghost"}
          size="sm"
          data-testid="tab-questions"
          onClick={() => setActiveTab("questions")}
        >
          <BookOpen className="h-4 w-4 mr-2" /> Savol Banki
        </Button>
      </div>

      {activeTab === "questions" && (
        <div className="space-y-4">
          {showAddQuestion && (
            <Card data-testid="card-add-question">
              <CardHeader>
                <CardTitle className="text-base">Yangi savol qo'shish</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); addQuestionMutation.mutate(qForm); }} className="space-y-3">
                  <div className="space-y-2">
                    <Label>Savol (O'zbek)</Label>
                    <Textarea
                      value={qForm.question}
                      onChange={(e) => setQForm({ ...qForm, question: e.target.value })}
                      placeholder="Savol matnini kiriting (O'zbek tilida)"
                      required
                      data-testid="input-question-uz"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Savol (Rus) — ixtiyoriy</Label>
                      <Textarea
                        value={qForm.question_ru}
                        onChange={(e) => setQForm({ ...qForm, question_ru: e.target.value })}
                        placeholder="Вопрос на русском языке"
                        data-testid="input-question-ru"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Savol (Ingliz) — ixtiyoriy</Label>
                      <Textarea
                        value={qForm.question_en}
                        onChange={(e) => setQForm({ ...qForm, question_en: e.target.value })}
                        placeholder="Question in English"
                        data-testid="input-question-en"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-2">
                      <Label>Lavozim (ixtiyoriy)</Label>
                      <Input value={qForm.job_title} onChange={(e) => setQForm({ ...qForm, job_title: e.target.value })} placeholder="Hammaga mos" />
                    </div>
                    <div className="space-y-2">
                      <Label>Kategoriya</Label>
                      <Select value={qForm.category} onValueChange={(v) => setQForm({ ...qForm, category: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">Umumiy</SelectItem>
                          <SelectItem value="technical">Texnik</SelectItem>
                          <SelectItem value="motivation">Motivatsiya</SelectItem>
                          <SelectItem value="teamwork">Jamoa</SelectItem>
                          <SelectItem value="problem_solving">Muammo hal</SelectItem>
                          <SelectItem value="personal">Shaxsiy</SelectItem>
                          <SelectItem value="salary">Maosh</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Qiyinlik</Label>
                      <Select value={qForm.difficulty} onValueChange={(v) => setQForm({ ...qForm, difficulty: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Oson</SelectItem>
                          <SelectItem value="medium">O'rtacha</SelectItem>
                          <SelectItem value="hard">Qiyin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Maks. ball</Label>
                      <Input type="number" min="1" max="10" value={qForm.max_score} onChange={(e) => setQForm({ ...qForm, max_score: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={addQuestionMutation.isPending} data-testid="button-save-question">
                      {addQuestionMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddQuestion(false)}>Bekor</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {(questionsData || []).map((q) => (
              <Card key={q.id} data-testid={`card-question-bank-${q.id}`}>
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{q.question || q.question_uz}</p>
                    {q.question_ru && <p className="text-xs text-muted-foreground">{q.question_ru}</p>}
                    <div className="flex gap-2 flex-wrap mt-1">
                      {q.category && <Badge variant="outline" className="text-xs">{q.category}</Badge>}
                      {q.difficulty && <Badge variant="outline" className="text-xs">{q.difficulty}</Badge>}
                      {q.job_title && <Badge variant="secondary" className="text-xs">{q.job_title}</Badge>}
                      <Badge variant="outline" className="text-xs">{q.max_score || 10} ball</Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive shrink-0"
                    data-testid={`button-delete-question-${q.id}`}
                    onClick={() => setConfirmDeleteQId(q.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
            {(questionsData || []).length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Savol banki bo'sh</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "interviews" && <div>
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
                placeholder="Qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
          </div>
        </div>

        {showCreateForm && (
        <Card className="mb-6" data-testid="card-create-form">
          <CardHeader>
            <CardTitle className="text-lg">Yangi intervyu yaratish</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={interviewForm.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="candidateId">Nomzod ID</Label>
                  <Input
                    id="candidateId"
                    {...interviewForm.register("candidateId")}
                    placeholder="Nomzod ID kiriting"
                    data-testid="input-candidate-id"
                  />
                  {interviewForm.formState.errors.candidateId && (
                    <p className="text-sm text-destructive">{interviewForm.formState.errors.candidateId.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Lavozim</Label>
                  <Input
                    id="jobTitle"
                    {...interviewForm.register("jobTitle")}
                    placeholder="Lavozim nomini kiriting"
                    data-testid="input-job-title"
                  />
                  {interviewForm.formState.errors.jobTitle && (
                    <p className="text-sm text-destructive">{interviewForm.formState.errors.jobTitle.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Til</Label>
                  <Controller
                    control={interviewForm.control}
                    name="language"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-language">
                          <SelectValue placeholder="Tilni tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="uz">O'zbek tili</SelectItem>
                          <SelectItem value="ru">Rus tili</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">Sana va vaqt</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    {...interviewForm.register("scheduledAt")}
                    data-testid="input-scheduled-at"
                  />
                  {interviewForm.formState.errors.scheduledAt && (
                    <p className="text-sm text-destructive">{interviewForm.formState.errors.scheduledAt.message}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 flex-wrap">
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-interview">
                  {createMutation.isPending ? "Yaratilmoqda..." : "Yaratish"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  data-testid="button-cancel-create"
                >
                  Bekor qilish
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
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
                      Ko'rish
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>}

      <ConfirmDialog
        open={confirmDeleteQId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteQId(null); }}
        title="Savolni o'chirish"
        description="Ushbu savolni o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => { if (confirmDeleteQId !== null) deleteQuestionMutation.mutate(confirmDeleteQId); }}
      />
    </ModulePage>
  );
}
