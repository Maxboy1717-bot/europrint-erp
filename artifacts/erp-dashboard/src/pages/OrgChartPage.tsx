/**
 * @module OrgChartPage
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
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Users,
  ChevronDown,
  ChevronRight,
  UserCircle,
  Settings,
  Camera,
  Download,
  TrendingUp,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { safeStorage } from '@/lib/safeStorage';
import { EPErrorState } from "@/components/ep";

interface OrgChartNode {
  id: string;
  name: string;
  vep?: string;
  employeeCount?: number;
  color?: string;
  icon?: string;
  children?: OrgChartNode[];
}

interface OrgChartData {
  tree: OrgChartNode[];
  stats?: {
    totalDepartments: number;
    totalEmployees: number;
    maxDepth: number;
  };
}

function TreeNode({
  node,
  expandedIds,
  onToggle,
  depth = 0,
}: {
  node: OrgChartNode;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  depth?: number;
}) {
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div data-testid={`tree-node-${node.id}`}>
      <div
        className="flex items-center gap-2 p-3 rounded-md cursor-pointer hover-elevate"
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
        onClick={() => onToggle(node.id)}
        data-testid={`tree-node-toggle-${node.id}`}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )
        ) : (
          <span className="w-4 shrink-0" />
        )}

        <div
          className="h-3 w-3 rounded-full shrink-0"
          style={{ backgroundColor: node.color || "hsl(var(--primary))" }}
        />

        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />

        <span className="font-medium text-sm flex-1" data-testid={`text-dept-name-${node.id}`}>
          {node.name}
        </span>

        {node.vep && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <UserCircle className="h-3 w-3" />
            <span data-testid={`text-vep-${node.id}`}>{node.vep}</span>
          </div>
        )}

        {node.employeeCount !== undefined && (
          <Badge variant="secondary" data-testid={`badge-employee-count-${node.id}`}>
            <Users className="h-3 w-3 mr-1" />
            {node.employeeCount}
          </Badge>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div data-testid={`tree-children-${node.id}`}>
          {node.children?.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              expandedIds={expandedIds}
              onToggle={onToggle}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const TreeSkeleton = () => (
  <Card>
    <CardContent className="p-6 space-y-3">
      {([1, 2, 3, 4, 5]).map((i) => (
        <div key={`k-${i}`} className="flex items-center gap-3" style={{ paddingLeft: `${(i % 3) * 24}px` }}>
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-32 rounded-lg" />
          <Skeleton className="h-5 w-12 ml-auto rounded-lg" />
        </div>
      ))}
    </CardContent>
  </Card>
);

export default function OrgChartPage() {
  const { t } = useTranslation("hr");
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState<"" | "pdf" | "excel">("");

  const { data, isLoading, isError, refetch} = useQuery<OrgChartData>({
    queryKey: ["/api/org-chart/tree"],
  });

  const tree = data?.tree || [];
  const stats = data?.stats;

  const handleToggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExport = async (format: "pdf" | "excel") => {
    setExporting(format);
    try {
      const endpoint = format === "pdf"
        ? "/api/org-structure/export/pdf"
        : "/api/org-structure/export/excel";
      const token = safeStorage.getItem("access_token");
      const res = await fetch(endpoint, { credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `org-structure-${new Date().toISOString().slice(0, 10)}.${format === "pdf" ? "pdf" : "xlsx"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: format === "pdf" ? "PDF yuklandi" : "Excel yuklandi", description: "Fayl muvaffaqiyatli yuklandi" });
    } catch {
      toast({ title: "Xatolik", description: "Eksport amalga oshmadi", variant: "destructive" });
    } finally {
      setExporting("");
    }
  };

  const aiRecommendationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/org-chart/ai-recommendations");
      return res.json();
    },
    onSuccess: (data: { summary?: string }) => {
      toast({
        title: "AI tavsiya",
        description: data?.summary ?? "Tashkiliy tuzilma tahlili tayyor",
      });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "AI tavsiya olishda xatolik", variant: "destructive" });
    },
  });

  const handleSnapshot = async () => {
    try {
      const token = safeStorage.getItem("access_token");
      const res = await fetch("/api/org-structure/export/png", {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Snapshot failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `org-structure-${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Snapshot yuklandi", description: "Tuzilma rasmi yuklandi" });
    } catch {
      toast({ title: "Xatolik", description: "Snapshot amalga oshmadi", variant: "destructive" });
    }
  };

  if (isError) {
    return <EPErrorState onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <ModulePage
        module="hr"
        title="Tashkiliy Tuzilma"
        icon={<Building2 className="h-5 w-5" />}
        actions={<Skeleton className="h-9 w-32 rounded-lg" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {([1, 2, 3]).map((i) => (
            <Card key={`k-${i}`}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2 rounded-lg" />
                <Skeleton className="h-8 w-16 rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
        <TreeSkeleton />
      </ModulePage>
    );
  }

  return (
    <ModulePage
      module="hr"
      title="Tashkiliy Tuzilma"
      icon={<Building2 className="h-5 w-5" />}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="icon"
            data-testid="button-settings"
            onClick={() => navigate("/hr/org-departments")}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            data-testid="button-snapshot"
            onClick={handleSnapshot}
          >
            <Camera className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            data-testid="button-export-excel"
            onClick={() => handleExport("excel")}
            disabled={exporting === "excel"}
          >
            <FileSpreadsheet className="h-4 w-4 mr-1.5" />
            {exporting === "excel" ? "Yuklanmoqda..." : "Excel"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            data-testid="button-export-pdf"
            onClick={() => handleExport("pdf")}
            disabled={exporting === "pdf"}
          >
            <FileText className="h-4 w-4 mr-1.5" />
            {exporting === "pdf" ? "Yuklanmoqda..." : "PDF"}
          </Button>
          <Button
            data-testid="button-ai-recommendation"
            onClick={() => aiRecommendationMutation.mutate()}
            disabled={aiRecommendationMutation.isPending}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            AI tavsiya
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Jami bo'limlar</p>
            <p className="text-2xl font-bold" data-testid="text-total-departments">
              {stats?.totalDepartments || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Jami xodimlar</p>
            <p className="text-2xl font-bold" data-testid="text-total-employees">
              {stats?.totalEmployees || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Maksimal chuqurlik</p>
            <p className="text-2xl font-bold" data-testid="text-max-depth">
              {stats?.maxDepth || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Bo'limlar daraxti
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tree.length === 0 ? (
            <div className="text-center py-12" data-testid="empty-state">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Tashkiliy tuzilma mavjud emas
              </p>
            </div>
          ) : (
            <div data-testid="org-tree">
              {(Array.isArray(tree) ? tree : []).map((node) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  expandedIds={expandedIds}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </ModulePage>
  );
}
