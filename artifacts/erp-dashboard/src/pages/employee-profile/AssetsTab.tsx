/**
 * @module AssetsTab
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Monitor, Smartphone, Car, Wrench, CheckCircle, Clock, Laptop, Key, Shirt, Printer, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient, getAuthHeaders } from "@/lib/queryClient";
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from '@/lib/i18n';

interface AssetAssignment {
  id: string;
  asset_id: string;
  employee_id: string;
  assigned_date: string;
  return_date: string | null;
  condition_on_assign: string;
  condition_on_return: string | null;
  asset_name: string;
  asset_category: string;
  asset_serial_number: string | null;
  asset_status: string;
  asset_value: number;
}

interface Props {
  employeeId: number | string;
}

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  computer: Monitor,
  laptop: Laptop,
  phone: Smartphone,
  vehicle: Car,
  tool: Wrench,
  key: Key,
  uniform: Shirt,
  printer: Printer,
  other: Package,
};

const CONDITION_LABELS: Record<string, string> = {
  new: "Yangi",
  good: "Yaxshi",
  fair: "Qoniqarli",
  poor: "Yomon",
  broken: "Buzilgan",
};

const CATEGORY_LABELS: Record<string, string> = {
  laptop: "Noutbuk",
  computer: "Kompyuter",
  phone: "Telefon",
  printer: "Printer",
  key: "Kalit",
  uniform: "Forma kiyim",
  vehicle: "Transport",
  tool: "Asbob",
  other: "Boshqa",
};

export function AssetsTab({ employeeId }: Props) {
  const { t } = useTranslation("common");
  const { data, isLoading } = useQuery<AssetAssignment[]>({
    queryKey: ["/api/assets/employee", employeeId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/assets/employee/${employeeId}`);
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);
    },
    enabled: !!employeeId,
  });

  const assignments: AssetAssignment[] = Array.isArray(data) ? data : [];
  const active = (Array.isArray(assignments) ? assignments : []).filter(a => !a.return_date);
  const returned = (Array.isArray(assignments) ? assignments : []).filter(a => !!a.return_date);

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label={t("refresh")}><RefreshCw className="h-4 w-4" /></Button>
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 gap-3">
        {([
          { label: "Faol jixozlar", value: active.length, icon: Package, color: "text-[var(--ep-blue)]", bg: "bg-blue-50 dark:bg-blue-950/20" },
          { label: "Qaytarilgan", value: returned.length, icon: CheckCircle, color: "text-[var(--ep-green)]", bg: "bg-green-50 dark:bg-green-950/20" },
          { label: "Jami", value: assignments.length, icon: Clock, color: "text-slate-500", bg: "bg-muted/60" },
        ]).map(s => (
          <Card key={s.label} className={`border-border/50 ${s.bg}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-7 h-7 ${s.color} shrink-0`} />
              <div>
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active assets */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            Berilgan jixozlar ({active.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-2">
              {([1, 2, 3]).map(i => <Skeleton key={`k-${i}`} className="h-14 w-full rounded-lg" />)}
            </div>
          )}
          {!isLoading && active.length === 0 && (
            <div className="text-center py-10 text-[13px] text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">{t("hozirdaBerilganJixozYoq")}</p>
            </div>
          )}
          <div className="space-y-2">
            {(Array.isArray(active) ? active : []).map(a => {
              const Icon = TYPE_ICON[a.asset_category ?? ""] ?? Package;
              return (
                <div key={a.id} className="flex items-center gap-4 p-3 rounded-lg border border-border/50 bg-muted/40">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{a.asset_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {CATEGORY_LABELS[a.asset_category] ?? a.asset_category}
                      {a.asset_serial_number ? ` · S/N: ${a.asset_serial_number}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {a.assigned_date && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(a.assigned_date).toLocaleDateString("uz-UZ")}
                      </p>
                    )}
                    <Badge variant="outline" className="text-xs capitalize mt-0.5">
                      {CONDITION_LABELS[a.condition_on_assign] ?? a.condition_on_assign}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Returned assets */}
      {returned.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="w-4 h-4" />
              Qaytarilgan jixozlar ({returned.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(Array.isArray(returned) ? returned : []).map(a => (
                <div key={a.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/40 opacity-60">
                  <Package className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground line-through">{a.asset_name}</p>
                    {a.asset_serial_number && (
                      <p className="text-xs text-muted-foreground">S/N: {a.asset_serial_number}</p>
                    )}
                  </div>
                  {a.return_date && (
                    <p className="text-xs text-muted-foreground shrink-0">
                      Qaytarildi: {new Date(a.return_date).toLocaleDateString("uz-UZ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </>
  );
}
