/**
 * @module MarketingPR
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
import { Plus, MessageSquare, Pencil, Trash2, Calendar } from "lucide-react";
import type { PrActivity } from "@shared/schema";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EPErrorState, EPPageHeader, EPStatusPill } from "@/components/ep";

import { useTranslation } from '@/lib/i18n';
const typeLabels: Record<string, string> = { press_release: "Press-reliz", interview: "Intervyu", article: "Maqola", event: "Tadbir", sponsorship: "Homiylik", partnership: "Hamkorlik", other: "Boshqa" };
const statusLabels: Record<string, string> = { planned: "Rejalashtirilgan", in_progress: "Jarayonda", published: "Nashr etilgan", completed: "Tugallangan" };

export default function MarketingPR() {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", type: "press_release", status: "planned", description: "", media: "", date: "", url: "" });

  const { data: activities = [], isLoading, isError, error, refetch} = useQuery<PrActivity[]>({ queryKey: ["/api/marketing/pr"], select: selectArray<PrActivity> });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/marketing/pr", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/marketing/pr"] }); setOpen(false); resetForm(); toast({ title: "PR faoliyat yaratildi" }); },
    onError: (e: unknown) => toast({ title: "Xatolik", description: (e as Error).message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => apiRequest("PATCH", `/api/marketing/pr/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/marketing/pr"] }); setOpen(false); resetForm(); toast({ title: "PR faoliyat yangilandi" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/marketing/pr/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/marketing/pr"] }); toast({ title: "PR faoliyat o'chirildi" }); },
  });

  const resetForm = () => { setForm({ title: "", type: "press_release", status: "planned", description: "", media: "", date: "", url: "" }); setEditId(null); };

  const handleEdit = (a: PrActivity) => {
    setEditId(a.id);
    setForm({ title: a.title, type: a.type, status: a.status || "planned", description: a.description || "", media: a.media || "", date: a.date ? new Date(a.date).toISOString().slice(0, 10) : "", url: a.url || "" });
    setOpen(true);
  };

  const handleSubmit = () => {
    const payload = { ...form, date: form.date ? new Date(form.date) : undefined, description: form.description || undefined, media: form.media || undefined, url: form.url || undefined };
    if (editId) updateMutation.mutate({ id: editId, data: payload });
    else createMutation.mutate(payload);
  };

  if (isLoading) return <div className="p-4 space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-24 rounded-lg" />)}</div>;

  if (isError) {
    return <EPErrorState onRetry={refetch}  error={error} />;
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5" data-testid="marketing-pr">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">Marketing {t('prMedia')}</b></>}
        title={`Marketing ${t("prMedia")}`}
      />
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold gap-2" data-testid="button-create-pr">
              <Plus className="h-4 w-4" />
              {t("yangiPr")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-card border-none p-6">
            <DialogHeader><DialogTitle className="text-foreground font-bold">{editId ? "PR faoliyatni tahrirlash" : "Yangi PR Faoliyat"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5"><Label className="text-muted-foreground">{t("sarlavha")}</Label><Input className="bg-background border-border" data-testid="input-pr-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-muted-foreground">{t("progress.description")}</Label><Textarea className="bg-background border-border" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-muted-foreground">{t("turi")}</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger className="bg-background border-border h-9"><SelectValue /></SelectTrigger><SelectContent className="bg-card border-border">{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label className="text-muted-foreground">{t("status28")}</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger className="bg-background border-border h-9"><SelectValue /></SelectTrigger><SelectContent className="bg-card border-border">{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="space-y-1.5"><Label className="text-muted-foreground">{t('mediaOav')}</Label><Input className="bg-background border-border" value={form.media} onChange={(e) => setForm({ ...form, media: e.target.value })} placeholder={t("gazetaTvOnline")} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-muted-foreground">{t("date")}</Label><Input className="bg-background border-border" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div className="space-y-1.5"><Label className="text-muted-foreground">{t("havolaUrl")}</Label><Input className="bg-background border-border" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." /></div>
              </div>
              <Button onClick={handleSubmit} disabled={!form.title || !form.type || createMutation.isPending || updateMutation.isPending} className="w-full bg-primary text-white font-bold h-11" data-testid="button-submit-pr">{editId ? "Saqlash" : "Yaratish"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {activities?.length === 0 ? (
        <Card className="bg-card border-none"><CardContent className="p-12 text-center text-muted-foreground">{t("hozirchaPrFaoliyatlarYoq")}</CardContent></Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activities?.map((a) => (
            <Card key={a.id} className="bg-card border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden" data-testid={`card-pr-${a.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 p-5">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-[14px] font-semibold font-bold text-foreground truncate">{a.title}</CardTitle>
                  {a.media && <p className="text-sm text-muted-foreground mt-1.5">{a.media}</p>}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted no-default-hover-elevate" onClick={() => handleEdit(a)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 no-default-hover-elevate" onClick={() => setDeleteId(a.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                {a.description && <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">{a.description}</p>}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="border-border text-foreground rounded-full px-2.5 py-0.5 text-[10px] font-bold no-default-hover-elevate">{typeLabels[a.type] || a.type}</Badge>
                  <Badge className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-[10px] font-bold no-default-hover-elevate">{statusLabels[a.status || "planned"]}</Badge>
                  {a.reach && <EPStatusPill tone="neutral" className="bg-muted/60 text-muted-foreground text-[10px] rounded-full px-2.5 py-0.5 font-bold no-default-hover-elevate">{a.reach} qamrov</EPStatusPill>}
                </div>
                {a.date && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(a.date).toLocaleDateString("uz-UZ")}
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
        title={t("prFaoliyatniOchirish")}
        description={t("ushbuPrFaoliyatniOchirishniTasdiqlaysizmi")}
        confirmText="O'chirish"
        variant="destructive"
        onConfirm={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}
      />
    </div>
  );
}
