import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, selectArray } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Target, Pencil, Trash2, BarChart2, Users, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { MarketingCampaign } from "@shared/schema";

const statusLabels: Record<string, string> = { draft: "Qoralama", active: "Faol", paused: "To'xtatilgan", completed: "Tugallangan" };
const typeLabels: Record<string, string> = { digital: "Raqamli", print: "Bosma", social: "Ijtimoiy tarmoq", email: "Email", event: "Tadbir" };
const platformLabels: Record<string, string> = { telegram: "Telegram", instagram: "Instagram", facebook: "Facebook", google: "Google", other: "Boshqa" };

interface CampaignStats {
  id: string;
  name: string;
  budget: string | null;
  spentAmount: string | null;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  roi: number | null;
  roas: number | null;
  cpl: number | null;
  cpa: number | null;
  estimatedRevenue: number;
}

function CampaignStatsRow({ campaignId }: { campaignId: string }) {
  const { data: stats, isLoading } = useQuery<CampaignStats>({
    queryKey: ["/api/marketing/campaigns", campaignId, "stats"],
    queryFn: () => fetch(`/api/marketing/campaigns/${campaignId}/stats`, { credentials: "include" }).then(r => r.json()),
  });

  if (isLoading) return (
    <div className="grid grid-cols-4 gap-3 pt-3 border-t border-outline-variant mt-3">
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-10" />)}
    </div>
  );

  if (!stats) return null;

  return (
    <div className="space-y-3 pt-3 border-t border-outline-variant mt-3" data-testid={`campaign-stats-${campaignId}`}>
      {/* Qator 1: Lid statistikasi */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="text-center">
          <p className="text-xs text-on-surface-variant flex items-center justify-center gap-1 uppercase font-semibold tracking-wider"><Users className="h-3 w-3" />Jami lidlar</p>
          <p className="text-lg font-bold text-on-surface">{stats.totalLeads}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-on-surface-variant flex items-center justify-center gap-1 uppercase font-semibold tracking-wider"><TrendingUp className="h-3 w-3" />CRM ga o'tgan</p>
          <p className="text-lg font-bold text-green-600">{stats.convertedLeads}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-on-surface-variant flex items-center justify-center gap-1 uppercase font-semibold tracking-wider"><BarChart2 className="h-3 w-3" />Konversiya</p>
          <p className="text-lg font-bold text-blue-600">{stats.conversionRate}%</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-on-surface-variant uppercase font-semibold tracking-wider">ROI</p>
          <p className={`text-lg font-bold ${stats.roi !== null ? (stats.roi >= 0 ? "text-green-600" : "text-red-500") : "text-on-surface-variant"}`}>
            {stats.roi !== null ? `${stats.roi}%` : "—"}
          </p>
        </div>
      </div>
      {/* Qator 2: ROAS, CPL, CPA (Task #2) */}
      <div className="grid grid-cols-3 gap-3 bg-surface-container rounded-lg p-3">
        <div className="text-center">
          <p className="text-xs text-on-surface-variant uppercase font-semibold tracking-wider mb-1">ROAS</p>
          <p className={`text-base font-bold ${stats.roas !== null && stats.roas >= 4 ? "text-green-600" : stats.roas !== null && stats.roas >= 2 ? "text-amber-600" : "text-red-500"}`}>
            {stats.roas !== null ? `${stats.roas}x` : "—"}
          </p>
          <p className="text-xs text-on-surface-variant">Target: 4x</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-on-surface-variant uppercase font-semibold tracking-wider mb-1">CPL</p>
          <p className="text-base font-bold text-on-surface">
            {stats.cpl !== null ? `${stats.cpl.toLocaleString()} so'm` : "—"}
          </p>
          <p className="text-xs text-on-surface-variant">Har 1 lid narxi</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-on-surface-variant uppercase font-semibold tracking-wider mb-1">CPA</p>
          <p className="text-base font-bold text-on-surface">
            {stats.cpa !== null ? `${stats.cpa.toLocaleString()} so'm` : "—"}
          </p>
          <p className="text-xs text-on-surface-variant">Har 1 konversiya</p>
        </div>
      </div>
      {stats.estimatedRevenue > 0 && (
        <div className="text-xs text-on-surface-variant flex items-center gap-1">
          <BarChart2 className="h-3 w-3" />
          Taxminiy daromad: {stats.estimatedRevenue.toLocaleString()} so'm (o'rtacha buyurtma × konversiyalar)
        </div>
      )}
    </div>
  );
}

