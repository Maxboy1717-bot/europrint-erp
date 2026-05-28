/**
 * @module HRAlumni
 * @description Route-level page component for HR Alumni (Former Employees).
 * Route: /hr/alumni
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { UserPlus, Search, Users, RefreshCw, CalendarX } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { EPComingSoon, EPErrorState } from "@/components/ep";
import { isNotImplementedError } from "@/hooks/useNotImplemented";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AlumniItem {
  id: number;
  full_name: string;
  department: string;
  position: string;
  hire_date: string;
  termination_date: string;
  reason: string;
  boomerang_eligible: boolean;
  last_salary: number;
  email?: string;
  phone?: string;
}

interface AlumniResponse {
  items: AlumniItem[];
  total: number;
}

// ── Skeleton rows ──────────────────────────────────────────────────────────────

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
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

// ── Date helpers ───────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("uz-UZ");
  } catch {
    return dateStr;
  }
}

function isThisYear(dateStr: string): boolean {
  try {
    return new Date(dateStr).getFullYear() === new Date().getFullYear();
  } catch {
    return false;
  }
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function HRAlumni() {
  const { t } = useTranslation("common");
  const [search, setSearch] = useState("");

  const { data: rawResponse, isLoading, isError, error, refetch } =
    useQuery<AlumniResponse>({ queryKey: ["/api/hr/alumni"] });

  // Handle both wrapped { items, total } and bare array responses safely
  const items: AlumniItem[] = (() => {
    if (!rawResponse) return [];
    if (Array.isArray(rawResponse)) return rawResponse as AlumniItem[];
    if (Array.isArray((rawResponse as AlumniResponse).items)) {
      return (rawResponse as AlumniResponse).items;
    }
    return [];
  })();

  const total: number = (() => {
    if (!rawResponse) return 0;
    if (Array.isArray(rawResponse)) return (rawResponse as AlumniItem[]).length;
    return (rawResponse as AlumniResponse).total ?? items.length;
  })();

  const filtered: AlumniItem[] = search.trim()
    ? items.filter((a) =>
        a.full_name.toLowerCase().includes(search.toLowerCase()),
      )
    : items;

  const boomerangCount = items.filter((a) => a.boomerang_eligible).length;
  const thisYearCount  = items.filter((a) => isThisYear(a.termination_date)).length;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="border-b border-border/50 pb-3 flex items-center gap-3">
        <UserPlus className="h-5 w-5 text-[var(--ep-blue)]" />
        <h1 className="font-semibold text-base">Alumni</h1>
        <span className="text-sm text-muted-foreground">(Sobiq xodimlar)</span>
      </div>

      {isError && isNotImplementedError(error)
        ? <EPComingSoon />
        : isError
          ? <EPErrorState onRetry={refetch} />
          : (
      <>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          icon={Users}
          label="Jami alumni"
          value={total}
          color="bg-[var(--ep-primary-soft)] text-[var(--ep-primary)]"
        />
        <StatCard
          icon={RefreshCw}
          label="Boomerang mumkin"
          value={boomerangCount}
          color="bg-[rgba(46,138,90,.12)] text-[var(--ep-green)]"
        />
        <StatCard
          icon={CalendarX}
          label="Bu yil ketganlar"
          value={thisYearCount}
          color="bg-[rgba(181,137,28,.14)] text-[var(--ep-yellow)]"
        />
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Ism bo'yicha qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-md border flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Xodim</TableHead>
              <TableHead>Bo'lim</TableHead>
              <TableHead>Lavozim</TableHead>
              <TableHead>Ishga kirgan</TableHead>
              <TableHead>Ishdan chiqqan</TableHead>
              <TableHead>Ketish sababi</TableHead>
              <TableHead>Boomerang</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton cols={7} />
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Alumni topilmadi
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.full_name}</TableCell>
                  <TableCell>{a.department}</TableCell>
                  <TableCell>{a.position}</TableCell>
                  <TableCell>{formatDate(a.hire_date)}</TableCell>
                  <TableCell>{formatDate(a.termination_date)}</TableCell>
                  <TableCell
                    className="max-w-[180px] truncate text-muted-foreground"
                    title={a.reason}
                  >
                    {a.reason}
                  </TableCell>
                  <TableCell>
                    {a.boomerang_eligible ? (
                      <Badge variant="success">Ha</Badge>
                    ) : (
                      <Badge variant="neutral">Yo'q</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      </>
          )}
    </div>
  );
}
