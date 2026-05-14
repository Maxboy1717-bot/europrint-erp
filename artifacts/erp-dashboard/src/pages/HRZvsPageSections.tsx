/**
 * @module HRZvsPageSections
 * @description List and filter UI sections for HRZvsPage.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Search, CheckCircle, XCircle, Clock, AlertTriangle, ArrowUp } from "lucide-react";
import { type ZvsRequest, STATUS_MAP, PRIORITY_MAP, formatAmount } from "./HRZvsPageTypes";
import { useTranslation } from '@/lib/i18n';

// ── ZvsFilterBar ──────────────────────────────────────────────────────────────

interface ZvsFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
}

export function ZvsFilterBar({ search, onSearchChange, statusFilter, onStatusChange }: ZvsFilterBarProps) {
  const { t } = useTranslation("common");
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("arizaQidirish")}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
          data-testid="input-search-zvs"
        />
      </div>
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "approved", "rejected"].map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => onStatusChange(s)}
            data-testid={`filter-status-${s}`}
          >
            {s === "all" ? "Barchasi" : STATUS_MAP[s]?.label ?? s}
          </Button>
        ))}
      </div>
    </div>
  );
}

// ── ZvsSkeletonList ───────────────────────────────────────────────────────────

export function ZvsSkeletonList() {
  return (
    <div className="space-y-3">
      {([1, 2, 3]).map((i) => (
        <Card key={`k-${i}`}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48 rounded-lg" />
              <Skeleton className="h-3 w-32 rounded-lg" />
            </div>
            <Skeleton className="h-6 w-24 rounded-lg" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── ZvsEmptyState ─────────────────────────────────────────────────────────────

export function ZvsEmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          {hasSearch ? "Qidiruv natijasi topilmadi" : "ZVS arizalari mavjud emas"}
        </p>
      </CardContent>
    </Card>
  );
}

// ── ZvsCard ───────────────────────────────────────────────────────────────────

interface ZvsCardProps {
  r: ZvsRequest;
  onApprove: (id: string | number) => void;
  onReject: (id: string | number) => void;
}

export function ZvsCard({ r, onApprove, onReject }: ZvsCardProps) {
  const { t } = useTranslation("common");
  const status   = r.status   ?? "pending";
  const priority = r.priority ?? "normal";
  const sc = STATUS_MAP[status]     ?? STATUS_MAP.pending;
  const pc = PRIORITY_MAP[priority] ?? PRIORITY_MAP.normal;
  const submitter = r.submitter_name ?? r.submitterName;
  const weekDate  = r.week_date ?? r.weekDate;

  const statusIcon =
    status === "pending"  ? <Clock       className="h-3 w-3" /> :
    status === "approved" ? <CheckCircle className="h-3 w-3" /> :
    <XCircle className="h-3 w-3" />;

  const priorityIcon =
    priority === "high"   ? <ArrowUp      className="h-3 w-3" /> :
    priority === "urgent" ? <AlertTriangle className="h-3 w-3" /> :
    null;

  return (
    <Card className="hover:shadow-md transition-shadow" data-testid={`card-zvs-${r.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm truncate">{r.purpose}</p>
              {priority !== "normal" && (
                <span className={`flex items-center gap-0.5 text-xs ${pc.color}`}>
                  {priorityIcon}{pc.label}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
              <span className="text-sm font-semibold">{formatAmount(r.amount)}</span>
              {submitter && <span className="text-xs text-muted-foreground">{submitter}</span>}
              {weekDate && (
                <span className="text-xs text-muted-foreground">
                  Hafta: {new Date(weekDate).toLocaleDateString("uz-UZ")}
                </span>
              )}
            </div>
            {r.comment && (
              <p className="text-xs text-muted-foreground mt-1 italic">"{r.comment}"</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={sc.variant} className="gap-1 text-xs">
              {statusIcon}{sc.label}
            </Badge>
            {status === "pending" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs text-[var(--ep-green)] border-green-200 hover:bg-green-50"
                  onClick={() => onApprove(r.id)}
                  data-testid={`button-approve-zvs-${r.id}`}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {t("verify")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs text-destructive border-destructive/20 hover:bg-destructive/10"
                  onClick={() => onReject(r.id)}
                  data-testid={`button-reject-zvs-${r.id}`}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  {t("reject")}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── ZvsCardList ───────────────────────────────────────────────────────────────

interface ZvsCardListProps {
  items: ZvsRequest[];
  onApprove: (id: string | number) => void;
  onReject: (id: string | number) => void;
}

export function ZvsCardList({ items, onApprove, onReject }: ZvsCardListProps) {
  return (
    <div className="space-y-3">
      {(Array.isArray(items) ? items : []).map((r) => (
        <ZvsCard key={r.id} r={r} onApprove={onApprove} onReject={onReject} />
      ))}
    </div>
  );
}
