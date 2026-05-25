/**
 * @module MicroLearningTab
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Play, Video, RefreshCw, Zap } from "lucide-react";
import { useTranslation } from '@/lib/i18n';

export function MicroLearningTab() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [showMicroDialog, setShowMicroDialog] = useState(false);
  const [microForm, setMicroForm] = useState({ title: "", durationMinutes: "3", contentType: "video", telegramMessage: "", category: "" });

  const { data: microModules = [], isLoading: microLoading, refetch: refetchMicro } = useQuery<Record<string, unknown>[]>({
    queryKey: ["/api/micro-modules"],
  });

  const createMicro = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/micro-modules", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/micro-modules"] });
      setShowMicroDialog(false);
      setMicroForm({ title: "", durationMinutes: "3", contentType: "video", telegramMessage: "", category: "" });
      toast({ title: "Micro-modul yaratildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const viewMicro = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/micro-modules/${id}/view`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/micro-modules"] }),
  });

  const stats = [
    { l: "Jami micro-modullar", v: microModules.length, c: "text-primary" },
    { l: "Umumiy ko'rishlar", v: (Array.isArray(microModules) ? microModules : []).reduce((s: number, m: Record<string, unknown>) => s + Number(m.views ?? 0), 0), c: "text-[var(--ep-blue)]" },
    { l: "O'rtacha davomiylik", v: microModules.length > 0 ? `${Math.round((Array.isArray(microModules) ? microModules : []).reduce((s: number, m: Record<string, unknown>) => s + Number(m.duration_minutes ?? 3), 0) / microModules.length)} min` : "—", c: "text-[var(--ep-green)]" },
    { l: "Telegram yuborish", v: (Array.isArray(microModules) ? microModules : []).filter((m: Record<string, unknown>) => m.telegram_message).length + " ta", c: "text-[var(--ep-purple)]" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold">{t("microLearningModullar")}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetchMicro()}><RefreshCw className="h-3.5 w-3.5 mr-1.5" />{t("refresh")}</Button>
          <Button size="sm" onClick={() => setShowMicroDialog(true)} data-testid="button-add-micro"><Plus className="h-4 w-4 mr-2" />{t("modulQoshish1")}</Button>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(Array.isArray(stats) ? stats : []).map(s => (
          <Card key={s.l}><CardContent className="pt-4 pb-3">
            <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
          </CardContent></Card>
        ))}
      </div>
      {microLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{([1,2,3,4]).map(i => <Card key={`k-${i}`}><CardContent className="pt-3 pb-3 h-16" /></Card>)}</div>
      ) : microModules.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          <Zap className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>{t("haliMicroModullarYoqYangi")}</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(Array.isArray(microModules) ? microModules : []).map((m: Record<string, unknown>, i: number) => (
            <Card key={String(m.id ?? i)} data-testid={`card-micro-${String(m.id ?? i)}`}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0"><Video className="h-4 w-4 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{String(m.title ?? "")}</div>
                    <div className="flex gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">{Number(m.duration_minutes ?? 3)} min</span>
                      <span className="text-xs text-muted-foreground">{Number(m.views ?? 0)} ko'rish</span>
                      {!!m.category && <Badge variant="outline" className="text-xs h-4">{String(m.category)}</Badge>}
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" data-testid={`button-play-micro-${i}`} onClick={() => viewMicro.mutate(String(m.id))}><Play className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={showMicroDialog} onOpenChange={setShowMicroDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-[18px] font-semibold">{t("yangiMicroModul")}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div><Label>{t("progress.title")}</Label><Input data-testid="input-micro-title" value={microForm.title} onChange={e => setMicroForm(f => ({ ...f, title: e.target.value }))} placeholder={t("modulNomi")} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>{t("davomiyligiMin")}</Label><Input data-testid="input-micro-duration" type="number" value={microForm.durationMinutes} onChange={e => setMicroForm(f => ({ ...f, durationMinutes: e.target.value }))} /></div>
              <div><Label>{t("category")}</Label><Input data-testid="input-micro-category" value={microForm.category} onChange={e => setMicroForm(f => ({ ...f, category: e.target.value }))} placeholder={t("category")} /></div>
            </div>
            <div><Label>{t("telegramXabariIxtiyoriy")}</Label><Input data-testid="input-micro-telegram" value={microForm.telegramMessage} onChange={e => setMicroForm(f => ({ ...f, telegramMessage: e.target.value }))} placeholder={t("telegramUchunQisqaXabar")} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMicroDialog(false)}>{t("Bekor")}</Button>
            <Button data-testid="button-submit-micro" disabled={!microForm.title || createMicro.isPending} onClick={() => createMicro.mutate({ ...microForm, durationMinutes: Number(microForm.durationMinutes) })}>{t("Saqlash")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
