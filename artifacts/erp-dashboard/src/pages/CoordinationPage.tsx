/** @module CoordinationPage @description Route-level orchestrator for the Coordination feature. Owns all state, queries, and mutations; delegates rendering to section and dialog sub-modules. */

import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest, selectArray } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { ArrowUp, ArrowDown, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  VALID_TABS,
  type Council, type Dokla, type Raspo, type BasketDoc,
  type CoordinationStats, type DoklaStatus, type RaspoStatus,
  type DoklaFormState, type RaspoFormState, type CouncilFormState,
  type Prikaz, type Protocol, type PrikazFormState, type ProtocolFormState,
} from "./CoordinationPageTypes";
import { OverviewSection } from "./CoordinationPageOverview";
import {
  DoklaSection, RaspoSection, BasketsSection, CouncilsSection,
} from "./CoordinationPageSections";
import { PrikazSection, ProtocolSection } from "./CoordinationDocsSections";
import { CreateDoklaDialog, CreateRaspoDialog, UpdateCouncilDialog } from "./CoordinationPageDialogs";
import { PrikazDialog, ProtocolDialog, CancelPrikazDialog } from "./CoordinationDocsDialogs";

const DOKLA_INIT: DoklaFormState   = { subject: "", problem: "", result: "", proposal: "", councilLevel: "3" };
const RASPO_INIT: RaspoFormState   = { to: "", task: "", deadline: "", priority: "medium" };
const COUNCIL_INIT: CouncilFormState = { chairperson_id: "", description: "", meeting_schedule: "" };
const PRIKAZ_INIT: PrikazFormState = { title: "", content: "", supersedesId: "" };
const PROTOCOL_INIT: ProtocolFormState = {
  councilId: "", title: "", agenda: "", decisions: "",
  chairpersonId: "", secretaryId: "", dissentingOpinion: "",
};

/** Build the shared приказ / протокол payload from form state (real BE fields). */
function protocolPayload(d: ProtocolFormState) {
  return {
    councilId:         d.councilId ? Number(d.councilId) : undefined,
    title:             d.title.trim(),
    agenda:            d.agenda.trim() || undefined,
    decisions:         d.decisions.trim() || undefined,
    chairpersonId:     d.chairpersonId ? Number(d.chairpersonId) : undefined,
    secretaryId:       d.secretaryId ? Number(d.secretaryId) : undefined,
    dissentingOpinion: d.dissentingOpinion.trim() ? { note: d.dissentingOpinion.trim() } : undefined,
  };
}

