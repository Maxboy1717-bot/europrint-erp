/**
 * @module HRConflict
 * @description Route-level page component for HR Conflict Management.
 * Route: /hr/conflict
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
import { MessageSquare, AlertCircle, Clock, CheckCircle2, Plus } from "lucide-react";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from "@/lib/i18n";
import { apiRequest } from "@/lib/api-request";
import { useToast } from "@/hooks/use-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ConflictReport {
  id: number;
  party1_name: string;
  party2_name: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "mediation" | "resolved";
  created_at: string;
  resolved_at?: string;
}

// ── Badge helpers ──────────────────────────────────────────────────────────────

const SEVERITY_VARIANT: Record<string, "success" | "warning" | "coral" | "danger"> = {
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
};

const STATUS_VARIANT: Record<string, "danger" | "warning" | "success"> = {
  open:       "danger",
  mediation:  "warning",
  resolved:   "success",
};

const STATUS_LABEL: Record<string, string> = {
  open:       "Ochiq",
  mediation:  "Vositachilikda",
  resolved:   "Hal qilingan",
};

function SeverityBadge({ severity }: { severity: string }) {
  const variant = SEVERITY_VARIANT[severity] ?? "warning";
  const label   = SEVERITY_LABEL[severity]   ?? severity;
  return <Badge variant={variant}>{label}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const variant = STATUS_VARIANT[status as keyof typeof STATUS_VARIANT] ?? "warning";
  const label   = STATUS_LABEL[status]   ?? status;
  return <Badge variant={variant}>{label}</Badge>;
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

// ── Main Page ──────────────────────────────────────────────────────────────────

type StatusFilter = "all" | "open" | "mediation" | "resolved";

const SEVERITY_OPTIONS = [
  { value: "low",      label: "Past" },
  { value: "medium",   label: "O'rta" },
  { value: "high",     label: "Yuqori" },
  { value: "critical", label: "Kritik" },
] as const;

export default function HRConflict() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [open, setOpen] = useState(false);
  const [party1, setParty1] = useState("");
  const [party2, setParty2] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("low");

  const createMutation = useMutation({
    mutationFn: (data: { party1: number; party2: number; description: string; severity: string }) =>
      apiRequest("POST", "/api/hr/conflict-reports", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/conflict-reports"] });
      setOpen(false);
      setParty1(""); setParty2(""); setDescription(""); setSeverity("low");
      toast({ title: "Konflikt qayd etildi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const canSubmit =
    Number.isInteger(parseInt(party1, 10)) && parseInt(party1, 10) > 0 &&
    Number.isInteger(parseInt(party2, 10)) && parseInt(party2, 10) > 0 &&
    description.trim().length >= 5;

  function handleSubmit() {
    if (!canSubmit) return;
    createMutation.mutate({
      party1:      parseInt(party1, 10),
      party2:      parseInt(party2, 10),
      description: description.trim(),
      severity,
    });
  }

  const { data: rawReports, isLoading, isError, error, refetch } =
    useQuery<ConflictReport[]>({ queryKey: ["/api/hr/conflict-reports"] });

  const reports: ConflictReport[] =
    Array.isArray(rawReports) ? rawReports : [];

  const filtered: ConflictReport[] =
    statusFilter === "all"
      ? reports
      : reports.filter((r) => r.status === statusFilter);

  const openCount       = reports.filter((r) => r.status === "open").length;
  const mediationCount  = reports.filter((r) => r.status === "mediation").length;
  const resolvedCount   = reports.filter((r) => r.status === "resolved").length;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="border-b border-border/50 pb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-[var(--ep-blue)]" />
          <h1 className="font-semibold text-base">Konflikt Boshqaruvi</h1>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Yangi konflikt
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          icon={AlertCircle}
          label="Ochiq"
          value={openCount}
          color="bg-[rgba(192,67,47,.12)] text-[var(--ep-red)]"
        />
        <StatCard
          icon={Clock}
          label="Vositachilikda"
          value={mediationCount}
          color="bg-[rgba(181,137,28,.14)] text-[var(--ep-yellow)]"
        />
        <StatCard
          icon={CheckCircle2}
          label="Hal qilingan"
          value={resolvedCount}
          color="bg-[rgba(46,138,90,.12)] text-[var(--ep-green)]"
        />
      </div>

      {/* Status filter tabs */}
      <Tabs
        value={statusFilter}
        onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        className="flex-1"
      >
        <TabsList>
          <TabsTrigger value="all">Barchasi</TabsTrigger>
          <TabsTrigger value="open">Ochiq</TabsTrigger>
          <TabsTrigger value="mediation">Vositachilikda</TabsTrigger>
          <TabsTrigger value="resolved">Hal qilingan</TabsTrigger>
        </TabsList>

        {/* Shared table across all filter tabs */}
        {(["all", "open", "mediation", "resolved"] as StatusFilter[]).map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ishtirokchi 1</TableHead>
                    <TableHead>Ishtirokchi 2</TableHead>
                    <TableHead>Jiddiylik</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead>Tavsif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableSkeleton cols={6} />
                  ) : isError ? (
                    <TableRow>
                      <TableCell colSpan={6} className="p-0">
                        <EPErrorState variant="inline" error={error} onRetry={() => refetch()} />
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Konfliktlar topilmadi
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.party1_name}</TableCell>
                        <TableCell>{r.party2_name}</TableCell>
                        <TableCell>
                          <SeverityBadge severity={r.severity} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={r.status} />
                        </TableCell>
                        <TableCell>
                          {new Date(r.created_at).toLocaleDateString("uz-UZ")}
                        </TableCell>
                        <TableCell
                          className="max-w-[220px] truncate text-muted-foreground"
                          title={r.description}
                        >
                          {r.description}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Create conflict dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yangi konflikt qayd etish</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Ishtirokchi 1 ID (xodim #)</label>
              <Input
                type="number"
                min={1}
                placeholder="Masalan: 5"
                value={party1}
                onChange={(e) => setParty1(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Ishtirokchi 2 ID (xodim #)</label>
              <Input
                type="number"
                min={1}
                placeholder="Masalan: 12"
                value={party2}
                onChange={(e) => setParty2(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tavsif</label>
              <Input
                placeholder="Konflikt tafsilotlari..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Jiddiylik</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as typeof severity)}
              >
                {SEVERITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Bekor</Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || createMutation.isPending}
            >
              {createMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