export default function MarketingCampaigns() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedStats, setExpandedStats] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ name: "", description: "", type: "social", platform: "telegram", status: "draft", budget: "", startDate: "", endDate: "" });

  const { data: campaigns = [], isLoading, isError, refetch } = useQuery<MarketingCampaign[]>({ queryKey: ["/api/marketing/campaigns"], select: selectArray<MarketingCampaign> });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/marketing/campaigns", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/marketing/campaigns"] }); queryClient.invalidateQueries({ queryKey: ["/api/marketing/dashboard/stats"] }); setOpen(false); resetForm(); toast({ title: "Kampaniya yaratildi" }); },
    onError: (e: Error) => toast({ title: "Xatolik", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => apiRequest("PATCH", `/api/marketing/campaigns/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/marketing/campaigns"] }); queryClient.invalidateQueries({ queryKey: ["/api/marketing/dashboard/stats"] }); setOpen(false); resetForm(); toast({ title: "Kampaniya yangilandi" }); },
    onError: (e: Error) => toast({ title: "Xatolik", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/marketing/campaigns/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/marketing/campaigns"] }); queryClient.invalidateQueries({ queryKey: ["/api/marketing/dashboard/stats"] }); toast({ title: "Kampaniya o'chirildi" }); },
  });

  const resetForm = () => { setForm({ name: "", description: "", type: "social", platform: "telegram", status: "draft", budget: "", startDate: "", endDate: "" }); setEditId(null); };

  const handleEdit = (c: MarketingCampaign) => {
    setEditId(c.id);
    setForm({ name: c.name, description: c.description || "", type: c.type || "social", platform: c.platform || "telegram", status: c.status || "draft", budget: c.budget || "", startDate: c.startDate ? new Date(c.startDate).toISOString().slice(0, 10) : "", endDate: c.endDate ? new Date(c.endDate).toISOString().slice(0, 10) : "" });
    setOpen(true);
  };

  const handleSubmit = () => {
    const payload = { ...form, budget: form.budget || undefined, startDate: form.startDate ? new Date(form.startDate) : undefined, endDate: form.endDate ? new Date(form.endDate) : undefined };
    if (editId) updateMutation.mutate({ id: editId, data: payload });
    else createMutation.mutate(payload);
  };

  const toggleStats = (id: string) => {
    setExpandedStats(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const statusColor = (s: string | null): "default" | "secondary" | "outline" => {
    if (s === "active") return "default";
    if (s === "completed") return "secondary";
    return "outline";
  };

  if (isLoading) return <div className="p-4 space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-24" />)}</div>;

  if (isError) return <div className="p-4"><ErrorState onRetry={refetch} /></div>;

  return (
    <div className="flex-1 overflow-auto bg-surface p-6" data-testid="marketing-campaigns">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <h1 className="text-4xl font-light tracking-tight text-on-surface">
          Kampaniyalar <span className="font-bold text-primary">Boshqaruvi</span>
        </h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold" data-testid="button-create-campaign">
              <Plus className="h-4 w-4 mr-2" />
              Yangi Kampaniya
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-surface-container-lowest border-none ">
            <DialogHeader><DialogTitle className="text-on-surface font-bold">{editId ? "Kampaniyani tahrirlash" : "Yangi Kampaniya"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5"><Label className="text-on-surface-variant">Nomi *</Label><Input className="bg-surface border-outline-variant" data-testid="input-campaign-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-on-surface-variant">Tavsif</Label><Textarea className="bg-surface border-outline-variant" data-testid="input-campaign-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-on-surface-variant">Turi</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger className="bg-surface border-outline-variant" data-testid="select-campaign-type"><SelectValue /></SelectTrigger><SelectContent className="bg-surface-container-lowest border-outline-variant">{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label className="text-on-surface-variant">Platforma</Label><Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}><SelectTrigger className="bg-surface border-outline-variant" data-testid="select-campaign-platform"><SelectValue /></SelectTrigger><SelectContent className="bg-surface-container-lowest border-outline-variant">{Object.entries(platformLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-on-surface-variant">Holat</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger className="bg-surface border-outline-variant" data-testid="select-campaign-status"><SelectValue /></SelectTrigger><SelectContent className="bg-surface-container-lowest border-outline-variant">{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label className="text-on-surface-variant">Byudjet</Label><Input className="bg-surface border-outline-variant" data-testid="input-campaign-budget" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="0" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-on-surface-variant">Boshlanish</Label><Input className="bg-surface border-outline-variant" type="date" data-testid="input-campaign-start" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
                <div className="space-y-1.5"><Label className="text-on-surface-variant">Tugash</Label><Input className="bg-surface border-outline-variant" type="date" data-testid="input-campaign-end" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
              </div>
              <Button onClick={handleSubmit} disabled={!form.name || createMutation.isPending || updateMutation.isPending} className="w-full bg-gradient-to-br from-primary to-primary-dim text-white font-bold h-11" data-testid="button-submit-campaign">{editId ? "Saqlash" : "Yaratish"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {campaigns?.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-6 text-center text-on-surface-variant">Hozircha kampaniyalar yo'q. Yangi kampaniya yarating.</div>
      ) : (
        <div className="grid gap-6">
          {campaigns?.map((c) => (
            <div key={c.id} className="bg-surface-container-lowest rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow overflow-hidden" data-testid={`card-campaign-${c.id}`}>
              <div className="flex flex-row items-start justify-between gap-4 mb-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-bold text-on-surface truncate">{c.name}</h3>
                  <p className="text-sm text-on-surface-variant mt-2 line-clamp-2">{c.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high no-default-hover-elevate"
                    onClick={() => toggleStats(c.id)}
                    data-testid={`button-toggle-stats-${c.id}`}
                    title="Statistika"
                  >
                    {expandedStats.has(c.id) ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-9 w-9 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high no-default-hover-elevate" onClick={() => handleEdit(c)} data-testid={`button-edit-campaign-${c.id}`}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-9 w-9 text-on-surface-variant hover:text-red-500 hover:bg-red-50 no-default-hover-elevate" onClick={() => setDeleteId(c.id)} data-testid={`button-delete-campaign-${c.id}`}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <div>
                <div className="flex flex-wrap gap-3 mb-4">
                  <Badge variant={statusColor(c.status)} className="rounded-full px-2.5 py-0.5 text-xs font-semibold no-default-hover-elevate">
                    {statusLabels[c.status || "draft"] || c.status}
                  </Badge>
                  <Badge variant="outline" className="border-outline-variant text-on-surface-variant rounded-full px-2.5 py-0.5 text-xs font-semibold no-default-hover-elevate">
                    {typeLabels[c.type || "digital"] || c.type}
                  </Badge>
                  {c.platform && (
                    <Badge variant="outline" className="border-outline-variant text-on-surface-variant rounded-full px-2.5 py-0.5 text-xs font-semibold no-default-hover-elevate">
                      {platformLabels[c.platform] || c.platform}
                    </Badge>
                  )}
                  {c.budget && (
                    <Badge className="bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold no-default-hover-elevate">
                      {Number(c.budget).toLocaleString()} so'm
                    </Badge>
                  )}
                </div>
                
                {/* Campaign cards with progress bars */}
                <div className="w-full bg-surface-container rounded-full h-1.5 mb-4">
                   <div className="h-1.5 bg-primary rounded-full" style={{ width: c.status === 'completed' ? '100%' : c.status === 'active' ? '65%' : '15%' }}></div>
                </div>

                {expandedStats.has(c.id) && <CampaignStatsRow campaignId={c.id} />}
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => { if (!v) setDeleteId(null); }}
        title="Kampaniyani o'chirish"
        description="Ushbu marketing kampaniyani o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        variant="destructive"
        onConfirm={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}
      />
    </div>
  );
}
