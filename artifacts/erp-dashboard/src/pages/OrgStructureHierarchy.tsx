/**
 * @module OrgStructureHierarchy
 * @description React page component. Route-level UI.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Building2, Users, ZoomIn, ZoomOut, RotateCcw, Move,
  Plus, Search, Bell, UserX,
  TrendingUp, AlertCircle, Network, X, Filter, Maximize2,
  FileText, CheckSquare, Square,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { OrgNode, OrgStats, LEVEL_COLORS, LEVEL_LABELS } from "@/components/hr/org/types";
import { countNodes } from "@/components/hr/org/helpers";
import { KpiCard } from "@/components/hr/org/KpiCard";
import { AddNodeDialog } from "@/components/hr/org/AddNodeDialog";
import { TreeCanvas } from "@/components/hr/org/TreeCanvas";
import { EPErrorState, EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function OrgStructureHierarchy() {
  const { t } = useTranslation("common");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [scale, setScale] = useState(0.85);
  const [position, setPosition] = useState({ x: 40, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "vacant" | "filled">("all");
  const [filterLevels, setFilterLevels] = useState<Set<number>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [addParentId, setAddParentId] = useState<string | undefined>(undefined);

  const { data: stats } = useQuery<OrgStats>({ queryKey: ["/api/org-structure/stats"] });
  const { data: hierarchyData, isLoading, isError, error, refetch } = useQuery<{ nodes: OrgNode[] }>({
    queryKey: ["/api/org-structure/hierarchy"],
  });

  const notifyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/org-departments/notify-vacancies") as unknown as Response;
      return res.json() as Promise<{ message?: string }>;
    },
    onSuccess: (d) => toast({ title: d.message || "Xabar yuborildi" }),
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const moveMutation = useMutation({
    mutationFn: ({ nodeId, newParentId }: { nodeId: number; newParentId: number }) =>
      apiRequest("PATCH", `/api/org-structure/nodes/${nodeId}/move`, { newParentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-structure/hierarchy"] });
      queryClient.invalidateQueries({ queryKey: ["/api/org-structure/stats"] });
      toast({ title: "Bo'lim ko'chirildi", description: "Tashkiliy tuzilma yangilandi" });
    },
    onError: () => toast({ title: "Ko'chirishda xatolik", variant: "destructive" }),
  });

  const handleZoomIn = useCallback(() => setScale((s) => Math.min(3, s * 1.2)), []);
  const handleZoomOut = useCallback(() => setScale((s) => Math.max(0.1, s / 1.2)), []);
  const handleReset = useCallback(() => { setScale(0.85); setPosition({ x: 40, y: 20 }); }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setScale((s) => Math.max(0.1, s * (e.deltaY > 0 ? 0.9 : 1.1)));
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { setIsDragging(true); setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y }); }
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleFitToScreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const cw = el.clientWidth;
    setScale(0.6);
    setPosition({ x: Math.max(20, (cw - 800) / 2), y: 20 });
  }, []);

  const [exporting, setExporting] = useState<"" | "pdf" | "excel">("");

  const handleExport = useCallback(async (format: "pdf" | "excel") => {
    setExporting(format);
    try {
      const endpoint = format === "pdf" ? "/api/org-structure/export/pdf" : "/api/org-structure/export/excel";
      // NOTE: Binary blob download (PDF/Excel) — keep raw fetch; apiRequest unwraps JSON envelopes.
      // Auth via httpOnly cookie sent with credentials: 'include'.
      const res = await fetch(endpoint, { credentials: "include" });
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
  }, [toast]);

  const toggleLevel = useCallback((lvl: number) => {
    setFilterLevels((prev) => {
      const next = new Set(prev);
      if (next.has(lvl)) next.delete(lvl); else next.add(lvl);
      return next;
    });
  }, []);

  function filterTree(nodes: OrgNode[], query: string): OrgNode[] {
    const q = query.toLowerCase();
    return (Array.isArray(nodes) ? nodes : []).map((n) => {
      const filteredChildren = filterTree(n.children || [], query);
      const matchesSearch = !q || n.name.toLowerCase().includes(q) || (n.nameRu || "").toLowerCase().includes(q) || (n.headUserName || "").toLowerCase().includes(q);
      const matchesStatus = filterStatus === "all" || (filterStatus === "vacant" && !n.headUserName) || (filterStatus === "filled" && !!n.headUserName);
      const matchesLevel = filterLevels.size === 0 || filterLevels.has(n.hierarchyLevel ?? 0);
      if ((matchesSearch && matchesStatus && matchesLevel) || filteredChildren.length > 0) {
        return { ...n, children: filteredChildren };
      }
      return null;
    }).filter(Boolean) as OrgNode[];
  }

  const allNodes = hierarchyData?.nodes || [];
  const hasFilter = !!(search || filterStatus !== "all" || filterLevels.size > 0);
  const filteredNodes = hasFilter ? filterTree(allNodes, search) : allNodes;
  const totalFiltered = countNodes(filteredNodes);

  const handleAddChild = useCallback((parentId: string) => {
    setAddParentId(parentId);
    setAddOpen(true);
  }, []);

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="px-6 py-3 border-b shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              {t("tashkiliyTuzilma1")}
            </h1>
            <p className="text-xs text-muted-foreground">{t("ierarxikKorinishBarchaBolimlarVa")}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => handleExport("excel")} disabled={exporting === "excel"}>
              <FileText className="h-3.5 w-3.5 mr-1" />{exporting === "excel" ? "..." : "Excel"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExport("pdf")} disabled={exporting === "pdf"}>
              <FileText className="h-3.5 w-3.5 mr-1" />{exporting === "pdf" ? "..." : "PDF"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => notifyMutation.mutate()} disabled={notifyMutation.isPending}>
              <Bell className="h-3.5 w-3.5 mr-1" />{t("vakantlar")}
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => { setAddParentId(undefined); setAddOpen(true); }}>
              <Plus className="h-3.5 w-3.5 mr-1" />{t("bolimQoshish")}
            </Button>
          </div>
        </div>

        <div className="flex gap-2 mt-3 flex-wrap">
          <KpiCard icon={<Building2 className="h-4 w-4" />} label={t("jamiBolimlar")} value={stats?.totalDepartments ?? "—"} color="#1d4ed8" />
          <KpiCard icon={<Network className="h-4 w-4" />} label={t("jamiNodes")} value={stats?.totalNodes ?? "—"} color="#7c3aed" />
          <KpiCard icon={<Users className="h-4 w-4" />} label={t("xodimlar")} value={stats?.totalEmployees ?? "—"} color="#16a34a" />
          <KpiCard icon={<UserX className="h-4 w-4" />} label={t("vakant")} value={stats?.vacantCount ?? "—"} sub={stats ? `${stats.vacantPercent}% bo'sh` : undefined} color="#dc2626" />
          <KpiCard icon={<TrendingUp className="h-4 w-4" />} label={t("k30KunOzgarish")} value={stats?.recentChanges ?? "—"} color="#b45309" />
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input className="pl-8 h-9 text-sm" placeholder={t("qidirishIsmRahbar")} value={search} onChange={(e) => setSearch(e.target.value)} />
            {search && <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setSearch("")}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}
          </div>

          {hasFilter && <EPStatusPill tone="neutral" className="text-xs h-8 px-2">{totalFiltered} ta topildi</EPStatusPill>}

          <div className="flex items-center gap-1 border rounded-md px-2 h-8">
            <Filter className="h-3 w-3 text-muted-foreground mr-1" />
            {([0, 1, 2, 3, 4]).map((lvl) => {
              const checked = filterLevels.has(lvl);
              return (
                <button key={lvl} className="flex items-center gap-0.5 text-[10px] px-1 rounded hover:bg-muted transition-colors" onClick={() => toggleLevel(lvl)} style={{ color: checked ? LEVEL_COLORS[lvl] : undefined }}>
                  {checked ? <CheckSquare className="h-3 w-3" style={{ color: LEVEL_COLORS[lvl] }} /> : <Square className="h-3 w-3 text-muted-foreground" />}
                  <span>{lvl}</span>
                </button>
              );
            })}
            {filterLevels.size > 0 && <button onClick={() => setFilterLevels(new Set())} className="ml-1"><X className="h-3 w-3 text-muted-foreground" /></button>}
          </div>

          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as "all" | "vacant" | "filled")}>
            <SelectTrigger className="h-9 w-28 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("Barchasi")}</SelectItem>
              <SelectItem value="vacant">{t("vakant")}</SelectItem>
              <SelectItem value="filled">{t("band")}</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-0.5 bg-muted rounded-md px-1 ml-auto">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut}><ZoomOut className="h-3.5 w-3.5" /></Button>
            <span className="text-xs font-medium w-10 text-center">{Math.round(scale * 100)}%</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn}><ZoomIn className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleFitToScreen}><Maximize2 className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleReset}><RotateCcw className="h-3.5 w-3.5" /></Button>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground"><Move className="h-3 w-3" /><span>{t("suring")}</span></div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-hidden bg-muted/10 cursor-grab active:cursor-grabbing"
        style={{ backgroundImage: "radial-gradient(circle, #33333315 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
      >
        {isLoading && <div className="flex items-center justify-center h-full"><div className="text-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3" /><p className="text-sm text-muted-foreground">{t("Yuklanmoqda...")}</p></div></div>}
        {isError && <div className="flex items-center justify-center h-full"><EPErrorState onRetry={refetch}  error={error} /></div>}
        {!isLoading && !isError && filteredNodes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <AlertCircle className="h-12 w-12 text-muted-foreground opacity-40" />
            <p className="text-muted-foreground">{t("hechNarsaTopilmadi")}</p>
            {hasFilter && <Button variant="outline" size="sm" onClick={() => { setSearch(""); setFilterStatus("all"); setFilterLevels(new Set()); }}>{t("filtrlarniTozalash")}</Button>}
          </div>
        )}
        {!isLoading && !isError && filteredNodes.length > 0 && (
          <div style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transformOrigin: "0 0", transition: isDragging ? "none" : "transform 0.08s ease-out", display: "inline-block", padding: 16 }}>
            <TreeCanvas
              roots={filteredNodes}
              onNodeClick={(id) => navigate(`/org-structure/hierarchy/node/${id}`)}
              onAddChild={handleAddChild}
              onMoveNode={moveMutation.mutate}
            />
          </div>
        )}
      </div>

      <div className="border-t px-6 py-1.5 flex items-center gap-4 bg-background shrink-0">
        {Object.entries(LEVEL_LABELS).map(([lvl, label]) => (
          <div key={lvl} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: LEVEL_COLORS[Number(lvl)] }} />
            {label}
          </div>
        ))}
      </div>

      <AddNodeDialog
        open={addOpen}
        onClose={() => { setAddOpen(false); setAddParentId(undefined); }}
        initialParentId={addParentId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/org-structure/hierarchy"] });
          queryClient.invalidateQueries({ queryKey: ["/api/org-structure/stats"] });
        }}
      />
    </div>
  );
}
