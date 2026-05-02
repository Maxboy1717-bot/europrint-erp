import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Target, Users, DollarSign, TrendingUp, BarChart3, Inbox, Globe,
  ArrowRightLeft, Star, AlertTriangle, Flame, Bot, Send, PieChart,
  Phone, Mail, MessageCircle, UserCheck, HelpCircle, Zap, Plus,
} from "lucide-react";
import type { MarketingCampaign } from "@shared/schema";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";

// ─── Type definitionlar ───────────────────────────────────────────────────────
type Segment = { segment: string; label: string; count: number; percent: number; color: string };
type HotLead = { id: string; name: string; company: string | null; score: number | null; closeProbability: number; reason: string };

interface ChurnCustomer {
  id: number; name: string; phone: string | null;
  lastOrderDate: string | null; daysSinceOrder: number | null;
  churnScore: number; riskLevel: "low" | "medium" | "high" | "critical";
  npsAvg: number | null; totalOrders: number;
}

interface ChurnData {
  total: number;
  customers: ChurnCustomer[];
  riskCounts: { critical: number; high: number; medium: number; low: number };
}

interface LeadSourceChannel {
  key: string; label: string; icon: string;
  count: number; converted: number; percent: number; conversionRate: number;
}

interface LeadSourceSummary {
  total: number;
  channels: LeadSourceChannel[];
  topChannel: string;
}

// ─── Yordamchi komponentlar ───────────────────────────────────────────────────
const RISK_LABELS: Record<string, string> = {
  critical: "Kritik", high: "Yuqori", medium: "O'rta", low: "Past",
};
const RISK_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

const CHANNEL_ICONS: Record<string, typeof Phone> = {
  phone: Phone, telegram: MessageCircle, website: Globe,
  email: Mail, referral: UserCheck, other: HelpCircle,
};

