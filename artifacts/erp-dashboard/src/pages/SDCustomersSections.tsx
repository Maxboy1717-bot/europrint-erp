/**
 * @module SDCustomersSections
 * @description Major section components: KPI cards, filter bar, and customer table.
 */

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, Building2, Search, X, User, Phone,
  TrendingUp, UserCheck, BarChart3, Sparkles, ChevronRight,
} from "lucide-react";
import { fmtMoney } from "@/components/sd/helpers";
import { Customer, SEGMENT_CONF, STATUS_CONF } from "./SDCustomersTypes";
import { EPKpiCard } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

/* ── Small reusable atoms ─────────────────────────────────────── */

export function SegBadge({ seg }: { seg?: string }) {
  const { t } = useTranslation("common");
  const s = SEGMENT_CONF[seg || "C"] || SEGMENT_CONF.C;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ring-1 ${s.bg} ${s.text} ${s.ring}`}>
      {s.icon} <span className="hidden sm:inline">— {s.label}</span>
    </span>
  );
}

export function StatusDot({ status }: { status?: string }) {
  const s = STATUS_CONF[status || "active"] || STATUS_CONF.active;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

/* ── KPI Cards ────────────────────────────────────────────────── */

interface StatsProps {
  total: number;
  segs: Record<string, number>;
  totalVal: number;
  activeCount: number;
}

export function CustomerKpiCards({ total, segs, totalVal }: StatsProps) {
  const { t } = useTranslation("common");
  // Migrated to EPKpiCard — flat module hues, 42px round icon tile,
  // animated count-up, stagger entrance (0/60/120/180/240ms).
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      <EPKpiCard
        label={t("jamiMijozlar")}
        value={total}
        icon={Users}
        iconBg="sd"
        enterDelayMs={0}
      />
      <EPKpiCard
        label="VIP (A)"
        value={segs.A || 0}
        icon={Sparkles}
        iconBg="var(--ep-green)"
        enterDelayMs={60}
      />
      <EPKpiCard
        label="Doimiy (B)"
        value={segs.B || 0}
        icon={UserCheck}
        iconBg="sd"
        enterDelayMs={120}
      />
      <EPKpiCard
        label="Oddiy (C)"
        value={segs.C || 0}
        icon={BarChart3}
        iconBg="primary"
        enterDelayMs={180}
      />
      <EPKpiCard
        label={t("umumiyQiymat")}
        staticValue={fmtMoney(totalVal)}
        icon={TrendingUp}
        iconBg="var(--ep-purple)"
        enterDelayMs={240}
      />
    </div>
  );
}

/* ── Filter Bar ───────────────────────────────────────────────── */

interface FilterBarProps {
  search: string;
  setSearch: (v: string) => void;
  segFilter: string;
  setSegFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  hasFilters: boolean;
  onClear: () => void;
}

export function CustomerFilterBar({
  search, setSearch,
  segFilter, setSegFilter,
  statusFilter, setStatusFilter,
  hasFilters, onClear,
}: FilterBarProps) {
  const { t } = useTranslation("common");
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9 h-9 rounded-lg"
          placeholder="Qidirish (nom, STIR, kod...)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          data-testid="input-search-customers"
        />
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {["all", "A", "B", "C", "D"].map(s => (
          <button key={s}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all
              ${segFilter === s
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card hover:bg-muted border-border text-muted-foreground hover:text-foreground"}`}
            onClick={() => setSegFilter(s)}
            data-testid={`btn-seg-${s}`}>
            {s === "all" ? "Barchasi" : `${s} — ${SEGMENT_CONF[s]?.label}`}
          </button>
        ))}
      </div>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-full sm:w-[130px] h-9 text-xs" data-testid="select-status-filter">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("barchaHolat")}</SelectItem>
          <SelectItem value="active">{t("aktiv")}</SelectItem>
          <SelectItem value="inactive">{t("inactive")}</SelectItem>
          <SelectItem value="blacklist">{t("qoraRoyxat")}</SelectItem>
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="ghost" size="sm" className="h-9 text-xs text-muted-foreground" onClick={onClear}>
          <X className="h-3.5 w-3.5 mr-1" />{t("tozalash")}
        </Button>
      )}
    </div>
  );
}

/* ── Customer Table ───────────────────────────────────────────── */

interface CustomerTableProps {
  customers: Customer[];
  filtered: Customer[];
  isLoading: boolean;
  onSelect: (id: number) => void;
}

export function CustomerTable({ customers, filtered, isLoading, onSelect }: CustomerTableProps) {
  const { t } = useTranslation("common");
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`k-${i}`} className="rounded-xl border p-4">
            <Skeleton className="h-5 w-48 mb-2 rounded-lg" />
            <Skeleton className="h-4 w-32 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
          <Users className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="text-muted-foreground font-medium">{t("mijozlarTopilmadi")}</p>
        <p className="text-xs text-muted-foreground/70 mt-1">{t("filtrlarniOzgartiringYokiYangiMijoz")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1.5">
        {filtered.map((c) => {
          const seg = c.customerCategory || c.segment || "C";
          const val = Number(c.lifetime_value || 0);
          return (
            <div key={c.id}
              className="group relative flex items-center gap-4 rounded-xl border bg-card p-3 lg:p-4 cursor-pointer
                hover:bg-accent/50 hover:border-primary/20 hover:shadow-sm transition-all duration-150"
              onClick={() => onSelect(c.id)}
              data-testid={`row-customer-${c.id}`}>
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                ${SEGMENT_CONF[seg]?.bg || "bg-muted"} ${SEGMENT_CONF[seg]?.text || ""}`}>
                {c.customerType === "individual"
                  ? <User className="h-4 w-4" />
                  : <Building2 className="h-5 w-5" />}
              </div>

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate">{c.name}</p>
                  <SegBadge seg={seg} />
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  {(c.stir || c.inn) && <span>STIR: {c.stir || c.inn}</span>}
                  {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
                  {!c.stir && !c.inn && !c.phone && c.industry && <span>{c.industry}</span>}
                </div>
              </div>

              {/* Stats */}
              <div className="hidden md:flex items-center gap-6 shrink-0">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{t("buyurtmalar")}</p>
                  <p className="text-sm font-semibold">{c.order_count || 0}</p>
                </div>
                <div className="text-right min-w-[100px]">
                  <p className="text-xs text-muted-foreground">{t("qiymat")}</p>
                  <p className="text-sm font-semibold">{fmtMoney(val)}</p>
                </div>
                <div className="text-center min-w-[60px]">
                  <StatusDot status={c.status} />
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="text-center py-2">
        <p className="text-xs text-muted-foreground">
          {filtered.length} / {customers.length} mijoz ko'rsatilmoqda
        </p>
      </div>
    </>
  );
}
