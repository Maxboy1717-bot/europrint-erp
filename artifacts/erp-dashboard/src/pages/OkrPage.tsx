/**
 * @module OkrPage
 * @description React page component. Route-level UI.
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Target, ChevronRight, ChevronDown, Building2 } from "lucide-react";
import { EPStatusPill, EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface Objective {
  id: number;
  title: string;
  description?: string;
  owner?: string;
  quarter: string;
  targetDate?: string;
  progress: number;
  status: string;
}

/** EP-DIR-016: OKR kaskad tugun — GET /api/okr/cascade dan keladi (flat, parent_goal_id bilan). */
interface CascadeNode {
  id: number;
  title: string;
  type: string | null;
  status: string | null;
  parent_goal_id: number | null;
  owner_card_id: number | null;
  department_id: number | null;
  key_result_count: number;
  child_count: number;
  progress: number;
}

interface CascadeTreeNode extends CascadeNode {
  children: CascadeTreeNode[];
}

/** Flat cascade rows → parent_goal_id asosida daraxt (kompaniya→bo'lim→karta). */
function buildCascadeTree(rows: CascadeNode[]): CascadeTreeNode[] {
  const byId = new Map<number, CascadeTreeNode>();
  for (const r of rows) byId.set(r.id, { ...r, children: [] });
  const roots: CascadeTreeNode[] = [];
  for (const r of rows) {
    const node = byId.get(r.id);
    if (!node) continue;
    if (r.parent_goal_id != null && byId.has(r.parent_goal_id)) {
      byId.get(r.parent_goal_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

/** EP-DIR-016: bitta kaskad tugun qatori — chekinish (indent) daraja bilan, yig'iladigan. */
function CascadeRow({
  node,
  depth,
  collapsed,
  onToggle,
}: {
  node: CascadeTreeNode;
  depth: number;
  collapsed: Set<number>;
  onToggle: (id: number) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isCollapsed = collapsed.has(node.id);
  return (
    <>
      <TableRow className="hover:bg-muted/40 transition-colors" data-testid={`row-cascade-${node.id}`}>
        <TableCell className="font-medium">
          <div className="flex items-center gap-1.5" style={{ paddingLeft: `${depth * 20}px` }}>
            {hasChildren ? (
              <button
                type="button"
                onClick={() => onToggle(node.id)}
                className="shrink-0 text-muted-foreground hover:text-foreground"
                data-testid={`button-toggle-${node.id}`}
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            ) : (
              <Building2 className="h-3.5 w-3.5 shrink-0 opacity-40" />
            )}
            <span>{node.title}</span>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline">{node.type ?? "—"}</Badge>
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {node.child_count > 0 ? node.child_count : "—"}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {node.key_result_count > 0 ? node.key_result_count : "—"}
        </TableCell>
        <TableCell className="min-w-[140px]">
          <div className="flex items-center gap-2">
            <Progress value={node.progress ?? 0} className="h-2 flex-1" />
            <span className="text-xs font-medium w-10 text-right">{node.progress ?? 0}%</span>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline">{node.status ?? "—"}</Badge>
        </TableCell>
      </TableRow>
      {!isCollapsed &&
        node.children.map((child) => (
          <CascadeRow key={child.id} node={child} depth={depth + 1} collapsed={collapsed} onToggle={onToggle} />
        ))}
    </>
  );
}

export default function OkrPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quarter, setQuarter] = useState("Q1");
  const [targetDate, setTargetDate] = useState("");

  const [isKRDialogOpen, setIsKRDialogOpen] = useState(false);
  const [krObjectiveId, setKrObjectiveId] = useState("");
  const [krTitle, setKrTitle] = useState("");
  const [krTargetValue, setKrTargetValue] = useState("");
  const [krUnit, setKrUnit] = useState("");

  const { data: objectives = [], isLoading } = useQuery<Objective[]>({
    queryKey: ["/api/okr/objectives"],
  });

  // EP-DIR-016: OKR kaskad daraxti (kompaniya→bo'lim→karta, rolled-up progress).
  const { data: cascadeRows = [], isLoading: isCascadeLoading } = useQuery<CascadeNode[]>({
    queryKey: ["/api/okr/cascade"],
  });
  const cascadeTree = useMemo(
    () => buildCascadeTree(Array.isArray(cascadeRows) ? cascadeRows : []),
    [cascadeRows],
  );
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const toggleCollapsed = (id: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const createMutation = useMutation({
    mutationFn: (data: { title: string; description: string; quarter: string; targetDate: string }) =>
      apiRequest("POST", "/api/okr/objectives", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/okr/objectives"] });
      toast({ title: "Maqsad muvaffaqiyatli qo'shildi" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Xatolik yuz berdi", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setIsDialogOpen(false);
    setTitle("");
    setDescription("");
    setQuarter("Q1");
    setTargetDate("");
  };

  const createKRMutation = useMutation({
    mutationFn: (data: { objective_id: number; title: string; target_value?: number; unit?: string }) =>
      apiRequest("POST", "/api/okr/key-results", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/okr/objectives"] });
      toast({ title: "Asosiy natija qo'shildi" });
      setIsKRDialogOpen(false);
      setKrObjectiveId(""); setKrTitle(""); setKrTargetValue(""); setKrUnit("");
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const handleSaveKR = () => {
    if (!krObjectiveId || !krTitle.trim()) {
      toast({ title: "Maqsad va sarlavhani kiriting", variant: "destructive" });
      return;
    }
    createKRMutation.mutate({
      objective_id: Number(krObjectiveId),
      title: krTitle.trim(),
      target_value: krTargetValue ? Number(krTargetValue) : undefined,
      unit: krUnit.trim() || undefined,
    });
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({ title: "Sarlavhani kiriting", variant: "destructive" });
      return;
    }
    createMutation.mutate({ title, description, quarter, targetDate });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "on_track":
        return <EPStatusPill tone="success">{t("rejalashtirilgan")}</EPStatusPill>;
      case "at_risk":
        return <Badge className="bg-amber-100 text-amber-800">{t("xavfli")}</Badge>;
      case "behind":
        return <EPStatusPill tone="danger">{t("orqada")}</EPStatusPill>;
      case "completed":
        return <EPStatusPill tone="info">{t("Bajarildi")}</EPStatusPill>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const list = Array.isArray(objectives) ? objectives : [];

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 space-y-6">
      <EPPageHeader
        title={t("okrMaqsadlarVaAsosiyNatijalar")}
        subtitle={`${list.length} ta maqsad`}
        actions={
          <>
            <Button variant="outline" onClick={() => setIsKRDialogOpen(true)} data-testid="button-add-key-result">
              <Plus className="h-4 w-4 mr-2" />
              {t("asosiyNatija", "Asosiy natija")}
            </Button>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t("yangiMaqsad")}
            </Button>
          </>
        }
      />

      <Tabs defaultValue="list" className="flex-1 flex flex-col min-h-0">
        <TabsList data-testid="tabs-okr-view">
          <TabsTrigger value="list" data-testid="tab-okr-list">{t("Ro'yxat", "Ro'yxat")}</TabsTrigger>
          <TabsTrigger value="cascade" data-testid="tab-okr-cascade">{t("okrKaskad", "Kaskad daraxti")}</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">{t("Yuklanmoqda...")}</div>
              ) : list.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Target className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>{t("hechQandayMaqsadTopilmadi")}</p>
                </div>
              ) : (
                <div className="ep-table-scroll"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("Maqsad")}</TableHead>
                      <TableHead>{t("masul")}</TableHead>
                      <TableHead>{t("chorak")}</TableHead>
                      <TableHead>{t("muddat")}</TableHead>
                      <TableHead>{t("progress5")}</TableHead>
                      <TableHead>{t("status28")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((obj) => (
                      <TableRow key={obj.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-medium max-w-xs">
                          <div>{obj.title}</div>
                          {obj.description && (
                            <div className="text-xs text-muted-foreground truncate">{obj.description}</div>
                          )}
                        </TableCell>
                        <TableCell>{obj.owner || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{obj.quarter}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {obj.targetDate ? new Date(obj.targetDate).toLocaleDateString("uz-UZ") : "—"}
                        </TableCell>
                        <TableCell className="min-w-[140px]">
                          <div className="flex items-center gap-2">
                            <Progress value={obj.progress ?? 0} className="h-2 flex-1" />
                            <span className="text-xs font-medium w-10 text-right">{obj.progress ?? 0}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(obj.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cascade" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {isCascadeLoading ? (
                <div className="p-8 text-center text-muted-foreground">{t("Yuklanmoqda...")}</div>
              ) : cascadeTree.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>{t("hechQandayMaqsadTopilmadi")}</p>
                </div>
              ) : (
                <div className="ep-table-scroll"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("Maqsad")}</TableHead>
                      <TableHead>{t("type", "Turi")}</TableHead>
                      <TableHead>{t("bolalar", "Bolalar")}</TableHead>
                      <TableHead>{t("asosiyNatija", "Asosiy natija")}</TableHead>
                      <TableHead>{t("progress5")}</TableHead>
                      <TableHead>{t("status28")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cascadeTree.map((root) => (
                      <CascadeRow key={root.id} node={root} depth={0} collapsed={collapsed} onToggle={toggleCollapsed} />
                    ))}
                  </TableBody>
                </Table></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isKRDialogOpen} onOpenChange={setIsKRDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("asosiyNatijaQoshish", "Asosiy natija qo'shish")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("Maqsad")}</Label>
              <Select value={krObjectiveId} onValueChange={setKrObjectiveId}>
                <SelectTrigger data-testid="select-kr-objective">
                  <SelectValue placeholder={t("maqsadTanlang", "Maqsad tanlang")} />
                </SelectTrigger>
                <SelectContent>
                  {list.map((obj) => (
                    <SelectItem key={obj.id} value={String(obj.id)}>{obj.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("progress.title")}</Label>
              <Input value={krTitle} onChange={(e) => setKrTitle(e.target.value)} placeholder={t("asosiyNatijaSarlavhasi", "Asosiy natija sarlavhasi")} data-testid="input-kr-title" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("targetValue", "Maqsad qiymati")}</Label>
                <Input type="number" value={krTargetValue} onChange={(e) => setKrTargetValue(e.target.value)} placeholder="100" />
              </div>
              <div>
                <Label>{t("unit", "Birlik")}</Label>
                <Input value={krUnit} onChange={(e) => setKrUnit(e.target.value)} placeholder="%" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsKRDialogOpen(false)}>{t("cancel")}</Button>
              <Button onClick={handleSaveKR} disabled={createKRMutation.isPending}>{t("Saqlash")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("yangiMaqsadQoshish")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("progress.title")}</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("maqsadSarlavhasi")} />
            </div>
            <div>
              <Label>{t("progress.description")}</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("batafsilTavsif")} rows={3} />
            </div>
            <div>
              <Label>{t("chorak")}</Label>
              <Select value={quarter} onValueChange={setQuarter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Q1">Q1</SelectItem>
                  <SelectItem value="Q2">Q2</SelectItem>
                  <SelectItem value="Q3">Q3</SelectItem>
                  <SelectItem value="Q4">Q4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("endDate")}</Label>
              <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm}>{t("cancel")}</Button>
              <Button onClick={handleSave} disabled={createMutation.isPending}>{t("Saqlash")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
