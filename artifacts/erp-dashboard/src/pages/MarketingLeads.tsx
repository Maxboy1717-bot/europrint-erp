import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Users, Pencil, Trash2, Phone, Mail, ArrowRightCircle, CheckCircle2, AlertTriangle, MessageSquare, RefreshCw, BarChart2, PhoneCall, X } from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { MarketingLead } from "@shared/schema";

type LeadFormPayload = {
  name: string; score: number; company?: string; phone?: string;
  email?: string; channel?: string; notes?: string; source: string;
  status: string; lostReason?: string;
};

type ContactLog = { id: string; type: string; summary: string | null; outcome: string | null; contactedAt: string; };
const statusLabels: Record<string, string> = { new: "Yangi", contacted: "Aloqa qilingan", qualified: "Malakali", converted: "Konversiya", lost: "Yo'qolgan" };
const sourceLabels: Record<string, string> = { website: "Veb-sayt", referral: "Tavsiya", social: "Ijtimoiy tarmoq", exhibition: "Ko'rgazma", cold_call: "Sovuq qo'ng'iroq", other: "Boshqa" };
const contactTypeLabels: Record<string, string> = { call: "Qo'ng'iroq", meeting: "Uchrashuv", email: "Email", whatsapp: "WhatsApp", telegram: "Telegram" };
const outcomeLabels: Record<string, string> = { interested: "Qiziqish bildirdi", not_interested: "Qiziqmadi", callback: "Qayta qo'ng'iroq", no_answer: "Javob bermadi", converted: "Konvertatsiya" };

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

