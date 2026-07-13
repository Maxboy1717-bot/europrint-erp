/**
 * @module MarketingLeads
 * @description Route-level orchestration: state, hooks, mutations.
 * UI is delegated to MarketingLeadsSections and MarketingLeadsDialogs.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, selectArray } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart2, RefreshCw } from "lucide-react";
import {
  type ContactFormState,
  type ContactLog,
  type FilterKey,
  type FunnelStage,
  type LeadFormPayload,
  type LeadFormState,
  type LossAnalysis,
  type MarketingLead,
} from "./MarketingLeadsTypes";
import {
  ContactLogPanel,
  LeadFilterBar,
  LeadList,
  LossAnalysisPanel,
} from "./MarketingLeadsSections";
import {
  DeleteLeadConfirm,
  FunnelDialog,
  LeadFormDialog,
} from "./MarketingLeadsDialogs";
import { EPErrorState, EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function MarketingLeads() {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  // ── Dialog / panel state ────────────────────────────────────────────────────
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [contactLeadId, setContactLeadId] = useState<string | null>(null);
  const [funnelOpen, setFunnelOpen] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");

  // ── Form state ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState<LeadFormState>({
    name: "", company: "", phone: "", email: "",
    source: "website", channel: "", status: "new",
    score: "0", notes: "", lostReason: "",
  });
  const [contactForm, setContactForm] = useState<ContactFormState>({
    type: "call", summary: "", outcome: "interested", nextFollowUp: "",
  });

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: leads = [], isLoading, isError, error, refetch } =
    useQuery<MarketingLead[]>({ queryKey: ["/api/marketing/leads"], select: selectArray<MarketingLead> });

  const { data: overdue = [] } =
    useQuery<MarketingLead[]>({ queryKey: ["/api/marketing/leads/automation/overdue-leads"] });

  const { data: funnelRaw } = useQuery<{ stages: FunnelStage[]; total: number; conversionRate: number }>({
    queryKey: ["/api/marketing/funnel"],
    enabled: funnelOpen,
  });
  const funnelData = selectArray<FunnelStage>(funnelRaw?.stages, "stages");

  const { data: contacts = [] } = useQuery<ContactLog[]>({
    queryKey: ["/api/marketing/leads", contactLeadId, "contacts"],
    queryFn: () =>
      apiRequest<ContactLog[]>("GET", `/api/marketing/leads/${contactLeadId}/contacts`),
    enabled: !!contactLeadId,
  });

  const { data: lossAnalysis } = useQuery<LossAnalysis>({
    queryKey: ["/api/marketing/leads/loss-analysis"],
  });

  // ── Mutations ───────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: LeadFormPayload) => apiRequest("POST", "/api/marketing/leads", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/dashboard/stats"] });
      setOpen(false);
      resetForm();
      toast({ title: t("lidQoshildi") });
    },
    onError: (e: Error) => toast({ title: t("xatolik"), description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: LeadFormPayload }) =>
      apiRequest("PUT", `/api/marketing/leads/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/leads"] });
      setOpen(false);
      resetForm();
      toast({ title: t("lidYangilandi") });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/marketing/leads/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/dashboard/stats"] });
      toast({ title: t("lidOchirildi") });
    },
  });

  const convertToCrmMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/marketing/leads/${id}/convert-to-crm`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/dashboard/stats"] });
      toast({ title: t("crmGaYuborildi") });
    },
    onError: (e: Error) =>
      toast({ title: t("xatolik"), description: e.message || t("crmGaOtkazishdaXatolik"), variant: "destructive" }),
  });

  const recalcScoreMutation = useMutation({
    mutationFn: () => apiRequest<{ updated: number }>("POST", "/api/marketing/leads/recalculate-scores", {}),
    onSuccess: (d) => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/leads"] });
      toast({ title: t("lidBaliYangilandi", { count: d.updated }) });
    },
  });

  const addContactMutation = useMutation({
    mutationFn: (data: ContactFormState) =>
      apiRequest("POST", `/api/marketing/leads/${contactLeadId}/contacts`, {
        ...data,
        nextFollowUp: data.nextFollowUp || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/leads", contactLeadId, "contacts"] });
      setContactForm({ type: "call", summary: "", outcome: "interested", nextFollowUp: "" });
      toast({ title: t("aloqaQaydEtildi") });
    },
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setForm({ name: "", company: "", phone: "", email: "", source: "website", channel: "", status: "new", score: "0", notes: "", lostReason: "" });
    setEditId(null);
  };

  const handleEdit = (l: MarketingLead) => {
    setEditId(l.id);
    setForm({
      name: l.name, company: l.company || "", phone: l.phone || "",
      email: l.email || "", source: l.source || "website", channel: l.channel || "",
      status: l.status || "new", score: String(l.score || 0), notes: l.notes || "",
      lostReason: (l as MarketingLead & { lostReason?: string }).lostReason || "",
    });
    setOpen(true);
  };

  const handleSubmit = () => {
    const payload: LeadFormPayload = {
      ...form,
      score: Number(form.score) || 0,
      company: form.company || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      channel: form.channel || undefined,
      notes: form.notes || undefined,
      lostReason: form.status === "lost" ? (form.lostReason || undefined) : undefined,
    };
    if (editId) updateMutation.mutate({ id: editId, data: payload });
    else createMutation.mutate(payload);
  };

  const overdueIds = new Set((Array.isArray(overdue) ? overdue : []).map(o => o.id));
  const leadsArr = Array.isArray(leads) ? leads : [];

  const filteredLeads = leadsArr.filter(l => {
    if (filter === "hot") return (l.score || 0) >= 60;
    if (filter === "overdue") return overdueIds.has(l.id);
    if (filter === "lost") return l.status === "lost";
    return true;
  });

  // ── Render ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-20 rounded-lg" />)}
      </div>
    );
  }
  if (isError) return <div className="p-4"><EPErrorState onRetry={refetch}  error={error} /></div>;

  return (
    <div className="space-y-6" data-testid="marketing-leads">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("liderlarBoshqaruvi")}</b></>}
        title={t("liderlarBoshqaruvi")}
      />
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFunnelOpen(true)}
            data-testid="button-open-funnel"
            className="gap-1.5"
          >
            <BarChart2 className="h-4 w-4" /> {t("funnel")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => recalcScoreMutation.mutate()}
            disabled={recalcScoreMutation.isPending}
            data-testid="button-recalc-scores"
            className="gap-1.5"
          >
            <RefreshCw className="h-4 w-4" /> {t("ballarniYangilash")}
          </Button>
          <LeadFormDialog
            open={open}
            onOpenChange={v => { setOpen(v); if (!v) resetForm(); }}
            editId={editId}
            form={form}
            onFormChange={setForm}
            onSubmit={handleSubmit}
            isCreatePending={createMutation.isPending}
            isUpdatePending={updateMutation.isPending}
          />
        </div>
      </div>

      <LeadFilterBar
        leads={leadsArr}
        overdueCount={overdue.length}
        filter={filter}
        onFilterChange={setFilter}
      />

      {filter === "lost" && <LossAnalysisPanel lossAnalysis={lossAnalysis} />}

      <LeadList
        leads={filteredLeads}
        overdueIds={overdueIds}
        contactLeadId={contactLeadId}
        convertToCrmMutation={convertToCrmMutation}
        onToggleContact={id => setContactLeadId(id === contactLeadId ? null : id)}
        onEdit={handleEdit}
        onDelete={id => setDeleteId(id)}
      />

      {contactLeadId && (
        <ContactLogPanel
          contacts={contacts}
          contactForm={contactForm}
          onContactFormChange={setContactForm}
          onAddContact={() => addContactMutation.mutate(contactForm)}
          isAddPending={addContactMutation.isPending}
          onClose={() => setContactLeadId(null)}
        />
      )}

      <FunnelDialog
        open={funnelOpen}
        onOpenChange={setFunnelOpen}
        funnelData={funnelData}
      />

      <DeleteLeadConfirm
        deleteId={deleteId}
        onOpenChange={v => { if (!v) setDeleteId(null); }}
        onConfirm={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}
      />
    </div>
  );
}
