/**
 * @module LeaveTabSections
 * @description Section/table components for LeaveTab.
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Calendar, Stethoscope, UserCheck } from "lucide-react";
import type { BusinessTrip, LeaveRequest, SickLeaveRecord, TranslationFn } from "./LeaveTabTypes";
import { LEAVE_TYPE_LABELS } from "./LeaveTabTypes";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

function leaveStatusBadge(status: string) {
  const { t } = useTranslation("common");
  switch (status) {
    case "pending": return <EPStatusPill tone="warning">{t("Kutilmoqda")}</EPStatusPill>;
    case "approved": return <EPStatusPill tone="success">{t("approved")}</EPStatusPill>;
    case "rejected": return <EPStatusPill tone="danger">{t("rejected")}</EPStatusPill>;
    case "cancelled": return <EPStatusPill tone="neutral">{t("bekorQilindi")}</EPStatusPill>;
    default: return <EPStatusPill tone="neutral">{status}</EPStatusPill>;
  }
}

function tripStatusBadge(status: string) {
  const { t } = useTranslation("common");
  switch (status) {
    case "planned": return <EPStatusPill tone="info">{t("rejalashtirilgan")}</EPStatusPill>;
    case "in_progress": return <EPStatusPill tone="warning">{t("inProgress")}</EPStatusPill>;
    case "completed": return <EPStatusPill tone="success">{t("completed")}</EPStatusPill>;
    case "cancelled": return <EPStatusPill tone="neutral">{t("bekorQilindi")}</EPStatusPill>;
    default: return <EPStatusPill tone="neutral">{status}</EPStatusPill>;
  }
}

export function LeaveStatCards({
  leaveCount,
  sickCount,
  tripCount,
}: {
  leaveCount: number;
  sickCount: number;
  tripCount: number;
}) {
  const { t } = useTranslation("common");
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="from-purple-500/10 to-purple-600/10 border-purple-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t("tatilSorovlari")}</p>
              <p className="text-3xl font-bold text-[var(--ep-purple)]">{leaveCount}</p>
            </div>
            <Calendar className="h-8 w-8 text-[var(--ep-purple)]" />
          </div>
        </CardContent>
      </Card>
      <Card className="from-blue-500/10 to-blue-600/10 border-blue-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t("kasallikVaraqalari")}</p>
              <p className="text-3xl font-bold text-[var(--ep-blue)]">{sickCount}</p>
            </div>
            <Stethoscope className="h-8 w-8 text-[var(--ep-blue)]" />
          </div>
        </CardContent>
      </Card>
      <Card className="from-orange-500/10 to-orange-600/10 border-orange-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t("xizmatSafaralari")}</p>
              <p className="text-3xl font-bold text-[var(--ep-primary)]">{tripCount}</p>
            </div>
            <Briefcase className="h-8 w-8 text-[var(--ep-primary)]" />
          </div>
        </CardContent>
      </Card>
      <Card className="from-green-500/10 to-green-600/10 border-green-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t("qolganTatilKunlari")}</p>
              <p className="text-3xl font-bold text-[var(--ep-green)]">24</p>
            </div>
            <UserCheck className="h-8 w-8 text-[var(--ep-green)]" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function LeaveRequestsSection({
  leaveRequests,
  loading,
  t,
  dialogTrigger,
}: {
  leaveRequests: LeaveRequest[] | undefined;
  loading: boolean;
  t: TranslationFn & ((key: string) => string);
  dialogTrigger: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t("tatilSorovlari")}
          </CardTitle>
          <CardDescription>{t("xodimningTatilSorovlariTarixi")}</CardDescription>
        </div>
        {dialogTrigger}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ) : leaveRequests && leaveRequests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Array.isArray(leaveRequests) ? leaveRequests : []).map((request: LeaveRequest) => (
              <Card key={request.id} className="border" data-testid={`card-leave-request-${request.id}`}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline">{LEAVE_TYPE_LABELS[request.leaveType] || request.leaveType}</Badge>
                    {leaveStatusBadge(request.status)}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">{t("startDate")}</p>
                      <p className="font-medium">{request.startDate}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("tugash")}</p>
                      <p className="font-medium">{request.endDate}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("jamiKunlar")}</p>
                      <p className="font-medium">{request.totalDays} kun</p>
                    </div>
                    {request.reason && (
                      <div>
                        <p className="text-muted-foreground">{t("sabab")}</p>
                        <p className="font-medium">{request.reason}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">{t("tatilSorovlariMavjudEmas")}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function SickLeavesSection({
  sickLeaves,
  loading,
  dialogTrigger,
}: {
  sickLeaves: SickLeaveRecord[] | undefined;
  loading: boolean;
  dialogTrigger: React.ReactNode;
}) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            {t("kasallikVaraqalari")}
          </CardTitle>
          <CardDescription>{t("tibbiyKasallikVaraqalariRoyxati")}</CardDescription>
        </div>
        {dialogTrigger}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ) : sickLeaves && sickLeaves.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Array.isArray(sickLeaves) ? sickLeaves : []).map((sick: SickLeaveRecord) => (
              <Card key={sick.id} className="border" data-testid={`card-sick-leave-${sick.id}`}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline">{sick.documentNumber || "Hujjat raqami yo'q"}</Badge>
                    {sick.isPaid ? (
                      <EPStatusPill tone="success">{sick.paymentPercent}% to'langan</EPStatusPill>
                    ) : (
                      <EPStatusPill tone="neutral">{t("tolanmagan")}</EPStatusPill>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div><p className="text-muted-foreground">{t("boshlanish")}</p><p className="font-medium">{sick.startDate}</p></div>
                    <div><p className="text-muted-foreground">{t("tugash")}</p><p className="font-medium">{sick.endDate}</p></div>
                    <div><p className="text-muted-foreground">{t("jamiKunlar")}</p><p className="font-medium">{sick.totalDays} kun</p></div>
                    {sick.diagnosis && <div><p className="text-muted-foreground">{t("diagnoz")}</p><p className="font-medium">{sick.diagnosis}</p></div>}
                    {sick.hospitalName && <div><p className="text-muted-foreground">{t("kasalxona")}</p><p className="font-medium">{sick.hospitalName}</p></div>}
                    {sick.doctorName && <div><p className="text-muted-foreground">{t("shifokor")}</p><p className="font-medium">{sick.doctorName}</p></div>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">{t("kasallikVaraqalariMavjudEmas")}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function BusinessTripsSection({
  businessTrips,
  loading,
  t,
  dialogTrigger,
}: {
  businessTrips: BusinessTrip[] | undefined;
  loading: boolean;
  t: TranslationFn & ((key: string) => string);
  dialogTrigger: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            {t("xizmatSafaralari")}
          </CardTitle>
          <CardDescription>{t("xodimningXizmatSafaralariTarixi")}</CardDescription>
        </div>
        {dialogTrigger}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ) : businessTrips && businessTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Array.isArray(businessTrips) ? businessTrips : []).map((trip: BusinessTrip) => (
              <Card key={trip.id} className="border" data-testid={`card-business-trip-${trip.id}`}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium">{trip.destination}</div>
                    {tripStatusBadge(trip.status)}
                  </div>
                  {trip.purpose && <p className="text-sm text-muted-foreground mb-3">{trip.purpose}</p>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div><p className="text-muted-foreground">{t("startDate")}</p><p className="font-medium">{trip.startDate}</p></div>
                    <div><p className="text-muted-foreground">{t("tugash")}</p><p className="font-medium">{trip.endDate}</p></div>
                    <div><p className="text-muted-foreground">{t("jamiKunlar")}</p><p className="font-medium">{trip.totalDays} kun</p></div>
                    <div><p className="text-muted-foreground">{t("jamiXarajat")}</p><p className="font-medium">{(trip.totalCost || 0).toLocaleString()} so'm</p></div>
                  </div>
                  {(trip.dailyAllowance || trip.transportCost || trip.accommodationCost) && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-2">{t("xarajatlarTafsiloti")}</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                        {trip.dailyAllowance > 0 && <div><p className="text-muted-foreground">{t("daily")}</p><p>{trip.dailyAllowance.toLocaleString()} so'm</p></div>}
                        {trip.transportCost > 0 && <div><p className="text-muted-foreground">{t("transport")}</p><p>{trip.transportCost.toLocaleString()} so'm</p></div>}
                        {trip.accommodationCost > 0 && <div><p className="text-muted-foreground">{t("yashash")}</p><p>{trip.accommodationCost.toLocaleString()} so'm</p></div>}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">{t("xizmatSafaralariMavjudEmas")}</p>
        )}
      </CardContent>
    </Card>
  );
}
