/**
 * @module EmployeesForFacePage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, UserCheck, UserX } from "lucide-react";
import { EPPageHeader, EPStatusPill } from "@/components/ep";

interface EmployeeFaceStatus {
  id: number;
  fullName: string;
  position: string | null;
  department: string | null;
  hasFace: boolean;
  lastEnrolledAt: string | null;
  rfidCard: string | null;
}

const ENROLL_LATE_DAYS_WARN = 30;

export default function EmployeesForFacePage() {
  const { t } = useTranslation('hr');
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<{ items: EmployeeFaceStatus[] }>({
    queryKey: ["/api/hr/employees/list/for-face", search],
    queryFn: () => apiRequest(
      "GET",
      `/api/hr/employees/list/for-face${search ? `?search=${encodeURIComponent(search)}` : ""}`,
    ),
  });

  const items = selectArray<EmployeeFaceStatus>(data, "items");
  const enrolled = items.filter((x) => x.hasFace).length;
  const missing = items.length - enrolled;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">{t('faceEnroll.title', 'Yuz tanish ro\'yxatidan o\'tish')}</b></>}
        title={t('faceEnroll.title', 'Yuz tanish ro\'yxatidan o\'tish')}
        subtitle={t('faceEnroll.description', 'Xodimlarning yuz embedding holati')}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('faceEnroll.total', 'Jami')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <UserCheck className="h-4 w-4 text-[var(--ep-green)]" />
              {t('faceEnroll.enrolled', 'Ro\'yxatdan o\'tgan')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[var(--ep-green)]">{enrolled}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <UserX className="h-4 w-4 text-[var(--ep-red)]" />
              {t('faceEnroll.missing', 'Yo\'q')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[var(--ep-red)]">{missing}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('faceEnroll.list', 'Xodimlar')}</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('common.search', 'Qidirish...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t('faceEnroll.empty', 'Xodim topilmadi')}
            </p>
          ) : (
            <div className="space-y-1">
              {items.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">{emp.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {emp.position ?? '—'} · {emp.department ?? '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {emp.rfidCard ? (
                      <Badge variant="outline" className="text-xs">RFID</Badge>
                    ) : null}
                    {emp.hasFace ? (
                      <Badge className="bg-emerald-100 text-[var(--ep-green)]">
                        {t('faceEnroll.yes', 'Bor')}
                      </Badge>
                    ) : (
                      <EPStatusPill tone="danger">
                        {t('faceEnroll.no', 'Yo\'q')}
                      </EPStatusPill>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
