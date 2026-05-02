import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
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
import { ErrorState } from "@/components/ui/error-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const typeLabels: Record<string, string> = { press_release: "Press-reliz", interview: "Intervyu", article: "Maqola", event: "Tadbir", sponsorship: "Homiylik", partnership: "Hamkorlik", other: "Boshqa" };
const statusLabels: Record<string, string> = { planned: "Rejalashtirilgan", in_progress: "Jarayonda", published: "Nashr etilgan", completed: "Tugallangan" };

export default function MarketingPR() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", type: "press_release", status: "planned", description: "", media: "", date: "", url: "" });

  const { data: activities, isLoading, isError, refetch} = useQuery<PrActivity[]>({ queryKey: ["/api/marketing/pr"] });

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

  if (isLoading) return <div className="p-4 space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-24" />)}</div>;

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="p-6 space-y-6" data-testid="marketing-pr">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-4xl font-light tracking-tight text-on-surface">
          Marketing <span className="font-bold text-primary">PR & Media</span>
        </h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold" data-testid="button-create-pr">
              <Plus className="h-4 w-4 mr-2" />
              Yangi PR
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-surface-container-lowest border-none ">
            <DialogHeader><DialogTitle className="text-on-surface font-bold">{editId ? "PR faoliyatni tahrirlash" : "Yangi PR Faoliyat"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5"><Label className="text-on-surface-variant">Sarlavha *</Label><Input className="bg-surface border-outline-variant" data-testid="input-pr-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-on-surface-variant">Tavsif</Label><Textarea className="bg-surface border-outline-variant" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-on-surface-variant">Turi *</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger className="bg-surface border-outline-variant"><SelectValue /></SelectTrigger><SelectContent className="bg-surface-container-lowest border-outline-variant">{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label className="text-on-surface-variant">Holat</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger className="bg-surface border-outline-variant"><SelectValue /></SelectTrigger><SelectContent className="bg-surface-container-lowest border-outline-variant">{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="space-y-1.5"><Label className="text-on-surface-variant">Media / OAV</Label><Input className="bg-surface border-outline-variant" value={form.media} onChange={(e) => setForm({ ...form, media: e.target.value })} placeholder="Gazeta, TV, Online..." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-on-surface-variant">Sana</Label><Input className="bg-surface border-outline-variant" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div className="space-y-1.5"><Label className="text-on-surface-variant">Havola (URL)</Label><Input className="bg-surface border-outline-variant" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." /></div>
              </div>
              <Button onClick={handleSubmit} disabled={!form.title || !form.type || createMutation.isPending || updateMutation.isPending} className="w-full bg-gradient-to-br from-primary to-primary-dim text-white font-bold h-11" data-testid="button-submit-pr">{editId ? "Saqlash" : "Yaratish"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {activities?.length === 0 ? (
        <Card className="bg-surface-container-lowest border-none"><CardContent className="p-12 text-center text-on-surface-variant">Hozircha PR faoliyatlar yo'q</CardContent></Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activities?.map((a) => (
            <Card key={a.id} className="bg-surface-container-lowest border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden" data-testid={`card-pr-${a.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 p-5">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg font-bold text-on-surface truncate">{a.title}</CardTitle>
                  {a.media && <p className="text-sm text-on-surface-variant mt-1.5">{a.media}</p>}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high no-default-hover-elevate" onClick={() => handleEdit(a)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-on-surface-variant hover:text-red-500 hover:bg-red-50 no-default-hover-elevate" onClick={() => setDeleteId(a.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                {a.description && <p className="text-sm text-on-surface-variant mb-4 line-clamp-2 leading-relaxed">{a.description}</p>}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="border-outline-variant text-on-surface rounded-full px-2.5 py-0.5 text-[10px] font-bold no-default-hover-elevate">{typeLabels[a.type] || a.type}</Badge>
                  <Badge className="bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-[10px] font-bold no-default-hover-elevate">{statusLabels[a.status || "planned"]}</Badge>
                  {a.reach && <Badge variant="secondary" className="bg-surface-container text-on-surface-variant text-[10px] rounded-full px-2.5 py-0.5 font-bold no-default-hover-elevate">{a.reach} qamrov</Badge>}
                </div>
                {a.date && (
                  <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
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
        title="PR faoliyatni o'chirish"
        description="Ushbu PR faoliyatni o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        variant="destructive"
        onConfirm={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}
      />
    </div>
  );
}
