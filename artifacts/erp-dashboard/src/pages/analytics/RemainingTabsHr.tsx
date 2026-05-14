/**
 * @module RemainingTabsHr
 * @description HrTab component.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Clock, Award } from "lucide-react";
import type { RemainingTabsProps } from "./RemainingTabsTypes";
import type { AttendanceStat } from "./analytics-types";

import { useTranslation } from '@/lib/i18n';
import { EPStatusPill } from "@/components/ep";
export function HrTab({ hrStats, attendanceStats, }: Pick<RemainingTabsProps, 'hrStats' | 'attendanceStats'>) {
  const { t } = useTranslation('common');
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faol Xodimlar</CardTitle>
            <Target className="w-4 h-4 text-[var(--ep-green)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hrStats?.activeUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Aktiv holat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Noaktiv Xodimlar</CardTitle>
            <Target className="w-4 h-4 text-[var(--ep-red)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hrStats?.inactiveUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Noaktiv holat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sertifikatlar (7 kun)</CardTitle>
            <Award className="w-4 h-4 text-[var(--ep-primary)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hrStats?.certificatesExpiringIn7Days || 0}</div>
            <p className="text-xs text-muted-foreground">Muddati tugaydi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kechikishlar</CardTitle>
            <Clock className="w-4 h-4 text-[var(--ep-red)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hrStats?.totalLateRecords || 0}</div>
            <p className="text-xs text-muted-foreground">Jami kechikishlar</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Bajarilmagan Onboardinglar</CardTitle>
            <CardDescription>{hrStats?.incompleteOnboardingCount || 0} ta xodim</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {hrStats?.incompleteOnboarding?.map((emp: { userId: number; userName: string; hireDate: string }) => (
                <div key={emp.userId} className="flex items-center justify-between p-2 rounded-md border">
                  <div>
                    <p className="font-medium">{emp.userName}</p>
                    <p className="text-xs text-muted-foreground">Ishga kirgan: {emp.hireDate}</p>
                  </div>
                  <EPStatusPill tone="danger">Bajarilmagan</EPStatusPill>
                </div>
              )) || <p className="text-center text-muted-foreground py-8">Hammasi bajarilgan</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kechikkanlar Top 10</CardTitle>
            <CardDescription>Eng ko'p kechikkan xodimlar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {attendanceStats?.slice(0, 10).map((stat: AttendanceStat & { userId: number; userName: string; totalMinutesLate: number; lateCount: number }) => (
                <div key={stat.userId} className="flex items-center justify-between p-2 rounded-md border">
                  <div>
                    <p className="font-medium">{stat.userName}</p>
                    <p className="text-xs text-muted-foreground">{stat.totalMinutesLate || 0} daqiqa</p>
                  </div>
                  <EPStatusPill tone="danger">{stat.lateCount} marta</EPStatusPill>
                </div>
              )) || <p className="text-center text-muted-foreground py-8">Ma'lumot topilmadi</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('exportHisobotlar')}</CardTitle>
          <CardDescription>Turli formatda yuklab olish</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">HR Dashboard to'liq hisobot</h4>
            <div className="flex gap-2 flex-wrap">
              <a
                href="/api/export/hr-stats/pdf"
                className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover-elevate"
                data-testid="button-export-hr-pdf"
              >
                HR Dashboard PDF
              </a>
              <a
                href="/api/export/hr-stats/excel"
                className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover-elevate"
                data-testid="button-export-hr-excel"
              >
                HR Dashboard Excel
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Alohida CSV hisobotlar</h4>
            <div className="flex gap-2 flex-wrap">
              <a
                href="/api/export/employees/csv"
                className="inline-flex items-center justify-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover-elevate"
                data-testid="button-export-employees"
              >
                Xodimlar CSV
              </a>
              <a
                href="/api/export/attendance/csv"
                className="inline-flex items-center justify-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover-elevate"
                data-testid="button-export-attendance"
              >
                Davomat CSV
              </a>
              <a
                href="/api/export/discipline/csv"
                className="inline-flex items-center justify-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover-elevate"
                data-testid="button-export-discipline"
              >
                Intizom CSV
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
