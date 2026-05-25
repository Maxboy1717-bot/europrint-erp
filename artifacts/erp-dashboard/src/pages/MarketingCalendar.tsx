/**
 * @module MarketingCalendar
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, getAuthHeaders } from "@/lib/queryClient";
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
import { Plus, Calendar, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import type { ContentCalendar } from "@shared/schema";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EPErrorState, EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

const statusLabels: Record<string, string> = { planned: "Rejalashtirilgan", in_progress: "Jarayonda", completed: "Tugallangan", cancelled: "Bekor qilingan" };
const platformLabels: Record<string, string> = { telegram: "Telegram", instagram: "Instagram", facebook: "Facebook", website: "Veb-sayt" };

export default function MarketingCalendar() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "", platform: "telegram", type: "post", status: "planned", scheduledDate: "", assignedTo: "" });

  const { data: entries, isLoading, isError, error, refetch} = useQuery<ContentCalendar[]>({
    queryKey: ["/api/marketing/calendar", { month, year }],
    queryFn: async () => {
      const json = await apiRequest<unknown>('GET', `/api/marketing/calendar?month=${month}&year=${year}`);
      if (Array.isArray(json)) return json as ContentCalendar[];
      const obj = json as { data?: ContentCalendar[] };
      return obj?.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/marketing/calendar", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/marketing/calendar"] }); setOpen(false); resetForm(); toast({ title: "Taqvim yozuvi yaratildi" }); },
    onError: (e: unknown) => toast({ title: "Xatolik", description: (e as Error).message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/marketing/calendar/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/marketing/calendar"] }); toast({ title: "Taqvim yozuvi o'chirildi" }); },
  });

  const resetForm = () => { setForm({ title: "", content: "", platform: "telegram", type: "post", status: "planned", scheduledDate: "", assignedTo: "" }); setEditId(null); };

  const handleSubmit = () => {
    const payload = { ...form, scheduledDate: form.scheduledDate ? new Date(form.scheduledDate) : undefined, assignedTo: form.assignedTo || undefined, content: form.content || undefined };
    if (editId) {
      apiRequest("PATCH", `/api/marketing/calendar/${editId}`, payload).then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/marketing/calendar"] }); setOpen(false); resetForm(); toast({ title: "Yangilandi" });
      });
    } else createMutation.mutate(payload);
  };

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(year - 1); } else setMonth(month - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(year + 1); } else setMonth(month + 1); };

  const monthNames = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

  const getEntriesForDay = (day: number) => {
    return entries?.filter((e) => {
      const d = new Date(e.scheduledDate);
      return d.getDate() === day && d.getMonth() + 1 === month && d.getFullYear() === year;
    }) || [];
  };

  if (isLoading) return <div className="p-4"><Skeleton className="h-96 rounded-lg" /></div>;

  if (isError) {
    return <EPErrorState onRetry={refetch}  error={error} />;
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5" data-testid="marketing-calendar">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("marketingTaqvim")}</b></>}
        title={t("marketingTaqvim")}
      />
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold gap-2" data-testid="button-create-calendar">
              <Plus className="h-4 w-4" />
              {t("yangiReja1")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-card border-none p-6">
            <DialogHeader><DialogTitle className="text-foreground font-bold">{t("yangiTaqvimYozuvi")}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5"><Label className="text-muted-foreground">{t("sarlavha")}</Label><Input className="bg-background border-border" data-testid="input-calendar-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-muted-foreground">{t("progress.description")}</Label><Textarea className="bg-background border-border" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-muted-foreground">{t("platforma")}</Label><Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}><SelectTrigger className="bg-background border-border h-9"><SelectValue /></SelectTrigger><SelectContent className="bg-card border-border">{Object.entries(platformLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label className="text-muted-foreground">{t("status28")}</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger className="bg-background border-border h-9"><SelectValue /></SelectTrigger><SelectContent className="bg-card border-border">{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="space-y-1.5"><Label className="text-muted-foreground">{t("sana")}</Label><Input className="bg-background border-border" type="date" data-testid="input-calendar-date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} /></div>
              <Button onClick={handleSubmit} disabled={!form.title || !form.scheduledDate || createMutation.isPending} className="w-full bg-primary text-white font-bold h-11" data-testid="button-submit-calendar">{t("Yaratish")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card border-none shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-4 p-6 bg-muted/60">
          <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted no-default-hover-elevate" onClick={prevMonth} data-testid="button-prev-month"><ChevronLeft className="h-4 w-4" /></Button>
          <CardTitle className="text-[14px] font-semibold font-bold text-foreground">{monthNames[month - 1]} {year}</CardTitle>
          <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted no-default-hover-elevate" onClick={nextMonth} data-testid="button-next-month"><ChevronRight className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 lg:grid-cols-7 gap-2">
            {(["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"]).map((d) => (
              <div key={d} className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground p-2">{d}</div>
            ))}
            {Array.from({ length: adjustedFirstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEntries = getEntriesForDay(day);
              const isToday = day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();
              return (
                <div key={day} className={`min-h-[100px] p-2 rounded-lg border transition-colors ${isToday ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:bg-muted/40"}`} data-testid={`calendar-day-${day}`}>
                  <span className={`text-xs font-bold ${isToday ? "text-primary" : "text-muted-foreground"}`}>{day}</span>
                  <div className="space-y-1 mt-1.5">
                    {(Array.isArray(dayEntries) ? dayEntries : []).map((e) => (
                      <div key={e.id} className="text-[10px] truncate p-1.5 rounded bg-muted/60 text-foreground flex items-center justify-between gap-1 group font-medium">
                        <span className="truncate">{e.title}</span>
                        <Button size="icon" variant="ghost" className="h-4 w-4 invisible group-hover:visible text-muted-foreground hover:text-red-500 hover:bg-transparent p-0" onClick={() => setDeleteId(e.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => { if (!v) setDeleteId(null); }}
        title={t("taqvimYozuviniOchirish")}
        description={t("ushbuTaqvimYozuviniOchirishniTasdiqlaysizmi")}
        confirmText="O'chirish"
        variant="destructive"
        onConfirm={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}
      />
    </div>
  );
}
