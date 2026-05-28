/**
 * HRCapitalTests — HR capital testing dashboard.
 * State, queries, mutations, and orchestration only; rendering delegated to sub-components.
 */
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, FlaskConical, Target, ClipboardList, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type HrcSession, type HrcQuestion, type StatRow } from "./HRCapitalTestsTypes";
import { getTestTypeLabel } from "./HRCapitalTestsHelpers";
import { SessionsTab, ToolTestAdminTab, ResultsTab, MethodologyTab } from "./HRCapitalTestsTabs";
import { CreateSessionDialog, QuestionDialog, ResultDetailDialog } from "./HRCapitalTestsDialogs";
import { EPComingSoon, EPErrorState, EPPageHeader } from "@/components/ep";
import { isNotImplementedError } from "@/hooks/useNotImplemented";
import { useTranslation } from '@/lib/i18n';

export default function HRCapitalTests() {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]                           = useState("overview");
  const [showCreateSessionDialog, setShowCreateSessionDialog] = useState(false);
  const [showQuestionDialog, setShowQuestionDialog]         = useState(false);
  const [editingQuestion, setEditingQuestion]               = useState<HrcQuestion | null>(null);
  const [selectedSession, setSelectedSession]               = useState<HrcSession | null>(null);
  const [copiedLink, setCopiedLink]                         = useState<string | null>(null);
  const [confirmDeleteQId, setConfirmDeleteQId]             = useState<number | null>(null);
  const [filterType, setFilterType]                         = useState("all");

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: statsData } = useQuery<{ data: StatRow[] }>({
    queryKey: ["/api/hr/hrc-tests/stats"],
  });
  const stats = statsData?.data ?? [];

  const { data: sessionsData, isLoading: sessionsLoading, isError, error, refetch } = useQuery<{ data: HrcSession[] }>({
    queryKey: ["/api/hr/hrc-tests/sessions"],
  });
  const sessions = sessionsData?.data ?? [];

  const { data: questionsData, isLoading: questionsLoading } = useQuery<{ data: HrcQuestion[] }>({
    queryKey: ["/api/hr/hrc-tests/tool-test/questions"],
  });
  const questions = questionsData?.data ?? [];

  // ── Delete mutation ──────────────────────────────────────────────────────────
  const deleteQuestionMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/hr/hrc-tests/tool-test/questions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/hrc-tests/tool-test/questions"] });
      toast({ title: "Savol o'chirildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const copyLink = (token: string) => {
    const link = `${window.location.origin}/public/hrc-test/${token}`;
    navigator.clipboard?.writeText(link).then(() => {
      setCopiedLink(token);
      setTimeout(() => setCopiedLink(null), 2000);
    }).catch(() => { toast({ title: "Link: " + link }); });
  };

  const filteredSessions = filterType === "all"
    ? sessions
    : sessions.filter(s => s.test_type === filterType);

  const indicatorGroups: Record<string, HrcQuestion[]> = {};
  for (const q of questions) {
    if (!indicatorGroups[q.indicator]) indicatorGroups[q.indicator] = [];
    indicatorGroups[q.indicator].push(q);
  }

  const totalStats = {
    total:     (Array.isArray(stats) ? stats : []).reduce((a, s) => a + Number(s.total), 0),
    completed: (Array.isArray(stats) ? stats : []).reduce((a, s) => a + Number(s.completed), 0),
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("hrCapitalTestlar")}</b></>}
        title={t("hrCapitalTestlar")}
        subtitle={t("toolTestIqLiderlikTakrorlash")}
      />
        </div>
        <Button
          onClick={() => setShowCreateSessionDialog(true)}
          className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold shadow-none"
          data-testid="button-create-test-session"
        >
          <Plus className="w-4 h-4 mr-2" /> {t("testSessiyasiYaratish")}
        </Button>
      </div>

      {isError && isNotImplementedError(error)
        ? <EPComingSoon />
        : isError
          ? <EPErrorState onRetry={refetch} />
          : (
      <>
      {/* Stats overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {([
          { type: "tool_test",   label: "TOOL TEST", icon: <Brain className="w-5 h-5" />,         color: "bg-violet-500/10 text-[var(--ep-purple)]" },
          { type: "iq",          label: "IQ Test",   icon: <FlaskConical className="w-5 h-5" />,   color: "bg-blue-500/10 text-[var(--ep-blue)]" },
          { type: "leadership",  label: "Liderlik",  icon: <Target className="w-5 h-5" />,         color: "bg-orange-500/10 text-[var(--ep-primary)]" },
          { type: "replication", label: "Takrorlash",icon: <ClipboardList className="w-5 h-5" />,  color: "bg-green-500/10 text-[var(--ep-green)]" },
        ] as const).map(item => {
          const stat = (Array.isArray(stats) ? stats : []).find(s => s.test_type === item.type);
          return (
            <Card key={item.type} className="bg-muted/40 border-0 shadow-none">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.color}`}>{item.icon}</div>
                <div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="font-bold text-lg">{stat?.completed ?? 0}/{stat?.total ?? 0}</div>
                  {stat?.avg_score && (
                    <div className="text-xs text-muted-foreground">Ø {Math.round(Number(stat.avg_score))}%</div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/40">
          <TabsTrigger value="overview">{t("sessiyalar")}</TabsTrigger>
          <TabsTrigger value="tool-test-admin">{t("toolTestSavollar")}</TabsTrigger>
          <TabsTrigger value="results">{t("natijalar")}</TabsTrigger>
          <TabsTrigger value="methodology">{t("metodologiya")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <SessionsTab
            filteredSessions={filteredSessions}
            sessionsLoading={sessionsLoading}
            filterType={filterType}
            setFilterType={setFilterType}
            copyLink={copyLink}
            copiedLink={copiedLink}
            setSelectedSession={setSelectedSession}
            setShowCreateSessionDialog={setShowCreateSessionDialog}
          />
        </TabsContent>

        <TabsContent value="tool-test-admin" className="mt-4">
          <ToolTestAdminTab
            questions={questions}
            questionsLoading={questionsLoading}
            indicatorGroups={indicatorGroups}
            onAddQuestion={() => { setEditingQuestion(null); setShowQuestionDialog(true); }}
            onEditQuestion={q => { setEditingQuestion(q); setShowQuestionDialog(true); }}
            onDeleteQuestion={id => setConfirmDeleteQId(id)}
          />
        </TabsContent>

        <TabsContent value="results" className="mt-4">
          <ResultsTab sessions={sessions} setSelectedSession={setSelectedSession} />
        </TabsContent>

        <TabsContent value="methodology" className="mt-4">
          <MethodologyTab />
        </TabsContent>
      </Tabs>
      </>
          )}

      {/* Dialogs */}
      <CreateSessionDialog open={showCreateSessionDialog} onOpenChange={setShowCreateSessionDialog} />

      <QuestionDialog
        open={showQuestionDialog}
        onOpenChange={setShowQuestionDialog}
        editingQuestion={editingQuestion}
        onClose={() => { setShowQuestionDialog(false); setEditingQuestion(null); }}
      />

      <ResultDetailDialog session={selectedSession} onClose={() => setSelectedSession(null)} />

      {/* Confirm delete question */}
      <ConfirmDialog
        open={confirmDeleteQId !== null}
        onOpenChange={open => { if (!open) setConfirmDeleteQId(null); }}
        title={t("savolniOchirish")}
        description={t("ushbuKapitalTestSavoliniOchirishni")}
        confirmText="O'chirish" cancelText="Bekor qilish" variant="destructive"
        onConfirm={() => { if (confirmDeleteQId !== null) deleteQuestionMutation.mutate(confirmDeleteQId); }}
      />
    </div>
  );
}
