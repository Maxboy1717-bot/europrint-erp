import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Brain, Users, Link2, Plus, Trash2, Pencil, Copy, CheckCircle2,
  Loader2, BarChart3, ClipboardList, Target, Lightbulb, FlaskConical,
  ChevronRight, AlertCircle, Star, TrendingUp, UserCheck, Zap, Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip as RechartTooltip } from "recharts";

const INDICATORS = [
  { key: "A", label: "Moslashuvchanlik", desc: "O'zgarishlarga moslashish qobiliyati", color: "#6366f1" },
  { key: "B", label: "Hamkorlik", desc: "Jamoa bilan ishlash qobiliyati", color: "#22c55e" },
  { key: "C", label: "Tartiblilik", desc: "Rejalashtirish va tashkil etish", color: "#f59e0b" },
  { key: "D", label: "Liderlik", desc: "Boshqarish va yo'naltirish", color: "#ef4444" },
  { key: "E", label: "Strategik fikr", desc: "Kelajakni ko'ra bilish", color: "#8b5cf6" },
  { key: "F", label: "Emotsional barqarorlik", desc: "His-tuyg'ularni boshqarish", color: "#06b6d4" },
  { key: "G", label: "Kommunikatsiya", desc: "Fikrni ifodalash qobiliyati", color: "#f97316" },
  { key: "H", label: "O'sishga tayyorlik", desc: "Yangi bilim va tanqidga ochiqlik", color: "#14b8a6" },
  { key: "I", label: "Optimizm", desc: "Ijobiy fikrlash", color: "#84cc16" },
  { key: "J", label: "Maqsadlilik", desc: "Maqsad qo'yish va erishish", color: "#ec4899" },
];

