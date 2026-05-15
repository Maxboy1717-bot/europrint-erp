/**
 * @module EmployeeZoneHistoryPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface ZoneEntry {
  id: string | number;
  employee_id?: string | number;
  employeeId?: string | number;
  employee_name?: string;
  employeeName?: string;
  zone_id?: string | number;
  zoneId?: string | number;
  zone_name?: string;
  zoneName?: string;
  entered_at?: string;
  enteredAt?: string;
  exited_at?: string;
  exitedAt?: string;
  duration_minutes?: number;
  durationMinutes?: number;
  access_type?: string;
  accessType?: string;
}

const ACCESS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  granted: { label: "Ruxsat",  variant: "default"     },
  denied:  { label: "Rad",     variant: "destructive" },
  exit:    { label: "Chiqish", variant: "outline"     },
};

export default function EmployeeZoneHistoryPage() {
  const { t } = useTranslation("common");
  const [employeeId, setEmployeeId] = useState("");
  const [searched, setSearched]     = useState("");
  const [fromDate, setFromDate]     = useState("");
  const [toDate, setToDate]         = useState("");

  const { data: rawData, isLoading, isError, error, refetch } = useQuery<
    ZoneEntry[] | { data?: ZoneEntry[] }
  >({
    queryKey: ["/api/employee-zone-history", searched, fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams({ employeeId: searched });
      if (fromDate) params.set("from", fromDate);
      if (toDate)   params.set("to",   toDate);
      return await apiRequest("GET", `/api/employee-zone-history?${params}`);
    },
    enabled: !!searched,
  });

  const entries: ZoneEntry[] = Array.isArray(rawData)
    ? rawData
    : (rawData as { data?: ZoneEntry[] })?.data ?? [];

  if (isError && searched) return <EPErrorState onRetry={refetch}  error={error} />;

  const doSearch = () => { if (employeeId) setSearched(employeeId); };

  return (
    <ModulePage
      module="hr"
      title={t("xodimZonaTarixi")}
      icon={<MapPin className="h-5 w-5" />}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("xodimId1")}
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doSearch()}
              className="pl-9 w-40"
              data-testid="input-employee-id"
            />
          </div>
          <Input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="w-40"
            data-testid="input-from-date"
          />
          <Input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="w-40"
            data-testid="input-to-date"
          />
          <Button onClick={doSearch} disabled={!employeeId} data-testid="button-search">
            {t("search")}
          </Button>
        </div>

        {!searched ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t("xodimIdKiritingVaQidiring")}</p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <Card key={`k-${i}`}>
                <CardContent className="p-3 flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-40 rounded-lg" />
                    <Skeleton className="h-3 w-56 rounded-lg" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">#{searched} uchun zona tarixi topilmadi</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Xodim #{searched} — {entries.length} yozuv
            </p>
            <div className="space-y-2">
              {entries.map(e => {
                const zoneName   = e.zone_name ?? e.zoneName ?? `Zona #${e.zone_id ?? e.zoneId ?? ""}`;
                const accessType = e.access_type ?? e.accessType ?? "granted";
                const ac         = ACCESS_MAP[accessType] ?? ACCESS_MAP.granted;
                const entered    = e.entered_at ?? e.enteredAt;
                const exited     = e.exited_at  ?? e.exitedAt;
                const dur        = e.duration_minutes ?? e.durationMinutes;
                const empName    = e.employee_name ?? e.employeeName;
                return (
                  <Card key={e.id} data-testid={`card-zone-${e.id}`}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{zoneName}</p>
                          {empName && <span className="text-xs text-muted-foreground">{empName}</span>}
                        </div>
                        <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground mt-0.5">
                          {entered && (
                            <span>Kirdi: {new Date(entered).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}</span>
                          )}
                          {exited && (
                            <span>Chiqdi: {new Date(exited).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}</span>
                          )}
                          {dur !== undefined && <span>⏱ {dur} daq</span>}
                        </div>
                      </div>
                      <Badge variant={ac.variant} className="text-xs shrink-0">{ac.label}</Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ModulePage>
  );
}
