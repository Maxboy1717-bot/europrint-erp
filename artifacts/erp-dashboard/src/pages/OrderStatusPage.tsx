/**
 * @module OrderStatusPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Search, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface StatusTransition {
  from: string;
  to:   string[];
}

interface StatusLog {
  id: string | number;
  order_id?: string | number;
  orderId?: string | number;
  from_status?: string;
  fromStatus?: string;
  to_status?: string;
  toStatus?: string;
  changed_by?: string | number;
  changedBy?: string | number;
  changed_at?: string;
  changedAt?: string;
  note?: string;
}

interface StatusChain {
  statuses?: string[];
  initial?: string;
  final?: string[];
}

const STATUS_COLORS: Record<string, string> = {
  draft:           "bg-gray-100 text-gray-600",
  new:             "bg-blue-100 text-[var(--ep-blue)]",
  design_approved: "bg-cyan-100 text-[var(--ep-cyan)]",
  tech_approved:   "bg-indigo-100 text-[var(--ep-blue)]",
  advance_received:"bg-amber-100 text-[var(--ep-yellow)]",
  in_production:   "bg-orange-100 text-[var(--ep-primary)]",
  qc_passed:       "bg-teal-100 text-[var(--ep-cyan)]",
  ready_delivery:  "bg-green-100 text-[var(--ep-green)]",
  delivered:       "bg-green-200 text-green-800",
  cancelled:       "bg-red-100 text-[var(--ep-red)]",
  on_hold:         "bg-yellow-100 text-[var(--ep-yellow)]",
};

type TabType = "chain" | "log";

export default function OrderStatusPage() {
  const { t } = useTranslation("common");
  const [tab, setTab]         = useState<TabType>("chain");
  const [orderId, setOrderId] = useState("");
  const [searched, setSearched] = useState("");

  const { data: chainData, isLoading: loadingChain, isError: errorChain, refetch: refetchChain } =
    useQuery<StatusChain | string[]>({
      queryKey: ["/api/order-status/chain"],
      queryFn: async () => {
        return await apiRequest("GET", "/api/order-status/chain");
      },
      enabled: tab === "chain",
    });

  const { data: transitionsData, isLoading: loadingTransitions } =
    useQuery<Record<string, string[]> | StatusTransition[]>({
      queryKey: ["/api/order-status/transitions"],
      queryFn: async () => {
        return await apiRequest("GET", "/api/order-status/transitions");
      },
      enabled: tab === "chain",
    });

  const { data: logData, isLoading: loadingLog, isError: errorLog, refetch: refetchLog } =
    useQuery<StatusLog[] | { data?: StatusLog[] }>({
      queryKey: ["/api/order-status/log", searched],
      queryFn: async () => {
        return await apiRequest("GET", `/api/order-status/${searched}/log`);
      },
      enabled: tab === "log" && !!searched,
    });

  const logs: StatusLog[] = Array.isArray(logData)
    ? logData
    : (logData as { data?: StatusLog[] })?.data ?? [];

  // Normalise chain to string[]
  const chain: string[] = Array.isArray(chainData)
    ? chainData
    : (chainData as StatusChain)?.statuses ?? [];

  // Normalise transitions to Record<string,string[]>
  const transitions: Record<string, string[]> = Array.isArray(transitionsData)
    ? Object.fromEntries((transitionsData as StatusTransition[]).map(t => [t.from, t.to]))
    : (transitionsData as Record<string, string[]>) ?? {};

  const isLoading = tab === "chain" ? (loadingChain || loadingTransitions) : loadingLog;
  const isError   = tab === "chain" ? errorChain : (!!searched && errorLog);
  const refetch   = tab === "chain" ? refetchChain : refetchLog;

  if (isError) return <EPErrorState onRetry={refetch} />;

  return (
    <ModulePage
      module="sd"
      title={t("buyurtmaHolatlari")}
      icon={<ClipboardList className="h-5 w-5" />}
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={tab === "chain" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("chain")}
            data-testid="tab-chain"
          >
            {t("holatZanjiri")}
          </Button>
          <Button
            variant={tab === "log" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("log")}
            data-testid="tab-log"
          >
            {t("buyurtmaTarixi")}
          </Button>
        </div>

        {tab === "chain" ? (
          isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status chain */}
              {chain.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{t("holatZanjiri")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {chain.map((s, idx) => (
                        <div key={s} className="flex items-center gap-1.5">
                          <span className={`text-xs px-2 py-1 rounded font-medium ${STATUS_COLORS[s] ?? "bg-muted text-muted-foreground"}`}>
                            {s.replace(/_/g, " ")}
                          </span>
                          {idx < chain.length - 1 && (
                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Transitions */}
              {Object.keys(transitions).length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{t("ruxsatEtilganOtishlar")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(transitions).map(([from, tos]) => (
                        <div key={from} className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[from] ?? "bg-muted text-muted-foreground"}`}>
                            {from.replace(/_/g, " ")}
                          </span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                          <div className="flex flex-wrap gap-1">
                            {tos.map(t => (
                              <span key={t} className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[t] ?? "bg-muted text-muted-foreground"}`}>
                                {t.replace(/_/g, " ")}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2 max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("buyurtmaId1")}
                  value={orderId}
                  onChange={e => setOrderId(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && setSearched(orderId)}
                  className="pl-9"
                  data-testid="input-order-id"
                />
              </div>
              <Button onClick={() => setSearched(orderId)} disabled={!orderId}>
                {t("search")}
              </Button>
            </div>

            {loadingLog ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Card key={i}>
                    <CardContent className="p-3 flex gap-4">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-40 rounded-lg" />
                        <Skeleton className="h-3 w-28 rounded-lg" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !searched ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t("buyurtmaIdKiritingVaQidiring")}</p>
                </CardContent>
              </Card>
            ) : logs.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">#{searched} uchun holat tarixi topilmadi</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium">Buyurtma #{searched} tarixi</p>
                {logs.map(l => {
                  const from = l.from_status ?? l.fromStatus ?? "—";
                  const to   = l.to_status   ?? l.toStatus   ?? "—";
                  const at   = l.changed_at  ?? l.changedAt;
                  return (
                    <Card key={l.id}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[from] ?? "bg-muted text-muted-foreground"}`}>
                            {from.replace(/_/g, " ")}
                          </span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[to] ?? "bg-muted text-muted-foreground"}`}>
                            {to.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                          {l.note && <span className="italic">{l.note}</span>}
                          {at && <span>{new Date(at).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}</span>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </ModulePage>
  );
}
