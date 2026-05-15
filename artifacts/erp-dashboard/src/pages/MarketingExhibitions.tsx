/**
 * @module MarketingExhibitions
 * @description React page component. Route-level UI.
 */

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Building2, Pencil, Trash2, MapPin, Users, QrCode, Globe2, UserPlus, DollarSign } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EPErrorState, EPPageHeader, EPStatusPill } from "@/components/ep";

import { useTranslation } from '@/lib/i18n';
const statusLabels: Record<string, string> = { planned: "Rejalashtirilgan", confirmed: "Tasdiqlangan", active: "Faol", completed: "Tugallangan", cancelled: "Bekor qilingan" };
const statusColors: Record<string, string> = { planned: "bg-yellow-100 text-[var(--ep-yellow)] dark:bg-yellow-900/30 dark:text-yellow-400", confirmed: "bg-blue-100 text-[var(--ep-blue)] dark:bg-blue-900/30 dark:text-blue-400", active: "bg-green-100 text-[var(--ep-green)] dark:bg-green-900/30 dark:text-green-400", completed: "bg-muted/40 text-foreground dark:bg-gray-800 dark:text-muted-foreground", cancelled: "bg-red-100 text-[var(--ep-red)] dark:bg-red-900/30 dark:text-red-400" };

interface ExhibitionLead {
  id: string;
  exhibitionId: string;
  companyName: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  interest: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
}

interface ExhibitionFull {
  id: string;
  name: string;
  nameRu: string | null;
  location: string | null;
  country: string | null;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budget: string | null;
  actualSpend: string | null;
  teamMembers: string | null;
  qrCode: string | null;
  leadCount: number | null;
  dealCount: number | null;
}

