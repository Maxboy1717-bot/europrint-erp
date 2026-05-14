/**
 * @module HRDashboardV2Tab
 * @description The "HR V2 — Jonli Holat" tab: live KPI widgets, AI interview
 * pipeline, daily-report stats, blocked-employee list, adaptation at-risk list,
 * and module quick-links grid.
 */

import {
  Lock, Flame, TrendingUp, MessageSquare, UserMinus,
  CheckCircle2, XCircle, Clock, Wrench, Gauge, ChevronRight,
} from "lucide-react";
import type { DailyStats, AdaptationRiskEmployee, AiPipeline, ModuleLink } from "./HRDashboardTypes";

// ---------------------------------------------------------------------------
// V2LiveKpiRow
// ---------------------------------------------------------------------------

interface V2LiveKpiRowProps {
  blockedCount: number;
  adaptationAtRiskCount: number;
  activePipCount: number;
  activeSurveyCount: number;
  activeOffboardingCount: number;
}

export function V2LiveKpiRow({
  blockedCount, adaptationAtRiskCount, activePipCount,
  activeSurveyCount, activeOffboardingCount,
}: V2LiveKpiRowProps) {
  const widgets = [
    { label: "Bloklangan",  value: blockedCount,           icon: Lock,         accent: blockedCount > 0 ? "text-[var(--ep-red)]"    : "text-[var(--ep-green)]",  bg: blockedCount > 0 ? "bg-red-500/10"    : "bg-green-500/10",  desc: blockedCount > 0 ? "Faol bloklash" : "Bloklash yo'q" },
    { label: "Xavf ostida", value: adaptationAtRiskCount,  icon: Flame,        accent: "text-[var(--ep-yellow)]",                                          bg: "bg-amber-500/10",                                        desc: "Moslashuv balli < 3.0" },
    { label: "Faol PIP",    value: activePipCount,         icon: TrendingUp,   accent: "text-[var(--ep-blue)]",                                           bg: "bg-blue-500/10",                                         desc: "Rivojlanish rejasi" },
    { label: "eNPS So'rov", value: activeSurveyCount,      icon: MessageSquare,accent: "text-[var(--ep-purple)]",                                         bg: "bg-purple-500/10",                                       desc: "Faol so'rov" },
    { label: "Offboarding", value: activeOffboardingCount, icon: UserMinus,    accent: activeOffboardingCount > 0 ? "text-[var(--ep-primary)]" : "text-[var(--ep-green)]", bg: activeOffboardingCount > 0 ? "bg-orange-500/10" : "bg-green-500/10", desc: activeOffboardingCount > 0 ? "Faol jarayon" : "Jarayon yo'q" },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-5 gap-3">
      {widgets.map((w) => (
        <div key={w.label} className={`rounded-xl p-4 flex items-center gap-3 ${w.bg} border border-border/30`}>
          <w.icon className={`w-7 h-7 shrink-0 ${w.accent}`} />
          <div>
            <div className={`text-2xl font-bold ${w.accent}`}>{w.value}</div>
            <div className="text-xs font-medium text-foreground">{w.label}</div>
            <div className="text-[10px] text-muted-foreground">{w.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AiPipelineCard
// ---------------------------------------------------------------------------

export function AiPipelineCard({ pipeline }: { pipeline: AiPipeline }) {
  const total = pipeline.pending + pipeline.active + pipeline.completed || 1;
  const bars = [
    { label: "Kutmoqda", val: pipeline.pending,   color: "text-amber-400", bar: "bg-amber-400" },
    { label: "Faol",     val: pipeline.active,    color: "text-blue-400",  bar: "bg-blue-400" },
    { label: "Tugagan",  val: pipeline.completed, color: "text-green-400", bar: "bg-green-400" },
  ];
  return (
    <div className="bg-card rounded-xl border border-border/40 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <span className="text-lg">🤖</span> AI Intervyu Pipeline
        </h3>
        <a href="/ai-hr/interviews" className="text-xs text-primary hover:underline flex items-center gap-1">
          Barchasi <ChevronRight className="w-3 h-3" />
        </a>
      </div>
      <div className="flex gap-3">
        {bars.map((p) => (
          <div key={p.label} className="flex-1 text-center">
            <div className={`text-2xl font-bold ${p.color}`}>{p.val}</div>
            <div className="text-xs text-muted-foreground mb-1">{p.label}</div>
            <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
              <div className={`h-full ${p.bar} rounded-full transition-all`} style={{ width: `${(p.val / total) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      {(pipeline.pending + pipeline.active + pipeline.completed) === 0 && (
        <p className="text-xs text-muted-foreground/60 text-center mt-3">AI intervyu sessiyalari yo'q</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DailyReportsCard
// ---------------------------------------------------------------------------

interface DailyReportsCardProps {
  dailyStats: DailyStats | undefined;
  operatorReportsToday: number;
  operatorTotal: number;
}

export function DailyReportsCard({ dailyStats, operatorReportsToday, operatorTotal }: DailyReportsCardProps) {
  const statItems = [
    { label: "Topshirdi",   val: dailyStats?.stats?.submitted_count   ?? dailyStats?.submitted   ?? "—", color: "text-green-400", icon: CheckCircle2 },
    { label: "Yo'q",        val: dailyStats?.stats?.auto_absent_count ?? dailyStats?.absent      ?? "—", color: "text-red-400",   icon: XCircle },
    { label: "Kutilmoqda",  val: dailyStats?.stats?.pending_count     ?? dailyStats?.pending     ?? "—", color: "text-amber-400", icon: Clock },
  ];
  return (
    <div className="bg-card rounded-xl border border-border/40 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <span className="text-lg">📋</span> Kunlik Hisobotlar (bugun)
        </h3>
        <a href="/hr/daily-reports" className="text-xs text-primary hover:underline flex items-center gap-1">
          Barchasi <ChevronRight className="w-3 h-3" />
        </a>
      </div>
      <div className="flex gap-3 mb-3">
        {statItems.map((s) => (
          <div key={s.label} className="flex-1 flex flex-col items-center gap-1">
            <s.icon className={`w-5 h-5 ${s.color}`} />
            <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
      {operatorTotal > 0 && (
        <div className="border-t border-border pt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-[var(--ep-blue)]">
            <Wrench className="w-3.5 h-3.5" />
            <span className="font-medium">Operatorlar:</span>
            <span className="font-bold">{operatorReportsToday}/{operatorTotal}</span>
          </div>
          {dailyStats?.stats?.avg_operator_oee && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Gauge className="w-3 h-3" />
              <span>OEE: <span className="font-semibold text-[var(--ep-blue)]">{dailyStats.stats.avg_operator_oee}%</span></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BlockedEmployeesList
// ---------------------------------------------------------------------------

type BlockedEmp = { id?: number | string; employeeName?: string; employee_name?: string; employee_id?: number; blockType?: string; block_type?: string };

export function BlockedEmployeesList({ blockedEmps, blockedCount }: { blockedEmps: BlockedEmp[] | undefined; blockedCount: number }) {
  if (blockedCount === 0) return null;
  const list = Array.isArray(blockedEmps) ? blockedEmps : [];
  return (
    <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
      <h3 className="font-semibold text-[var(--ep-red)] flex items-center gap-2 mb-3">
        <Lock className="w-4 h-4" /> Bloklangan xodimlar ({blockedCount})
      </h3>
      <div className="space-y-2">
        {list.slice(0, 5).map((emp) => (
          <div key={emp.id} className="flex items-center justify-between bg-card rounded-lg px-3 py-2 text-sm">
            <span className="font-medium text-foreground">{emp.employeeName ?? emp.employee_name ?? `ID: ${emp.employee_id ?? emp.id}`}</span>
            <span className="text-xs text-red-400">{emp.blockType ?? emp.block_type ?? "Bloklangan"}</span>
          </div>
        ))}
        {blockedCount > 5 && (
          <a href="/discipline" className="text-xs text-primary hover:underline block text-center mt-1">
            + {blockedCount - 5} ta boshqa...
          </a>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AdaptationAtRiskList
// ---------------------------------------------------------------------------

export function AdaptationAtRiskList({ atRiskEmps, adaptationAtRiskCount }: { atRiskEmps: AdaptationRiskEmployee[] | undefined; adaptationAtRiskCount: number }) {
  if (adaptationAtRiskCount === 0) return null;
  const list = Array.isArray(atRiskEmps) ? atRiskEmps : [];
  return (
    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
      <h3 className="font-semibold text-[var(--ep-yellow)] dark:text-amber-400 flex items-center gap-2 mb-3">
        <Flame className="w-4 h-4" /> Moslashuv xavf ostida — ball &lt; 3.0 ({adaptationAtRiskCount})
      </h3>
      <div className="space-y-2">
        {list.slice(0, 5).map((emp) => (
          <div key={emp.id} className="flex items-center justify-between bg-card rounded-lg px-3 py-2 text-sm">
            <div>
              <span className="font-medium text-foreground">{emp.employee_name ?? `ID: ${emp.employee_id}`}</span>
              {emp.department_name && <span className="text-xs text-muted-foreground ml-2">{emp.department_name}</span>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {emp.mentor_name && <span className="text-xs text-muted-foreground">Mentor: {emp.mentor_name}</span>}
              <span className="text-xs font-bold text-[var(--ep-yellow)] dark:text-amber-400">
                {emp.adaptation_score ?? Math.round(((emp.progress_percent ?? 0) / 20) * 10) / 10} / 5.0
              </span>
            </div>
          </div>
        ))}
        {adaptationAtRiskCount > 5 && (
          <a href="/hr/employees" className="text-xs text-primary hover:underline block text-center mt-1">
            + {adaptationAtRiskCount - 5} ta boshqa...
          </a>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ModuleLinksGrid
// ---------------------------------------------------------------------------

export function ModuleLinksGrid({ modules }: { modules: ModuleLink[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Modullar</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {modules.map((mod) => (
          <a
            key={mod.href}
            href={mod.href}
            className="bg-card rounded-xl p-4 border border-surface-container hover:border-primary transition-all group cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg ${mod.color} flex items-center justify-center text-lg shrink-0`}>{mod.icon}</div>
              <div>
                <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{mod.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{mod.desc}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
