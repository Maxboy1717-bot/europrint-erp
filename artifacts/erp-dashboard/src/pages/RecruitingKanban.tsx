import React, { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useChatStore } from "@/store/chatStore";
import { getSharedSocket } from "@/hooks/chat/useChatSocket";
import { WORKER_TYPE_META } from "@/lib/workerType";
import type { WorkerType } from "@/lib/workerType";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Briefcase, TrendingUp, Users, CheckCircle, XCircle, ChevronDown, ChevronUp,
  AlertTriangle, Zap, BookOpen, Globe, Bot, CalendarDays, MessageSquare,
} from "lucide-react";
import { VacancyPortretDialog } from "./VacancyPortretDialog";
import { ProductivityInterviewDialog } from "./ProductivityInterviewDialog";
import { JobOfferDialog } from "@/components/hr/JobOfferDialog";
import { HRAlertBanner } from "./HRAlertBanner";
import { LaborMarketSheet } from "@/components/hr/LaborMarketSheet";
import { CandidateReportDialog } from "./CandidateReportDialog";
import { OnboardingRoadmapDialog } from "@/components/hr/OnboardingRoadmapDialog";
import {
  type FunnelStage,
  STAGES, NEXT_STAGE, TERMINAL_STAGES, HC_PHASES, getPhaseForStage,
  StatCard, HCMethodologyBanner, ChannelDots, ChannelStatusPanel,
  VacancyMarketBadge,
} from "@/components/recruiting/helpers";
import type { PipelineEntry, Vacancy, CreateVacancyResponse, AIInterviewSession } from "@/components/recruiting/types";
import { CandidateCard } from "@/components/recruiting/CandidateCard";
import { RecruitingHeaderActions } from "@/components/recruiting/RecruitingHeaderActions";

