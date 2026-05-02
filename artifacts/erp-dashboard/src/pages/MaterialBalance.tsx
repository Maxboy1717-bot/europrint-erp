import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, safeArray } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  Package,
  TrendingDown,
  RefreshCw,
  CheckCircle,
  XCircle,
  ClipboardList,
  Warehouse,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
} from "lucide-react";

interface Overview {
  totalMaterials: number;
  totalStockValue: number;
  lowStockAlerts: number;
  criticalStockCount: number;
}

interface StockAlert {
  id: string;
  kod: string;
  xomAshyo: string;
  xomAshyoRu: string | null;
  currentStock: number;
  minStock: number;
  maxStock: number | null;
  unitOfMeasure: string;
  unitPrice: number | null;
  warehouseName: string | null;
  warehouseCode: string | null;
  severity: "critical" | "warning";
  deficit: number;
}

interface AlertsResponse {
  success: boolean;
  data: StockAlert[];
  total: number;
  criticalCount: number;
  warningCount: number;
}

interface InternalRequest {
  id: string;
  materialId: string;
  materialName: string;
  requestedBy: string;
  requesterName: string | null;
  quantity: number;
  unitOfMeasure: string;
  purpose: string | null;
  status: string;
  priority: string;
  requestedAt: string;
  approvedBy: string | null;
  approverName: string | null;
}

interface InternalRequestsResponse {
  success: boolean;
  data: InternalRequest[];
  total: number;
}