export default function MarketingExhibitions() {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedExh, setSelectedExh] = useState<string | null>(null);
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadForm, setLeadForm] = useState({ companyName: "", contactPerson: "", phone: "", email: "", interest: "", notes: "" });
  const [form, setForm] = useState({
    name: "", nameRu: "", location: "", country: "", description: "",
    status: "planned", startDate: "", endDate: "", budget: "", teamMembers: "",
  });

  const { data: exhList = [], isLoading, isError, error, refetch} = useQuery<ExhibitionFull[]>({ queryKey: ["/api/marketing/exhibitions"], select: selectArray<ExhibitionFull> });
  const { data: leads = [] } = useQuery<ExhibitionLead[]>({
    queryKey: ["/api/marketing/exhibitions", selectedExh, "leads"],
    enabled: !!selectedExh,
    queryFn: () => apiRequest('GET', `/api/marketing/exhibitions/${selectedExh}/leads`).then(r => r.json()),
    select: selectArray<ExhibitionLead>,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/marketing/exhibitions", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/marketing/exhibitions"] }); setOpen(false); resetForm(); toast({ title: "Ko'rgazma yaratildi" }); },
    onError: (e: unknown) => toast({ title: "Xatolik", description: (e as Error).message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => apiRequest("PATCH", `/api/marketing/exhibitions/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/marketing/exhibitions"] }); setOpen(false); resetForm(); toast({ title: "Ko'rgazma yangilandi" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/marketing/exhibitions/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/marketing/exhibitions"] }); toast({ title: "Ko'rgazma o'chirildi" }); },
  });

  const addLeadMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", `/api/marketing/exhibitions/${selectedExh}/leads`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/exhibitions", selectedExh, "leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/exhibitions"] });
      setLeadOpen(false);
      setLeadForm({ companyName: "", contactPerson: "", phone: "", email: "", interest: "", notes: "" });
      toast({ title: "Lead qo'shildi" });
    },
    onError: (e: unknown) => toast({ title: "Xatolik", description: (e as Error).message, variant: "destructive" }),
  });

  const qrMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/marketing/exhibitions/${id}/qr`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/exhibitions"] });
      toast({ title: "QR kod yaratildi" });
    },
  });

  const resetForm = () => {
    setForm({ name: "", nameRu: "", location: "", country: "", description: "", status: "planned", startDate: "", endDate: "", budget: "", teamMembers: "" });
    setEditId(null);
  };

  const handleEdit = (e: ExhibitionFull) => {
    setEditId(e.id);
    setForm({
      name: e.name, nameRu: e.nameRu || "", location: e.location || "", country: e.country || "",
      description: e.description || "", status: e.status || "planned",
      startDate: e.startDate ? new Date(e.startDate).toISOString().slice(0, 10) : "",
      endDate: e.endDate ? new Date(e.endDate).toISOString().slice(0, 10) : "",
      budget: e.budget || "", teamMembers: e.teamMembers || "",
    });
    setOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      ...form,
      startDate: form.startDate ? new Date(form.startDate) : undefined,
      endDate: form.endDate ? new Date(form.endDate) : undefined,
      budget: form.budget || undefined, location: form.location || undefined,
      description: form.description || undefined, teamMembers: form.teamMembers || undefined,
      nameRu: form.nameRu || undefined, country: form.country || undefined,
    };
    if (editId) updateMutation.mutate({ id: editId, data: payload });
    else createMutation.mutate(payload);
  };

  if (isLoading) return <div className="p-4 space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-28 rounded-lg" />)}</div>;

  if (isError) {
    return <EPErrorState onRetry={refetch}  error={error} />;
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5" data-testid="marketing-exhibitions">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("marketingKorgazmalar")}</b></>}
        title={t("marketingKorgazmalar")}
      />
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold gap-2" data-testid="button-create-exhibition">
              <Plus className="h-4 w-4" />
              {t("yangiKorgazma")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-card border-none p-6">
            <DialogHeader><DialogTitle className="text-foreground font-bold">{editId ? "Ko'rgazmani tahrirlash" : "Yangi Ko'rgazma"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5"><Label className="text-muted-foreground">Nomi (UZ) *</Label><Input className="bg-background border-border" data-testid="input-exhibition-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-muted-foreground">Nomi (RU)</Label><Input className="bg-background border-border" value={form.nameRu} onChange={(e) => setForm({ ...form, nameRu: e.target.value })} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-muted-foreground">{t("address")}</Label><Input className="bg-background border-border" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
                <div className="space-y-1.5"><Label className="text-muted-foreground">{t("davlat")}</Label><Input className="bg-background border-border" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder={t("ozbekiston")} /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-muted-foreground">{t("progress.description")}</Label><Textarea className="bg-background border-border" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground">{t("status28")}</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger className="bg-background border-border h-9"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="text-muted-foreground">{t("byudjet")}</Label><Input className="bg-background border-border" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="0" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-muted-foreground">{t("boshlanish")}</Label><Input className="bg-background border-border" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
                <div className="space-y-1.5"><Label className="text-muted-foreground">{t("tugash")}</Label><Input className="bg-background border-border" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-muted-foreground">{t("jamoaAzolari")}</Label><Input className="bg-background border-border" value={form.teamMembers} onChange={(e) => setForm({ ...form, teamMembers: e.target.value })} placeholder={t("aliVali")} /></div>
              <Button onClick={handleSubmit} disabled={!form.name || createMutation.isPending || updateMutation.isPending} className="w-full bg-primary text-white font-bold h-11" data-testid="button-submit-exhibition">{editId ? "Saqlash" : "Yaratish"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card rounded-lg p-5 border-none text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("total")}</p>
          <p className="text-4xl font-bold tracking-tight text-foreground">{exhList?.length || 0}</p>
        </Card>
        <Card className="bg-card rounded-lg p-5 border-none text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("active")}</p>
          <p className="text-4xl font-bold tracking-tight text-[var(--ep-green)]">{exhList?.filter(e => e.status === "active").length || 0}</p>
        </Card>
        <Card className="bg-card rounded-lg p-5 border-none text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("lidlar")}</p>
          <p className="text-4xl font-bold tracking-tight text-primary">{exhList?.reduce((s, e) => s + (e.leadCount || 0), 0)}</p>
        </Card>
        <Card className="bg-card rounded-lg p-5 border-none text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("bitimlar")}</p>
          <p className="text-4xl font-bold tracking-tight text-[var(--ep-yellow)]">{exhList?.reduce((s, e) => s + (e.dealCount || 0), 0)}</p>
        </Card>
      </div>

      {exhList?.length === 0 ? (
        <Card className="bg-card border-none"><CardContent className="p-12 text-center text-muted-foreground">{t("hozirchaKorgazmalarYoq")}</CardContent></Card>
      ) : (
        <div className="space-y-6">
          {exhList?.map((e) => (
            <Card key={e.id} data-testid={`card-exhibition-${e.id}`} className={`bg-card border-none shadow-sm transition-all ${selectedExh === e.id ? "ring-2 ring-primary" : "hover:shadow-md"}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 p-6">
                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setSelectedExh(selectedExh === e.id ? null : e.id)}>
                  <CardTitle className="text-[14px] font-semibold font-bold text-foreground">{e.name}</CardTitle>
                  {e.nameRu && <p className="text-sm text-muted-foreground mt-1">{e.nameRu}</p>}
                  <div className="flex flex-wrap gap-3 mt-3">
                    {e.location && <span className="text-sm text-muted-foreground flex items-center gap-1.5"><MapPin className="h-4 w-4" />{e.location}</span>}
                    {e.country && <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Globe2 className="h-4 w-4" />{e.country}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5 no-default-hover-elevate" onClick={() => qrMutation.mutate(e.id)} data-testid={`button-qr-${e.id}`}><QrCode className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted no-default-hover-elevate" onClick={() => handleEdit(e)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-red-500 hover:bg-red-50 no-default-hover-elevate" onClick={() => setDeleteId(e.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-0">
                {e.description && <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{e.description}</p>}
                <div className="flex flex-wrap gap-3 mb-4">
                  <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-semibold no-default-hover-elevate ${statusColors[e.status || "planned"]}`}>
                    {statusLabels[e.status || "planned"]}
                  </Badge>
                  {e.budget && <Badge variant="outline" className="border-border text-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold no-default-hover-elevate"><DollarSign className="h-3 w-3 mr-1" />{Number(e.budget).toLocaleString()} so'm</Badge>}
                  {e.actualSpend && <EPStatusPill tone="neutral" className="bg-muted/60 text-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold no-default-hover-elevate">Sarflangan: {Number(e.actualSpend).toLocaleString()}</EPStatusPill>}
                  <Badge variant="outline" className="border-border text-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold no-default-hover-elevate"><Users className="h-3 w-3 mr-1" />{e.leadCount || 0} lid</Badge>
                  {e.teamMembers && <Badge variant="outline" className="border-border text-muted-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold no-default-hover-elevate">{e.teamMembers}</Badge>}
                  {e.startDate && <Badge variant="outline" className="border-border text-muted-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold no-default-hover-elevate">{new Date(e.startDate).toLocaleDateString("uz-UZ")}</Badge>}
                </div>

                {selectedExh === e.id && (
                  <div className="border-t border-border pt-5 mt-5">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Lidlar ({leads?.length || 0})
                      </h3>
                      <Dialog open={leadOpen} onOpenChange={setLeadOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="bg-primary text-white font-semibold h-9 rounded-lg" data-testid="button-add-lead">
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            {t("lidQoshish")}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md bg-card border-none p-6">
                          <DialogHeader><DialogTitle className="text-foreground font-bold">{t("yangiLead")}</DialogTitle></DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-1.5"><Label className="text-muted-foreground">{t("kompaniya2")}</Label><Input className="bg-background border-border" data-testid="input-lead-company" value={leadForm.companyName} onChange={(ev) => setLeadForm({ ...leadForm, companyName: ev.target.value })} /></div>
                            <div className="space-y-1.5"><Label className="text-muted-foreground">{t("kontaktShaxs")}</Label><Input className="bg-background border-border" value={leadForm.contactPerson} onChange={(ev) => setLeadForm({ ...leadForm, contactPerson: ev.target.value })} /></div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5"><Label className="text-muted-foreground">{t("phone")}</Label><Input className="bg-background border-border" value={leadForm.phone} onChange={(ev) => setLeadForm({ ...leadForm, phone: ev.target.value })} /></div>
                              <div className="space-y-1.5"><Label className="text-muted-foreground">{t('email1')}</Label><Input className="bg-background border-border" value={leadForm.email} onChange={(ev) => setLeadForm({ ...leadForm, email: ev.target.value })} /></div>
                            </div>
                            <div className="space-y-1.5"><Label className="text-muted-foreground">{t("qiziqish")}</Label><Input className="bg-background border-border" value={leadForm.interest} onChange={(ev) => setLeadForm({ ...leadForm, interest: ev.target.value })} /></div>
                            <div className="space-y-1.5"><Label className="text-muted-foreground">{t("Izoh")}</Label><Textarea className="bg-background border-border" value={leadForm.notes} onChange={(ev) => setLeadForm({ ...leadForm, notes: ev.target.value })} /></div>
                            <Button onClick={() => addLeadMutation.mutate(leadForm)} disabled={!leadForm.companyName || addLeadMutation.isPending} className="w-full bg-primary text-white font-bold h-11" data-testid="button-submit-lead">{t("add")}</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    {leads && leads.length > 0 ? (
                      <div className="divide-y divide-outline-variant bg-muted/40 rounded-lg overflow-hidden">
                        {(Array.isArray(leads) ? leads : []).map((l) => (
                          <div key={l.id} className="flex items-center justify-between gap-4 p-4 hover:bg-muted transition-colors text-sm" data-testid={`lead-item-${l.id}`}>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-foreground">{l.companyName}</p>
                              {l.contactPerson && <p className="text-muted-foreground text-xs mt-1">{l.contactPerson} {l.phone && `| ${l.phone}`}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                               {l.interest && <Badge variant="outline" className="border-border text-muted-foreground text-[10px] rounded-full px-2 py-0.5 no-default-hover-elevate font-bold">{l.interest}</Badge>}
                               <EPStatusPill tone="neutral" className="bg-muted/60 text-foreground text-[10px] rounded-full px-2 py-0.5 no-default-hover-elevate font-bold">{l.status}</EPStatusPill>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-6 bg-muted/40 rounded-lg">{t("hozirchaLidlarYoq")}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => { if (!v) setDeleteId(null); }}
        title={t("korgazmaniOchirish")}
        description={t("ushbuKorgazmaniOchirishniTasdiqlaysizmiBu")}
        confirmText="O'chirish"
        variant="destructive"
        onConfirm={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}
      />
    </div>
  );
}
