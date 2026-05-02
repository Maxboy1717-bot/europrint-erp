import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  TrendingUp,
  Award,
  Target,
  ChevronRight,
  Star,
  UserCheck,
  AlertTriangle,
  Plus,
  BookOpen,
} from "lucide-react";

// TZ-11: Vorislik Rejalash (Succession Planning)

const FALLBACK_KEY_POSITIONS = [
  { id: "1", title: "Ishlab chiqarish direktori", titleRu: "Директор производства", department: "Ishlab chiqarish", riskLevel: "high", currentHolder: "—", readyNow: 0, ready1Year: 0, ready2Year: 0, succession_plans: 0 },
  { id: "2", title: "Bosh texnolog", titleRu: "Главный технолог", department: "Texnologiya", riskLevel: "high", currentHolder: "—", readyNow: 0, ready1Year: 0, ready2Year: 0, succession_plans: 0 },
  { id: "3", title: "Sifat nazorati boshlig'i", titleRu: "Начальник ОТК", department: "QC", riskLevel: "medium", currentHolder: "—", readyNow: 0, ready1Year: 0, ready2Year: 0, succession_plans: 0 },
];

const RISK_COLOR: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
  critical: "destructive",
  high: "destructive",
  medium: "default",
  low: "secondary",
};

const RISK_LABEL: Record<string, string> = {
  critical: "Kritik",
  high: "Yuqori",
  medium: "O'rta",
  low: "Past",
};

const NINE_BOX = [
  { label: "Yulduzlar", desc: "Yuqori pot. + A'lo samaradorlik", color: "bg-green-100 dark:bg-green-900/30 border-green-400" },
  { label: "Kelajak yetakchilari", desc: "Yuqori pot. + Yaxshi samaradorlik", color: "bg-blue-100 dark:bg-blue-900/30 border-blue-400" },
  { label: "Ishchi otliqlar", desc: "Yuqori pot. + Past samaradorlik", color: "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400" },
  { label: "Yashirin yulduzlar", desc: "O'rta pot. + A'lo samaradorlik", color: "bg-teal-100 dark:bg-teal-900/30 border-teal-400" },
  { label: "Asosiy ishchilar", desc: "O'rta pot. + Yaxshi samaradorlik", color: "bg-surface-container-low dark:bg-gray-900/30 border-gray-400" },
  { label: "Muammoli", desc: "O'rta pot. + Past samaradorlik", color: "bg-orange-100 dark:bg-orange-900/30 border-orange-400" },
  { label: "Mutaxassis", desc: "Past pot. + A'lo samaradorlik", color: "bg-purple-100 dark:bg-purple-900/30 border-purple-400" },
  { label: "Barqaror", desc: "Past pot. + Yaxshi samaradorlik", color: "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-400" },
  { label: "Chiqish/Rivojlanish", desc: "Past pot. + Past samaradorlik", color: "bg-red-100 dark:bg-red-900/30 border-red-400" },
];

