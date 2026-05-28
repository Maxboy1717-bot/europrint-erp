/**
 * @module Discipline
 * @description Route-level page component for HR Discipline management.
 * Route: /discipline
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck, Search, AlertTriangle, XCircle, ShieldOff, Plus } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { tLabel } from "@/lib/i18n/tLabel";
import { EPErrorState } from "@/components/ep";
import { apiRequest } from "@/lib/api-request";
import { useToast } from "@/hooks/use-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DisciplineRecord {
  id: number;
  employee_id: number;
  full_name: string;
  department: string;
  violation_type: string;
  discipline_type: string;
  severity: "low" | "medium" | "high" | "critical";
  violation_date: string;
  description: string;
  fine_amount?: number;
  status: string;
}

interface BlockedEmployee {
  employee_id: number;
  full_name: string;
  department: string;
  blocked_since: string;
  reason: string;
}

interface EmployeeListItem {
  id: string | number;
  fullName: string;
}

// ── Severity badge ─────────────────────────────────────────────────────────────

const SEVERITY_VARIANT: Record<string, "success" | "warning" | "danger" | "coral"> = {
  low:      "success",
  medium:   "warning",
  high:     "coral",
  critical: "danger",
};

const SEVERITY_LABEL: Record<string, string> = {
  low:      "Past",
  medium:   "O'rta",
  high:     "Yuqori",
  critical: "Kritik",
  minor:    "Engil",
  major:    "Og'ir",
};


function SeverityBadge({ severity }: { severity: string }) {
  const variant = SEVERITY_VARIANT[severity] ?? "neutral";
  const label   = SEVERITY_LABEL[severity]   ?? severity;
  return <Badge variant={variant as "success"}>{label}</Badge>;
}

// ── Skeleton rows ──────────────────────────────────────────────────────────────

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: cols }).map((__, j) => (
            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
      <div className={`p-2 rounded-md ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold">{value}</p>
      </div>
    </div>
  );
}

// ── Default form state ─────────────────────────────────────────────────────────

const defaultCreateForm = () => ({
  employee_id: "",
  violation_type: "",
  discipline_type: "",
  severity: "low" as "low" | "medium" | "high" | "critical",
  violation_date: new Date().toISOString().slice(0, 10),
  description: "",
  fine_amount: "",
});

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function Discipline() {
  const { t } = useTranslation("common");
  const { t: tHr } = useTranslation("hr");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [tab, setTab]       = useState<"violations" | "blocked">("violations");
  const [search, setSearch] = useState("");
  const [createDialog, setCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState(defaultCreateForm());

  const VIOLATION_TYPE_LABEL: Record<string, string> = {
    absence:         tHr("violation.absence"),
    misconduct:      tHr("violation.misconduct"),
    late:            tHr("violation.late"),
    insubordination: tHr("violation.insubordination"),
    harassment:      tHr("violation.harassment"),
    theft:           tHr("violation.theft"),
    safety:          tHr("violation.safety"),
    performance:     tHr("violation.performance"),
    other:           tHr("violation.other"),
  };
  const STATUS_LABEL: Record<string, string> = {
    open:     tHr("disciplineStatus.open"),
    closed:   tHr("disciplineStatus.closed"),
    pending:  tHr("disciplineStatus.pending"),
    resolved: tHr("disciplineStatus.resolved"),
    appealed: tHr("disciplineStatus.appealed"),
  };

  const { data: rawViolations, isLoading: loadingViolations, isError, refetch } =
    useQuery<DisciplineRecord[]>({ queryKey: ["/api/hr/discipline"] });

  const { data: rawBlocked, isLoading: loadingBlocked } =
    useQuery<BlockedEmployee[]>({ queryKey: ["/api/hr/discipline/blocked"] });

  const { data: employeesData } = useQuery<{ items: Array<EmployeeListItem> }>({
    queryKey: ["/api/hr/employees", { limit: 200 }],
    queryFn: () => apiRequest("GET", "/api/hr/employees?limit=200"),
  });
  const employees = Array.isArray(employeesData?.items) ? employeesData.items : [];

  const violations: DisciplineRecord[] =
    Array.isArray(rawViolations) ? rawViolations : [];

  const blocked: BlockedEmployee[] =
    Array.isArray(rawBlocked) ? rawBlocked : [];

  const filteredViolations = search.trim()
    ? violations.filter((v) =>
        v.full_name.toLowerCase().includes(search.toLowerCase()),
      )
    : violations;

  const filteredBlocked = search.trim()
    ? blocked.filter((b) =>
        b.full_name.toLowerCase().includes(search.toLowerCase()),
      )
    : blocked;

  const criticalCount = violations.filter((v) => v.severity === "critical").length;

  const createMutation = useMutation({
    mutationFn: (data: ReturnType<typeof defaultCreateForm>) =>
      apiRequest("POST", "/api/hr/discipline-records", {
        employee_id: Number(data.employee_id),
        violation_type: data.violation_type,
        discipline_type: data.discipline_type,
        severity: data.severity,
        violation_date: data.violation_date,
        description: data.description,
        fine_amount: data.fine_amount ? Number(data.fine_amount) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/discipline"] });
      setCreateDialog(false);
      setCreateForm(defaultCreateForm());
      toast({ title: "Intizom yozuvi qo'shildi" });
    },
    onError: () =>
      toast({ title: "Xatolik", description: "Yozuv qo'shishda xatolik", variant: "destructive" }),
  });

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="border-b border-border/50 pb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-[var(--ep-blue)]" />
          <h1 className="font-semibold text-base">Intizom</h1>
        </div>
        <Button onClick={() => setCreateDialog(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          {tLabel('hr.jarimaYozish', "Jarima yozish")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          icon={AlertTriangle}
          label="Jami qoidabuzarliklar"
          value={violations.length}
          color="bg-[var(--ep-primary-soft)] text-[var(--ep-primary)]"
        />
        <StatCard
          icon={XCircle}
          label="Kritik"
          value={criticalCount}
          color="bg-[rgba(192,67,47,.12)] text-[var(--ep-red)]"
        />
        <StatCard
          icon={ShieldOff}
          label="Bloklangan xodimlar"
          value={blocked.length}
          color="bg-[rgba(181,137,28,.14)] text-[var(--ep-yellow)]"
        />
      </div>

      {/* Error state */}
      {isError && <EPErrorState onRetry={refetch} />}

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Xodim bo'yicha qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="flex-1">
        <TabsList>
          <TabsTrigger value="violations">Qoidabuzarliklar</TabsTrigger>
          <TabsTrigger value="blocked">Bloklangan</TabsTrigger>
        </TabsList>

        {/* ── Violations tab ── */}
        <TabsContent value="violations" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Xodim</TableHead>
                  <TableHead>Bo'lim</TableHead>
                  <TableHead>Qoidabuzarlik turi</TableHead>
                  <TableHead>Jiddiylik</TableHead>
                  <TableHead>Sana</TableHead>
                  <TableHead>Jarima</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingViolations ? (
                  <TableSkeleton cols={7} />
                ) : filteredViolations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Qoidabuzarliklar topilmadi
                    </TableCell>
                  </TableRow>
                ) : (
                  (Array.isArray(filteredViolations) ? filteredViolations : []).map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.full_name}</TableCell>
                      <TableCell>{v.department}</TableCell>
                      <TableCell>{VIOLATION_TYPE_LABEL[v.violation_type] || v.violation_type}</TableCell>
                      <TableCell>
                        <SeverityBadge severity={v.severity} />
                      </TableCell>
                      <TableCell>
                        {new Date(v.violation_date).toLocaleDateString("uz-UZ")}
                      </TableCell>
                      <TableCell>
                        {v.fine_amount != null
                          ? `${v.fine_amount.toLocaleString()} so'm`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{STATUS_LABEL[v.status] || v.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Blocked tab ── */}
        <TabsContent value="blocked" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Xodim</TableHead>
                  <TableHead>Bo'lim</TableHead>
                  <TableHead>Bloklangan sana</TableHead>
                  <TableHead>Sabab</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingBlocked ? (
                  <TableSkeleton cols={4} />
                ) : filteredBlocked.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Bloklangan xodimlar topilmadi
                    </TableCell>
                  </TableRow>
                ) : (
                  (Array.isArray(filteredBlocked) ? filteredBlocked : []).map((b) => (
                    <TableRow key={b.employee_id}>
                      <TableCell className="font-medium">{b.full_name}</TableCell>
                      <TableCell>{b.department}</TableCell>
                      <TableCell>
                        {new Date(b.blocked_since).toLocaleDateString("uz-UZ")}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{b.reason}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Create discipline record dialog ── */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{tLabel('hr.intizomYozuviQoshish', "Intizom yozuvi qo'shish")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{tLabel('hr.xodim', "Xodim")}</Label>
              <Select
                value={createForm.employee_id}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, employee_id: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Xodimni tanlang" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{tLabel('hr.qoidabuzarlikTuri', "Qoidabuzarlik turi")}</Label>
                <Input
                  value={createForm.violation_type}
                  onChange={(e) => setCreateForm((f) => ({ ...f, violation_type: e.target.value }))}
                  placeholder="Kechikish, tartibsizlik..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>{tLabel('hr.intizomTuri', "Intizom turi")}</Label>
                <Input
                  value={createForm.discipline_type}
                  onChange={(e) => setCreateForm((f) => ({ ...f, discipline_type: e.target.value }))}
                  placeholder="Ogohlantiirsh, jarima..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{tLabel('hr.jiddiylikDarajasi', "Jiddiylik darajasi")}</Label>
                <Select
                  value={createForm.severity}
                  onValueChange={(v: typeof createForm.severity) =>
                    setCreateForm((f) => ({ ...f, severity: v }))
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{tLabel('hr.severityLow', "Past")}</SelectItem>
                    <SelectItem value="medium">{tLabel('hr.severityMedium', "O'rta")}</SelectItem>
                    <SelectItem value="high">{tLabel('hr.severityHigh', "Yuqori")}</SelectItem>
                    <SelectItem value="critical">{tLabel('hr.severityCritical', "Kritik")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{tLabel('hr.sana', "Sana")}</Label>
                <Input
                  type="date"
                  value={createForm.violation_date}
                  onChange={(e) => setCreateForm((f) => ({ ...f, violation_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{tLabel('hr.tavsif', "Tavsif")}</Label>
              <Textarea
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Qoidabuzarlik tavsifi..."
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{tLabel('hr.jarimaMiqdoriIxtiyoriy', "Jarima miqdori (ixtiyoriy)")}</Label>
              <Input
                type="number"
                value={createForm.fine_amount}
                onChange={(e) => setCreateForm((f) => ({ ...f, fine_amount: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>
              {tLabel('hr.bekorQilish', "Bekor qilish")}
            </Button>
            <Button
              onClick={() => createMutation.mutate(createForm)}
              disabled={
                createMutation.isPending ||
                !createForm.employee_id ||
                !createForm.violation_type ||
                !createForm.description
              }
            >
              {createMutation.isPending
                ? tLabel('hr.saqlanmoqda', "Saqlanmoqda...")
                : tLabel('hr.saqlash', "Saqlash")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
