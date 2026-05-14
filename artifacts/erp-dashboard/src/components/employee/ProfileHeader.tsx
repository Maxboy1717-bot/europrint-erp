/**
 * @module ProfileHeader
 * @description React UI component.
 */

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  UserCheck, Hash, AlertTriangle, AlertCircle,
  Edit2, TrendingUp, Clock, CheckSquare, Star,
  Briefcase, Calendar, Target, Award, ChevronRight,
} from "lucide-react";
import { useTranslation } from '@/lib/i18n';
import type {
  Employee, AbcAnalysis, OrgStructureAssignment,
  EmploymentContract, Certificate, SalaryHistoryRecord,
} from "@/pages/employee-profile/profile-types";

// ── Types ────────────────────────────────────────────────────────────────────

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  punctualPercentage: number;
}

interface ProfileHeaderProps {
  employee: Employee;
  abcData?: AbcAnalysis;
  orgStructureData?: { primary: OrgStructureAssignment; all: OrgStructureAssignment[] };
  contracts?: EmploymentContract[];
  certificatesData?: Certificate[];
  payrollSummary?: { totalSalary?: number; periodName?: string; [key: string]: unknown };
  salaryHistory?: SalaryHistoryRecord[];
  expiredCerts: Certificate[];
  expiringSoonCerts: Certificate[];
  getInitials: (name: string) => string;
  onEdit?: () => void;
  // Real attendance data
  attendanceStats?: AttendanceStats;
  attendanceData?: Array<{ status: string; checkIn?: string; checkOut?: string; date?: string }>;
}

// ── Mini helpers ─────────────────────────────────────────────────────────────

function workYears(hireDate?: string | null) {
  if (!hireDate) return null;
  const ms = Date.now() - new Date(hireDate).getTime();
  const y = Math.floor(ms / (365.25 * 24 * 3600 * 1000));
  const m = Math.floor((ms % (365.25 * 24 * 3600 * 1000)) / (30.44 * 24 * 3600 * 1000));
  return y > 0 ? `${y} yil ${m} oy` : `${m} oy`;
}

