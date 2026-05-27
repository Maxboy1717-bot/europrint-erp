/**
 * @module Discipline
 * @description Route-level page component for HR Discipline management.
 * Route: /discipline
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ShieldCheck, Search, AlertTriangle, XCircle, ShieldOff } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

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

const VIOLATION_TYPE_LABEL: Record<string, string> = {
  absence:        "Sababsiz kelmagan",
  misconduct:     "Xulq-atvor buzilishi",
  late_arrival:   "Kech kelish",
  insubordination:"Buyruqqa itoatsizlik",
  harassment:     "Ta'qib",
  theft:          "O'g'irlik",
  safety_violation:"Xavfsizlik qoidasi buzilishi",
  performance:    "Yomon ko'rsatkich",
  other:          "Boshqa",
};

const STATUS_LABEL: Record<string, string> = {
  open:       "Ochiq",
  closed:     "Yopilgan",
  pending:    "Kutilmoqda",
  resolved:   "Hal qilindi",
  appealed:   "Shikoyat qilindi",
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

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function Discipline() {
  const { t } = useTranslation("common");
  const [tab, setTab]       = useState<"violations" | "blocked">("violations");
  const [search, setSearch] = useState("");

  const { data: rawViolations, isLoading: loadingViolations } =
    useQuery<DisciplineRecord[]>({ queryKey: ["/api/hr/discipline"] });

  const { data: rawBlocked, isLoading: loadingBlocked } =
    useQuery<BlockedEmployee[]>({ queryKey: ["/api/hr/discipline/blocked"] });

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

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="border-b border-border/50 pb-3 flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-[var(--ep-blue)]" />
        <h1 className="font-semibold text-base">Intizom</h1>
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
                  filteredViolations.map((v) => (
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
                  filteredBlocked.map((b) => (
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
    </div>
  );
}
