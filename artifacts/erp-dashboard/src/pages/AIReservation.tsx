/**
 * @module AIReservation
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/lib/i18n';
import {
  Brain,
  Package,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Percent,
  TrendingUp,
  Clock,
  Layers,
} from "lucide-react";

interface Dashboard {
  totalBatches: number;
  totalQuantity: number;
  totalReserved: number;
  reservedPercent: number;
  expiringSoon: number;
  shortageAlerts: number;
  avgConfidence: number;
  materialTypes: string[];
}

interface Batch {
  id: string;
  batchNumber: string;
  materialType: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  expiryDate: string | null;
  status: string;
  warehouseLocation: string | null;
  createdAt: string;
}

interface ReservationRequest {
  id: string;
  orderId: string | null;
  requestedBy: string | null;
  materialType: string;
  requiredQuantity: number;
  allocatedQuantity: number;
  requiredDate: string;
  status: string;
  aiConfidence: number;
  aiRecommendation: string | null;
  confirmedAt: string | null;
}

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
  sub,
}: {
  title: string;
  value: string | number;
  icon: React.FC<{ className?: string }>;
  loading?: boolean;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="p-2 rounded-md bg-muted">
          <Icon className="w-6 h-6 text-foreground" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          {loading ? (
            <Skeleton className="h-7 w-20 mt-1 rounded-lg" />
          ) : (
            <>
              <p className="text-2xl font-bold">{value}</p>
              {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AIReservation() {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");

  const { data: dashboard, isLoading: dashLoading } = useQuery<Dashboard>({
    queryKey: ["/api/ai-reservation/dashboard"],
  });

  const { data: batches, isLoading: batchesLoading } = useQuery<{ data: Batch[]; total: number }>({
    queryKey: ["/api/ai-reservation/batches"],
    enabled: activeTab === "batches",
  });

  const { data: requests, isLoading: requestsLoading } = useQuery<{ data: ReservationRequest[]; total: number }>({
    queryKey: ["/api/ai-reservation/requests"],
    enabled: activeTab === "requests",
  });

  const confirmMutation = useMutation({
    mutationFn: ({ id, batchId }: { id: string; batchId: string }) =>
      apiRequest("POST", `/api/ai-reservation/requests/${id}/confirm`, { batchId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-reservation/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-reservation/dashboard"] });
      toast({ title: "Rezervatsiya tasdiqlandi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      available: "Mavjud",
      reserved: "Ajratilgan",
      used: "Ishlatilgan",
      expired: "Muddati o'tgan",
      confirmed: "Tasdiqlangan",
      pending: "Kutmoqda",
      fulfilled: "Bajarilgan",
      insufficient: "Yetarli emas",
      partial: "Qisman",
      cancelled: "Bekor",
    };
    const variantMap: Record<string, "default" | "secondary" | "destructive"> = {
      available: "default",
      reserved: "secondary",
      used: "secondary",
      expired: "destructive",
      confirmed: "default",
      pending: "secondary",
      fulfilled: "default",
      insufficient: "destructive",
      partial: "secondary",
      cancelled: "destructive",
    };
    return (
      <Badge variant={variantMap[status] || "secondary"}>
        {map[status] || status}
      </Badge>
    );
  };

  const d = dashboard;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Brain className="w-7 h-7" />
            {t("aiRezervatsiyaTizimi")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("materialPartiyalariVaBuyurtmaRezervatsiyalarini")}</p>
        </div>
        <Button
          variant="outline"
          data-testid="button-refresh"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/ai-reservation/dashboard"] })}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {t("refresh")}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          title={t("jamiPartiyalar")}
          value={d?.totalBatches ?? 0}
          icon={Layers}
          loading={dashLoading}
          sub={`${d?.totalQuantity ?? 0} jami miqdor`}
        />
        <StatCard
          title={t("rezervatsiya")}
          value={`${d?.reservedPercent ?? 0}%`}
          icon={Percent}
          loading={dashLoading}
          sub={`${d?.totalReserved ?? 0} ajratilgan`}
        />
        <StatCard
          title={t("aiIshonch")}
          value={`${d?.avgConfidence ?? 0}%`}
          icon={Brain}
          loading={dashLoading}
        />
        <StatCard
          title={t("tezMuddatlilar")}
          value={d?.expiringSoon ?? 0}
          icon={Clock}
          loading={dashLoading}
          sub="7 kun ichida"
        />
      </div>

      {(d?.shortageAlerts ?? 0) > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="w-5 h-5 text-[var(--ep-yellow)] dark:text-yellow-400 shrink-0" />
            <p className="text-sm">
              <span className="font-semibold text-[var(--ep-yellow)] dark:text-yellow-400">{d?.shortageAlerts} ta so'rov</span>
              {" "}yetarli material topilmadi — qo'lda ko'rib chiqing
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">{t('dashboard1')}</TabsTrigger>
          <TabsTrigger value="batches" data-testid="tab-batches">{t("partiyalar")}</TabsTrigger>
          <TabsTrigger value="requests" data-testid="tab-requests">{t("rezervatsiyalar")}</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Material turlari ({d?.materialTypes?.length ?? 0} tur)</CardTitle>
            </CardHeader>
            <CardContent>
              {dashLoading ? (
                <Skeleton className="h-10 w-full rounded-lg" />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(d?.materialTypes) ? d?.materialTypes : []).map((mt) => (
                    <Badge key={mt} variant="secondary" data-testid={`badge-material-${mt}`}>{mt}</Badge>
                  ))}
                  {(d?.materialTypes?.length ?? 0) === 0 && (
                    <p className="text-sm text-muted-foreground">{t("haliMaterialTurlariYoq")}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, d?.reservedPercent ?? 0)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {d?.reservedPercent ?? 0}% ajratilgan
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-5 h-5" />
                {t("materialPartiyalar")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {batchesLoading ? (
                <div className="space-y-2">{([1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg"/>)}</div>
              ) : (
                <div className="ep-table-scroll"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("partiyaRaqami")}</TableHead>
                      <TableHead>{t("materialTuri")}</TableHead>
                      <TableHead className="text-right">{t("total")}</TableHead>
                      <TableHead className="text-right">{t("ajratilgan")}</TableHead>
                      <TableHead className="text-right">{t("bosh")}</TableHead>
                      <TableHead>{t("status28")}</TableHead>
                      <TableHead>{t("muddati")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches?.data?.map((b) => (
                      <TableRow key={b.id} data-testid={`row-batch-${b.id}`} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-mono text-sm">{b.batchNumber}</TableCell>
                        <TableCell>{b.materialType}</TableCell>
                        <TableCell className="text-right">{b.quantity}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{b.reservedQuantity}</TableCell>
                        <TableCell className="text-right font-medium">{b.availableQuantity}</TableCell>
                        <TableCell>{statusBadge(b.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {b.expiryDate ? new Date(b.expiryDate).toLocaleDateString("uz-UZ") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(batches?.data?.length ?? 0) === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          {t("partiyalarYoq")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {t("rezervatsiyaSorovlar")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="space-y-2">{([1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg"/>)}</div>
              ) : (
                <div className="ep-table-scroll"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("status28")}</TableHead>
                      <TableHead>{t("materialTuri")}</TableHead>
                      <TableHead className="text-right">{t("kerak")}</TableHead>
                      <TableHead className="text-right">{t("ajratildi")}</TableHead>
                      <TableHead>{t("kerakSana")}</TableHead>
                      <TableHead className="text-right">{t("aiIshonch")}</TableHead>
                      <TableHead>{t("aiTavsiya")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests?.data?.map((r) => (
                      <TableRow key={r.id} data-testid={`row-request-${r.id}`} className="hover:bg-muted/40 transition-colors">
                        <TableCell>{statusBadge(r.status)}</TableCell>
                        <TableCell className="font-medium">{r.materialType}</TableCell>
                        <TableCell className="text-right">{r.requiredQuantity}</TableCell>
                        <TableCell className="text-right">{r.allocatedQuantity}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(r.requiredDate).toLocaleDateString("uz-UZ")}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={r.aiConfidence >= 80 ? "text-[var(--ep-green)] dark:text-green-400 font-semibold" : r.aiConfidence >= 60 ? "text-[var(--ep-yellow)] dark:text-yellow-400" : "text-[var(--ep-red)] dark:text-red-400"}>
                            {r.aiConfidence}%
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {r.aiRecommendation || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(requests?.data?.length ?? 0) === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          {t("sorovlarYoq")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