export default function MarketingLeads() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", company: "", phone: "", email: "", source: "website", channel: "", status: "new", score: "0", notes: "", lostReason: "" });
  const [contactLeadId, setContactLeadId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({ type: "call", summary: "", outcome: "interested", nextFollowUp: "" });
  const [funnelOpen, setFunnelOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "hot" | "overdue" | "lost">("all");

  const { data: leads = [], isLoading, isError, refetch } = useQuery<MarketingLead[]>({ queryKey: ["/api/marketing/leads"] });
  const { data: overdue = [] } = useQuery<MarketingLead[]>({ queryKey: ["/api/marketing/leads/automation/overdue-leads"] });
  const { data: funnelData = [] } = useQuery<{ status: string; label: string; count: number; conversionRate: number; dropOff: number }[]>({ queryKey: ["/api/marketing/funnel"], enabled: funnelOpen });
  const { data: contacts = [] } = useQuery<ContactLog[]>({
    queryKey: ["/api/marketing/leads", contactLeadId, "contacts"],
    queryFn: () => fetch(`/api/marketing/leads/${contactLeadId}/contacts`, { credentials: "include" }).then(r => r.json()),
    enabled: !!contactLeadId,
  });
  const { data: lossAnalysis } = useQuery<{ total: number; breakdown: { reason: string; count: number; percent: number }[] }>({ queryKey: ["/api/marketing/leads/loss-analysis"] });

  const createMutation = useMutation({
    mutationFn: (data: LeadFormPayload) => apiRequest("POST", "/api/marketing/leads", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/marketing/leads"] }); queryClient.invalidateQueries({ queryKey: ["/api/marketing/dashboard/stats"] }); setOpen(false); resetForm(); toast({ title: "Lid qo'shildi" }); },
    onError: (e: Error) => toast({ title: "Xatolik", description: e.message, variant: "destructive" }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: LeadFormPayload }) => apiRequest("PATCH", `/api/marketing/leads/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/marketing/leads"] }); setOpen(false); resetForm(); toast({ title: "Lid yangilandi" }); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/marketing/leads/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/marketing/leads"] }); queryClient.invalidateQueries({ queryKey: ["/api/marketing/dashboard/stats"] }); toast({ title: "Lid o'chirildi" }); },
  });
  const convertToCrmMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/marketing/leads/${id}/convert-to-crm`, {}),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/marketing/leads"] }); queryClient.invalidateQueries({ queryKey: ["/api/marketing/dashboard/stats"] }); toast({ title: "CRM ga yuborildi" }); },
    onError: (e: Error) => toast({ title: "Xatolik", description: e.message || "CRM ga o'tkazishda xatolik", variant: "destructive" }),
  });
  const recalcScoreMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/marketing/leads/recalculate-scores", {}),
    onSuccess: (d: { updated: number }) => { queryClient.invalidateQueries({ queryKey: ["/api/marketing/leads"] }); toast({ title: `${d.updated} ta lid bali yangilandi` }); },
  });
  const addContactMutation = useMutation({
    mutationFn: (data: typeof contactForm) => apiRequest("POST", `/api/marketing/leads/${contactLeadId}/contacts`, { ...data, nextFollowUp: data.nextFollowUp || undefined }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/marketing/leads", contactLeadId, "contacts"] }); setContactForm({ type: "call", summary: "", outcome: "interested", nextFollowUp: "" }); toast({ title: "Aloqa qayd etildi" }); },
  });

  const resetForm = () => { setForm({ name: "", company: "", phone: "", email: "", source: "website", channel: "", status: "new", score: "0", notes: "", lostReason: "" }); setEditId(null); };
  const handleEdit = (l: MarketingLead) => {
    setEditId(l.id);
    setForm({ name: l.name, company: l.company || "", phone: l.phone || "", email: l.email || "", source: l.source || "website", channel: l.channel || "", status: l.status || "new", score: String(l.score || 0), notes: l.notes || "", lostReason: (l as MarketingLead & { lostReason?: string }).lostReason || "" });
    setOpen(true);
  };
  const handleSubmit = () => {
    const payload: LeadFormPayload = { ...form, score: Number(form.score) || 0, company: form.company || undefined, phone: form.phone || undefined, email: form.email || undefined, channel: form.channel || undefined, notes: form.notes || undefined, lostReason: form.status === "lost" ? (form.lostReason || undefined) : undefined };
    if (editId) updateMutation.mutate({ id: editId, data: payload });
    else createMutation.mutate(payload);
  };

  const scoreColor = (s: number | null) => { if (!s || s < 30) return "text-red-500"; if (s < 60) return "text-amber-500"; return "text-green-600"; };
  const scoreBadgeClass = (s: number | null) => { if (!s || s < 30) return "bg-red-50 text-red-700"; if (s < 60) return "bg-amber-50 text-amber-700"; return "bg-green-50 text-green-700"; };
  const isOverdue = (l: MarketingLead) => l.status === "new" && l.updatedAt && new Date().getTime() - new Date(l.updatedAt).getTime() > TWO_DAYS_MS;
  const overdueIds = new Set((Array.isArray(overdue) ? overdue : []).map(o => o.id));

  const filteredLeads = (Array.isArray(leads) ? leads : []).filter(l => {
    if (filter === "hot") return (l.score || 0) >= 60;
    if (filter === "overdue") return overdueIds.has(l.id);
    if (filter === "lost") return l.status === "lost";
    return true;
  });

  if (isLoading) return <div className="p-4 space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-20" />)}</div>;
  if (isError) return <div className="p-4"><ErrorState onRetry={refetch} /></div>;

  return (
    <div className="flex-1 overflow-auto bg-surface p-6" data-testid="marketing-leads">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <h1 className="text-4xl font-light tracking-tight text-on-surface">
          Liderlar <span className="font-bold text-primary">Boshqaruvi</span>
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setFunnelOpen(true)} data-testid="button-open-funnel" className="gap-1.5">
            <BarChart2 className="h-4 w-4" /> Funnel
          </Button>
          <Button variant="outline" size="sm" onClick={() => recalcScoreMutation.mutate()} disabled={recalcScoreMutation.isPending} data-testid="button-recalc-scores" className="gap-1.5">
            <RefreshCw className="h-4 w-4" /> Ballarni yangilash
          </Button>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-create-lead">
                <Plus className="h-4 w-4" /> Yangi Lid
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editId ? "Lidni tahrirlash" : "Yangi Lid"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5"><Label>Ism *</Label><Input data-testid="input-lead-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Kompaniya</Label><Input data-testid="input-lead-company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Telefon</Label><Input data-testid="input-lead-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Email</Label><Input data-testid="input-lead-email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Manba</Label>
                    <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(sourceLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Holat</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                {form.status === "lost" && (
                  <div className="space-y-1.5"><Label>Yo'qotish sababi</Label><Input data-testid="input-lost-reason" value={form.lostReason} onChange={(e) => setForm({ ...form, lostReason: e.target.value })} placeholder="Narx yuqori, raqobatchi, aloqa yo'q..." /></div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Kanal</Label><Input value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} placeholder="Telegram, Instagram..." /></div>
                  <div className="space-y-1.5"><Label>Ball (0-100)</Label><Input type="number" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} min="0" max="100" /></div>
                </div>
                <div className="space-y-1.5"><Label>Izohlar</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                <Button onClick={handleSubmit} disabled={!form.name || createMutation.isPending || updateMutation.isPending} className="w-full" data-testid="button-submit-lead">{editId ? "Saqlash" : "Qo'shish"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        {([
          { key: "all", label: `Hammasi (${leads?.length || 0})` },
          { key: "hot", label: `Issiq (${(Array.isArray(leads) ? leads : []).filter(l => (l.score || 0) >= 60).length || 0})` },
          { key: "overdue", label: `Muddati o'tgan (${overdue.length})` },
          { key: "lost", label: `Yo'qolgan (${(Array.isArray(leads) ? leads : []).filter(l => l.status === "lost").length || 0})` },
        ]).map(f => (
          <Button key={f.key} variant={filter === f.key ? "default" : "outline"} size="sm" onClick={() => setFilter(f.key as typeof filter)} data-testid={`button-filter-${f.key}`}>{f.label}</Button>
        ))}
      </div>

      {/* Loss analysis */}
      {filter === "lost" && lossAnalysis && lossAnalysis.breakdown.length > 0 && (
        <div className="bg-surface-container-lowest rounded-lg p-4 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-3">Yo'qotish sabablari tahlili</p>
          <div className="flex gap-3 flex-wrap">
            {(Array.isArray(lossAnalysis.breakdown) ? lossAnalysis.breakdown : []).map(b => (
              <div key={b.reason} className="flex items-center gap-2 bg-surface-container rounded-md px-3 py-1.5">
                <span className="text-sm font-medium text-on-surface">{b.reason}</span>
                <Badge variant="secondary" className="text-xs">{b.count} ({b.percent}%)</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredLeads.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-6 text-center text-on-surface-variant">Hozircha lidlar yo'q</div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
          <div className="divide-y divide-outline-variant/30">
            {(Array.isArray(filteredLeads) ? filteredLeads : []).map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-4 px-5 py-4 hover-elevate" data-testid={`card-lead-${l.id}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-on-surface">{l.name}</span>
                    {l.company && <span className="text-sm text-on-surface-variant">— {l.company}</span>}
                    <Badge className={`text-xs font-semibold no-default-hover-elevate ${scoreBadgeClass(l.score)}`} data-testid={`badge-score-${l.id}`}>{l.score || 0} ball</Badge>
                    {overdueIds.has(l.id) && (
                      <Badge className="bg-amber-100 text-amber-800 text-xs no-default-hover-elevate gap-1" data-testid={`badge-overdue-${l.id}`}>
                        <AlertTriangle className="h-3 w-3" /> Muddati o'tgan
                      </Badge>
                    )}
                    {l.crmLeadId && (
                      <Badge className="bg-green-100 text-green-800 text-xs no-default-hover-elevate gap-1" data-testid={`badge-crm-${l.id}`}>
                        <CheckCircle2 className="h-3 w-3" /> CRM da
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-on-surface-variant flex-wrap">
                    {l.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{l.phone}</span>}
                    {l.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{l.email}</span>}
                    {(l as MarketingLead & { lostReason?: string }).lostReason && <span className="text-red-500 text-xs">Sabab: {(l as MarketingLead & { lostReason?: string }).lostReason}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs no-default-hover-elevate">{statusLabels[l.status || "new"]}</Badge>
                  <Badge className="bg-primary-container text-on-primary-container text-xs no-default-hover-elevate">{sourceLabels[l.source || "website"] || l.source}</Badge>
                  <Button size="icon" variant="ghost" onClick={() => setContactLeadId(l.id === contactLeadId ? null : l.id)} data-testid={`button-contacts-${l.id}`}>
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  {!l.crmLeadId && (
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => convertToCrmMutation.mutate(l.id)} disabled={convertToCrmMutation.isPending} data-testid={`button-convert-crm-${l.id}`}>
                      <ArrowRightCircle className="h-4 w-4" /> CRM
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(l)} data-testid={`button-edit-lead-${l.id}`}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="text-red-500" onClick={() => setDeleteId(l.id)} data-testid={`button-delete-lead-${l.id}`}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact Log Panel */}
      {contactLeadId && (
        <div className="fixed right-0 top-0 h-full w-96 bg-surface border-l border-outline-variant shadow-lg z-50 flex flex-col" data-testid="panel-contact-log">
          <div className="flex items-center justify-between p-4 border-b border-outline-variant/30">
            <h3 className="font-semibold text-on-surface">Aloqa logi</h3>
            <Button size="icon" variant="ghost" onClick={() => setContactLeadId(null)}><X className="h-4 w-4" /></Button>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {contacts.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-4">Hozircha aloqa yo'q</p>
            ) : (Array.isArray(contacts) ? contacts : []).map(c => (
              <div key={c.id} className="bg-surface-container rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <PhoneCall className="h-3.5 w-3.5 text-primary" />
                  <span className="text-sm font-medium text-on-surface">{contactTypeLabels[c.type] || c.type}</span>
                  <span className="text-xs text-on-surface-variant ml-auto">{new Date(c.contactedAt).toLocaleDateString("uz-UZ")}</span>
                </div>
                {c.summary && <p className="text-sm text-on-surface-variant">{c.summary}</p>}
                {c.outcome && <Badge className="text-xs mt-1 no-default-hover-elevate">{outcomeLabels[c.outcome] || c.outcome}</Badge>}
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-outline-variant/30 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Yangi aloqa qo'shish</p>
            <Select value={contactForm.type} onValueChange={(v) => setContactForm({ ...contactForm, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(contactTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <Textarea placeholder="Qisqacha xulosa..." value={contactForm.summary} onChange={(e) => setContactForm({ ...contactForm, summary: e.target.value })} className="resize-none" />
            <Select value={contactForm.outcome} onValueChange={(v) => setContactForm({ ...contactForm, outcome: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(outcomeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <Button className="w-full" onClick={() => addContactMutation.mutate(contactForm)} disabled={addContactMutation.isPending} data-testid="button-add-contact">Qayd etish</Button>
          </div>
        </div>
      )}

      {/* Funnel Dialog */}
      <Dialog open={funnelOpen} onOpenChange={setFunnelOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Marketing Funnel</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {(Array.isArray(funnelData) ? funnelData : []).map((stage, i) => (
              <div key={stage.status} className="space-y-1" data-testid={`funnel-stage-${stage.status}`}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-on-surface">{stage.label}</span>
                  <span className="text-on-surface-variant">{stage.count} ta</span>
                </div>
                <div className="bg-surface-container rounded-full h-2">
                  <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${Math.max(stage.conversionRate, 2)}%` }} />
                </div>
                {i > 0 && stage.dropOff > 0 && (
                  <p className="text-xs text-red-500">-{stage.dropOff}% oldingi bosqichdan</p>
                )}
              </div>
            ))}
            {funnelData.length === 0 && <p className="text-center text-on-surface-variant py-4">Ma'lumot yuklanmoqda...</p>}
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => { if (!v) setDeleteId(null); }}
        title="Lidni o'chirish"
        description="Ushbu marketing lidni o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        variant="destructive"
        onConfirm={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}
      />
    </div>
  );
}