function fmtSalary(v: number | string | null | undefined) {
  if (!v) return null;
  const n = Number(v);
  if (!n) return null;
  return n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M UZS`
    : `${(n / 1_000).toFixed(0)}K UZS`;
}

// ── Circular progress SVG ─────────────────────────────────────────────────────

function CircleProgress({ pct, color, size = 80, stroke = 7, label, sub }: {
  pct: number; color: string; size?: number; stroke?: number; label: string; sub: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.6s ease" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ fontSize: 15, fontWeight: 800, color }}>{pct}%</span>
        </div>
      </div>
      <div className="text-center">
        <p style={{ fontSize: 12, fontWeight: 700, color: "#1a202c" }}>{label}</p>
        <p style={{ fontSize: 10, color: "#718096" }}>{sub}</p>
      </div>
    </div>
  );
}

// ── Mini bar chart ────────────────────────────────────────────────────────────

function MiniBar({ bars, color }: { bars: number[]; color: string }) {
  const max = Math.max(...bars, 1);
  const days = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
  return (
    <div className="flex items-end gap-1.5 h-12">
      {bars.map((v, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
          <div
            style={{
              width: "100%", borderRadius: 4,
              height: `${Math.round((v / max) * 40)}px`,
              background: i === 4 ? color : `${color}55`,
              transition: "height 0.4s ease",
              minHeight: 4,
            }}
          />
          <span style={{ fontSize: 8, color: "#a0aec0" }}>{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ProfileHeader({
  employee,
  abcData,
  orgStructureData,
  contracts,
  payrollSummary,
  salaryHistory,
  expiredCerts,
  expiringSoonCerts,
  getInitials,
  onEdit,
  attendanceStats,
  attendanceData,
}: ProfileHeaderProps) {
  const { t } = useTranslation("common");

  const salary = fmtSalary(payrollSummary?.totalSalary)
    ?? fmtSalary(salaryHistory?.[0]?.newSalary)
    ?? fmtSalary(employee.salary);

  const exp = workYears(employee.hireDate);

  const position = orgStructureData?.primary?.positionName
    || employee.positionName
    || "Lavozim tayinlanmagan";

  const department = orgStructureData?.primary?.departmentName
    || employee.departmentName
    || "";

  // ── ABC: real score from abcData, fallback to grade mapping ─────────────
  const abcPct = abcData
    ? (typeof abcData.score === "number"
        ? Math.min(100, Math.round(abcData.score))
        : abcData.grade === "A" ? 92 : abcData.grade === "B" ? 75 : 48)
    : null;
  const abcColor = abcData?.grade === "A" ? "#10b981"
    : abcData?.grade === "B" ? "#3b82f6"
    : "#f59e0b";

  const contractLabel = contracts?.[0]?.contractType === "indefinite" ? "Doimiy shartnoma"
    : contracts?.[0]?.contractType === "temporary" ? "Vaqtinchalik"
    : contracts?.[0]?.contractType === "probation" ? "Sinov muddati"
    : contracts?.[0]?.contractType ?? null;

  // ── Attendance %: real from attendanceStats, fallback 0 ──────────────────
  const attendancePct = attendanceStats?.total
    ? Math.round((attendanceStats.present / attendanceStats.total) * 100)
    : null;

  // ── Weekly work-hours bar: real from last 7 attendanceData records ────────
  const weekBars = useMemo(() => {
    if (attendanceData && attendanceData.length > 0) {
      // Sort by date desc, take last 7 days
      const sorted = [...attendanceData]
        .filter(a => a.checkIn && a.checkOut)
        .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
        .slice(0, 7)
        .reverse();
      if (sorted.length >= 3) {
        return sorted.map(a => {
          if (!a.checkIn || !a.checkOut) return 0;
          const diff = (new Date(a.checkOut).getTime() - new Date(a.checkIn).getTime()) / 3_600_000;
          return Math.min(12, Math.max(0, diff));
        });
      }
    }
    // Fallback: stable placeholder seeded from employee id
    const seed = parseInt(String(employee.id ?? 1), 10) || 1;
    return [6.5, 7.2, 8.0, 5.5, 7.8, 4.0, 6.0].map((b, i) =>
      parseFloat((b * ((seed * (i + 3)) % 11 + 5) / 13).toFixed(1))
    );
  }, [attendanceData, employee.id]);

  // Onboarding tasks (static sample — replace with real data when available)
  const tasks = useMemo(() => [
    { label: "Shartnoma imzolash",   done: true },
    { label: "Hujjatlar topshirish", done: true },
    { label: "Induction training",   done: true },
    { label: "Parol o'rnatish",      done: !!employee.hasPassword },
    { label: "Lavozim tayinlash",    done: !!position && position !== "Lavozim tayinlanmagan" },
    { label: "Ish joyini belgilash", done: !!department },
    { label: "Birinchi baholash",    done: !!abcData },
    { label: "Sertifikat yuklash",   done: false },
  ], [employee.hasPassword, position, department, abcData]);

  const doneTasks = tasks.filter(t => t.done).length;
  const onboardingPct = Math.round((doneTasks / tasks.length) * 100);

  const today = new Date();
  const todayDay = today.getDate();
  const calDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(todayDay - 3 + i);
    return { d: d.getDate(), active: i === 3 };
  });

  // ── Shared card style ──────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    boxShadow: "6px 6px 18px rgba(163,177,198,0.40), -4px -4px 12px rgba(255,255,255,0.80)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* ── Alert banners ──────────────────────────────────────────────────── */}
      {expiredCerts.length > 0 && (
        <div style={{ background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 12, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle style={{ width: 16, height: 16, color: "#e53e3e", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "#c53030", fontWeight: 500 }}>
            {expiredCerts.length} ta sertifikat muddati o'tgan — darrov yangilash zarur
          </span>
        </div>
      )}
      {!expiredCerts.length && expiringSoonCerts.length > 0 && (
        <div style={{ background: "#fffbeb", border: "1px solid #fbd38d", borderRadius: 12, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle style={{ width: 16, height: 16, color: "#d69e2e", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "#b7791f", fontWeight: 500 }}>
            {expiringSoonCerts.length} ta sertifikat 30 kun ichida tugaydi
          </span>
        </div>
      )}

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 1fr 220px", gap: 12, alignItems: "stretch" }}>

        {/* ─ 1. Profile card ─────────────────────────────────────────────── */}
        <div style={{
          background: "var(--ep-primary)",
          borderRadius: 20,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          boxShadow: "6px 6px 18px rgba(67,56,202,0.35), -2px -2px 8px rgba(255,255,255,0.5)",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* decorative rings */}
          <div style={{ position: "absolute", bottom: -20, left: -20, width: 120, height: 120, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.12)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 8, right: 8, width: 56, height: 56, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.10)", pointerEvents: "none" }} />

          {/* Avatar */}
          <div style={{ position: "relative", width: 96, height: 112, borderRadius: 14, overflow: "hidden", border: "2.5px solid rgba(255,255,255,0.35)", boxShadow: "0 4px 16px rgba(0,0,0,0.25)", flexShrink: 0 }}>
            {employee.profileImageUrl ? (
              <img src={employee.profileImageUrl} alt={employee.fullName} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.15)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: -1 }}>{getInitials(employee.fullName)}</span>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.55)", fontWeight: 600, letterSpacing: 1 }}>EUROPRINT</span>
              </div>
            )}
            {/* Status dot */}
            <div style={{
              position: "absolute", bottom: 6, right: 6, width: 12, height: 12, borderRadius: "50%",
              background: employee.status === "active" ? "#48bb78" : employee.status === "on_leave" ? "#63b3ed" : "#ecc94b",
              border: "2px solid #fff",
            }} />
          </div>

          {/* Name */}
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", lineHeight: 1.2, margin: 0 }}>{employee.fullName}</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", margin: "3px 0 0", fontWeight: 500 }}>{position}</p>
          </div>

          {/* Employee ID */}
          {employee.employeeId && (
            <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "4px 10px", display: "flex", alignItems: "center", gap: 5 }}>
              <Hash style={{ width: 10, height: 10, color: "rgba(255,255,255,0.65)" }} />
              <span style={{ fontSize: 10, color: "#fff", fontFamily: "monospace", fontWeight: 700, letterSpacing: 1 }}>{employee.employeeId}</span>
            </div>
          )}

          {/* ABC grade badge */}
          {abcData && (
            <div style={{
              background: abcData.grade === "A" ? "rgba(72,187,120,0.9)" : abcData.grade === "B" ? "rgba(99,179,237,0.9)" : "rgba(236,201,75,0.9)",
              borderRadius: 20, padding: "4px 12px",
              display: "flex", alignItems: "center", gap: 5,
              border: "1.5px solid rgba(255,255,255,0.35)",
            }}>
              <Award style={{ width: 11, height: 11, color: "#fff" }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>
                {abcData.grade} · {abcData.grade === "A" ? "Flagman" : abcData.grade === "B" ? "O'rtacha" : "Rivojlanish"}
              </span>
            </div>
          )}

          {/* Salary */}
          {salary && (
            <div style={{ textAlign: "center", marginTop: 2 }}>
              <span style={{ fontSize: 17, fontWeight: 900, color: "#fff", display: "block", lineHeight: 1 }}>{salary}</span>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.55)", fontWeight: 600, letterSpacing: 0.5 }}>OY MAOSHI</span>
            </div>
          )}

          {/* Edit button */}
          {onEdit && (
            <button onClick={onEdit} style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Edit2 style={{ width: 13, height: 13, color: "#fff" }} />
            </button>
          )}
        </div>

        {/* ─ 2. Progress widget ───────────────────────────────────────────── */}
        <div style={{ ...card, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#2d3748", margin: 0 }}>{t("ishFaoliyati")}</p>
              <p style={{ fontSize: 11, color: "#718096", margin: "2px 0 0" }}>{t("joriyHafta")}</p>
            </div>
            <div style={{ background: "#EBF4FF", borderRadius: 8, padding: "4px 8px", display: "flex", alignItems: "center", gap: 4 }}>
              <TrendingUp style={{ width: 12, height: 12, color: "#3b82f6" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6" }}>+8%</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 28, fontWeight: 900, color: "#2d3748", display: "block", lineHeight: 1 }}>
                {weekBars[weekBars.length - 1].toFixed(1)}
                <span style={{ fontSize: 13, fontWeight: 600, color: "#718096", marginLeft: 2 }}>soat</span>
              </span>
              <span style={{ fontSize: 10, color: "#718096" }}>
                {attendanceData && attendanceData.length > 0 ? "so'nggi kun" : "taxminiy"}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <MiniBar bars={weekBars} color="#3b82f6" />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, background: "#F7FAFC", borderRadius: 10, padding: "8px 10px" }}>
              <p style={{ fontSize: 10, color: "#718096", margin: 0 }}>{t("ishStaji")}</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#2d3748", margin: "2px 0 0" }}>{exp ?? "—"}</p>
            </div>
            <div style={{ flex: 1, background: "#F7FAFC", borderRadius: 10, padding: "8px 10px" }}>
              <p style={{ fontSize: 10, color: "#718096", margin: 0 }}>{t("bolim1")}</p>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#2d3748", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{department || "—"}</p>
            </div>
          </div>

          {contractLabel && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#F0FFF4", borderRadius: 10, padding: "7px 10px" }}>
              <Briefcase style={{ width: 12, height: 12, color: "#38a169", flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: "#276749", fontWeight: 600 }}>{contractLabel}</span>
            </div>
          )}
        </div>

        {/* ─ 3. ABC + Metrics widget ─────────────────────────────────────── */}
        <div style={{ ...card, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#2d3748", margin: 0 }}>{t("samaradorlik")}</p>
            <Clock style={{ width: 15, height: 15, color: "#a0aec0" }} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-around" }}>
            {abcPct !== null && (
              <CircleProgress pct={abcPct} color={abcColor} size={76} label={`ABC: ${abcData?.grade ?? "—"}`} sub="Baholash" />
            )}
            <CircleProgress pct={onboardingPct} color="#8b5cf6" size={76} label={t("onboarding")} sub={`${doneTasks}/${tasks.length} vazifa`} />
            {/* Real attendance % if data available, otherwise show placeholder */}
            {attendancePct !== null
              ? <CircleProgress pct={attendancePct} color="#f59e0b" size={76} label={t("davomat")} sub={`${attendanceStats?.present ?? 0}/${attendanceStats?.total ?? 0} kun`} />
              : <CircleProgress pct={0} color="#e2e8f0" size={76} label={t("davomat")} sub="Ma'lumot yo'q" />
            }
          </div>

          {/* Status row */}
          <div style={{ display: "flex", gap: 6 }}>
            {employee.status === "active" ? (
              <Badge style={{ background: "#F0FFF4", color: "#276749", border: "none", fontSize: 10, gap: 3, padding: "4px 8px" }}>
                <UserCheck style={{ width: 10, height: 10 }} /> {t("faolXodim")}
              </Badge>
            ) : employee.status === "on_leave" ? (
              <Badge style={{ background: "#EBF8FF", color: "#2b6cb0", border: "none", fontSize: 10, padding: "4px 8px" }}>
                {t("tatilda")}
              </Badge>
            ) : (
              <Badge style={{ background: "#FFFBEB", color: "#b7791f", border: "none", fontSize: 10, padding: "4px 8px" }}>
                {employee.status}
              </Badge>
            )}
            <Badge style={{ background: "#FAF5FF", color: "#6b46c1", border: "none", fontSize: 10, padding: "4px 8px" }}>
              <Star style={{ width: 9, height: 9, marginRight: 3 }} />
              {employee.shift ?? "Kunduzi"}
            </Badge>
          </div>
        </div>

        {/* ─ 4. Onboarding + Calendar widget ─────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Mini calendar */}
          <div style={{ ...card, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Calendar style={{ width: 13, height: 13, color: "#718096" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#2d3748" }}>
                  {today.toLocaleString("uz", { month: "long" })} {today.getFullYear()}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {calDays.map(({ d, active }) => (
                <div key={d} style={{
                  flex: 1, textAlign: "center", padding: "5px 0", borderRadius: 8,
                  background: active ? "#3b82f6" : "transparent",
                }}>
                  <span style={{ fontSize: 12, fontWeight: active ? 800 : 500, color: active ? "#fff" : "#718096" }}>{d}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Onboarding checklist */}
          <div style={{ ...card, padding: 14, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Target style={{ width: 13, height: 13, color: "#8b5cf6" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#2d3748" }}>{t("onboarding")}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#8b5cf6" }}>{doneTasks}/{tasks.length}</span>
            </div>

            {/* Progress bar */}
            <div style={{ height: 4, background: "#EDE9FE", borderRadius: 4, marginBottom: 8, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${onboardingPct}%`, background: "#8b5cf6", borderRadius: 4, transition: "width 0.5s ease" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {tasks.slice(0, 5).map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckSquare style={{ width: 12, height: 12, color: t.done ? "#8b5cf6" : "#cbd5e0", flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: t.done ? "#2d3748" : "#a0aec0", fontWeight: t.done ? 600 : 400, textDecoration: t.done ? "none" : "none", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.label}
                  </span>
                  {t.done && <ChevronRight style={{ width: 10, height: 10, color: "#8b5cf6" }} />}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
