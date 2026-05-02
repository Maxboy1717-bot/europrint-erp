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

const MILESTONE_INFO: Record<number, { label: string; icon: string; color: string }> = {
  1: { label: "1 Oylik", icon: "🌱", color: "text-green-600" },
  3: { label: "3 Oylik", icon: "🌿", color: "text-blue-600" },
  6: { label: "6 Oylik", icon: "🌳", color: "text-purple-600" },
};

interface MilestoneEntry { id: number; milestone_months: number; employee_name?: string; department_name?: string; due_date: string; completed_at?: string | null; badge_awarded?: boolean; assessor_name?: string; }

export default function MilestonePage() {
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
      toast({ title: "✅ Milestonelar yaratildi!", description: `${(data.created as unknown[] | undefined)?.length || 0} ta milestone qo'shildi` });
      qc.invalidateQueries({ queryKey: ["/api/hr/milestones"] });
      setGenerateOpen(false);
      setGenForm({ employee_id: "", hire_date: "" });
    },
    onError: () => toast({ title: "Xato", variant: "destructive" }),
  });

  const completeMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) => apiRequest("PATCH", `/api/hr/milestones/${id}/complete`, body),
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
    <div className="flex flex-col h-full">
      <div className="border-b border-border/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Flag className="h-5 w-5 text-purple-600" />
          <h1 className="font-semibold text-base">Milestone Tracker</h1>
          <Badge variant="secondary">{upcoming.length} yaqin</Badge>
        </div>
        <Button size="sm" onClick={() => setGenerateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />Milestone yaratish
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <div className="text-2xl font-bold text-amber-600">{pending.length}</div>
                <div className="text-xs text-muted-foreground">Kutilayotgan</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">{completed.length}</div>
                <div className="text-xs text-muted-foreground">Yakunlangan</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {(Array.isArray(allMilestones) ? allMilestones : []).filter((m) => m.badge_awarded).length}
                </div>
                <div className="text-xs text-muted-foreground">Badge berilgan</div>
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
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Yakunlash
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Xodim</TableHead>
                      <TableHead>Milestone</TableHead>
                      <TableHead>Sana</TableHead>
                      <TableHead>Qoldi</TableHead>
                      <TableHead className="text-right">Amal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-6">Yuklanmoqda...</TableCell></TableRow>
                    ) : pending.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Kutilayotgan milestone yo'q</TableCell></TableRow>
                    ) : (Array.isArray(pending) ? pending : []).map((m) => {
                      const info = MILESTONE_INFO[m.milestone_months] || { label: `${m.milestone_months} oy`, icon: "🏁", color: "text-gray-600" };
                      const days = daysUntil(m.due_date);
                      return (
                        <TableRow key={m.id}>
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
                              Yakunlash
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Xodim</TableHead>
                      <TableHead>Milestone</TableHead>
                      <TableHead>Yakunlangan</TableHead>
                      <TableHead>Badge</TableHead>
                      <TableHead>Baholovchi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completed.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Hali yakunlangan milestone yo'q</TableCell></TableRow>
                    ) : (Array.isArray(completed) ? completed : []).map((m) => {
                      const info = MILESTONE_INFO[m.milestone_months] || { label: `${m.milestone_months} oy`, icon: "🏁", color: "text-gray-600" };
                      return (
                        <TableRow key={m.id}>
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
                              <Badge className="bg-yellow-100 text-yellow-700 border-0">🏅 Berildi</Badge>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{m.assessor_name || "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Generate milestones dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Xodim uchun milestone yaratish</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Xodim ID</Label>
              <Input type="number" value={genForm.employee_id} onChange={e => setGenForm(f => ({ ...f, employee_id: e.target.value }))} placeholder="Xodim ID" className="mt-1" />
            </div>
            <div>
              <Label>Ishga kirish sanasi</Label>
              <Input type="date" value={genForm.hire_date} onChange={e => setGenForm(f => ({ ...f, hire_date: e.target.value }))} className="mt-1" />
            </div>
            <p className="text-xs text-muted-foreground">1 oy, 3 oy va 6 oylik milestonelar avtomatik yaratiladi</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateOpen(false)}>Bekor</Button>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Milestone yakunlash</DialogTitle>
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
                <Label>Baholash izohi</Label>
                <Textarea
                  value={completeForm.notes}
                  onChange={e => setCompleteForm({ notes: e.target.value })}
                  placeholder="Xodim haqida fikr, natijalar..."
                  rows={3}
                  className="mt-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">Yakunlaganda 🏅 badge avtomatik beriladi</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteTarget(null)}>Bekor</Button>
            <Button
              onClick={() => completeMut.mutate({ id: completeTarget!.id, body: { assessor_id: 1, notes: completeForm.notes } })}
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
