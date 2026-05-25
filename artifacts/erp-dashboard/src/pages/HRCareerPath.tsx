/**
 * @module HRCareerPath
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  TrendingUp, Plus, Search, CheckCircle2, Clock, XCircle, Star, LayoutGrid, List,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface CareerPlan {
  id: string;
  employee_name?: string;
  target_position_title?: string;
  current_position_title?: string;
  status?: string;
  target_date?: string;
  progress_percent?: number;
  mentor_name?: string;
  notes?: string;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active:    { label: "Faol",           variant: "secondary"   },
  completed: { label: "Bajarilgan",     variant: "default"     },
  on_hold:   { label: "To'xtatilgan",   variant: "outline"     },
  cancelled: { label: "Bekor",          variant: "destructive" },
};

function PlanCard({ plan }: { plan: CareerPlan }) {
  const { t } = useTranslation("common");
  const st = STATUS_MAP[plan.status || "active"] || STATUS_MAP.active;
  const pct = plan.progress_percent ?? 0;
  const daysLeft = plan.target_date
    ? Math.ceil((new Date(plan.target_date).getTime() - Date.now()) / 86400000)
    : null;
  const overdue = daysLeft !== null && daysLeft < 0;
  const soon = daysLeft !== null && daysLeft >= 0 && daysLeft < 30;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="py-4 px-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm truncate flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-[var(--ep-yellow)] shrink-0" />
              {plan.employee_name || "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {plan.current_position_title || "—"}
              <span className="mx-1">→</span>
              <span className="text-foreground font-medium">{plan.target_position_title || "—"}</span>
            </div>
          </div>
          <Badge variant={st.variant} className="text-xs shrink-0">{st.label}</Badge>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("taraqqiyot")}</span>
            <span className="font-medium text-foreground">{pct}%</span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
          {plan.mentor_name
            ? <span>{t("mentor1")}<span className="text-foreground">{plan.mentor_name}</span></span>
            : <span>{t("mentorTayinlanmagan")}</span>}
          {daysLeft !== null ? (
            <span className={overdue ? "text-[var(--ep-red)] font-medium" : soon ? "text-[var(--ep-primary)] font-medium" : ""}>
              {overdue
                ? `${Math.abs(daysLeft)} kun kechikdi`
                : daysLeft === 0 ? "Bugun muddati"
                : `${daysLeft} kun qoldi`}
            </span>
          ) : (
            <span>{t("muddatYoq")}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function NewPlanDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    employeeName: "", currentPosition: "", targetPosition: "", targetDate: "", mentorName: "", notes: "",
  });

  const create = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/succession/career-plans", {
        employee_name: form.employeeName,
        current_position_title: form.currentPosition,
        target_position_title: form.targetPosition,
        target_date: form.targetDate || null,
        mentor_name: form.mentorName || null,
        notes: form.notes || null,
        status: "active",
        progress_percent: 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/succession/career-plans"] });
      toast({ title: "Yangi kasbiy reja yaratildi" });
      setForm({ employeeName: "", currentPosition: "", targetPosition: "", targetDate: "", mentorName: "", notes: "" });
      onClose();
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader><DialogTitle className="text-[18px] font-semibold">{t("yangiKasbiyRivojlanishRejasi")}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <Label>{t("xodimIsmi1")}</Label>
            <Input value={form.employeeName} onChange={e => f("employeeName", e.target.value)} placeholder={t("toliqIsmi")} className="mt-1" />
          </div>
          <div>
            <Label>{t("joriyLavozim")}</Label>
            <Input value={form.currentPosition} onChange={e => f("currentPosition", e.target.value)} placeholder={t("hozirgiLavozim")} className="mt-1" />
          </div>
          <div>
            <Label>{t("maqsadLavozim")}</Label>
            <Input value={form.targetPosition} onChange={e => f("targetPosition", e.target.value)} placeholder={t("erishmochiBolganLavozim")} className="mt-1" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>{t("muddat")}</Label>
              <Input type="date" value={form.targetDate} onChange={e => f("targetDate", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>{t("mentor")}</Label>
              <Input value={form.mentorName} onChange={e => f("mentorName", e.target.value)} placeholder={t("mentorIsmi")} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>{t("Izoh")}</Label>
            <Input value={form.notes} onChange={e => f("notes", e.target.value)} placeholder={t("qoshimchaMalumot1")} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("Bekor")}</Button>
          <Button
            onClick={() => create.mutate()}
            disabled={!form.employeeName || !form.targetPosition || create.isPending}
          >
            {create.isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function HRCareerPath() {
  const { t } = useTranslation("common");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);

  const { data: rawPlans = [], isLoading } = useQuery<CareerPlan[]>({
    queryKey: ["/api/succession/career-plans"],
  });

  const all = rawPlans as CareerPlan[];

  const filtered = all
    .filter(p => statusFilter === "all" || p.status === statusFilter)
    .filter(p =>
      !search ||
      (p.employee_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.target_position_title || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.current_position_title || "").toLowerCase().includes(search.toLowerCase())
    );

  const counts = {
    total: all.length,
    active: (Array.isArray(all) ? all : []).filter(p => p.status === "active").length,
    completed: (Array.isArray(all) ? all : []).filter(p => p.status === "completed").length,
    onHold: (Array.isArray(all) ? all : []).filter(p => p.status === "on_hold").length,
  };
  const avgProgress = all.length
    ? Math.round((Array.isArray(all) ? all : []).reduce((s, p) => s + (p.progress_percent ?? 0), 0) / all.length)
    : 0;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="border-b border-border/50 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-4 w-4 text-[var(--ep-blue)]" />
          <h1 className="font-semibold text-base">{t("hrKasbiyOsish")}</h1>
          <EPStatusPill tone="neutral">{counts.total} reja</EPStatusPill>
        </div>
        <Button size="sm" onClick={() => setNewOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />{t("yangiReja")}
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {([
            { label: "Jami rejalar",        value: counts.total,     color: "text-[var(--ep-blue)]" },
            { label: "Faol",                value: counts.active,    color: "text-[var(--ep-green)]" },
            { label: "Bajarilgan",          value: counts.completed, color: "text-[var(--ep-purple)]" },
            { label: "O'rtacha taraqqiyot", value: `${avgProgress}%`, color: "text-[var(--ep-yellow)]" },
          ]).map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={t("xodimYokiLavozimQidiring")}
              className="pl-8 h-9 text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px] h-9 text-sm">
              <SelectValue placeholder={t("status28")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("barchaHolatlar")}</SelectItem>
              <SelectItem value="active">{t("active")}</SelectItem>
              <SelectItem value="completed">{t("bajarilgan")}</SelectItem>
              <SelectItem value="on_hold">{t("paused")}</SelectItem>
              <SelectItem value="cancelled">{t("Bekor")}</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border rounded-md overflow-hidden h-8">
            <button
              onClick={() => setView("cards")}
              className={`px-2.5 flex items-center gap-1 text-xs transition-colors ${view === "cards" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setView("table")}
              className={`px-2.5 flex items-center gap-1 text-xs transition-colors ${view === "table" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
          {filtered.length !== all.length && (
            <span className="text-xs text-muted-foreground">{filtered.length} ta topildi</span>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <TrendingUp className="h-12 w-12 opacity-20" />
            <p className="text-sm font-medium">
              {all.length === 0 ? "Hali kasbiy rivojlanish rejalari yo'q" : "Mos reja topilmadi"}
            </p>
            {all.length === 0 && (
              <Button size="sm" variant="outline" onClick={() => setNewOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />{t("birinchiRejaYarating")}
              </Button>
            )}
          </div>
        ) : view === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Array.isArray(filtered) ? filtered : []).map(p => <PlanCard key={p.id} plan={p} />)}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="ep-table-scroll"><Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>{t("xodim1")}</TableHead>
                    <TableHead>{t("joriyLavozim")}</TableHead>
                    <TableHead>{t("Maqsad")}</TableHead>
                    <TableHead>{t("taraqqiyot")}</TableHead>
                    <TableHead>{t("mentor")}</TableHead>
                    <TableHead>{t("muddat")}</TableHead>
                    <TableHead>{t("status28")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(filtered) ? filtered : []).map(plan => {
                    const st = STATUS_MAP[plan.status || "active"] || STATUS_MAP.active;
                    const pct = plan.progress_percent ?? 0;
                    return (
                      <TableRow key={plan.id} data-testid={`row-career-plan-${plan.id}`} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-medium">{plan.employee_name || "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{plan.current_position_title || "—"}</TableCell>
                        <TableCell className="text-sm">{plan.target_position_title || "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-[100px]">
                            <Progress value={pct} className="h-1.5 flex-1" />
                            <span className="text-xs text-muted-foreground w-8 shrink-0">{pct}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{plan.mentor_name || "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {plan.target_date ? new Date(plan.target_date).toLocaleDateString("uz-UZ") : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table></div>
            </CardContent>
          </Card>
        )}
      </div>

      <NewPlanDialog open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
}
