import { useLocation } from "wouter";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Building2, Users, Network, ChevronRight,
  UserX, Pencil, Trash2, CheckCircle, AlertCircle,
  MoveRight, History, FolderOpen, ClipboardList
} from "lucide-react";
import { OrgNodePortretTab } from "./OrgNodePortretTab";

// Sub-components
import { EditDialog } from "@/components/hr/orgnode/EditDialog";
import { MoveDialog } from "@/components/hr/orgnode/MoveDialog";
import { MainTab } from "@/components/hr/orgnode/MainTab";
import { EmployeesTab } from "@/components/hr/orgnode/EmployeesTab";
import { ChildrenTab } from "@/components/hr/orgnode/ChildrenTab";
import { FolderTab } from "@/components/hr/orgnode/FolderTab";
import { HistoryTab } from "@/components/hr/orgnode/HistoryTab";
import { StatsTab, VacantTab } from "@/components/hr/orgnode/ExtraTabs";
import { useOrgNodeData } from "@/components/hr/orgnode/useOrgNodeData";
import { NODE_TYPE_LABELS, LEVEL_COLORS } from "@/components/hr/orgnode/types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function OrgNodeDetail() {
  const { nodeId, node, isLoading, isError, deleteMutation, onRefresh, navigate } = useOrgNodeData();
  const [tab, setTab] = useState("main");
  const [editOpen, setEditOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ff5d2e]" />
      </div>
    );
  }

  if (isError || !node) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Node topilmadi</p>
        <Button variant="outline" onClick={() => navigate("/org-structure/hierarchy")}>
          <ArrowLeft className="h-4 w-4 mr-1" />Ortga
        </Button>
      </div>
    );
  }

  const headerBg = node.color || LEVEL_COLORS[node.hierarchyLevel] || "#1d4ed8";
  const isVacant = !node.headUserName;

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-3 border-b flex items-center gap-1 text-sm text-muted-foreground shrink-0 flex-wrap">
        <button className="hover:text-foreground transition-colors flex items-center gap-1" onClick={() => navigate("/org-structure/hierarchy")}>
          <Network className="h-3.5 w-3.5" />Tashkiliy Tuzilma
        </button>
        {node.parentId && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <button className="hover:text-foreground transition-colors truncate max-w-[160px]" onClick={() => navigate(`/org-structure/hierarchy/node/${node.parentId}`)} title={node.parentName || `#${node.parentId}`}>
              {node.parentName || `#${node.parentId}`}
            </button>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium truncate max-w-xs">{node.name}</span>
      </div>

      <div className="px-6 py-5 shrink-0" style={{ background: `linear-gradient(135deg, ${headerBg}dd, ${headerBg}99)` }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge style={{ background: "rgba(255,255,255,0.25)", color: "white", border: "none" }}>{NODE_TYPE_LABELS[node.nodeType] || node.nodeType}</Badge>
              <span className="text-white/60 text-xs">#{node.id} · Daraja {node.hierarchyLevel}</span>
              {!node.isActive && <Badge variant="destructive" className="text-xs">Nofaol</Badge>}
              {isVacant && <Badge className="text-xs bg-red-500/30 text-white border-none flex items-center gap-1"><UserX className="h-3 w-3" />Vakant</Badge>}
            </div>
            <h1 className="text-2xl font-bold">{node.name}</h1>
            {node.nameRu && <p className="text-white/70 text-sm mt-0.5">{node.nameRu}</p>}
            {node.tskp && <p className="text-white/80 text-sm mt-2 max-w-lg italic">"{node.tskp}"</p>}
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)} data-testid="button-edit-node"><Pencil className="h-3.5 w-3.5 mr-1" />Tahrirlash</Button>
            <Button size="sm" style={{ background: "#ff5d2e", color: "white" }} className="hover:opacity-90" onClick={() => setMoveOpen(true)} data-testid="button-move-node"><MoveRight className="h-3.5 w-3.5 mr-1" />Ko'chirish</Button>
            <Button size="sm" variant="destructive" onClick={() => setDeleteConfirmOpen(true)} disabled={deleteMutation.isPending} data-testid="button-delete-node"><Trash2 className="h-3.5 w-3.5 mr-1" />O'chirish</Button>
            <Button size="sm" variant="ghost" className="text-white hover:text-white hover:bg-white/20" onClick={() => navigate("/org-structure/hierarchy")}><ArrowLeft className="h-3.5 w-3.5 mr-1" />Ortga</Button>
          </div>
        </div>
        <div className="flex gap-5 mt-4 flex-wrap">
          {([
            { icon: <Users className="h-4 w-4" />, label: "Xodimlar", value: node.employeeCount },
            { icon: <Building2 className="h-4 w-4" />, label: "Farzandlar", value: node.childCount },
            { icon: isVacant ? <UserX className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />, label: "Rahbar", value: node.headUserName || "Vakant" },
          ]).map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-white/90">
              {s.icon}
              <div><div className="text-xs text-white/60">{s.label}</div><div className="text-sm font-semibold">{s.value}</div></div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4 flex-wrap h-auto gap-1">
            <TabsTrigger value="main">Asosiy</TabsTrigger>
            <TabsTrigger value="employees">Xodimlar ({node.employeeCount})</TabsTrigger>
            <TabsTrigger value="children">Farzandlar ({node.childCount})</TabsTrigger>
            <TabsTrigger value="vacant">Vakant</TabsTrigger>
            <TabsTrigger value="folder" className="flex items-center gap-1"><FolderOpen className="h-3.5 w-3.5" />Papka</TabsTrigger>
            <TabsTrigger value="stats">Statistika</TabsTrigger>
            <TabsTrigger value="portret" className="flex items-center gap-1"><ClipboardList className="h-3.5 w-3.5" />Portret</TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1"><History className="h-3.5 w-3.5" />Tarix</TabsTrigger>
          </TabsList>

          <TabsContent value="main"><MainTab node={node} /></TabsContent>
          <TabsContent value="employees"><EmployeesTab node={node} /></TabsContent>
          <TabsContent value="children"><ChildrenTab node={node} /></TabsContent>
          <TabsContent value="vacant"><VacantTab node={node} /></TabsContent>
          <TabsContent value="folder"><FolderTab nodeId={nodeId!} /></TabsContent>
          <TabsContent value="stats"><StatsTab node={node} /></TabsContent>
          <TabsContent value="portret"><OrgNodePortretTab nodeId={node.id} nodeName={node.name} /></TabsContent>
          <TabsContent value="history"><HistoryTab nodeId={nodeId!} /></TabsContent>
        </Tabs>
      </div>

      {editOpen && <EditDialog node={node} open={editOpen} onClose={() => setEditOpen(false)} onSuccess={onRefresh} />}
      {moveOpen && <MoveDialog node={node} open={moveOpen} onClose={() => setMoveOpen(false)} onSuccess={onRefresh} />}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Bo'limni o'chirish"
        description={`"${node.name}" bo'limini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi.`}
        confirmText="O'chirish"
        variant="destructive"
        onConfirm={() => { deleteMutation.mutate(); setDeleteConfirmOpen(false); }}
      />
    </div>
  );
}
