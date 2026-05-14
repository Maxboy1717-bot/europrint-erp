/**
 * @module RecruitingKanban
 * @description React page component. Route-level UI.
 */

import React, { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useChatStore } from "@/store/chatStore";
import { getSharedSocket } from "@/hooks/chat/useChatSocket";
import { useToast } from "@/hooks/use-toast";
import {
  type FunnelStage,
  STAGES, TERMINAL_STAGES,
} from "@/components/recruiting/helpers";
import type { PipelineEntry, Vacancy, CreateVacancyResponse, AIInterviewSession } from "@/components/recruiting/types";
import { RecruitingHeaderActions } from "@/components/recruiting/RecruitingHeaderActions";
import { HRAlertBanner } from "./HRAlertBanner";
import {
  RecruitingStatsBar,
  RecruitingFilterBar,
  RecruitingVacancyPanel,
  RecruitingKanbanBoard,
  HCMethodologyBanner,
} from "./RecruitingKanbanSections";
import { RecruitingKanbanDialogs } from "./RecruitingKanbanDialogs";

import { useTranslation } from '@/lib/i18n';
import { EPPageHeader } from "@/components/ep";
export default function RecruitingKanban() {
  const { t } = useTranslation('common');
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

  // ─── Mutations ────────────────────────────────────────────────────────────

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

  // ─── Queries & derived data ───────────────────────────────────────────────

  const { data: pipelineData, isLoading } = useQuery<{ data: PipelineEntry[] }>({ queryKey: ["/api/hr/recruitment/pipeline"], staleTime: 30_000 });
  const { data: vacanciesData } = useQuery<{ data: Vacancy[] }>({ queryKey: ["/api/hr/recruitment/vacancies"], staleTime: 60_000 });
  const { data: aiSessionsData } = useQuery<AIInterviewSession[]>({ queryKey: ["/api/hr/ai-interview/sessions"], staleTime: 30_000 });

  const entries: PipelineEntry[] = pipelineData?.data ?? [];
  const vacancies: Vacancy[] = vacanciesData?.data ?? [];
  const aiSessions: AIInterviewSession[] = Array.isArray(aiSessionsData) ? aiSessionsData : [];
  const openVacancies = (Array.isArray(vacancies) ? vacancies : []).filter(v => v.status === "open" || v.status === "active");
  const urgentVacancies = (Array.isArray(openVacancies) ? openVacancies : []).filter(v => v.is_urgent);

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

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">Yollash {t('kanban')}</b></>}
        title="Yollash {t('kanban')}"
        subtitle={t("hrCapital7BosqichMetodologiyasi")}
      />
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

      <RecruitingStatsBar
        entries={entries}
        activeCount={activeCount}
        hiredCount={hiredCount}
        rejectedCount={rejectedCount}
        conversionRate={conversionRate}
        openVacancies={openVacancies}
        urgentVacancies={urgentVacancies}
        aiSessionsCount={aiSessions.length}
        probationCount={counts.PROBATION ?? 0}
      />

      <RecruitingFilterBar
        showProbationOnly={showProbationOnly}
        setShowProbationOnly={setShowProbationOnly}
        probationTotalCount={(counts.PROBATION ?? 0) + (counts.SINOV_COMPLETE ?? 0)}
        filterVacancy={filterVacancy}
        setFilterVacancy={setFilterVacancy}
        openVacancies={openVacancies}
      />

      <RecruitingVacancyPanel
        openVacancies={openVacancies}
        filterVacancy={filterVacancy}
        setFilterVacancy={setFilterVacancy}
        vacancyPanelOpen={vacancyPanelOpen}
        setVacancyPanelOpen={setVacancyPanelOpen}
        entries={entries}
        channelPanelVacancyId={channelPanelVacancyId}
        setChannelPanelVacancyId={setChannelPanelVacancyId}
        setPortretVacancy={setPortretVacancy}
        openingContextRoom={openingContextRoom}
        handleOpenVacancyChat={handleOpenVacancyChat}
      />

      <HRAlertBanner className="mb-3" />

      <RecruitingKanbanBoard
        isLoading={isLoading}
        byStage={byStage}
        counts={counts}
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

      <RecruitingKanbanDialogs
        portretVacancy={portretVacancy}
        setPortretVacancy={setPortretVacancy}
        interviewEntry={interviewEntry}
        setInterviewEntry={setInterviewEntry}
        jobOfferEntry={jobOfferEntry}
        setJobOfferEntry={setJobOfferEntry}
        marketVacancy={marketVacancy}
        setMarketVacancy={setMarketVacancy}
        reportEntry={reportEntry}
        setReportEntry={setReportEntry}
        roadmapEntry={roadmapEntry}
        setRoadmapEntry={setRoadmapEntry}
      />
    </div>
  );
}
