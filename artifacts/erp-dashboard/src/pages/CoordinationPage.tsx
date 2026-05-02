import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest , selectArray } from "@/lib/queryClient";
import {
  Crown, Building2, Users, Handshake, Settings,
  ArrowUp, ArrowDown, ChevronRight, FileText,
  Clock, AlertCircle, CalendarDays, CheckCircle2, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const COUNCIL_LEVELS = [
  {
    level: 1,
    key: "founderCouncil" as const,
    freq: "Oylik",
    freqRu: "Ежемесячно",
    icon: Crown,
    color: "bg-amber-100 border-amber-300 text-amber-800",
    badgeColor: "bg-amber-500",
    desc: "Strategik yo'nalish, kapital qarorlar, asoschilar",
    descRu: "Стратегическое направление, капитальные решения",
  },
  {
    level: 2,
    key: "executiveCouncil" as const,
    freq: "Haftalik",
    freqRu: "Еженедельно",
    icon: Building2,
    color: "bg-blue-100 border-blue-300 text-blue-800",
    badgeColor: "bg-blue-500",
    desc: "Direktor + top-menejerlar, KPI ko'rib chiqish",
    descRu: "Директор + топ-менеджеры, обзор KPI",
  },
  {
    level: 3,
    key: "recommendationCouncil" as const,
    freq: "Seshanba",
    freqRu: "Вторник",
    icon: Users,
    color: "bg-emerald-100 border-emerald-300 text-emerald-800",
    badgeColor: "bg-emerald-500",
    desc: "Bo'lim boshliqlar, ЗВС tasdiqlash, operatsion muammolar",
    descRu: "Руководители отделов, утверждение ЗВС",
  },
  {
    level: 4,
    key: "recommendationCommittee" as const,
    freq: "Haftalik",
    freqRu: "Еженедельно",
    icon: Handshake,
    color: "bg-violet-100 border-violet-300 text-violet-800",
    badgeColor: "bg-violet-500",
    desc: "O'rta bosqich menejerlar, operatsion masalalar",
    descRu: "Менеджеры среднего звена, операционные вопросы",
  },
  {
    level: 5,
    key: "deputyCouncil" as const,
    freq: "Kunlik",
    freqRu: "Ежедневно",
    icon: Settings,
    color: "bg-slate-100 border-slate-300 text-slate-700",
    badgeColor: "bg-slate-500",
    desc: "Zamdirektor + bo'lim boshliqlar, tezkor muammolar",
    descRu: "Замдиректор + начальники отделов, оперативные вопросы",
  },
];

type DoklaStatus = "sent" | "read" | "resolved";
type RaspoStatus = "assigned" | "in_progress" | "done" | "overdue";

interface Dokla {
  id: string;
  from_name: string;
  subject: string;
  created_at: string;
  status: DoklaStatus;
  council_level: number;
  problem?: string;
  result?: string;
  proposal?: string;
}

interface Raspo {
  id: string;
  to_user: string;
  task: string;
  deadline?: string;
  status: RaspoStatus;
  priority: string;
  from_name?: string;
}

function statusBadge(status: DoklaStatus | RaspoStatus) {
  const map: Record<string, { label: string; cls: string }> = {
    sent:        { label: "Yuborildi",     cls: "bg-blue-100 text-blue-700"    },
    read:        { label: "O'qildi",       cls: "bg-amber-100 text-amber-700"  },
    resolved:    { label: "Hal qilindi",   cls: "bg-emerald-100 text-emerald-700" },
    assigned:    { label: "Topshirildi",   cls: "bg-blue-100 text-blue-700"    },
    in_progress: { label: "Bajarilmoqda",  cls: "bg-amber-100 text-amber-700"  },
    done:        { label: "Bajarildi",     cls: "bg-emerald-100 text-emerald-700" },
    overdue:     { label: "Muddati o'tdi", cls: "bg-red-100 text-red-700"      },
  };
  const cfg = map[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", cfg.cls)}>{cfg.label}</span>;
}

function priorityDot(priority: string) {
  const colors: Record<string, string> = { high: "bg-red-500", medium: "bg-amber-400", low: "bg-emerald-400" };
  return <span className={cn("inline-block w-2 h-2 rounded-full mr-1.5", colors[priority] ?? "bg-muted")} />;
}

function shortDate(dt: string) {
  if (!dt) return "";
  return dt.split("T")[0] || dt.slice(0, 10);
}

export default function CoordinationPage() {
  const { t, language } = useTranslation("coordination");
  const { toast } = useToast();
  const [doklaOpen, setDoklaOpen] = useState(false);
  const [raspoOpen, setRaspoOpen] = useState(false);
  const [doklaForm, setDoklaForm] = useState({ subject: "", problem: "", result: "", proposal: "", councilLevel: "3" });
  const [raspoForm, setRaspoForm] = useState({ to: "", task: "", deadline: "", priority: "medium" });
  const isRu = language === "ru";

  const { data: doklads = [], isLoading: doklaLoading } = useQuery<Dokla[]>({
    queryKey: ["/api/coordination/dokla"],
    select: selectArray<Dokla>,
  });

  const { data: rasporyazheniya = [], isLoading: raspoLoading } = useQuery<Raspo[]>({
    queryKey: ["/api/coordination/rasporyazhenie"],
    select: selectArray<Raspo>,
  });

  const { data: stats } = useQuery<{
    dokla: { sent: string; read: string; resolved: string; total: string };
    rasporyazhenie: { assigned: string; in_progress: string; done: string; overdue: string; total: string };
  }>({
    queryKey: ["/api/coordination/stats"],
  });

  const createDoklaMutation = useMutation({
    mutationFn: (data: typeof doklaForm) =>
      apiRequest("POST", "/api/coordination/dokla", {
        subject: data.subject,
        problem: data.problem,
        result: data.result,
        proposal: data.proposal,
        council_level: parseInt(data.councilLevel),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coordination/dokla"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordination/stats"] });
      toast({ title: isRu ? "Доклад отправлен" : "Доклад yuborildi" });
      setDoklaOpen(false);
      setDoklaForm({ subject: "", problem: "", result: "", proposal: "", councilLevel: "3" });
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "";
      toast({ title: isRu ? "Ошибка" : "Xatolik", description: msg, variant: "destructive" });
    },
  });

  const createRaspoMutation = useMutation({
    mutationFn: (data: typeof raspoForm) =>
      apiRequest("POST", "/api/coordination/rasporyazhenie", {
        to_user: data.to,
        task: data.task,
        deadline: data.deadline || undefined,
        priority: data.priority,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coordination/rasporyazhenie"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordination/stats"] });
      toast({ title: isRu ? "Распоряжение выдано" : "Распоряжение berildi" });
      setRaspoOpen(false);
      setRaspoForm({ to: "", task: "", deadline: "", priority: "medium" });
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "";
      toast({ title: isRu ? "Ошибка" : "Xatolik", description: msg, variant: "destructive" });
    },
  });

  const markDoneMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("PATCH", `/api/coordination/rasporyazhenie/${id}/done`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coordination/rasporyazhenie"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coordination/stats"] });
      toast({ title: isRu ? "Выполнено!" : "Bajarildi!" });
    },
  });

  function submitDokla() {
    if (!doklaForm.subject.trim()) {
      toast({ title: isRu ? "Тема обязательна" : "Mavzu kiritilishi shart", variant: "destructive" });
      return;
    }
    createDoklaMutation.mutate(doklaForm);
  }

  function submitRaspo() {
    if (!raspoForm.task.trim() || !raspoForm.to.trim()) {
      toast({ title: isRu ? "Заполните все поля" : "Barcha maydonlarni to'ldiring", variant: "destructive" });
      return;
    }
    createRaspoMutation.mutate(raspoForm);
  }

  const doklaCount = doklads.length;
  const raspoCount = rasporyazheniya.length;

  return (
    <div className="flex-1 overflow-auto bg-background p-5 space-y-6 pb-12">

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {isRu ? "Координация" : "Koordinatsiya"}{" "}
            <span className="text-primary">{isRu ? "Системы" : "Tizimi"}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? "5 советов · Доклад · Распоряжение · ШВБ методология" : "5 kengash · Доклад · Распоряжение · ШВБ metodologiyasi"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDoklaOpen(true)} data-testid="btn-create-dokla">
            <ArrowUp className="w-4 h-4 mr-1.5 text-blue-600" />
            {t("createDokla")}
          </Button>
          <Button onClick={() => setRaspoOpen(true)} data-testid="btn-create-raspo">
            <ArrowDown className="w-4 h-4 mr-1.5" />
            {t("createRasporyazhenie")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <div className="lg:col-span-2 space-y-5">

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                {t("councilSystem")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(Array.isArray(COUNCIL_LEVELS) ? COUNCIL_LEVELS : []).map((c) => {
                const Icon = c.icon;
                return (
                  <div
                    key={c.level}
                    className={cn("flex items-center gap-3 rounded-xl border-2 p-3.5 transition-shadow hover:shadow-sm", c.color)}
                    data-testid={`council-level-${c.level}`}
                  >
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/60 shrink-0">
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold opacity-60">{c.level}-daraja</span>
                        <p className="font-semibold text-sm">{t(c.key)}</p>
                      </div>
                      <p className="text-xs opacity-70 mt-0.5">{isRu ? c.descRu : c.desc}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={cn("text-[10px] font-bold text-white px-2 py-0.5 rounded-full", c.badgeColor)}>
                        {isRu ? c.freqRu : c.freq}
                      </span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <Card data-testid="card-doklads">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-blue-700">
                    <ArrowUp className="w-4 h-4" />
                    {t("dokla")}
                  </CardTitle>
                  <Badge variant="secondary" className="text-[10px]">{doklaCount}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{isRu ? "Снизу вверх ↑" : "Pastdan yuqoriga ↑"}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {doklaLoading && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>}
                {!doklaLoading && (Array.isArray(doklads) ? doklads : []).slice(0, 5).map((d) => (
                  <div key={d.id} className="flex items-start justify-between gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100 hover:bg-blue-100/60 transition-colors cursor-pointer">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{d.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{d.from_name || "—"} · {shortDate(d.created_at)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {statusBadge(d.status)}
                      <span className="text-[10px] text-muted-foreground">{d.council_level}-kengash</span>
                    </div>
                  </div>
                ))}
                {!doklaLoading && doklads.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">{isRu ? "Нет докладов" : "Докладлар yo'q"}</p>
                )}
                <Button variant="ghost" className="w-full text-sm text-blue-600" size="sm" onClick={() => setDoklaOpen(true)}>
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  {t("createDokla")}
                </Button>
              </CardContent>
            </Card>

            <Card data-testid="card-rasporyazheniya">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-orange-700">
                    <ArrowDown className="w-4 h-4" />
                    {t("rasporyazhenie")}
                  </CardTitle>
                  <Badge variant="secondary" className="text-[10px]">{raspoCount}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{isRu ? "Сверху вниз ↓" : "Yuqoridan pastga ↓"}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {raspoLoading && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>}
                {!raspoLoading && (Array.isArray(rasporyazheniya) ? rasporyazheniya : []).slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-start justify-between gap-2 p-3 rounded-lg bg-orange-50 border border-orange-100 hover:bg-orange-100/60 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{r.task}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{r.to_user} · {r.deadline ? shortDate(r.deadline) : "—"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {statusBadge(r.status)}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground flex items-center">
                          {priorityDot(r.priority)}{r.priority}
                        </span>
                        {r.status !== "done" && (
                          <button
                            className="text-[10px] text-emerald-600 hover:text-emerald-800 font-semibold ml-1"
                            onClick={() => markDoneMutation.mutate(r.id)}
                            title={isRu ? "Отметить выполненным" : "Bajarildi belgilash"}
                          >
                            ✓
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {!raspoLoading && rasporyazheniya.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">{isRu ? "Нет распоряжений" : "Распоряжения yo'q"}</p>
                )}
                <Button variant="ghost" className="w-full text-sm text-orange-600" size="sm" onClick={() => setRaspoOpen(true)}>
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  {t("createRasporyazhenie")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <Card data-testid="card-council-schedule">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                {t("councilSchedule")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {([
                { day: isRu ? "Вторник" : "Seshanba", event: "Рек.Совет · ЗВС", color: "border-l-emerald-400" },
                { day: isRu ? "Среда" : "Chorshanba", event: isRu ? "Финансовый план (ФП)" : "Moliyaviy reja (ФП)", color: "border-l-blue-400" },
                { day: isRu ? "Четверг" : "Payshanba", event: isRu ? "Банковские платежи" : "Bank to'lovlari", color: "border-l-amber-400" },
                { day: isRu ? "Пятница" : "Juma", event: isRu ? "Исполнительный Совет" : "Ijroiya Kengashi", color: "border-l-violet-400" },
                { day: isRu ? "Понедельник" : "Dushanba", event: isRu ? "Наличные платежи" : "Naqd to'lovlar", color: "border-l-rose-400" },
              ]).map((s, i) => (
                <div key={`k-${i}`} className={cn("pl-3 py-1.5 border-l-2 rounded-r", s.color)}>
                  <p className="text-xs font-semibold text-foreground">{s.day}</p>
                  <p className="text-xs text-muted-foreground">{s.event}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                {t("escalation")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...COUNCIL_LEVELS].reverse().map((c, i) => (
                  <div key={c.level} className="flex items-center gap-2 text-xs">
                    <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0", c.badgeColor)}>
                      {c.level}
                    </span>
                    <span className="text-foreground truncate">{t(c.key)}</span>
                    {i < COUNCIL_LEVELS.length - 1 && (
                      <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0 ml-auto" />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
                {isRu
                  ? "Если вопрос не решён на текущем уровне — передаётся на уровень выше."
                  : "Muammo joriy kengashda hal bo'lmasa — yuqori kengashga ko'tariladi."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                {isRu ? "Статистика за неделю" : "Haftalik statistika"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { label: isRu ? "Доклады" : "Докладлар",       val: Number(stats?.dokla?.total ?? doklads.length),                                    color: "text-blue-600"   },
                  { label: isRu ? "Распоряжения" : "Распоряжения", val: Number(stats?.rasporyazhenie?.total ?? rasporyazheniya.length),                  color: "text-orange-600" },
                  { label: isRu ? "Выполнено" : "Bajarildi",      val: Number(stats?.rasporyazhenie?.done ?? (Array.isArray(rasporyazheniya) ? rasporyazheniya : []).filter(r => r.status === "done").length),    color: "text-emerald-600" },
                  { label: isRu ? "В работе" : "Jarayonda",       val: Number(stats?.rasporyazhenie?.in_progress ?? (Array.isArray(rasporyazheniya) ? rasporyazheniya : []).filter(r => r.status === "in_progress").length), color: "text-amber-600" },
                ]).map((s, i) => (
                  <div key={`k-${i}`} className="rounded-lg bg-muted/40 p-3 text-center">
                    <p className={cn("text-2xl font-bold", s.color)}>{s.val}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={doklaOpen} onOpenChange={setDoklaOpen}>
        <DialogContent className="max-w-lg" data-testid="dialog-create-dokla">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-700">
              <ArrowUp className="w-4 h-4" />
              {t("createDokla")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>{isRu ? "Кому (уровень совета)" : "Kimga (kengash darajasi)"}</Label>
              <select
                className="w-full mt-1 border rounded-md px-3 py-2 text-sm"
                value={doklaForm.councilLevel}
                onChange={e => setDoklaForm(p => ({ ...p, councilLevel: e.target.value }))}
              >
                {(Array.isArray(COUNCIL_LEVELS) ? COUNCIL_LEVELS : []).map(c => (
                  <option key={c.level} value={String(c.level)}>{c.level}. {t(c.key)}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>{isRu ? "Тема Доклада" : "Доклад mavzusi"} *</Label>
              <Input
                className="mt-1"
                placeholder={isRu ? "Краткая тема..." : "Qisqa mavzu..."}
                value={doklaForm.subject}
                onChange={e => setDoklaForm(p => ({ ...p, subject: e.target.value }))}
              />
            </div>
            <div>
              <Label>{isRu ? "Описание проблемы" : "Muammo tavsifi"}</Label>
              <Textarea
                className="mt-1"
                rows={2}
                placeholder={isRu ? "Что произошло?" : "Nima yuz berdi?"}
                value={doklaForm.problem}
                onChange={e => setDoklaForm(p => ({ ...p, problem: e.target.value }))}
              />
            </div>
            <div>
              <Label>{isRu ? "Достигнутый результат" : "Erishilgan natija"}</Label>
              <Textarea
                className="mt-1"
                rows={2}
                placeholder={isRu ? "Что сделано?" : "Nima qilindi?"}
                value={doklaForm.result}
                onChange={e => setDoklaForm(p => ({ ...p, result: e.target.value }))}
              />
            </div>
            <div>
              <Label>{isRu ? "Предложение / Запрос" : "Taklif / So'rov"}</Label>
              <Textarea
                className="mt-1"
                rows={2}
                placeholder={isRu ? "Что нужно решить?" : "Nima hal qilinishi kerak?"}
                value={doklaForm.proposal}
                onChange={e => setDoklaForm(p => ({ ...p, proposal: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDoklaOpen(false)}>{isRu ? "Отмена" : "Bekor qilish"}</Button>
            <Button onClick={submitDokla} disabled={createDoklaMutation.isPending} data-testid="btn-submit-dokla">
              {createDoklaMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <ArrowUp className="w-3.5 h-3.5 mr-1.5" />}
              {t("createDokla")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={raspoOpen} onOpenChange={setRaspoOpen}>
        <DialogContent className="max-w-lg" data-testid="dialog-create-raspo">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-700">
              <ArrowDown className="w-4 h-4" />
              {t("createRasporyazhenie")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>{isRu ? "Кому" : "Kimga"} *</Label>
              <Input
                className="mt-1"
                placeholder={isRu ? "ФИО исполнителя..." : "Ijrochi ismi..."}
                value={raspoForm.to}
                onChange={e => setRaspoForm(p => ({ ...p, to: e.target.value }))}
              />
            </div>
            <div>
              <Label>{isRu ? "Задание" : "Vazifa"} *</Label>
              <Textarea
                className="mt-1"
                rows={3}
                placeholder={isRu ? "Чёткое, конкретное задание..." : "Aniq, muayyan topshiriq..."}
                value={raspoForm.task}
                onChange={e => setRaspoForm(p => ({ ...p, task: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{isRu ? "Срок выполнения" : "Muddat"}</Label>
                <Input
                  type="date"
                  className="mt-1"
                  value={raspoForm.deadline}
                  onChange={e => setRaspoForm(p => ({ ...p, deadline: e.target.value }))}
                />
              </div>
              <div>
                <Label>{isRu ? "Приоритет" : "Ustuvorlik"}</Label>
                <select
                  className="w-full mt-1 border rounded-md px-3 py-2 text-sm"
                  value={raspoForm.priority}
                  onChange={e => setRaspoForm(p => ({ ...p, priority: e.target.value }))}
                >
                  <option value="high">{isRu ? "Высокий" : "Yuqori"}</option>
                  <option value="medium">{isRu ? "Средний" : "O'rta"}</option>
                  <option value="low">{isRu ? "Низкий" : "Past"}</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRaspoOpen(false)}>{isRu ? "Отмена" : "Bekor qilish"}</Button>
            <Button onClick={submitRaspo} disabled={createRaspoMutation.isPending} className="bg-orange-500 hover:bg-orange-600" data-testid="btn-submit-raspo">
              {createRaspoMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <ArrowDown className="w-3.5 h-3.5 mr-1.5" />}
              {t("createRasporyazhenie")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
