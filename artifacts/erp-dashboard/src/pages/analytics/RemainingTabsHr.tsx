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
            <CardTitle className="text-sm font-medium">{t("faolXodimlar")}</CardTitle>
            <Target className="w-4 h-4 text-[var(--ep-green)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hrStats?.activeUsers || 0}</div>
            <p className="text-xs text-muted-foreground">{t("aktivHolat")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("noaktivXodimlar")}</CardTitle>
            <Target className="w-4 h-4 text-[var(--ep-red)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hrStats?.inactiveUsers || 0}</div>
            <p className="text-xs text-muted-foreground">{t("noaktivHolat")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sertifikatlar (7 kun)</CardTitle>
            <Award className="w-4 h-4 text-[var(--ep-primary)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hrStats?.certificatesExpiringIn7Days || 0}</div>
            <p className="text-xs text-muted-foreground">{t("muddatiTugaydi")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("kechikishlar")}</CardTitle>
            <Clock className="w-4 h-4 text-[var(--ep-red)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hrStats?.totalLateRecords || 0}</div>
            <p className="text-xs text-muted-foreground">{t("jamiKechikishlar")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("bajarilmaganOnboardinglar")}</CardTitle>
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
                  <EPStatusPill tone="danger">{t("bajarilmagan")}</EPStatusPill>
                </div>
              )) || <p className="text-center text-muted-foreground py-8">{t("hammasiBajarilgan")}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("kechikkanlarTop10")}</CardTitle>
            <CardDescription>{t("engKopKechikkanXodimlar")}</CardDescription>
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
              )) || <p className="text-center text-muted-foreground py-8">{t("noData")}</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('exportHisobotlar')}</CardTitle>
          <CardDescription>{t("turliFormatdaYuklabOlish")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">{t("hrDashboardToliqHisobot")}</h4>
            <div className="flex gap-2 flex-wrap">
              <a
                href="/api/export/hr-stats/pdf"
                className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover-elevate"
                data-testid="button-export-hr-pdf"
              >
                {t("hrDashboardPdf")}
              </a>
              <a
                href="/api/export/hr-stats/excel"
                className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover-elevate"
                data-testid="button-export-hr-excel"
              >
                {t("hrDashboardExcel")}
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">{t("alohidaCsvHisobotlar")}</h4>
            <div className="flex gap-2 flex-wrap">
              <a
                href="/api/export/employees/csv"
                className="inline-flex items-center justify-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover-elevate"
                data-testid="button-export-employees"
              >
                {t("xodimlarCsv")}
              </a>
              <a
                href="/api/export/attendance/csv"
                className="inline-flex items-center justify-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover-elevate"
                data-testid="button-export-attendance"
              >
                {t("davomatCsv")}
              </a>
              <a
                href="/api/export/discipline/csv"
                className="inline-flex items-center justify-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover-elevate"
                data-testid="button-export-discipline"
              >
                {t("intizomCsv")}
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
