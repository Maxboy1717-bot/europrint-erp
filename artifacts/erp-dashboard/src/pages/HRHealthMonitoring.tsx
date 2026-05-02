import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Activity, Plus, Search, AlertTriangle, CheckCircle2, Calendar, Users, ClipboardList,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface HealthCheckup {
  id: string;
  departmentName?: string;
  checkupDate?: string;
  nextCheckupDate?: string;
  totalEmployees?: number;
  examinedCount?: number;
  status?: string;
  checkupType?: string;
  notes?: string;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  scheduled:   { label: "Rejalashtirilgan", variant: "secondary",   color: "text-blue-600" },
  in_progress: { label: "Jarayonda",        variant: "secondary",   color: "text-amber-600" },
  completed:   { label: "Yakunlangan",      variant: "default",     color: "text-green-600" },
  overdue:     { label: "Muddati o'tgan",   variant: "destructive", color: "text-red-600" },
  cancelled:   { label: "Bekor qilingan",   variant: "outline",     color: "text-muted-foreground" },
};

function NewCheckupDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    departmentName: "", checkupDate: "", nextCheckupDate: "",
    totalEmployees: "", checkupType: "annual", notes: "",
  });

  const create = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/hr/health-checkups", {
        ...form,
        totalEmployees: form.totalEmployees ? parseInt(form.totalEmployees) : null,
        examinedCount: 0,
        status: "scheduled",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/health-checkups"] });
      toast({ title: "Yangi ko'rik rejalashtirildi" });
      onClose();
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Yangi Tibbiy Ko'rik Rejalashtirish</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <Label>Bo'lim nomi *</Label>
            <Input value={form.departmentName} onChange={e => f("departmentName", e.target.value)} placeholder="Bo'lim nomi" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ko'rik sanasi *</Label>
              <Input type="date" value={form.checkupDate} onChange={e => f("checkupDate", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Keyingi ko'rik</Label>
              <Input type="date" value={form.nextCheckupDate} onChange={e => f("nextCheckupDate", e.target.value)} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Xodimlar soni</Label>
              <Input type="number" min={1} value={form.totalEmployees} onChange={e => f("totalEmployees", e.target.value)} placeholder="0" className="mt-1" />
            </div>
            <div>
              <Label>Ko'rik turi</Label>
              <Select value={form.checkupType} onValueChange={v => f("checkupType", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Yillik</SelectItem>
                  <SelectItem value="quarterly">Choraklik</SelectItem>
                  <SelectItem value="special">Maxsus</SelectItem>
                  <SelectItem value="pre_employment">Ishga kirish</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Izoh</Label>
            <Input value={form.notes} onChange={e => f("notes", e.target.value)} placeholder="Qo'shimcha ma'lumot" className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Bekor</Button>
          <Button
            onClick={() => create.mutate()}
            disabled={!form.departmentName || !form.checkupDate || create.isPending}
          >
            {create.isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function HRHealthMonitoring() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [newOpen, setNewOpen] = useState(false);

  const { data: checkups = [], isLoading } = useQuery<HealthCheckup[]>({
    queryKey: ["/api/hr/health-checkups"],
  });

  const all = checkups as HealthCheckup[];

  const filtered = all
    .filter(c => statusFilter === "all" || c.status === statusFilter)
    .filter(c =>
      !search ||
      (c.departmentName || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.checkupType || "").toLowerCase().includes(search.toLowerCase())
    );

  const totalExamined = (Array.isArray(all) ? all : []).reduce((s, c) => s + (c.examinedCount ?? 0), 0);
  const totalEmployees = (Array.isArray(all) ? all : []).reduce((s, c) => s + (c.totalEmployees ?? 0), 0);
  const coveragePct = totalEmployees > 0 ? Math.round((totalExamined / totalEmployees) * 100) : 0;
  const overdueCount = (Array.isArray(all) ? all : []).filter(c => c.status === "overdue").length;
  const completedCount = (Array.isArray(all) ? all : []).filter(c => c.status === "completed").length;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border/50 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-indigo-600" />
          <h1 className="font-semibold text-base">HR — Sog'liq Monitoringi</h1>
          <Badge variant="secondary">{all.length} ko'rik</Badge>
        </div>
        <Button size="sm" onClick={() => setNewOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />Yangi ko'rik
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2.5">
                <ClipboardList className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{all.length}</div>
                <div className="text-xs text-muted-foreground">Jami ko'riklar</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2.5">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                <div className="text-xs text-muted-foreground">Yakunlangan</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2.5">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
                <div className="text-xs text-muted-foreground">Muddati o'tgan</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Qamrov</span>
                <span className="text-sm font-bold text-purple-600">{coveragePct}%</span>
              </div>
              <Progress value={coveragePct} className="h-1.5" />
              <p className="text-xs text-muted-foreground mt-1">{totalExamined}/{totalEmployees} xodim</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Bo'lim yoki tur qidiring..."
              className="pl-8 h-8 text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] h-8 text-sm">
              <SelectValue placeholder="Holat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha holatlar</SelectItem>
              <SelectItem value="scheduled">Rejalashtirilgan</SelectItem>
              <SelectItem value="in_progress">Jarayonda</SelectItem>
              <SelectItem value="completed">Yakunlangan</SelectItem>
              <SelectItem value="overdue">Muddati o'tgan</SelectItem>
              <SelectItem value="cancelled">Bekor qilingan</SelectItem>
            </SelectContent>
          </Select>
          {filtered.length !== all.length && (
            <span className="text-xs text-muted-foreground">{filtered.length} ta topildi</span>
          )}
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bo'lim</TableHead>
                  <TableHead>Tur</TableHead>
                  <TableHead>Ko'rik sanasi</TableHead>
                  <TableHead>Xodimlar</TableHead>
                  <TableHead>Ko'rilganlar</TableHead>
                  <TableHead>Keyingi ko'rik</TableHead>
                  <TableHead>Holat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      Yuklanmoqda...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">
                        {all.length === 0 ? "Tibbiy ko'rik ma'lumotlari mavjud emas" : "Mos ko'rik topilmadi"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  (Array.isArray(filtered) ? filtered : []).map((c, i) => {
                    const pct = (c.totalEmployees ?? 0) > 0
                      ? Math.round(((c.examinedCount ?? 0) / (c.totalEmployees ?? 1)) * 100)
                      : 0;
                    const st = STATUS_MAP[c.status || "scheduled"] || STATUS_MAP.scheduled;
                    const TYPE_LABEL: Record<string, string> = {
                      annual: "Yillik", quarterly: "Choraklik",
                      special: "Maxsus", pre_employment: "Ishga kirish",
                    };
                    return (
                      <TableRow key={c.id} data-testid={`row-health-${i}`}>
                        <TableCell className="font-medium">{c.departmentName || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {TYPE_LABEL[c.checkupType || ""] || c.checkupType || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.checkupDate
                            ? <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{c.checkupDate.slice(0, 10)}</span>
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-sm">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            {c.totalEmployees ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-[100px]">
                            <Progress value={pct} className="h-1.5 flex-1" />
                            <span className="text-xs text-muted-foreground w-14 shrink-0">
                              {c.examinedCount ?? 0} ({pct}%)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.nextCheckupDate ? c.nextCheckupDate.slice(0, 10) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <NewCheckupDialog open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
}