interface ProductionStock {
  materialId: string;
  kod: string;
  xomAshyo: string;
  currentStock: number;
  minStock: number;
  unitOfMeasure: string;
  unitPrice: number | null;
  warehouseName: string | null;
}

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
  variant = "default",
}: {
  title: string;
  value: string | number;
  icon: React.FC<{ className?: string }>;
  loading?: boolean;
  variant?: "default" | "warning" | "critical";
}) {
  const colorClass =
    variant === "critical"
      ? "text-red-600 dark:text-red-400"
      : variant === "warning"
      ? "text-yellow-600 dark:text-yellow-400"
      : "text-foreground";

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="p-2 rounded-md bg-muted">
          <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          {loading ? (
            <Skeleton className="h-7 w-20 mt-1" />
          ) : (
            <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MaterialBalance() {
  const { t } = useTranslation("wms");
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: overview, isLoading: overviewLoading } = useQuery<{ success: boolean; data: Overview }>({
    queryKey: ["/api/material-balance/overview"],
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery<AlertsResponse>({
    queryKey: ["/api/material-balance/alerts"],
    enabled: activeTab === "alerts" || activeTab === "overview",
  });

  const { data: requests, isLoading: requestsLoading } = useQuery<InternalRequestsResponse>({
    queryKey: ["/api/material-balance/internal-requests"],
    enabled: activeTab === "requests",
  });

  const { data: production, isLoading: productionLoading } = useQuery<{ success: boolean; data: ProductionStock[] }>({
    queryKey: ["/api/material-balance/production"],
    enabled: activeTab === "production",
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("PATCH", `/api/material-balance/internal-requests/${id}/approve`, { note: "Tasdiqlandi" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/material-balance/internal-requests"] });
      toast({ title: "So'rov tasdiqlandi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const issueMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("PATCH", `/api/material-balance/internal-requests/${id}/issue`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/material-balance/internal-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/material-balance/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/material-balance/alerts"] });
      toast({ title: "Material berildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const ov = overview?.data;
  const allAlerts = safeArray<StockAlert>(alerts, "data");
  const criticalAlerts = (Array.isArray(allAlerts) ? allAlerts : []).filter((a) => a.severity === "critical");
  const warningAlerts = (Array.isArray(allAlerts) ? allAlerts : []).filter((a) => a.severity === "warning");

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "Kutmoqda",
      approved: "Tasdiqlangan",
      issued: "Berildi",
      rejected: "Rad etildi",
      cancelled: "Bekor",
    };
    const variantMap: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      approved: "default",
      issued: "default",
      rejected: "destructive",
      cancelled: "destructive",
    };
    return (
      <Badge variant={variantMap[status] || "secondary"} data-testid={`badge-status-${status}`}>
        {map[status] || status}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            Material Balans
          </h1>
          <p className="text-sm text-muted-foreground">Xom ashyo zaxirasi va ichki so'rovlar boshqaruvi</p>
        </div>
        <Button
          variant="outline"
          size="default"
          data-testid="button-refresh"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/material-balance/overview"] });
            queryClient.invalidateQueries({ queryKey: ["/api/material-balance/alerts"] });
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Yangilash
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          title="Jami materiallar"
          value={ov?.totalMaterials ?? 0}
          icon={Package}
          loading={overviewLoading}
        />
        <StatCard
          title="Umumiy qiymat"
          value={ov ? formatCurrency(ov.totalStockValue) : "0"}
          icon={Warehouse}
          loading={overviewLoading}
        />
        <StatCard
          title="Kam qolganlar"
          value={ov?.lowStockAlerts ?? 0}
          icon={TrendingDown}
          loading={overviewLoading}
          variant="warning"
        />
        <StatCard
          title="Tuganganlar"
          value={ov?.criticalStockCount ?? 0}
          icon={AlertTriangle}
          loading={overviewLoading}
          variant="critical"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">
            Umumiy
          </TabsTrigger>
          <TabsTrigger value="alerts" data-testid="tab-alerts">
            Ogohlantirishlar
            {(alerts?.total ?? 0) > 0 && (
              <Badge variant="destructive" className="ml-2">
                {alerts?.total}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" data-testid="tab-requests">
            Ichki So'rovlar
          </TabsTrigger>
          <TabsTrigger value="production" data-testid="tab-production">
            Ishlab Chiqarish
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {criticalAlerts.length > 0 && (
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2 text-base">
                  <AlertTriangle className="w-5 h-5" />
                  Kritik — material tugagan ({criticalAlerts.length} ta)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kod</TableHead>
                      <TableHead>Xom ashyo</TableHead>
                      <TableHead className="text-right">Qoldiq</TableHead>
                      <TableHead className="text-right">Min zaxira</TableHead>
                      <TableHead>O'lchov</TableHead>
                      <TableHead>Ombor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(criticalAlerts) ? criticalAlerts : []).map((a) => (
                      <TableRow key={a.id} data-testid={`row-critical-${a.id}`}>
                        <TableCell className="font-mono text-sm">{a.kod}</TableCell>
                        <TableCell className="font-medium">{a.xomAshyo}</TableCell>
                        <TableCell className="text-right text-red-600 dark:text-red-400 font-bold">
                          {a.currentStock}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{a.minStock}</TableCell>
                        <TableCell>{a.unitOfMeasure}</TableCell>
                        <TableCell>{a.warehouseName || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
          {warningAlerts.length > 0 && (
            <Card className="border-yellow-200 dark:border-yellow-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-yellow-600 dark:text-yellow-400 flex items-center gap-2 text-base">
                  <TrendingDown className="w-5 h-5" />
                  Ogohlantirish — kam qolgan ({warningAlerts.length} ta)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kod</TableHead>
                      <TableHead>Xom ashyo</TableHead>
                      <TableHead className="text-right">Qoldiq</TableHead>
                      <TableHead className="text-right">Min</TableHead>
                      <TableHead className="text-right">Etishmovchilik</TableHead>
                      <TableHead>O'lchov</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(warningAlerts) ? warningAlerts : []).slice(0, 10).map((a) => (
                      <TableRow key={a.id} data-testid={`row-warning-${a.id}`}>
                        <TableCell className="font-mono text-sm">{a.kod}</TableCell>
                        <TableCell className="font-medium">{a.xomAshyo}</TableCell>
                        <TableCell className="text-right text-yellow-600 dark:text-yellow-400 font-semibold">
                          {a.currentStock}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{a.minStock}</TableCell>
                        <TableCell className="text-right font-medium">{a.deficit}</TableCell>
                        <TableCell>{a.unitOfMeasure}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
          {!overviewLoading && criticalAlerts.length === 0 && warningAlerts.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                <CheckCircle className="w-10 h-10 text-green-500" />
                <p className="text-muted-foreground">Barcha materiallar yetarli darajada</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base">
                Barcha ogohlantirishlar
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="destructive" data-testid="badge-critical-count">
                  {alerts?.criticalCount ?? 0} kritik
                </Badge>
                <Badge variant="secondary" data-testid="badge-warning-count">
                  {alerts?.warningCount ?? 0} ogohlantirish
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div className="space-y-2">
                  {([1, 2, 3]).map((i) => (
                    <Skeleton key={`k-${i}`} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Holat</TableHead>
                      <TableHead>Kod</TableHead>
                      <TableHead>Xom ashyo</TableHead>
                      <TableHead className="text-right">Qoldiq</TableHead>
                      <TableHead className="text-right">Min</TableHead>
                      <TableHead className="text-right">Etishmovchilik</TableHead>
                      <TableHead>O'lchov</TableHead>
                      <TableHead>Ombor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(allAlerts) ? allAlerts : []).map((a) => (
                      <TableRow key={a.id} data-testid={`row-alert-${a.id}`}>
                        <TableCell>
                          {a.severity === "critical" ? (
                            <Badge variant="destructive">Kritik</Badge>
                          ) : (
                            <Badge variant="secondary">Kam</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{a.kod}</TableCell>
                        <TableCell className="font-medium">{a.xomAshyo}</TableCell>
                        <TableCell className="text-right font-bold">
                          <span className={a.severity === "critical" ? "text-red-600 dark:text-red-400" : "text-yellow-600 dark:text-yellow-400"}>
                            {a.currentStock}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{a.minStock}</TableCell>
                        <TableCell className="text-right">{a.deficit}</TableCell>
                        <TableCell>{a.unitOfMeasure}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{a.warehouseName || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Ichki material so'rovlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="space-y-2">
                  {([1, 2, 3]).map((i) => (
                    <Skeleton key={`k-${i}`} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Holat</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead className="text-right">Miqdor</TableHead>
                      <TableHead>So'rovchi</TableHead>
                      <TableHead>Maqsad</TableHead>
                      <TableHead>Muhimlik</TableHead>
                      <TableHead>Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {safeArray<InternalRequest>(requests, "data").map((r) => (
                      <TableRow key={r.id} data-testid={`row-request-${r.id}`}>
                        <TableCell>{statusBadge(r.status)}</TableCell>
                        <TableCell className="font-medium">{r.materialName}</TableCell>
                        <TableCell className="text-right">
                          {r.quantity} {r.unitOfMeasure}
                        </TableCell>
                        <TableCell className="text-sm">{r.requesterName || r.requestedBy}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                          {r.purpose || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.priority === "urgent" ? "destructive" : "secondary"}>
                            {r.priority === "urgent" ? "Shoshilinch" : r.priority === "high" ? "Yuqori" : "Oddiy"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {r.status === "pending" && (
                              <Button
                                size="icon"
                                variant="ghost"
                                data-testid={`button-approve-${r.id}`}
                                onClick={() => approveMutation.mutate(r.id)}
                                disabled={approveMutation.isPending}
                              >
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </Button>
                            )}
                            {r.status === "approved" && (
                              <Button
                                size="icon"
                                variant="ghost"
                                data-testid={`button-issue-${r.id}`}
                                onClick={() => issueMutation.mutate(r.id)}
                                disabled={issueMutation.isPending}
                              >
                                <ArrowDownToLine className="w-4 h-4 text-blue-600" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {safeArray<InternalRequest>(requests, "data").length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          So'rovlar mavjud emas
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="production" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-5 h-5" />
                Ishlab chiqarish uchun materiallar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {productionLoading ? (
                <div className="space-y-2">
                  {([1, 2, 3]).map((i) => (
                    <Skeleton key={`k-${i}`} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kod</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead className="text-right">Joriy qoldiq</TableHead>
                      <TableHead className="text-right">Min zaxira</TableHead>
                      <TableHead>O'lchov</TableHead>
                      <TableHead>Ombor</TableHead>
                      <TableHead className="text-right">Narx</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {production?.data?.map((m) => (
                      <TableRow key={m.materialId} data-testid={`row-prod-${m.materialId}`}>
                        <TableCell className="font-mono text-sm">{m.kod}</TableCell>
                        <TableCell className="font-medium">{m.xomAshyo}</TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              m.currentStock <= 0
                                ? "text-red-600 dark:text-red-400 font-bold"
                                : m.currentStock < m.minStock
                                ? "text-yellow-600 dark:text-yellow-400 font-semibold"
                                : ""
                            }
                          >
                            {m.currentStock}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{m.minStock}</TableCell>
                        <TableCell>{m.unitOfMeasure}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{m.warehouseName || "—"}</TableCell>
                        <TableCell className="text-right">
                          {m.unitPrice ? formatCurrency(m.unitPrice) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(production?.data?.length ?? 0) === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Ma'lumot topilmadi
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
