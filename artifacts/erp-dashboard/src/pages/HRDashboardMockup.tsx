/**
 * HR Dashboard — SmartHR mockup style.
 *
 * Bu mockup bo'yicha qayta yozilgan namuna sahifa.
 * Boshqa modullar uchun xuddi shu pattern ishlatiladi.
 */
import { useQuery } from "@tanstack/react-query";
import {
  Users, UserCheck, UserPlus, UserX, Briefcase,
  TrendingUp, Calendar, CheckCircle2, AlertCircle,
} from "lucide-react";
import { WelcomeBanner } from "@/components/mockup/WelcomeBanner";
import { KpiCardMockup } from "@/components/mockup/KpiCardMockup";
import { StatusPill } from "@/components/mockup/StatusPill";
import { toArray } from "@/lib/safe-array";

import { useTranslation } from '@/lib/i18n';
interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  newHires30d: number;
  attritionRate: number;
  pendingLeaves: number;
  todaysAbsences: number;
  openVacancies: number;
}

interface BirthdayItem {
  id: number;
  full_name: string;
  department_name?: string;
  birth_date?: string;
}

interface RecentHire {
  id: number;
  fullName: string;
  positionName?: string;
  hireDate?: string;
}

export default function HRDashboardMockup() {
  const { t } = useTranslation('common');
  const { data: statsRaw } = useQuery<DashboardStats>({
    queryKey: ["/api/hr/dashboard-stats"],
  });
  const stats = (statsRaw ?? {}) as Partial<DashboardStats>;

  const { data: birthdaysRaw } = useQuery({ queryKey: ["/api/hr/birthdays/today"] });
  const birthdays = toArray<BirthdayItem>(birthdaysRaw);

  const { data: hiresRaw } = useQuery({ queryKey: ["/api/employees", { limit: "5" }] });
  const recentHires = toArray<RecentHire>(hiresRaw).slice(0, 5);

  return (
    <div className="ep-content space-y-6">
      {/* Breadcrumb */}
      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
        <span>HR</span> / <span>{t('dashboard3')}</span>
      </div>
      <h1 className="text-xl font-semibold m-0 mb-4">{t('hrDashboard1')}</h1>

      {/* Welcome banner */}
      <WelcomeBanner tasksToday={stats.pendingLeaves ?? 0} />

      {/* KPI Grid (8 cards — mockup uslubida) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 mb-5">
        <KpiCardMockup
          icon={<Users className="h-5 w-5" />}
          iconColor="orange"
          label={t("jamiXodimlar1")}
          value={stats.totalEmployees ?? 0}
          link="Ko'rish"
        />
        <KpiCardMockup
          icon={<UserCheck className="h-5 w-5" />}
          iconColor="green"
          label={t("faolXodimlar1")}
          value={stats.activeEmployees ?? 0}
          link="Ro'yxat"
        />
        <KpiCardMockup
          icon={<UserPlus className="h-5 w-5" />}
          iconColor="blue"
          label="Yangi (30 kun)"
          value={stats.newHires30d ?? 0}
          link="Onboarding"
        />
        <KpiCardMockup
          icon={<UserX className="h-5 w-5" />}
          iconColor="red"
          label={t("bugunYoq")}
          value={stats.todaysAbsences ?? 0}
          link="Davomat"
        />
        <KpiCardMockup
          icon={<Briefcase className="h-5 w-5" />}
          iconColor="purple"
          label={t("vakantLavozim")}
          value={stats.openVacancies ?? 0}
          link="Recruiting"
        />
        <KpiCardMockup
          icon={<TrendingUp className="h-5 w-5" />}
          iconColor="pink"
          label={t("attrition")}
          value={`${stats.attritionRate ?? 0}%`}
          link="Tahlil"
        />
        <KpiCardMockup
          icon={<Calendar className="h-5 w-5" />}
          iconColor="dark"
          label={t("tatilKutilmoqda")}
          value={stats.pendingLeaves ?? 0}
          link="Approve"
        />
        <KpiCardMockup
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconColor="green"
          label={t("bugunSmenada")}
          value={(stats.activeEmployees ?? 0) - (stats.todaysAbsences ?? 0)}
          link="Smena"
        />
      </div>

      {/* Main content grid (2 + 1 columns mockup style) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Hires (2 columns) */}
        <div className="ep-card lg:col-span-2">
          <div className="ep-card-header">
            <h6>{t("yangiXodimlar")}</h6>
            <button className="text-xs text-[hsl(var(--primary))] hover:underline">
              {t("hammasiniKorish")}
            </button>
          </div>
          <div className="ep-card-body">
            {recentHires.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {t("yangiXodimlarYoq")}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase text-muted-foreground border-b">
                    <th className="text-left py-2 px-3">{t("xodim1")}</th>
                    <th className="text-left py-2 px-3">{t("lavozim1")}</th>
                    <th className="text-left py-2 px-3">{t("date")}</th>
                    <th className="text-right py-2 px-3">{t("status28")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentHires.map((h) => {
                    const initials = (h.fullName ?? "")
                      .split(/\s+/)
                      .map((s) => s[0]?.toUpperCase() ?? "")
                      .slice(0, 2)
                      .join("");
                    return (
                      <tr key={h.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="av-mockup av-sm">{initials}</div>
                            <span className="font-medium">{h.fullName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground">{h.positionName ?? '—'}</td>
                        <td className="py-3 px-3 text-muted-foreground">{h.hireDate ?? '—'}</td>
                        <td className="py-3 px-3 text-right">
                          <StatusPill variant="success">{t("active")}</StatusPill>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Birthdays (1 column) */}
        <div className="ep-card">
          <div className="ep-card-header">
            <h6>{t("tugilganKunlar2")}</h6>
            <span className="text-xs text-muted-foreground">{birthdays.length} ta</span>
          </div>
          <div className="ep-card-body">
            {birthdays.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                {t("bugunTugilganKunYoq")}
              </div>
            ) : (
              <div className="space-y-2">
                {birthdays.slice(0, 5).map((b) => {
                  const initials = (b.full_name ?? "")
                    .split(/\s+/)
                    .map((s) => s[0]?.toUpperCase() ?? "")
                    .slice(0, 2)
                    .join("");
                  return (
                    <div key={b.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/40">
                      <div className="av-mockup av-sm">{initials}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{b.full_name}</div>
                        <div className="text-xs text-muted-foreground truncate">{b.department_name ?? '—'}</div>
                      </div>
                      <button className="text-xs px-2 py-1 border border-[hsl(var(--border))] rounded hover:bg-[hsl(var(--primary))] hover:text-white hover:border-[hsl(var(--primary))]">
                        {t("tabriklash")}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance section (mockup uslubidagi gradient cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="card-dark-grad">
          <div className="text-3xl font-bold">{stats.activeEmployees ?? 0}</div>
          <div className="text-xs opacity-80 mt-1">{t("aktivXodimlar1")}</div>
          <div className="text-xs mt-3 opacity-90">{t("europrintJamoasi")}</div>
        </div>
        <div className="card-yellow">
          <div className="text-3xl font-bold">{stats.newHires30d ?? 0}</div>
          <div className="text-xs opacity-80 mt-1">Yangi qo'shildi (30 kun)</div>
          <div className="text-xs mt-3">{t("onboardingDavomEtmoqda")}</div>
        </div>
        <div className="card-teal">
          <div className="text-3xl font-bold">{stats.openVacancies ?? 0}</div>
          <div className="text-xs opacity-80 mt-1">{t("vakantLavozim")}</div>
          <div className="text-xs mt-3 opacity-90">{t("recruitingFunnelniKoring")}</div>
        </div>
      </div>
    </div>
  );
}