export default function RecruitingKanban() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newForm, setNewForm] = useState({ fullName: "", phone: "", email: "", source: "OTHER", notes: "", vacancyId: "none" });
  const [filterVacancy, setFilterVacancy] = useState<string>("all");
  const [showProbationOnly, setShowProbationOnly] = useState(false);

  // ─── Context room navigation ──────────────────────────────────────────────
  const [, setLocation] = useLocation();
  const setActiveRoomId = useChatStore((s) => s.setActiveRoomId);
  const [openingContextRoom, setOpeningContextRoom] = useState<number | null>(null);

  const handleOpenVacancyChat = useCallback(async (vacancyId: number, vacancyTitle: string) => {
    setOpeningContextRoom(vacancyId);
    try {
      const res = await apiRequest("POST", "/api/chat/context-room", {
        entityType: "vacancy",
        entityId: String(vacancyId),
        name: `Vakansiya: ${vacancyTitle}`,
      }) as { roomId: string };
      const roomId = res.roomId;
      setActiveRoomId(roomId);
      const socket = getSharedSocket();
      if (socket) {
        socket.emit("room:join", { roomId });
        socket.emit("messages:list", { roomId });
      }
      setLocation("/chat");
    } catch {
      // Silently ignore
    } finally {
      setOpeningContextRoom(null);
    }
  }, [setActiveRoomId, setLocation]);
  const [vacancyPanelOpen, setVacancyPanelOpen] = useState(false);
  const [portretVacancy, setPortretVacancy] = useState<Vacancy | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [interviewEntry, setInterviewEntry] = useState<PipelineEntry | null>(null);
  const [jobOfferEntry, setJobOfferEntry] = useState<PipelineEntry | null>(null);
  const [reportEntry, setReportEntry] = useState<PipelineEntry | null>(null);
  const [roadmapEntry, setRoadmapEntry] = useState<PipelineEntry | null>(null);
  const [createVacancyOpen, setCreateVacancyOpen] = useState(false);
  const [channelPanelVacancyId, setChannelPanelVacancyId] = useState<number | null>(null);
  const [cpPanelOpen, setCpPanelOpen] = useState<Set<number>>(new Set());
  const [marketVacancy, setMarketVacancy] = useState<Vacancy | null>(null);
  const [newVacancyForm, setNewVacancyForm] = useState({ title: "", vacancy_type: "STANDARD", deadline_working_days: 15 });

  const createVacancyMutation = useMutation({
    mutationFn: async (form: typeof newVacancyForm) => {
      const res = await apiRequest("POST", "/api/hr/recruitment/vacancies", {
        title: form.title, vacancy_type: form.vacancy_type,
        deadline_working_days: form.deadline_working_days, status: "open",
      }) as CreateVacancyResponse;
      return res.data;
    },
    onSuccess: (row, form) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/recruitment/vacancies"] });
      setCreateVacancyOpen(false);
      setNewVacancyForm({ title: "", vacancy_type: "STANDARD", deadline_working_days: 15 });
      toast({ title: "Vakansiya yaratildi! Endi Portretni to'ldiring." });
      const newId = row?.id;
      const newTitle = row?.title || form.title;
      if (newId) setPortretVacancy({ id: newId, title: newTitle, status: "open", is_urgent: false });
    },
    onError: () => toast({ title: "Vakansiya yaratishda xatolik", variant: "destructive" }),
  });

  const { data: pipelineData, isLoading } = useQuery<{ data: PipelineEntry[] }>({ queryKey: ["/api/hr/recruitment/pipeline"], staleTime: 30_000 });
  const { data: vacanciesData } = useQuery<{ data: Vacancy[] }>({ queryKey: ["/api/hr/recruitment/vacancies"], staleTime: 60_000 });
  const { data: aiSessionsData } = useQuery<AIInterviewSession[]>({ queryKey: ["/api/hr/ai-interview/sessions"], staleTime: 30_000 });

  const entries: PipelineEntry[] = pipelineData?.data ?? [];
  const vacancies: Vacancy[] = vacanciesData?.data ?? [];
  const aiSessions: AIInterviewSession[] = Array.isArray(aiSessionsData) ? aiSessionsData : [];
  const openVacancies = (Array.isArray(vacancies) ? vacancies : []).filter(v => v.status === "open" || v.status === "active");
  const urgentVacancies = (Array.isArray(openVacancies) ? openVacancies : []).filter(v => v.is_urgent);

  const updateMutation = useMutation({
    mutationFn: ({ id, funnel_stage }: { id: number; funnel_stage: FunnelStage }) =>
      apiRequest("PATCH", `/api/hr/recruitment/pipeline/${id}/stage`, { funnel_stage }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/hr/recruitment/pipeline"] }); toast({ title: "Bosqich yangilandi" }); },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/hr/recruitment/pipeline/${id}/stage`, { funnel_stage: "REJECTED", rejection_reason: "Kanban orqali rad etildi" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/hr/recruitment/pipeline"] }); toast({ title: "Nomzod rad etildi" }); },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const ndaRequestMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) =>
      apiRequest("POST", `/api/hr/recruitment/pipeline/${id}/nda-request`, { notes }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/hr/recruitment/pipeline"] }); toast({ title: "NDA so'rovi yuborildi" }); },
    onError: () => toast({ title: "NDA so'rovida xatolik", variant: "destructive" }),
  });

  const offerMutation = useMutation({
    mutationFn: ({ id, salary, start_date }: { id: number; salary?: number; start_date?: string }) =>
      apiRequest("POST", `/api/hr/recruitment/pipeline/${id}/offer`, { salary, start_date }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/hr/recruitment/pipeline"] }); toast({ title: "Taklif yuborildi" }); },
    onError: () => toast({ title: "Taklifda xatolik", variant: "destructive" }),
  });

  const createMutation = useMutation({
    mutationFn: async (form: typeof newForm) => {
      const candidateRes = await apiRequest("POST", "/api/candidates", {
        fullName: form.fullName, phone: form.phone, email: form.email || null,
        source: form.source.toLowerCase(), notes: form.notes || null,
        vacancyId: form.vacancyId === "none" ? null : form.vacancyId, status: "new",
      });
      const candidateData = candidateRes as { id?: number };
      const candidateId = candidateData?.id;
      if (candidateId) {
        await apiRequest("POST", "/api/hr/recruitment/vacancy/candidates", {
          candidate_id: candidateId,
          vacancy_id: form.vacancyId === "none" ? null : Number(form.vacancyId),
          source: form.source.toUpperCase(),
        }).catch(() => null);
      }
      return candidateRes;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/recruitment/pipeline"] });
      setAddOpen(false);
      setNewForm({ fullName: "", phone: "", email: "", source: "OTHER", notes: "", vacancyId: "none" });
      toast({ title: "Nomzod qo'shildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const filtered = (Array.isArray(entries) ? entries : []).filter(e => {
    const matchSearch = !search || e.candidate_name.toLowerCase().includes(search.toLowerCase()) || e.candidate_phone.includes(search);
    const matchVacancy = filterVacancy === "all" || String(e.vacancy_id) === filterVacancy;
    const matchProbation = !showProbationOnly || e.funnel_stage === "PROBATION" || e.funnel_stage === "SINOV_COMPLETE";
    return matchSearch && matchVacancy && matchProbation;
  });

  const byStage = (stage: FunnelStage) => (Array.isArray(filtered) ? filtered : []).filter(e => e.funnel_stage === stage);
  const counts = STAGES.reduce((acc, s) => { acc[s.key] = (Array.isArray(entries) ? entries : []).filter(e => e.funnel_stage === s.key).length; return acc; }, {} as Record<FunnelStage, number>);
  const hiredCount = (counts.HIRED ?? 0) + (counts.PROBATION ?? 0) + (counts.SINOV_COMPLETE ?? 0);
  const rejectedCount = counts.REJECTED ?? 0;
  const activeCount = (Array.isArray(entries) ? entries : []).filter(e => !TERMINAL_STAGES.includes(e.funnel_stage)).length;
  const conversionRate = hiredCount + rejectedCount > 0 ? Math.round((hiredCount / (hiredCount + rejectedCount)) * 100) : 0;
  const vacancyMap = Object.fromEntries((Array.isArray(vacancies) ? vacancies : []).map(v => [v.id, v]));

  return (
    <div className="flex-1 overflow-auto bg-surface p-6 flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">Yollash <span className="font-bold text-primary">Kanban</span></h1>
          <p className="text-on-surface-variant -mt-1">HR Capital 7-bosqich metodologiyasi · Vakansiya muddatiga asoslangan</p>
        </div>
        <RecruitingHeaderActions
          urgentVacancyCount={urgentVacancies.length}
          search={search}
          setSearch={setSearch}
          createVacancyOpen={createVacancyOpen}
          setCreateVacancyOpen={setCreateVacancyOpen}
          newVacancyForm={newVacancyForm}
          setNewVacancyForm={setNewVacancyForm}
          createVacancyMutation={createVacancyMutation}
          addOpen={addOpen}
          setAddOpen={setAddOpen}
          newForm={newForm}
          setNewForm={setNewForm}
          openVacancies={openVacancies}
          createMutation={createMutation}
        />
      </div>

      <HCMethodologyBanner />

      <div className="flex flex-wrap gap-3 mb-4">
        <StatCard icon={Users} label="Jami nomzodlar" value={entries.length} />
        <StatCard icon={TrendingUp} label="Faol jarayonlar" value={activeCount} />
        <StatCard icon={CheckCircle} label="Qabul qilindi" value={hiredCount} color="bg-green-500" />
        <StatCard icon={XCircle} label="Rad etildi" value={rejectedCount} color="bg-red-500" />
        <StatCard icon={TrendingUp} label="Samaradorlik" value={`${conversionRate}%`} />
        <StatCard icon={Briefcase} label="Ochiq vakansiya" value={openVacancies.length} color="bg-indigo-500" />
        <StatCard icon={AlertTriangle} label="Shoshilinch" value={urgentVacancies.length} color="bg-red-500" />
        <StatCard icon={Bot} label="AI Sessiyalar" value={aiSessions.length} color="bg-violet-500" />
        <StatCard icon={CalendarDays} label="Sinov davri" value={counts.PROBATION ?? 0} color="bg-emerald-500" />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Button size="sm" variant={showProbationOnly ? "default" : "outline"} onClick={() => setShowProbationOnly(p => !p)} className={showProbationOnly ? "bg-emerald-600 hover:bg-emerald-700 border-emerald-600" : "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"} data-testid="button-filter-probation">
          <CalendarDays className="w-3.5 h-3.5 mr-1" />Sinov Davri ({(counts.PROBATION ?? 0) + (counts.SINOV_COMPLETE ?? 0)})
        </Button>
        {showProbationOnly && <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5">Faqat sinov davrida</span>}
      </div>

      <div className="mb-4">
        <Button variant="outline" size="sm" onClick={() => setVacancyPanelOpen(p => !p)} className="mb-2 gap-2" data-testid="button-toggle-vacancies">
          <Briefcase className="w-4 h-4" />Vakansiyalar ({openVacancies.length})
          {vacancyPanelOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </Button>
        {vacancyPanelOpen && (
          <div className="bg-surface-container rounded-xl p-4 mb-3 border border-border/50">
            <div className="flex flex-wrap gap-2 mb-3">
              <Button size="sm" variant={filterVacancy === "all" ? "default" : "outline"} onClick={() => setFilterVacancy("all")} data-testid="filter-vacancy-all">Hammasi</Button>
              {(Array.isArray(openVacancies) ? openVacancies : []).map(v => (
                <Button key={v.id} size="sm" variant={filterVacancy === String(v.id) ? "default" : "outline"} onClick={() => setFilterVacancy(filterVacancy === String(v.id) ? "all" : String(v.id))} data-testid={`filter-vacancy-${v.id}`} className={`max-w-[200px] truncate ${v.is_urgent ? "border-red-500/50" : ""}`}>
                  {v.is_urgent && <AlertTriangle className="w-3 h-3 mr-1 text-red-400" />}{v.title}
                </Button>
              ))}
              {openVacancies.length === 0 && <span className="text-sm text-muted-foreground">Ochiq vakansiyalar yo'q</span>}
            </div>
            {openVacancies.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {(Array.isArray(openVacancies) ? openVacancies : []).map(v => {
                  const entryCount = (Array.isArray(entries) ? entries : []).filter(e => e.vacancy_id === v.id).length;
                  const hasPortret = !!v.portret;
                  return (
                    <Card key={v.id} className={`cursor-pointer transition-all ${filterVacancy === String(v.id) ? "ring-2 ring-primary" : ""} ${v.is_urgent ? "border-red-500/40" : ""}`} onClick={() => setFilterVacancy(filterVacancy === String(v.id) ? "all" : String(v.id))} data-testid={`vacancy-card-${v.id}`}>
                      <CardContent className="p-3">
                        <div className="flex items-start gap-1 justify-between mb-1">
                          <div className="font-medium text-sm truncate leading-tight">{v.title}</div>
                          {v.is_urgent && <Badge className="bg-red-500 text-white text-[9px] px-1 py-0 shrink-0"><Zap className="w-2.5 h-2.5" /></Badge>}
                        </div>
                        {v.department_name && <div className="text-xs text-muted-foreground truncate">{v.department_name}</div>}
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          <Badge variant="outline" className="text-xs">{entryCount} nomzod</Badge>
                          {v.vacancy_type && <Badge variant="secondary" className="text-[10px]">{v.vacancy_type}</Badge>}
                          {v.deadline_working_days && <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400">SLA: {v.deadline_working_days} k.k.</Badge>}
                        </div>
                        <ChannelDots channels={v.channels} />
                        <VacancyMarketBadge vacancyId={v.id} />
                        <div className="flex items-center gap-1 mt-2 flex-wrap">
                          <Button size="sm" variant="outline" className={`h-6 text-[10px] px-2 ${hasPortret ? "border-purple-500/40 text-purple-400" : ""}`} onClick={e => { e.stopPropagation(); setPortretVacancy(v); }}>
                            <BookOpen className="w-2.5 h-2.5 mr-1" />{hasPortret ? "Portret ✓" : "Portret"}
                          </Button>
                          <Button size="sm" variant="outline" className={`h-6 text-[10px] px-2 gap-0.5 ${channelPanelVacancyId === v.id ? "border-primary/50 text-primary" : "border-border/40"}`} onClick={e => { e.stopPropagation(); setChannelPanelVacancyId(channelPanelVacancyId === v.id ? null : v.id); }} data-testid={`button-channels-${v.id}`}>
                            <Globe className="w-2.5 h-2.5" />Kanallar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-[10px] px-2 gap-0.5 border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                            onClick={e => { e.stopPropagation(); handleOpenVacancyChat(v.id, v.title); }}
                            data-testid={`button-vacancy-chat-${v.id}`}
                            disabled={openingContextRoom === v.id}
                          >
                            <MessageSquare className="w-2.5 h-2.5" />
                            {openingContextRoom === v.id ? "..." : "Chat"}
                          </Button>
                        </div>
                        {channelPanelVacancyId === v.id && (
                          <div className="mt-2" onClick={e => e.stopPropagation()}>
                            <ChannelStatusPanel vacancy={v} onUpdate={() => queryClient.invalidateQueries({ queryKey: ["/api/hr/recruitment/vacancies"] })} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {filterVacancy !== "all" && (
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">Filtr: {(openVacancies ?? []).find(v => String(v.id) === filterVacancy)?.title}</Badge>
            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setFilterVacancy("all")}>× Tozalash</Button>
          </div>
        )}
      </div>

      <HRAlertBanner className="mb-3" />

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-3 pb-4 h-full min-w-max">
          {(Array.isArray(STAGES) ? STAGES : []).map(stage => {
            const phase = getPhaseForStage(stage.key);
            return (
              <div key={stage.key} data-testid={`column-stage-${stage.key}`} className="flex flex-col bg-surface-container-low rounded-xl p-4 w-64 shrink-0 min-h-[400px]">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${stage.accent}`} />
                    <span className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">{stage.label}</span>
                  </div>
                  <Badge variant="secondary" data-testid={`badge-count-${stage.key}`}>{counts[stage.key]}</Badge>
                </div>
                {phase && <div className={`text-[9px] mb-2 px-1.5 py-0.5 rounded ${phase.color}/15 text-muted-foreground font-medium`}>{phase.num}-bosqich: {phase.label}</div>}
                <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
                  {isLoading && <div className="text-xs text-muted-foreground text-center py-4">Yuklanmoqda...</div>}
                  {byStage(stage.key).map(entry => (
                    <CandidateCard
                      key={entry.id}
                      entry={entry}
                      stage={stage}
                      aiSessions={aiSessions}
                      vacancyMap={vacancyMap}
                      expandedCard={expandedCard}
                      setExpandedCard={setExpandedCard}
                      cpPanelOpen={cpPanelOpen}
                      setCpPanelOpen={setCpPanelOpen}
                      updateMutation={updateMutation}
                      rejectMutation={rejectMutation}
                      setInterviewEntry={setInterviewEntry}
                      setJobOfferEntry={setJobOfferEntry}
                      setReportEntry={setReportEntry}
                      setRoadmapEntry={setRoadmapEntry}
                      setPortretVacancy={setPortretVacancy}
                    />
                  ))}
                  {!isLoading && byStage(stage.key).length === 0 && <div className="text-xs text-muted-foreground text-center py-4 opacity-50">Bo'sh</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {portretVacancy && <VacancyPortretDialog vacancyId={portretVacancy.id} vacancyTitle={portretVacancy.title} isUrgent={portretVacancy.is_urgent} open={!!portretVacancy} onClose={() => setPortretVacancy(null)} />}
      {interviewEntry && <ProductivityInterviewDialog candidateId={interviewEntry.candidate_id} candidateName={interviewEntry.candidate_name} funnelId={interviewEntry.id} open={!!interviewEntry} onClose={() => setInterviewEntry(null)} />}
      {jobOfferEntry && <JobOfferDialog open={!!jobOfferEntry} onOpenChange={(open) => { if (!open) setJobOfferEntry(null); }} candidateId={jobOfferEntry.candidate_id} candidateName={jobOfferEntry.candidate_name} funnelId={jobOfferEntry.id} vacancyTitle={jobOfferEntry.vacancy_title} />}
      {marketVacancy && <LaborMarketSheet vacancyId={marketVacancy.id} vacancyTitle={marketVacancy.title} open={!!marketVacancy} onOpenChange={(open) => { if (!open) setMarketVacancy(null); }} />}
      {reportEntry && <CandidateReportDialog open={!!reportEntry} onClose={() => setReportEntry(null)} pipelineEntryId={reportEntry.id} candidateName={reportEntry.candidate_name} />}
      {roadmapEntry && <OnboardingRoadmapDialog open={!!roadmapEntry} onClose={() => setRoadmapEntry(null)} pipelineEntryId={roadmapEntry.id} candidateName={roadmapEntry.candidate_name} vacancyTitle={roadmapEntry.vacancy_title} />}
    </div>
  );
}
