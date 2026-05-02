import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Medal, Star, Plus, Award, Users } from "lucide-react";

const PERIOD_LABELS: Record<string, string> = { monthly: "Oylik", quarterly: "Choraklik", all: "Barcha vaqt" };

export default function GamificationPage() {
  const [period, setPeriod] = useState("monthly");
  const [awardBadgeOpen, setAwardBadgeOpen] = useState(false);
  const [awardPointsOpen, setAwardPointsOpen] = useState(false);
  const [badgeForm, setBadgeForm] = useState({ employee_id: "", badge_code: "", reason: "" });
  const [pointsForm, setPointsForm] = useState({ employee_id: "", points: "50", event_type: "manual", description: "" });
  const { toast } = useToast();
  const qc = useQueryClient();

  interface LbEntry { employee_id: number; first_name: string; last_name: string; department_name: string; employee_code: string; monthly_points: string; quarterly_points: string; total_points: string; badge_count: number }
  interface BadgeCatalogItem { code: string; icon: string; name: string; name_ru: string; point_value: number; is_auto_award: boolean; description: string; total_awarded: string | number }
  interface EmployeeItem { id: number; first_name: string; last_name: string; employee_code: string }

  const { data: leaderboard, isLoading: lbLoading } = useQuery<{ leaderboard: LbEntry[] }>({
    queryKey: ["/api/hr/gamification/leaderboard", period],
    queryFn: () => apiRequest("GET", `/api/hr/gamification/leaderboard?period=${period}`),
  });

  const { data: catalog } = useQuery<BadgeCatalogItem[]>({
    queryKey: ["/api/hr/gamification/badges/catalog"],
    queryFn: () => apiRequest("GET", "/api/hr/gamification/badges/catalog"),
  });

  const { data: employees } = useQuery<{ employees?: EmployeeItem[]; data?: EmployeeItem[] } | EmployeeItem[]>({
    queryKey: ["/api/employees"],
    queryFn: () => apiRequest("GET", "/api/employees?limit=200"),
  });

  const awardBadgeMut = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiRequest("POST", "/api/hr/gamification/award/badge", body),
    onSuccess: (data: Record<string, unknown>) => {
      if (data?.error) { toast({ title: "Xato", description: String(data.error), variant: "destructive" }); return; }
      toast({ title: "✅ Badge berildi!", description: "Badge muvaffaqiyatli berildi va ballar qo'shildi" });
      qc.invalidateQueries({ queryKey: ["/api/hr/gamification/leaderboard"] });
      qc.invalidateQueries({ queryKey: ["/api/hr/gamification/badges/catalog"] });
      setAwardBadgeOpen(false);
      setBadgeForm({ employee_id: "", badge_code: "", reason: "" });
    },
    onError: () => toast({ title: "Xato", description: "Badge berish muvaffaqiyatsiz", variant: "destructive" }),
  });

  const awardPointsMut = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiRequest("POST", "/api/hr/gamification/award/points", body),
    onSuccess: (data: Record<string, unknown>) => {
      if (data?.error) { toast({ title: "Xato", description: String(data.error), variant: "destructive" }); return; }
      toast({ title: "✅ Ballar qo'shildi!", description: `${pointsForm.points} ball muvaffaqiyatli berildi` });
      qc.invalidateQueries({ queryKey: ["/api/hr/gamification/leaderboard"] });
      setAwardPointsOpen(false);
      setPointsForm({ employee_id: "", points: "50", event_type: "manual", description: "" });
    },
    onError: () => toast({ title: "Xato", description: "Ballar berish muvaffaqiyatsiz", variant: "destructive" }),
  });

  const lb = leaderboard?.leaderboard || [];
  const topScore = parseInt(lb[0]?.[period === "monthly" ? "monthly_points" : period === "quarterly" ? "quarterly_points" : "total_points"] || "0");
  const totalBadges = (catalog || []).reduce((s: number, b) => s + parseInt(String(b.total_awarded || "0")), 0);
  const empList: EmployeeItem[] = (Array.isArray(employees) ? employees : ((employees as { employees?: EmployeeItem[]; data?: EmployeeItem[] } | undefined)?.employees || (employees as { employees?: EmployeeItem[]; data?: EmployeeItem[] } | undefined)?.data || [])) as EmployeeItem[];

  return (
    <div className="p-6 space-y-6 bg-[#0f0f23] min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[#ff5d2e]" /> Gamifikatsiya
          </h1>
          <p className="text-slate-400 text-sm mt-1">Reyting, badge va xodimlar mukofotlari</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {Object.entries(PERIOD_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v} className="text-white">{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Award Badge Dialog */}
          <Dialog open={awardBadgeOpen} onOpenChange={setAwardBadgeOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#ff5d2e] hover:bg-[#e04d1e] text-white gap-1">
                <Medal className="w-4 h-4" /> Badge ber
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">🎖️ Xodimga Badge berish</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label className="text-slate-300">Xodim</Label>
                  <Select value={badgeForm.employee_id} onValueChange={v => setBadgeForm(f => ({ ...f, employee_id: v }))}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                      <SelectValue placeholder="Xodimni tanlang..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 max-h-48">
                      {empList.slice(0, 100).map((e) => (
                        <SelectItem key={e.id} value={String(e.id)} className="text-white">
                          {e.first_name} {e.last_name} ({e.employee_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Badge</Label>
                  <Select value={badgeForm.badge_code} onValueChange={v => setBadgeForm(f => ({ ...f, badge_code: v }))}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                      <SelectValue placeholder="Badge tanlang..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 max-h-48">
                      {(catalog || []).map((b) => (
                        <SelectItem key={b.code} value={b.code} className="text-white">
                          {b.icon} {b.name} (+{b.point_value} ball)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Sabab (ixtiyoriy)</Label>
                  <Textarea value={badgeForm.reason}
                    onChange={e => setBadgeForm(f => ({ ...f, reason: e.target.value }))}
                    placeholder="Badge berilish sababi..."
                    className="bg-slate-800 border-slate-700 text-white mt-1" rows={2} />
                </div>
                <Button
                  onClick={() => awardBadgeMut.mutate({ ...badgeForm, awarded_by: 1 })}
                  disabled={!badgeForm.employee_id || !badgeForm.badge_code || awardBadgeMut.isPending}
                  className="w-full bg-[#ff5d2e] hover:bg-[#e04d1e] text-white">
                  {awardBadgeMut.isPending ? "Berilmoqda..." : "🎖️ Badge ber"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Award Points Dialog */}
          <Dialog open={awardPointsOpen} onOpenChange={setAwardPointsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:text-white gap-1">
                <Star className="w-4 h-4" /> Ball ber
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">⭐ Qo'shimcha ball berish</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label className="text-slate-300">Xodim</Label>
                  <Select value={pointsForm.employee_id} onValueChange={v => setPointsForm(f => ({ ...f, employee_id: v }))}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                      <SelectValue placeholder="Xodimni tanlang..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 max-h-48">
                      {empList.slice(0, 100).map((e) => (
                        <SelectItem key={e.id} value={String(e.id)} className="text-white">
                          {e.first_name} {e.last_name} ({e.employee_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-slate-300">Ball miqdori</Label>
                    <Input type="number" value={pointsForm.points}
                      onChange={e => setPointsForm(f => ({ ...f, points: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white mt-1" min={1} max={1000} />
                  </div>
                  <div>
                    <Label className="text-slate-300">Tur</Label>
                    <Select value={pointsForm.event_type} onValueChange={v => setPointsForm(f => ({ ...f, event_type: v }))}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="manual" className="text-white">Qo'lda</SelectItem>
                        <SelectItem value="kpi_bonus" className="text-white">KPI bonusi</SelectItem>
                        <SelectItem value="project_complete" className="text-white">Loyiha</SelectItem>
                        <SelectItem value="training" className="text-white">O'qitish</SelectItem>
                        <SelectItem value="innovation" className="text-white">Innovatsiya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300">Izoh</Label>
                  <Textarea value={pointsForm.description}
                    onChange={e => setPointsForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Ball berilish sababi..." className="bg-slate-800 border-slate-700 text-white mt-1" rows={2} />
                </div>
                <Button
                  onClick={() => awardPointsMut.mutate({ ...pointsForm, points: parseInt(pointsForm.points) })}
                  disabled={!pointsForm.employee_id || !pointsForm.points || awardPointsMut.isPending}
                  className="w-full bg-[#ff5d2e] hover:bg-[#e04d1e] text-white">
                  {awardPointsMut.isPending ? "Qo'shilmoqda..." : "⭐ Ball ber"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {([
          { label: "Reyting ishtirokchilari", value: lb.length, icon: Users, color: "text-blue-400" },
          { label: "Eng yuqori ball", value: topScore, icon: Trophy, color: "text-yellow-400" },
          { label: "Jami badge'lar berilgan", value: totalBadges, icon: Medal, color: "text-purple-400" },
          { label: "Badge turlari", value: (catalog || []).length, icon: Award, color: "text-[#ff5d2e]" },
        ]).map(s => (
          <Card key={s.label} className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-slate-700/80 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{s.value.toLocaleString()}</div>
                <div className="text-xs text-slate-400">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="leaderboard">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="leaderboard" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-[#ff5d2e]">
            🏆 Reyting
          </TabsTrigger>
          <TabsTrigger value="badges" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-[#ff5d2e]">
            🎖️ Badge Katalog
          </TabsTrigger>
        </TabsList>

        {/* LEADERBOARD */}
        <TabsContent value="leaderboard" className="mt-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                🏆 {PERIOD_LABELS[period]} Reyting
                <Badge className="bg-[#ff5d2e] text-white ml-2">{lb.length} xodim</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lbLoading ? (
                <div className="text-center py-8 text-slate-400">Yuklanmoqda...</div>
              ) : lb.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-4xl mb-3">🏆</div>
                  <p>Hali ma'lumot yo'q. Xodimlarga badge va ballar bering!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(Array.isArray(lb) ? lb : []).map((emp, idx) => {
                    const pts = parseInt(period === "monthly" ? emp.monthly_points : period === "quarterly" ? emp.quarterly_points : emp.total_points) || 0;
                    const maxPts = parseInt(period === "monthly" ? lb[0]?.monthly_points : period === "quarterly" ? lb[0]?.quarterly_points : lb[0]?.total_points) || 1;
                    return (
                      <div key={emp.employee_id}
                        className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                          idx === 0 ? 'bg-yellow-900/20 border border-yellow-700/30' :
                          idx < 3 ? 'bg-slate-700/50' : 'bg-slate-800/30 hover:bg-slate-700/20'
                        }`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                          idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-slate-400 text-black' :
                          idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-700 text-slate-300'
                        }`}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white truncate">{emp.first_name} {emp.last_name}</div>
                          <div className="text-xs text-slate-400 truncate">{emp.department_name || emp.employee_code}</div>
                          <div className="h-1.5 bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#ff5d2e] to-orange-400 rounded-full"
                              style={{ width: `${Math.max(2, (pts / maxPts) * 100)}%` }} />
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-[#ff5d2e] font-bold text-xl">
                            {pts.toLocaleString()}
                            <span className="text-xs text-slate-400 ml-1">ball</span>
                          </div>
                          <div className="text-xs text-slate-400 flex items-center justify-end gap-1">
                            <Medal className="w-3 h-3" />{emp.badge_count || 0} badge
                          </div>
                        </div>
                        <Button size="sm" variant="ghost"
                          className="text-slate-400 hover:text-white hover:bg-slate-700 flex-shrink-0 h-8 w-8 p-0"
                          onClick={() => { setBadgeForm(f => ({ ...f, employee_id: String(emp.employee_id) })); setAwardBadgeOpen(true); }}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* BADGE CATALOG */}
        <TabsContent value="badges" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(catalog || []).map((badge) => (
              <Card key={badge.code} className="bg-slate-800/50 border-slate-700 hover:border-[#ff5d2e]/50 transition-colors group">
                <CardContent className="p-4 text-center">
                  <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">{badge.icon || "🏅"}</div>
                  <div className="font-semibold text-white text-sm">{badge.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{badge.name_ru}</div>
                  <div className="flex justify-center gap-1 mt-2 flex-wrap">
                    {badge.point_value > 0 && (
                      <Badge className="bg-[#ff5d2e]/20 text-[#ff5d2e] border-0 text-xs">+{badge.point_value} ball</Badge>
                    )}
                    {badge.is_auto_award && (
                      <Badge className="bg-blue-700/30 text-blue-300 border-0 text-xs">Auto</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{badge.description}</p>
                  <div className="mt-2 text-xs text-slate-400">{badge.total_awarded || 0} marta berilgan</div>
                  <Button size="sm" variant="ghost"
                    className="mt-2 w-full text-xs text-slate-300 hover:text-white hover:bg-slate-700 h-7"
                    onClick={() => { setBadgeForm(f => ({ ...f, badge_code: badge.code })); setAwardBadgeOpen(true); }}>
                    <Plus className="w-3 h-3 mr-1" /> Ber
                  </Button>
                </CardContent>
              </Card>
            ))}
            {(!catalog || catalog.length === 0) && (
              <div className="col-span-4 text-center py-12 text-slate-400">
                <div className="text-4xl mb-3">🎖️</div>
                <p>Badge katalogi bo'sh</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