// ─── NPS Submission Form ──────────────────────────────────────────────────────
function NpsSubmitDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ score: "8", comment: "", customerId: "" });

  const { data: companies = [] } = useQuery<Array<{ id: number; name: string }>>({
    queryKey: ["/api/crm/companies"],
    enabled: open,
  });

  const npsMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/marketing/nps", data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/nps/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/churn-risk"] });
      setOpen(false);
      setForm({ score: "8", comment: "", customerId: "" });
      const cat = data.npsCategory;
      toast({
        title: cat === "promoter" ? "Promoter — Rahmat!" : cat === "passive" ? "Passive — Yaxshilash kerak" : "Detractor — CRM task yaratildi",
        description: `NPS ${form.score}/10 saqlandi. CRM harakati: ${data.crmActionTriggered ? "Yaratildi" : "Kerak emas"}`,
        variant: cat === "detractor" ? "destructive" : "default",
      });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const scoreNum = parseInt(form.score);
  const npsCategory = scoreNum >= 9 ? "promoter" : scoreNum >= 7 ? "passive" : "detractor";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" data-testid="button-nps-add">
          <Plus className="h-3 w-3 mr-1" />
          NPS qo'shish
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mijoz NPS Bahosi</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Mijoz</Label>
            <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v })}>
              <SelectTrigger data-testid="select-nps-customer">
                <SelectValue placeholder="Mijozni tanlang (ixtiyoriy)" />
              </SelectTrigger>
              <SelectContent>
                {(companies as Array<{ id: number; name: string }>).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Ball (1-10) *</Label>
            <Select value={form.score} onValueChange={(v) => setForm({ ...form, score: v })}>
              <SelectTrigger data-testid="select-nps-score">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} — {n >= 9 ? "Promoter" : n >= 7 ? "Passive" : "Detractor"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className={`mt-2 text-xs px-2 py-1 rounded font-medium w-fit ${npsCategory === "promoter" ? "bg-green-100 text-green-700" : npsCategory === "passive" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
              {npsCategory === "promoter" ? "Promoter — CRM tavsiya beradi" : npsCategory === "passive" ? "Passive — Qo'llab-quvvatlash kerak" : "Detractor — CRM task yaratiladi (24 soat)"}
            </div>
          </div>
          <div>
            <Label>Izoh</Label>
            <Textarea
              placeholder="Mijoz izohi..."
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              rows={3}
              data-testid="textarea-nps-comment"
            />
          </div>
          <Button
            className="w-full"
            onClick={() => npsMutation.mutate({ score: parseInt(form.score), comment: form.comment || undefined, customerId: form.customerId ? parseInt(form.customerId) : undefined })}
            disabled={npsMutation.isPending}
            data-testid="button-nps-submit"
          >
            {npsMutation.isPending ? "Saqlanmoqda..." : "NPS Saqlash"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── AI Churn Signal ──────────────────────────────────────────────────────────
function AiChurnSignal() {
  const { toast } = useToast();
  const [result, setResult] = useState<{
    riskCustomersCount: number; npsAvg: string;
    aiSignal: { churnRiskLevel?: string; urgentActions?: string[]; retentionCampaignIdea?: string; predictedChurnNextMonth?: number; keyInsight?: string };
  } | null>(null);

  const aiMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/marketing/churn-risk/ai-signal", {}),
    onSuccess: (data) => {
      setResult(data);
      toast({ title: "AI churn tahlili tayyor!" });
    },
    onError: () => toast({ title: "AI signal xatoligi", variant: "destructive" }),
  });

  return (
    <div className="space-y-3">
      <Button
        size="sm"
        variant="outline"
        onClick={() => aiMutation.mutate()}
        disabled={aiMutation.isPending}
        className="w-full"
        data-testid="button-ai-churn-signal"
      >
        <Zap className={`h-3 w-3 mr-1 ${aiMutation.isPending ? "animate-pulse" : ""}`} />
        {aiMutation.isPending ? "AI tahlil qilmoqda..." : "AI Churn Signal"}
      </Button>

      {result && (
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Xavf darajasi:</span>
            <Badge className={`${RISK_COLORS[result.aiSignal.churnRiskLevel || "low"]} text-xs`}>
              {RISK_LABELS[result.aiSignal.churnRiskLevel || "low"]}
            </Badge>
            <span className="text-muted-foreground">Bashorat: {result.aiSignal.predictedChurnNextMonth} ta</span>
          </div>
          {result.aiSignal.keyInsight && (
            <div className="p-2 bg-muted rounded-md text-muted-foreground">{result.aiSignal.keyInsight}</div>
          )}
          {result.aiSignal.urgentActions && result.aiSignal.urgentActions.length > 0 && (
            <div className="space-y-1">
              <div className="font-medium text-foreground">Tezkor harakatlar:</div>
              {(Array.isArray(result.aiSignal.urgentActions) ? result.aiSignal.urgentActions : []).map((a, i) => (
                <div key={`k-${i}`} className="flex items-start gap-1">
                  <span className="text-orange-500 shrink-0">•</span>
                  <span>{a}</span>
                </div>
              ))}
            </div>
          )}
          {result.aiSignal.retentionCampaignIdea && (
            <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md text-blue-700 dark:text-blue-300">
              Kampaniya g'oyasi: {result.aiSignal.retentionCampaignIdea}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Asosiy komponent ─────────────────────────────────────────────────────────
export default function MarketingDashboard() {
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  const aiMutation = useMutation({
    mutationFn: (question: string) => apiRequest("POST", "/api/marketing/ai-assistant", { question }),
    onSuccess: (data: { answer: string }) => setAiAnswer(data.answer),
  });

  const { data: segments = [] } = useQuery<Segment[]>({ queryKey: ["/api/marketing/segments"] });
  const { data: hotLeads = [] } = useQuery<HotLead[]>({ queryKey: ["/api/marketing/ai/hot-leads"] });
  const { data: leadSources } = useQuery<LeadSourceSummary>({ queryKey: ["/api/marketing/leads/sources/summary"] });

  const { data: stats, isLoading: statsLoading, isError, refetch } = useQuery<{
    activeCampaigns: number; totalLeads: number; recentLeads: number;
    totalContent: number; exhibitions: number; totalBudget: string;
    totalSpent: string; channelStats: { channel: string; count: number }[];
    convertedLeads: number; conversionRate: number;
  }>({ queryKey: ["/api/marketing/dashboard/stats"] });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery<MarketingCampaign[]>({
    queryKey: ["/api/marketing/campaigns"],
  });

  const { data: inboxStats } = useQuery<{ totalConversations: number; openConversations: number; unreadCount: number }>({
    queryKey: ["/api/marketing/inbox/stats"],
  });

  const { data: blogPosts = [] } = useQuery<Record<string, unknown>[]>({
    queryKey: ["/api/marketing/website/blog"],
  });

  const { data: npsStats } = useQuery<{
    avgScore: number; monthlyAvg: number; totalResponses: number;
    recentResponses: number; lastComments: { id: string; score: number; comment: string | null; createdAt: string }[];
  }>({ queryKey: ["/api/marketing/nps/stats"] });

  const { data: churnData } = useQuery<ChurnData>({
    queryKey: ["/api/marketing/churn-risk"],
  });

  const activeCampaigns = (Array.isArray(campaigns) ? campaigns : []).filter((c) => c.status === "active");
  const publishedPosts = (Array.isArray(blogPosts) ? blogPosts : []).filter((p: { isPublished?: boolean }) => p.isPublished).length || 0;
  const conversionRate = stats?.conversionRate ?? 0;
  const convertedLeads = stats?.convertedLeads ?? 0;
  const totalLeads = stats?.totalLeads ?? 0;

  const statCards = [
    { title: "Faol Kampaniyalar", value: stats?.activeCampaigns || 0, icon: Target, color: "text-orange-500" },
    { title: "Jami Lidlar", value: totalLeads, icon: Users, color: "text-blue-500" },
    { title: "Yangi Lidlar (30 kun)", value: stats?.recentLeads || 0, icon: TrendingUp, color: "text-green-500" },
    { title: "Social Inbox", value: inboxStats?.openConversations || 0, icon: Inbox, color: "text-purple-500", subtitle: `${inboxStats?.unreadCount || 0} o'qilmagan` },
    { title: "Blog Maqolalar", value: publishedPosts, icon: Globe, color: "text-emerald-500", subtitle: `${blogPosts?.length || 0} jami` },
    { title: "Umumiy Byudjet", value: `${Number(stats?.totalBudget || 0).toLocaleString()} so'm`, icon: DollarSign, color: "text-amber-500" },
  ];

  if (isError) return <ErrorState onRetry={refetch} />;

  if (statsLoading) {
    return (
      <div className="space-y-6 p-6" data-testid="marketing-dashboard-loading">
        <PageHeader label="Europrint ERP · Marketing" title="Marketing" boldWord="Dashboard" subtitle="Kampaniyalar, lidlar va konversiya analitikasi" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-28 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-surface p-6" data-testid="marketing-dashboard">
      <h1 className="text-4xl font-light tracking-tight text-on-surface mb-6">
        Marketing <span className="font-bold text-primary">Dashboard</span>
      </h1>

      {/* ─── Stat kartalar ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {(Array.isArray(statCards) ? statCards : []).map((stat) => (
          <div key={stat.title} className="bg-surface-container-lowest rounded-lg p-5" data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s/g, "-")}`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{stat.title}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-4xl font-bold tracking-tight text-on-surface">{stat.value}</p>
              <stat.icon className={`h-8 w-8 ${stat.color} opacity-20`} />
            </div>
            {"subtitle" in stat && stat.subtitle && <p className="text-xs text-on-surface-variant mt-1">{stat.subtitle}</p>}
          </div>
        ))}

        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-crm-conversion">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">CRM Konversiya</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-4xl font-bold tracking-tight text-on-surface" data-testid="text-conversion-rate">
              {statsLoading ? "..." : `${conversionRate}%`}
            </p>
            <ArrowRightLeft className="h-8 w-8 text-violet-500 opacity-20" />
          </div>
          <p className="text-xs text-on-surface-variant mt-1" data-testid="text-conversion-detail">
            {convertedLeads} ta lid CRM ga o'tkazildi, jami {totalLeads} ta lid
          </p>
        </div>
      </div>

      {/* ─── Kampaniyalar + Kanal statistikasi ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-surface-container-lowest rounded-xl p-6 overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-orange-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Faol Kampaniyalar</h3>
          </div>
          {campaignsLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-12" />)}</div>
          ) : activeCampaigns.length === 0 ? (
            <p className="text-on-surface-variant text-sm">Hozircha faol kampaniyalar yo'q</p>
          ) : (
            <div className="divide-y divide-outline-variant">
              {(Array.isArray(activeCampaigns) ? activeCampaigns : []).slice(0, 5).map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between gap-2 py-3" data-testid={`campaign-item-${campaign.id}`}>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-on-surface truncate">{campaign.name}</p>
                    <p className="text-sm text-on-surface-variant">{campaign.platform}</p>
                  </div>
                  <Badge variant="secondary" className="bg-surface-container text-on-surface rounded-lg px-2.5 py-0.5 text-xs font-semibold no-default-hover-elevate">{campaign.type}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Task #4: 5-kanal lead source breakdown ─────────────────── */}
        <div className="bg-surface-container-lowest rounded-xl p-6 overflow-hidden" data-testid="card-lead-sources">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Lead Manba Kanallari</h3>
            {leadSources?.topChannel && (
              <Badge className="text-xs bg-blue-100 text-blue-700 no-default-hover-elevate ml-auto">
                Top: {leadSources.channels?.find(c => c.key === leadSources.topChannel)?.label || leadSources.topChannel}
              </Badge>
            )}
          </div>
          {!leadSources ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-10" />)}</div>
          ) : leadSources.total === 0 ? (
            <p className="text-sm text-on-surface-variant">Hali kanal ma'lumotlari yo'q</p>
          ) : (
            <div className="space-y-3">
              {(Array.isArray(leadSources.channels) ? leadSources.channels : []).map((ch) => {
                const IconComp = CHANNEL_ICONS[ch.key] || HelpCircle;
                return (
                  <div key={ch.key} data-testid={`source-channel-${ch.key}`}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <IconComp className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-on-surface">{ch.label}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <span>{ch.count} lid</span>
                        <span className="text-green-600">{ch.conversionRate}% konversiya</span>
                      </div>
                    </div>
                    <Progress value={ch.percent} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Byudjet ────────────────────────────────────────────────────── */}
      <div className="bg-surface-container-lowest rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-amber-500" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Byudjet Xulosa</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-surface-container-low text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Umumiy Byudjet</p>
            <p className="text-xl font-bold text-on-surface">{Number(stats?.totalBudget || 0).toLocaleString()} so'm</p>
          </div>
          <div className="p-4 rounded-lg bg-surface-container-low text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Sarflangan</p>
            <p className="text-xl font-bold text-on-surface">{Number(stats?.totalSpent || 0).toLocaleString()} so'm</p>
          </div>
          <div className="p-4 rounded-lg bg-surface-container-low text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Qoldiq</p>
            <p className="text-xl font-bold text-on-surface">{(Number(stats?.totalBudget || 0) - Number(stats?.totalSpent || 0)).toLocaleString()} so'm</p>
          </div>
        </div>
      </div>

      {/* ─── Segmentlar + Issiq Lidlar ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-surface-container-lowest rounded-xl p-6" data-testid="card-segments">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="h-5 w-5 text-purple-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Mijozlar Segmentatsiyasi</h3>
          </div>
          <div className="space-y-3">
            {segments.length === 0 ? (
              <p className="text-sm text-on-surface-variant">Segment ma'lumotlari yuklanmoqda...</p>
            ) : (Array.isArray(segments) ? segments : []).map((seg, idx) => (
              <div key={seg.segment ?? `seg-${idx}`} className="flex items-center gap-3" data-testid={`segment-${seg.segment ?? idx}`}>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-on-surface">{seg.label}</span>
                    <span className="text-on-surface-variant">{seg.count} ({seg.percent}%)</span>
                  </div>
                  <div className="bg-surface-container rounded-full h-1.5">
                    <div className={`rounded-full h-1.5 transition-all ${seg.color === "green" ? "bg-green-500" : seg.color === "orange" ? "bg-orange-500" : seg.color === "red" ? "bg-red-500" : "bg-blue-500"}`}
                      style={{ width: `${Math.max(seg.percent, 2)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-6" data-testid="card-hot-leads">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="h-5 w-5 text-red-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Issiq Lidlar (AI Bashorat)</h3>
          </div>
          <div className="space-y-2">
            {hotLeads.length === 0 ? (
              <p className="text-sm text-on-surface-variant">Hozircha issiq lidlar yo'q</p>
            ) : (Array.isArray(hotLeads) ? hotLeads : []).map(lead => (
              <div key={lead.id} className="flex items-center gap-3 p-3 bg-surface-container rounded-lg" data-testid={`hot-lead-${lead.id}`}>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-on-surface text-sm truncate">{lead.name}</p>
                  {lead.company && <p className="text-xs text-on-surface-variant truncate">{lead.company}</p>}
                  <p className="text-xs text-on-surface-variant mt-0.5">{lead.reason}</p>
                </div>
                <div className="text-right shrink-0">
                  <Badge className="bg-orange-100 text-orange-800 text-xs no-default-hover-elevate">{lead.score} ball</Badge>
                  <p className="text-xs text-green-600 font-medium mt-1">{lead.closeProbability}% ehtimol</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── AI Marketing Assistant ──────────────────────────────────────── */}
      <div className="bg-surface-container-lowest rounded-xl p-6 mb-6" data-testid="card-ai-assistant">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">AI Marketing Assistant</h3>
        </div>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Marketing bo'yicha savol bering..."
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && aiQuestion.trim()) { aiMutation.mutate(aiQuestion); setAiQuestion(""); } }}
            data-testid="input-ai-question"
            className="flex-1"
          />
          <Button size="icon" onClick={() => { aiMutation.mutate(aiQuestion); setAiQuestion(""); }} disabled={!aiQuestion.trim() || aiMutation.isPending} data-testid="button-ai-send">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {aiMutation.isPending && <div className="bg-surface-container rounded-lg p-4"><Skeleton className="h-4 mb-2" /><Skeleton className="h-4 w-3/4" /></div>}
        {aiAnswer && !aiMutation.isPending && (
          <div className="bg-surface-container rounded-lg p-4" data-testid="text-ai-answer">
            <div className="flex items-start gap-2">
              <Bot className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-on-surface whitespace-pre-wrap">{aiAnswer}</p>
            </div>
          </div>
        )}
        {!aiAnswer && !aiMutation.isPending && (
          <div className="flex gap-2 flex-wrap">
            {(["Qaysi kanal eng samarali?", "Konversiya oshirish uchun nima qilish kerak?"]).map(q => (
              <Button key={q} variant="outline" size="sm" className="text-xs" onClick={() => { aiMutation.mutate(q); }} data-testid={`button-ai-suggestion`}>{q}</Button>
            ))}
          </div>
        )}
      </div>

      {/* ─── NPS + Churn ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Task #3: NPS to'plash + CRM feedback ─────────────────────── */}
        <div className="bg-surface-container-lowest rounded-xl p-6 overflow-hidden" data-testid="card-nps">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">NPS — Mijoz Mamnuniyati</h3>
            </div>
            <NpsSubmitDialog />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 rounded-lg bg-surface-container-low text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">O'rtacha Ball</p>
              <p className="text-2xl font-bold text-on-surface" data-testid="text-nps-avg">
                {npsStats?.avgScore ?? "—"} <span className="text-sm font-normal text-on-surface-variant">/ 10</span>
              </p>
            </div>
            <div className="p-3 rounded-lg bg-surface-container-low text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">30 Kunlik O'rtacha</p>
              <p className="text-2xl font-bold text-on-surface" data-testid="text-nps-monthly">
                {npsStats?.monthlyAvg ?? "—"} <span className="text-sm font-normal text-on-surface-variant">/ 10</span>
              </p>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant mb-3">
            Jami {npsStats?.totalResponses ?? 0} ta baho, so'nggi 30 kunda {npsStats?.recentResponses ?? 0} ta
          </p>
          <div className="text-xs text-muted-foreground mb-3 p-2 bg-muted rounded-md">
            NPS ≤6 (Detractor) → CRM task 24 soat ichida · ≤8 (Passive) → CRM task 72 soat
          </div>
          {npsStats?.lastComments && npsStats.lastComments.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">So'nggi izohlar:</p>
              {(Array.isArray(npsStats.lastComments) ? npsStats.lastComments : []).map((c) => (
                <div key={c.id} className="flex items-start gap-2 p-3 rounded-lg bg-surface-container-low text-sm" data-testid={`nps-comment-${c.id}`}>
                  <Badge variant="outline" className={`shrink-0 ${parseInt(String(c.score)) >= 9 ? "border-green-300 text-green-700" : parseInt(String(c.score)) >= 7 ? "border-yellow-300 text-yellow-700" : "border-red-300 text-red-700"}`}>{c.score}/10</Badge>
                  <span className="text-on-surface truncate">{c.comment}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">Hali NPS baholari yo'q</p>
          )}
        </div>

        {/* Task #1: AI Churn aniqlash — multi-factor signal ───────────── */}
        <div className="bg-surface-container-lowest rounded-xl p-6 overflow-hidden" data-testid="card-churn-risk">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Churn Xavfi (Multi-factor)</h3>
          </div>

          {/* Xavf darajalari ─────────────────────────────────────── */}
          {churnData?.riskCounts && (
            <div className="grid grid-cols-4 gap-2 mb-4">
              {(["critical", "high", "medium", "low"] as const).map((level) => (
                <div key={level} className={`text-center p-2 rounded-md ${RISK_COLORS[level]}`} data-testid={`churn-risk-${level}`}>
                  <div className="text-lg font-bold">{churnData.riskCounts[level]}</div>
                  <div className="text-xs">{RISK_LABELS[level]}</div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <p className="text-4xl font-bold tracking-tight text-on-surface" data-testid="text-churn-count">
              {churnData?.total ?? 0}
            </p>
            <p className="text-sm text-on-surface-variant">ta mijoz 30+ kun buyurtma bermagan</p>
          </div>

          {/* AI signal ─────────────────────────────────────────── */}
          <AiChurnSignal />

          {/* Yuqori xavfli mijozlar ──────────────────────────── */}
          {churnData?.customers && churnData.customers.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Eng yuqori xavf:</p>
              {(Array.isArray(churnData?.customers) ? churnData.customers : []).slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-surface-container-low text-sm" data-testid={`churn-customer-${c.id}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-on-surface truncate">{c.name}</p>
                      <Badge className={`text-xs ${RISK_COLORS[c.riskLevel]} shrink-0 no-default-hover-elevate`}>
                        {c.churnScore}
                      </Badge>
                    </div>
                    {c.phone && <p className="text-xs text-on-surface-variant">{c.phone}</p>}
                    {c.npsAvg !== null && (
                      <p className="text-xs text-muted-foreground">NPS: {c.npsAvg}/10</p>
                    )}
                  </div>
                  <Badge className={`${RISK_COLORS[c.riskLevel]} rounded-full px-2.5 py-0.5 text-xs font-semibold no-default-hover-elevate shrink-0`}>
                    {c.daysSinceOrder ? `${c.daysSinceOrder} kun` : "Hech qachon"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          {(!churnData?.customers || churnData.customers.length === 0) && (
            <p className="text-sm text-green-600 font-medium mt-4">Barcha mijozlar faol</p>
          )}
        </div>
      </div>
    </div>
  );
}
