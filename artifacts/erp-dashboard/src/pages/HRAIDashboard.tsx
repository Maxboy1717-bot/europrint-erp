import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Brain,
  Cpu,
  Users,
  DollarSign,
  Zap,
  FileText,
  BookOpen,
  Briefcase,
  TrendingUp,
  Mail,
  UserPlus,
  Target,
  X,
  Send,
  Loader2,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ErrorState } from "@/components/ui/error-state";

interface DashboardData {
  totalAiTasks: number;
  completedInterviews: number;
  totalCost: number;
  recentTasks: RecentTask[];
}

interface RecentTask {
  id: string;
  taskType: string;
  status: string;
  createdAt: string;
}

interface ProviderConfig {
  providerName: string;
  isActive: boolean;
  monthlyBudget: number;
  monthlySpent: number;
  dailyRequestsUsed: number;
  dailyRequestLimit: number;
}

interface BudgetItem {
  id: string;
  provider: string;
  monthlyBudget: number;
  monthlySpent: number;
  remaining: number;
  isActive: boolean;
  dailyRequestLimit: number | null;
  dailyRequestsUsed: number | null;
}

const taskTypes = [
  { key: "resume-parse", label: "Resume Parse", icon: FileText },
  { key: "quiz-generate", label: "Quiz Generate", icon: BookOpen },
  { key: "job-description", label: "Job Description", icon: Briefcase },
  { key: "performance-analysis", label: "Performance Analysis", icon: TrendingUp },
  { key: "salary-validation", label: "Salary Validation", icon: DollarSign },
  { key: "email-generate", label: "Email Generate", icon: Mail },
  { key: "onboarding-plan", label: "Onboarding Plan", icon: UserPlus },
  { key: "score-candidate", label: "Score Candidate", icon: Target },
];

const providerColors: Record<string, string> = {
  gemini: "bg-blue-500",
  openai: "bg-green-500",
  claude: "bg-purple-500",
};

const StatCardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded" />
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const ProviderCardSkeleton = () => (
  <Card>
    <CardContent className="p-6 space-y-4">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-2 w-full" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-20" />
    </CardContent>
  </Card>
);

