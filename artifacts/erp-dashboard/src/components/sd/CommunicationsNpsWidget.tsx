/**
 * @module CommunicationsNpsWidget
 * @description NPS score card + "Add NPS" dialog for CommunicationsTab.
 * Split from CommunicationsTab.tsx (Rule 16).
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, ThumbsUp, ThumbsDown, TrendingUp, Plus } from "lucide-react";
import { fmtDate } from "./helpers";
import { useTranslation } from '@/lib/i18n';
import type { SdNpsData } from "./sd-types";

interface Props {
  customerId: number;
  nps?: SdNpsData;
}

export function CommunicationsNpsWidget({ customerId, nps }: Props) {
  const { t } = useTranslation("common");
  const [npsOpen, setNpsOpen] = useState(false);
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [npsComment, setNpsComment] = useState("");
  const qc = useQueryClient();

  const npsConf = nps?.score !== null && nps?.score !== undefined ? (
    nps.score >= 50
      ? { cls: "text-[var(--ep-green)]", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800", label: "Ajoyib" }
      : nps.score >= 0
      ? { cls: "text-[var(--ep-blue)]", bg: "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800", label: "Yaxshi" }
      : { cls: "text-[var(--ep-red)]", bg: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800", label: "Yaxshilanish kerak" }
  ) : null;

  const addNpsMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/sd/customers/${customerId}/nps`, {
      score: npsScore,
      comment: npsComment || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/customers", customerId, "360"] });
      setNpsOpen(false);
      setNpsScore(null);
      setNpsComment("");
    },
  });

  const getNpsButtonCls = (s: number) => s === npsScore ? "ring-2 ring-offset-1 " : "";
  const getNpsColor = (s: number) =>
    s <= 6 ? "bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-200"
    : s <= 8 ? "bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-200"
    : "bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-200";

  return (
    <>
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
                      <ThumbsUp className="h-3.5 w-3.5" />{nps.promoters} Promoter
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <TrendingUp className="h-3.5 w-3.5" />
                      {(nps.responses || 0) - nps.promoters - nps.detractors} Passiv
                    </span>
                    <span className="flex items-center gap-1 text-[var(--ep-red)]">
                      <ThumbsDown className="h-3.5 w-3.5" />{nps.detractors} Detractor
                    </span>
                  </div>
                  {nps.responses > 0 && (
                    <div className="flex gap-1 items-center text-xs text-muted-foreground">
                      Jami {nps.responses} ta javob · O'rtacha ball: {nps.avgScore ?? "—"}
                    </div>
                  )}
                </div>
              </div>
              {nps.responses > 0 && (
                <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                  <div className="bg-emerald-500" style={{ width: `${(nps.promoters / nps.responses) * 100}%` }} />
                  <div className="bg-amber-400" style={{ width: `${((nps.responses - nps.promoters - nps.detractors) / nps.responses) * 100}%` }} />
                  <div className="bg-rose-500" style={{ width: `${(nps.detractors / nps.responses) * 100}%` }} />
                </div>
              )}
              {(nps.recentResponses || []).length > 0 && (
                <div className="space-y-1.5">
                  {nps.recentResponses.slice(0, 3).map((r) => {
                    const scoreCls = Number(r.score) >= 9
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200"
                      : Number(r.score) >= 7
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200"
                      : "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200";
                    return (
                      <div key={r.id} className="flex items-start gap-2.5 text-sm">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${scoreCls}`}>{r.score}</span>
                        <span className="text-muted-foreground text-xs flex-1">
                          {r.comment || <span className="italic opacity-60">{t("izohYoq")}</span>}
                        </span>
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

      <Dialog open={npsOpen} onOpenChange={setNpsOpen}>
        <DialogContent className="max-w-sm p-6">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("npsBaholashQoshish")}</DialogTitle>
          </DialogHeader>
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
              <p className="text-sm font-medium mb-1">{t("izohIxtiyoriy")}</p>
              <Textarea value={npsComment} onChange={e => setNpsComment(e.target.value)} rows={2} placeholder={t("mijozIzohi")} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNpsOpen(false)}>{t("Bekor")}</Button>
              <Button disabled={npsScore === null || addNpsMutation.isPending} onClick={() => addNpsMutation.mutate()}>
                {t("Saqlash")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
