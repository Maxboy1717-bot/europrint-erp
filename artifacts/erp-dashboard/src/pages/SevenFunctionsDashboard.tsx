/**
 * @module SevenFunctionsDashboard
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Crown,
  Megaphone,
  DollarSign,
  Factory,
  ShieldCheck,
  Users,
  Settings,
  TrendingUp,
  Plus,
  BarChart3,
  Target,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { EPErrorState, EPStatusPill } from "@/components/ep";
interface FunctionKpi {
  id: string;
  functionId: string;
  kpiName: string;
  kpiNameUz?: string;
  targetValue: number;
  currentValue: number;
  unit?: string;
  createdAt?: string;
}

interface CompanyFunction {
  id: string;
  functionName: string;
  functionNameUz?: string;
  description?: string;
  descriptionUz?: string;
  iconType: "Crown" | "Megaphone" | "DollarSign" | "Factory" | "ShieldCheck" | "Users" | "Settings";
  color?: string;
  orderIndex: number;
  isActive: boolean;
  kpis?: FunctionKpi[];
}

const iconMap: Record<string, typeof Crown> = {
  Crown,
  Megaphone,
  DollarSign,
  Factory,
  ShieldCheck,
  Users,
  Settings,
};

const FunctionCardSkeleton = () => (
  <Card>
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <Skeleton className="h-6 w-12 rounded-lg" />
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className="h-4 w-full rounded-lg" />
      <Skeleton className="h-4 w-4/5 rounded-full" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-6 w-12 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </CardContent>
  </Card>
);

export default function SevenFunctionsDashboard() {
  const { t } = useTranslation("hr");
  const { toast } = useToast();
  const [selectedFunctionId, setSelectedFunctionId] = useState<string | null>(null);

  const { data: functions = [], isLoading: isLoadingFunctions, isError, refetch} = useQuery<CompanyFunction[]>({
    queryKey: ["/api/seven-functions/functions"],
  });

  const { data: selectedFunctionData, isLoading: isLoadingKpis } = useQuery<CompanyFunction | null>({
    queryKey: ["/api/seven-functions/functions", selectedFunctionId],
    enabled: !!selectedFunctionId,
  });

  const isLoading = isLoadingFunctions;
  const isLoadingDetails = isLoadingKpis && selectedFunctionId;

  const getIcon = (iconType: string) => {
    const IconComponent = iconMap[iconType];
    return IconComponent ? <IconComponent className="h-6 w-6" /> : <Target className="h-6 w-6" />;
  };

  const aiAnalysisMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/seven-functions/ai-analysis");
      return res.json();
    },
    onSuccess: (data: { summary?: string }) => {
      toast({
        title: "AI tahlil",
        description: data?.summary ?? "7 ta funksiya KPI tahlili tayyor",
      });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "AI tahlil amalga oshmadi", variant: "destructive" });
    },
  });

  if (isError) {
    return <EPErrorState onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <ModulePage
        module="hr"
        title={t("k7TaAsosiyFunksiyaVysotskiy")}
        icon={<BarChart3 className="h-5 w-5" />}
        actions={<Skeleton className="h-9 w-32 rounded-lg" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {([1, 2, 3, 4, 5, 6]).map((i) => (
            <FunctionCardSkeleton key={`k-${i}`} />
          ))}
        </div>
      </ModulePage>
    );
  }

  const selectedFunction = (Array.isArray(functions) ? functions : []).find((f) => f.id === selectedFunctionId);

  return (
    <ModulePage
      module="hr"
      title={t("k7TaAsosiyFunksiyaVysotskiy")}
      icon={<BarChart3 className="h-5 w-5" />}
      actions={
        <Button
          data-testid="button-ai-analysis"
          onClick={() => aiAnalysisMutation.mutate()}
          disabled={aiAnalysisMutation.isPending}
          variant="outline"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          AI tahlil
        </Button>
      }
    >
      {/* Functions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {functions.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {t("asosiyFunksiyalarMavjudEmas")}
            </p>
          </div>
        ) : (
          (Array.isArray(functions) ? functions : []).map((func) => {
            const kpiCount = func.kpis?.length || 0;
            const isSelected = selectedFunctionId === func.id;
            const bgColor = func.color || "bg-blue-50 dark:bg-blue-950";
            const borderColor = func.color ? func.color.replace("bg-", "border-") : "border-blue-200";

            return (
              <Card
                key={func.id}
                data-testid={`card-function-${func.id}`}
                className={`cursor-pointer transition-all hover-elevate ${
                  isSelected ? `border-2 ${borderColor}` : ""
                }`}
                onClick={() => setSelectedFunctionId(func.id)}
              >
                <CardHeader className={`pb-3 ${bgColor} rounded-t-lg`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 text-primary">
                        {getIcon(func.iconType)}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-[14px] font-semibold font-semibold">
                          {func.functionName}
                        </CardTitle>
                        {func.functionNameUz && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {func.functionNameUz}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {func.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {func.description}
                    </p>
                  )}
                  {func.descriptionUz && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {func.descriptionUz}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <EPStatusPill tone="neutral"
                      data-testid={`badge-kpi-count-${func.id}`}
                    >
                      {kpiCount} KPI
                    </EPStatusPill>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    data-testid={`button-details-${func.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFunctionId(func.id);
                    }}
                  >
                    {t("Batafsil")}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* KPI Detail Section */}
      {selectedFunctionId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              KPI-lar: {selectedFunction?.functionName}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFunctionId(null)}
              data-testid="button-close-details"
            >
              {t("close2")}
            </Button>
          </div>

          {isLoadingDetails ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {([1, 2, 3]).map((i) => (
                    <div key={`k-${i}`} className="space-y-2">
                      <Skeleton className="h-4 w-32 rounded-lg" />
                      <Skeleton className="h-2 w-full rounded-lg" />
                      <Skeleton className="h-4 w-24 rounded-lg" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : selectedFunction?.kpis && selectedFunction.kpis.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("kpiLarRoyxati")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {(Array.isArray(selectedFunction.kpis) ? selectedFunction.kpis : []).map((kpi) => {
                    const progress = Math.min(
                      (kpi.currentValue / kpi.targetValue) * 100,
                      100
                    );
                    return (
                      <div
                        key={kpi.id}
                        data-testid={`kpi-item-${kpi.id}`}
                        className="space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">
                              {kpi.kpiName}
                            </p>
                            {kpi.kpiNameUz && (
                              <p className="text-xs text-muted-foreground">
                                {kpi.kpiNameUz}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" data-testid={`badge-kpi-progress-${kpi.id}`}>
                            {progress.toFixed(0)}%
                          </Badge>
                        </div>

                        <Progress
                          value={progress}
                          className="h-2"
                          data-testid={`progress-${kpi.id}`}
                        />

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>
                            Hozirgi: {kpi.currentValue}
                            {kpi.unit && ` ${kpi.unit}`}
                          </span>
                          <span>
                            Maqsad: {kpi.targetValue}
                            {kpi.unit && ` ${kpi.unit}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {t("buFunksiyaUchunKpiLar")}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </ModulePage>
  );
}
