import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Settings,
  Camera,
  TrendingUp,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ErrorState } from "@/components/ui/error-state";
import { safeStorage } from '@/lib/safeStorage';
import type { OrgChartData } from "./org-chart/orgChartTypes";
import { OrgChartTreeNode } from "./org-chart/OrgChartTreeNode";
import { OrgChartSearchBar } from "./org-chart/OrgChartSearchBar";
import { buildIndex, searchTree } from "./org-chart/orgChartUtils";

const TreeSkeleton = () => (
  <Card>
    <CardContent className="p-6 space-y-3">
      {([1, 2, 3, 4, 5]).map((i) => (
        <div key={`k-${i}`} className="flex items-center gap-3" style={{ paddingLeft: `${(i % 3) * 24}px` }}>
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-12 ml-auto" />
        </div>
      ))}
    </CardContent>
  </Card>
);

export default function OrgChartPage() {
  const { toast } = useToast();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState<"" | "pdf" | "excel">("");
  const [query, setQuery] = useState<string>("");

  const { data, isLoading, isError, refetch} = useQuery<OrgChartData>({
    queryKey: ["/api/org-chart/tree"],
  });

  const tree = data?.tree ?? [];
  const stats = data?.stats;

  // ─── O(n) search index + match set ──────────────────────────────────────
  //
  // Memoize the index over the raw tree (only recomputes when data changes)
  // and the match set over query+index. Per-keystroke cost stays O(n).
  const index = useMemo(() => buildIndex(tree), [tree]);
  const { matched, expanded: ancestorIds } = useMemo(
    () => searchTree(index, query),
    [index, query],
  );

  // When a filter is active we auto-expand every ancestor of every match
  // (plus every match itself, so children remain reachable). User-toggled
  // expansions still apply on top.
  const effectiveExpanded = useMemo<Set<string>>(() => {
    if (query.trim().length === 0) return expandedIds;
    const merged = new Set<string>(expandedIds);
    ancestorIds.forEach(id => merged.add(id));
    matched.forEach(id => merged.add(id));
    return merged;
  }, [query, expandedIds, ancestorIds, matched]);

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

  const handleAIRecommendation = () => {
    toast({
      title: "AI tavsiya",
      description: "AI tavsiya tez orada ishga tushadi",
    });
  };

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <ModulePage
        module="hr"
        title="Tashkiliy Tuzilma"
        icon={<Building2 className="h-5 w-5" />}
        actions={<Skeleton className="h-9 w-32" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {([1, 2, 3]).map((i) => (
            <Card key={`k-${i}`}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
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
            onClick={() => {
              toast({ title: "Sozlamalar", description: "Sozlamalar sahifasi tez orada" });
            }}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            data-testid="button-snapshot"
            onClick={() => {
              toast({ title: "Snapshot", description: "Tuzilma rasmi yuklanmoqda..." });
            }}
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
            onClick={handleAIRecommendation}
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
          <OrgChartSearchBar
            value={query}
            onChange={setQuery}
            matchCount={matched.size}
          />
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
                <OrgChartTreeNode
                  key={node.id}
                  node={node}
                  expandedIds={effectiveExpanded}
                  matchedIds={matched}
                  onToggle={handleToggle}
                  query={query}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </ModulePage>
  );
}
