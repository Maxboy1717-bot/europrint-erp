/**
 * @module MilestonePage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Flag, Trophy, Calendar, CheckCircle2, Clock, Plus } from "lucide-react";

import { useTranslation } from '@/lib/i18n';
import { EPStatusPill } from "@/components/ep";
const MILESTONE_INFO: Record<number, { label: string; icon: string; color: string }> = {
  1: { label: "1 Oylik", icon: "🌱", color: "text-[var(--ep-green)]" },
  3: { label: "3 Oylik", icon: "🌿", color: "text-[var(--ep-blue)]" },
  6: { label: "6 Oylik", icon: "🌳", color: "text-[var(--ep-purple)]" },
};

interface MilestoneEntry { id: number; milestone_months: number; employee_name?: string; department_name?: string; due_date: string; completed_at?: string | null; badge_awarded?: boolean; assessor_name?: string; }

export default function MilestonePage() {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const qc = useQueryClient();
  const [generateOpen, setGenerateOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<MilestoneEntry | null>(null);
  const [genForm, setGenForm] = useState({ employee_id: "", hire_date: "" });
  const [completeForm, setCompleteForm] = useState({ notes: "" });

  const { data: upcoming = [], isLoading: upcomingLoading } = useQuery<MilestoneEntry[]>({
    queryKey: ["/api/hr/milestones/upcoming"],
    queryFn: () => apiRequest("GET", "/api/hr/milestones/upcoming"),
  });

  const { data: allMilestones = [], isLoading: allLoading } = useQuery<MilestoneEntry[]>({
    queryKey: ["/api/hr/milestones"],
    queryFn: () => apiRequest("GET", "/api/hr/milestones"),
  });

  const generateMut = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiRequest("POST", "/api/hr/milestones/generate", body),
    onSuccess: (data: Record<string, unknown>) => {
      if (data?.error) { toast({ title: "Xato", description: String(data.error), variant: "destructive" }); return; }
      toast({ title: "✅ Milestonelar yaratildi!", description: `${Array.isArray(data.created) ? data.created.length : 0} ta milestone qo'shildi` });
      qc.invalidateQueries({ queryKey: ["/api/hr/milestones"] });
      setGenerateOpen(false);
      setGenForm({ employee_id: "", hire_date: "" });
    },
    onError: () => toast({ title: "Xato", variant: "destructive" }),
  });

  const completeMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) => apiRequest("POST", `/api/hr/milestones/${id}/complete`, body),
    onSuccess: (data: Record<string, unknown>) => {
      if (data?.error) { toast({ title: "Xato", description: String(data.error), variant: "destructive" }); return; }
      toast({ title: "✅ Milestone yakunlandi!", description: "Badge avtomatik berildi" });
      qc.invalidateQueries({ queryKey: ["/api/hr/milestones"] });
      setCompleteTarget(null);
    },
    onError: () => toast({ title: "Xato", variant: "destructive" }),
  });

  const daysUntil = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((d.getTime() - today.getTime()) / 86400000);
  };

  const completed = (Array.isArray(allMilestones) ? allMilestones : []).filter((m) => m.completed_at);
  const pending = (Array.isArray(allMilestones) ? allMilestones : []).filter((m) => !m.completed_at);

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="border-b border-border/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Flag className="h-5 w-5 text-[var(--ep-purple)]" />
          <h1 className="font-semibold text-base">{t('milestoneTracker')}</h1>
          <EPStatusPill tone="neutral">{upcoming.length} yaqin</EPStatusPill>
        </div>
        <Button size="sm" onClick={() => setGenerateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />{t("milestoneYaratish")}
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <Clock className="h-4 w-4 text-[var(--ep-yellow)]" />
              <div>
                <div className="text-2xl font-bold text-[var(--ep-yellow)]">{pending.length}</div>
                <div className="text-xs text-muted-foreground">{t("kutilayotgan")}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-[var(--ep-green)]" />
              <div>
                <div className="text-2xl font-bold text-[var(--ep-green)]">{completed.length}</div>
                <div className="text-xs text-muted-foreground">{t("yakunlangan")}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <Trophy className="h-5 w-5 text-[var(--ep-yellow)]" />
              <div>
                <div className="text-2xl font-bold text-[var(--ep-yellow)]">
                  {(Array.isArray(allMilestones) ? allMilestones : []).filter((m) => m.badge_awarded).length}
                </div>
                <div className="text-xs text-muted-foreground">{t("badgeBerilgan")}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {upcoming.length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-base text-amber-800 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Yaqin milestonelar (14 kun ichida)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(Array.isArray(upcoming) ? upcoming : []).map((m) => {
                  const info = MILESTONE_INFO[m.milestone_months] || { label: `${m.milestone_months} oy`, icon: "🏁", color: "text-gray-600" };
                  const days = daysUntil(m.due_date);
                  return (
                    <div key={m.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-amber-100">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{info.icon}</span>
                        <div>
                          <p className="font-medium text-sm">{m.employee_name}</p>
                          <p className="text-xs text-muted-foreground">{m.department_name} · {info.label} milestone</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={days <= 0 ? "destructive" : days <= 3 ? "default" : "secondary"}>
                          {days <= 0 ? "Bugun!" : days <= 1 ? "Ertaga" : `${days} kun`}
                        </Badge>
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setCompleteTarget(m)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />{t("finishBtn")}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Kutilayotgan ({pending.length})</TabsTrigger>
            <TabsTrigger value="completed">Yakunlangan ({completed.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <div className="ep-table-scroll"><Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow>
                      <TableHead>{t("xodim1")}</TableHead>
                      <TableHead>{t('milestone1')}</TableHead>
                      <TableHead>{t("date")}</TableHead>
                      <TableHead>{t("Qoldi")}</TableHead>
                      <TableHead className="text-right">{t("amal")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-6">{t("Yuklanmoqda...")}</TableCell></TableRow>
                    ) : pending.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-[13px] text-muted-foreground">{t("kutilayotganMilestoneYoq")}</TableCell></TableRow>
                    ) : (Array.isArray(pending) ? pending : []).map((m) => {
                      const info = MILESTONE_INFO[m.milestone_months] || { label: `${m.milestone_months} oy`, icon: "🏁", color: "text-gray-600" };
                      const days = daysUntil(m.due_date);
                      return (
                        <TableRow key={m.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="font-medium text-sm">{m.employee_name}</TableCell>
                          <TableCell>
                            <span className={`flex items-center gap-1 text-sm ${info.color}`}>
                              {info.icon} {info.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(m.due_date).toLocaleDateString("uz-UZ")}
                          </TableCell>
                          <TableCell>
                            <Badge variant={days <= 0 ? "destructive" : days <= 7 ? "default" : "secondary"}>
                              {days <= 0 ? "Muddati o'tdi" : `${days} kun`}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setCompleteTarget(m)}>
                              {t("finishBtn")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <div className="ep-table-scroll"><Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow>
                      <TableHead>{t("xodim1")}</TableHead>
                      <TableHead>{t('milestone')}</TableHead>
                      <TableHead>{t("yakunlangan")}</TableHead>
                      <TableHead>{t("badge")}</TableHead>
                      <TableHead>{t("baholovchi")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completed.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-[13px] text-muted-foreground">{t("haliYakunlanganMilestoneYoq")}</TableCell></TableRow>
                    ) : (Array.isArray(completed) ? completed : []).map((m) => {
                      const info = MILESTONE_INFO[m.milestone_months] || { label: `${m.milestone_months} oy`, icon: "🏁", color: "text-gray-600" };
                      return (
                        <TableRow key={m.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="font-medium text-sm">{m.employee_name}</TableCell>
                          <TableCell>
                            <span className={`flex items-center gap-1 text-sm ${info.color}`}>
                              {info.icon} {info.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {m.completed_at ? new Date(m.completed_at).toLocaleDateString("uz-UZ") : "—"}
                          </TableCell>
                          <TableCell>
                            {m.badge_awarded ? (
                              <EPStatusPill tone="warning">{t("berildi")}</EPStatusPill>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{m.assessor_name || "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table></div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Generate milestones dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="max-w-sm p-6">
          <DialogHeader><DialogTitle className="text-[18px] font-semibold">{t("xodimUchunMilestoneYaratish")}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>{t("xodimId")}</Label>
              <Input type="number" value={genForm.employee_id} onChange={e => setGenForm(f => ({ ...f, employee_id: e.target.value }))} placeholder={t("xodimId")} className="mt-1" />
            </div>
            <div>
              <Label>{t("ishgaKirishSanasi")}</Label>
              <Input type="date" value={genForm.hire_date} onChange={e => setGenForm(f => ({ ...f, hire_date: e.target.value }))} className="mt-1" />
            </div>
            <p className="text-xs text-muted-foreground">1 oy, 3 oy va 6 oylik milestonelar avtomatik yaratiladi</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateOpen(false)}>{t("Bekor")}</Button>
            <Button
              onClick={() => generateMut.mutate(genForm)}
              disabled={!genForm.employee_id || !genForm.hire_date || generateMut.isPending}
            >
              {generateMut.isPending ? "Yaratilmoqda..." : "Yaratish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete milestone dialog */}
      <Dialog open={!!completeTarget} onOpenChange={() => setCompleteTarget(null)}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("milestoneYakunlash")}</DialogTitle>
          </DialogHeader>
          {completeTarget && (
            <div className="py-2 space-y-4">
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="font-medium">{completeTarget.employee_name}</p>
                <p className="text-sm text-muted-foreground">
                  {MILESTONE_INFO[completeTarget.milestone_months]?.icon} {MILESTONE_INFO[completeTarget.milestone_months]?.label} milestone
                </p>
              </div>
              <div>
                <Label>{t("baholashIzohi")}</Label>
                <Textarea
                  value={completeForm.notes}
                  onChange={e => setCompleteForm({ notes: e.target.value })}
                  placeholder={t("xodimHaqidaFikrNatijalar")}
                  rows={3}
                  className="mt-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">{t("yakunlagandaBadgeAvtomatikBeriladi")}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteTarget(null)}>{t("Bekor")}</Button>
            <Button
              onClick={() => completeMut.mutate({ id: completeTarget?.id ?? 0, body: { assessor_id: 1, notes: completeForm.notes } })}
              disabled={completeMut.isPending}
            >
              {completeMut.isPending ? "Saqlanmoqda..." : "✅ Yakunlash va badge berish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