export default function HRAIDashboard() {
  const { t } = useTranslation("hr");
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [taskLanguage, setTaskLanguage] = useState<string>("uz");
  const [taskResult, setTaskResult] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Record<string, string>>({});

  const { data: dashboard, isLoading: isLoadingDashboard, isError, refetch} = useQuery<DashboardData>({
    queryKey: ["/api/ai-hr/dashboard"],
  });

  const { data: providers = [], isLoading: isLoadingProviders } = useQuery<ProviderConfig[]>({
    queryKey: ["/api/ai-hr/providers"],
  });

  const { data: budgetItems = [], isLoading: isLoadingBudget } = useQuery<BudgetItem[]>({
    queryKey: ["/api/ai-hr/usage/budget"],
  });

  const isLoading = isLoadingDashboard || isLoadingProviders || isLoadingBudget;

  const activeProviderCount = (Array.isArray(providers) ? providers : []).filter((p) => p.isActive).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">Bajarildi</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">Kutilmoqda</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">Xatolik</Badge>;
      default:
        return <Badge className="bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold">{status}</Badge>;
    }
  };

  const handleSubmitTask = async () => {
    if (!selectedTask) return;
    setIsSubmitting(true);
    setTaskResult(null);
    try {
      const payload: Record<string, unknown> = { ...formData, language: taskLanguage };
      const result = await apiRequest<{ result?: string; message?: string }>(
        "POST",
        `/api/ai-hr/tasks/${selectedTask}`,
        payload
      );
      setTaskResult(JSON.stringify(result, null, 2));
      queryClient.invalidateQueries({ queryKey: ["/api/ai-hr/dashboard"] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Xatolik yuz berdi";
      setTaskResult(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectTask = (taskKey: string) => {
    setSelectedTask(taskKey);
    setFormData({});
    setTaskResult(null);
  };

  const handleCloseTask = () => {
    setSelectedTask(null);
    setFormData({});
    setTaskResult(null);
  };

  const renderTaskForm = () => {
    if (!selectedTask) return null;

    switch (selectedTask) {
      case "resume-parse":
        return (
          <div className="space-y-3">
            <label className="text-sm font-medium">Resume matni</label>
            <Textarea
              data-testid="input-resume-text"
              placeholder="Resume matnini kiriting..."
              value={formData.resumeText || ""}
              onChange={(e) => setFormData({ ...formData, resumeText: e.target.value })}
              className="min-h-[120px]"
            />
          </div>
        );
      case "quiz-generate":
        return (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Mavzu</label>
              <Input
                data-testid="input-topic"
                placeholder="Mavzuni kiriting"
                value={formData.topic || ""}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Savollar soni</label>
              <Input
                data-testid="input-question-count"
                type="number"
                placeholder="10"
                value={formData.questionCount || ""}
                onChange={(e) => setFormData({ ...formData, questionCount: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Qiyinlik darajasi</label>
              <Select
                value={formData.difficulty || ""}
                onValueChange={(val) => setFormData({ ...formData, difficulty: val })}
              >
                <SelectTrigger data-testid="select-difficulty">
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Oson</SelectItem>
                  <SelectItem value="medium">O'rta</SelectItem>
                  <SelectItem value="hard">Qiyin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case "job-description":
        return (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Lavozim nomi</label>
              <Input
                data-testid="input-job-title"
                placeholder="Lavozim nomini kiriting"
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Bo'lim</label>
              <Input
                data-testid="input-department"
                placeholder="Bo'lim nomini kiriting"
                value={formData.department || ""}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
          </div>
        );
      case "salary-validation":
        return (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Lavozim</label>
              <Input
                data-testid="input-position"
                placeholder="Lavozim"
                value={formData.position || ""}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tajriba (yil)</label>
              <Input
                data-testid="input-experience"
                type="number"
                placeholder="3"
                value={formData.experience || ""}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Hudud</label>
              <Input
                data-testid="input-region"
                placeholder="Toshkent"
                value={formData.region || ""}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Joriy maosh</label>
              <Input
                data-testid="input-current-salary"
                type="number"
                placeholder="5000000"
                value={formData.currentSalary || ""}
                onChange={(e) => setFormData({ ...formData, currentSalary: e.target.value })}
              />
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-3">
            <label className="text-sm font-medium">Ma'lumot</label>
            <Textarea
              data-testid="input-generic-text"
              placeholder="Ma'lumotni kiriting..."
              value={formData.text || ""}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              className="min-h-[120px]"
            />
          </div>
        );
    }
  };

  const providerList = ["gemini", "openai", "claude"] as const;

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <ModulePage
        module="ai"
        title="HR AI Avtomatizatsiya"
        subtitle="Sun'iy intellekt bilan HR jarayonlarini boshqarish"
        icon={<Brain className="h-5 w-5" />}
        actions={<Skeleton className="h-9 w-32" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {([1, 2, 3, 4]).map((i) => (
            <StatCardSkeleton key={`k-${i}`} />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {([1, 2, 3]).map((i) => (
            <ProviderCardSkeleton key={`k-${i}`} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              {([1, 2, 3, 4]).map((i) => (
                <Skeleton key={`k-${i}`} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              {([1, 2, 3]).map((i) => (
                <Skeleton key={`k-${i}`} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </ModulePage>
    );
  }

  const statCards = [
    {
      icon: <Cpu className="h-8 w-8 text-blue-500" />,
      label: "Jami AI vazifalar",
      value: dashboard?.totalAiTasks || 0,
    },
    {
      icon: <Users className="h-8 w-8 text-green-500" />,
      label: "Yakunlangan intervyular",
      value: dashboard?.completedInterviews || 0,
    },
    {
      icon: <DollarSign className="h-8 w-8 text-orange-500" />,
      label: "Umumiy xarajat",
      value: `$${(dashboard?.totalCost || 0).toFixed(2)}`,
    },
    {
      icon: <Zap className="h-8 w-8 text-purple-500" />,
      label: "Faol provayderlar",
      value: activeProviderCount,
    },
  ];

  return (
    <div className="flex-1 overflow-auto bg-surface p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-light tracking-tight text-on-surface">
          HR AI <span className="font-bold text-primary">Dashboard</span>
        </h1>
        <div className="flex items-center gap-2">
          <Brain className="h-8 w-8 text-primary opacity-20" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {(Array.isArray(statCards) ? statCards : []).map((stat, idx) => (
          <div key={idx} className="bg-surface-container-lowest rounded-lg p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{stat.label}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-4xl font-bold tracking-tight text-on-surface" data-testid={`text-stat-${idx}`}>{stat.value}</p>
              <div className="opacity-20">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6 mb-8 shadow-sm">
        <h2 className="text-lg font-semibold text-on-surface mb-4">Provayderlar va byudjet</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Array.isArray(providerList) ? providerList : []).map((providerKey) => {
            const pBudget = (Array.isArray(budgetItems) ? budgetItems : []).find((b) => b.provider === providerKey);
            const pConfig = (Array.isArray(providers) ? providers : []).find((p) => p.providerName === providerKey);
            const isActive = pBudget?.isActive ?? pConfig?.isActive ?? false;
            const monthlyBudget = pBudget?.monthlyBudget ?? pConfig?.monthlyBudget ?? 0;
            const monthlySpent = pBudget?.monthlySpent ?? pConfig?.monthlySpent ?? 0;
            const dailyUsed = pBudget?.dailyRequestsUsed ?? pConfig?.dailyRequestsUsed ?? 0;
            const dailyLimit = pBudget?.dailyRequestLimit ?? pConfig?.dailyRequestLimit ?? 0;
            const spentPercent = monthlyBudget > 0 ? Math.min((monthlySpent / monthlyBudget) * 100, 100) : 0;

            return (
              <div key={providerKey} className="bg-surface-container rounded-lg p-4" data-testid={`card-provider-${providerKey}`}>
                <div className="flex items-center justify-between mb-4">
                  <Badge className={`${providerColors[providerKey]} text-white no-default-hover-elevate no-default-active-elevate`}>
                    {providerKey.charAt(0).toUpperCase() + providerKey.slice(1)}
                  </Badge>
                  <Badge
                    variant={isActive ? "default" : "secondary"}
                    className={isActive ? "bg-green-100 text-green-800" : ""}
                    data-testid={`badge-provider-status-${providerKey}`}
                  >
                    {isActive ? "Faol" : "Nofaol"}
                  </Badge>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-on-surface-variant font-medium">Oylik byudjet</span>
                      <span className="text-on-surface font-semibold">${monthlySpent.toFixed(2)} / ${monthlyBudget.toFixed(2)}</span>
                    </div>
                    <Progress value={spentPercent} className="h-1.5 bg-surface-container-high" data-testid={`progress-budget-${providerKey}`} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant font-medium">Kunlik so'rovlar</span>
                    <span className="text-on-surface font-semibold" data-testid={`text-daily-requests-${providerKey}`}>
                      {dailyUsed} / {dailyLimit}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-on-surface mb-4">AI Vazifalar</h2>
          <div className="grid grid-cols-2 gap-3">
            {(Array.isArray(taskTypes) ? taskTypes : []).map((task) => {
              const IconComp = task.icon;
              return (
                <Button
                  key={task.key}
                  variant="outline"
                  className="justify-start gap-2 h-auto py-3 px-4 border-outline-variant hover:bg-surface-container-low"
                  data-testid={`button-task-${task.key}`}
                  onClick={() => handleSelectTask(task.key)}
                >
                  <IconComp className="h-4 w-4 text-primary" />
                  <span className="text-on-surface font-medium">{task.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-on-surface mb-4">So'nggi natijalar</h2>
          {dashboard?.recentTasks && dashboard.recentTasks.length > 0 ? (
            <div className="space-y-3">
              {(Array.isArray(dashboard.recentTasks) ? dashboard.recentTasks : []).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-2 p-3 rounded-lg border border-outline-variant hover:bg-surface-container-low transition-colors"
                  data-testid={`recent-task-${task.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">{task.taskType}</p>
                    <p className="text-xs text-on-surface-variant">
                      {new Date(task.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {getStatusBadge(task.status)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Brain className="h-12 w-12 text-outline-variant mx-auto mb-4" />
              <p className="text-on-surface-variant font-medium">Hozircha natijalar yo'q</p>
            </div>
          )}
        </div>
      </div>

      {selectedTask && (
        <Card className="mt-6" data-testid="card-task-execution">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>
                {(taskTypes ?? []).find((t) => t.key === selectedTask)?.label || selectedTask}
              </CardTitle>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleCloseTask}
                data-testid="button-close-task"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderTaskForm()}

            <div>
              <label className="text-sm font-medium">Til</label>
              <Select value={taskLanguage} onValueChange={setTaskLanguage}>
                <SelectTrigger data-testid="select-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uz">O'zbekcha</SelectItem>
                  <SelectItem value="ru">Ruscha</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSubmitTask}
              disabled={isSubmitting}
              data-testid="button-submit-task"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Yuborish
            </Button>

            {taskResult && (
              <div className="mt-4 p-4 rounded-md border bg-muted/30" data-testid="text-task-result">
                <pre className="text-sm whitespace-pre-wrap break-words">{taskResult}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