const SYNDROME_DESCRIPTIONS: Record<string, { label: string; description: string; color: string }> = {
  "Pedant": { label: "Pedant", description: "Qattiq tartib tarafdori, o'zgarishlarga qarshilik ko'rsatadi", color: "bg-orange-100 text-orange-800 border-orange-300" },
  "Rozovye Ochki": { label: "Rozovye Ochki", description: "Ortiqcha optimist, xatarlarni ko'rmaydi", color: "bg-pink-100 text-pink-800 border-pink-300" },
  "Manipulyator": { label: "Manipulyator", description: "Boshqalarni boshqarish uchun ta'sir vositalaridan foydalanadi", color: "bg-red-100 text-red-800 border-red-300" },
  "Neeffektivny": { label: "Neeffektivny", description: "Past samaradorlik, mas'uliyatdan qochadi", color: "bg-gray-100 text-gray-800 border-gray-300" },
  "Konservator": { label: "Konservator", description: "Yangilikka qarshi, eski usullarga yopishib olgan", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  "Prokrastinator": { label: "Prokrastinator", description: "Ishlarni kechiktiradi, qaror qabul qilishdan qo'rqadi", color: "bg-blue-100 text-blue-800 border-blue-300" },
  "Emotsional Beqaror": { label: "Emotsional Beqaror", description: "Stressga nisbatan kuchli ta'sirlanuvchan", color: "bg-purple-100 text-purple-800 border-purple-300" },
  "Avtoritar": { label: "Avtoritar", description: "Boshqalarning fikrini hisobga olmaydi", color: "bg-rose-100 text-rose-800 border-rose-300" },
  "O'sishdan Qochuvchi": { label: "O'sishdan Qochuvchi", description: "Tanqid va o'sish imkoniyatlaridan qo'rqadi", color: "bg-slate-100 text-slate-800 border-slate-300" },
  "Jamoa Qo'g'irchoq'i": { label: "Jamoa Qo'g'irchoq'i", description: "Mustaqil qaror qabul qila olmaydi", color: "bg-cyan-100 text-cyan-800 border-cyan-300" },
  "Introviert Jamoa": { label: "Introviert Jamoa", description: "Jamoa bilan ishlashni afzal ko'radi lekin komunikatsiyasi zaif", color: "bg-teal-100 text-teal-800 border-teal-300" },
  "Xaotik Novator": { label: "Xaotik Novator", description: "G'oyalarga to'la lekin tartibsiz, yakunlamaydigan", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
};

const IQ_LEVELS = [
  { min: 95, max: 100, label: "Daho (135+)", color: "text-violet-600" },
  { min: 80, max: 94, label: "Juda yuqori (120-134)", color: "text-blue-600" },
  { min: 65, max: 79, label: "Yuqori (110-119)", color: "text-green-600" },
  { min: 50, max: 64, label: "O'rtadan yuqori (100-109)", color: "text-teal-600" },
  { min: 35, max: 49, label: "O'rta (90-99)", color: "text-yellow-600" },
  { min: 20, max: 34, label: "O'rtadan past (80-89)", color: "text-orange-600" },
  { min: 0, max: 19, label: "Past (80 dan past)", color: "text-red-600" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type TestType = "tool_test" | "iq" | "leadership" | "replication";
type TestStatus = "pending" | "in_progress" | "completed" | "expired";

interface HrcSession {
  id: string;
  session_token: string;
  test_type: TestType;
  status: TestStatus;
  expires_at: string;
  created_at: string;
  completed_at?: string;
  score: number | null;
  syndrome: string | null;
  iq_level: string | null;
  indicators?: Record<string, number>;
  leadership_score?: number | null;
  replication_accuracy?: number | null;
  results: Record<string, unknown> | null;
  candidate_name?: string;
  candidate_phone?: string;
  employee_name?: string;
  vacancy_title?: string;
}

interface HrcQuestion {
  id: number;
  indicator: string;
  text_uz: string;
  text_ru?: string;
  weight: number;
  is_active: boolean;
}

interface StatRow {
  test_type: string;
  total: string;
  completed: string;
  avg_score: string;
}

interface Candidate {
  id: number;
  full_name?: string;
  name?: string;
  phone?: string;
}

interface Employee {
  id: number;
  full_name?: string;
}

function getIQLevelInfo(score: number) {
  return IQ_LEVELS.find(l => score >= l.min && score <= l.max) ?? IQ_LEVELS[IQ_LEVELS.length - 1];
}

function ScoreBar({ value, max = 100, color = "bg-primary" }: { value: number; max?: number; color?: string }) {
  const center = 50;
  const pct = Math.max(0, Math.min(100, ((value + max) / (max * 2)) * 100));
  const isNeg = value < 0;
  const barLeft = isNeg ? pct : center;
  const barWidth = Math.abs(pct - center);
  return (
    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
      <div
        className={`absolute top-0 h-full ${color} transition-all`}
        style={{ left: `${barLeft}%`, width: `${barWidth}%` }}
      />
      <div className="absolute top-0 h-full w-px bg-foreground/30" style={{ left: "50%" }} />
    </div>
  );
}

export default function HRCapitalTests() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateSessionDialog, setShowCreateSessionDialog] = useState(false);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<HrcQuestion | null>(null);
  const [selectedSession, setSelectedSession] = useState<HrcSession | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [confirmDeleteQId, setConfirmDeleteQId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState("all");

  const [sessionForm, setSessionForm] = useState({
    test_type: "tool_test",
    candidate_id: "",
    employee_id: "",
    funnel_id: "",
    vacancy_id: "",
  });

  const [questionForm, setQuestionForm] = useState({
    indicator: "A",
    text_uz: "",
    text_ru: "",
    weight: "1",
  });

  const { data: statsData } = useQuery<{ data: StatRow[] }>({
    queryKey: ["/api/hr/hrc-tests/stats"],
  });
  const stats = statsData?.data ?? [];

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery<{ data: HrcSession[] }>({
    queryKey: ["/api/hr/hrc-tests/sessions"],
  });
  const sessions = sessionsData?.data ?? [];

  const { data: questionsData, isLoading: questionsLoading } = useQuery<{ data: HrcQuestion[] }>({
    queryKey: ["/api/hr/hrc-tests/tool-test/questions"],
  });
  const questions = questionsData?.data ?? [];

  const { data: candidatesData } = useQuery<{ data: Candidate[] } | Candidate[]>({
    queryKey: ["/api/candidates"],
  });
  const candidates: Candidate[] = (Array.isArray(candidatesData) ? candidatesData : candidatesData?.data) ?? [];

  const { data: employeesData } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });
  const employees: Employee[] = employeesData ?? [];

  const createSessionMutation = useMutation({
    mutationFn: async (form: typeof sessionForm) => {
      return apiRequest("POST", "/api/hr/hrc-tests/sessions", {
        test_type: form.test_type,
        candidate_id: form.candidate_id ? Number(form.candidate_id) : undefined,
        employee_id: form.employee_id ? Number(form.employee_id) : undefined,
        funnel_id: form.funnel_id ? Number(form.funnel_id) : undefined,
        vacancy_id: form.vacancy_id ? Number(form.vacancy_id) : undefined,
      });
    },
    onSuccess: (data: { testLink?: string } | null) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/hrc-tests/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/hrc-tests/stats"] });
      setShowCreateSessionDialog(false);
      setSessionForm({ test_type: "tool_test", candidate_id: "", employee_id: "", funnel_id: "", vacancy_id: "" });
      toast({ title: "Test sessiyasi yaratildi! Link nusxalanmoqda..." });
      if (data?.testLink) {
        const fullLink = `${window.location.origin}${data.testLink}`;
        navigator.clipboard?.writeText(fullLink).catch(() => {});
      }
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (form: typeof questionForm) => {
      if (editingQuestion) {
        return apiRequest("PATCH", `/api/hr/hrc-tests/tool-test/questions/${editingQuestion.id}`, {
          text_uz: form.text_uz,
          text_ru: form.text_ru,
          weight: Number(form.weight),
        });
      }
      return apiRequest("POST", "/api/hr/hrc-tests/tool-test/questions", {
        indicator: form.indicator,
        text_uz: form.text_uz,
        text_ru: form.text_ru || undefined,
        weight: Number(form.weight),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/hrc-tests/tool-test/questions"] });
      setShowQuestionDialog(false);
      setEditingQuestion(null);
      setQuestionForm({ indicator: "A", text_uz: "", text_ru: "", weight: "1" });
      toast({ title: editingQuestion ? "Savol yangilandi" : "Savol qo'shildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/hr/hrc-tests/tool-test/questions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/hrc-tests/tool-test/questions"] });
      toast({ title: "Savol o'chirildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/public/hrc-test/${token}`;
    navigator.clipboard?.writeText(link).then(() => {
      setCopiedLink(token);
      setTimeout(() => setCopiedLink(null), 2000);
    }).catch(() => {
      toast({ title: "Link: " + link });
    });
  };

  const filteredSessions = filterType === "all" ? sessions : (Array.isArray(sessions) ? sessions : []).filter(s => s.test_type === filterType);

  const getTestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      tool_test: "TOOL TEST",
      iq: "IQ Test",
      leadership: "Liderlik",
      replication: "Takrorlash",
    };
    return labels[type] ?? type;
  };

  const getTestTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      tool_test: <Brain className="w-4 h-4" />,
      iq: <FlaskConical className="w-4 h-4" />,
      leadership: <Target className="w-4 h-4" />,
      replication: <ClipboardList className="w-4 h-4" />,
    };
    return icons[type] ?? <Brain className="w-4 h-4" />;
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      pending: { label: "Kutilmoqda", className: "bg-gray-100 text-gray-700" },
      in_progress: { label: "Jarayonda", className: "bg-blue-100 text-blue-700" },
      completed: { label: "Tugallandi", className: "bg-green-100 text-green-700" },
      expired: { label: "Muddati o'tdi", className: "bg-red-100 text-red-700" },
    };
    const info = map[status] ?? { label: status, className: "" };
    return <Badge className={`${info.className} border-0 text-xs`}>{info.label}</Badge>;
  };

  const totalStats = {
    total: (Array.isArray(stats) ? stats : []).reduce((a, s) => a + Number(s.total), 0),
    completed: (Array.isArray(stats) ? stats : []).reduce((a, s) => a + Number(s.completed), 0),
  };

  const indicatorGroups: Record<string, HrcQuestion[]> = {};
  for (const q of questions) {
    if (!indicatorGroups[q.indicator]) indicatorGroups[q.indicator] = [];
    indicatorGroups[q.indicator].push(q);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            HR Capital <span className="font-bold text-primary">Testlar</span>
          </h1>
          <p className="text-on-surface-variant mt-1">
            TOOL TEST · IQ · Liderlik · Takrorlash
          </p>
        </div>
        <Button
          onClick={() => setShowCreateSessionDialog(true)}
          className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold shadow-none"
          data-testid="button-create-test-session"
        >
          <Plus className="w-4 h-4 mr-2" />
          Test Sessiyasi Yaratish
        </Button>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {([
          { type: "tool_test", label: "TOOL TEST", icon: <Brain className="w-5 h-5" />, color: "bg-violet-500/10 text-violet-600" },
          { type: "iq", label: "IQ Test", icon: <FlaskConical className="w-5 h-5" />, color: "bg-blue-500/10 text-blue-600" },
          { type: "leadership", label: "Liderlik", icon: <Target className="w-5 h-5" />, color: "bg-orange-500/10 text-orange-600" },
          { type: "replication", label: "Takrorlash", icon: <ClipboardList className="w-5 h-5" />, color: "bg-green-500/10 text-green-600" },
        ]).map(item => {
          const stat = (Array.isArray(stats) ? stats : []).find(s => s.test_type === item.type);
          return (
            <Card key={item.type} className="bg-surface-container-low border-0 shadow-none">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.color}`}>{item.icon}</div>
                <div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="font-bold text-lg">{stat?.completed ?? 0}/{stat?.total ?? 0}</div>
                  {stat?.avg_score && <div className="text-xs text-muted-foreground">Ø {Math.round(Number(stat.avg_score))}%</div>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-surface-container-low">
          <TabsTrigger value="overview">Sessiyalar</TabsTrigger>
          <TabsTrigger value="tool-test-admin">TOOL TEST Savollar</TabsTrigger>
          <TabsTrigger value="results">Natijalar</TabsTrigger>
          <TabsTrigger value="methodology">Metodologiya</TabsTrigger>
        </TabsList>

        {/* ─── SESSIONS TAB ─────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Filter:</span>
            {(["all", "tool_test", "iq", "leadership", "replication"]).map(type => (
              <Button
                key={type}
                variant={filterType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType(type)}
                className="text-xs h-7"
              >
                {type === "all" ? "Barchasi" : getTestTypeLabel(type)}
              </Button>
            ))}
          </div>

          {sessionsLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin h-6 w-6" /></div>
          ) : filteredSessions.length === 0 ? (
            <Card className="border-0 shadow-none bg-surface-container-low">
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Brain className="h-12 w-12 mb-3 opacity-30" />
                <p>Hozircha test sessiyalari yo'q</p>
                <Button className="mt-4" size="sm" onClick={() => setShowCreateSessionDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Yangi sessiya yaratish
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {(Array.isArray(filteredSessions) ? filteredSessions : []).map(session => (
                <Card key={session.id} className="bg-surface-container-low border-0 shadow-none hover:bg-surface-container transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          {getTestTypeIcon(session.test_type)}
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {session.candidate_name || session.employee_name || "Noma'lum"}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="text-[10px] bg-primary/10 text-primary border-0">
                              {getTestTypeLabel(session.test_type)}
                            </Badge>
                            {getStatusBadge(session.status)}
                            {session.vacancy_title && (
                              <span className="text-xs text-muted-foreground">{session.vacancy_title}</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {new Date(session.created_at).toLocaleDateString("uz-UZ")} ·{" "}
                            Muddati: {new Date(session.expires_at).toLocaleDateString("uz-UZ")}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.score !== null && session.score !== undefined && (
                          <div className={`text-lg font-bold ${session.test_type === "tool_test" && session.score < 0 ? "text-red-500" : "text-primary"}`}>
                            {session.test_type === "tool_test"
                              ? `${session.score > 0 ? "+" : ""}${session.score}`
                              : `${session.score}%`}
                          </div>
                        )}
                        {session.status === "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedSession(session)}
                            className="text-xs"
                          >
                            Natija
                          </Button>
                        )}
                        {session.status !== "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyLink(session.session_token)}
                            className="text-xs"
                            data-testid={`button-copy-link-${session.id}`}
                          >
                            {copiedLink === session.session_token ? (
                              <><CheckCircle2 className="w-3.5 h-3.5 mr-1 text-green-500" /> Nusxalandi</>
                            ) : (
                              <><Copy className="w-3.5 h-3.5 mr-1" /> Link</>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── TOOL TEST ADMIN TAB ─────────────────────────────────────────── */}
        <TabsContent value="tool-test-admin" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              10 ta ko'rsatkich (A-J) uchun savollar boshqaruvi. Har bir savol -100 dan +100 gacha shkala.
            </p>
            <Button
              size="sm"
              onClick={() => {
                setEditingQuestion(null);
                setQuestionForm({ indicator: "A", text_uz: "", text_ru: "", weight: "1" });
                setShowQuestionDialog(true);
              }}
              data-testid="button-add-question"
            >
              <Plus className="w-4 h-4 mr-2" /> Savol qo'shish
            </Button>
          </div>

          {questionsLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin h-6 w-6" /></div>
          ) : (
            <div className="space-y-4">
              {(Array.isArray(INDICATORS) ? INDICATORS : []).map(ind => (
                <Card key={ind.key} className="border-0 bg-surface-container-low">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: ind.color }}>
                        {ind.key}
                      </span>
                      {ind.label}
                      <span className="text-xs text-muted-foreground font-normal">— {ind.desc}</span>
                      <Badge className="ml-auto text-xs border-0" style={{ backgroundColor: `${ind.color}20`, color: ind.color }}>
                        {(indicatorGroups[ind.key] ?? []).length} savol
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(indicatorGroups[ind.key] ?? []).map((q: HrcQuestion) => (
                      <div key={q.id} className="flex items-start gap-3 p-3 bg-surface-container rounded-lg">
                        <div className="flex-1">
                          <div className="text-sm">{q.text_uz}</div>
                          {q.text_ru && <div className="text-xs text-muted-foreground mt-0.5">{q.text_ru}</div>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge className={`text-xs border-0 ${q.weight > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {q.weight > 0 ? "+" : ""}{q.weight}
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditingQuestion(q);
                              setQuestionForm({ indicator: q.indicator, text_uz: q.text_uz, text_ru: q.text_ru ?? "", weight: String(q.weight) });
                              setShowQuestionDialog(true);
                            }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() => setConfirmDeleteQId(q.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {!(indicatorGroups[ind.key]?.length) && (
                      <div className="text-xs text-muted-foreground text-center py-2">
                        Bu ko'rsatkich uchun savollar yo'q
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── RESULTS TAB ─────────────────────────────────────────────────── */}
        <TabsContent value="results" className="space-y-4 mt-4">
          <div className="grid gap-4">
            {(Array.isArray(sessions) ? sessions : []).filter(s => s.status === "completed").length === 0 ? (
              <Card className="border-0 shadow-none bg-surface-container-low">
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mb-3 opacity-30" />
                  <p>Hali tugallangan testlar yo'q</p>
                </CardContent>
              </Card>
            ) : (
              (Array.isArray(sessions) ? sessions : []).filter(s => s.status === "completed").map(session => (
                <Card
                  key={session.id}
                  className="bg-surface-container-low border-0 shadow-none cursor-pointer hover:bg-surface-container transition-colors"
                  onClick={() => setSelectedSession(session)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {getTestTypeIcon(session.test_type)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{session.candidate_name || session.employee_name || "—"}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {getTestTypeLabel(session.test_type)} · {session.completed_at ? new Date(session.completed_at).toLocaleDateString("uz-UZ") : "—"}
                      </div>
                      {session.syndrome && (
                        <Badge className={`mt-1 text-xs border ${SYNDROME_DESCRIPTIONS[session.syndrome]?.color ?? "bg-gray-100 text-gray-700"}`}>
                          {session.syndrome}
                        </Badge>
                      )}
                      {session.iq_level && (
                        <Badge className="mt-1 text-xs bg-blue-100 text-blue-700 border-0">
                          {session.iq_level}
                        </Badge>
                      )}
                    </div>
                    {session.score != null && (
                      <div className={`text-2xl font-bold ${session.test_type === "tool_test" && session.score < 0 ? "text-red-500" : "text-primary"}`}>
                        {session.test_type === "tool_test"
                          ? `${session.score > 0 ? "+" : ""}${session.score}`
                          : `${session.score}%`}
                      </div>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* ─── METHODOLOGY TAB ─────────────────────────────────────────────── */}
        <TabsContent value="methodology" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-0 bg-surface-container-low">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="w-5 h-5 text-violet-500" /> TOOL TEST
                </CardTitle>
                <CardDescription>10 ko'rsatkich (A-J), -100 dan +100 gacha</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {(Array.isArray(INDICATORS) ? INDICATORS : []).map(ind => (
                  <div key={ind.key} className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: ind.color }}>
                      {ind.key}
                    </span>
                    <span className="font-medium">{ind.label}</span>
                    <span className="text-muted-foreground text-xs">— {ind.desc}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 bg-surface-container-low">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" /> Sindromlar (Material №29)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(SYNDROME_DESCRIPTIONS).map(([key, info]) => (
                  <div key={key} className="flex items-start gap-2">
                    <Badge className={`text-[10px] shrink-0 border ${info.color}`}>{info.label}</Badge>
                    <span className="text-xs text-muted-foreground">{info.description}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 bg-surface-container-low">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-blue-500" /> IQ Test darajalari
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(Array.isArray(IQ_LEVELS) ? IQ_LEVELS : []).map(l => (
                  <div key={l.label} className="flex items-center gap-2 text-sm">
                    <span className={`font-medium ${l.color}`}>{l.label}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 bg-surface-container-low">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-500" /> Test turlari maqsadi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><span className="font-medium">TOOL TEST</span> — Shaxsiyat profili, A-J ko'rsatkichlari, sindrom tahlili</div>
                <div><span className="font-medium">IQ Test</span> — Intellektual daraja, mantiqiy fikrlash qobiliyati</div>
                <div><span className="font-medium">Liderlik testi</span> — Muammo kelib chiqish manbaini topish qobiliyati</div>
                <div><span className="font-medium">Takrorlash testi</span> — Ko'rsatmani aniq bajarish qobiliyati (90-100% maqsad)</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── CREATE SESSION DIALOG ─────────────────────────────────────────── */}
      <Dialog open={showCreateSessionDialog} onOpenChange={setShowCreateSessionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Test Sessiyasi Yaratish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs mb-1 block">Test turi *</Label>
              <Select value={sessionForm.test_type} onValueChange={v => setSessionForm(p => ({ ...p, test_type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tool_test">TOOL TEST (Shaxsiyat profili)</SelectItem>
                  <SelectItem value="iq">IQ Test</SelectItem>
                  <SelectItem value="leadership">Liderlik testi</SelectItem>
                  <SelectItem value="replication">Takrorlash testi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Nomzod ID (ixtiyoriy)</Label>
              <Input
                placeholder="Nomzod ID raqami..."
                value={sessionForm.candidate_id}
                onChange={e => setSessionForm(p => ({ ...p, candidate_id: e.target.value }))}
                type="number"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Xodim ID (ixtiyoriy)</Label>
              <Input
                placeholder="Xodim ID raqami..."
                value={sessionForm.employee_id}
                onChange={e => setSessionForm(p => ({ ...p, employee_id: e.target.value }))}
                type="number"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Kanban Funnel ID (ixtiyoriy)</Label>
              <Input
                placeholder="Funnel ID..."
                value={sessionForm.funnel_id}
                onChange={e => setSessionForm(p => ({ ...p, funnel_id: e.target.value }))}
                type="number"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Vakansiya ID (ixtiyoriy)</Label>
              <Input
                placeholder="Vakansiya ID..."
                value={sessionForm.vacancy_id}
                onChange={e => setSessionForm(p => ({ ...p, vacancy_id: e.target.value }))}
                type="number"
              />
            </div>
            <p className="text-xs text-muted-foreground">Test linki 24 soat amal qiladi. Nomzodga link yuborasiz.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateSessionDialog(false)}>Bekor</Button>
            <Button
              onClick={() => createSessionMutation.mutate(sessionForm)}
              disabled={createSessionMutation.isPending}
            >
              {createSessionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Yaratish va link olish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── ADD/EDIT QUESTION DIALOG ─────────────────────────────────────── */}
      <Dialog open={showQuestionDialog} onOpenChange={v => { setShowQuestionDialog(v); if (!v) setEditingQuestion(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? "Savolni tahrirlash" : "Yangi savol qo'shish"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!editingQuestion && (
              <div>
                <Label className="text-xs mb-1 block">Ko'rsatkich</Label>
                <Select value={questionForm.indicator} onValueChange={v => setQuestionForm(p => ({ ...p, indicator: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(INDICATORS) ? INDICATORS : []).map(ind => (
                      <SelectItem key={ind.key} value={ind.key}>{ind.key} — {ind.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-xs mb-1 block">Savol matni (O'zbek) *</Label>
              <Textarea
                placeholder="Savol matni..."
                value={questionForm.text_uz}
                onChange={e => setQuestionForm(p => ({ ...p, text_uz: e.target.value }))}
                rows={3}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Savol matni (Rus) (ixtiyoriy)</Label>
              <Textarea
                placeholder="Вопрос на русском..."
                value={questionForm.text_ru}
                onChange={e => setQuestionForm(p => ({ ...p, text_ru: e.target.value }))}
                rows={2}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Vazn (ko'rsatkich ta'siri)</Label>
              <Select value={questionForm.weight} onValueChange={v => setQuestionForm(p => ({ ...p, weight: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">+2 (Kuchli ijobiy)</SelectItem>
                  <SelectItem value="1">+1 (Ijobiy)</SelectItem>
                  <SelectItem value="-1">-1 (Salbiy)</SelectItem>
                  <SelectItem value="-2">-2 (Kuchli salbiy)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowQuestionDialog(false); setEditingQuestion(null); }}>Bekor</Button>
            <Button
              onClick={() => createQuestionMutation.mutate(questionForm)}
              disabled={createQuestionMutation.isPending || !questionForm.text_uz}
            >
              {createQuestionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingQuestion ? "Yangilash" : "Qo'shish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── RESULTS DETAIL DIALOG ─────────────────────────────────────────── */}
      {selectedSession && (
        <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {getTestTypeLabel(selectedSession.test_type)} natijalari — {selectedSession.candidate_name || selectedSession.employee_name}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-2">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {selectedSession.score != null && (
                    <div className={`text-4xl font-bold ${selectedSession.test_type === "tool_test" && selectedSession.score < 0 ? "text-red-500" : "text-primary"}`}>
                      {selectedSession.test_type === "tool_test"
                        ? `${selectedSession.score > 0 ? "+" : ""}${selectedSession.score}`
                        : `${selectedSession.score}%`}
                    </div>
                  )}
                  {selectedSession.syndrome && (
                    <Badge className={`text-sm border ${SYNDROME_DESCRIPTIONS[selectedSession.syndrome]?.color ?? "bg-gray-100 text-gray-700"}`}>
                      {selectedSession.syndrome}
                    </Badge>
                  )}
                  {selectedSession.iq_level && (
                    <Badge className="text-sm bg-blue-100 text-blue-700 border-0">{selectedSession.iq_level}</Badge>
                  )}
                </div>

                {selectedSession.test_type === "tool_test" && selectedSession.indicators && (
                  <>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={(Array.isArray(INDICATORS) ? INDICATORS : []).map(ind => ({
                          name: ind.key,
                          label: ind.label,
                          value: selectedSession.indicators?.[ind.key] ?? 0,
                        }))}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="label" tick={{ fontSize: 11 }} />
                          <PolarRadiusAxis angle={90} domain={[-100, 100]} tick={{ fontSize: 10 }} />
                          <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                          <RechartTooltip formatter={(v: number) => [`${v}%`, "Ball"]} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-2">
                      {(Array.isArray(INDICATORS) ? INDICATORS : []).map(ind => {
                        const val = selectedSession.indicators?.[ind.key] ?? 0;
                        return (
                          <div key={ind.key} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: ind.color }}>
                                  {ind.key}
                                </span>
                                {ind.label}
                              </span>
                              <span className={`font-bold ${val >= 0 ? "text-green-600" : "text-red-500"}`}>{val > 0 ? "+" : ""}{val}</span>
                            </div>
                            <ScoreBar value={val} color={val >= 0 ? "bg-green-500" : "bg-red-500"} />
                          </div>
                        );
                      })}
                    </div>

                    {selectedSession.syndrome && (
                      <Card className="border-orange-200 bg-orange-50">
                        <CardContent className="p-4">
                          <div className="font-semibold text-orange-800 mb-1">
                            Aniqlangan sindrom: {selectedSession.syndrome}
                          </div>
                          <div className="text-sm text-orange-700">
                            {SYNDROME_DESCRIPTIONS[selectedSession.syndrome]?.description ?? ""}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}

                {selectedSession.test_type === "iq" && (
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-6xl font-bold" style={{ color: getIQLevelInfo(selectedSession.score ?? 0)?.color?.replace("text-", "") || "#000" }}>
                        {selectedSession.score ?? 0}%
                      </div>
                      <div className={`text-xl font-semibold mt-2 ${getIQLevelInfo(selectedSession.score ?? 0)?.color}`}>
                        {selectedSession.iq_level}
                      </div>
                    </div>
                    <div className="mt-4 space-y-1">
                      {(Array.isArray(IQ_LEVELS) ? IQ_LEVELS : []).map(l => (
                        <div key={l.label} className={`flex items-center gap-2 text-sm p-2 rounded ${selectedSession.iq_level === l.label ? "bg-primary/10 font-bold" : ""}`}>
                          <div className={`w-2 h-2 rounded-full ${selectedSession.iq_level === l.label ? "bg-primary" : "bg-muted"}`} />
                          <span className={l.color}>{l.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedSession.test_type === "leadership" && (
                  <div className="text-center space-y-2">
                    <div className="text-6xl font-bold text-orange-600">{selectedSession.score ?? 0}%</div>
                    <p className="text-muted-foreground">
                      {(selectedSession.score ?? 0) >= 80 ? "Yaxshi liderlik qobiliyati" :
                       (selectedSession.score ?? 0) >= 60 ? "O'rta daraja" : "Rivojlanish kerak"}
                    </p>
                  </div>
                )}

                {selectedSession.test_type === "replication" && (
                  <div className="text-center space-y-2">
                    <div className="text-6xl font-bold text-green-600">{selectedSession.score ?? 0}%</div>
                    <p className="text-muted-foreground">
                      {(selectedSession.score ?? 0) >= 90 ? "Juda aniq bajarildi" :
                       (selectedSession.score ?? 0) >= 70 ? "Qoniqarli" : "Aniqlik past"}
                    </p>
                    <p className="text-xs text-muted-foreground">Maqsad: 90-100%</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}

      <ConfirmDialog
        open={confirmDeleteQId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteQId(null); }}
        title="Savolni o'chirish"
        description="Ushbu kapital test savolini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => { if (confirmDeleteQId !== null) deleteQuestionMutation.mutate(confirmDeleteQId); }}
      />
    </div>
  );
}
