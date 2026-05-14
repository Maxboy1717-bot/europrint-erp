/**
 * @module PIPPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

import { useTranslation } from '@/lib/i18n';
const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground", active: "bg-blue-700", completed: "bg-green-700"
};
const STATUS_LABELS: Record<string, string> = {
  draft: "Qoralama", active: "Faol", completed: "Yakunlandi"
};
const RESULT_COLORS: Record<string, string> = { PASSED: "bg-green-700", FAILED: "bg-red-700" };

interface PipItem { id: number; first_name: string; last_name: string; duration_days: number; start_date: string; end_date: string; status: string; latest_progress: string | null; result: string | null }
interface PipProgress { progress_percent: number; created_at: string }

export default function PIPPage() {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const currentUserId = user?.employeeId ?? user?.id ?? 0;
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPip, setSelectedPip] = useState<PipItem | null>(null);
  const [form, setForm] = useState({ employee_id: "", created_by: String(currentUserId), supervisor_id: "", duration_days: "30", start_date: new Date().toISOString().split("T")[0], goals: "", success_criteria: "" });
  const [progressForm, setProgressForm] = useState({ progress_percent: "0", notes: "" });

  const { data: pips, isLoading } = useQuery<PipItem[]>({
    queryKey: ["/api/hr-v2/pip"],
    queryFn: () => apiRequest("GET", "/api/hr-v2/pip"),
  });

  const { data: pipDetail } = useQuery<{ pip?: PipItem & { goals?: string; success_criteria?: string }; progress?: PipProgress[] }>({
    queryKey: ["/api/hr-v2/pip", selectedPip?.id],
    queryFn: () => apiRequest("GET", `/api/hr-v2/pip/${selectedPip?.id}`),
    enabled: !!selectedPip?.id,
  });

  const create = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/hr-v2/pip", data),
    onSuccess: () => {
      toast({ title: "✅ PIP yaratildi" });
      setShowCreate(false);
      setForm({ employee_id: "", created_by: String(currentUserId), supervisor_id: "", duration_days: "30", start_date: new Date().toISOString().split("T")[0], goals: "", success_criteria: "" });
      qc.invalidateQueries({ queryKey: ["/api/hr-v2/pip"] });
    },
  });

  const acknowledge = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/hr-v2/pip/${id}/acknowledge`, {}),
    onSuccess: () => { toast({ title: "✅ Tasdiqlandi" }); qc.invalidateQueries({ queryKey: ["/api/hr-v2/pip"] }); },
  });

  const addProgress = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => apiRequest("POST", `/api/hr-v2/pip/${id}/progress`, { ...data, updated_by: currentUserId }),
    onSuccess: () => {
      toast({ title: "✅ Progress yangilandi" });
      qc.invalidateQueries({ queryKey: ["/api/hr-v2/pip", selectedPip?.id] });
    },
  });

  const complete = useMutation({
    mutationFn: ({ id, result }: { id: number; result: string }) => apiRequest("PATCH", `/api/hr-v2/pip/${id}/complete`, { result }),
    onSuccess: () => { toast({ title: "✅ PIP yakunlandi" }); qc.invalidateQueries({ queryKey: ["/api/hr-v2/pip"] }); },
  });

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("pipSamaradorlikniYaxshilashRejasi")}</h1>
          <p className="text-muted-foreground text-sm mt-1">Performance Improvement Plans — 30/60/90 kunlik rejalar</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="bg-primary hover:bg-primary/90 text-white">
          {t("yangiPip")}
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card className="bg-card border-primary max-w-2xl">
          <CardHeader><CardTitle className="text-foreground">{t("yangiPipYaratish")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">{t("xodimId2")}</Label>
                <Input value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}
                  placeholder={t("xodimId")} className="bg-input border-border mt-1" />
              </div>
              <div>
                <Label className="text-muted-foreground">{t("nazoratchiId")}</Label>
                <Input value={form.supervisor_id} onChange={e => setForm(f => ({ ...f, supervisor_id: e.target.value }))}
                  placeholder={t('supervisorId')} className="bg-input border-border mt-1" />
              </div>
              <div>
                <Label className="text-muted-foreground">Davomiyligi (kun) *</Label>
                <Select value={form.duration_days} onValueChange={v => setForm(f => ({ ...f, duration_days: v }))}>
                  <SelectTrigger className="bg-input border-border mt-1 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["30", "60", "90"]).map(d => <SelectItem key={d} value={d}>{d} kun</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-muted-foreground">{t("boshlanishSanasi1")}</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                  className="bg-input border-border mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("maqsadlar1")}</Label>
              <Textarea value={form.goals} onChange={e => setForm(f => ({ ...f, goals: e.target.value }))}
                placeholder="PIP maqsadlari va kutilgan natijalar..." className="bg-input border-border mt-1 min-h-24" />
            </div>
            <div>
              <Label className="text-muted-foreground">{t("muvaffaqiyatMezonlari")}</Label>
              <Textarea value={form.success_criteria} onChange={e => setForm(f => ({ ...f, success_criteria: e.target.value }))}
                placeholder={t("qandayNatijagaErishilsaMuvaffaqiyatliDeb")} className="bg-input border-border mt-1" />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => create.mutate({ ...form, employee_id: parseInt(form.employee_id), duration_days: parseInt(form.duration_days) })}
                disabled={!form.employee_id || !form.goals || create.isPending}
                className="bg-primary hover:bg-primary/90 text-white">
                {create.isPending ? "Yaratilmoqda..." : "✅ Yaratish"}
              </Button>
              <Button onClick={() => setShowCreate(false)} variant="outline" className="border-border text-muted-foreground">{t("cancel")}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PIP List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-muted-foreground text-sm font-medium">Barcha PIP rejalar ({pips?.length || 0})</h3>
          {isLoading && <div className="text-muted-foreground text-center py-4">{t("Yuklanmoqda...")}</div>}
          {pips?.map((pip) => (
            <Card key={pip.id}
              onClick={() => setSelectedPip(pip)}
              className={`cursor-pointer transition-all ${selectedPip?.id === pip.id ? 'border-primary bg-muted' : 'bg-card border-border hover:border-border'}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-foreground text-sm">{pip.first_name} {pip.last_name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{pip.duration_days} kunlik reja</div>
                    <div className="text-xs text-muted-foreground">{pip.start_date} → {pip.end_date}</div>
                  </div>
                  <Badge className={`${STATUS_COLORS[pip.status] || 'bg-muted text-muted-foreground'} text-xs`}>
                    {STATUS_LABELS[pip.status] || pip.status}
                  </Badge>
                </div>
                {pip.latest_progress !== null && pip.status === 'active' && (
                  <div className="mt-3">
                    <Progress value={parseInt(pip.latest_progress) || 0} className="h-1.5" />
                    <div className="text-xs text-muted-foreground mt-0.5">{pip.latest_progress || 0}% progress</div>
                  </div>
                )}
                {pip.result && (
                  <Badge className={`mt-2 ${RESULT_COLORS[pip.result] || 'bg-muted'} text-white text-xs`}>
                    {pip.result === "PASSED" ? "✅ O'tdi" : "❌ O'tmadi"}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
          {(!pips || pips.length === 0) && !isLoading && (
            <div className="text-center py-8 text-muted-foreground text-sm">{t("haliPipYoq")}</div>
          )}
        </div>

        {/* PIP Detail */}
        {selectedPip && pipDetail && (
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center justify-between">
                  <span>{pipDetail.pip?.first_name} {pipDetail.pip?.last_name} — PIP #{pipDetail.pip?.id}</span>
                  <Badge className={`${STATUS_COLORS[pipDetail.pip?.status ?? ''] || 'bg-muted text-muted-foreground'}`}>
                    {STATUS_LABELS[pipDetail.pip?.status ?? '']}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">{t("davomiyligi")}</div>
                    <div className="text-foreground font-semibold">{pipDetail.pip?.duration_days} kun</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t("boshlanish")}</div>
                    <div className="text-foreground font-semibold">{pipDetail.pip?.start_date}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t("tugash")}</div>
                    <div className="text-foreground font-semibold">{pipDetail.pip?.end_date}</div>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm mb-1">{t("maqsadlar")}</div>
                  <div className="text-foreground text-sm bg-muted p-3 rounded">{pipDetail.pip?.goals}</div>
                </div>
                {pipDetail.pip?.success_criteria && (
                  <div>
                    <div className="text-muted-foreground text-sm mb-1">{t("muvaffaqiyatMezonlari")}</div>
                    <div className="text-foreground text-sm bg-muted p-3 rounded">{pipDetail.pip.success_criteria}</div>
                  </div>
                )}
                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  {pipDetail.pip?.status === 'draft' && (
                    <Button onClick={() => acknowledge.mutate(pipDetail.pip?.id)} size="sm"
                      className="bg-[var(--ep-blue)] hover:bg-[var(--ep-blue)]/90 text-white">
                      ✅ Tasdiqlash (Xodim)
                    </Button>
                  )}
                  {pipDetail.pip?.status === 'active' && (
                    <>
                      <Button onClick={() => complete.mutate({ id: pipDetail.pip?.id, result: "PASSED" })} size="sm"
                        className="bg-[var(--ep-green)] hover:bg-[var(--ep-green)]/90 text-white">{t("otdi1")}</Button>
                      <Button onClick={() => complete.mutate({ id: pipDetail.pip?.id, result: "FAILED" })} size="sm"
                        className="bg-[var(--ep-red)] hover:bg-[var(--ep-red)]/90 text-white">{t("otmadi")}</Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Progress updates */}
            {pipDetail.pip?.status === 'active' && (
              <Card className="bg-card border-border">
                <CardHeader><CardTitle className="text-foreground text-base">{t("progressYangilash")}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-muted-foreground text-sm">Progress (%)</Label>
                      <Input type="number" min="0" max="100" value={progressForm.progress_percent}
                        onChange={e => setProgressForm(f => ({ ...f, progress_percent: e.target.value }))}
                        className="bg-input border-border mt-1" />
                    </div>
                    <div className="flex-2">
                      <Label className="text-muted-foreground text-sm">{t("Izoh")}</Label>
                      <Input value={progressForm.notes}
                        onChange={e => setProgressForm(f => ({ ...f, notes: e.target.value }))}
                        placeholder={t("buHaftadagiOzgarish")} className="bg-input border-border mt-1" />
                    </div>
                    <Button onClick={() => addProgress.mutate({ id: pipDetail.pip?.id, data: { ...progressForm, progress_percent: parseInt(progressForm.progress_percent) } })}
                      className="bg-primary hover:bg-primary/90 text-white" size="sm">
                      {t("Saqlash")}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {pipDetail.progress?.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-muted p-2 rounded">
                        <div className="w-12 text-center">
                          <div className="text-foreground font-bold">{p.progress_percent}%</div>
                        </div>
                        <Progress value={p.progress_percent} className="flex-1 h-2" />
                        <div className="text-muted-foreground text-xs">{new Date(p.created_at).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