export default function CoordinationPage() {
  const { t, language } = useTranslation("coordination");
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const isRu = language === "ru";

  // ── URL-driven tab ──
  const search = useSearch();
  const tabFromUrl = new URLSearchParams(search).get("tab") ?? "";
  const [tab, setTab] = useState(VALID_TABS.includes(tabFromUrl as typeof VALID_TABS[number]) ? tabFromUrl : "overview");

  useEffect(() => {
    const t = new URLSearchParams(search).get("tab") ?? "";
    setTab(VALID_TABS.includes(t as typeof VALID_TABS[number]) ? t : "overview");
  }, [search]);

  // ── Dialog & filter state ──
  const [doklaOpen, setDoklaOpen]                     = useState(false);
  const [raspoOpen, setRaspoOpen]                     = useState(false);
  const [councilEditTarget, setCouncilEditTarget]     = useState<Council | null>(null);
  const [doklaSearch, setDoklaSearch]                 = useState("");
  const [raspoSearch, setRaspoSearch]                 = useState("");
  const [doklaStatusFilter, setDoklaStatusFilter]     = useState<DoklaStatus | "">("");
  const [raspoStatusFilter, setRaspoStatusFilter]     = useState<RaspoStatus | "">("");
  const [doklaForm, setDoklaForm]                     = useState<DoklaFormState>(DOKLA_INIT);
  const [raspoForm, setRaspoForm]                     = useState<RaspoFormState>(RASPO_INIT);
  const [councilForm, setCouncilForm]                 = useState<CouncilFormState>(COUNCIL_INIT);

  // ── Prikaz / Protocol state (modul 04) ──
  const [prikazSearch, setPrikazSearch]               = useState("");
  const [protocolSearch, setProtocolSearch]           = useState("");
  const [prikazDialogOpen, setPrikazDialogOpen]       = useState(false);
  const [prikazDialogMode, setPrikazDialogMode]       = useState<"create" | "edit">("create");
  const [prikazEditId, setPrikazEditId]               = useState<number | null>(null);
  const [prikazForm, setPrikazForm]                   = useState<PrikazFormState>(PRIKAZ_INIT);
  const [cancelPrikazTarget, setCancelPrikazTarget]   = useState<Prikaz | null>(null);
  const [protocolDialogOpen, setProtocolDialogOpen]   = useState(false);
  const [protocolDialogMode, setProtocolDialogMode]   = useState<"create" | "edit" | "amend">("create");
  const [protocolTargetId, setProtocolTargetId]       = useState<number | null>(null);
  const [protocolForm, setProtocolForm]               = useState<ProtocolFormState>(PROTOCOL_INIT);

  // ── Queries ──
  const { data: doklads = [], isLoading: doklaLoading } = useQuery<Dokla[]>({
    queryKey: ["/api/coordination/dokla"],
    select: selectArray<Dokla>,
    enabled: !!isAuthenticated,
  });

  const { data: rasporyazheniya = [], isLoading: raspoLoading } = useQuery<Raspo[]>({
    queryKey: ["/api/coordination/rasporyazhenie"],
    select: selectArray<Raspo>,
    enabled: !!isAuthenticated,
  });

  const { data: stats } = useQuery<CoordinationStats>({
    queryKey: ["/api/coordination/stats"],
    enabled: !!isAuthenticated,
  });

  // BasketDoc query kept for potential future use; data flows to CommunicationCenter internally
  useQuery<BasketDoc[]>({
    queryKey: ["/api/coordination/baskets"],
    select: selectArray<BasketDoc>,
    enabled: !!isAuthenticated,
  });

  const { data: councils = [], isLoading: councilsLoading } = useQuery<Council[]>({
    queryKey: ["/api/coordination/councils"],
    select: selectArray<Council>,
    enabled: !!isAuthenticated,
  });

  const { data: prikazes = [], isLoading: prikazLoading } = useQuery<Prikaz[]>({
    queryKey: ["/api/prikaz"],
    select: selectArray<Prikaz>,
    enabled: !!isAuthenticated,
  });

  const { data: protocols = [], isLoading: protocolLoading } = useQuery<Protocol[]>({
    queryKey: ["/api/protocols"],
    select: selectArray<Protocol>,
    enabled: !!isAuthenticated,
  });

  // ── Mutations ──
  const createDoklaMutation = useMutation({
    mutationFn: (data: DoklaFormState) =>
      apiRequest("POST", "/api/coordination/dokla", {
        subject: data.subject, problem: data.problem,
        result: data.result, proposal: data.proposal,
        council_level: parseInt(data.councilLevel),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coordination/dokla"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordination/stats"] });
      toast({ title: isRu ? "Доклад отправлен" : "Доклад yuborildi" });
      setDoklaOpen(false);
      setDoklaForm(DOKLA_INIT);
    },
    onError: (e: unknown) => {
      toast({ title: isRu ? "Ошибка" : "Xatolik", description: e instanceof Error ? e.message : "", variant: "destructive" });
    },
  });

  const createRaspoMutation = useMutation({
    mutationFn: (data: RaspoFormState) =>
      apiRequest("POST", "/api/coordination/rasporyazhenie", {
        to_user: data.to, task: data.task,
        deadline: data.deadline || undefined,
        priority: data.priority,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coordination/rasporyazhenie"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordination/stats"] });
      toast({ title: isRu ? "Распоряжение выдано" : "Распоряжение berildi" });
      setRaspoOpen(false);
      setRaspoForm(RASPO_INIT);
    },
    onError: (e: unknown) => {
      toast({ title: isRu ? "Ошибка" : "Xatolik", description: e instanceof Error ? e.message : "", variant: "destructive" });
    },
  });

  const markRaspoDoneMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/coordination/rasporyazhenie/${id}/done`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coordination/rasporyazhenie"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordination/stats"] });
      toast({ title: isRu ? "Выполнено!" : "Bajarildi!" });
    },
  });

  const markDoklaReadMutation     = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/coordination/dokla/${id}/read`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/coordination/dokla"] }),
  });

  const markDoklaResolvedMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/coordination/dokla/${id}/resolved`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coordination/dokla"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordination/stats"] });
    },
  });

  const updateCouncilMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CouncilFormState }) => {
      const payload: Record<string, unknown> = {};
      if (data.chairperson_id) payload.chairperson_id = parseInt(data.chairperson_id, 10);
      if (data.description.trim()) payload.description = data.description.trim();
      if (data.meeting_schedule.trim()) payload.meeting_schedule = data.meeting_schedule.trim();
      return apiRequest("PATCH", `/api/coordination/councils/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coordination/councils"] });
      toast({ title: isRu ? "Совет обновлён" : "Kengash yangilandi" });
      setCouncilEditTarget(null);
      setCouncilForm(COUNCIL_INIT);
    },
    onError: (e: unknown) => {
      toast({ title: isRu ? "Ошибка" : "Xatolik", description: e instanceof Error ? e.message : "", variant: "destructive" });
    },
  });

  function handleOpenCouncilEdit(council: Council) {
    setCouncilForm({
      chairperson_id: council.chairperson_id != null ? String(council.chairperson_id) : "",
      description:    council.description ?? "",
      meeting_schedule: council.meeting_schedule ?? "",
    });
    setCouncilEditTarget(council);
  }

  // ── Prikaz mutations (real BE: /api/prikaz) ──
  const errToast = (e: unknown) =>
    toast({ title: isRu ? "Ошибка" : "Xatolik", description: e instanceof Error ? e.message : "", variant: "destructive" });

  const createPrikazMutation = useMutation({
    mutationFn: (data: PrikazFormState) =>
      apiRequest("POST", "/api/prikaz", {
        title:        data.title.trim(),
        content:      data.content.trim() || undefined,
        supersedesId: data.supersedesId ? Number(data.supersedesId) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prikaz"] });
      toast({ title: isRu ? "Приказ создан" : "Приказ yaratildi" });
      setPrikazDialogOpen(false);
      setPrikazForm(PRIKAZ_INIT);
    },
    onError: errToast,
  });

  const updatePrikazMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: PrikazFormState }) =>
      apiRequest("PATCH", `/api/prikaz/${id}`, { title: data.title.trim(), content: data.content.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prikaz"] });
      toast({ title: isRu ? "Приказ обновлён" : "Приказ yangilandi" });
      setPrikazDialogOpen(false);
      setPrikazForm(PRIKAZ_INIT);
      setPrikazEditId(null);
    },
    onError: errToast,
  });

  const signPrikazMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/prikaz/${id}/sign`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prikaz"] });
      toast({ title: isRu ? "Приказ подписан (номер присвоен)" : "Приказ imzolandi (raqam berildi)" });
    },
    onError: errToast,
  });

  const cancelPrikazMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      apiRequest("POST", `/api/prikaz/${id}/cancel`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prikaz"] });
      toast({ title: isRu ? "Приказ отменён" : "Приказ bekor qilindi" });
      setCancelPrikazTarget(null);
    },
    onError: errToast,
  });

  // ── Protocol mutations (real BE: /api/protocols) ──
  const createProtocolMutation = useMutation({
    mutationFn: (data: ProtocolFormState) => apiRequest("POST", "/api/protocols", protocolPayload(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protocols"] });
      toast({ title: isRu ? "Протокол создан" : "Протокол yaratildi" });
      setProtocolDialogOpen(false);
      setProtocolForm(PROTOCOL_INIT);
    },
    onError: errToast,
  });

  const updateProtocolMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProtocolFormState }) =>
      apiRequest("PATCH", `/api/protocols/${id}`, protocolPayload(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protocols"] });
      toast({ title: isRu ? "Протокол обновлён" : "Протокол yangilandi" });
      setProtocolDialogOpen(false);
      setProtocolForm(PROTOCOL_INIT);
      setProtocolTargetId(null);
    },
    onError: errToast,
  });

  const signProtocolMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/protocols/${id}/sign`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protocols"] });
      toast({ title: isRu ? "Протокол подписан" : "Протокол imzolandi" });
    },
    onError: errToast,
  });

  const amendProtocolMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProtocolFormState }) =>
      apiRequest("POST", `/api/protocols/${id}/amend`, protocolPayload(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protocols"] });
      toast({ title: isRu ? "Исправляющий протокол создан" : "Tuzatish протоколи yaratildi" });
      setProtocolDialogOpen(false);
      setProtocolForm(PROTOCOL_INIT);
      setProtocolTargetId(null);
    },
    onError: errToast,
  });

  // ── Prikaz / Protocol open + submit handlers ──
  function handleOpenCreatePrikaz() {
    setPrikazForm(PRIKAZ_INIT);
    setPrikazEditId(null);
    setPrikazDialogMode("create");
    setPrikazDialogOpen(true);
  }
  function handleOpenEditPrikaz(p: Prikaz) {
    setPrikazForm({ title: p.title, content: p.content ?? "", supersedesId: p.supersedes_id != null ? String(p.supersedes_id) : "" });
    setPrikazEditId(p.id);
    setPrikazDialogMode("edit");
    setPrikazDialogOpen(true);
  }
  function handleSubmitPrikaz(data: PrikazFormState) {
    if (prikazDialogMode === "edit" && prikazEditId != null) updatePrikazMutation.mutate({ id: prikazEditId, data });
    else createPrikazMutation.mutate(data);
  }

  function fillProtocolForm(p: Protocol) {
    const note = (p.dissenting_opinion && typeof p.dissenting_opinion === "object" && "note" in (p.dissenting_opinion as Record<string, unknown>))
      ? String((p.dissenting_opinion as Record<string, unknown>).note ?? "")
      : "";
    setProtocolForm({
      councilId:         p.council_id != null ? String(p.council_id) : "",
      title:             p.title,
      agenda:            p.agenda ?? "",
      decisions:         p.decisions ?? "",
      chairpersonId:     p.chairperson_id != null ? String(p.chairperson_id) : "",
      secretaryId:       p.secretary_id != null ? String(p.secretary_id) : "",
      dissentingOpinion: note,
    });
  }
  function handleOpenCreateProtocol() {
    setProtocolForm(PROTOCOL_INIT);
    setProtocolTargetId(null);
    setProtocolDialogMode("create");
    setProtocolDialogOpen(true);
  }
  function handleOpenEditProtocol(p: Protocol) {
    fillProtocolForm(p);
    setProtocolTargetId(p.id);
    setProtocolDialogMode("edit");
    setProtocolDialogOpen(true);
  }
  function handleOpenAmendProtocol(p: Protocol) {
    fillProtocolForm(p);
    setProtocolTargetId(p.id);
    setProtocolDialogMode("amend");
    setProtocolDialogOpen(true);
  }
  function handleSubmitProtocol(data: ProtocolFormState) {
    if (protocolDialogMode === "edit" && protocolTargetId != null) updateProtocolMutation.mutate({ id: protocolTargetId, data });
    else if (protocolDialogMode === "amend" && protocolTargetId != null) amendProtocolMutation.mutate({ id: protocolTargetId, data });
    else createProtocolMutation.mutate(data);
  }

  const signedPrikazes = prikazes.filter(p => p.status === "signed");
  const prikazDialogPending = createPrikazMutation.isPending || updatePrikazMutation.isPending;
  const protocolDialogPending = createProtocolMutation.isPending || updateProtocolMutation.isPending || amendProtocolMutation.isPending;

  // ── Derived counts for stat cards ──
  const overdueCount = rasporyazheniya.filter(r => r.status === "overdue").length;
  const statCards = [
    {
      label: isRu ? "Докладов" : "Докладлар",
      val: Number(stats?.dokla?.total ?? doklads.length),
      sub: isRu ? "всего" : "jami",
      color: "text-[var(--ep-blue)]", bg: "bg-blue-50", icon: ArrowUp,
    },
    {
      label: isRu ? "Распоряжений" : "Распоряжения",
      val: Number(stats?.rasporyazhenie?.total ?? rasporyazheniya.length),
      sub: isRu ? "выдано" : "berildi",
      color: "text-[var(--ep-primary)]", bg: "bg-orange-50", icon: ArrowDown,
    },
    {
      label: isRu ? "Выполнено" : "Bajarildi",
      val: Number(stats?.rasporyazhenie?.done ?? rasporyazheniya.filter(r => r.status === "done").length),
      sub: isRu ? "распоряжений" : "topshiriq",
      color: "text-[var(--ep-green)]", bg: "bg-emerald-50", icon: CheckCircle2,
    },
    {
      label: isRu ? "Просрочено" : "Muddati o'tdi",
      val: overdueCount,
      sub: isRu ? "требуют внимания" : "diqqat kerak",
      color: overdueCount > 0 ? "text-[var(--ep-red)]" : "text-muted-foreground",
      bg: overdueCount > 0 ? "bg-red-50" : "bg-muted/30",
      icon: AlertCircle,
    },
  ];

  return (
    <div className="flex-1 overflow-auto bg-background p-5 space-y-6 pb-14">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("coordination")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isRu
              ? "5 советов · Доклад ↑ · Распоряжение ↓ · 3-Savat · ШВБ методология"
              : "5 kengash · Доклад ↑ · Распоряжение ↓ · 3-Savat · ШВБ metodologiyasi"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setDoklaOpen(true)} data-testid="btn-create-dokla">
            <ArrowUp className="w-3.5 h-3.5 mr-1.5 text-[var(--ep-blue)]" />
            {t("createDokla")}
          </Button>
          <Button size="sm" onClick={() => setRaspoOpen(true)} data-testid="btn-create-raspo">
            <ArrowDown className="w-3.5 h-3.5 mr-1.5" />
            {t("createRasporyazhenie")}
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} className={cn("border-0 shadow-sm", s.bg)}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/70 shrink-0">
                  <Icon className={cn("w-4.5 h-4.5", s.color)} />
                </div>
                <div>
                  <p className={cn("text-2xl font-bold leading-none", s.color)}>{s.val}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">{isRu ? "Обзор" : "Umumiy"}</TabsTrigger>
          <TabsTrigger value="dokla">
            {isRu ? "Докладлар" : "Докладлар"}
            {doklads.filter(d => d.status === "sent").length > 0 && (
              <Badge className="ml-1.5 text-[10px] px-1.5 py-0 bg-blue-500">
                {doklads.filter(d => d.status === "sent").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="raspo">
            {isRu ? "Распоряжения" : "Распоряжения"}
            {overdueCount > 0 && (
              <Badge className="ml-1.5 text-[10px] px-1.5 py-0 bg-red-500">{overdueCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="prikaz">{isRu ? "Приказы" : "Приказлар"}</TabsTrigger>
          <TabsTrigger value="protocols">{isRu ? "Протоколы" : "Протоколлар"}</TabsTrigger>
          <TabsTrigger value="baskets">{t("threeBasketTitle")}</TabsTrigger>
          <TabsTrigger value="councils">{t("councilSystem")}</TabsTrigger>
        </TabsList>

        <OverviewSection
          doklads={doklads}
          rasporyazheniya={rasporyazheniya}
          doklaLoading={doklaLoading}
          raspoLoading={raspoLoading}
          onGoToDokla={() => setTab("dokla")}
          onGoToRaspo={() => setTab("raspo")}
        />

        <DoklaSection
          doklads={doklads}
          doklaLoading={doklaLoading}
          doklaSearch={doklaSearch}
          setDoklaSearch={setDoklaSearch}
          doklaStatusFilter={doklaStatusFilter}
          setDoklaStatusFilter={setDoklaStatusFilter}
          onCreateDokla={() => setDoklaOpen(true)}
          onMarkRead={markDoklaReadMutation.mutate}
          onMarkResolved={markDoklaResolvedMutation.mutate}
        />

        <RaspoSection
          rasporyazheniya={rasporyazheniya}
          raspoLoading={raspoLoading}
          raspoSearch={raspoSearch}
          setRaspoSearch={setRaspoSearch}
          raspoStatusFilter={raspoStatusFilter}
          setRaspoStatusFilter={setRaspoStatusFilter}
          onCreateRaspo={() => setRaspoOpen(true)}
          onMarkDone={markRaspoDoneMutation.mutate}
        />

        <PrikazSection
          prikazes={prikazes}
          loading={prikazLoading}
          search={prikazSearch}
          setSearch={setPrikazSearch}
          onCreate={handleOpenCreatePrikaz}
          onEdit={handleOpenEditPrikaz}
          onSign={signPrikazMutation.mutate}
          onCancel={setCancelPrikazTarget}
        />

        <ProtocolSection
          protocols={protocols}
          loading={protocolLoading}
          search={protocolSearch}
          setSearch={setProtocolSearch}
          onCreate={handleOpenCreateProtocol}
          onEdit={handleOpenEditProtocol}
          onSign={signProtocolMutation.mutate}
          onAmend={handleOpenAmendProtocol}
        />

        <BasketsSection />
        <CouncilsSection
          councils={councils}
          councilsLoading={councilsLoading}
          onEditCouncil={handleOpenCouncilEdit}
        />
      </Tabs>

      {/* Dialogs */}
      <CreateDoklaDialog
        open={doklaOpen}
        onOpenChange={setDoklaOpen}
        form={doklaForm}
        setForm={setDoklaForm}
        onSubmit={createDoklaMutation.mutate}
        isPending={createDoklaMutation.isPending}
      />

      <CreateRaspoDialog
        open={raspoOpen}
        onOpenChange={setRaspoOpen}
        form={raspoForm}
        setForm={setRaspoForm}
        onSubmit={createRaspoMutation.mutate}
        isPending={createRaspoMutation.isPending}
      />

      <UpdateCouncilDialog
        open={councilEditTarget !== null}
        onOpenChange={open => { if (!open) { setCouncilEditTarget(null); setCouncilForm(COUNCIL_INIT); } }}
        councilName={councilEditTarget?.name ?? ""}
        form={councilForm}
        setForm={setCouncilForm}
        onSubmit={data => {
          if (councilEditTarget) updateCouncilMutation.mutate({ id: councilEditTarget.id, data });
        }}
        isPending={updateCouncilMutation.isPending}
      />

      <PrikazDialog
        open={prikazDialogOpen}
        onOpenChange={open => { if (!open) { setPrikazDialogOpen(false); setPrikazForm(PRIKAZ_INIT); setPrikazEditId(null); } }}
        mode={prikazDialogMode}
        form={prikazForm}
        setForm={setPrikazForm}
        onSubmit={handleSubmitPrikaz}
        isPending={prikazDialogPending}
        signedPrikazes={signedPrikazes}
      />

      <CancelPrikazDialog
        open={cancelPrikazTarget !== null}
        onOpenChange={open => { if (!open) setCancelPrikazTarget(null); }}
        prikazTitle={cancelPrikazTarget?.title ?? ""}
        onConfirm={reason => { if (cancelPrikazTarget) cancelPrikazMutation.mutate({ id: cancelPrikazTarget.id, reason }); }}
        isPending={cancelPrikazMutation.isPending}
      />

      <ProtocolDialog
        open={protocolDialogOpen}
        onOpenChange={open => { if (!open) { setProtocolDialogOpen(false); setProtocolForm(PROTOCOL_INIT); setProtocolTargetId(null); } }}
        mode={protocolDialogMode}
        form={protocolForm}
        setForm={setProtocolForm}
        onSubmit={handleSubmitProtocol}
        isPending={protocolDialogPending}
        councils={councils}
      />
    </div>
  );
}
