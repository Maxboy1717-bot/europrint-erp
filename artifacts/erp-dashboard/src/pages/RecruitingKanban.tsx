import React, { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useChatStore } from "@/store/chatStore";
import { getSharedSocket } from "@/hooks/chat/useChatSocket";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Briefcase, TrendingUp, Users, CheckCircle, XCircle,
  AlertTriangle, Bot, CalendarDays,
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
  STAGES, TERMINAL_STAGES,
  StatCard, HCMethodologyBanner,
} from "@/components/recruiting/helpers";
import type { PipelineEntry, Vacancy, CreateVacancyResponse, AIInterviewSession } from "@/components/recruiting/types";
import { KanbanBoardGrid } from "@/components/recruiting/KanbanBoardGrid";
import { RecruitingHeaderActions } from "@/components/recruiting/RecruitingHeaderActions";
import { VacancyFilterPanel } from "@/components/recruiting/VacancyFilterPanel";
import { useKanbanDragDrop } from "@/hooks/use-kanban-dnd";

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

  // NB: backend endpoint is `POST /api/hr/recruitment/pipeline/:id/stage`
  // with body `{ stage }` (see HrUpdatePipelineStageSchema in
  // apps/api/src/modules/hr/recruitment/dto/hr-vacancies.dto.ts).
  // The previous code used PATCH + { funnel_stage } which did not match
  // any registered route — those calls returned 404 in production.
  const updateMutation = useMutation({
    mutationFn: ({ id, funnel_stage }: { id: number; funnel_stage: FunnelStage }) =>
      apiRequest("POST", `/api/hr/recruitment/pipeline/${id}/stage`, { stage: funnel_stage }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/hr/recruitment/pipeline"] }); toast({ title: "Bosqich yangilandi" }); },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/hr/recruitment/pipeline/${id}/stage`, { stage: "REJECTED", notes: "Kanban orqali rad etildi" }),
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

  // T5.1 drag-drop with @dnd-kit (optimistic mutation + rollback inside hook)
  const dnd = useKanbanDragDrop(filtered);

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

      <VacancyFilterPanel
        open={vacancyPanelOpen}
        onToggle={() => setVacancyPanelOpen(p => !p)}
        openVacancies={openVacancies}
        entries={entries}
        filterVacancy={filterVacancy}
        setFilterVacancy={setFilterVacancy}
        channelPanelVacancyId={channelPanelVacancyId}
        setChannelPanelVacancyId={setChannelPanelVacancyId}
        setPortretVacancy={setPortretVacancy}
        onOpenVacancyChat={handleOpenVacancyChat}
        openingContextRoom={openingContextRoom}
      />

      <HRAlertBanner className="mb-3" />

      <KanbanBoardGrid
        dnd={dnd}
        byStage={byStage}
        counts={counts}
        isLoading={isLoading}
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

      {portretVacancy && <VacancyPortretDialog vacancyId={portretVacancy.id} vacancyTitle={portretVacancy.title} isUrgent={portretVacancy.is_urgent} open={!!portretVacancy} onClose={() => setPortretVacancy(null)} />}
      {interviewEntry && <ProductivityInterviewDialog candidateId={interviewEntry.candidate_id} candidateName={interviewEntry.candidate_name} funnelId={interviewEntry.id} open={!!interviewEntry} onClose={() => setInterviewEntry(null)} />}
      {jobOfferEntry && <JobOfferDialog open={!!jobOfferEntry} onOpenChange={(open) => { if (!open) setJobOfferEntry(null); }} candidateId={jobOfferEntry.candidate_id} candidateName={jobOfferEntry.candidate_name} funnelId={jobOfferEntry.id} vacancyTitle={jobOfferEntry.vacancy_title} />}
      {marketVacancy && <LaborMarketSheet vacancyId={marketVacancy.id} vacancyTitle={marketVacancy.title} open={!!marketVacancy} onOpenChange={(open) => { if (!open) setMarketVacancy(null); }} />}
      {reportEntry && <CandidateReportDialog open={!!reportEntry} onClose={() => setReportEntry(null)} pipelineEntryId={reportEntry.id} candidateName={reportEntry.candidate_name} />}
      {roadmapEntry && <OnboardingRoadmapDialog open={!!roadmapEntry} onClose={() => setRoadmapEntry(null)} pipelineEntryId={roadmapEntry.id} candidateName={roadmapEntry.candidate_name} vacancyTitle={roadmapEntry.vacancy_title} />}
    </div>
  );
}
