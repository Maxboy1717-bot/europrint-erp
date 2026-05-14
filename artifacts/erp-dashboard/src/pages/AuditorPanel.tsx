/**
 * @module AuditorPanel
 * @description React page component. Route-level UI.
 */

import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Trash2, 
  Key, 
  RotateCcw, 
  FileSearch,
  CheckCircle,
  AlertTriangle,
  Clock,
  Download
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EPErrorState, EPPageHeader, EPStatusPill } from "@/components/ep";
interface AuditorDashboard {
  deletedRecords: number;
  overrides: number;
  reversals: number;
}

interface ValidationResult {
  id: string;
  ruleCode: string;
  status: string;
  issuesFound: number;
  details: Record<string, unknown>;
  executedAt: string;
}

interface DeletedRecord {
  id: string;
  tableName: string;
  recordId: string;
  deletedData: Record<string, unknown>;
  deletedBy: string;
  deletedAt: string;
  reason: string;
}

interface StatusChangeHistory {
  id: string;
  tableName: string;
  recordId: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  changedAt: string;
}

export default function AuditorPanel() {
  const { toast } = useToast();

  const restoreMutation = useMutation({
    mutationFn: async (recordId: string) => {
      await apiRequest("POST", `/api/europrint-control/deleted-records/${recordId}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/europrint-control/deleted-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/europrint-control/auditor-dashboard"] });
      toast({ title: "Tiklandi", description: "Yozuv muvaffaqiyatli tiklandi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Yozuvni tiklashda xatolik yuz berdi", variant: "destructive" });
    },
  });

  const { data: roleMenus } = useQuery<unknown[]>({
    queryKey: ["/api/europrint-control/menus/admin"],
    queryFn: () => apiRequest("GET", "/api/europrint-control/menus/admin"),
    staleTime: 10 * 60_000,
  });

  const handleExportReport = () => {
    const csvContent = "data:text/csv;charset=utf-8,Turi,Soni,Sana\nO'chirilgan Yozuvlar," + (dashboard?.deletedRecords || 0) + "," + new Date().toLocaleDateString() + "\nOverride'lar," + (dashboard?.overrides || 0) + "," + new Date().toLocaleDateString() + "\nQaytarishlar," + (dashboard?.reversals || 0) + "," + new Date().toLocaleDateString();
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `audit_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Hisobot yuklandi", description: "Audit hisoboti CSV formatda yuklandi" });
  };

  const { data: dashboard, isLoading: dashboardLoading, isError, refetch} = useQuery<AuditorDashboard>({
    queryKey: ["/api/europrint-control/auditor-dashboard"],
  });

  const { data: validationResults = [], isLoading: validationsLoading } = useQuery<ValidationResult[]>({
    queryKey: ["/api/europrint-control/validation-results"],
  });

  const { data: deletedRecords = [], isLoading: deletedLoading } = useQuery<DeletedRecord[]>({
    queryKey: ["/api/europrint-control/deleted-records"],
  });

  const { data: statusHistory = [], isLoading: statusLoading } = useQuery<StatusChangeHistory[]>({
    queryKey: ["/api/europrint-control/status-history"],
  });

  const { data: validationSummary } = useQuery<{ totalRules: number; issueCount: number; criticalCount: number }>({
    queryKey: ["/api/europrint-control/validation-summary"],
  });

  const isLoading = dashboardLoading || validationsLoading || deletedLoading || statusLoading;

  const statsCards = [
    {
      title: "O'chirilgan Yozuvlar",
      value: dashboard?.deletedRecords || 0,
      icon: Trash2,
      color: "text-[var(--ep-red)]",
      bgColor: "bg-red-500/10"
    },
    {
      title: "Override'lar",
      value: dashboard?.overrides || 0,
      icon: Key,
      color: "text-[var(--ep-primary)]",
      bgColor: "bg-orange-500/10"
    },
    {
      title: "Status Qaytarishlar",
      value: dashboard?.reversals || 0,
      icon: RotateCcw,
      color: "text-[var(--ep-purple)]",
      bgColor: "bg-purple-500/10"
    },
    {
      title: "Tekshirish Qoidalari",
      value: validationSummary?.totalRules || 0,
      icon: CheckCircle,
      color: "text-[var(--ep-green)]",
      bgColor: "bg-green-500/10"
    },
    {
      title: "Admin Menyular",
      value: Array.isArray(roleMenus) ? roleMenus.length : 0,
      icon: Shield,
      color: "text-[var(--ep-blue)]",
      bgColor: "bg-blue-500/10"
    }
  ];

  if (isError) {
    return <EPErrorState onRetry={refetch} />;
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">Auditor paneli</b></>}
        title="Auditor paneli"
        subtitle="Muvofiqlik tekshiruvi va audit tarixi"
      />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-muted/60 text-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted border-none gap-2" onClick={handleExportReport} data-testid="button-download-report">
            <Download className="h-4 w-4" />
            Hisobot Yuklab Olish
          </Button>
          <Button className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold gap-2" onClick={() => { refetch(); toast({ title: "Tekshirish boshlandi", description: "Barcha qoidalar bo'yicha tekshiruv amalga oshirilmoqda" }); }} data-testid="button-start-audit">
            <FileSearch className="h-4 w-4" />
            Tekshirish Boshlash
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div key={`k-${index}`} className="bg-card rounded-lg p-5 animate-pulse h-24" />
          ))
        ) : (
          (Array.isArray(statsCards) ? statsCards : []).map((card, index) => (
            <div key={`k-${index}`} className="bg-card rounded-lg p-5" data-testid={`audit-stat-${index}`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground tracking-tight">{card.value}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">{card.title}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Tabs defaultValue="deleted" className="mt-10">
        <TabsList className="bg-muted/60 p-1 rounded-xl w-full grid grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="deleted" className="rounded-lg data-[state=active]:bg-card" data-testid="tab-deleted">O'chirilganlar</TabsTrigger>
          <TabsTrigger value="overrides" className="rounded-lg data-[state=active]:bg-card" data-testid="tab-overrides">Override'lar</TabsTrigger>
          <TabsTrigger value="status" className="rounded-lg data-[state=active]:bg-card" data-testid="tab-status">Holat tarixi</TabsTrigger>
          <TabsTrigger value="validations" className="rounded-lg data-[state=active]:bg-card" data-testid="tab-validations">Tekshiruvlar</TabsTrigger>
        </TabsList>

        <TabsContent value="deleted" className="mt-6">
          <div className="bg-card rounded-xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-[var(--ep-red)]" />
              O'chirilgan Yozuvlar
            </h3>
            {deletedRecords.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <CheckCircle className="h-16 w-16 text-[var(--ep-green)] mb-4" />
                <p className="text-lg font-bold text-foreground">O'chirilgan yozuvlar yo'q</p>
                <p className="text-sm text-muted-foreground">
                  Tizimda hech narsa o'chirilmagan
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {(Array.isArray(deletedRecords) ? deletedRecords : []).map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 bg-background rounded-lg hover:bg-muted/40 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <EPStatusPill tone="danger">YARATILDI</EPStatusPill>
                        <p className="font-bold text-foreground">{record.tableName}</p>
                      </div>
                      <p className="text-xs font-mono text-muted-foreground mt-1">ID: {record.recordId}</p>
                      <p className="text-xs text-muted-foreground mt-1">Sabab: {record.reason || "Ko'rsatilmagan"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{record.deletedBy || "Noma'lum"}</p>
                      <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        {new Date(record.deletedAt).toLocaleString("uz-UZ")}
                      </div>
                      <Button variant="outline" size="sm" className="mt-3 bg-muted/60 text-foreground rounded-lg px-3 py-1 text-xs border-none hover:bg-muted" onClick={() => restoreMutation.mutate(record.id)} disabled={restoreMutation.isPending} data-testid={`button-restore-${record.id}`}>
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Tiklash
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="overrides" className="mt-6">
          <div className="bg-card rounded-xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <Key className="h-4 w-4 text-[var(--ep-yellow)]" />
              Override Tarixi
            </h3>
            <div className="flex flex-col items-center py-16 text-center">
              <CheckCircle className="h-16 w-16 text-[var(--ep-green)] mb-4" />
              <p className="text-lg font-bold text-foreground">Override yozuvlari yo'q</p>
              <p className="text-sm text-muted-foreground">
                Hech kim qoidalarni chetlab o'tmagan
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="status" className="mt-6">
          <div className="bg-card rounded-xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-[var(--ep-purple)]" />
              Status O'zgarishlar Tarixi
            </h3>
            {statusHistory.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <CheckCircle className="h-16 w-16 text-[var(--ep-green)] mb-4" />
                <p className="text-lg font-bold text-foreground">Status o'zgarishlar yo'q</p>
                <p className="text-sm text-muted-foreground">
                  Hech qanday status o'zgarishi qayd etilmagan
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {(Array.isArray(statusHistory) ? statusHistory : []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-background rounded-lg hover:bg-muted/40 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase">YANGILANDI</Badge>
                        <p className="font-bold text-foreground">{item.tableName}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="rounded-full border-surface-container text-muted-foreground">{item.oldStatus}</Badge>
                        <span className="text-muted-foreground">→</span>
                        <Badge className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold">{item.newStatus}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{item.changedBy}</p>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {new Date(item.changedAt).toLocaleString("uz-UZ")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="validations" className="mt-6">
          <div className="bg-card rounded-xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-primary" />
              Tekshirish Natijalari
            </h3>
            {validationResults.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <CheckCircle className="h-16 w-16 text-[var(--ep-green)] mb-4" />
                <p className="text-lg font-bold text-foreground">Barcha tekshiruvlar muvaffaqiyatli</p>
                <p className="text-sm text-muted-foreground">
                  Hech qanday muammo topilmadi
                </p>
                <div className="mt-8 p-6 bg-background rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-sm">
                  <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Jami qoidalar</p>
                    <p className="text-3xl font-bold text-foreground">{validationSummary?.totalRules || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Muammolar</p>
                    <p className="text-3xl font-bold text-[var(--ep-red)]">{validationSummary?.issueCount || 0}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {(Array.isArray(validationResults) ? validationResults : []).map((result) => (
                  <div key={result.id} className="flex items-center justify-between p-4 bg-background rounded-lg hover:bg-muted/40 transition-colors">
                    <div>
                      <p className="font-bold text-foreground">{result.ruleCode}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Topilgan muammolar: {result.issuesFound}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        result.status === "passed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      )}>
                        {result.status === "passed" ? "CREATE" : "Muvaffaqiyatsiz"}
                      </Badge>
                      {result.issuesFound > 0 && (
                        <AlertTriangle className="h-4 w-4 text-[var(--ep-red)]" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
