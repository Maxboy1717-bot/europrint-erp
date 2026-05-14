/**
 * @module CommunicationsTab
 * @description React UI component.
 */

import { SdCommunicationsData, SdNpsData } from "./sd-types";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Phone, Mail, Users, FileText, MessageSquare, Plus, Clock, Calendar,
  Smile, Meh, Frown, Star, ThumbsUp, ThumbsDown, TrendingUp,
} from "lucide-react";
import { fmtDate } from "./helpers";
import { useTranslation } from '@/lib/i18n';

interface SentimentData {
  score: number;
  label: string;
  analyzedInteractions: number;
  totalInteractions: number;
}

export function CommunicationsTab({
  customerId, communications, sentiment, nps,
}: {
  customerId: number;
  communications: SdCommunicationsData;
  sentiment?: SentimentData;
  nps?: SdNpsData;
}) {
  const { t } = useTranslation("common");
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [npsOpen, setNpsOpen] = useState(false);
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [npsComment, setNpsComment] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const commSchema = z.object({
    type: z.enum(["call", "email", "meeting", "note", "chat"]),
    direction: z.enum(["in", "out"]).default("out"),
    subject: z.string().min(1, "Mavzu kerak"),
    description: z.string().optional(),
    outcome: z.string().optional(),
    nextAction: z.string().optional(),
  });
  const form = useForm<z.infer<typeof commSchema>>({
    resolver: zodResolver(commSchema),
    defaultValues: { type: "call" as const, direction: "out" as const, subject: "" },
  });

  const addMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", `/api/sd/customers/${customerId}/interactions`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/customers", customerId, "360"] });
      toast({ title: "Aloqa qo'shildi" });
      setOpen(false);
      form.reset();
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const addNpsMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/sd/customers/${customerId}/nps`, { score: npsScore, comment: npsComment || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/customers", customerId, "360"] });
      toast({ title: "NPS baholash qo'shildi" });
      setNpsOpen(false);
      setNpsScore(null);
      setNpsComment("");
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const typeIcon: Record<string, React.ComponentType<{ className?: string }>> = {
    call: Phone, email: Mail, meeting: Users, note: FileText, chat: MessageSquare,
  };
  const typeLabel: Record<string, string> = {
    call: "Qo'ng'iroq", email: "Email", meeting: "Uchrashuv", note: "Izoh", chat: "Chat",
  };
  const typeColor: Record<string, string> = {
    call: "bg-sky-100 text-[var(--ep-blue)] dark:bg-sky-900/40 dark:text-sky-300",
    email: "bg-violet-100 text-[var(--ep-purple)] dark:bg-violet-900/40 dark:text-violet-300",
    meeting: "bg-emerald-100 text-[var(--ep-green)] dark:bg-emerald-900/40 dark:text-emerald-300",
    note: "bg-amber-100 text-[var(--ep-yellow)] dark:bg-amber-900/40 dark:text-amber-300",
    chat: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  };

  const items = communications?.recent || (Array.isArray(communications) ? communications : []);
  const filtered = filter === "all" ? items : (Array.isArray(items) ? items : []).filter((i) => i.type === filter);
  const upcoming = communications?.upcomingTasks || [];

  // Sentiment config
  const sentConf = sentiment ? {
    positive: { Icon: Smile, label: "Ijobiy kayfiyat", cls: "text-[var(--ep-green)]", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" },
    neutral:  { Icon: Meh,   label: "Neytral kayfiyat", cls: "text-[var(--ep-blue)]", bg: "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800" },
    negative: { Icon: Frown, label: "Salbiy kayfiyat",  cls: "text-[var(--ep-red)]", bg: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800" },
  }[sentiment.label as "positive"|"neutral"|"negative"] || { Icon: Meh, label: sentiment.label, cls: "text-muted-foreground", bg: "bg-muted/30 border-border" } : null;

  // NPS config
  const npsConf = nps?.score !== null && nps?.score !== undefined ? (
    nps.score >= 50 ? { cls: "text-[var(--ep-green)]", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800", label: "Ajoyib" }
    : nps.score >= 0  ? { cls: "text-[var(--ep-blue)]", bg: "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800", label: "Yaxshi" }
    : { cls: "text-[var(--ep-red)]", bg: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800", label: "Yaxshilanish kerak" }
  ) : null;

  // NPS score button color
  const getNpsButtonCls = (s: number) => {
    if (s === npsScore) return "ring-2 ring-offset-1 ";
    return "";
  };
  const getNpsColor = (s: number) =>
    s <= 6 ? "bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-200"
    : s <= 8 ? "bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-200"
    : "bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-200";

  return (
    <div className="space-y-4">
      {/* NPS Widget */}
      {(nps || true) && (
        <div className={`rounded-xl border overflow-hidden ${npsConf ? npsConf.bg : "bg-muted/20 border-border"}`}>
          <div className="px-4 py-3 border-b border-inherit">
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-semibold flex items-center gap-2 ${npsConf ? npsConf.cls : "text-muted-foreground"}`}>
                <Star className="h-4 w-4" />NPS (Net Promoter Score)
              </h3>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setNpsOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />{t("npsQoshish")}
              </Button>
            </div>
          </div>
          <div className="p-4">
            {nps && nps.responses > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className={`text-4xl font-black ${npsConf?.cls}`}>
                    {nps.score !== null ? `${nps.score >= 0 ? "+" : ""}${nps.score}` : "—"}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="text-xs text-muted-foreground">{npsConf?.label}</div>
                    <div className="flex gap-3 text-xs">
                      <span className="flex items-center gap-1 text-[var(--ep-green)]">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        {nps.promoters} Promoter
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {(nps.responses || 0) - nps.promoters - nps.detractors} Passiv
                      </span>
                      <span className="flex items-center gap-1 text-[var(--ep-red)]">
                        <ThumbsDown className="h-3.5 w-3.5" />
                        {nps.detractors} Detractor
                      </span>
                    </div>
                    {nps.responses > 0 && (
                      <div className="flex gap-1 items-center text-xs text-muted-foreground">
                        Jami {nps.responses} ta javob · O'rtacha ball: {nps.avgScore ?? "—"}
                      </div>
                    )}
                  </div>
                </div>
                {/* Promoter / detractor bar */}
                {nps.responses > 0 && (
                  <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                    <div className="bg-emerald-500" style={{ width: `${(nps.promoters / nps.responses) * 100}%` }} />
                    <div className="bg-amber-400" style={{ width: `${((nps.responses - nps.promoters - nps.detractors) / nps.responses) * 100}%` }} />
                    <div className="bg-rose-500" style={{ width: `${(nps.detractors / nps.responses) * 100}%` }} />
                  </div>
                )}
                {/* Recent NPS responses */}
                {(nps.recentResponses || []).length > 0 && (
                  <div className="space-y-1.5">
                    {nps.recentResponses.slice(0, 3).map((r) => {
                      const scoreCls = Number(r.score) >= 9 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200"
                        : Number(r.score) >= 7 ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200";
                      return (
                        <div key={r.id} className="flex items-start gap-2.5 text-sm">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${scoreCls}`}>{r.score}</span>
                          <span className="text-muted-foreground text-xs flex-1">{r.comment || <span className="italic opacity-60">{t("izohYoq")}</span>}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">{fmtDate(r.createdAt)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("haliNpsBaholashYoq")}</p>
            )}
          </div>
        </div>
      )}

      {/* NPS Add Dialog */}
      <Dialog open={npsOpen} onOpenChange={setNpsOpen}>
        <DialogContent className="max-w-sm p-6">
          <DialogHeader><DialogTitle className="text-[18px] font-semibold">{t("npsBaholashQoshish")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">{t("mijozSifatini010Ball")}</p>
              <div className="grid grid-cols-11 gap-1">
                {[0,1,2,3,4,5,6,7,8,9,10].map(s => (
                  <button key={s} type="button"
                    onClick={() => setNpsScore(s)}
                    className={`aspect-square rounded-md text-sm font-bold border transition-all ${getNpsButtonCls(s)} ${getNpsColor(s)} ${npsScore === s ? "ring-2 ring-offset-1 ring-current scale-110" : ""}`}>
                    {s}
                  </button>
                ))}
              </div>
              {npsScore !== null && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {npsScore >= 9 ? "🌟 Promoter — Juda mamnun" : npsScore >= 7 ? "😐 Passiv — Qoniqarli" : "😟 Detractor — Norozi"}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Izoh (ixtiyoriy)</p>
              <Textarea value={npsComment} onChange={e => setNpsComment(e.target.value)} rows={2} placeholder={t("mijozIzohi")} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNpsOpen(false)}>{t("Bekor")}</Button>
              <Button
                disabled={npsScore === null || addNpsMutation.isPending}
                onClick={() => addNpsMutation.mutate()}>
                {t("Saqlash")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sentiment indicator */}
      {sentiment && sentConf && (
        <div className={`rounded-xl border ${sentConf.bg} p-4`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/60 dark:bg-black/20 ${sentConf.cls}`}>
              <sentConf.Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className={`font-semibold ${sentConf.cls}`}>{sentConf.label}</p>
              <p className="text-xs text-muted-foreground">
                {sentiment.analyzedInteractions} ta muloqot tahlil qilindi (jami {sentiment.totalInteractions} tadan)
              </p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-black ${sentConf.cls}`}>
                {sentiment.score >= 0 ? "+" : ""}{Math.round(sentiment.score * 100)}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("sentiment")}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {["all", "call", "email", "meeting", "note"].map(t => (
            <button key={t}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all
                ${filter === t
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card hover:bg-muted border-border text-muted-foreground hover:text-foreground"}`}
              onClick={() => setFilter(t)}
              data-testid={`btn-filter-${t}`}>
              {t === "all" ? "Barchasi" : typeLabel[t]}
            </button>
          ))}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary text-white border-0"
              data-testid="btn-add-interaction">
              <Plus className="h-4 w-4 mr-1" />{t("yangiAloqa")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="text-[18px] font-semibold">{t("yangiMuloqot")}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(d => addMutation.mutate(d))} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem><FormLabel>{t("tur")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger data-testid="select-interaction-type" className="h-9"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {Object.entries(typeLabel).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                        </SelectContent>
                      </Select></FormItem>
                  )} />
                  <FormField control={form.control} name="direction" render={({ field }) => (
                    <FormItem><FormLabel>{t("yonalish")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="out">{t("chiquvchi")}</SelectItem>
                          <SelectItem value="in">{t("kiruvchi")}</SelectItem>
                        </SelectContent>
                      </Select></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="subject" render={({ field }) => (
                  <FormItem><FormLabel>{t("mavzu1")}</FormLabel>
                    <FormControl><Input {...field} data-testid="input-subject" /></FormControl>
                    <FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>{t("tafsilot")}</FormLabel>
                    <FormControl><Textarea {...field} rows={3} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="nextAction" render={({ field }) => (
                  <FormItem><FormLabel>{t("keyingiQadam")}</FormLabel>
                    <FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" type="button" onClick={() => setOpen(false)}>{t("Bekor")}</Button>
                  <Button type="submit" disabled={addMutation.isPending}>{t("Saqlash")}</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming tasks */}
      {upcoming.length > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 overflow-hidden">
          <div className="px-4 py-3 border-b border-amber-200 dark:border-amber-800">
            <h3 className="text-sm font-semibold text-[var(--ep-yellow)] dark:text-amber-400 flex items-center gap-2">
              <Clock className="h-4 w-4" />{t("yaqinlashayotganAmallar")}
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {upcoming.map((t) => (
              <div key={t.id} className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-[var(--ep-yellow)] dark:text-amber-400 shrink-0" />
                <span className="flex-1">{t.next_action}</span>
                <span className="text-xs text-muted-foreground shrink-0">{fmtDate(t.next_action_date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-xl border bg-card py-10 text-center text-muted-foreground text-sm">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
            {t("muloqotTarixiYoq")}
          </div>
        ) : filtered.map((item) => {
          const Icon = typeIcon[item.type] || MessageSquare;
          const color = typeColor[item.type] || typeColor.note;
          return (
            <div key={item.id} className="rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{item.subject || item.notes || "Muloqot"}</span>
                    <Badge variant="outline" className="text-[10px]">{typeLabel[item.type] || item.type}</Badge>
                    {item.direction && (
                      <Badge variant="outline" className="text-[10px]">
                        {item.direction === "in" ? "Kiruvchi" : "Chiquvchi"}
                      </Badge>
                    )}
                  </div>
                  {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                  {item.notes && item.notes !== item.subject && <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>}
                  {item.employeeName && item.employeeName.trim() && (
                    <p className="text-[11px] text-muted-foreground mt-1">Xodim: {item.employeeName}</p>
                  )}
                  {item.outcome && (
                    <p className="text-xs mt-1"><span className="text-muted-foreground">{t("natija1")}</span>{item.outcome}</p>
                  )}
                  {item.next_action && (
                    <p className="text-xs mt-1.5 text-[var(--ep-yellow)] dark:text-amber-400">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Keyingi: {item.next_action} — {fmtDate(item.next_action_date)}
                    </p>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {fmtDate(item.interaction_date || item.interactionDate || item.createdAt || item.created_at)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