export default function HRSuccessionPlanning() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [newPlanOpen, setNewPlanOpen] = useState(false);
  const [newPlanForm, setNewPlanForm] = useState({ userId: "", targetPositionId: "", targetDate: "", notes: "" });

  const { data: keyPositions = [], isLoading: posLoading } = useQuery<Record<string, unknown>[]>({
    queryKey: ["/api/succession/key-positions"],
  });

  const { data: candidates = [], isLoading: candLoading } = useQuery<Record<string, unknown>[]>({
    queryKey: ["/api/succession/candidates"],
  });

  const { data: careerPlans = [], isLoading: plansLoading, refetch: refetchPlans } = useQuery<Record<string, unknown>[]>({
    queryKey: ["/api/succession/career-plans"],
  });

  const createPlanMutation = useMutation({
    mutationFn: (data: Record<string, string>) => apiRequest("POST", "/api/succession/career-plans", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/succession/career-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/succession/key-positions"] });
      setNewPlanOpen(false);
      setNewPlanForm({ userId: "", targetPositionId: "", targetDate: "", notes: "" });
      toast({ title: "Vorislik rejasi yaratildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const displayPositions = keyPositions.length > 0 ? keyPositions : FALLBACK_KEY_POSITIONS;
  const criticalCount = (Array.isArray(displayPositions) ? displayPositions : []).filter((p: Record<string, unknown>) => p.riskLevel === "critical" || p.riskLevel === "high" || Number(p.succession_plans) === 0).length;
  const readyCount = candidates.length;
  const plansCount = careerPlans.length;

  return (
    <ModulePage
      module="hr"
      title="Vorislik Rejalash"
      subtitle="Lavozim vorisligi va iste'dod zaxirasi boshqaruvi"
      icon={<Users className="h-6 w-6" />}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                {posLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold" data-testid="stat-critical-positions">{criticalCount}</p>}
                <p className="text-sm text-muted-foreground">Xavfli lavozimlar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-green-500" />
              <div>
                {candLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold" data-testid="stat-candidates">{readyCount}</p>}
                <p className="text-sm text-muted-foreground">Potentsial nomzodlar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-yellow-500" />
              <div>
                {plansLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold" data-testid="stat-plans">{plansCount}</p>}
                <p className="text-sm text-muted-foreground">Faol vorislik rejalari</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" data-testid="tab-succession-overview">Asosiy Lavozimlar</TabsTrigger>
          <TabsTrigger value="plans" data-testid="tab-succession-plans">Vorislik Rejalari</TabsTrigger>
          <TabsTrigger value="candidates" data-testid="tab-succession-candidates">Nomzodlar</TabsTrigger>
          <TabsTrigger value="matrix" data-testid="tab-succession-matrix">9-Blok Matrix</TabsTrigger>
        </TabsList>

        {/* KEY POSITIONS TAB */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Strategik Lavozimlar Ro'yxati</CardTitle>
              <CardDescription>Vorissiz yoki yuqori xavfli asosiy lavozimlar</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {posLoading ? (
                <div className="p-4 space-y-2">
                  {([1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-12 w-full" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lavozim</TableHead>
                      <TableHead>Bo'lim</TableHead>
                      <TableHead>Rejalari</TableHead>
                      <TableHead>1 yilda</TableHead>
                      <TableHead>2 yilda</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(displayPositions) ? displayPositions : []).map((pos: Record<string, unknown>, idx: number) => (
                      <TableRow key={String(pos.id ?? idx)} data-testid={`row-position-${String(pos.id ?? idx)}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{String(pos.title ?? "")}</p>
                            {!!pos.title_ru && <p className="text-xs text-muted-foreground">{String(pos.title_ru)}</p>}
                          </div>
                        </TableCell>
                        <TableCell>{String(pos.department ?? pos.name ?? "—")}</TableCell>
                        <TableCell>
                          <Badge variant={Number(pos.succession_plans ?? 0) > 0 ? "secondary" : "outline"}>
                            {Number(pos.succession_plans ?? 0)} reja
                          </Badge>
                        </TableCell>
                        <TableCell>{Number(pos.ready_1_year ?? pos.ready1Year ?? 0)}</TableCell>
                        <TableCell>{Number(pos.ready_2_years ?? pos.ready2Year ?? 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CAREER PLANS TAB */}
        <TabsContent value="plans">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Vorislik Rejalari</CardTitle>
                <CardDescription>Xodimlarning lavozimga tayyorlanish rejalari</CardDescription>
              </div>
              <Dialog open={newPlanOpen} onOpenChange={setNewPlanOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-add-plan">
                    <Plus className="h-4 w-4 mr-1" /> Yangi Reja
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Yangi Vorislik Rejasi</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 py-2">
                    <div>
                      <Label>Xodim ID</Label>
                      <Input
                        data-testid="input-plan-user-id"
                        value={newPlanForm.userId}
                        onChange={e => setNewPlanForm(f => ({ ...f, userId: e.target.value }))}
                        placeholder="Xodim ID si"
                      />
                    </div>
                    <div>
                      <Label>Maqsad Sana</Label>
                      <Input
                        data-testid="input-plan-target-date"
                        type="date"
                        value={newPlanForm.targetDate}
                        onChange={e => setNewPlanForm(f => ({ ...f, targetDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Izoh</Label>
                      <Textarea
                        data-testid="input-plan-notes"
                        value={newPlanForm.notes}
                        onChange={e => setNewPlanForm(f => ({ ...f, notes: e.target.value }))}
                        placeholder="Reja haqida izoh..."
                      />
                    </div>
                    <Button
                      data-testid="button-submit-plan"
                      className="w-full"
                      disabled={!newPlanForm.userId || createPlanMutation.isPending}
                      onClick={() => createPlanMutation.mutate(newPlanForm)}
                    >
                      Saqlash
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              {plansLoading ? (
                <div className="p-4 space-y-2">{([1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-12 w-full" />)}</div>
              ) : careerPlans.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p>Hali vorislik rejalari yo'q. Yangi reja qo'shing.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Xodim</TableHead>
                      <TableHead>Joriy lavozim</TableHead>
                      <TableHead>Maqsad lavozim</TableHead>
                      <TableHead>Sana</TableHead>
                      <TableHead>Holat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(careerPlans) ? careerPlans : []).map((plan: Record<string, unknown>, idx: number) => (
                      <TableRow key={String(plan.id ?? idx)} data-testid={`row-plan-${String(plan.id ?? idx)}`}>
                        <TableCell className="font-medium">{String(plan.employee_name ?? "—")}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{String(plan.current_position_title ?? plan.employee_position ?? "—")}</TableCell>
                        <TableCell>{String(plan.target_position_title ?? "—")}</TableCell>
                        <TableCell className="text-sm">{plan.target_date ? String(plan.target_date) : "—"}</TableCell>
                        <TableCell>
                          <Badge variant={plan.status === "active" ? "secondary" : "outline"}>
                            {plan.status === "active" ? "Faol" : plan.status === "completed" ? "Yakunlangan" : String(plan.status ?? "—")}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CANDIDATES TAB */}
        <TabsContent value="candidates">
          <Card>
            <CardHeader>
              <CardTitle>Potentsial Nomzodlar</CardTitle>
              <CardDescription>Ko'proq ko'nikmaga ega xodimlar</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {candLoading ? (
                <div className="p-4 space-y-2">{([1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-12 w-full" />)}</div>
              ) : candidates.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p>Xodimlar ma'lumotlari yo'q.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {(Array.isArray(candidates) ? candidates : []).map((c: Record<string, unknown>, idx: number) => (
                    <div key={String(c.id ?? idx)} className="p-4" data-testid={`row-candidate-${String(c.id ?? idx)}`}>
                      <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                        <div>
                          <p className="font-medium">{String(c.full_name ?? "—")}</p>
                          <p className="text-sm text-muted-foreground">{String(c.position ?? "—")} — {String(c.department ?? "—")}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {Number(c.skills_count ?? 0)} ko'nikma
                          </Badge>
                          <Badge variant={Number(c.career_plans_count ?? 0) > 0 ? "default" : "outline"}>
                            {Number(c.career_plans_count ?? 0)} reja
                          </Badge>
                        </div>
                      </div>
                      {Number(c.skills_count ?? 0) > 0 && (
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Ko'nikma darajasi</span>
                            <span>{Math.min(100, Number(c.skills_count ?? 0) * 10)}%</span>
                          </div>
                          <Progress value={Math.min(100, Number(c.skills_count ?? 0) * 10)} className="h-1.5" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 9-BLOCK MATRIX TAB */}
        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <CardTitle>9-Blok Samaradorlik-Potentsial Matritsa</CardTitle>
              <CardDescription>Xodimlarni potentsial va samaradorlik bo'yicha joylash</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {(Array.isArray(NINE_BOX) ? NINE_BOX : []).map((block, i) => (
                  <div key={`k-${i}`} className={`rounded-md border p-3 ${block.color}`} data-testid={`block-matrix-${i}`}>
                    <p className="font-semibold text-sm mb-1">{block.label}</p>
                    <p className="text-xs text-muted-foreground">{block.desc}</p>
                    {candidates.slice(i * 2, i * 2 + 2).map((c: Record<string, unknown>, ci: number) => (
                      <Badge key={ci} variant="outline" className="text-xs mr-1 mt-1">
                        {String(c.full_name ?? "")}
                      </Badge>
                    ))}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                <span>← Past samaradorlik | Yuqori samaradorlik →</span>
                <span>↑ Yuqori potentsial | Past potentsial ↓</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ModulePage>
  );
}
